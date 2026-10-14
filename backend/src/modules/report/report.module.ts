import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entity/order.entity';
import { OrderItem } from '../order_item/entity/order-item.entity';
import { User } from '../user/entity/user.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem, Order, User])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
