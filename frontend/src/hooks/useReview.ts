import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addReview,
  deleteMyReview,
  getMyReviewStatus,
  reviewsInProduct,
  updateMyReview,
} from "../service/review.service";
import type { ReviewCreate, ReviewUpdate, ReviewView } from "../types/review";
import { isLoggedIn } from "../utils/auth";

export const reviewQueryKey = ["reviews"] as const;

const isReviewUser = (value: unknown) => {
  if (value === undefined || value === null) return true;
  if (typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "number" &&
    typeof user.fullName === "string" &&
    (user.avatarUrl === undefined ||
      typeof user.avatarUrl === "string" ||
      user.avatarUrl === null)
  );
};

const isReview = (value: unknown): value is ReviewView => {
  if (typeof value !== "object" || value === null) return false;
  const review = value as Record<string, unknown>;
  return (
    typeof review.id === "number" &&
    typeof review.productId === "number" &&
    typeof review.rating === "number" &&
    (typeof review.comment === "string" || review.comment === null) &&
    (review.createdAt === undefined || typeof review.createdAt === "string") &&
    (review.updatedAt === undefined || typeof review.updatedAt === "string") &&
    isReviewUser(review.user)
  );
};

const normalizeReviews = (payload: unknown): ReviewView[] => {
  let reviews: unknown = payload;
  if (!Array.isArray(reviews) && typeof reviews === "object" && reviews !== null) {
    const data = reviews as Record<string, unknown>;
    reviews = data.data ?? data.items ?? data.reviews ?? data.result;
  }
  if (!Array.isArray(reviews) || !reviews.every(isReview)) {
    throw new TypeError("Dữ liệu đánh giá sản phẩm không hợp lệ.");
  }
  return reviews;
};

export default function useReview(productId: number) {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: [...reviewQueryKey, productId] as const,
    queryFn: async () => {
      return normalizeReviews(await reviewsInProduct(productId));
    },
    enabled: Number.isInteger(productId) && productId > 0,
  });

  // Chỉ hỏi khi đã đăng nhập; khách vãng lai không viết đánh giá được
  const statusQuery = useQuery({
    queryKey: [...reviewQueryKey, productId, "me"] as const,
    queryFn: () => getMyReviewStatus(productId),
    enabled: Number.isInteger(productId) && productId > 0 && isLoggedIn(),
  });

  const refreshReviews = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reviews"] }),
      queryClient.invalidateQueries({ queryKey: ["product-rating"] }),
    ]);

  const addMutation = useMutation({
    mutationFn: (payload: ReviewCreate) => addReview(payload),
    onSuccess: refreshReviews,
  });

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: number; payload: ReviewUpdate }) =>
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
    myStatus: statusQuery.data,
    statusLoading: statusQuery.isLoading,
    reviewsQuery,
    addMutation,
    addReview: addMutation.mutateAsync,
    createReview: addMutation.mutateAsync,
    updateMutation,
    updateReview: updateMutation.mutateAsync,
    deleteMutation,
    deleteReview: deleteMutation.mutateAsync,
    isMutating:
      addMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
