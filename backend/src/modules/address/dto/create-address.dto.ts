import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AddressCreateDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2, { message: 'Tên người nhận quá ngắn' })
  @MaxLength(120)
  fullName!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại' })
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 0.' })
  phone!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(3, { message: 'Địa chỉ quá ngắn' })
  @MaxLength(255)
  line1!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập quận/huyện' })
  @MaxLength(120)
  district!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập xã/phường/đặc khu' })
  @MaxLength(120)
  ward!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tỉnh/thành phố' })
  @MaxLength(120)
  province!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}