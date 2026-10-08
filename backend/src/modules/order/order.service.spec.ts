import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InventoryMovementService } from '../inventory_movement/inventory_movement.service';
import { PaymentProviderRegistry } from '../payment/payment-provider.registry';
import { Order } from './entity/order.entity';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {},
        },
        { provide: InventoryMovementService, useValue: {} },
        { provide: PaymentProviderRegistry, useValue: {} },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
