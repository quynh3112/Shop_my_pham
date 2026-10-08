import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addReview, listMyReviews, deleteMyReview, updateMyReview } from "../service/review.service";
import type { ReviewCreate } from "../types/review";

export const reviewQueryKey = ["reviews"] as const;

const normalizeReviews = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  const nested = data.data ?? data.items ?? data.reviews ?? data.result;
  return Array.isArray(nested) ? nested : [];
};

export default function useReview() {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: reviewQueryKey,
    queryFn: async () => normalizeReviews(await listMyReviews()),
  });

  const refreshReviews = () => queryClient.invalidateQueries({ queryKey: reviewQueryKey });

  const addMutation = useMutation({
    mutationFn: addReview,
    onSuccess: refreshReviews,
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: ReviewCreate }) =>
      updateMyReview(productId, payload),
    onSuccess: refreshReviews,
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => deleteMyReview(reviewId),
    onSuccess: refreshReviews,
  });

  return {
    reviews: reviewsQuery.data ?? [],
    loading: reviewsQuery.isLoading,
    error: reviewsQuery.error instanceof Error ? reviewsQuery.error.message : null,
    fetchReviews: reviewsQuery.refetch,
    reviewsQuery,
    addMutation,
    addReview: addMutation.mutateAsync,
    updateMutation,
    updateReview: updateMutation.mutateAsync,
    deleteMutation,
    deleteReview: deleteMutation.mutateAsync,
    isMutating: addMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
