import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTraderId, CurrentUserId } from '../../common/current-trader.decorator';
import { DuesService } from './dues.service';
import { GenerateDuesDto } from './dto/generate-dues.dto';
import { PayDuesDto } from './dto/pay-dues.dto';

@Controller('markets/:marketId/dues')
@UseGuards(JwtAuthGuard)
export class DuesController {
  constructor(private readonly duesService: DuesService) {}

  @Post('generate')
  generate(@Param('marketId') marketId: string, @CurrentUserId() userId: string, @Body() dto: GenerateDuesDto) {
    return this.duesService.generate(marketId, userId, dto);
  }

  @Get()
  listAll(@Param('marketId') marketId: string, @CurrentUserId() userId: string) {
    return this.duesService.listAll(marketId, userId);
  }

  @Get('mine')
  listMine(@Param('marketId') marketId: string, @CurrentTraderId() traderId: string) {
    return this.duesService.listMine(marketId, traderId);
  }

  @Post(':invoiceId/pay')
  pay(
    @Param('marketId') marketId: string,
    @Param('invoiceId') invoiceId: string,
    @CurrentTraderId() traderId: string,
    @Body() dto: PayDuesDto,
  ) {
    return this.duesService.pay(marketId, invoiceId, traderId, dto);
  }
}
