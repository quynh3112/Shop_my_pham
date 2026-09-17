import { Test, TestingModule } from '@nestjs/testing';
import { ProductvariantController } from './productvariant.controller';

describe('ProductvariantController', () => {
  let controller: ProductvariantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductvariantController],
    }).compile();

    controller = module.get<ProductvariantController>(ProductvariantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
