import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listMyOrders } from "../service/order.service";
import type { OrderListQuery } from "../types/order";
import { isLoggedIn } from "../utils/auth";
import { orderQueryKey } from "./useOrder";

/** Danh sách đơn hàng của tôi, lọc theo trạng thái + phân trang */
export default function useMyOrders(query: OrderListQuery) {
  const ordersQuery = useQuery({
    queryKey: [...orderQueryKey, "my", query],
    queryFn: () => listMyOrders(query),
    enabled: isLoggedIn(),
    // Đổi tab / trang vẫn giữ danh sách cũ trong lúc tải, tránh nhấp nháy
    placeholderData: keepPreviousData,
  });

  return {
    orders: ordersQuery.data?.items ?? [],
    pagination: ordersQuery.data?.pagination,
    loading: ordersQuery.isLoading,
    fetching: ordersQuery.isFetching,
    error: ordersQuery.error instanceof Error ? ordersQuery.error.message : null,
  };
}
