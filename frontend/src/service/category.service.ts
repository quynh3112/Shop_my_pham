import { api } from "../config/api";
import type { CategoryGroup, CategoryInput } from "../types/category";
const endpoint = "/category";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export const listCategory = async (): Promise<CategoryGroup[]> => {
  const res = await api.get(`${endpoint}/`);
  return res.data;
};
export const creat = async (data: CategoryInput) => {
  const res = await api.post(`${endpoint}/`, data, { headers: authHeader() });
  return res.data;
};
export const updateCategory = async (id: number, data: Partial<CategoryInput>) => {
  const res = await api.patch(`${endpoint}/${id}`, data, { headers: authHeader() });
  return res.data;
};
export const deleteCategory = async (id: number) => {
  const res = await api.delete(`${endpoint}/${id}`, { headers: authHeader() });
  return res.data;
};
