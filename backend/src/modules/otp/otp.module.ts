import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpService } from './otp.service';
import { OtpCode } from './entity/otp.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  providers: [OtpService],
  imports: [TypeOrmModule.forFeature([OtpCode]), MailModule],
  exports: [OtpService],
})
export class OtpModule {}
