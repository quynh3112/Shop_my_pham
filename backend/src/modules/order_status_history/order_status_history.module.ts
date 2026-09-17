import { Module } from '@nestjs/common';
import { OrderStatusHistoryService } from './order_status_history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderStatusHistory } from './entity/order_status_history';

@Module({
  providers: [OrderStatusHistoryService],
  controllers: [],
  imports:[TypeOrmModule.forFeature([OrderStatusHistory])]

})
export class OrderStatusHistoryModule {}
