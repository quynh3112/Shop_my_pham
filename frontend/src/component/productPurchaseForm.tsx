import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, InputNumber, Select } from "antd";
import { useState } from "react";
import type { ProductVariantItem } from "../types/product";

interface Props {
  variants: ProductVariantItem[];
  productStock?: number;
  isMutating: boolean;
  onPurchase: (variantId: number, quantity: number, buyNow: boolean) => void;
}

export default function ProductPurchaseForm({
  variants,
  productStock,
  isMutating,
  onPurchase,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const displayedVariantIndex =
    variants[selectedVariantIndex] &&
    (variants[selectedVariantIndex].stock ??
      variants[selectedVariantIndex].initialStock ??
      productStock ??
      0) > 0
      ? selectedVariantIndex
      : Math.max(
          0,
          variants.findIndex(
            (variant) => (variant.stock ?? variant.initialStock ?? productStock ?? 0) > 0,
          ),
        );
  const selectedVariant = variants[displayedVariantIndex];
  const selectedVariantId = selectedVariant?.id ?? selectedVariant?.variantId;
  const availableStock = selectedVariant
    ? selectedVariant.stock ?? selectedVariant.initialStock ?? productStock ?? 0
    : productStock ?? 0;
  const hasStock = availableStock > 0;
  const canPurchase = hasStock && Number.isInteger(selectedVariantId);

  const purchase = (buyNow: boolean) => {
    if (selectedVariantId !== undefined && Number.isInteger(selectedVariantId)) {
      onPurchase(selectedVariantId, quantity, buyNow);
    }
  };

  return (
    <div className="space-y-5 border-t border-[#f1e2e0] pt-6">
      {variants.length > 0 && (
        <div>
          <label htmlFor="product-variant" className="mb-2 block text-sm font-medium text-[#624848]">
            Phân loại
          </label>
          <Select
            id="product-variant"
            className="w-full sm:max-w-xs"
            size="large"
            value={displayedVariantIndex}
            onChange={(value: number) => {
              setSelectedVariantIndex(value);
              setQuantity(1);
            }}
            options={variants.map((variant, index) => {
              const stock = variant.stock ?? variant.initialStock ?? productStock ?? 0;
              return {
                value: index,
                label: `${variant.name}${variant.size ? ` · ${variant.size}` : ""}${stock <= 0 ? " · Hết hàng" : ""}`,
                disabled: stock <= 0,
              };
            })}
          />
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-[#624848]">Số lượng</p>
        <div className="flex h-11 w-fit items-center rounded border border-[#e8caca]">
          <Button
            type="text"
            aria-label="Giảm số lượng"
            icon={<MinusOutlined />}
            className="!h-full !w-11 !rounded-none !text-[#8f6060] hover:!bg-[#fff3f3]"
            disabled={quantity <= 1 || isMutating}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          />
          <InputNumber
            aria-label="Số lượng mua"
            min={1}
            max={hasStock ? availableStock : 1}
            value={quantity}
            controls={false}
            className="!w-14 !border-0 text-center [&_input]:!text-center"
            disabled={!hasStock}
            onChange={(value) => setQuantity(Math.min(availableStock, Math.max(1, value ?? 1)))}
          />
          <Button
            type="text"
            aria-label="Tăng số lượng"
            icon={<PlusOutlined />}
            className="!h-full !w-11 !rounded-none !text-[#8f6060] hover:!bg-[#fff3f3]"
            disabled={!hasStock || quantity >= availableStock || isMutating}
            onClick={() => setQuantity((current) => Math.min(availableStock, current + 1))}
          />
        </div>
        <p className="mt-2 text-xs text-[#987979]">
          {hasStock ? `Còn ${availableStock} sản phẩm` : "Sản phẩm hiện không có sẵn."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3">
        <Button
          size="large"
          icon={<ShoppingCartOutlined />}
          className="!h-12 !border-[#d66c6d] !text-[#c45c60] hover:!border-[#bc5758] hover:!text-[#bc5758]"
          disabled={!canPurchase || isMutating}
          loading={isMutating}
          onClick={() => purchase(false)}
        >
          Thêm vào giỏ
        </Button>
        <Button
          type="primary"
          size="large"
          className="!h-12 !border-[#d66c6d] !bg-[#d66c6d] hover:!border-[#bc5758] hover:!bg-[#bc5758]"
          disabled={!canPurchase || isMutating}
          loading={isMutating}
          onClick={() => purchase(true)}
        >
          Mua ngay
        </Button>
      </div>
      {!Number.isInteger(selectedVariantId) && (
        <p className="text-xs text-[#bd5555]">Sản phẩm chưa có biến thể hợp lệ để mua hàng.</p>
      )}
    </div>
  );
}
