import { api } from "../config/api";
import type { Category } from "../types/category";
const endpoint = "/category";
export const listCategory = async () => {
  const res = await api.get(`${endpoint}/`);
  return res.data;
};
export const creat = async (data: Category) => {
  const token = localStorage.getItem("token");
  const res = await api.post(`${endpoint}/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
