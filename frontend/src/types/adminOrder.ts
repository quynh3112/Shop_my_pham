import type { AdminOrderListQuery, ORDER_STATUSES } from "./order";

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];
export type PaymentStatusValue = "UNPAID" | "PAID";
export type PaymentMethodValue = "COD" | "MOMO";

export type { AdminOrderListQuery };

export interface AdminOrderItem {
  id: number;
  productId: number | null;
  variantId: number | null;
  productName: string;
  productImage: string | null;
  variantName: string | null;
  variantSize: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AdminOrderHistory {
  id: number;
  type: string;
  fromStatus: OrderStatusValue | null;
  toStatus: OrderStatusValue;
  actorType: string;
  actorUserId: number | null;
  reason: string | null;
  occurredAt: string | null;
  recordedAt: string;
}

export interface AdminOrder {
  id: number;
  code: string;
  userId: number;
  status: OrderStatusValue;
  paymentMethod: PaymentMethodValue;
  paymentStatus: PaymentStatusValue;
  subtotal: number;
  shippingFee: number;
  total: number;
  receiverName: string;
  receiverPhone: string;
  shippingLine1: string;
  shippingWard: string;
  shippingDistrict: string;
  shippingProvince: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: number; fullName: string; email: string; phone: string; avatarUrl?: string } | null;
  items: AdminOrderItem[];
  statusHistory?: AdminOrderHistory[];
}

export interface AdminOrderList {
  items: AdminOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
