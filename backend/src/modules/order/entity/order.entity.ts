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
import { User } from 'src/modules/user/entity/user.entity';
import { InventoryMovement } from 'src/modules/inventory_movement/entity/inventory_movement.entity';
import { OrderStatusHistory } from 'src/modules/order_status_history/entity/order_status_history';
import { OrderItem } from 'src/modules/order_item/entity/order-item.entity';
import { OrderStatus } from 'src/until/order_status';


export enum PaymentMethod {
  COD = 'COD',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

@Entity('orders')
@Index(['userId', 'createdAt'])
@Index(['status'])
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 32, unique: true })
  code!: string;

  @Column({ type: 'integer' })
  userId!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus!: PaymentStatus;

  @Column({ type: 'integer' })
  subtotal!: number;

  @Column({ type: 'integer', default: 0 })
  shippingFee!: number;

  @Column({ type: 'integer' })
  total!: number;

  @Column({ type: 'varchar', length: 120 })
  receiverName!: string;

  @Column({ type: 'varchar', length: 20 })
  receiverPhone!: string;

  @Column({ type: 'varchar', length: 255 })
  shippingLine1!: string;

  @Column({ type: 'varchar', length: 120 })
  shippingWard!: string;

  @Column({ type: 'varchar', length: 120 })
  shippingDistrict!: string;

  @Column({ type: 'varchar', length: 120 })
  shippingProvince!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order)
  statusHistory!: OrderStatusHistory[];

  @OneToMany(() => InventoryMovement, (movement) => movement.order)
  inventoryMovements!: InventoryMovement[];
}