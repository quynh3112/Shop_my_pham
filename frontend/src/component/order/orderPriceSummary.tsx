import { formatPrice } from "../../utils/format";

interface Props {
  subtotal: number;
  shippingFee?: number;
  total?: number;
}

/** Tạm tính, phí vận chuyển, tổng cộng */
export default function OrderPriceSummary({ subtotal, shippingFee = 0, total = subtotal + shippingFee }: Props) {
  return (
    <dl className="text-sm text-[#765f5f]">
      <div className="flex justify-between py-1.5">
        <dt>Tạm tính</dt>
        <dd>{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between py-1.5">
        <dt>Phí vận chuyển</dt>
        <dd>{shippingFee > 0 ? formatPrice(shippingFee) : "Miễn phí"}</dd>
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-[#e8caca] pt-4">
        <dt className="text-base font-medium text-[#2d2020]">Tổng cộng</dt>
        <dd className="text-2xl font-semibold text-[#e16463]">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
