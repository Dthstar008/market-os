import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * The "trader identity" layer from the MarketOS plan — a digital profile for
 * one trader (a market-association member), independent of which market(s)
 * they belong to. Market-specific details (section, stall number, status)
 * live on MarketMembership instead, since a trader's identity shouldn't need
 * to be re-entered if they join a second market.
 */
@Entity('traders')
export class Trader {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Shop / stall name. */
  @Column()
  name: string;

  @Column({ nullable: true })
  ownerName?: string;

  @Column({ nullable: true })
  phone?: string;

  /** Product category, e.g. "Electronics", "Foodstuff". */
  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ nullable: true })
  emergencyContact?: string;

  @OneToMany(() => User, (user) => user.trader)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
