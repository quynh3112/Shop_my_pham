import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { RefreshToken } from '../refreshtoken/entity/refresh_token.entity';
import { User } from '../user/entity/user.entity';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/entity/otp.entity';
import { RegisterDto, ResetPasswordDto, VerifyOtpDto } from './dto/auth.dto';

const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly otpService: OtpService,
  ) {}

  /** Mật khẩu đúng (LocalAuthGuard đã kiểm tra) -> cấp token luôn */
  login(user: User) {
    return this.issueTokens(user);
  }

  /** Bước 1 đăng ký: tạo tài khoản chưa xác thực -> gửi OTP về email */
  async register(data: RegisterDto) {
    const user = await this.userService.createUnverified(data);
    return this.otpService.send(user, OtpPurpose.REGISTER);
  }

  async resendRegisterOtp(email: string) {
    const user = await this.findPendingRegistrationOrFail(email);
    return this.otpService.send(user, OtpPurpose.REGISTER);
  }

  /** Bước 2 đăng ký: OTP đúng -> kích hoạt tài khoản và đăng nhập luôn */
  async verifyRegisterOtp({ email, otp }: VerifyOtpDto) {
    const user = await this.findPendingRegistrationOrFail(email);
    await this.otpService.verify(user.id, OtpPurpose.REGISTER, otp);
    await this.userService.markEmailVerified(user.id);
    return this.issueTokens({ ...user, isEmailVerified: true });
  }

  async forgotPassword(email: string) {
    const user = await this.findUserOrFail(email);
    return this.otpService.send(user, OtpPurpose.RESET_PASSWORD);
  }

  /** Chỉ kiểm tra OTP, chưa dùng mã -> bước đặt mật khẩu mới còn dùng lại */
  async verifyResetOtp({ email, otp }: VerifyOtpDto) {
    const user = await this.findUserOrFail(email);
    await this.otpService.verify(
      user.id,
      OtpPurpose.RESET_PASSWORD,
      otp,
      false,
    );
    return { valid: true };
  }

  async resetPassword({ email, otp, newPassword }: ResetPasswordDto) {
    const user = await this.findUserOrFail(email);
    await this.otpService.verify(user.id, OtpPurpose.RESET_PASSWORD, otp);
    await this.userService.updatePassword(user.id, newPassword);
    // Đổi mật khẩu xong thì đăng xuất mọi phiên cũ
    await this.refreshTokenRepo.update(
      { userId: user.id, revokeAt: IsNull() },
      { revokeAt: new Date() },
    );
    return { success: true };
  }

  private async findUserOrFail(key: string) {
    const user = await this.userService.findUser(key);
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản!');
    return user;
  }

  private async findPendingRegistrationOrFail(email: string) {
    const user = await this.userService.findUnverifiedByEmail(email);
    if (!user) {
      throw new NotFoundException(
        'Không tìm thấy yêu cầu đăng ký, vui lòng đăng ký lại.',
      );
    }
    return user;
  }

  private async issueTokens(user: User) {
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
