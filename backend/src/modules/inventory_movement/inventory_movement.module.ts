import { Module } from '@nestjs/common';
import { InventoryMovementController } from './inventory_movement.controller';
import { InventoryMovementService } from './inventory_movement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovement } from './entity/inventory_movement.entity';

@Module({
  providers: [InventoryMovementService],
  controllers: [InventoryMovementController],
  imports:[TypeOrmModule.forFeature([InventoryMovement])]
})
export class InventoryMovementModule {}
