import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Rate, message } from "antd";
import useFavorite from "../hooks/useFavorite";
import useRequireLogin from "../hooks/useRequireLogin";
import { avgRatingInProduct } from "../service/review.service";

interface Props {
  productId: number;
}

interface RatingSummary {
  rating: number | null;
  count: number | null;
}

const normalizeRating = (payload: unknown): RatingSummary => {
  if (typeof payload === "number") {
    return { rating: Number.isFinite(payload) ? Math.min(5, Math.max(0, payload)) : null, count: null };
  }
  if (typeof payload !== "object" || payload === null) {
    return { rating: null, count: null };
  }

  const response = payload as Record<string, unknown>;
  const nested = response.data ?? response.result;
  if (nested && typeof nested === "object") return normalizeRating(nested);

  const rawRating = response.averageRating ?? response.avgRating ?? response.average ?? response.rating;
  const rawCount = response.totalReviews ?? response.reviewCount ?? response.review_count ?? response.count;
  const rating = Number(rawRating);
  const count = Number(rawCount);

  return {
    rating:
      rawRating !== undefined && rawRating !== null && Number.isFinite(rating)
        ? Math.min(5, Math.max(0, rating))
        : null,
    count:
      rawCount !== undefined && rawCount !== null && Number.isFinite(count)
        ? count
        : null,
  };
};

export default function ProductRatingFavorite({ productId }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const {
    addFavorite,
    removeFavorite,
    isFavorite,
    isMutating,
  } = useFavorite();
  const { requireLogin, handleAuthError } = useRequireLogin();
  const ratingQuery = useQuery({
    queryKey: ["product-rating", productId],
    queryFn: async () => normalizeRating(await avgRatingInProduct(productId)),
    enabled: Number.isInteger(productId) && productId > 0,
  });
  const favorite = isFavorite(productId);
  const rating = ratingQuery.data?.rating;

  const toggleFavorite = async () => {
    if (!requireLogin()) return;
    try {
      if (favorite) {
        await removeFavorite(productId);
        messageApi.success("Đã xóa sản phẩm khỏi danh sách yêu thích.");
      } else {
        await addFavorite({ productId });
        messageApi.success("Đã thêm sản phẩm vào danh sách yêu thích.");
      }
    } catch (error) {
      if (handleAuthError(error)) return;
      messageApi.error(
        error instanceof Error
          ? `Không thể cập nhật yêu thích: ${error.message}`
          : "Không thể cập nhật danh sách yêu thích.",
      );
    }
  };

  return (
    <>
      {contextHolder}
      <div className="mb-5 flex min-h-11 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {ratingQuery.isPending ? (
            <span className="text-sm text-[#987979]">Đang tải đánh giá...</span>
          ) : ratingQuery.isError ? (
            <span className="text-sm text-[#bd5555]">Không tải được điểm đánh giá.</span>
          ) : rating === null || rating === undefined ? (
            <span className="text-sm text-[#987979]">Chưa có đánh giá</span>
          ) : (
            <>
              <Rate disabled allowHalf value={rating} className="!text-base !text-[#d6a34e]" />
              <span className="font-medium text-[#553c3c]">{rating.toFixed(1)}</span>
              {ratingQuery.data.count !== null && ratingQuery.data.count > 0 ? (
                <span className="text-sm text-[#987979]">({ratingQuery.data.count} đánh giá)</span>
              ) : (
                <span className="text-sm text-[#987979]">Chưa có đánh giá</span>
              )}
            </>
          )}
        </div>
        <Button
          type="text"
          shape="circle"
          aria-label={favorite ? "Bỏ yêu thích sản phẩm" : "Thêm sản phẩm vào yêu thích"}
          title={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          icon={favorite ? <HeartFilled /> : <HeartOutlined />}
          className={`!h-11 !w-11 shrink-0 !text-xl ${favorite ? "!text-[#d66c6d]" : "!text-[#987979] hover:!text-[#d66c6d]"}`}
          loading={isMutating}
          onClick={() => void toggleFavorite()}
        />
      </div>
    </>
  );
}
