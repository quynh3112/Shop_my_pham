import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { OrderStatus } from 'src/until/order_status';
import { Address } from '../address/entity/address.entity';
import { Favorite } from '../favorites/entity/favorite.entity';
import { Order } from '../order/entity/order.entity';
import { RefreshToken } from '../refreshtoken/entity/refresh_token.entity';
import { Review } from '../reviews/entity/review.entity';
import { SkinAnalysis } from '../skin-analysis/entity/skin-analysis.entity';
import { Role, User } from '../user/entity/user.entity';
import { CustomerListQueryDto, CustomerSort } from './dto/customer.dto';

const RECENT_ORDERS = 10;

// Cột sắp xếp theo lựa chọn (alias ở câu SELECT bên dưới)
const SORT_COLUMN: Record<CustomerSort, [string, 'ASC' | 'DESC']> = {
  newest: ['u.createdAt', 'DESC'],
  spent: ['"totalSpent"', 'DESC'],
  orders: ['"orderCount"', 'DESC'],
  name: ['u.fullName', 'ASC'],
};

/**
 * Quản lý khách hàng (role USER).
 * Tổng chi tiêu chỉ tính đơn ĐÃ GIAO (giống báo cáo doanh thu); số đơn tính mọi đơn trừ đơn huỷ.
 */
@Injectable()
export class CustomerService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private get userRepo() {
    return this.dataSource.getRepository(User);
  }

  async list(query: CustomerListQueryDto) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      // Gộp thống kê đơn theo khách trong 1 truy vấn con, tránh N+1
      .leftJoin(
        (sub) =>
          sub
            .select('o."userId"', 'userId')
            .addSelect('COUNT(*) FILTER (WHERE o.status != :cancelled)', 'orderCount')
            .addSelect('COALESCE(SUM(o.total) FILTER (WHERE o.status = :delivered), 0)', 'totalSpent')
            .addSelect('MAX(o."createdAt")', 'lastOrderAt')
            .from(Order, 'o')
            .groupBy('o."userId"'),
        'stats',
        'stats."userId" = u.id',
      )
      .where('u.role = :role', { role: Role.USER })
      .setParameters({ cancelled: OrderStatus.CANCELLED, delivered: OrderStatus.DELIVERED });

    if (query.search) {
      qb.andWhere('(u.fullName ILIKE :search OR u.email ILIKE :search OR u.phone ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.status) qb.andWhere('u.isActive = :isActive', { isActive: query.status === 'active' });

    const total = await qb.clone().getCount();
    const [sortColumn, direction] = SORT_COLUMN[query.sort];
    const rows = await qb
      .select([
        'u.id AS "id"',
        'u.fullName AS "fullName"',
        'u.email AS "email"',
        'u.phone AS "phone"',
        'u.avatarUrl AS "avatarUrl"',
        'u.isActive AS "isActive"',
        'u.isEmailVerified AS "isEmailVerified"',
        'u.createdAt AS "createdAt"',
        'COALESCE(stats."orderCount", 0) AS "orderCount"',
        'COALESCE(stats."totalSpent", 0) AS "totalSpent"',
        'stats."lastOrderAt" AS "lastOrderAt"',
      ])
      .orderBy(sortColumn, direction, 'NULLS LAST')
      .addOrderBy('u.id', 'DESC')
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getRawMany<Record<string, unknown>>();

    return {
      items: rows.map((row) => ({
        ...row,
        orderCount: Number(row.orderCount ?? 0),
        totalSpent: Number(row.totalSpent ?? 0),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async detail(id: number) {
    const customer = await this.findCustomerOrFail(id);
    const orderRepo = this.dataSource.getRepository(Order);

    const [stats, recentOrders, addresses, favoriteCount, reviewCount, skinAnalysisCount] = await Promise.all([
      orderRepo
        .createQueryBuilder('o')
        .select('COUNT(*) FILTER (WHERE o.status != :cancelled)', 'orderCount')
        .addSelect('COUNT(*) FILTER (WHERE o.status = :delivered)', 'deliveredCount')
        .addSelect('COUNT(*) FILTER (WHERE o.status = :cancelled)', 'cancelledCount')
        .addSelect('COALESCE(SUM(o.total) FILTER (WHERE o.status = :delivered), 0)', 'totalSpent')
        .where('o.userId = :id', { id })
        .setParameters({ cancelled: OrderStatus.CANCELLED, delivered: OrderStatus.DELIVERED })
        .getRawOne<Record<string, string>>(),
      orderRepo.find({
        where: { userId: id },
        select: ['id', 'code', 'status', 'paymentStatus', 'total', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: RECENT_ORDERS,
      }),
      this.dataSource.getRepository(Address).find({
        where: { user: { id } },
        order: { isDefault: 'DESC', createAt: 'DESC' },
      }),
      this.dataSource.getRepository(Favorite).count({ where: { userId: id } }),
      this.dataSource.getRepository(Review).count({ where: { userId: id } }),
      this.dataSource.getRepository(SkinAnalysis).count({ where: { userId: id } }),
    ]);

    const deliveredCount = Number(stats?.deliveredCount ?? 0);
    const totalSpent = Number(stats?.totalSpent ?? 0);
    return {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      avatarUrl: customer.avatarUrl,
      isActive: customer.isActive,
      isEmailVerified: customer.isEmailVerified,
      createdAt: customer.createdAt,
      stats: {
        orderCount: Number(stats?.orderCount ?? 0),
        deliveredCount,
        cancelledCount: Number(stats?.cancelledCount ?? 0),
        totalSpent,
        averageOrderValue: deliveredCount ? Math.round(totalSpent / deliveredCount) : 0,
        favoriteCount,
        reviewCount,
        skinAnalysisCount,
      },
      addresses,
      recentOrders,
    };
  }

  /** Khoá / mở khoá; khoá thì thu hồi mọi phiên đăng nhập */
  async setStatus(id: number, isActive: boolean) {
    const customer = await this.findCustomerOrFail(id);
    await this.userRepo.update(id, { isActive });
    if (!isActive && customer.isActive) {
      await this.dataSource
        .getRepository(RefreshToken)
        .update({ userId: id, revokeAt: IsNull() }, { revokeAt: new Date() });
    }
    return { id, isActive };
  }

  private async findCustomerOrFail(id: number) {
    const customer = await this.userRepo.findOne({ where: { id, role: Role.USER } });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng.');
    return customer;
  }
}
