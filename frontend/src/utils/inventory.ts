import type { InventoryMovementType, StockItem } from "../types/inventory";

export const MOVEMENT_TYPE: Record<InventoryMovementType, { label: string; color: string }> = {
  IN: { label: "Nhập kho", color: "green" },
  OUT: { label: "Xuất kho", color: "volcano" },
  ADJUSTMENT: { label: "Kiểm kho", color: "blue" },
  RETURN: { label: "Hoàn kho", color: "purple" },
};

export type StockLevel = "out" | "low" | "in";

export const stockLevel = (stock: number, lowThreshold: number): StockLevel =>
  stock <= 0 ? "out" : stock <= lowThreshold ? "low" : "in";

export const STOCK_LEVEL: Record<StockLevel, { label: string; color: string }> = {
  out: { label: "Hết hàng", color: "red" },
  low: { label: "Sắp hết", color: "orange" },
  in: { label: "Còn hàng", color: "green" },
};

/** "Son kem lì — Đỏ · 3.5g" */
export const stockItemLabel = (item: Pick<StockItem, "productName" | "variantName" | "size">) =>
  `${item.productName} — ${[item.variantName, item.size].filter(Boolean).join(" · ")}`;

/** +12 / -3 / 0 */
export const formatDelta = (delta: number | null) =>
  delta === null ? "—" : delta > 0 ? `+${delta}` : String(delta);
