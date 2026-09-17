import { Module } from '@nestjs/common';
import { CartitemService } from './cartitem.service';
import { CartitemController } from './cartitem.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from './entity/cart_item.entity';

@Module({
  providers: [CartitemService],
  controllers: [CartitemController],
  imports:[TypeOrmModule.forFeature([CartItem])]
})
export class CartitemModule {}
