import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Row, Workbook, Worksheet } from 'exceljs';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrderStatus } from 'src/until/order_status';
import { Order, PaymentStatus } from '../order/entity/order.entity';
import { OrderItem } from '../order_item/entity/order-item.entity';
import { Role, User } from '../user/entity/user.entity';
import { MonthlyRevenueQueryDto, ProductSalesQueryDto, ReportScope } from './dto/report.dto';

export interface ProductSalesRow {
  productId: number | null;
  productName: string;
  categoryName: string | null;
  quantity: number;
  orderCount: number;
  revenue: number;
}

export interface ProductSalesReport {
  filter: { from: string | null; to: string | null; scope: ReportScope };
  summary: {
    productCount: number;
    totalQuantity: number;
    orderCount: number;
    totalRevenue: number;
  };
  items: ProductSalesRow[];
}

const SCOPE_LABEL: Record<ReportScope, string> = {
  [ReportScope.ALL]: 'Tất cả đơn (trừ đơn đã huỷ)',
  [ReportScope.DELIVERED]: 'Chỉ đơn đã giao',
  [ReportScope.PAID]: 'Chỉ đơn đã thanh toán',
};

const MONEY_FORMAT = '#,##0" đ"';

// Doanh thu chỉ tính đơn đã giao thành công (đơn đang xử lý / đang giao có thể còn bị huỷ)
const REVENUE_SCOPE = ReportScope.DELIVERED;

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ xác nhận',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPING]: 'Đang giao',
  [OrderStatus.DELIVERED]: 'Đã giao',
  [OrderStatus.CANCELLED]: 'Đã huỷ',
};

