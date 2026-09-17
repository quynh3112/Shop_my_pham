import { Order } from 'src/modules/order/entity/order.entity';
import { AuditActorType } from 'src/modules/order_status_history/entity/order_status_history';
import { ProductVariant } from 'src/modules/productvariant/entity/produc_variant.entity';
import { User } from 'src/modules/user/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';



export enum InventoryMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
}

@Entity('inventory_movements')
@Index(['variantId', 'createdAt', 'id'])
@Index(['orderId'])
@Index(['actorUserId'])
export class InventoryMovement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  variantId!: number 

  // Snapshot thông tin sản phẩm tại thời điểm biến động
  @Column({ length: 255 })
  productNameSnapshot!: string;

  @Column({ length: 100, nullable: true })
  variantNameSnapshot!: string 
  @Column({ type: 'varchar', length: 50, nullable: true })
  sizeSnapshot!: string | null;

  @Column({
    type: 'enum',
    enum: InventoryMovementType,
  })
  type!: InventoryMovementType;

  @Column({ nullable: true })
  beforeStock!: number 

  @Column()
  afterStock!: number;

  @Column({ nullable: true })
  delta!: number 

  @Column({ nullable: true })
  orderId!: number 

  @Column({
    type: 'enum',
    enum: AuditActorType,
  })
  actorType!: AuditActorType;

  @Column({ nullable: true })
  actorUserId!: number 

  @Column({ length: 500, nullable: true })
  reason!: string 

  @Column({ unique: true, length: 191 })
  operationKey!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Variant có thể bị xóa nhưng lịch sử kho vẫn giữ
  @ManyToOne(
    () => ProductVariant,
    (variant) => variant.inventoryMovements,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'variantId' })
  variant!: ProductVariant 

  // Biến động có thể liên quan đến Order
  @ManyToOne(
    () => Order,
    (order) => order.inventoryMovements,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'orderId' })
  order!: Order 

  // Ai thực hiện biến động
  @ManyToOne(
    () => User,
    
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'actorUserId' })
  actor!: User 
}