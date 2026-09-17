import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AddressCreateDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2, { message: 'Tên người nhận quá ngắn' })
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại' })
  // Thêm @Matches(...) hoặc custom validator cho định dạng SĐT Việt Nam
  phone!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(3, { message: 'Địa chỉ quá ngắn' })
  @MaxLength(255)
  line1!: string;

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