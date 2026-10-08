import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../order/entity/order.entity';
import { OrderItem } from '../order_item/entity/order-item.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { Review } from './entity/review.entity';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const repositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: repositoryMock },
        { provide: getRepositoryToken(User), useValue: repositoryMock },
        { provide: getRepositoryToken(Product), useValue: repositoryMock },
        { provide: getRepositoryToken(OrderItem), useValue: repositoryMock },
        { provide: getRepositoryToken(Order), useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
