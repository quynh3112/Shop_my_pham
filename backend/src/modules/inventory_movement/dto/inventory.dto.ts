import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InventoryMovementType } from '../entity/inventory_movement.entity';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const STOCK_STATUSES = ['all', 'in', 'low', 'out'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

class PageQueryDto {
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

// ----- Danh sách tồn kho theo biến thể -----
export class StockListQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsIn(STOCK_STATUSES, { message: 'Trạng thái tồn kho không hợp lệ' })
  status: StockStatus = 'all';

  /** Tồn kho <= ngưỡng này (và > 0) được coi là sắp hết */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  lowThreshold: number = 5;
}

// ----- Nhập thêm hàng -----
export class ReceiveStockDto {
  @Type(() => Number)
  @IsInt({ message: 'Số lượng nhập phải là số nguyên' })
  @Min(1, { message: 'Số lượng nhập phải lớn hơn 0' })
  @Max(100000)
  quantity!: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ----- Kiểm kho: đặt lại số tồn đúng thực tế -----
export class AdjustStockDto {
  @Type(() => Number)
  @IsInt({ message: 'Tồn kho phải là số nguyên' })
  @Min(0, { message: 'Tồn kho không được âm' })
  @Max(1000000)
  stock!: number;

  /** Số tồn lúc admin mở form, để phát hiện tồn kho đã bị đơn hàng khác thay đổi */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedStock!: number;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lý do điều chỉnh' })
  @MaxLength(500)
  reason!: string;
}

// ----- Lịch sử nhập / xuất kho -----
export class MovementListQueryDto extends PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  variantId?: number;

  @IsOptional()
  @IsEnum(InventoryMovementType)
  type?: InventoryMovementType;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)' })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày kết thúc không hợp lệ (YYYY-MM-DD)' })
  to?: string;
}
