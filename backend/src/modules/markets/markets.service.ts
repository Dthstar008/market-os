import { randomBytes } from 'crypto';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Market, MarketAdmin, MarketMembership, MembershipStatus } from '../../entities';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';

function generateInviteCode(): string {
  return randomBytes(5).toString('hex').toUpperCase();
}

@Injectable()
export class MarketsService {
  constructor(
    @InjectRepository(Market) private readonly markets: Repository<Market>,
    @InjectRepository(MarketAdmin) private readonly marketAdmins: Repository<MarketAdmin>,
    @InjectRepository(MarketMembership) private readonly memberships: Repository<MarketMembership>,
  ) {}

  async create(userId: string, dto: CreateMarketDto): Promise<Market> {
    // Extremely unlikely to collide, but retry rather than fail the whole create on a unique clash.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.markets.save(
          this.markets.create({ ...dto, adminUserId: userId, adminInviteCode: generateInviteCode() }),
        );
      } catch (err) {
        if (attempt === 4) throw err;
      }
    }
    throw new ConflictException('Could not generate a unique invite code — please try again');
  }

  async findMine(userId: string): Promise<Market[]> {
    const coAdminRows = await this.marketAdmins.find({ where: { userId } });
    const coAdminMarketIds = coAdminRows.map((row) => row.marketId);

    const primary = await this.markets.find({ where: { adminUserId: userId } });
    const coAdministered = coAdminMarketIds.length
      ? await this.markets.find({ where: { id: In(coAdminMarketIds) } })
      : [];

    const byId = new Map(primary.map((m) => [m.id, m]));
    for (const market of coAdministered) byId.set(market.id, market);
    return Array.from(byId.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findById(marketId: string): Promise<Market> {
    const market = await this.markets.findOne({ where: { id: marketId } });
    if (!market) throw new NotFoundException('Market not found');
    return market;
  }

  private async isAdmin(market: Market, userId: string): Promise<boolean> {
    if (market.adminUserId === userId) return true;
    const coAdmin = await this.marketAdmins.findOne({ where: { marketId: market.id, userId } });
    return !!coAdmin;
  }

  /** Throws unless the given user administers this market (primary admin or co-admin). Used by every admin-only action across the markets module. */
  async assertAdmin(marketId: string, userId: string): Promise<Market> {
    const market = await this.findById(marketId);
    if (!(await this.isAdmin(market, userId))) {
      throw new ForbiddenException('Only a market administrator can do this');
    }
    return market;
  }

  /** Allows a market administrator (primary or co-admin) or a trader with an active membership. */
  async assertAccess(marketId: string, userId: string, traderId?: string): Promise<Market> {
    const market = await this.findById(marketId);
    if (await this.isAdmin(market, userId)) return market;
    if (traderId) {
      const membership = await this.memberships.findOne({
        where: { marketId, traderId, status: MembershipStatus.ACTIVE },
      });
      if (membership) return market;
    }
    throw new ForbiddenException('You do not have access to this market');
  }

  async update(marketId: string, userId: string, dto: UpdateMarketDto): Promise<Market> {
    const market = await this.assertAdmin(marketId, userId);
    Object.assign(market, dto);
    return this.markets.save(market);
  }

  /** Redeems a market's invite code to become a co-admin. Idempotent if already an admin. */
  async joinAsAdmin(userId: string, code: string): Promise<Market> {
    const market = await this.markets.findOne({ where: { adminInviteCode: code.trim().toUpperCase() } });
    if (!market) throw new NotFoundException('No market matches that invite code');

    if (await this.isAdmin(market, userId)) return market;

    await this.marketAdmins.save(this.marketAdmins.create({ marketId: market.id, userId }));
    return market;
  }

  async getInviteCode(marketId: string, userId: string): Promise<string> {
    const market = await this.assertAdmin(marketId, userId);
    return market.adminInviteCode;
  }
}
