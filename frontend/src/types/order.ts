export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['COD', 'MOMO'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Đặt hàng từ giỏ hàng
export interface OrderCreate{
    addressId: number;
    paymentMethod?: PaymentMethod;
    note?: string;
}
// Mua ngay 1 sản phẩm (không qua giỏ hàng)
export interface OrderBuyNow extends OrderCreate{
    variantId: number;
    quantity: number;
}
/** Dòng sản phẩm dạng chung để hiển thị: giỏ hàng, mua ngay hay đơn đã đặt */
export interface OrderLine{
    key: string | number;
    name: string;
    image?: string | null;
    variantLabel?: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal?: number;
}
/** Dữ liệu "Mua ngay" truyền từ trang sản phẩm sang trang đặt hàng (router state) */
export interface BuyNowState{
    variantId: number;
    quantity: number;
    line: OrderLine;
}
export interface OrderView{
    variantId: number;
    quantity: number;

}

// Một dòng sản phẩm trong đơn (đã chụp lại tên / giá lúc đặt)
export interface OrderItemDetail{
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
export interface OrderDetail{
    id: number;
    code: string;
    status: OrderStatusValue;
    paymentMethod: PaymentMethod;
    paymentStatus: 'UNPAID' | 'PAID';
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
    items: OrderItemDetail[];
    /** Chỉ có ngay sau khi đặt đơn thanh toán online (MoMo): trang khách cần chuyển tới */
    paymentUrl?: string | null;
    /** Lịch sử đổi trạng thái (API chi tiết đơn có trả về) */
    statusHistory?: OrderStatusHistoryItem[];
}

export interface OrderStatusHistoryItem{
    id: number;
    fromStatus: OrderStatusValue | null;
    toStatus: OrderStatusValue;
    actorType: string;
    reason: string | null;
    occurredAt: string | null;
    recordedAt: string;
}

export interface OrderList{
    items: OrderDetail[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface OrderListQuery{
    status?: OrderStatusValue;
    page?: number;
    limit?: number;
}
export interface AdminOrderListQuery extends OrderListQuery{
    search?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    from?: string;
    to?: string;
}
export interface OrderStatus{
    status: OrderStatusValue;
}
