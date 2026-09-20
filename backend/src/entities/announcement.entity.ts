import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Market } from './market.entity';
import { User } from './user.entity';

/** A broadcast from the market association to its members — replaces the WhatsApp-group announcement with an official, timestamped record. */
@Entity('announcements')
@Index(['marketId', 'createdAt'])
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Market, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'marketId' })
  market: Market;

  @Column()
  marketId: string;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @Column({ nullable: true })
  createdByUserId?: string;

  @CreateDateColumn()
  createdAt: Date;
}
