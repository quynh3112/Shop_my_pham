import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditActorType } from '../order_status_history/entity/order_status_history';
import { EntityManager } from 'typeorm';
import { OrderItem } from '../order_item/entity/order-item.entity';
import { ProductVariant } from '../productvariant/entity/produc_variant.entity';
import {
  InventoryMovement,
  InventoryMovementType,
} from './entity/inventory_movement.entity';
export interface Actor {
  type: AuditActorType;
  userId?: number;
}

function actorData(actor: Actor) {
  return {
    actorType: actor.type,
    actorUserId: actor.userId ?? undefined,
  };
}
@Injectable()
export class InventoryMovementService {
  async createVariantWithInitialStock(
    manager: EntityManager,
    input: {
      productId: number;
      productName: string;
      name: string;
      size: string | null;
      initialStock: number;
      actor: Actor;
    },
  ): Promise<ProductVariant> {
    const variant = manager.create(ProductVariant, {
      productId: input.productId,
      name: input.name,
      size: input.size ?? undefined,
      stock: input.initialStock,
    });
    const saved = await manager.save(variant);
    await manager.save(
      manager.create(InventoryMovement, {
        variantId: saved.id,
        productNameSnapshot: input.productName,
        variantNameSnapshot: saved.name,
        sizeSnapshot: saved.size,
        type: InventoryMovementType.IN,
        beforeStock: 0,
        afterStock: saved.stock,
        delta: saved.stock,
        ...actorData(input.actor),
        reason: 'Khởi tạo biến thể mới',
        operationKey: `INITIAL_STOCK:${saved.id}`,
      }),
    );
    return saved;
  }
  async reserveOrderItem(
    manager: EntityManager,
    input: {
      orderId: number;
      orderItemId: number;
      variantId: number;
      productName: string;
      name: string;
      size: string | null;
      quantity: number;
      actor: Actor;
    },
  ): Promise<void> {
    const result = await manager
      .createQueryBuilder()
      .update(ProductVariant)
      .set({ stock: () => `stock - ${input.quantity}` })
      .where('id = :id AND stock >= :quantity', {
        id: input.variantId,
        quantity: input.quantity,
      })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException(
        `"${input.productName} (${input.name}${input.size ? ', ' + input.size : ''})" vừa hết hàng hoặc không còn đủ số lượng bạn chọn. Vui lòng kiểm tra lại giỏ hàng.`,
      );
    }
    const variant = await manager.findOneOrFail(ProductVariant, {
      where: { id: input.variantId },
      select: ['stock'],
    });
    await manager.save(
      manager.create(InventoryMovement, {
        variantId: input.variantId,
        productNameSnapshot: input.productName,
        variantNameSnapshot: input.name,
        sizeSnapshot: input.size,
        type: InventoryMovementType.OUT,
        beforeStock: variant.stock + input.quantity,
        afterStock: variant.stock,
        delta: -input.quantity,
        orderId: input.orderId,
        ...actorData(input.actor),
        reason: 'Giữ hàng cho đơn',
        operationKey: `ORDER_RESERVED:${input.orderItemId}`,
      }),
    );
  }
  async restoreOrderInventory(
    manager: EntityManager,
    input: { orderId: number; actor: Actor },
  ): Promise<void> {
    const items = await manager.find(OrderItem, {
      where: { orderId: input.orderId },
    });
    for (const item of items) {
      if (item.variantId == null) continue;

      const variant = await manager
        .createQueryBuilder()
        .update(ProductVariant)
        .set({ stock: () => `stock + ${item.quantity}` })
        .where('id = :id', { id: item.variantId })
        .execute();

      if (variant.affected === 0) continue; // biến thể đã bị xoá hẳn, không còn gì để hoàn

      const updated = await manager.findOneOrFail(ProductVariant, {
        where: { id: item.variantId },
        select: ['stock', 'name', 'size'],
      });
      await manager.save(
        manager.create(InventoryMovement, {
          variantId: item.variantId,
          productNameSnapshot: (item as any).productName ?? updated.name,
          variantNameSnapshot: (item as any).variantName ?? updated.name,
          sizeSnapshot: (item as any).size ?? updated.size,
          type: InventoryMovementType.RETURN,
          beforeStock: updated.stock - item.quantity,
          afterStock: updated.stock,
          delta: item.quantity,
          orderId: input.orderId,
          ...actorData(input.actor),
          reason: 'Hoàn kho do đơn bị huỷ',
          operationKey: `ORDER_RESTORED:${item.id}`,
        }),
      );
    }
  }
  async adjustVariantStock(
    manager: EntityManager,
    input: {
      variantId: number;
      stock: number;
      expectedStock: number;
      reason: string;
      actor: Actor;
    },
  ): Promise<{ variant: ProductVariant; movement: InventoryMovement }> {
    const result = await manager
      .createQueryBuilder()
      .update(ProductVariant)
      .set({ stock: input.stock })
      .where('id = :id AND stock = :expected', {
        id: input.variantId,
        expected: input.expectedStock,
      })
      .execute();

    if (result.affected === 0) {
      const current = await manager.findOne(ProductVariant, {
        where: { id: input.variantId },
      });
      if (!current)
        throw new NotFoundException('Không tìm thấy biến thể cần cập nhật.');
      throw new ConflictException(
        `Tồn kho đã thay đổi từ lúc bạn mở trang (hiện tại: ${current.stock}). Vui lòng kiểm tra lại trước khi ghi đè.`,
      );
    }

    const variant = await manager.findOneOrFail(ProductVariant, {
      where: { id: input.variantId },
      relations: ['product'],
    });
    const movement = await manager.save(
      manager.create(InventoryMovement, {
        variantId: variant.id,
        productNameSnapshot: variant.product?.name ?? '',
        variantNameSnapshot: variant.name,
        sizeSnapshot: variant.size,
        type: InventoryMovementType.ADJUSTMENT,
        beforeStock: input.expectedStock,
        afterStock: input.stock,
        delta: input.stock - input.expectedStock,
        ...actorData(input.actor),
        reason: input.reason,
        operationKey: `ADMIN_ADJUSTMENT:${variant.id}:${crypto.randomUUID()}`,
      }),
    );

    return { variant, movement };
  }
  async retireVariant(
    manager: EntityManager,
    input: { variantId: number; actor: Actor },
  ): Promise<void> {
    const rows: Array<{
      id: number;
      stock: number;
      name: string;
      size: string | null;
      productName: string;
    }> = await manager.query(
      `SELECT v.id, v.stock, v.name, v.size, p.name AS productName
         FROM product_variants v
         INNER JOIN product p ON p.id = v.productId
         WHERE v.id = ?
         FOR UPDATE`,
      [input.variantId],
    );
    const variant = rows[0];
    if (!variant)
      throw new NotFoundException('Không tìm thấy biến thể cần xoá.');

    if (variant.stock > 0) {
      throw new ConflictException(
        `Không thể xoá biến thể vẫn còn tồn kho (${variant.stock}). Hãy điều chỉnh tồn kho về 0 trước.`,
      );
    }

    await manager.save(
      manager.create(InventoryMovement, {
        variantId: variant.id,
        productNameSnapshot: variant.productName,
        variantNameSnapshot: variant.name,
        sizeSnapshot: variant.size,
        type: InventoryMovementType.ADJUSTMENT,
        beforeStock: 0,
        afterStock: 0,
        delta: 0,
        ...actorData(input.actor),
        reason: 'Ngừng bán biến thể',
        operationKey: `VARIANT_RETIRED:${variant.id}`,
      }),
    );

    await manager.delete(ProductVariant, variant.id);
  }
}
