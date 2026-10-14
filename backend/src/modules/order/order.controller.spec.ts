import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from 'src/until/order_status';
import { Role } from '../user/entity/user.entity';
import { PaymentStatus } from './entity/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: jest.Mocked<
    Pick<
      OrderService,
      | 'createOrder'
      | 'buyNowOrder'
      | 'listMyOrders'
      | 'getMyOrder'
      | 'cancelMyOrder'
      | 'listAllOrders'
      | 'getOrderByCode'
      | 'updateOrderStatus'
      | 'updatePaymentStatus'
    >
  >;

  beforeEach(async () => {
    orderService = {
      createOrder: jest.fn(),
      buyNowOrder: jest.fn(),
      listMyOrders: jest.fn(),
      getMyOrder: jest.fn(),
      cancelMyOrder: jest.fn(),
      listAllOrders: jest.fn(),
      getOrderByCode: jest.fn(),
      updateOrderStatus: jest.fn(),
      updatePaymentStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: orderService }],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('routes customer requests to their order service methods', () => {
    const request = { user: { userId: 12, role: Role.USER } };
    const query = { page: 1, limit: 10 };
    const createInput = { addressId: 4, paymentMethod: 'COD' as const };
    const buyNowInput = {
      addressId: 4,
      variantId: 6,
      quantity: 2,
      paymentMethod: 'COD' as const,
    };

    controller.createOrder(createInput, request);
    controller.buyNow(buyNowInput, request);
    controller.listMyOrders(query, request);
    controller.getMyOrder('DH20260101-00001', request);
    controller.cancelMyOrder('DH20260101-00001', request);

    expect(orderService.createOrder).toHaveBeenCalledWith(12, createInput);
    expect(orderService.buyNowOrder).toHaveBeenCalledWith(12, buyNowInput);
    expect(orderService.listMyOrders).toHaveBeenCalledWith(12, query);
    expect(orderService.getMyOrder).toHaveBeenCalledWith(12, 'DH20260101-00001');
    expect(orderService.cancelMyOrder).toHaveBeenCalledWith(12, 'DH20260101-00001');
  });

  it('routes admin requests to their order service methods', () => {
    const request = { user: { userId: 2, role: Role.ADMIN } };
    const query = { page: 1, limit: 10 };
    const statusInput = { status: OrderStatus.CONFIRMED };
    const paymentInput = { paymentStatus: PaymentStatus.PAID };

    controller.listAllOrders(query);
    controller.getOrderByCode('DH20260101-00001');
    controller.updateOrderStatus(5, statusInput, request);
    controller.updatePaymentStatus(5, paymentInput);

    expect(orderService.listAllOrders).toHaveBeenCalledWith(query);
    expect(orderService.getOrderByCode).toHaveBeenCalledWith('DH20260101-00001');
    expect(orderService.updateOrderStatus).toHaveBeenCalledWith(5, 'CONFIRMED', 2);
    expect(orderService.updatePaymentStatus).toHaveBeenCalledWith(5, 'PAID');
  });
});
