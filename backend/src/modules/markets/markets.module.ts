import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement, Trader, DuesInvoice, Levy, Market, MarketAdmin, MarketExpense, MarketMembership } from '../../entities';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { MembershipsController } from './memberships.controller';
import { TraderMembershipsController } from './trader-memberships.controller';
import { MembershipsService } from './memberships.service';
import { LeviesController } from './levies.controller';
import { LeviesService } from './levies.service';
import { DuesController } from './dues.controller';
import { DuesService } from './dues.service';
import { MarketExpensesController } from './market-expenses.controller';
import { MarketExpensesService } from './market-expenses.service';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Market, MarketAdmin, MarketMembership, Levy, DuesInvoice, MarketExpense, Announcement, Trader]),
  ],
  controllers: [
    MarketsController,
    MembershipsController,
    TraderMembershipsController,
    LeviesController,
    DuesController,
    MarketExpensesController,
    AnnouncementsController,
    AccountingController,
  ],
  providers: [
    MarketsService,
    MembershipsService,
    LeviesService,
    DuesService,
    MarketExpensesService,
    AnnouncementsService,
    AccountingService,
  ],
})
export class MarketsModule {}
