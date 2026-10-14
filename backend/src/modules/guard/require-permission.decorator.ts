import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../auth/permissions';

export const PERMISSION_KEY = 'requiredPermission';

/**
 * Quyền cần có để gọi API (dùng kèm PermissionGuard).
 * Đặt ở controller hoặc từng method; method ghi đè controller.
 */
export const RequirePermission = (permission: Permission) => SetMetadata(PERMISSION_KEY, permission);
