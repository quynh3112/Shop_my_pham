import { useQuery } from "@tanstack/react-query";
import { getBestSellers, getProducts } from "../service/product.service";
import { normalizeProducts } from "./useProduct";

const COLLECTION_STALE_TIME = 5 * 60 * 1000;

/** Sản phẩm bán chạy cho trang chủ */
export function useBestSellers(limit = 12) {
  const query = useQuery({
    queryKey: ["products", "best-sellers", limit],
    queryFn: () => getBestSellers(limit),
    staleTime: COLLECTION_STALE_TIME,
  });
  return { products: query.data ?? [], loading: query.isLoading };
}

/** Sản phẩm mới nhất cho trang chủ */
export function useNewProducts(limit = 12) {
  const query = useQuery({
    queryKey: ["products", "newest", limit],
    queryFn: async () => normalizeProducts(await getProducts({ sort: "newest", page: 1, limit })),
    staleTime: COLLECTION_STALE_TIME,
  });
  return { products: query.data ?? [], loading: query.isLoading };
}
