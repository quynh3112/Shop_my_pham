import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entity/cart.entity';
import { ProductVariant } from '../productvariant/entity/produc_variant.entity';
import { CartItem } from '../cartitem/entity/cart_item.entity';

@Module({
  providers: [CartService],
  controllers: [CartController],
  imports:[TypeOrmModule.forFeature([Cart,CartItem,ProductVariant])],
})
export class CartModule {}
