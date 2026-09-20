import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTraderId } from '../../common/current-trader.decorator';
import { MembershipsService } from './memberships.service';

/** Trader-facing counterpart to GET /markets/mine (which only lists markets an admin runs). */
@Controller('trader/me/markets')
@UseGuards(JwtAuthGuard)
export class TraderMembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  findMine(@CurrentTraderId() traderId: string) {
    return this.membershipsService.findAllForTrader(traderId);
  }
}
