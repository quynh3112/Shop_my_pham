import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { Permission } from '../auth/permissions';
import { Role } from '../user/entity/user.entity';
import { PERMISSION_KEY } from './require-permission.decorator';
import { loadStaffAccess } from './staff-access';

/**
 * Dùng sau JwtAuthGuard: ADMIN luôn qua; STAFF chỉ qua khi có quyền khai báo bằng @RequirePermission.
 * Quyền đọc từ DB mỗi request nên thu hồi quyền có hiệu lực ngay.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<Permission | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<{ user?: { userId: number; role?: Role } }>();
    const user = await loadStaffAccess(this.dataSource, request.user?.userId);

    // Cập nhật vai trò mới nhất cho các service phía sau
    if (request.user) request.user.role = user.role;

    if (user.role === Role.ADMIN) return true;
    if (user.role === Role.STAFF && permission && user.permissions.includes(permission)) return true;
    throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
  }
}
