import { api } from "../config/api";
import type { OrderBuyNow, OrderCreate, OrderDetail, OrderList, OrderListQuery, OrderStatus } from "../types/order";

const endpoint = "order";

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Đặt hàng toàn bộ giỏ hàng (backend tự xoá giỏ sau khi đặt)
export const createOrder = async (payload: OrderCreate): Promise<OrderDetail> => {
    const res = await api.post(endpoint, payload, { headers: authHeaders() });
    return res.data;
};

// Mua ngay 1 biến thể, không đụng tới giỏ hàng
export const buyNowOrder = async (payload: OrderBuyNow): Promise<OrderDetail> => {
    const res = await api.post(`${endpoint}/buy-now`, payload, { headers: authHeaders() });
    return res.data;
};

export const listMyOrders = async (query: OrderListQuery = {}): Promise<OrderList> => {
    const res = await api.get(`${endpoint}/my`, { headers: authHeaders(), params: query });
    return res.data;
};

export const getMyOrder = async (code: string): Promise<OrderDetail> => {
    const res = await api.get(`${endpoint}/my/${encodeURIComponent(code)}`, { headers: authHeaders() });
    return res.data;
};

// MoMo giả lập: xác nhận thanh toán thành công / huỷ thanh toán
export const confirmMomoSandbox = async (code: string, success: boolean): Promise<OrderDetail> => {
    const res = await api.post(`${endpoint}/my/${encodeURIComponent(code)}/momo-sandbox`, { success }, { headers: authHeaders() });
    return res.data;
};

export const cancelMyOrder = async (code: string): Promise<OrderDetail> => {
    const res = await api.patch(`${endpoint}/my/${encodeURIComponent(code)}/cancel`, null, { headers: authHeaders() });
    return res.data;
};

export const confirmMyOrder = async (id: number, body: OrderStatus) => {
    const res = await api.patch(`${endpoint}/admin/${id}/status`, body, { headers: authHeaders() });
    return res.data;
};
