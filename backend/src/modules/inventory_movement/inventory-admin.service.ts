import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { AuditActorType } from '../order_status_history/entity/order_status_history';
import { ProductVariant } from '../productvariant/entity/produc_variant.entity';
import { CategoryService } from '../category/category.service';
import {
  AdjustStockDto,
  MovementListQueryDto,
  ReceiveStockDto,
  StockListQueryDto,
} from './dto/inventory.dto';
import {
  InventoryMovement,
  InventoryMovementType,
} from './entity/inventory_movement.entity';
import { InventoryMovementService } from './inventory_movement.service';

const paginate = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/** Màn hình quản lý kho cho admin: xem tồn, nhập hàng, kiểm kho, lịch sử */
@Injectable()
export class InventoryAdminService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryMovementService,
    private readonly categoryService: CategoryService,
  ) {}

  /** Tồn kho theo từng biến thể + số liệu tổng quan */
  async listStock(query: StockListQueryDto) {
    const qb = this.dataSource
      .getRepository(ProductVariant)
      .createQueryBuilder('v')
      .innerJoin('v.product', 'p')
      .leftJoin('p.category', 'c');

    if (query.search) {
      qb.andWhere('(p.name ILIKE :search OR v.name ILIKE :search OR v.size ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.categoryId !== undefined) {
      const categoryIds = await this.categoryService.descendantCategoryIds(query.categoryId);
      qb.andWhere('p.categoryId IN (:...categoryIds)', { categoryIds });
    }

    // Tổng quan tính trên bộ lọc tìm kiếm / danh mục, chưa lọc theo trạng thái tồn
    const summaryRow = await qb
      .clone()
      .select('COUNT(v.id)', 'variantCount')
      .addSelect('COALESCE(SUM(v.stock), 0)', 'totalUnits')
      .addSelect('COUNT(v.id) FILTER (WHERE v.stock = 0)', 'outCount')
      .addSelect('COUNT(v.id) FILTER (WHERE v.stock > 0 AND v.stock <= :low)', 'lowCount')
      .setParameter('low', query.lowThreshold)
      .getRawOne<Record<string, string>>();

    if (query.status === 'out') qb.andWhere('v.stock = 0');
    if (query.status === 'low') qb.andWhere('v.stock > 0 AND v.stock <= :low', { low: query.lowThreshold });
    if (query.status === 'in') qb.andWhere('v.stock > :low', { low: query.lowThreshold });

    const total = await qb.clone().getCount();
    const rows = await qb
      .select([
        'v.id AS "variantId"',
        'v.name AS "variantName"',
        'v.size AS "size"',
        'v.stock AS "stock"',
        'v.updatedAt AS "updatedAt"',
        'p.id AS "productId"',
        'p.name AS "productName"',
        'p.isActive AS "isActive"',
        'c.name AS "categoryName"',
        // Ảnh đầu tiên của sản phẩm
        `(SELECT i.url FROM product_images i WHERE i."productId" = p.id ORDER BY i."sortOrder" ASC, i.id ASC LIMIT 1) AS "image"`,
      ])
      // Hết hàng / sắp hết lên đầu để admin xử lý trước
      .orderBy('v.stock', 'ASC')
      .addOrderBy('p.name', 'ASC')
      .addOrderBy('v.id', 'ASC')
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getRawMany<Record<string, unknown>>();

    return {
      summary: {
        variantCount: Number(summaryRow?.variantCount ?? 0),
        totalUnits: Number(summaryRow?.totalUnits ?? 0),
        outCount: Number(summaryRow?.outCount ?? 0),
        lowCount: Number(summaryRow?.lowCount ?? 0),
        lowThreshold: query.lowThreshold,
      },
      items: rows.map((row) => ({ ...row, stock: Number(row.stock) })),
      pagination: paginate(query.page, query.limit, total),
    };
  }

  /** Nhập thêm hàng: cộng dồn vào tồn kho hiện tại, ghi lịch sử loại IN */
  async receiveStock(variantId: number, input: ReceiveStockDto, adminUserId: number) {
    return this.dataSource.transaction(async (manager) => {
      // Khoá dòng biến thể để không lệch số với đơn hàng đang đặt cùng lúc
      const rows: Array<{ stock: number; name: string; size: string | null; productName: string }> =
        await manager.query(
          `SELECT v.stock, v.name, v.size, p.name AS "productName"
             FROM product_variants v
             INNER JOIN products p ON p.id = v."productId"
            WHERE v.id = $1
            FOR UPDATE OF v`,
          [variantId],
        );
      const current = rows[0];
      if (!current) throw new NotFoundException('Không tìm thấy biến thể cần nhập kho.');

      const beforeStock = Number(current.stock);
      const afterStock = beforeStock + input.quantity;
      await manager.update(ProductVariant, variantId, { stock: afterStock });

      const movement = await manager.save(
        manager.create(InventoryMovement, {
          variantId,
          productNameSnapshot: current.productName,
          variantNameSnapshot: current.name,
          sizeSnapshot: current.size,
          type: InventoryMovementType.IN,
          beforeStock,
          afterStock,
          delta: input.quantity,
          actorType: AuditActorType.ADMIN,
          actorUserId: adminUserId,
          reason: input.reason || 'Nhập hàng',
          operationKey: `ADMIN_RECEIVE:${variantId}:${randomUUID()}`,
        }),
      );
      return { variantId, stock: afterStock, movement };
    });
  }

  /** Kiểm kho: đặt lại số tồn đúng thực tế (chặn nếu tồn đã đổi từ lúc mở form) */
  async adjustStock(variantId: number, input: AdjustStockDto, adminUserId: number) {
    const { variant, movement } = await this.dataSource.transaction((manager) =>
      this.inventoryService.adjustVariantStock(manager, {
        variantId,
        stock: input.stock,
        expectedStock: input.expectedStock,
        reason: input.reason,
        actor: { type: AuditActorType.ADMIN, userId: adminUserId },
      }),
    );
    return { variantId: variant.id, stock: variant.stock, movement };
  }

  /** Lịch sử nhập / xuất / điều chỉnh kho, mới nhất trước */
  async listMovements(query: MovementListQueryDto) {
    const qb = this.dataSource
      .getRepository(InventoryMovement)
      .createQueryBuilder('m')
      .leftJoin('m.actor', 'u')
      .leftJoin('m.order', 'o')
      .select([
        'm.id',
        'm.variantId',
        'm.productNameSnapshot',
        'm.variantNameSnapshot',
        'm.sizeSnapshot',
        'm.type',
        'm.beforeStock',
        'm.afterStock',
        'm.delta',
        'm.orderId',
        'm.actorType',
        'm.reason',
        'm.createdAt',
        'u.id',
        'u.fullName',
        'o.id',
        'o.code',
      ]);

    if (query.variantId !== undefined) qb.andWhere('m.variantId = :variantId', { variantId: query.variantId });
    if (query.type !== undefined) qb.andWhere('m.type = :type', { type: query.type });
    if (query.from) qb.andWhere('m.createdAt >= :from', { from: `${query.from} 00:00:00` });
    if (query.to) qb.andWhere('m.createdAt <= :to', { to: `${query.to} 23:59:59.999` });

    const [items, total] = await qb
      .orderBy('m.createdAt', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return {
      items: items.map(({ actor, order, ...movement }) => ({
        ...movement,
        actorName: actor?.fullName ?? null,
        orderCode: order?.code ?? null,
      })),
      pagination: paginate(query.page, query.limit, total),
    };
  }
}
