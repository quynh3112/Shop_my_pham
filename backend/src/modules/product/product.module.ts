import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { ProductImage } from '../productimage/entity/product_image.entity';
import { ProductVariant } from '../productvariant/entity/produc_variant.entity';
import { Category } from '../category/entity/category.entity';
import { CategoryService } from '../category/category.service';
import { InventoryMovementService } from '../inventory_movement/inventory_movement.service';

@Module({
  providers: [ProductService, CategoryService, InventoryMovementService],
  controllers: [ProductController],
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, ProductVariant, Category]),
  ],
})
export class ProductModule {}
