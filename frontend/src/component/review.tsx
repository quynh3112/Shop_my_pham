import { UserOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Avatar, Button, Empty, Input, Rate, Spin, message } from "antd";
import { isAxiosError } from "axios";
import { useState } from "react";
import useReview from "../hooks/useReview";
import useRequireLogin from "../hooks/useRequireLogin";

interface Props {
  productId: number;
}

interface ReviewItem {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  user?: {
    fullName?: string;
    avatarUrl?: string | null;
  };
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "";

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const serverMessage = error.response?.data?.message;
    if (Array.isArray(serverMessage)) return serverMessage.join(", ");
    if (typeof serverMessage === "string") return serverMessage;
  }
  return error instanceof Error ? error.message : "Không thể gửi đánh giá.";
};

export default function Review({ productId }: Props) {
  const validProductId = Number.isInteger(productId) && productId > 0;
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const { requireLogin, handleAuthError } = useRequireLogin();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const {
    reviews,
    loading: isPending,
    error,
    createReview,
    isMutating,
  } = useReview(validProductId ? productId : undefined);
  const items = reviews as ReviewItem[];

  const handleSubmit = async () => {
    if (!requireLogin()) return;
    try {
      await createReview({ productId, rating, comment: comment.trim() });
      await queryClient.invalidateQueries({ queryKey: ["product-rating", productId] });
      setRating(5);
      setComment("");
      messageApi.success("Cảm ơn bạn đã đánh giá sản phẩm.");
    } catch (submitError) {
      if (handleAuthError(submitError)) return;
      messageApi.error(getErrorMessage(submitError));
    }
  };

  if (!validProductId) return null;

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 shadow-[0_12px_45px_rgba(112,65,65,0.08)] sm:p-8 lg:p-12">
      {contextHolder}
      <h2 className="!mb-6 !text-2xl !font-normal !text-[#3b2929]">
        Đánh giá sản phẩm
        <span className="ml-2 text-base text-[#a17e7e]">({items.length})</span>
      </h2>

      <div className="mb-8 rounded-xl border border-[#f1e2e0] bg-[#fffafa] p-5">
        <p className="mb-2 text-sm text-[#765f5f]">Chọn số sao</p>
        <Rate value={rating} onChange={(value) => setRating(value || 1)} />
        <Input.TextArea
          className="!mt-4"
          rows={4}
          maxLength={1000}
          showCount
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <div className="mt-4 flex justify-end">
          <Button
            type="primary"
            loading={isMutating}
            onClick={() => void handleSubmit()}
            className="!bg-[#c9696b] hover:!bg-[#b55a5c]"
          >
            Gửi đánh giá
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : error ? (
        <Alert type="error" showIcon message="Không thể tải đánh giá" description={error} />
      ) : items.length === 0 ? (
        <Empty description="Chưa có đánh giá nào cho sản phẩm này." />
      ) : (
        <ul className="divide-y divide-[#f1e2e0]">
          {items.map((review) => (
            <li key={review.id} className="flex gap-4 py-5">
              <Avatar
                src={review.user?.avatarUrl || undefined}
                icon={<UserOutlined />}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[#3b2929]">
                    {review.user?.fullName ?? "Khách hàng"}
                  </span>
                  <span className="text-xs text-[#a17e7e]">{formatDate(review.createdAt)}</span>
                </div>
                <Rate disabled value={review.rating} className="!text-sm" />
                {review.comment && (
                  <p className="mt-2 whitespace-pre-line leading-6 text-[#765f5f]">
                    {review.comment}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
