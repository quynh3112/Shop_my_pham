import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// "email" nhận cả email hoặc số điện thoại, giống form đăng nhập
export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập email hoặc số điện thoại.' })
  email!: string;
}

export class VerifyOtpDto extends ForgotPasswordDto {
  @Matches(/^\d{6}$/, { message: 'Mã OTP gồm 6 chữ số.' })
  otp!: string;
}

export class ResetPasswordDto extends VerifyOtpDto {
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
  newPassword!: string;
}

export class ResendRegisterOtpDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email!: string;
}

export class RegisterDto extends ResendRegisterOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên.' })
  @MaxLength(120, { message: 'Họ tên tối đa 120 ký tự.' })
  fullName!: string;

  @Matches(/^0\d{9}$/, {
    message: 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 0.',
  })
  phone!: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  password!: string;
}
