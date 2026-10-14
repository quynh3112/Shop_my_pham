export interface ReviewCreate {
    id?: number;
    productId: number;
    rating: number;
    comment: string;
}

// Sửa đánh giá: chỉ đổi số sao và nội dung
export interface ReviewUpdate {
    rating: number;
    comment: string;
}

export interface ReviewView {
    id: number;
    userId?: number;
    productId: number;
    rating: number;
    comment: string | null;
    createdAt?: string;
    updatedAt?: string;
    user?: {
        id: number;
        fullName: string;
        avatarUrl?: string | null;
    } | null;
}

/** Người đang xem có được viết đánh giá không + đánh giá của chính họ */
export interface MyReviewStatus {
    hasPurchased: boolean;
    canReview: boolean;
    myReview: ReviewView | null;
}
