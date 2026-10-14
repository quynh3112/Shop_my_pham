import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { Role, User } from '../user/entity/user.entity';

export type StaffAccess = Pick<User, 'id' | 'role' | 'permissions' | 'isActive'>;

/**
 * Đọc vai trò + quyền MỚI NHẤT từ DB (không tin vào JWT) để khi admin
 * thu hồi quyền / khoá tài khoản thì có hiệu lực ngay, không đợi token hết hạn.
 */
export async function loadStaffAccess(dataSource: DataSource, userId?: number): Promise<StaffAccess> {
  if (!userId) throw new UnauthorizedException('Bạn cần đăng nhập để dùng chức năng này.');
  const user = await dataSource.getRepository(User).findOne({
    where: { id: userId },
    select: ['id', 'role', 'permissions', 'isActive'],
  });
  if (!user) throw new UnauthorizedException('Tài khoản không còn tồn tại.');
  if (!user.isActive) throw new ForbiddenException('Tài khoản của bạn đã bị khoá.');
  return user;
}

export const isStaffRole = (role?: Role) => role === Role.ADMIN || role === Role.STAFF;
