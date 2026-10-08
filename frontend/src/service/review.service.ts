import { api } from "../config/api";
import type { ReviewCreate } from "../types/review";

const endpoint = "reviews";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const listMyReviews = async () => {
  const res = await api.get(endpoint, {
    headers: authHeaders(),
  });
  return res.data;
};

export const addReview = async (payload: ReviewCreate) => {
  const res = await api.post(endpoint, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

export const allReviewsInProduct = async (productId: number) => {
  const res = await api.get(`${endpoint}/product/${productId}`);
  return res.data;
};

export const purchasedProductsNotReviewed = async () => {
  const res = await api.get(`${endpoint}/my/purchased-not-reviewed`, {
    headers: authHeaders(),
  });
  return res.data;
};

export const updateMyReview = async (productId: number, payload: ReviewCreate) => {
  const res = await api.put(`${endpoint}/${productId}`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

export const removeMyReview = async (reviewId: number) => {
  const res = await api.delete(`${endpoint}/${reviewId}`, {
    headers: authHeaders(),
  });
  return res.data;
};

export const deleteMyReview = async (reviewId: number) => removeMyReview(reviewId);
