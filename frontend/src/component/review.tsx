import { Alert, Spin, message } from "antd";
import { useState } from "react";
import useReview from "../hooks/useReview";
import useRequireLogin from "../hooks/useRequireLogin";
import { getApiErrorMessage } from "../utils/error";
import ReviewForm, { type ReviewFormValues } from "./review/reviewForm";
import ReviewItem from "./review/reviewItem";

interface Props {
  productId: number;
}

export default function Review({ productId }: Props) {
  const validProductId = Number.isInteger(productId) && productId > 0;
  const {
    reviews,
    loading,
    error,
    myStatus,
    createReview,
    updateReview,
    deleteReview,
    addMutation,
    updateMutation,
    deleteMutation,
  } = useReview(productId);
  const { requireLogin, handleAuthError } = useRequireLogin();
  const [messageApi, contextHolder] = message.useMessage();
  const [editing, setEditing] = useState(false);

  const myReview = myStatus?.myReview ?? null;
  // Đánh giá của mình lên đầu danh sách
  const sortedReviews = myReview
    ? [...reviews.filter((review) => review.id === myReview.id), ...reviews.filter((review) => review.id !== myReview.id)]
    : reviews;

  const runAction = async (action: () => Promise<unknown>, success: string, fallback: string) => {
    if (!requireLogin()) return false;
    try {
      await action();
      messageApi.success(success);
      return true;
    } catch (actionError) {
      if (!handleAuthError(actionError)) messageApi.error(getApiErrorMessage(actionError, fallback));
      return false;
    }
  };

  const handleCreate = (values: ReviewFormValues) =>
    runAction(
      () => createReview({ productId, ...values }),
      "Cảm ơn bạn đã gửi đánh giá.",
      "Không thể gửi đánh giá, vui lòng thử lại.",
    );

  const handleUpdate = async (values: ReviewFormValues) => {
    if (!myReview) return;
    const ok = await runAction(
      () => updateReview({ reviewId: myReview.id, payload: values }),
      "Đã cập nhật đánh giá.",
      "Không thể sửa đánh giá, vui lòng thử lại.",
    );
    if (ok) setEditing(false);
  };

  const handleDelete = async () => {
    if (!myReview) return;
    const ok = await runAction(() => deleteReview(myReview.id), "Đã xoá đánh giá.", "Không thể xoá đánh giá.");
    if (ok) setEditing(false);
  };

  if (!validProductId) return null;

  return (
    <>
      {contextHolder}
      <section
        aria-labelledby="product-reviews-heading"
        className="mt-10 rounded-2xl bg-white p-5 shadow-[0_12px_45px_rgba(112,65,65,0.08)] sm:p-8"
      >
        <div className="mb-6 border-b border-[#f1e2e0] pb-5">
          <h2 id="product-reviews-heading" className="!mb-2 !text-2xl !font-medium !text-[#3b2929]">
            Đánh giá sản phẩm
          </h2>
          <p className="m-0 text-sm text-[#987979]">{reviews.length} đánh giá</p>
        </div>

        {/* Chỉ khách đã mua + nhận hàng và chưa đánh giá mới thấy form viết đánh giá */}
        {myStatus?.canReview && (
          <div className="mb-8 rounded-xl bg-[#fffafa] p-4 sm:p-5">
            <h3 className="mb-3 text-base font-medium text-[#553c3c]">Viết đánh giá của bạn</h3>
            <ReviewForm submitting={addMutation.isPending} onSubmit={handleCreate} />
          </div>
        )}
        {/* {(!isLoggedIn() || (myStatus && !myStatus.hasPurchased)) && (
          <p className="mb-6 flex items-center gap-2 text-xs text-[#987979]">
            <LockOutlined /> Chỉ khách đã mua và nhận hàng thành công mới có thể đánh giá sản phẩm này.
          </p>
        )} */}

        {error ? (
          <Alert type="error" showIcon message="Không thể tải đánh giá" description={error} />
        ) : loading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : sortedReviews.length === 0 ? (
          <p className="py-6 text-center text-[#987979]">Sản phẩm chưa có đánh giá nào.</p>
        ) : (
          <ul className="m-0 list-none divide-y divide-[#f1e2e0] p-0">
            {sortedReviews.map((review) => {
              const isMine = review.id === myReview?.id;
              return (
                <li key={review.id} className="py-5 first:pt-0 last:pb-0">
                  {isMine && editing ? (
                    <div className="rounded-xl bg-[#fff4f2] p-4">
                      <h3 className="mb-3 text-base font-medium text-[#553c3c]">Sửa đánh giá của bạn</h3>
                      <ReviewForm
                        initialValues={{ rating: review.rating, comment: review.comment ?? "" }}
                        submitText="Lưu thay đổi"
                        submitting={updateMutation.isPending}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditing(false)}
                      />
                    </div>
                  ) : (
                    <ReviewItem
                      review={review}
                      isMine={isMine}
                      deleting={deleteMutation.isPending}
                      onEdit={() => setEditing(true)}
                      onDelete={handleDelete}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
