import { Module } from '@nestjs/common';
import { ProductvariantService } from './productvariant.service';
import { ProductvariantController } from './productvariant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariant } from './entity/produc_variant.entity';

@Module({
  providers: [ProductvariantService],
  controllers: [ProductvariantController],
  imports:[TypeOrmModule.forFeature([ProductVariant])]
})
export class ProductvariantModule {}
