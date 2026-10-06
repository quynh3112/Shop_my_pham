import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { Address } from '../address/entity/address.entity';
import { Cart } from '../cart/entity/cart.entity';
import { CartItem } from '../cartitem/entity/cart_item.entity';
import { InventoryMovementService } from '../inventory_movement/inventory_movement.service';
import {
  AuditActorType,
  OrderHistoryType,
  OrderStatusHistory,
} from '../order_status_history/entity/order_status_history';
import { OrderItem } from '../order_item/entity/order-item.entity';
import { PaymentProviderRegistry } from '../payment/payment-provider.registry';
import { ProductVariant } from '../productvariant/entity/produc_variant.entity';
import { AdminOrderListQueryDto, OrderBuyNowDto, OrderCreateDto, OrderListQueryDto } from './dto/order.dto';
import { Order, PaymentMethod, PaymentStatus } from './entity/order.entity';
import { OrderStatus } from 'src/until/order_status';

type NewOrderLine = Omit<
  Pick<
    OrderItem,
    | 'productId'
    | 'variantId'
    | 'productName'
    | 'productImage'
    | 'variantName'
    | 'variantSize'
    | 'unitPrice'
    | 'quantity'
    | 'lineTotal'
  >,
  'variantId'
> & { variantId: number };

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

