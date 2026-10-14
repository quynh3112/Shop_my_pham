import type { OrderDetail } from "../../types/order";
import { PAYMENT_METHOD_LABEL, formatOrderAddress } from "../../utils/order";

interface Props {
  order: OrderDetail;
}

/** Người nhận, địa chỉ, thanh toán, ghi chú của một đơn hàng */
export default function OrderShippingInfo({ order }: Props) {
  const rows = [
    { label: "Người nhận", value: `${order.receiverName} · ${order.receiverPhone}` },
    { label: "Địa chỉ", value: formatOrderAddress(order) },
    {
      label: "Thanh toán",
      value: `${PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod} · ${
        order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"
      }`,
    },
    ...(order.note ? [{ label: "Ghi chú", value: order.note }] : []),
  ];

  return (
    <dl className="grid gap-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)]">
          <dt className="text-[#987979]">{row.label}</dt>
          <dd className="font-medium leading-6 text-[#2d2020]">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
