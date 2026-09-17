import { Order } from 'src/modules/order/entity/order.entity';
import { Product } from 'src/modules/product/entity/product.entity';
import { ProductVariant } from 'src/modules/productvariant/entity/produc_variant.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';


@Entity('order_items')
@Index(['orderId'])
@Index(['productId'])
@Index(['variantId'])
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  orderId!: number;

  // Có thể null nếu sản phẩm đã bị xóa
  @Column({ nullable: true })
  productId!: number | null;

  // Có thể null nếu variant đã bị xóa
  @Column({ nullable: true })
  variantId!: number | null;

  // Snapshot tại thời điểm mua
  @Column({ length: 255 })
  productName!: string;

  @Column({ length: 500, nullable: true })
  productImage!: string

  // Ví dụ: "Đỏ đất", "Shade 01"
  @Column({ length: 100, nullable: true })
  variantName!: string

  // Ví dụ: "30ml", "50ml"
  @Column({ length: 50, nullable: true })
  variantSize!: string

  // Đơn giá tại thời điểm mua
  @Column()
  unitPrice!: number;

  @Column()
  quantity!: number;

  // unitPrice * quantity
  @Column()
  lineTotal!: number;

  // Nhiều OrderItem thuộc 1 Order
  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  // Nhiều OrderItem có thể tham chiếu 1 Product
  @ManyToOne(() => Product, (product) => product.orderItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'productId' })
  product!: Product 
  // Nhiều OrderItem có thể tham chiếu 1 Variant
  @ManyToOne(() => ProductVariant, (variant) => variant.orderItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'variantId' })
  variant!: ProductVariant 
}