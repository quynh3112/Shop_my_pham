// Bản sao quyền ở backend: src/modules/auth/permissions.ts — thêm / đổi mã ở đó thì sửa cả ở đây
export const PERMISSION_LABEL = {
  products: "Sản phẩm",
  categories: "Danh mục",
  inventory: "Kho hàng",
  orders: "Đơn hàng",
  customers: "Khách hàng",
  banners: "Banner",
  chat: "Chat khách hàng",
  reports: "Báo cáo",
} as const;

export type Permission = keyof typeof PERMISSION_LABEL;
export const PERMISSION_OPTIONS = (Object.keys(PERMISSION_LABEL) as Permission[]).map((value) => ({
  value,
  label: PERMISSION_LABEL[value],
}));

/** "admin" = chỉ ADMIN (vd. quản lý nhân viên), còn lại là quyền nhân viên có thể được gán */
export type PageAccess = Permission | "admin";

/** Các trang trong khu quản lý, theo thứ tự trên menu */
export const ADMIN_PAGES: { path: string; label: string; access: PageAccess }[] = [
  { path: "/admin/products", label: "Sản phẩm", access: "products" },
  { path: "/admin/categories", label: "Danh mục", access: "categories" },
  { path: "/admin/inventory", label: "Kho hàng", access: "inventory" },
  { path: "/admin/orders", label: "Đơn hàng", access: "orders" },
  { path: "/admin/customers", label: "Khách hàng", access: "customers" },
  { path: "/admin/banners", label: "Banner", access: "banners" },
  { path: "/admin/chat", label: "Chat khách hàng", access: "chat" },
  { path: "/admin/reports", label: "Báo cáo", access: "reports" },
  { path: "/admin/staff", label: "Nhân viên", access: "admin" },
];

export interface AccessInfo {
  role?: string;
  permissions?: string[];
}

export const isStaffRole = (role?: string) => role === "ADMIN" || role === "STAFF";

/** ADMIN vào được mọi trang; STAFF chỉ vào trang có quyền tương ứng */
export const canAccess = (user: AccessInfo | null | undefined, access: PageAccess) => {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return access !== "admin" && user.role === "STAFF" && (user.permissions ?? []).includes(access);
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  STAFF: "Nhân viên",
  USER: "Khách hàng",
};
