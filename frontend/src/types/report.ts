export type ReportScope = "ALL" | "DELIVERED" | "PAID";

export interface ProductSalesQuery {
  from?: string; // YYYY-MM-DD
  to?: string;
  scope?: ReportScope;
}

export interface ProductSalesRow {
  productId: number | null;
  productName: string;
  categoryName: string | null;
  quantity: number;
  orderCount: number;
  revenue: number;
}

export interface ProductSalesReport {
  filter: { from: string | null; to: string | null; scope: ReportScope };
  summary: {
    productCount: number;
    totalQuantity: number;
    orderCount: number;
    totalRevenue: number;
  };
  items: ProductSalesRow[];
}

export type OrderStatusKey = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED";

export interface ReportOverview {
  filter: { from: string | null; to: string | null; scope: ReportScope };
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  itemsSold: number;
  shippingFee: number;
  newCustomers: number;
  statusCounts: Record<OrderStatusKey, number>;
  pendingCount: number;
  pendingOrders: {
    id: number;
    code: string;
    receiverName: string;
    total: number;
    itemCount: number;
    createdAt: string;
  }[];
}

export interface MonthlyRevenue {
  year: number;
  scope: ReportScope;
  months: { month: number; revenue: number; orderCount: number }[];
  totalRevenue: number;
  totalOrders: number;
}

export interface YearlyRevenue {
  scope: ReportScope;
  years: { year: number; revenue: number; orderCount: number }[];
}
