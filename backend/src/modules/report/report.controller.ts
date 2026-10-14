import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionGuard } from '../guard/permission.guard';
import { RequirePermission } from '../guard/require-permission.decorator';
import {
  FullReportQueryDto,
  MonthlyRevenueQueryDto,
  ProductSalesQueryDto,
} from './dto/report.dto';
import { ReportService } from './report.service';

@RequirePermission('reports')
@Controller('report')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('overview')
  getOverview(@Query() query: ProductSalesQueryDto) {
    return this.reportService.getOverview(query);
  }

  @Get('revenue/monthly')
  getMonthlyRevenue(@Query() query: MonthlyRevenueQueryDto) {
    return this.reportService.getMonthlyRevenue(query);
  }

  @Get('revenue/yearly')
  getYearlyRevenue() {
    return this.reportService.getYearlyRevenue();
  }

  @Get('export')
  async exportFullReport(@Query() query: FullReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportService.exportFullReport(query);
    this.sendExcel(res, buffer, 'bao-cao-thong-ke');
  }

  @Get('products')
  getProductSales(@Query() query: ProductSalesQueryDto) {
    return this.reportService.getProductSales(query);
  }

  @Get('products/export')
  async exportProductSales(
    @Query() query: ProductSalesQueryDto,
    @Res() res: Response,
  ) {
    const buffer = await this.reportService.exportProductSales(query);
    this.sendExcel(res, buffer, 'bao-cao-doanh-thu-san-pham');
  }

  private sendExcel(res: Response, buffer: Buffer, name: string) {
    const fileName = `${name}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });
    res.send(buffer);
  }
}
