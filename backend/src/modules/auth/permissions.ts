/**
 * Quyền truy cập khu quản lý, gán cho từng nhân viên (role STAFF).
 * ADMIN luôn có mọi quyền. Frontend có bản sao nhãn ở src/utils/permissions.ts.
 */
export const PERMISSIONS = {
  products: 'Sản phẩm',
  categories: 'Danh mục',
  inventory: 'Kho hàng',
  orders: 'Đơn hàng',
  customers: 'Khách hàng',
  banners: 'Banner',
  chat: 'Chat khách hàng',
  reports: 'Báo cáo',
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const PERMISSION_CODES = Object.keys(PERMISSIONS) as Permission[];

/** Lọc bỏ mã quyền không hợp lệ / trùng */
export const pickPermissions = (values: unknown): Permission[] =>
  Array.isArray(values)
    ? [...new Set(values.filter((v): v is Permission => PERMISSION_CODES.includes(v as Permission)))]
    : [];
