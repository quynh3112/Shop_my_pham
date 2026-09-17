import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entity/order.entity';
import { OrderStatus } from 'src/until/order_status';
import { InjectRepository } from '@nestjs/typeorm';
type StatusLabelMap = Record<OrderStatus, string>;
type TransitionMap = Record<OrderStatus, OrderStatus[]>;

export const STATUS_LABEL: StatusLabelMap = {
  [OrderStatus.PENDING]: 'Đang chờ xác nhận',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPING]: 'Đang giao hàng',
  [OrderStatus.DELIVERED]: 'Đã giao hàng',
  [OrderStatus.CANCELLED]: 'Đã hủy',
};

export const ADMIN_TRANSITION: TransitionMap = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const CUSTOMER_TRANSITION: TransitionMap = {
  [OrderStatus.PENDING]: [OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [],
  [OrderStatus.PROCESSING]: [],
  [OrderStatus.SHIPPING]: [],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

const ORDER_RELATIONS = { items: true } as const;
const ORDER_DETAIL_RELATIONS = { items: true, statusHistory: true } as const;
function sortOrderRelations(order: Order): Order {
  order.items?.sort((a, b) => a.id - b.id);
  order.statusHistory?.sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime() || a.id - b.id,
  );
  return order;
}
function buildOrderCode(id: number, createdAt: Date): string {
  const yyyymmdd = [
    createdAt.getFullYear(),
    String(createdAt.getMonth() + 1).padStart(2, '0'),
    String(createdAt.getDate()).padStart(2, '0'),
  ].join('');
  return `DH${yyyymmdd}-${String(id).padStart(5, '0')}`;
}

// type TransitionRequest =
//   | { actorType: ActorType.CUSTOMER; actorUserId: number; code: string; next: OrderStatus.CANCELLED }
//   | { actorType: ActorType.ADMIN; actorUserId: number; orderId: number; next: OrderStatus };
@Injectable()
export class OrderService {
    constructor(private readonly dataSource: DataSource,
         @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    ) {}    



}
