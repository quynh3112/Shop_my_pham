import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entity/order.entity';
import { InventoryMovement } from '../inventory_movement/entity/inventory_movement.entity';
import { PaymentProviderRegistry } from '../payment/payment-provider.registry';
import { InventoryMovementService } from '../inventory_movement/inventory_movement.service';
import { InventoryMovementModule } from '../inventory_movement/inventory_movement.module';
import { PaymentModule } from '../payment/payment.module';
import { RoleGuard } from '../guard/role.guard';

@Module({
  controllers: [OrderController],
  providers: [OrderService, RoleGuard],
  imports:[TypeOrmModule.forFeature([Order]),InventoryMovementModule,PaymentModule],
  
})
export class OrderModule {}
