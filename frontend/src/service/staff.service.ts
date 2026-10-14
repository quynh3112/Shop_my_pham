import { api } from "../config/api";
import type { Staff, StaffCreate, StaffUpdate } from "../types/staff";

const endpoint = "staff";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const listStaff = async (): Promise<Staff[]> => {
  const res = await api.get(endpoint, { headers: authHeaders() });
  return res.data;
};

export const createStaff = async (data: StaffCreate): Promise<Staff> => {
  const res = await api.post(endpoint, data, { headers: authHeaders() });
  return res.data;
};

export const updateStaff = async (id: number, data: StaffUpdate): Promise<Staff> => {
  const res = await api.patch(`${endpoint}/${id}`, data, { headers: authHeaders() });
  return res.data;
};

export const resetStaffPassword = async (id: number, password: string) => {
  const res = await api.patch(`${endpoint}/${id}/password`, { password }, { headers: authHeaders() });
  return res.data;
};

export const deleteStaff = async (id: number) => {
  const res = await api.delete(`${endpoint}/${id}`, { headers: authHeaders() });
  return res.data;
};
