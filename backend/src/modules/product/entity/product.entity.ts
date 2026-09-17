import { Category } from 'src/modules/category/entity/category.entity';
import { OrderItem } from 'src/modules/order_item/entity/order-item.entity';
import { ProductImage } from 'src/modules/productimage/entity/product_image.entity';
import { ProductVariant } from 'src/modules/productvariant/entity/produc_variant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
@Index(['isActive', 'createdAt'])
@Index(['price'])
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ unique: true, length: 191 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  // VND
  @Column()
  price!: number;

  @Index()
  @Column()
  categoryId!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // N Product thuộc 1 Category
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  // 1 Product có nhiều ảnh
  @OneToMany(() => ProductImage, (image) => image.product)
  images!: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants!: ProductVariant[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems!: OrderItem[];
}
