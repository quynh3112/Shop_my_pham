import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entity/favorite.entity';
import { Product } from '../product/entity/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Product])],
  providers: [FavoritesService],
  controllers: [FavoritesController]
})
export class FavoritesModule {}
