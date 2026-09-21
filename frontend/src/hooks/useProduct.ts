import { useState } from "react";
import type { ProductCreate, ProductItem, ProductQuery } from "../types/product";
import {
  createProduct,
  getProducById,
  getProducts,
  removeProduct,
  updateProduct as updateProductRequest,
} from "../service/product.service";

const normalizeProducts = (payload: any): ProductItem[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.products)) return payload.products;

  const nested =
    payload?.result ??
    payload?.items ??
    payload?.docs ??
    payload?.data?.items ??
    payload?.data?.products ??
    payload?.data?.data;

  if (Array.isArray(nested)) return nested;

  return [];
};

export default function useProduct() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductItem[]>([]);

  const fetchProducts = async (query?: ProductQuery) => {
    try {
      setLoading(true);
      const res = await getProducts(query);
      setProducts(normalizeProducts(res));
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const detailProduct = async (productId: number) => {
    try {
      setLoading(true);
      const res = await getProducById(productId);
      const nextProducts = normalizeProducts(res);
      setProducts(nextProducts.length ? nextProducts : []);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching product details.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const submitProduct = async (product: ProductCreate) => {
    try {
      setLoading(true);
      await createProduct(product);
      const res = await getProducts({ page: 1, limit: 100 });
      setProducts(normalizeProducts(res));
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting the product.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const editProduct = async (productId: number, product: ProductCreate) => {
    try {
      setLoading(true);
      await updateProductRequest(productId, product);
      const res = await getProducts({ page: 1, limit: 100 });
      setProducts(normalizeProducts(res));
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the product.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      setLoading(true);
      await removeProduct(productId);
      const res = await getProducts({ page: 1, limit: 100 });
      setProducts(normalizeProducts(res));
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the product.");
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    error,
    loading,
    fetchProducts,
    detailProduct,
    submitProduct,
    editProduct,
    deleteProduct,
  };
}