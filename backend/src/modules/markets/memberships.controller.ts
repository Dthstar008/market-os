import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTraderId, CurrentUserId } from '../../common/current-trader.decorator';
import { MembershipsService } from './memberships.service';
import { AddMembershipDto } from './dto/add-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@Controller('markets/:marketId/members')
@UseGuards(JwtAuthGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  add(@Param('marketId') marketId: string, @CurrentUserId() userId: string, @Body() dto: AddMembershipDto) {
    return this.membershipsService.add(marketId, userId, dto);
  }

  @Get()
  list(@Param('marketId') marketId: string, @CurrentUserId() userId: string) {
    return this.membershipsService.list(marketId, userId);
  }

  @Get('me')
  findMine(@Param('marketId') marketId: string, @CurrentTraderId() traderId: string) {
    return this.membershipsService.findMine(marketId, traderId);
  }

  @Patch(':membershipId')
  update(
    @Param('marketId') marketId: string,
    @Param('membershipId') membershipId: string,
    @CurrentUserId() userId: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.membershipsService.update(marketId, membershipId, userId, dto);
  }
}