export interface ReportOverview {
  filter: { from: string | null; to: string | null; scope: ReportScope };
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  itemsSold: number;
  shippingFee: number;
  newCustomers: number;
  /** Số đơn theo trạng thái trong khoảng thời gian (gồm cả đơn huỷ) */
  statusCounts: Record<OrderStatus, number>;
  /** Đơn chờ xác nhận (mọi thời điểm) - việc admin cần làm ngay */
  pendingCount: number;
  pendingOrders: {
    id: number;
    code: string;
    receiverName: string;
    total: number;
    itemCount: number;
    createdAt: Date;
  }[];
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Các chỉ số tổng quan trong khoảng thời gian; doanh thu = tiền hàng (subtotal), không gồm phí ship */
  async getOverview(query: ProductSalesQueryDto): Promise<ReportOverview> {
    const scope = REVENUE_SCOPE;
    this.assertRange(query);

    const totalsQb = this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.subtotal), 0)', 'revenue')
      .addSelect('COALESCE(SUM(o.shippingFee), 0)', 'shippingFee')
      .addSelect('COUNT(o.id)', 'orderCount');
    this.applyFilters(totalsQb, query, scope);

    const itemsQb = this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .select('COALESCE(SUM(oi.quantity), 0)', 'itemsSold');
    this.applyFilters(itemsQb, query, scope);

    // Trạng thái đơn: chỉ lọc theo ngày, tính cả đơn đã huỷ
    const statusQb = this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(o.id)', 'count')
      .groupBy('o.status');
    this.applyDateRange(statusQb, query);

    const customersQb = this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: Role.USER });
    if (query.from) customersQb.andWhere('u.createdAt >= :from', { from: `${query.from} 00:00:00` });
    if (query.to) customersQb.andWhere('u.createdAt <= :to', { to: `${query.to} 23:59:59.999` });

    const [totals, items, statusRows, newCustomers, pendingCount, pending] = await Promise.all([
      totalsQb.getRawOne<Record<string, string>>(),
      itemsQb.getRawOne<Record<string, string>>(),
      statusQb.getRawMany<{ status: OrderStatus; count: string }>(),
      customersQb.getCount(),
      this.orderRepo.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepo.find({
        where: { status: OrderStatus.PENDING },
        relations: { items: true },
        order: { createdAt: 'ASC' },
        take: 8,
      }),
    ]);

    const revenue = Number(totals?.revenue ?? 0);
    const orderCount = Number(totals?.orderCount ?? 0);
    const statusCounts = Object.fromEntries(
      Object.values(OrderStatus).map((s) => [s, 0]),
    ) as Record<OrderStatus, number>;
    statusRows.forEach((r) => (statusCounts[r.status] = Number(r.count)));

    return {
      filter: { from: query.from ?? null, to: query.to ?? null, scope },
      revenue,
      orderCount,
      averageOrderValue: orderCount ? Math.round(revenue / orderCount) : 0,
      itemsSold: Number(items?.itemsSold ?? 0),
      shippingFee: Number(totals?.shippingFee ?? 0),
      newCustomers,
      statusCounts,
      pendingCount,
      // Đơn chờ lâu nhất lên đầu
      pendingOrders: pending.map((o) => ({
        id: o.id,
        code: o.code,
        receiverName: o.receiverName,
        total: o.total,
        itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
        createdAt: o.createdAt,
      })),
    };
  }

  /** Doanh thu 12 tháng của một năm (tháng chưa có đơn = 0) */
  async getMonthlyRevenue(query: MonthlyRevenueQueryDto) {
    const year = Number(query.year ?? new Date().getFullYear());
    const scope = REVENUE_SCOPE;
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select('EXTRACT(MONTH FROM o.createdAt)::int', 'month')
      .addSelect('COALESCE(SUM(o.subtotal), 0)', 'revenue')
      .addSelect('COUNT(o.id)', 'orderCount')
      .groupBy('month');
    this.applyFilters(qb, { from: `${year}-01-01`, to: `${year}-12-31` }, scope);
    const rows = await qb.getRawMany<{ month: number; revenue: string; orderCount: string }>();

    const months = Array.from({ length: 12 }, (_, i) => {
      const row = rows.find((r) => Number(r.month) === i + 1);
      return {
        month: i + 1,
        revenue: Number(row?.revenue ?? 0),
        orderCount: Number(row?.orderCount ?? 0),
      };
    });
    return {
      year,
      scope,
      months,
      totalRevenue: months.reduce((sum, m) => sum + m.revenue, 0),
      totalOrders: months.reduce((sum, m) => sum + m.orderCount, 0),
    };
  }

  /** Doanh thu theo từng năm có đơn hàng */
  async getYearlyRevenue() {
    const scope = REVENUE_SCOPE;
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select('EXTRACT(YEAR FROM o.createdAt)::int', 'year')
      .addSelect('COALESCE(SUM(o.subtotal), 0)', 'revenue')
      .addSelect('COUNT(o.id)', 'orderCount')
      .groupBy('year')
      .orderBy('year', 'ASC');
    this.applyFilters(qb, {}, scope);
    const rows = await qb.getRawMany<{ year: number; revenue: string; orderCount: string }>();
    const years = rows.map((r) => ({
      year: Number(r.year),
      revenue: Number(r.revenue),
      orderCount: Number(r.orderCount),
    }));
    // Luôn có năm hiện tại để chọn được trong bộ lọc
    const current = new Date().getFullYear();
    if (!years.some((y) => y.year === current)) years.push({ year: current, revenue: 0, orderCount: 0 });
    return { scope, years };
  }

  private assertRange(query: { from?: string; to?: string }) {
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    }
  }

  /** Số lượng bán và doanh thu (tổng tiền hàng, không gồm phí ship) theo từng sản phẩm */
  async getProductSales(query: ProductSalesQueryDto): Promise<ProductSalesReport> {
    const scope = REVENUE_SCOPE;
    this.assertRange(query);

    const qb = this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .leftJoin('oi.product', 'p')
      .leftJoin('p.category', 'c')
      .select('oi.productId', 'productId')
      // Sản phẩm đã bị xoá thì lấy tên lưu trong đơn hàng
      .addSelect('COALESCE(MAX(p.name), MAX(oi.productName))', 'productName')
      .addSelect('MAX(c.name)', 'categoryName')
      .addSelect('SUM(oi.quantity)', 'quantity')
      .addSelect('COUNT(DISTINCT oi.orderId)', 'orderCount')
      .addSelect('SUM(oi.lineTotal)', 'revenue')
      .groupBy('oi.productId')
      .addGroupBy('CASE WHEN oi.productId IS NULL THEN oi.productName END')
      .orderBy('revenue', 'DESC')
      .addOrderBy('quantity', 'DESC');

    this.applyFilters(qb, query, scope);

    const raw = await qb.getRawMany<Record<string, string | null>>();
    const items: ProductSalesRow[] = raw.map((r) => ({
      productId: r.productId === null ? null : Number(r.productId),
      productName: r.productName ?? 'Sản phẩm không xác định',
      categoryName: r.categoryName,
      quantity: Number(r.quantity ?? 0),
      orderCount: Number(r.orderCount ?? 0),
      revenue: Number(r.revenue ?? 0),
    }));

    // Một đơn có nhiều sản phẩm nên phải đếm riêng số đơn
    const orderQb = this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .select('COUNT(DISTINCT oi.orderId)', 'count');
    this.applyFilters(orderQb, query, scope);
    const orderCount = Number((await orderQb.getRawOne<{ count: string }>())?.count ?? 0);

    return {
      filter: { from: query.from ?? null, to: query.to ?? null, scope },
      summary: {
        productCount: items.length,
        totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
        orderCount,
        totalRevenue: items.reduce((s, i) => s + i.revenue, 0),
      },
      items,
    };
  }

  /** Lọc đơn (alias "o"): chỉ đơn đã giao (REVENUE_SCOPE) trong khoảng ngày đặt */
  private applyFilters(
    qb: SelectQueryBuilder<OrderItem> | SelectQueryBuilder<Order>,
    query: { from?: string; to?: string },
    scope: ReportScope,
  ) {
    qb.where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED });
    if (scope === ReportScope.DELIVERED) {
      qb.andWhere('o.status = :delivered', { delivered: OrderStatus.DELIVERED });
    } else if (scope === ReportScope.PAID) {
      qb.andWhere('o.paymentStatus = :paid', { paid: PaymentStatus.PAID });
    }
    this.applyDateRange(qb, query);
  }

  private applyDateRange(
    qb: SelectQueryBuilder<OrderItem> | SelectQueryBuilder<Order>,
    query: { from?: string; to?: string },
  ) {
    if (query.from) {
      qb.andWhere('o.createdAt >= :from', { from: `${query.from} 00:00:00` });
    }
    if (query.to) {
      qb.andWhere('o.createdAt <= :to', { to: `${query.to} 23:59:59.999` });
    }
  }

  /** File Excel chỉ có bảng doanh thu theo sản phẩm */
  async exportProductSales(query: ProductSalesQueryDto): Promise<Buffer> {
    const workbook = this.createWorkbook();
    this.addProductSheet(workbook, await this.getProductSales(query));
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /** File Excel đầy đủ: tổng quan, doanh thu theo tháng / năm, sản phẩm */
  async exportFullReport(query: ProductSalesQueryDto & { year?: string }): Promise<Buffer> {
    const scope = REVENUE_SCOPE;
    const [overview, monthly, yearly, products] = await Promise.all([
      this.getOverview(query),
      this.getMonthlyRevenue({ year: query.year, scope }),
      this.getYearlyRevenue(),
      this.getProductSales(query),
    ]);
    const workbook = this.createWorkbook();
    const period = this.periodText(overview.filter);

    // ----- Tổng quan -----
    const summary = workbook.addWorksheet('Tổng quan');
    summary.columns = [{ width: 34 }, { width: 22 }];
    this.writeTitle(summary, 'BÁO CÁO TỔNG QUAN', period, 2);
    this.writeHeader(summary, 5, ['Chỉ số', 'Giá trị']);
    const metrics: [string, number, string][] = [
      ['Doanh thu (tiền hàng)', overview.revenue, MONEY_FORMAT],
      ['Số đơn hàng', overview.orderCount, '#,##0'],
      ['Giá trị trung bình / đơn', overview.averageOrderValue, MONEY_FORMAT],
      ['Số sản phẩm bán ra', overview.itemsSold, '#,##0'],
      ['Phí vận chuyển thu', overview.shippingFee, MONEY_FORMAT],
      ['Khách hàng mới', overview.newCustomers, '#,##0'],
      ['Đơn đang chờ xác nhận (hiện tại)', overview.pendingCount, '#,##0'],
    ];
    metrics.forEach(([label, value, fmt]) => {
      const row = summary.addRow([label, value]);
      row.getCell(2).numFmt = fmt;
    });
    summary.addRow([]);
    const statusHeader = summary.addRow(['Trạng thái đơn (trong kỳ)', 'Số đơn']);
    this.styleHeader(statusHeader);
    Object.values(OrderStatus).forEach((s) => summary.addRow([STATUS_LABEL[s], overview.statusCounts[s]]));
    this.borderRows(summary, 5, summary.rowCount);

    // ----- Theo tháng -----
    const months = workbook.addWorksheet(`Theo tháng ${monthly.year}`);
    months.columns = [{ width: 14 }, { width: 22 }, { width: 12 }];
    this.writeTitle(months, `DOANH THU THEO THÁNG NĂM ${monthly.year}`, `Phạm vi: ${SCOPE_LABEL[scope]}`, 3);
    this.writeHeader(months, 5, ['Tháng', 'Doanh thu', 'Số đơn']);
    monthly.months.forEach((m) => months.addRow([`Tháng ${m.month}`, m.revenue, m.orderCount]));
    this.writeTotalRow(months.addRow(['TỔNG CỘNG', monthly.totalRevenue, monthly.totalOrders]));
    months.getColumn(2).numFmt = MONEY_FORMAT;
    this.borderRows(months, 5, months.rowCount);

    // ----- Theo năm -----
    const years = workbook.addWorksheet('Theo năm');
    years.columns = [{ width: 14 }, { width: 22 }, { width: 12 }];
    this.writeTitle(years, 'DOANH THU THEO NĂM', `Phạm vi: ${SCOPE_LABEL[scope]}`, 3);
    this.writeHeader(years, 5, ['Năm', 'Doanh thu', 'Số đơn']);
    yearly.years.forEach((y) => years.addRow([y.year, y.revenue, y.orderCount]));
    this.writeTotalRow(
      years.addRow([
        'TỔNG CỘNG',
        yearly.years.reduce((sum, y) => sum + y.revenue, 0),
        yearly.years.reduce((sum, y) => sum + y.orderCount, 0),
      ]),
    );
    years.getColumn(2).numFmt = MONEY_FORMAT;
    this.borderRows(years, 5, years.rowCount);

    // ----- Sản phẩm -----
    this.addProductSheet(workbook, products);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private createWorkbook() {
    const workbook = new Workbook();
    workbook.creator = 'Lunelle';
    workbook.created = new Date();
    return workbook;
  }

  private addProductSheet(workbook: Workbook, report: ProductSalesReport) {
    const sheet = workbook.addWorksheet('Sản phẩm', { views: [{ state: 'frozen', ySplit: 5 }] });
    sheet.columns = [
      { key: 'index', width: 6 },
      { key: 'productName', width: 42 },
      { key: 'categoryName', width: 20 },
      { key: 'quantity', width: 14 },
      { key: 'orderCount', width: 12 },
      { key: 'revenue', width: 20 },
      { key: 'share', width: 14 },
    ];
    this.writeTitle(sheet, 'SẢN PHẨM BÁN RA VÀ DOANH THU', this.periodText(report.filter), 7);
    this.writeHeader(sheet, 5, ['STT', 'Sản phẩm', 'Danh mục', 'Số lượng bán', 'Số đơn', 'Doanh thu', 'Tỷ trọng']);

    const total = report.summary.totalRevenue;
    report.items.forEach((item, i) => {
      sheet.addRow({
        index: i + 1,
        productName: item.productName,
        categoryName: item.categoryName ?? '',
        quantity: item.quantity,
        orderCount: item.orderCount,
        revenue: item.revenue,
        share: total ? item.revenue / total : 0,
      });
    });
    this.writeTotalRow(
      sheet.addRow({
        productName: 'TỔNG CỘNG',
        quantity: report.summary.totalQuantity,
        orderCount: report.summary.orderCount,
        revenue: report.summary.totalRevenue,
        share: total ? 1 : 0,
      }),
    );
    sheet.getColumn('quantity').numFmt = '#,##0';
    sheet.getColumn('orderCount').numFmt = '#,##0';
    sheet.getColumn('revenue').numFmt = MONEY_FORMAT;
    sheet.getColumn('share').numFmt = '0.0%';
    this.borderRows(sheet, 5, sheet.rowCount);
  }

  private periodText(filter: { from: string | null; to: string | null; scope: ReportScope }) {
    const from = filter.from ? formatDate(filter.from) : 'từ đầu';
    const to = filter.to ? formatDate(filter.to) : 'nay';
    return `Thời gian: ${from} - ${to}   |   Phạm vi: ${SCOPE_LABEL[filter.scope]}`;
  }

  private writeTitle(sheet: Worksheet, title: string, subtitle: string, columns: number) {
    const last = String.fromCharCode(64 + columns);
    sheet.mergeCells(`A1:${last}1`);
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.mergeCells(`A2:${last}2`);
    sheet.getCell('A2').value = subtitle;
    sheet.mergeCells(`A3:${last}3`);
    sheet.getCell('A3').value = `Xuất lúc: ${new Date().toLocaleString('vi-VN')}`;
    sheet.getCell('A3').font = { italic: true, color: { argb: 'FF888888' } };
  }

  private writeHeader(sheet: Worksheet, rowNumber: number, values: string[]) {
    const header = sheet.getRow(rowNumber);
    header.values = values;
    this.styleHeader(header);
  }

  private styleHeader(row: Row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.height = 22;
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE16463' } };
    });
  }

  private writeTotalRow(row: Row) {
    row.font = { bold: true };
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDECEC' } };
    });
  }

  private borderRows(sheet: Worksheet, fromRow: number, toRow: number) {
    for (let r = fromRow; r <= toRow; r++) {
      const row = sheet.getRow(r);
      if (!row.hasValues) continue;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        };
      });
    }
  }
}

const formatDate = (value: string) => value.split('-').reverse().join('/');
