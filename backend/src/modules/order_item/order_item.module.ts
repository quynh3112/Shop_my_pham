import { Module } from '@nestjs/common';
import { OrderItemService } from './order_item.service';
import { OrderItemController } from './order_item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from './entity/order-item.entity';

@Module({
  providers: [OrderItemService],
  controllers: [OrderItemController],
  imports:[TypeOrmModule.forFeature([OrderItem])]
})
export class OrderItemModule {}
