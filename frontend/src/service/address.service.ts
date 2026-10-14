import { api } from "../config/api";
import type { Address, AddressInput } from "../types/address";

const endpoint = "address";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Bỏ khoảng trắng thừa, SĐT chỉ giữ chữ số
const normalizeAddress = (input: AddressInput): AddressInput => ({
  fullName: input.fullName.trim(),
  phone: input.phone.replace(/\D/g, ""),
  line1: input.line1.trim(),
  ward: input.ward.trim(),
  district: input.district.trim(),
  province: input.province.trim(),
  isDefault: input.isDefault,
});

export const listMyAddresses = async (): Promise<Address[]> => {
  const res = await api.get(endpoint, { headers: authHeaders() });
  return res.data;
};

export const createAddress = async (input: AddressInput): Promise<Address> => {
  const res = await api.post(endpoint, normalizeAddress(input), { headers: authHeaders() });
  return res.data;
};

export const updateAddress = async (id: number, input: AddressInput): Promise<Address> => {
  const res = await api.patch(`${endpoint}/${id}`, normalizeAddress(input), { headers: authHeaders() });
  return res.data;
};

export const setDefaultAddress = async (id: number): Promise<Address> => {
  const res = await api.patch(`${endpoint}/${id}/default`, null, { headers: authHeaders() });
  return res.data;
};

export const removeAddress = async (id: number) => {
  const res = await api.delete(`${endpoint}/${id}`, { headers: authHeaders() });
  return res.data;
};
