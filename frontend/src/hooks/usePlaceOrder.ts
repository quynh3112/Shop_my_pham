import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buyNowOrder, createOrder } from "../service/order.service";
import type { OrderDetail } from "../types/order";
import { cartQueryKey } from "./useCart";
import { orderDetailKey } from "./useOrderDetail";
import { orderQueryKey } from "./useOrder";

/** Đặt hàng từ giỏ hoặc mua ngay; xong thì làm mới giỏ hàng, danh sách đơn và lưu sẵn chi tiết đơn */
export default function usePlaceOrder() {
  const queryClient = useQueryClient();

  const onPlaced = (order: OrderDetail) => {
    queryClient.setQueryData(orderDetailKey(order.code), order);
    void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    void queryClient.invalidateQueries({ queryKey: orderQueryKey });
    // Số lượng bán / tồn kho thay đổi
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const cartMutation = useMutation({ mutationFn: createOrder, onSuccess: onPlaced });
  const buyNowMutation = useMutation({ mutationFn: buyNowOrder, onSuccess: onPlaced });

  return {
    placeCartOrder: cartMutation.mutateAsync,
    placeBuyNowOrder: buyNowMutation.mutateAsync,
    placing: cartMutation.isPending || buyNowMutation.isPending,
  };
}
