import { api } from "../config/api";
import type {
  AdminOrder,
  AdminOrderList,
  AdminOrderListQuery,
  OrderStatusValue,
  PaymentStatusValue,
} from "../types/adminOrder";

const endpoint = "order/admin";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export const listAdminOrders = async (query: AdminOrderListQuery): Promise<AdminOrderList> => {
  const res = await api.get(endpoint, { headers: authHeader(), params: query });
  return res.data;
};

export const getAdminOrder = async (code: string): Promise<AdminOrder> => {
  const res = await api.get(`${endpoint}/${code}`, { headers: authHeader() });
  return res.data;
};

export const updateAdminOrderStatus = async (id: number, status: OrderStatusValue) => {
  const res = await api.patch(`${endpoint}/${id}/status`, { status }, { headers: authHeader() });
  return res.data;
};

export const updateAdminPaymentStatus = async (id: number, paymentStatus: PaymentStatusValue) => {
  const res = await api.patch(`${endpoint}/${id}/payment-status`, { paymentStatus }, { headers: authHeader() });
  return res.data;
};
