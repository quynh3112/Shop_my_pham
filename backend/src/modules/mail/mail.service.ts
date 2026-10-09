import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OtpPurpose } from '../otp/entity/otp.entity';

const OTP_SUBJECT: Record<OtpPurpose, string> = {
  [OtpPurpose.LOGIN]: 'Mã xác thực đăng nhập LUNELLE',
  [OtpPurpose.RESET_PASSWORD]: 'Mã đặt lại mật khẩu LUNELLE',
  [OtpPurpose.REGISTER]: 'Mã xác thực đăng ký tài khoản LUNELLE',
};

const OTP_INTRO: Record<OtpPurpose, string> = {
  [OtpPurpose.LOGIN]: 'Bạn vừa yêu cầu đăng nhập vào tài khoản LUNELLE.',
  [OtpPurpose.RESET_PASSWORD]:
    'Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản LUNELLE.',
  [OtpPurpose.REGISTER]:
    'Cảm ơn bạn đã đăng ký tài khoản LUNELLE. Nhập mã bên dưới để xác thực email và hoàn tất đăng ký.',
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const user = config.get<string>('SMTP_USER');
    // App Password Google hiển thị dạng "abcd efgh ijkl mnop" -> bỏ khoảng trắng
    const pass = config.get<string>('SMTP_PASS')?.replace(/\s+/g, '');
    const fromName = config.get<string>('MAIL_FROM_NAME') ?? 'LUNELLE';

    this.from = `"${fromName}" <${config.get<string>('MAIL_FROM') || user}>`;
    this.transporter =
      host && user && pass
        ? nodemailer.createTransport({
            host,
            port: Number(config.get('SMTP_PORT', 587)),
            // true: SSL ngay từ đầu (cổng 465), false: STARTTLS (cổng 587)
            secure: config.get<string>('SMTP_SECURE') === 'true',
            auth: { user, pass },
          })
        : null;
  }

  async sendOtp(
    to: string,
    otp: string,
    purpose: OtpPurpose,
    expiresInMinutes: number,
  ) {
    if (!this.transporter) {
      // Chưa cấu hình SMTP: chỉ cho phép in OTP ra console khi đang dev
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException(
          'Hệ thống chưa cấu hình email gửi OTP.',
        );
      }
      this.logger.warn(
        `SMTP_HOST/SMTP_USER/SMTP_PASS chưa được cấu hình. OTP ${purpose} cho ${to}: ${otp}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: OTP_SUBJECT[purpose],
        text: `${OTP_INTRO[purpose]} Mã OTP của bạn là ${otp}, có hiệu lực trong ${expiresInMinutes} phút.`,
        html: this.otpTemplate(otp, purpose, expiresInMinutes),
      });
    } catch (err) {
      this.logger.error(`Gửi OTP tới ${to} thất bại`, err as Error);
      throw new InternalServerErrorException(
        'Không gửi được email OTP, vui lòng thử lại sau.',
      );
    }
  }

  private otpTemplate(
    otp: string,
    purpose: OtpPurpose,
    expiresInMinutes: number,
  ) {
    return `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #f3d4d7;border-radius:12px">
        <h1 style="color:#E16463;text-align:center;margin:0 0 16px">LUNELLE</h1>
        <p>${OTP_INTRO[purpose]}</p>
        <p>Mã OTP của bạn là:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;color:#E16463;margin:16px 0">${otp}</p>
        <p>Mã có hiệu lực trong <b>${expiresInMinutes} phút</b>. Không chia sẻ mã này cho bất kỳ ai.</p>
        <p style="color:#888;font-size:13px">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email và cân nhắc đổi mật khẩu.</p>
      </div>
    `;
  }
}
