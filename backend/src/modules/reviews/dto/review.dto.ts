import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt({ message: 'productId phải là số nguyên.' })
  @Min(1, { message: 'productId phải lớn hơn 0.' })
  @IsNotEmpty({ message: 'productId không được để trống.' })
  productId!: number;

  @Type(() => Number)
  @IsInt({ message: 'rating phải là số nguyên.' })
  @Min(1, { message: 'rating tối thiểu là 1.' })
  @Max(5, { message: 'rating tối đa là 5.' })
  @IsNotEmpty({ message: 'rating không được để trống.' })
  rating!: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'comment phải là chuỗi.' })
  @MaxLength(1000, { message: 'comment tối đa 1000 ký tự.' })
  comment?: string;
}

export class UpdateReviewDto {
  @Type(() => Number)
  @IsInt({ message: 'rating phải là số nguyên.' })
  @Min(1, { message: 'rating tối thiểu là 1.' })
  @Max(5, { message: 'rating tối đa là 5.' })
  @IsOptional()
  rating?: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'comment phải là chuỗi.' })
  @MaxLength(1000, { message: 'comment tối đa 1000 ký tự.' })
  comment?: string;
}

export class ReviewQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'productId phải là số nguyên.' })
  @Min(1, { message: 'productId phải lớn hơn 0.' })
  productId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên.' })
  @Min(1, { message: 'page phải lớn hơn 0.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên.' })
  @Min(1, { message: 'limit phải lớn hơn 0.' })
  limit?: number = 10;
}
