import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, listMyFavorites, removeMyFavorite } from "../service/favorite.service";

export const favoriteQueryKey = ["favorites"] as const;

const normalizeFavorites = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  const nested = data.data ?? data.items ?? data.favorites ?? data.result;
  return Array.isArray(nested) ? nested : [];
};

export default function useFavorite() {
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: favoriteQueryKey,
    queryFn: async () => normalizeFavorites(await listMyFavorites()),
  });

  const refreshFavorites = () => queryClient.invalidateQueries({ queryKey: favoriteQueryKey });

  const addMutation = useMutation({
    mutationFn: (payload: { productId: number }) => addFavorite(payload),
    onSuccess: refreshFavorites,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => removeMyFavorite(productId),
    onSuccess: refreshFavorites,
  });

  return {
    favorites: favoritesQuery.data ?? [],
    loading: favoritesQuery.isLoading,
    error: favoritesQuery.error instanceof Error ? favoritesQuery.error.message : null,
    fetchFavorites: favoritesQuery.refetch,
    addFavorite: addMutation.mutateAsync,
    removeFavorite: removeMutation.mutateAsync,
    isMutating: addMutation.isPending || removeMutation.isPending,
  };
}
