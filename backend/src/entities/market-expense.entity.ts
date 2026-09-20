import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Market } from './market.entity';
import { DecimalTransformer } from '../common/decimal.transformer';

export enum MarketExpenseCategory {
  SECURITY = 'security',
  SANITATION = 'sanitation',
  ELECTRICITY = 'electricity',
  ADMINISTRATION = 'administration',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

/** The association's own spending — separate from any individual trader's records. */
@Entity('market_expenses')
@Index(['marketId', 'createdAt'])
export class MarketExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Market, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column()
  marketId: string;

  @Column({ type: 'enum', enum: MarketExpenseCategory, default: MarketExpenseCategory.OTHER })
  category: MarketExpenseCategory;

  @Column('decimal', { precision: 14, scale: 2, transformer: new DecimalTransformer() })
  amount: number;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;
}
