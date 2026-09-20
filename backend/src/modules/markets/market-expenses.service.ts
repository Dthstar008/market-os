import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketExpense } from '../../entities';
import { MarketsService } from './markets.service';
import { CreateMarketExpenseDto } from './dto/create-market-expense.dto';

@Injectable()
export class MarketExpensesService {
  constructor(
    @InjectRepository(MarketExpense) private readonly expenses: Repository<MarketExpense>,
    private readonly marketsService: MarketsService,
  ) {}

  async create(marketId: string, userId: string, dto: CreateMarketExpenseDto): Promise<MarketExpense> {
    await this.marketsService.assertAdmin(marketId, userId);
    return this.expenses.save(this.expenses.create({ ...dto, marketId }));
  }

  async list(marketId: string, userId: string): Promise<MarketExpense[]> {
    await this.marketsService.assertAdmin(marketId, userId);
    return this.expenses.find({ where: { marketId }, order: { createdAt: 'DESC' } });
  }
}
