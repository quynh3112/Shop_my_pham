import { api } from "../config/api";
import type { CustomerDetail, CustomerList, CustomerListQuery } from "../types/customer";

const endpoint = "customers";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const listCustomers = async (query: CustomerListQuery = {}): Promise<CustomerList> => {
  const res = await api.get(endpoint, { headers: authHeaders(), params: query });
  return res.data;
};

export const getCustomer = async (id: number): Promise<CustomerDetail> => {
  const res = await api.get(`${endpoint}/${id}`, { headers: authHeaders() });
  return res.data;
};

// Khoá / mở khoá tài khoản khách hàng
export const setCustomerStatus = async (id: number, isActive: boolean) => {
  const res = await api.patch(`${endpoint}/${id}/status`, { isActive }, { headers: authHeaders() });
  return res.data;
};
