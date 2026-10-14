import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adjustStock, listMovements, listStock, receiveStock } from "../service/inventory.service";
import type { AdjustStockInput, MovementListQuery, ReceiveStockInput, StockListQuery } from "../types/inventory";

export const inventoryQueryKey = ["inventory"] as const;

/** Danh sách tồn kho theo biến thể (có tổng quan) */
export function useStockList(query: StockListQuery) {
  const stockQuery = useQuery({
    queryKey: [...inventoryQueryKey, "stock", query],
    queryFn: () => listStock(query),
    placeholderData: keepPreviousData,
  });
  return {
    items: stockQuery.data?.items ?? [],
    summary: stockQuery.data?.summary,
    pagination: stockQuery.data?.pagination,
    loading: stockQuery.isLoading,
    fetching: stockQuery.isFetching,
    error: stockQuery.error instanceof Error ? stockQuery.error.message : null,
    refetch: stockQuery.refetch,
  };
}

/** Lịch sử nhập / xuất kho (lọc theo biến thể, loại, ngày) */
export function useMovements(query: MovementListQuery, enabled = true) {
  const movementsQuery = useQuery({
    queryKey: [...inventoryQueryKey, "movements", query],
    queryFn: () => listMovements(query),
    placeholderData: keepPreviousData,
    enabled,
  });
  return {
    items: movementsQuery.data?.items ?? [],
    pagination: movementsQuery.data?.pagination,
    loading: movementsQuery.isLoading,
    fetching: movementsQuery.isFetching,
    error: movementsQuery.error instanceof Error ? movementsQuery.error.message : null,
  };
}

/** Nhập hàng / kiểm kho; xong thì làm mới kho và dữ liệu sản phẩm (tồn kho hiển thị cho khách) */
export function useStockActions() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: inventoryQueryKey });
    void queryClient.invalidateQueries({ queryKey: ["products"] });
    void queryClient.invalidateQueries({ queryKey: ["product"] });
  };

  const receiveMutation = useMutation({
    mutationFn: ({ variantId, input }: { variantId: number; input: ReceiveStockInput }) =>
      receiveStock(variantId, input),
    onSuccess: refresh,
  });
  const adjustMutation = useMutation({
    mutationFn: ({ variantId, input }: { variantId: number; input: AdjustStockInput }) =>
      adjustStock(variantId, input),
    onSuccess: refresh,
  });

  return {
    receive: receiveMutation.mutateAsync,
    adjust: adjustMutation.mutateAsync,
    saving: receiveMutation.isPending || adjustMutation.isPending,
  };
}
