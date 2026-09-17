import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { RefreshToken } from '../refreshtoken/entity/refresh_token.entity';

const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async login(data: any) {
    const user = await this.userService.validateUser(data.email, data.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refreshToken = await this.createRefreshToken(user.id);

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  }

  private async createRefreshToken(userId: number) {
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId,
        tokenHash,
        expireAt,
        revokeAt: new Date(),
      }),
    );

    return rawToken;
  }

  async refreshAccessToken(userId: number, rawToken: string) {
    const candidates = await this.refreshTokenRepo.find({
      where: { userId, revokeAt: IsNull() },
    });

    let matched: RefreshToken | null = null;
    for (const candidate of candidates) {
      if (await bcrypt.compare(rawToken, candidate.tokenHash)) {
        matched = candidate;
        break;
      }
    }

    if (!matched || matched.expireAt < new Date()) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn.',
      );
    }

    matched.revokeAt = new Date();
    await this.refreshTokenRepo.save(matched);

    const user = await this.userService.findUserById(userId);
    if (!user) throw new UnauthorizedException('Tài khoản không còn tồn tại.');

    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  async logout(userId: number, rawToken: string) {
    const candidates = await this.refreshTokenRepo.find({
      where: { userId, revokeAt: IsNull() },
    });

    for (const candidate of candidates) {
      if (await bcrypt.compare(rawToken, candidate.tokenHash)) {
        candidate.revokeAt = new Date();
        await this.refreshTokenRepo.save(candidate);
        break;
      }
    }

    return { success: true };
  }
}
