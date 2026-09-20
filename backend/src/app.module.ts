import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { Trader, User, Market, MarketAdmin, MarketMembership, Levy, DuesInvoice, MarketExpense, Announcement } from './entities';
import { AuthModule } from './modules/auth/auth.module';
import { TradersModule } from './modules/traders/traders.module';
import { MarketsModule } from './modules/markets/markets.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        entities: [Trader, User, Market, MarketAdmin, MarketMembership, Levy, DuesInvoice, MarketExpense, Announcement],
        ssl: config.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
        // MVP convenience: schema auto-syncs from entities. Switch to migrations before production.
        synchronize: true,
      }),
    }),
    AuthModule,
    TradersModule,
    MarketsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
