import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DuesInvoice, DuesInvoiceStatus, MarketExpense, MarketMembership, MembershipStatus } from '../../entities';
import { MarketsService } from './markets.service';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(DuesInvoice) private readonly invoices: Repository<DuesInvoice>,
    @InjectRepository(MarketExpense) private readonly expenses: Repository<MarketExpense>,
    @InjectRepository(MarketMembership) private readonly memberships: Repository<MarketMembership>,
    private readonly marketsService: MarketsService,
  ) {}

  async summary(marketId: string, userId: string) {
    await this.marketsService.assertAdmin(marketId, userId);

    const [invoices, expenses, memberCount] = await Promise.all([
      this.invoices.find({ where: { marketId }, relations: ['levy'] }),
      this.expenses.find({ where: { marketId } }),
      this.memberships.count({ where: { marketId, status: MembershipStatus.ACTIVE } }),
    ]);

    const paid = invoices.filter((i) => i.status === DuesInvoiceStatus.PAID);
    const outstanding = invoices.filter(
      (i) => i.status === DuesInvoiceStatus.PENDING || i.status === DuesInvoiceStatus.OVERDUE,
    );

    const collected = paid.reduce((sum, i) => sum + i.amount, 0);
    const outstandingAmount = outstanding.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const incomeByLevy = new Map<string, { levyId: string; name: string; collected: number }>();
    for (const invoice of paid) {
      const key = invoice.levyId;
      const entry = incomeByLevy.get(key) ?? { levyId: key, name: invoice.levy.name, collected: 0 };
      entry.collected += invoice.amount;
      incomeByLevy.set(key, entry);
    }

    const expensesByCategory = new Map<string, number>();
    for (const expense of expenses) {
      expensesByCategory.set(expense.category, (expensesByCategory.get(expense.category) ?? 0) + expense.amount);
    }

    return {
      memberCount,
      dues: {
        collected,
        outstanding: outstandingAmount,
        paidCount: paid.length,
        outstandingCount: outstanding.length,
        byLevy: Array.from(incomeByLevy.values()),
      },
      expenses: {
        total: totalExpenses,
        byCategory: Array.from(expensesByCategory.entries()).map(([category, total]) => ({ category, total })),
      },
      balance: collected - totalExpenses,
    };
  }
}
