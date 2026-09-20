import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Levy } from '../../entities';
import { MarketsService } from './markets.service';
import { CreateLevyDto } from './dto/create-levy.dto';
import { UpdateLevyDto } from './dto/update-levy.dto';

@Injectable()
export class LeviesService {
  constructor(
    @InjectRepository(Levy) private readonly levies: Repository<Levy>,
    private readonly marketsService: MarketsService,
  ) {}

  async create(marketId: string, userId: string, dto: CreateLevyDto): Promise<Levy> {
    await this.marketsService.assertAdmin(marketId, userId);
    return this.levies.save(this.levies.create({ ...dto, marketId }));
  }

  async list(marketId: string, userId: string, traderId?: string): Promise<Levy[]> {
    await this.marketsService.assertAccess(marketId, userId, traderId);
    return this.levies.find({ where: { marketId }, order: { createdAt: 'DESC' } });
  }

  async update(marketId: string, levyId: string, userId: string, dto: UpdateLevyDto): Promise<Levy> {
    await this.marketsService.assertAdmin(marketId, userId);
    const levy = await this.levies.findOne({ where: { id: levyId, marketId } });
    if (!levy) throw new NotFoundException('Levy not found');
    Object.assign(levy, dto);
    return this.levies.save(levy);
  }

  async findById(marketId: string, levyId: string): Promise<Levy> {
    const levy = await this.levies.findOne({ where: { id: levyId, marketId } });
    if (!levy) throw new NotFoundException('Levy not found');
    return levy;
  }
}
