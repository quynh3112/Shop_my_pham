import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entity/user.entity';
import { OrderStatus } from 'src/until/order_status';
import { Order } from 'src/modules/order/entity/order.entity';

export enum OrderHistoryType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  NOTE = 'NOTE',
}

export enum AuditActorType {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

@Entity('order_status_history')
@Index(['orderId', 'recordedAt', 'id'])
@Index(['actorUserId'])
export class OrderStatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  orderId!: number;

  @Column({
    type: 'enum',
    enum: OrderHistoryType,
  })
  type!: OrderHistoryType;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    nullable: true,
  })
  fromStatus!: OrderStatus | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
  })
  toStatus!: OrderStatus;

  @Column({
    type: 'enum',
    enum: AuditActorType,
  })
  actorType!: AuditActorType;

  @Column({
    type: 'integer',
    nullable: true,
  })
  actorUserId!: number | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  reason!: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  occurredAt!: Date | null;

  @CreateDateColumn()
  recordedAt!: Date;

  @Column({
    type: 'varchar',
    length: 191,
    unique: true,
  })
  operationKey!: string;

  @ManyToOne(() => Order, (order) => order.statusHistory, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'actorUserId' })
  actor!: User | null;
}