import { Module } from '@nestjs/common';
import { InventoryMovementController } from './inventory_movement.controller';
import { InventoryMovementService } from './inventory_movement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovement } from './entity/inventory_movement.entity';
import { InventoryAdminService } from './inventory-admin.service';
import { CategoryService } from '../category/category.service';
import { Category } from '../category/entity/category.entity';
import { ProductVariant } from '../productvariant/entity/produc_variant.entity';

@Module({
  providers: [InventoryMovementService, InventoryAdminService, CategoryService],
  controllers: [InventoryMovementController],
  imports:[TypeOrmModule.forFeature([InventoryMovement, ProductVariant, Category])],
  exports:[InventoryMovementService]
})
export class InventoryMovementModule {}
