import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTraderId } from '../../common/current-trader.decorator';
import { TradersService } from './traders.service';
import { UpdateTraderDto } from './dto/update-trader.dto';

@Controller('trader')
@UseGuards(JwtAuthGuard)
export class TradersController {
  constructor(private readonly tradersService: TradersService) {}

  @Get('me')
  findMine(@CurrentTraderId() traderId: string) {
    return this.tradersService.findById(traderId);
  }

  @Patch('me')
  updateMine(@CurrentTraderId() traderId: string, @Body() dto: UpdateTraderDto) {
    return this.tradersService.update(traderId, dto);
  }

  /** Lets a market admin resolve a trader's id from their registered email, to add them as a member. */
  @Get('lookup')
  lookup(@Query('email') email: string) {
    return this.tradersService.findByEmail((email ?? '').trim());
  }
}
