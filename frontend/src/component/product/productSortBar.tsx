import { ArrowDownOutlined, ArrowUpOutlined, SwapOutlined } from "@ant-design/icons";
import type { ProductQuery } from "../../types/product";

type Sort = NonNullable<ProductQuery["sort"]>;

// Các kiểu sắp xếp hay dùng hiện thành nút; kiểu khác vẫn chọn được trong bộ lọc
export const QUICK_SORTS: { value: Sort; label: string }[] = [
  // Cá nhân hoá (chỉ hiện khi đã đăng nhập)
  { value: "for-you", label: "Dành cho bạn" },
  // Xếp theo độ khớp với từ khoá tìm kiếm (không phải gợi ý cá nhân hoá)
  { value: "relevance", label: "Liên quan" },
  { value: "newest", label: "Mới nhất" },
  { value: "best-selling", label: "Bán chạy" },
];

interface Props {
  value?: Sort;
  onChange: (sort: Sort) => void;
  /** Đang tìm từ khoá thì mới có nút "Liên quan" */
  hasSearch?: boolean;
  /** Đã đăng nhập thì có nút "Dành cho bạn" */
  loggedIn?: boolean;
  disabled?: boolean;
}

const buttonClass = (active: boolean) =>
  `inline-flex items-center gap-1.5 border px-4 py-1.5 text-sm transition disabled:cursor-wait disabled:opacity-60 ${
    active
      ? "border-[#d9797d] bg-[#d9797d] text-white"
      : "border-[#f3d5d7] bg-white text-[#3d2a2a] hover:border-[#d9797d] hover:text-[#d9797d]"
  }`;

/** Hàng nút sắp xếp nhanh phía trên danh sách sản phẩm */
export default function ProductSortBar({ value, onChange, hasSearch = false, loggedIn = false, disabled }: Props) {
  const priceActive = value === "price-asc" || value === "price-desc";
  // Nút Giá: lần đầu thấp -> cao, bấm tiếp thì đảo chiều
  const nextPriceSort: Sort = value === "price-asc" ? "price-desc" : "price-asc";
  const priceTitle =
    value === "price-asc"
      ? "Đang xếp giá thấp → cao (bấm để đảo chiều)"
      : value === "price-desc"
        ? "Đang xếp giá cao → thấp (bấm để đảo chiều)"
        : "Sắp xếp theo giá";

  return (
    <div role="radiogroup" aria-label="Sắp xếp sản phẩm" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-gray-500">Sắp xếp theo</span>
      {QUICK_SORTS.filter(
        (option) => (hasSearch || option.value !== "relevance") && (loggedIn || option.value !== "for-you"),
      ).map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => !active && onChange(option.value)}
            className={buttonClass(active)}
          >
            {option.label}
          </button>
        );
      })}
      <button
        type="button"
        role="radio"
        aria-checked={priceActive}
        disabled={disabled}
        title={priceTitle}
        aria-label={priceTitle}
        onClick={() => onChange(nextPriceSort)}
        className={buttonClass(priceActive)}
      >
        Giá
        {value === "price-asc" ? (
          <ArrowUpOutlined />
        ) : value === "price-desc" ? (
          <ArrowDownOutlined />
        ) : (
          <SwapOutlined rotate={90} className="opacity-60" />
        )}
      </button>
    </div>
  );
}
