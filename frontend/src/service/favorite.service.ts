import { api } from "../config/api";
import type { FavoriteCreate } from "../types/favorite";

const endpoint = "/favorite";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const addFavorite = async (payload: FavoriteCreate) => {
  const res = await api.post(endpoint, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

export const listMyFavorites = async () => {
  const res = await api.get(`${endpoint}/my`, {
    headers: authHeaders(),
  });
  return res.data;
};

export const removeMyFavorite = async (productId: number) => {
  const res = await api.delete(`${endpoint}/my/${productId}`, {
    headers: authHeaders(),
  });
  return res.data;
}
;
export const checkFavorite = async (productId: number) => {
  const res = await api.get(`${endpoint}/my/${productId}`, {
    headers: authHeaders(),
  });
  return res.data;
}
