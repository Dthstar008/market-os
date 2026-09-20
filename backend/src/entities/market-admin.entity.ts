import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Market } from './market.entity';
import { User } from './user.entity';

/**
 * A co-admin of a market, added by redeeming the market's adminInviteCode —
 * lets an association have more than one administering account (secretary,
 * treasurer, ...) beyond the single Market.adminUserId that created it.
 */
@Entity('market_admins')
@Index(['marketId', 'userId'], { unique: true })
export class MarketAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Market, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column()
  marketId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  joinedAt: Date;
}
