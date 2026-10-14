import { DeleteOutlined, EditOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Popconfirm, Rate, Tag, Tooltip } from "antd";
import { toFileUrl } from "../../service/product.service";
import type { ReviewView } from "../../types/review";

const formatReviewDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
};

interface Props {
  review: ReviewView;
  /** Đánh giá của chính người đang xem -> hiện nhãn + nút sửa / xoá */
  isMine?: boolean;
  deleting?: boolean;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
}

export default function ReviewItem({ review, isMine, deleting, onEdit, onDelete }: Props) {
  const reviewDate = formatReviewDate(review.createdAt);
  const edited = review.updatedAt && review.createdAt && review.updatedAt !== review.createdAt;

  return (
    <div className={`flex gap-3 ${isMine ? "rounded-xl bg-[#fff4f2] p-4" : ""}`}>
      <Avatar
        src={review.user?.avatarUrl ? toFileUrl(review.user.avatarUrl) : undefined}
        icon={<UserOutlined />}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-[#553c3c]">{review.user?.fullName || "Khách hàng"}</span>
            {isMine && (
              <Tag color="#e16463" className="!m-0 !rounded-full">
                Đánh giá của bạn
              </Tag>
            )}
          </div>
          <div className="flex items-center gap-1">
            {reviewDate && (
              <time dateTime={review.createdAt} className="text-xs text-[#a17e7e]">
                {reviewDate}
                {edited && " · đã sửa"}
              </time>
            )}
            {isMine && (
              <>
                <Tooltip title="Sửa đánh giá">
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={onEdit} aria-label="Sửa đánh giá" />
                </Tooltip>
                <Popconfirm
                  title="Xoá đánh giá của bạn?"
                  okText="Xoá"
                  cancelText="Huỷ"
                  onConfirm={() => onDelete?.()}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    loading={deleting}
                    icon={<DeleteOutlined />}
                    aria-label="Xoá đánh giá"
                  />
                </Popconfirm>
              </>
            )}
          </div>
        </div>
        <Rate disabled value={review.rating} className="!text-sm !text-[#d6a34e]" />
        {review.comment && (
          <p className="mb-0 mt-2 whitespace-pre-wrap leading-7 text-[#765f5f]">{review.comment}</p>
        )}
      </div>
    </div>
  );
}
