import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trader, MarketMembership } from '../../entities';
import { MarketsService } from './markets.service';
import { AddMembershipDto } from './dto/add-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(MarketMembership) private readonly memberships: Repository<MarketMembership>,
    @InjectRepository(Trader) private readonly traders: Repository<Trader>,
    private readonly marketsService: MarketsService,
  ) {}

  async add(marketId: string, userId: string, dto: AddMembershipDto): Promise<MarketMembership> {
    await this.marketsService.assertAdmin(marketId, userId);

    const trader = await this.traders.findOne({ where: { id: dto.traderId } });
    if (!trader) throw new NotFoundException('Trader not found');

    const existing = await this.memberships.findOne({ where: { marketId, traderId: dto.traderId } });
    if (existing) throw new ConflictException('This trader is already a member of the market');

    return this.memberships.save(this.memberships.create({ ...dto, marketId }));
  }

  async list(marketId: string, userId: string): Promise<MarketMembership[]> {
    await this.marketsService.assertAdmin(marketId, userId);
    return this.memberships.find({ where: { marketId }, relations: ['trader'], order: { joinedAt: 'DESC' } });
  }

  async update(marketId: string, membershipId: string, userId: string, dto: UpdateMembershipDto): Promise<MarketMembership> {
    await this.marketsService.assertAdmin(marketId, userId);
    const membership = await this.memberships.findOne({ where: { id: membershipId, marketId } });
    if (!membership) throw new NotFoundException('Membership not found');
    Object.assign(membership, dto);
    return this.memberships.save(membership);
  }

  async findMine(marketId: string, traderId: string): Promise<MarketMembership> {
    const membership = await this.memberships.findOne({ where: { marketId, traderId } });
    if (!membership) throw new NotFoundException('This trader is not a member of this market');
    return membership;
  }

  /** All markets this trader belongs to — lets a trader-facing client discover its own memberships without already knowing a marketId. */
  findAllForTrader(traderId: string): Promise<MarketMembership[]> {
    return this.memberships.find({ where: { traderId }, relations: ['market'], order: { joinedAt: 'DESC' } });
  }
}
