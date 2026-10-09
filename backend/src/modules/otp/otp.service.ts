import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OtpCode, OtpPurpose } from './entity/otp.entity';
import { MailService } from '../mail/mail.service';
import { User } from '../user/entity/user.entity';

/** abcdef@gmail.com -> ab****@gmail.com */
function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${'*'.repeat(Math.max(name.length - visible.length, 3))}@${domain}`;
}

@Injectable()
export class OtpService {
  private readonly ttlMinutes: number;
  private readonly maxAttempts: number;
  private readonly resendSeconds: number;

  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,
    private readonly mailService: MailService,
    config: ConfigService,
  ) {
    this.ttlMinutes = Number(config.get('EMAIL_OTP_TTL_MINUTES', 5));
    this.maxAttempts = Number(config.get('EMAIL_OTP_MAX_ATTEMPTS', 5));
    this.resendSeconds = Number(config.get('EMAIL_OTP_RESEND_SECONDS', 60));
  }

  /**
   * Tạo + gửi OTP qua email của user.
   * Nếu mã trước đó vẫn chưa dùng và chưa hết thời gian chờ gửi lại thì
   * không gửi mã mới (user dùng tiếp mã cũ), chỉ báo còn bao lâu được gửi lại.
   */
  async send(user: User, purpose: OtpPurpose) {
    const latest = await this.otpRepo.findOne({
      where: { userId: user.id, purpose },
      order: { createdAt: 'DESC' },
    });

    if (latest && !latest.usedAt) {
      const elapsed = (Date.now() - latest.createdAt.getTime()) / 1000;
      if (elapsed < this.resendSeconds) {
        return this.sendResult(
          user.email,
          Math.ceil(this.resendSeconds - elapsed),
        );
      }
    }

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.mailService.sendOtp(user.email, code, purpose, this.ttlMinutes);

    // Mỗi user chỉ giữ 1 mã cho mỗi mục đích
    await this.otpRepo.delete({ userId: user.id, purpose });
    await this.otpRepo.save(
      this.otpRepo.create({
        userId: user.id,
        purpose,
        codeHash: await bcrypt.hash(code, 10),
        expireAt: new Date(Date.now() + this.ttlMinutes * 60 * 1000),
      }),
    );

    return this.sendResult(user.email, this.resendSeconds);
  }

  /**
   * Kiểm tra OTP. Sai thì tăng số lần thử, quá EMAIL_OTP_MAX_ATTEMPTS thì khóa mã.
   * consume = false: chỉ kiểm tra (dùng cho bước nhập OTP của quên mật khẩu),
   * mã vẫn còn hiệu lực cho bước đặt mật khẩu mới.
   */
  async verify(
    userId: number,
    purpose: OtpPurpose,
    code: string,
    consume = true,
  ) {
    const otp = await this.otpRepo.findOne({
      where: { userId, purpose },
      order: { createdAt: 'DESC' },
    });

    if (!otp || otp.usedAt || otp.expireAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Mã OTP đã hết hạn hoặc không tồn tại, vui lòng gửi lại mã.',
      );
    }
    if (otp.attempts >= this.maxAttempts) {
      throw new BadRequestException(
        'Bạn đã nhập sai quá nhiều lần, vui lòng gửi lại mã mới.',
      );
    }

    if (!(await bcrypt.compare(code, otp.codeHash))) {
      otp.attempts += 1;
      await this.otpRepo.save(otp);
      const left = this.maxAttempts - otp.attempts;
      throw new BadRequestException(
        left > 0
          ? `Mã OTP không đúng, bạn còn ${left} lần thử.`
          : 'Bạn đã nhập sai quá nhiều lần, vui lòng gửi lại mã mới.',
      );
    }

    if (consume) {
      otp.usedAt = new Date();
      await this.otpRepo.save(otp);
    }
  }

  private sendResult(email: string, resendAfter: number) {
    return {
      email: maskEmail(email),
      expiresIn: this.ttlMinutes * 60,
      resendAfter,
    };
  }
}
