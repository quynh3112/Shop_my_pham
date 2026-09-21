// banner.dto.ts
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUrl,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BannerPlacement } from '../entity/banner.entity';
import { PartialType } from '@nestjs/mapped-types';

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên banner không được để trống.' })
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsString()
  @IsNotEmpty({ message: 'Alt text không được để trống (cần cho SEO/accessibility).' })
  @MaxLength(255)
  altText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string;

  @IsOptional()
  @IsEnum(BannerPlacement, { message: 'Vị trí banner không hợp lệ.' })
  placement?: BannerPlacement;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Mọi field đều optional khi cập nhật — chỉ gửi field nào cần đổi.
 * Kế thừa từ CreateBannerDto nên validator (MaxLength, IsEnum...) giữ
 * nguyên, chỉ bỏ bắt buộc @IsNotEmpty.
 */
export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

/** Query lọc/phân trang danh sách banner (trang admin). */
export class BannerQueryDto {
  @IsOptional()
  @IsEnum(BannerPlacement)
  placement?: BannerPlacement;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}