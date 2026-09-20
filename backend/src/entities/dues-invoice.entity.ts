import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Market } from './market.entity';
import { MarketMembership } from './market-membership.entity';
import { Levy } from './levy.entity';
import { DecimalTransformer } from '../common/decimal.transformer';

export enum DuesInvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
}

/**
 * One charge instance for one trader for one period, generated from a Levy.
 * "Period" is a free-form label (e.g. "2026-09" for a monthly levy, or the
 * levy name itself for a one-time charge) — the market defines what a
 * period means for its own levies, this table doesn't enforce a calendar.
 */
@Entity('dues_invoices')
@Index(['marketId', 'period'])
@Index(['membershipId', 'levyId', 'period'], { unique: true })
export class DuesInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Market, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column()
  marketId: string;

  @ManyToOne(() => MarketMembership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membershipId' })
  membership: MarketMembership;

  @Column()
  membershipId: string;

  @ManyToOne(() => Levy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'levyId' })
  levy: Levy;

  @Column()
  levyId: string;

  @Column()
  period: string;

  @Column('decimal', { precision: 14, scale: 2, transformer: new DecimalTransformer() })
  amount: number;

  @Column({ type: 'enum', enum: DuesInvoiceStatus, default: DuesInvoiceStatus.PENDING })
  status: DuesInvoiceStatus;

  @Column({ type: 'date', nullable: true })
  dueDate?: string;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ nullable: true })
  paymentNote?: string;

  @CreateDateColumn()
  createdAt: Date;
}
