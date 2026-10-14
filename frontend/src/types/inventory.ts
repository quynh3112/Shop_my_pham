export type StockStatus = "all" | "in" | "low" | "out";
export type InventoryMovementType = "IN" | "OUT" | "ADJUSTMENT" | "RETURN";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StockListQuery {
  search?: string;
  categoryId?: number;
  status?: StockStatus;
  lowThreshold?: number;
  page?: number;
  limit?: number;
}

/** Một dòng tồn kho = một biến thể sản phẩm */
export interface StockItem {
  variantId: number;
  variantName: string;
  size: string | null;
  stock: number;
  updatedAt: string;
  productId: number;
  productName: string;
  isActive: boolean;
  categoryName: string | null;
  image: string | null;
}

export interface StockSummary {
  variantCount: number;
  totalUnits: number;
  outCount: number;
  lowCount: number;
  lowThreshold: number;
}

export interface StockList {
  summary: StockSummary;
  items: StockItem[];
  pagination: Pagination;
}

export interface ReceiveStockInput {
  quantity: number;
  reason?: string;
}

export interface AdjustStockInput {
  stock: number;
  expectedStock: number;
  reason: string;
}

export interface MovementListQuery {
  variantId?: number;
  type?: InventoryMovementType;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface InventoryMovement {
  id: number;
  variantId: number | null;
  productNameSnapshot: string;
  variantNameSnapshot: string | null;
  sizeSnapshot: string | null;
  type: InventoryMovementType;
  beforeStock: number | null;
  afterStock: number;
  delta: number | null;
  orderId: number | null;
  orderCode: string | null;
  actorType: "CUSTOMER" | "ADMIN" | "SYSTEM";
  actorName: string | null;
  reason: string | null;
  createdAt: string;
}

export interface MovementList {
  items: InventoryMovement[];
  pagination: Pagination;
}
