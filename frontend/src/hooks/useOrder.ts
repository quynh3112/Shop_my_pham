import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelMyOrder, confirmMyOrder, createOrder, listMyOrders } from "../service/order.service";

export const orderQueryKey = ["orders"] as const;
export default function useOrder() {
    const queryClient= useQueryClient();
    const ordersQuery = useQuery({
        queryKey: orderQueryKey,
        queryFn: () => listMyOrders(),
    });
    const refreshOrders=()=>queryClient.invalidateQueries({queryKey:orderQueryKey});
    const addMutation=useMutation({mutationFn:createOrder,onSuccess:refreshOrders});
    const cancelMutation=useMutation({
        mutationFn:({code}:{code:string})=>cancelMyOrder(code),
        onSuccess:refreshOrders
    })
    const confirmMutation=useMutation({
        mutationFn:({id,body}:{id:number,body:any})=>confirmMyOrder(id,body),
        onSuccess:refreshOrders
    })
    return {
        orders:ordersQuery.data,
        loading:ordersQuery.isLoading,
        error:ordersQuery.error instanceof Error?ordersQuery.error.message:null,
        fetchOrders:ordersQuery.refetch,
        createOrder:addMutation.mutateAsync,
        cancelOrder:cancelMutation.mutateAsync,
        confirmOrder:confirmMutation.mutateAsync,
        isMutating:addMutation.isPending||cancelMutation.isPending||confirmMutation.isPending
    }
}