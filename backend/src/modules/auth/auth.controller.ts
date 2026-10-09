import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { LocalAuthGuard } from '../guard/local-auth.guard';
import {
  ForgotPasswordDto,
  RegisterDto,
  ResendRegisterOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { User } from '../user/entity/user.entity';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Đúng email/SĐT + mật khẩu -> nhận accessToken/refreshToken (không cần OTP)
  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }

  // Đăng ký bước 1: tạo tài khoản chưa xác thực, gửi OTP về email
  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('register/resend-otp')
  @HttpCode(200)
  resendRegisterOtp(@Body() data: ResendRegisterOtpDto) {
    return this.authService.resendRegisterOtp(data.email);
  }

  // Đăng ký bước 2: nhập OTP -> kích hoạt tài khoản, nhận accessToken/refreshToken
  @Post('register/verify-otp')
  @HttpCode(200)
  verifyRegisterOtp(@Body() data: VerifyOtpDto) {
    return this.authService.verifyRegisterOtp(data);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.authService.forgotPassword(data.email);
  }

  @Post('forgot-password/verify-otp')
  @HttpCode(200)
  verifyResetOtp(@Body() data: VerifyOtpDto) {
    return this.authService.verifyResetOtp(data);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Request() req: any) {
    return req.user
  }
  @Post('logout')
  logout(@Request() req){


  }
}
