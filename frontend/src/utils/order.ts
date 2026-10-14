import type { Address } from "../types/address";
import type { CartItemView } from "../types/cart";
import type { OrderDetail, OrderItemDetail, OrderLine, OrderStatusValue, PaymentMethod } from "../types/order";

export const ORDER_STATUS_LABEL: Record<OrderStatusValue, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang chuẩn bị hàng",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã huỷ",
};

export const ORDER_STATUS_COLOR: Record<OrderStatusValue, string> = {
  PENDING: "gold",
  CONFIRMED: "blue",
  PROCESSING: "geekblue",
  SHIPPING: "cyan",
  DELIVERED: "green",
  CANCELLED: "red",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  MOMO: "Ví MoMo",
};

/** "12 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh" */
export const formatAddress = (address: Pick<Address, "line" | "ward" | "district" | "province">) =>
  [address.line, address.ward, address.district, address.province].filter(Boolean).join(", ");

export const formatOrderAddress = (order: OrderDetail) =>
  formatAddress({
    line: order.shippingLine1,
    ward: order.shippingWard,
    district: order.shippingDistrict,
    province: order.shippingProvince,
  });

export const formatDateTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "";

/** "Đỏ · 3.5g" */
export const variantLabel = (...parts: (string | null | undefined)[]) =>
  parts.filter((part) => part && part.trim()).join(" · ") || null;

export const cartItemToLine = (item: CartItemView): OrderLine => ({
  key: item.id,
  name: item.name,
  image: item.thumbUrl,
  variantLabel: variantLabel(item.color, item.size),
  unitPrice: item.unitPrice,
  quantity: item.quantity,
  lineTotal: item.lineTotal,
});

export const orderItemToLine = (item: OrderItemDetail): OrderLine => ({
  key: item.id,
  name: item.productName,
  image: item.productImage,
  variantLabel: variantLabel(item.variantName, item.variantSize),
  unitPrice: item.unitPrice,
  quantity: item.quantity,
  lineTotal: item.lineTotal,
});
