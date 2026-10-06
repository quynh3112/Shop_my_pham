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
} from '@nestjs/common';
import { Role } from '../user/entity/user.entity';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { RoleGuard } from '../guard/role.guard';
import {
  AdminOrderListQueryDto,
  OrderBuyNowDto,
  OrderCreateDto,
  OrderListQueryDto,
  OrderStatusDto,
  PaymentStatusDto,
} from './dto/order.dto';
import { OrderService } from './order.service';

interface AuthenticatedRequest {
  user: {
    userId: number;
    role: Role;
  };
}

@Controller('order')
@UseGuards(JwtAuthGuard)
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

  @Patch('my/:code/cancel')
  cancelMyOrder(@Param('code') code: string, @Req() request: AuthenticatedRequest) {
    return this.orderService.cancelMyOrder(request.user.userId, code);
  }

  @Get('admin')
  @UseGuards(RoleGuard)
  listAllOrders(@Query() query: AdminOrderListQueryDto) {
    return this.orderService.listAllOrders(query);
  }

  @Get('admin/:code')
  @UseGuards(RoleGuard)
  getOrderByCode(@Param('code') code: string) {
    return this.orderService.getOrderByCode(code);
  }

  @Patch('admin/:id/status')
  @UseGuards(RoleGuard)
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: OrderStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.updateOrderStatus(id, body.status, request.user.userId);
  }

  @Patch('admin/:id/payment-status')
  @UseGuards(RoleGuard)
  updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PaymentStatusDto,
  ) {
    return this.orderService.updatePaymentStatus(id, body.paymentStatus);
  }
}
