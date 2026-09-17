import { Test, TestingModule } from '@nestjs/testing';
import { CartitemController } from './cartitem.controller';

describe('CartitemController', () => {
  let controller: CartitemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartitemController],
    }).compile();

    controller = module.get<CartitemController>(CartitemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
