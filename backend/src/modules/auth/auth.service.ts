import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: { email: string; password: string; businessName: string; phone?: string }) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      businessName: dto.businessName,
      phone: dto.phone ?? null,
    });
    const saved = await this.userRepo.save(user);
    return this.generateTokens(saved);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRY', '30d'),
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        phone: user.phone,
        defaultLanguage: user.defaultLanguage,
        subscriptionTier: user.subscriptionTier,
      },
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  }

  async me(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async updateProfile(userId: string, dto: Partial<User>): Promise<User> {
    const { passwordHash, ...safeDto } = dto as User;
    await this.userRepo.update(userId, safeDto);
    return this.me(userId);
  }
}
