import { api } from "../config/api";
import type {
  AdjustStockInput,
  MovementList,
  MovementListQuery,
  ReceiveStockInput,
  StockList,
  StockListQuery,
} from "../types/inventory";

const endpoint = "inventory";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const listStock = async (query: StockListQuery = {}): Promise<StockList> => {
  const res = await api.get(`${endpoint}/stock`, { headers: authHeaders(), params: query });
  return res.data;
};

// Nhập thêm hàng (cộng dồn)
export const receiveStock = async (variantId: number, input: ReceiveStockInput) => {
  const res = await api.post(`${endpoint}/variants/${variantId}/receive`, input, { headers: authHeaders() });
  return res.data;
};

// Kiểm kho: đặt lại số tồn thực tế
export const adjustStock = async (variantId: number, input: AdjustStockInput) => {
  const res = await api.patch(`${endpoint}/variants/${variantId}/adjust`, input, { headers: authHeaders() });
  return res.data;
};

export const listMovements = async (query: MovementListQuery = {}): Promise<MovementList> => {
  const res = await api.get(`${endpoint}/movements`, { headers: authHeaders(), params: query });
  return res.data;
};
