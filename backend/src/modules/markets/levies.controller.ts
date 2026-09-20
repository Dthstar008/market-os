import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTraderId, CurrentUserId } from '../../common/current-trader.decorator';
import { LeviesService } from './levies.service';
import { CreateLevyDto } from './dto/create-levy.dto';
import { UpdateLevyDto } from './dto/update-levy.dto';

@Controller('markets/:marketId/levies')
@UseGuards(JwtAuthGuard)
export class LeviesController {
  constructor(private readonly leviesService: LeviesService) {}

  @Post()
  create(@Param('marketId') marketId: string, @CurrentUserId() userId: string, @Body() dto: CreateLevyDto) {
    return this.leviesService.create(marketId, userId, dto);
  }

  @Get()
  list(
    @Param('marketId') marketId: string,
    @CurrentUserId() userId: string,
    @CurrentTraderId() traderId: string,
  ) {
    return this.leviesService.list(marketId, userId, traderId);
  }

  @Patch(':levyId')
  update(
    @Param('marketId') marketId: string,
    @Param('levyId') levyId: string,
    @CurrentUserId() userId: string,
    @Body() dto: UpdateLevyDto,
  ) {
    return this.leviesService.update(marketId, levyId, userId, dto);
  }
}
