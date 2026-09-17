import { CartItem } from "src/modules/cartitem/entity/cart_item.entity";
import { InventoryMovement } from "src/modules/inventory_movement/entity/inventory_movement.entity";
import { OrderItem } from "src/modules/order_item/entity/order-item.entity";
import { Product } from "src/modules/product/entity/product.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity('product_variants')
@Unique(['productId', 'name', 'size'])
@Index(['productId'])
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  productId!: number;

  // Tên biến thể: "Đỏ đất", "Shade 01", "Mini", "Full Size",...
  @Column({ length: 100 })
  name!: string;

  // Dung tích/kích thước: "10ml", "30ml", "50ml",...
  @Column({ length: 50, nullable: true })
  size!: string 

  @Column({ default: 0 })
  stock!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @OneToMany(() => CartItem, (cartItem) => cartItem.variant)
  cartItems!: CartItem[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.variant)
  orderItems!: OrderItem[];

  @OneToMany(
    () => InventoryMovement,
    (inventoryMovement) => inventoryMovement.variant,
  )
  inventoryMovements!: InventoryMovement[];
}