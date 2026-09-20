import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trader, User } from '../../entities';
import { UpdateTraderDto } from './dto/update-trader.dto';

@Injectable()
export class TradersService {
  constructor(
    @InjectRepository(Trader) private readonly traders: Repository<Trader>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async findById(traderId: string): Promise<Trader> {
    const trader = await this.traders.findOne({ where: { id: traderId } });
    if (!trader) throw new NotFoundException('Trader profile not found');
    return trader;
  }

  async update(traderId: string, dto: UpdateTraderDto): Promise<Trader> {
    const trader = await this.findById(traderId);
    Object.assign(trader, dto);
    return this.traders.save(trader);
  }

  /** Used by a market admin to find a trader's id to add as a member, without needing to know their raw UUID. */
  async findByEmail(email: string): Promise<{ traderId: string; name: string }> {
    const user = await this.users.findOne({ where: { email }, relations: ['trader'] });
    if (!user) throw new NotFoundException('No trader account with that email');
    return { traderId: user.trader.id, name: user.trader.name };
  }
}
