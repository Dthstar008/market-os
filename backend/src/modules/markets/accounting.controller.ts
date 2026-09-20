import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../../common/current-trader.decorator';
import { AccountingService } from './accounting.service';

@Controller('markets/:marketId/accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('summary')
  summary(@Param('marketId') marketId: string, @CurrentUserId() userId: string) {
    return this.accountingService.summary(marketId, userId);
  }
}
