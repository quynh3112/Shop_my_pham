import { SearchOutlined } from "@ant-design/icons";
import { Button, Checkbox, ConfigProvider, Input, InputNumber, Select } from "antd";
import type { FormEvent } from "react";
import type { Category } from "../../../types/category";
import type { ProductQuery } from "../../../types/product";
import { isLoggedIn } from "../../../utils/auth";
import { isSkincareCategory } from "../../../utils/category";
import CategoryTreeFilter from "./categoryTreeFilter";
import FilterSection from "./filterSection";
import SkinFilterFields from "./skinFilterFields";

export type ProductFilterField =
  | "search"
  | "category"
  | "price"
  | "variant"
  | "size"
  | "skin"
  | "rating"
  | "inStock"
  | "sort";

export const SORT_OPTIONS: { value: NonNullable<ProductQuery["sort"]>; label: string }[] = [
  { value: "for-you", label: "Dành cho bạn" },
  { value: "relevance", label: "Liên quan (khi tìm kiếm)" },
  { value: "newest", label: "Mới nhất" },
  { value: "best-selling", label: "Bán chạy" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
  { value: "name", label: "Tên sản phẩm" },
];

interface Props {
  value: ProductQuery;
  /** Cập nhật một phần bộ lọc (chưa tìm ngay, bấm "Tìm sản phẩm" mới áp dụng) */
  onChange: (patch: Partial<ProductQuery>) => void;
  onApply: () => void;
  onReset: () => void;
  categories: Category[];
  applying?: boolean;
  /** Ẩn bớt mục lọc khi dùng ở trang khác (vd. trang danh mục không cần chọn thể loại) */
  hide?: ProductFilterField[];
  title?: string;
}

/** Bộ lọc sản phẩm dùng lại được: tìm kiếm, cây danh mục, giá, phân loại, loại da (Skincare), đánh giá... */
export default function ProductFilter({
  value,
  onChange,
  onApply,
  onReset,
  categories,
  applying,
  hide = [],
  title = "Bộ lọc sản phẩm",
}: Props) {
  const show = (field: ProductFilterField) => !hide.includes(field);
  // Loại da / vấn đề da chỉ có ý nghĩa với sản phẩm Skincare
  const showSkin = show("skin") && isSkincareCategory(categories, value.categoryId);

  const changeCategory = (categoryId: number | undefined) => {
    const stillSkincare = isSkincareCategory(categories, categoryId);
    // Rời nhánh Skincare thì bỏ luôn điều kiện loại da để không lọc nhầm
    onChange(stillSkincare ? { categoryId } : { categoryId, skinTypes: undefined, concerns: undefined });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    // Bộ lọc vuông góc: bỏ bo góc cho cả các ô nhập / nút antd bên trong
    <ConfigProvider theme={{ token: { borderRadius: 0, borderRadiusLG: 0, borderRadiusSM: 0, borderRadiusXS: 0 } }}>
    <aside className="w-full border border-[#f3d5d7] bg-white p-5 shadow-sm lg:w-[300px] lg:shrink-0">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#3d2a2a]">{title}</h3>
        <Button type="link" onClick={onReset} className="p-0 text-[#d9797d]">
          Xóa lọc
        </Button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {show("search") && (
          <FilterSection label="Tìm kiếm">
            <Input
              allowClear
              size="large"
              placeholder="Tên, mô tả, danh mục... (gõ không dấu được)"
              prefix={<SearchOutlined className="text-gray-400" />}
              value={value.search}
              onChange={(event) => onChange({ search: event.target.value || undefined })}
            />
          </FilterSection>
        )}

        {show("category") && (
          <FilterSection label="Thể loại">
            <CategoryTreeFilter categories={categories} value={value.categoryId} onChange={changeCategory} />
          </FilterSection>
        )}

        {showSkin && (
          <SkinFilterFields
            skinTypes={value.skinTypes}
            concerns={value.concerns}
            onChange={(patch) => onChange(patch)}
          />
        )}

        {show("price") && (
          <FilterSection label="Khoảng giá">
            <div className="grid grid-cols-2 gap-3">
              <InputNumber
                min={0}
                size="large"
                style={{ width: "100%" }}
                placeholder="Từ"
                value={value.minPrice}
                onChange={(price) => onChange({ minPrice: price ?? undefined })}
              />
              <InputNumber
                min={0}
                size="large"
                style={{ width: "100%" }}
                placeholder="Đến"
                value={value.maxPrice}
                onChange={(price) => onChange({ maxPrice: price ?? undefined })}
              />
            </div>
          </FilterSection>
        )}

        {show("variant") && (
          <FilterSection label="Tông màu / phân loại">
            <Input
              allowClear
              size="large"
              placeholder="VD: Shade 01"
              value={value.variantName}
              onChange={(event) => onChange({ variantName: event.target.value || undefined })}
            />
          </FilterSection>
        )}

        {show("size") && (
          <FilterSection label="Dung tích">
            <Input
              allowClear
              size="large"
              placeholder="VD: 50ml"
              value={value.size}
              onChange={(event) => onChange({ size: event.target.value || undefined })}
            />
          </FilterSection>
        )}

        {show("rating") && (
          <FilterSection label="Đánh giá">
            <Select
              allowClear
              size="large"
              style={{ width: "100%" }}
              placeholder="Tất cả"
              options={[
                { value: 4, label: "Từ 4★ trở lên" },
                { value: 3, label: "Từ 3★ trở lên" },
              ]}
              value={value.minRating}
              onChange={(minRating) => onChange({ minRating })}
            />
          </FilterSection>
        )}

        {show("inStock") && (
          <Checkbox
            checked={value.inStock ?? false}
            onChange={(event) => onChange({ inStock: event.target.checked || undefined })}
          >
            Chỉ hiện sản phẩm còn hàng
          </Checkbox>
        )}

        {show("sort") && (
          <FilterSection label="Sắp xếp">
            <Select
              size="large"
              style={{ width: "100%" }}
              value={value.sort}
              // "Liên quan" chỉ dùng được khi có từ khoá tìm kiếm
              options={SORT_OPTIONS.filter(
                (option) =>
                  (value.search || option.value !== "relevance") && (isLoggedIn() || option.value !== "for-you"),
              )}
              onChange={(sort: ProductQuery["sort"]) => onChange({ sort })}
            />
          </FilterSection>
        )}

        <Button
          htmlType="submit"
          type="primary"
          block
          loading={applying}
          className="border-[#d9797d] bg-[#d9797d] hover:!border-[#c8676b] hover:!bg-[#c8676b]"
        >
          Tìm sản phẩm
        </Button>
      </form>
    </aside>
    </ConfigProvider>
  );
}
