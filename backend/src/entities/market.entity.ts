import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { MarketMembership } from './market-membership.entity';

/**
 * The market association itself — the customer/distribution channel in the
 * MarketOS model. A Trader (see trader.entity.ts) joins a Market via a
 * MarketMembership.
 */
@Entity('markets')
export class Market {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  description?: string;

  /** The user who registered the association and administers it (chairman/secretary/treasurer account for MVP). */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminUserId' })
  adminUser: User;

  @Column()
  adminUserId: string;

  /** Shared with whoever should become a co-admin (secretary, treasurer, ...) — see MarketAdmin. Generated once at creation. */
  @Column({ unique: true })
  adminInviteCode: string;

  @OneToMany(() => MarketMembership, (membership) => membership.market)
  memberships: MarketMembership[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
