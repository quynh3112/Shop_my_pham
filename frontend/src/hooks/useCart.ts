import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCart, clearCart, getCart, removeItem, updateCart } from "../service/cart.service";
import { isLoggedIn } from "../utils/auth";

export const cartQueryKey = ["carts"] as const;

export default function useCart() {
    const queryClient = useQueryClient();
    const cartsQuery = useQuery({
        queryKey: cartQueryKey,
        queryFn: getCart,
        enabled: isLoggedIn(),
    });

    const refreshCarts = () => queryClient.invalidateQueries({ queryKey: cartQueryKey });
    const addMutation = useMutation({ mutationFn: addCart, onSuccess: refreshCarts });
    const updateMutation = useMutation({
        mutationFn: ({ id, quantity }: { id: number; quantity: number }) => updateCart(id, quantity),
        onSuccess: refreshCarts,
    });
    const removeMutation = useMutation({ mutationFn: removeItem, onSuccess: refreshCarts });
    const clearMutation = useMutation({ mutationFn: clearCart, onSuccess: refreshCarts });

    return {
        cart: cartsQuery.data,
        loading: cartsQuery.isLoading,
        error: cartsQuery.error instanceof Error ? cartsQuery.error.message : null,
        fetchCart: cartsQuery.refetch,
        addCart: addMutation.mutateAsync,
        updateCart: updateMutation.mutateAsync,
        removeItem: removeMutation.mutateAsync,
        clearCart: clearMutation.mutateAsync,
        isMutating:
            addMutation.isPending ||
            updateMutation.isPending ||
            removeMutation.isPending ||
            clearMutation.isPending,
    };
}
