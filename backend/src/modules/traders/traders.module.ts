import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trader, User } from '../../entities';
import { TradersController } from './traders.controller';
import { TradersService } from './traders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trader, User])],
  controllers: [TradersController],
  providers: [TradersService],
})
export class TradersModule {}
