import { Module } from '@nestjs/common';
import { ProductimageService } from './productimage.service';
import { ProductimageController } from './productimage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImage } from './entity/product_image.entity';

@Module({
  providers: [ProductimageService],
  controllers: [ProductimageController],
  imports:[TypeOrmModule.forFeature([ProductImage])]
})
export class ProductimageModule {}