export const ADMIN_TRANSITIONS: TransitionMap = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const CUSTOMER_TRANSITIONS: TransitionMap = {
  [OrderStatus.PENDING]: [OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [],
  [OrderStatus.PROCESSING]: [],
  [OrderStatus.SHIPPING]: [],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

function buildOrderCode(id: number, createdAt: Date): string {
  const yyyymmdd = [
    createdAt.getFullYear(),
    String(createdAt.getMonth() + 1).padStart(2, '0'),
    String(createdAt.getDate()).padStart(2, '0'),
  ].join('');
  return `DH${yyyymmdd}-${String(id).padStart(5, '0')}`;
}

type TransitionRequest =
  | {
      actorType: AuditActorType.CUSTOMER;
      actorUserId: number;
      code: string;
      next: OrderStatus.CANCELLED;
    }
  | {
      actorType: AuditActorType.ADMIN;
      actorUserId: number;
      orderId: number;
      next: OrderStatus;
    };

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly inventoryService: InventoryMovementService,
    private readonly paymentProviders: PaymentProviderRegistry,
  ) {}

  async createOrder(userId: number, input: OrderCreateDto) {
    return this.createOrderFromItems(userId, input, async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { userId },
        relations: ['items', 'items.variant', 'items.variant.product'],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Giỏ hàng đang trống.');
      }

      const items = cart.items.map(({ variant, quantity }) => {
        const product = variant.product;
        if (!product.isActive) {
          throw new ConflictException(
            `"${product.name}" đã ngừng bán. Vui lòng bỏ khỏi giỏ hàng rồi đặt lại.`,
          );
        }

        const unitPrice = Number(product.price);
        return {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          productImage: product.images?.[0]?.thumbUrl ?? '',
          variantName: variant.name,
          variantSize: variant.size,
          unitPrice,
          quantity,
          lineTotal: unitPrice * quantity,
        };
      });

      return { items, cartId: cart.id };
    });
  }

  async buyNowOrder(userId: number, input: OrderBuyNowDto) {
    if (
      !Number.isInteger(input.variantId) ||
      input.variantId <= 0 ||
      !Number.isInteger(input.quantity) ||
      input.quantity <= 0
    ) {
      throw new BadRequestException('Biến thể và số lượng không hợp lệ.');
    }

    return this.createOrderFromItems(userId, input, async (manager) => {
      const variant = await manager.findOne(ProductVariant, {
        where: { id: input.variantId },
        relations: { product: { images: true } },
      });

      if (!variant || !variant.product.isActive) {
        throw new NotFoundException('Không tìm thấy sản phẩm đang bán này.');
      }

      const product = variant.product;
      const unitPrice = Number(product.price);
      return {
        items: [
          {
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            productImage: product.images?.[0]?.thumbUrl ?? '',
            variantName: variant.name,
            variantSize: variant.size,
            unitPrice,
            quantity: input.quantity,
            lineTotal: unitPrice * input.quantity,
          },
        ],
      };
    });
  }

  private async createOrderFromItems(
    userId: number,
    input: OrderCreateDto,
    resolveItems: (
      manager: EntityManager,
    ) => Promise<{ items: NewOrderLine[]; cartId?: number }>,
  ) {
    const paymentMethod = (input.paymentMethod ?? PaymentMethod.COD) as PaymentMethod;
    const provider = this.paymentProviders.get(paymentMethod);

    if (!provider.implemented) {
      throw new HttpException(
        `Phương thức thanh toán ${paymentMethod} chưa được đấu nối. Vui lòng chọn thanh toán khi nhận hàng (COD).`,
        HttpStatus.NOT_IMPLEMENTED,
      );
    }

    let order = await this.dataSource.transaction(async (manager) => {
      const address = await manager.findOne(Address, {
        where: { id: input.addressId, user: { id: userId } },
        relations: ['user'],
      });

      if (!address) {
        throw new BadRequestException('Không tìm thấy địa chỉ giao hàng này.');
      }

      const { items, cartId } = await resolveItems(manager);
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const shippingFee = Number(process.env.SHIPPING_FEE ?? 0);

      const created = manager.create(Order, {
        code: `tmp-${randomBytes(8).toString('hex')}`,
        userId,
        paymentMethod,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        receiverName: address.fullname,
        receiverPhone: address.phone,
        shippingLine1: address.line,
        shippingWard: address.ward,
        shippingDistrict: address.district,
        shippingProvince: address.province,
        note: input.note ?? null,
      });

      const savedOrder = await manager.save(created);
      const savedItems: OrderItem[] = [];
      for (const itemData of items) {
        const orderItem = manager.create(OrderItem, {
          ...itemData,
          orderId: savedOrder.id,
        });
        savedItems.push(await manager.save(orderItem));
      }

      for (const orderItem of savedItems.sort(
        (left, right) => (left.variantId ?? 0) - (right.variantId ?? 0),
      )) {
        if (orderItem.variantId === null) {
          throw new Error(`Order item ${orderItem.id} is missing its variant.`);
        }
        await this.inventoryService.reserveOrderItem(manager, {
          orderId: savedOrder.id,
          orderItemId: orderItem.id,
          variantId: orderItem.variantId,
          productName: orderItem.productName,
          name: orderItem.variantName ?? orderItem.productName,
          size: orderItem.variantSize,
          quantity: orderItem.quantity,
          actor: { type: AuditActorType.CUSTOMER, userId },
        });
      }

      await manager.save(
        manager.create(OrderStatusHistory, {
          orderId: savedOrder.id,
          type: OrderHistoryType.STATUS_CHANGE,
          fromStatus: null,
          toStatus: OrderStatus.PENDING,
          actorType: AuditActorType.CUSTOMER,
          actorUserId: userId,
          occurredAt: savedOrder.createdAt,
          operationKey: `ORDER_CREATED:${savedOrder.id}`,
        }),
      );

      if (cartId !== undefined) {
        await manager.delete(CartItem, { cartId });
      }

      await manager.update(Order, savedOrder.id, {
        code: buildOrderCode(savedOrder.id, savedOrder.createdAt),
      });

      return this.getOrderDetailByIdInternal(manager, savedOrder.id);
    });

    const payment = await provider.initiate({
      code: order.code,
      total: order.total,
      description: `Thanh toan don hang ${order.code}`,
    });

    if (payment.paymentStatus !== order.paymentStatus) {
      await this.orderRepo.update(order.id, {
        paymentStatus: payment.paymentStatus as PaymentStatus,
      });
      order = await this.getOrderDetailById(order.id);
    }

    return order;
  }

  private async getOrderDetailByIdInternal(manager: EntityManager, id: number) {
    const order = await manager.findOne(Order, {
      where: { id },
      relations: ['items', 'statusHistory'],
      order: { items: { id: 'ASC' }, statusHistory: { recordedAt: 'ASC' } },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng này.');
    }

    return order;
  }

  private async getOrderDetailById(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'statusHistory'],
      order: { items: { id: 'ASC' }, statusHistory: { recordedAt: 'ASC' } },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng này.');
    }

    return order;
  }

  async listMyOrders(userId: number, query: OrderListQueryDto) {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId });

    if (query.status !== undefined) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    qb.orderBy('order.createdAt', 'DESC');

    const total = await qb.clone().select('order.id').distinct(true).getCount();
    const items = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getMany();

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getMyOrder(userId: number, code: string) {
    const order = await this.orderRepo.findOne({
      where: { code },
      relations: ['items', 'statusHistory'],
      order: { items: { id: 'ASC' }, statusHistory: { recordedAt: 'ASC' } },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Không tìm thấy đơn hàng này.');
    }

    return order;
  }

  private async transitionOrderStatus(request: TransitionRequest) {
    const current =
      request.actorType === AuditActorType.CUSTOMER
        ? await this.orderRepo.findOne({ where: { code: request.code } })
        : await this.orderRepo.findOne({ where: { id: request.orderId } });

    if (
      !current ||
      (request.actorType === AuditActorType.CUSTOMER && current.userId !== request.actorUserId)
    ) {
      throw new NotFoundException('Không tìm thấy đơn hàng này.');
    }

    const next = request.next;
    if (current.status === next) {
      if (next === OrderStatus.CANCELLED) {
        const order = await this.getOrderDetailById(current.id);
        return { order, replayed: true };
      }
      throw new ConflictException(`Đơn hàng đang ở trạng thái "${STATUS_LABEL[next]}".`);
    }

    const allowed =
      request.actorType === AuditActorType.CUSTOMER
        ? CUSTOMER_TRANSITIONS[current.status]
        : ADMIN_TRANSITIONS[current.status];

    if (!allowed.includes(next)) {
      if (request.actorType === AuditActorType.CUSTOMER) {
        throw new ConflictException(
          `Đơn hàng ${STATUS_LABEL[current.status]} nên không thể tự huỷ. Vui lòng liên hệ cửa hàng.`,
        );
      }
      throw new ConflictException(
        `Không thể chuyển đơn từ "${STATUS_LABEL[current.status]}" sang "${STATUS_LABEL[next]}".`,
      );
    }

    const transitioned = await this.dataSource.transaction(async (manager) => {
      const patch: Partial<Order> = { status: next };
      if (next === OrderStatus.DELIVERED && current.paymentMethod === PaymentMethod.COD) {
        patch.paymentStatus = PaymentStatus.PAID;
      }

      const result = await manager
        .createQueryBuilder()
        .update(Order)
        .set(patch)
        .where('id = :id AND status = :status', { id: current.id, status: current.status })
        .execute();

      if (result.affected === 0) return null;

      if (next === OrderStatus.CANCELLED) {
        await this.inventoryService.restoreOrderInventory(manager, {
          orderId: current.id,
          actor: { type: request.actorType, userId: request.actorUserId },
        });
      }

      await manager.save(
        manager.create(OrderStatusHistory, {
          orderId: current.id,
          type: OrderHistoryType.STATUS_CHANGE,
          fromStatus: current.status,
          toStatus: next,
          actorType: request.actorType,
          actorUserId: request.actorUserId,
          occurredAt: new Date(),
          operationKey: `ORDER_TRANSITION:${current.id}:${current.status}:${next}`,
        }),
      );

      return this.getOrderDetailByIdInternal(manager, current.id);
    });

    if (transitioned) return { order: transitioned, replayed: false };

    const latest = await this.getOrderDetailById(current.id);
    if (next === OrderStatus.CANCELLED && latest.status === OrderStatus.CANCELLED) {
      return { order: latest, replayed: true };
    }

    throw new ConflictException(
      'Trạng thái đơn đã thay đổi bởi thao tác khác. Vui lòng tải lại trước khi tiếp tục.',
    );
  }

  cancelMyOrder(userId: number, code: string) {
    return this.transitionOrderStatus({
      actorType: AuditActorType.CUSTOMER,
      actorUserId: userId,
      code,
      next: OrderStatus.CANCELLED,
    });
  }

  async listAllOrders(query: AdminOrderListQueryDto) {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user');

    if (query.status !== undefined) {
      qb.andWhere('order.status = :status', { status: query.status });
    }
    if (query.paymentStatus !== undefined) {
      qb.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: query.paymentStatus });
    }
    if (query.paymentMethod !== undefined) {
      qb.andWhere('order.paymentMethod = :paymentMethod', { paymentMethod: query.paymentMethod });
    }

    if (query.search) {
      qb.andWhere(
        '(order.code LIKE :search OR order.receiverName LIKE :search OR user.fullName LIKE :search OR user.email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.from !== undefined) {
      qb.andWhere('order.createdAt >= :from', { from: `${query.from} 00:00:00` });
    }
    if (query.to !== undefined) {
      qb.andWhere('order.createdAt <= :to', { to: `${query.to} 23:59:59.999` });
    }

    qb.orderBy('order.createdAt', 'DESC');

    const total = await qb.clone().select('order.id').distinct(true).getCount();
    const items = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getMany();

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getOrderByCode(code: string) {
    const order = await this.orderRepo.findOne({
      where: { code },
      relations: ['items', 'statusHistory', 'user'],
      order: { items: { id: 'ASC' }, statusHistory: { recordedAt: 'ASC' } },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng này.');
    }

    return order;
  }

  updateOrderStatus(orderId: number, next: OrderStatus, adminUserId: number) {
    return this.transitionOrderStatus({
      actorType: AuditActorType.ADMIN,
      actorUserId: adminUserId,
      orderId,
      next,
    });
  }

  async updatePaymentStatus(orderId: number, next: PaymentStatus) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng này.');

    if (order.status === OrderStatus.CANCELLED && next === PaymentStatus.PAID) {
      throw new ConflictException('Đơn đã huỷ nên không đánh dấu đã thanh toán được.');
    }

    if (order.paymentStatus === next) {
      throw new ConflictException('Tình trạng thanh toán không đổi.');
    }

    await this.orderRepo.update(order.id, { paymentStatus: next });
    return this.getOrderDetailById(order.id);
  }
}
  




