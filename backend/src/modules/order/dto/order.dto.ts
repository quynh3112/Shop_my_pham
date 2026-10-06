// order.dto.ts
import {
  IsInt,
  IsPositive,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus as DomainOrderStatus } from 'src/until/order_status';
import { PaymentStatus as DomainPaymentStatus } from '../entity/order.entity';

export const ORDER_STATUSES = Object.values(DomainOrderStatus);
export type OrderStatus = DomainOrderStatus;

export const PAYMENT_METHODS = ['COD', 'MOMO'] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = Object.values(DomainPaymentStatus);
export type PaymentStatusValue = DomainPaymentStatus;

// ----- Tạo đơn hàng -----
export class OrderCreateDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive({ message: 'Vui lòng chọn địa chỉ giao hàng' })
  addressId!: number;

  @IsOptional()
  @IsEnum(PAYMENT_METHODS)
  paymentMethod: PaymentMethodValue = 'COD';

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú quá dài' })
  note?: string;
}

export class OrderBuyNowDto extends OrderCreateDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  variantId!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;
}

// ----- Query danh sách đơn (khách hàng) -----
export class OrderListQueryDto {
  @IsOptional()
  @IsEnum(DomainOrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(50)
  limit: number = 10;
}

/**
 * Bộ lọc dành riêng cho admin. Trang khách không cần tìm theo mã hay theo
 * người mua nên không dùng chung DTO — mỗi bên một bộ, khỏi lộ tham số
 * lọc chéo tài khoản ra API công khai.
 */
export class AdminOrderListQueryDto extends OrderListQueryDto {
  /** Tìm theo mã đơn, tên hoặc email người mua. */
  @IsOptional()
  @IsString()
  @MaxLength(191)
  search?: string;

  @IsOptional()
  @IsEnum(DomainPaymentStatus)
  paymentStatus?: PaymentStatusValue;

  @IsOptional()
  @IsEnum(PAYMENT_METHODS)
  paymentMethod?: PaymentMethodValue;

  /** Khoảng ngày đặt, dạng YYYY-MM-DD. */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày không hợp lệ' })
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày không hợp lệ' })
  to?: string;
}

// ----- Đổi trạng thái đơn -----
export class OrderStatusDto {
  @IsEnum(DomainOrderStatus)
  status!: OrderStatus;
}

/**
 * Đánh dấu thanh toán thủ công: đơn chuyển khoản trước hoặc thu tiền hộ báo
 * thất bại đều cần admin ghi nhận, máy trạng thái đơn không suy ra được.
 */
export class PaymentStatusDto {
  @IsEnum(DomainPaymentStatus)
  paymentStatus!: PaymentStatusValue;
}

// ----- Param mã đơn -----
export class OrderCodeParamDto {
  @IsString()
  @MaxLength(32)
  code!: string;
}