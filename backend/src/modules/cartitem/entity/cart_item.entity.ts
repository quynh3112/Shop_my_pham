import { Cart } from 'src/modules/cart/entity/cart.entity';
import { ProductVariant } from 'src/modules/productvariant/entity/produc_variant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';


@Entity('cart_items')
@Unique(['cartId', 'variantId'])
@Index(['variantId'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  cartId!: number;

  @Column()
  variantId!: number;

  @Column()
  quantity!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Nhiều CartItem thuộc 1 Cart
  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cartId' })
  cart!: Cart;

  // Nhiều CartItem có thể tham chiếu 1 Variant
  @ManyToOne(() => ProductVariant, (variant) => variant.cartItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variantId' })
  variant!: ProductVariant;
}