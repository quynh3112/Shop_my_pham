import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class CreateFavoriteDto {
  @Type(() => Number)
  @IsInt({ message: 'productId phải là số nguyên.' })
  @IsPositive({ message: 'productId phải lớn hơn 0.' })
  productId!: number;
}

export class UpdateFavoriteDto extends PartialType(CreateFavoriteDto) {}
