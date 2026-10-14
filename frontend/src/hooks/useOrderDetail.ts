import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelMyOrder, getMyOrder } from "../service/order.service";
import { isLoggedIn } from "../utils/auth";
import { orderQueryKey } from "./useOrder";

export const orderDetailKey = (code: string) => ["orders", "detail", code] as const;

/** Chi tiết 1 đơn hàng của tôi theo mã đơn */
export default function useOrderDetail(code?: string) {
  const queryClient = useQueryClient();
  const orderQuery = useQuery({
    queryKey: orderDetailKey(code ?? ""),
    queryFn: () => getMyOrder(code!),
    enabled: Boolean(code) && isLoggedIn(),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelMyOrder(code!),
    onSuccess: (order) => {
      queryClient.setQueryData(orderDetailKey(order.code), order);
      void queryClient.invalidateQueries({ queryKey: orderQueryKey });
    },
  });

  return {
    order: orderQuery.data,
    loading: orderQuery.isLoading,
    error: orderQuery.error,
    cancelOrder: cancelMutation.mutateAsync,
    cancelling: cancelMutation.isPending,
  };
}
