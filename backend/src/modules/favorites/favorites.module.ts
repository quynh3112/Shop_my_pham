import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entity/product.entity';
import { Review } from '../reviews/entity/review.entity';
import { User } from '../user/entity/user.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { Favorite } from './entity/favorite.entity';

@Module({
  providers: [FavoritesService],
  controllers: [FavoritesController],
  imports: [TypeOrmModule.forFeature([Favorite, User, Product, Review])],
})
export class FavoritesModule {}
