import { Test, TestingModule } from '@nestjs/testing';
import { InventoryMovementController } from './inventory_movement.controller';

describe('InventoryMovementController', () => {
  let controller: InventoryMovementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryMovementController],
    }).compile();

    controller = module.get<InventoryMovementController>(InventoryMovementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
