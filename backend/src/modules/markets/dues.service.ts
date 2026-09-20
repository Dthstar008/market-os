import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DuesInvoice, DuesInvoiceStatus, MarketMembership, MembershipStatus } from '../../entities';
import { MarketsService } from './markets.service';
import { LeviesService } from './levies.service';
import { MembershipsService } from './memberships.service';
import { GenerateDuesDto } from './dto/generate-dues.dto';
import { PayDuesDto } from './dto/pay-dues.dto';

@Injectable()
export class DuesService {
  constructor(
    @InjectRepository(DuesInvoice) private readonly invoices: Repository<DuesInvoice>,
    @InjectRepository(MarketMembership) private readonly memberships: Repository<MarketMembership>,
    private readonly marketsService: MarketsService,
    private readonly leviesService: LeviesService,
    private readonly membershipsService: MembershipsService,
  ) {}

  /** Creates one pending invoice per active membership for this levy+period, skipping any that already exist. */
  async generate(marketId: string, userId: string, dto: GenerateDuesDto): Promise<{ created: number; skipped: number }> {
    await this.marketsService.assertAdmin(marketId, userId);
    const levy = await this.leviesService.findById(marketId, dto.levyId);

    const activeMemberships = await this.memberships.find({
      where: { marketId, status: MembershipStatus.ACTIVE },
    });
    if (activeMemberships.length === 0) return { created: 0, skipped: 0 };

    const existing = await this.invoices.find({
      where: {
        levyId: levy.id,
        period: dto.period,
        membershipId: In(activeMemberships.map((m) => m.id)),
      },
    });
    const alreadyInvoiced = new Set(existing.map((i) => i.membershipId));

    const toCreate = activeMemberships
      .filter((m) => !alreadyInvoiced.has(m.id))
      .map((m) =>
        this.invoices.create({
          marketId,
          membershipId: m.id,
          levyId: levy.id,
          period: dto.period,
          amount: levy.amount,
          dueDate: dto.dueDate,
        }),
      );

    if (toCreate.length > 0) await this.invoices.save(toCreate);
    return { created: toCreate.length, skipped: activeMemberships.length - toCreate.length };
  }

  async listAll(marketId: string, userId: string): Promise<DuesInvoice[]> {
    await this.marketsService.assertAdmin(marketId, userId);
    return this.invoices.find({
      where: { marketId },
      relations: ['membership', 'membership.trader', 'levy'],
      order: { createdAt: 'DESC' },
    });
  }

  async listMine(marketId: string, traderId: string): Promise<DuesInvoice[]> {
    const membership = await this.membershipsService.findMine(marketId, traderId);
    return this.invoices.find({
      where: { membershipId: membership.id },
      relations: ['levy'],
      order: { createdAt: 'DESC' },
    });
  }

  async pay(marketId: string, invoiceId: string, traderId: string, dto: PayDuesDto): Promise<DuesInvoice> {
    const invoice = await this.invoices.findOne({
      where: { id: invoiceId, marketId },
      relations: ['membership'],
    });
    if (!invoice) throw new NotFoundException('Dues invoice not found');
    if (invoice.membership.traderId !== traderId) {
      throw new ForbiddenException('This invoice does not belong to your trader profile');
    }

    invoice.status = DuesInvoiceStatus.PAID;
    invoice.paidAt = new Date();
    invoice.paymentNote = dto.note;
    return this.invoices.save(invoice);
  }
}
