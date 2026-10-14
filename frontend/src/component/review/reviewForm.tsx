import { Button, Input, Rate } from "antd";
import { useState } from "react";

const MAX_COMMENT = 1000;

export interface ReviewFormValues {
  rating: number;
  comment: string;
}

interface Props {
  initialValues?: ReviewFormValues;
  submitText?: string;
  submitting?: boolean;
  onSubmit: (values: ReviewFormValues) => unknown;
  /** Có thì hiện nút Huỷ (dùng khi sửa đánh giá) */
  onCancel?: () => void;
}

/** Chọn số sao + viết nhận xét; dùng chung cho viết mới và sửa đánh giá */
export default function ReviewForm({
  initialValues,
  submitText = "Gửi đánh giá",
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const [rating, setRating] = useState(initialValues?.rating ?? 0);
  const [comment, setComment] = useState(initialValues?.comment ?? "");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Rate value={rating} onChange={setRating} className="!text-[#d6a34e]" aria-label="Số sao đánh giá" />
        <span className="text-sm text-[#987979]">{rating > 0 ? `${rating} / 5 sao` : "Chọn số sao"}</span>
      </div>
      <Input.TextArea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
        maxLength={MAX_COMMENT}
        showCount
        autoSize={{ minRows: 3, maxRows: 6 }}
        className="!border-[#e8caca] focus:!border-[#d66c6d]"
      />
      <div className="mt-4 flex justify-end gap-2">
        {onCancel && (
          <Button onClick={onCancel} disabled={submitting}>
            Huỷ
          </Button>
        )}
        <Button
          type="primary"
          loading={submitting}
          disabled={rating === 0}
          onClick={() => void onSubmit({ rating, comment: comment.trim() })}
          className="!h-10 !border-[#d66c6d] !bg-[#d66c6d] hover:!border-[#bc5758] hover:!bg-[#bc5758]"
        >
          {submitText}
        </Button>
      </div>
    </div>
  );
}
