import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTraderId, CurrentUserId } from '../../common/current-trader.decorator';
import { MarketsService } from './markets.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { JoinMarketAdminDto } from './dto/join-market-admin.dto';

@Controller('markets')
@UseGuards(JwtAuthGuard)
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateMarketDto) {
    return this.marketsService.create(userId, dto);
  }

  @Post('join-as-admin')
  async joinAsAdmin(@CurrentUserId() userId: string, @Body() dto: JoinMarketAdminDto) {
    const market = await this.marketsService.joinAsAdmin(userId, dto.code);
    return this.sanitize(market);
  }

  @Get('mine')
  async findMine(@CurrentUserId() userId: string) {
    const markets = await this.marketsService.findMine(userId);
    return markets.map((m) => this.sanitize(m));
  }

  @Get(':marketId')
  async findOne(
    @Param('marketId') marketId: string,
    @CurrentUserId() userId: string,
    @CurrentTraderId() traderId: string,
  ) {
    await this.marketsService.assertAccess(marketId, userId, traderId);
    return this.sanitize(await this.marketsService.findById(marketId));
  }

  @Get(':marketId/invite-code')
  async getInviteCode(@Param('marketId') marketId: string, @CurrentUserId() userId: string) {
    return { code: await this.marketsService.getInviteCode(marketId, userId) };
  }

  @Patch(':marketId')
  update(@Param('marketId') marketId: string, @CurrentUserId() userId: string, @Body() dto: UpdateMarketDto) {
    return this.marketsService.update(marketId, userId, dto);
  }

  /** The invite code is admin-sensitive — never return it from a general market read, only from the dedicated invite-code route. */
  private sanitize(market: { adminInviteCode?: string }) {
    const { adminInviteCode, ...rest } = market as Record<string, unknown>;
    return rest;
  }
}
