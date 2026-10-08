import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { Favorite } from './entity/favorite.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [FavoritesService],
  controllers: [FavoritesController],
  imports: [TypeOrmModule.forFeature([Favorite])],
})
export class FavoritesModule {}
