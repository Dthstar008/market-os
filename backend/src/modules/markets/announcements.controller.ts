import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTraderId, CurrentUserId } from '../../common/current-trader.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('markets/:marketId/announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  create(@Param('marketId') marketId: string, @CurrentUserId() userId: string, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(marketId, userId, dto);
  }

  @Get()
  list(
    @Param('marketId') marketId: string,
    @CurrentUserId() userId: string,
    @CurrentTraderId() traderId: string,
  ) {
    return this.announcementsService.list(marketId, userId, traderId);
  }
}
