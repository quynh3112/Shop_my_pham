// import { Type } from 'class-transformer';
// import { IsIn, IsInt, IsOptional, IsString, Min, IsDateString } from 'class-validator';
// import type { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

// export class OrderCreateInput {
//   @IsInt()
//   addressId!: number;

//   @IsString()
//   paymentMethod!: PaymentMethod;

//   @IsOptional()
//   @IsString()
//   note?: string;
// }

// export class OrderListQuery {
//   @IsOptional()
//   @IsString()
//   status?: OrderStatus;

//   @Type(() => Number)
//   @IsInt()
//   @Min(1)
//   page = 1;

//   @Type(() => Number)
//   @IsInt()
//   @Min(1)
//   limit = 20;
// }

// export class AdminOrderListQuery extends OrderListQuery {
//   @IsOptional()
//   @IsString()
//   paymentStatus?: PaymentStatus;

//   @IsOptional()
//   @IsString()
//   paymentMethod?: PaymentMethod;

//   @IsOptional()
//   @IsString()
//   search?: string;

//   @IsOptional()
//   @IsDateString()
//   from?: string;

//   @IsOptional()
//   @IsDateString()
//   to?: string;
// }

// export class UpdateOrderStatusInput {
//   @IsIn(['CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'])
//   status!: OrderStatus;
// }

// export class UpdatePaymentStatusInput {
//   @IsIn(['PAID', 'UNPAID', 'FAILED', 'REFUNDED'])
//   paymentStatus!: PaymentStatus;
// }