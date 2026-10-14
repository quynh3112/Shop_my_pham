import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const CUSTOMER_SORTS = ['newest', 'spent', 'orders', 'name'] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

export class CustomerListQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  /** active = đang hoạt động, locked = đã khoá */
  @IsOptional()
  @IsIn(['active', 'locked'])
  status?: 'active' | 'locked';

  @IsOptional()
  @IsIn(CUSTOMER_SORTS)
  sort: CustomerSort = 'newest';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export class CustomerStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
