import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '../user/entity/user.entity';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionGuard } from '../guard/permission.guard';
import { RequirePermission } from '../guard/require-permission.decorator';
import {
  AdminOrderListQueryDto,
  OrderBuyNowDto,
  OrderCreateDto,
  OrderListQueryDto,
  OrderStatusDto,
  MomoSandboxDto,
  PaymentStatusDto,
} from './dto/order.dto';
import { OrderService } from './order.service';

interface AuthenticatedRequest {
  user: {
    userId: number;
    role: Role;
  };
}

@RequirePermission('orders')
@Controller('order')
@UseGuards(JwtAuthGuard)
// transform: query page/limit là chuỗi -> số và lấy giá trị mặc định trong DTO
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@Body() body: OrderCreateDto, @Req() request: AuthenticatedRequest) {
    return this.orderService.createOrder(request.user.userId, body);
  }

  @Post('buy-now')
  buyNow(@Body() body: OrderBuyNowDto, @Req() request: AuthenticatedRequest) {
    return this.orderService.buyNowOrder(request.user.userId, body);
  }

  @Get('my')
  listMyOrders(
    @Query() query: OrderListQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.listMyOrders(request.user.userId, query);
  }

  @Get('my/:code')
  getMyOrder(@Param('code') code: string, @Req() request: AuthenticatedRequest) {
    return this.orderService.getMyOrder(request.user.userId, code);
  }

  /** MoMo giả lập: khách xác nhận / huỷ thanh toán trên trang thử nghiệm */
  @Post('my/:code/momo-sandbox')
  confirmMomoSandbox(
    @Param('code') code: string,
    @Body() body: MomoSandboxDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.confirmMomoSandbox(request.user.userId, code, body.success);
  }

  @Patch('my/:code/cancel')
  cancelMyOrder(@Param('code') code: string, @Req() request: AuthenticatedRequest) {
    return this.orderService.cancelMyOrder(request.user.userId, code);
  }

  @Get('admin')
  @UseGuards(PermissionGuard)
  listAllOrders(@Query() query: AdminOrderListQueryDto) {
    return this.orderService.listAllOrders(query);
  }

  @Get('admin/:code')
  @UseGuards(PermissionGuard)
  getOrderByCode(@Param('code') code: string) {
    return this.orderService.getOrderByCode(code);
  }

  @Patch('admin/:id/status')
  @UseGuards(PermissionGuard)
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: OrderStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.updateOrderStatus(id, body.status, request.user.userId);
  }

  @Patch('admin/:id/payment-status')
  @UseGuards(PermissionGuard)
  updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PaymentStatusDto,
  ) {
    return this.orderService.updatePaymentStatus(id, body.paymentStatus);
  }
}
