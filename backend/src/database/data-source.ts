import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Trader, User, Market, MarketAdmin, MarketMembership, Levy, DuesInvoice, MarketExpense, Announcement } from '../entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'market_os',
  entities: [Trader, User, Market, MarketAdmin, MarketMembership, Levy, DuesInvoice, MarketExpense, Announcement],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
