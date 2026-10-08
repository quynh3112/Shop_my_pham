import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductCreate, ProductItem, ProductQuery } from "../types/product";
import {
  createProduct,
  getProducById,
  getProducts,
  removeProduct,
  updateProduct as updateProductRequest,
} from "../service/product.service";

export const productQueryKey = ["products"] as const;
export const productDetailKey = (id: number) => ["product", id] as const;

const normalizeProducts = (payload: unknown): ProductItem[] => {
  if (Array.isArray(payload)) return payload as ProductItem[];
  if (Array.isArray((payload as { data?: unknown })?.data)) return (payload as { data: ProductItem[] }).data;
  if (Array.isArray((payload as { products?: unknown })?.products)) return (payload as { products: ProductItem[] }).products;

  const nested =
    (payload as { result?: unknown })?.result ??
    (payload as { items?: unknown })?.items ??
    (payload as { docs?: unknown })?.docs ??
    (payload as { data?: { items?: unknown; products?: unknown; data?: unknown } })?.data?.items ??
    (payload as { data?: { items?: unknown; products?: unknown; data?: unknown } })?.data?.products ??
    (payload as { data?: { items?: unknown; products?: unknown; data?: unknown } })?.data?.data;

  return Array.isArray(nested) ? (nested as ProductItem[]) : [];
};

// Lấy id của sản phẩm (hỗ trợ cả id lẫn _id)
const getId = (p: any) => String(p?.id ?? p?._id ?? "");

export default function useProduct() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: productQueryKey,
    queryFn: async () => normalizeProducts(await getProducts()),
  });

  const refreshProducts = () => queryClient.invalidateQueries({ queryKey: productQueryKey });

  const fetchProducts = async (query?: ProductQuery) => {
    const res = await getProducts(query);
    const nextProducts = normalizeProducts(res);
    queryClient.setQueryData(productQueryKey, nextProducts);
    return nextProducts;
  };

  // SỬA: tìm đúng sản phẩm theo id
  const detailProduct = async (productId: number): Promise<ProductItem | null> => {
    const res = await getProducById(productId);

    const list = normalizeProducts(res);
    let product: ProductItem | null = null;

    if (list.length) {
      // API trả mảng -> tìm đúng id
      product = list.find((p) => getId(p) === String(productId)) ?? null;
    } else {
      // API trả 1 object (có thể bọc trong data/product/result)
      const r = res as any;
      const inner = r?.data ?? r?.product ?? r?.result ?? r;
      product = inner && typeof inner === "object" ? (inner as ProductItem) : null;
    }

    queryClient.setQueryData(productDetailKey(productId), product);
    return product;
  };

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: refreshProducts,
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, product }: { productId: number; product: ProductCreate }) =>
      updateProductRequest(productId, product),
    onSuccess: (_data, vars) => {
      refreshProducts();
      queryClient.invalidateQueries({ queryKey: productDetailKey(vars.productId) });
    },
  });

  const editProduct = async (productId: number, product: ProductCreate) => {
    return updateMutation.mutateAsync({ productId, product });
  };

  const deleteMutation = useMutation({
    mutationFn: removeProduct,
    onSuccess: refreshProducts,
  });

  return {
    products: productsQuery.data ?? [],
    error: productsQuery.error instanceof Error ? productsQuery.error.message : null,
    loading:
      productsQuery.isLoading ||
      productsQuery.isFetching ||
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    fetchProducts,
    detailProduct,
    submitProduct: createMutation.mutateAsync,
    editProduct,
    deleteProduct: deleteMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}