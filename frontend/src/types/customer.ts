import type { Address } from "./address";
import type { OrderStatusValue } from "./order";

export type CustomerSort = "newest" | "spent" | "orders" | "name";

export interface CustomerListQuery {
  search?: string;
  status?: "active" | "locked";
  sort?: CustomerSort;
  page?: number;
  limit?: number;
}

export interface CustomerSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  /** Số đơn (trừ đơn huỷ) */
  orderCount: number;
  /** Tổng tiền các đơn đã giao */
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface CustomerList {
  items: CustomerSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CustomerDetail extends Omit<CustomerSummary, "orderCount" | "totalSpent" | "lastOrderAt"> {
  stats: {
    orderCount: number;
    deliveredCount: number;
    cancelledCount: number;
    totalSpent: number;
    averageOrderValue: number;
    favoriteCount: number;
    reviewCount: number;
    skinAnalysisCount: number;
  };
  addresses: Address[];
  recentOrders: {
    id: number;
    code: string;
    status: OrderStatusValue;
    paymentStatus: "UNPAID" | "PAID";
    total: number;
    createdAt: string;
  }[];
}
