import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entity/order.entity';
import { OrderItem } from '../order_item/entity/order-item.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { Review } from './entity/review.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Review, User, Product, Order, OrderItem])],
  providers: [ReviewsService],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
