export interface OrderCreate{
    addressId: string;
    paymentMethod: string;
    note:string;

} 
export interface OrderView{
    variantId: number;
    quantity: number;

}
export interface OrderListQuery{
    status?: (typeof ORDER_STATUSES)[number];
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
export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
] as const;
export interface OrderStatus{
    status: (typeof ORDER_STATUSES)[number];
}

