import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export enum ReportScope {
  /** Mọi đơn trừ đơn đã huỷ */
  ALL = 'ALL',
  /** Chỉ đơn đã giao thành công */
  DELIVERED = 'DELIVERED',
  /** Chỉ đơn đã thanh toán */
  PAID = 'PAID',
}

export class ProductSalesQueryDto {
  /** Khoảng ngày đặt hàng, dạng YYYY-MM-DD */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày không hợp lệ' })
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày không hợp lệ' })
  to?: string;

  @IsOptional()
  @IsEnum(ReportScope, { message: 'Phạm vi đơn hàng không hợp lệ' })
  scope?: ReportScope;
}

export class MonthlyRevenueQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Năm không hợp lệ' })
  year?: string;

  @IsOptional()
  @IsEnum(ReportScope, { message: 'Phạm vi đơn hàng không hợp lệ' })
  scope?: ReportScope;
}

export class ScopeQueryDto {
  @IsOptional()
  @IsEnum(ReportScope, { message: 'Phạm vi đơn hàng không hợp lệ' })
  scope?: ReportScope;
}

export class FullReportQueryDto extends ProductSalesQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Năm không hợp lệ' })
  year?: string;
}
