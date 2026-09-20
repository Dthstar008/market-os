import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../../common/current-trader.decorator';
import { MarketExpensesService } from './market-expenses.service';
import { CreateMarketExpenseDto } from './dto/create-market-expense.dto';

@Controller('markets/:marketId/expenses')
@UseGuards(JwtAuthGuard)
export class MarketExpensesController {
  constructor(private readonly marketExpensesService: MarketExpensesService) {}

  @Post()
  create(@Param('marketId') marketId: string, @CurrentUserId() userId: string, @Body() dto: CreateMarketExpenseDto) {
    return this.marketExpensesService.create(marketId, userId, dto);
  }

  @Get()
  list(@Param('marketId') marketId: string, @CurrentUserId() userId: string) {
    return this.marketExpensesService.list(marketId, userId);
  }
}
