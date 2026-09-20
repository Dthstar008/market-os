import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Market } from './market.entity';
import { Trader } from './trader.entity';

export enum MembershipStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXITED = 'exited',
}

/**
 * A trader's membership record within a market association: links a Trader
 * to a Market and adds only the association-specific fields (section, stall,
 * membership status).
 */
@Entity('market_memberships')
@Index(['marketId', 'traderId'], { unique: true })
export class MarketMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Market, (market) => market.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column()
  marketId: string;

  @ManyToOne(() => Trader, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'traderId' })
  trader: Trader;

  @Column()
  traderId: string;

  @Column({ nullable: true })
  section?: string;

  @Column({ nullable: true })
  stallNumber?: string;

  @Column({ type: 'enum', enum: MembershipStatus, default: MembershipStatus.ACTIVE })
  status: MembershipStatus;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
