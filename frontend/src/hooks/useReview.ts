import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addReview,
  deleteMyReview,
  listMyReviews,
  reviewsInProduct,
  updateMyReview,
} from "../service/review.service";
import type { ReviewCreate } from "../types/review";

export const reviewQueryKey = ["reviews"] as const;

const normalizeReviews = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  const nested = data.data ?? data.items ?? data.reviews ?? data.result;
  return Array.isArray(nested) ? nested : [];
};

export default function useReview(productId?: number) {
  const queryClient = useQueryClient();
  const validProductId = productId !== undefined && Number.isInteger(productId) && productId > 0 ? productId : undefined;

  const reviewsQuery = useQuery({
    queryKey: validProductId ? (["reviews", validProductId] as const) : reviewQueryKey,
    queryFn: async () => {
      const payload = validProductId
        ? await reviewsInProduct(validProductId)
        : await listMyReviews();

      return normalizeReviews(payload);
    },
  });

  const refreshReviews = () => queryClient.invalidateQueries({ queryKey: ["reviews"] });

  const addMutation = useMutation({
    mutationFn: (payload: ReviewCreate) => addReview(payload),
    onSuccess: refreshReviews,
  });

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: number; payload: ReviewCreate }) =>
      updateMyReview(reviewId, payload),
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
    createReview: addMutation.mutateAsync,
    updateMutation,
    updateReview: updateMutation.mutateAsync,
    deleteMutation,
    deleteReview: deleteMutation.mutateAsync,
    isMutating: addMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
