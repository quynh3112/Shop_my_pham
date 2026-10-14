import { RightOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Tag } from "antd";
import { Link } from "react-router-dom";
import { toFileUrl } from "../../service/product.service";
import type { OrderDetail } from "../../types/order";
import { formatPrice } from "../../utils/format";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, formatDateTime } from "../../utils/order";
import OrderStatusProgress from "./orderStatusProgress";

const PREVIEW_LIMIT = 3;

interface Props {
  order: OrderDetail;
}

/** Thẻ tóm tắt 1 đơn hàng trong danh sách, bấm để xem chi tiết */
export default function OrderCard({ order }: Props) {
  const items = order.items ?? [];
  const preview = items.slice(0, PREVIEW_LIMIT);
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      to={`/orders/${encodeURIComponent(order.code)}`}
      className="group block rounded-3xl border border-[#f0dcdc] bg-white p-5 !text-inherit transition hover:border-[#e88f98] hover:shadow-[0_12px_32px_rgba(112,65,65,0.08)] sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f6e8e8] pb-4">
        <div>
          <p className="font-semibold tracking-wide text-[#2d2020]">{order.code}</p>
          <p className="text-xs text-[#987979]">{formatDateTime(order.createdAt)}</p>
        </div>
        <Tag color={ORDER_STATUS_COLOR[order.status]} className="!m-0 !rounded-full !px-3">
          {ORDER_STATUS_LABEL[order.status]}
        </Tag>
      </div>

      <div className="hidden border-b border-[#f6e8e8] py-4 sm:block">
        <OrderStatusProgress order={order} compact />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <div className="flex -space-x-3">
          {preview.map((item) => (
            <div
              key={item.id}
              className="h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-[#fbf1ef] shadow-sm"
            >
              {item.productImage ? (
                <img src={toFileUrl(item.productImage)} alt={item.productName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[#d5a4a4]">
                  <ShoppingOutlined />
                </div>
              )}
            </div>
          ))}
          {items.length > PREVIEW_LIMIT && (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-[#fbeef0] text-sm font-medium text-[#b05a5b]">
              +{items.length - PREVIEW_LIMIT}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm text-[#2d2020]">{preview[0]?.productName}</p>
          <p className="text-xs text-[#987979]">{quantity} sản phẩm</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#987979]">Tổng tiền</p>
          <p className="font-semibold text-[#e16463]">{formatPrice(order.total)}</p>
        </div>
        <RightOutlined className="text-xs text-[#c9a9a9] transition group-hover:translate-x-1 group-hover:text-[#e16463]" />
      </div>
    </Link>
  );
}
