import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Market } from './market.entity';
import { DecimalTransformer } from '../common/decimal.transformer';

export enum LevyFrequency {
  ONE_TIME = 'one_time',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * A recurring or one-time due type defined by a market (dues, sanitation,
 * security, development levy, etc). DuesInvoice instances are generated
 * from a Levy for a given period, one per active membership.
 */
@Entity('levies')
@Index(['marketId'])
export class Levy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Market, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column()
  marketId: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 14, scale: 2, transformer: new DecimalTransformer() })
  amount: number;

  @Column({ type: 'enum', enum: LevyFrequency, default: LevyFrequency.MONTHLY })
  frequency: LevyFrequency;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
