import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../../entities';
import { MarketsService } from './markets.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement) private readonly announcements: Repository<Announcement>,
    private readonly marketsService: MarketsService,
  ) {}

  async create(marketId: string, userId: string, dto: CreateAnnouncementDto): Promise<Announcement> {
    await this.marketsService.assertAdmin(marketId, userId);
    return this.announcements.save(this.announcements.create({ ...dto, marketId, createdByUserId: userId }));
  }

  async list(marketId: string, userId: string, traderId?: string) {
    await this.marketsService.assertAccess(marketId, userId, traderId);
    const announcements = await this.announcements.find({
      where: { marketId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
    // Strip the joined User down to a display name — never return passwordHash.
    return announcements.map(({ createdBy, ...rest }) => ({
      ...rest,
      createdBy: createdBy ? { id: createdBy.id, name: createdBy.name } : undefined,
    }));
  }
}
