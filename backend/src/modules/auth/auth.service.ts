import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Trader } from '../../entities';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const { trader, user } = await this.dataSource.transaction(async (manager) => {
      const trader = await manager.save(
        manager.create(Trader, {
          name: dto.traderName,
          ownerName: dto.ownerName,
          phone: dto.phone,
        }),
      );
      const user = await manager.save(
        manager.create(User, {
          email: dto.email,
          passwordHash,
          name: dto.ownerName,
          traderId: trader.id,
        }),
      );
      return { trader, user };
    });

    return this.buildAuthResponse(user, trader);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email }, relations: ['trader'] });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildAuthResponse(user, user.trader);
  }

  private buildAuthResponse(user: User, trader: Trader) {
    const accessToken = this.jwtService.sign({ sub: user.id, traderId: user.traderId });
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name },
      trader: { id: trader.id, name: trader.name },
    };
  }
}
