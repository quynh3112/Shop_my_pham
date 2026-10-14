import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PERMISSION_CODES, type Permission } from '../../auth/permissions';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const digits = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value);

class StaffPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_CODES, { each: true, message: 'Quyền không hợp lệ' })
  permissions!: Permission[];
}

export class CreateStaffDto extends StaffPermissionsDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên.' })
  @MaxLength(120)
  fullName!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email!: string;

  @Transform(digits)
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 0.' })
  phone!: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  password!: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên.' })
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @Transform(digits)
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 0.' })
  phone?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_CODES, { each: true, message: 'Quyền không hợp lệ' })
  permissions?: Permission[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResetStaffPasswordDto {
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  password!: string;
}
