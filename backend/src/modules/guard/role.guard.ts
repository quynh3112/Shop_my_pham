import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Role } from '../user/entity/user.entity';
import { loadStaffAccess } from './staff-access';

/**
 * Chỉ ADMIN (dùng sau JwtAuthGuard), ví dụ quản lý nhân viên.
 * Vai trò đọc từ DB để giáng quyền / khoá tài khoản có hiệu lực ngay.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { userId: number; role?: Role } }>();
    const user = await loadStaffAccess(this.dataSource, request.user?.userId);
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    }
    if (request.user) request.user.role = user.role;
    return true;
  }
}
