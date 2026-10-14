import { ShoppingOutlined } from "@ant-design/icons";
import { toFileUrl } from "../../service/product.service";
import type { OrderLine } from "../../types/order";
import { formatPrice } from "../../utils/format";

interface Props {
  items: OrderLine[];
}

export default function OrderItemList({ items }: Props) {
  return (
    <ul className="divide-y divide-[#f3e3e3]">
      {items.map((item) => (
        <li key={item.key} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#fbf1ef] sm:h-24 sm:w-20">
            {item.image ? (
              <img src={toFileUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xl text-[#d5a4a4]">
                <ShoppingOutlined />
              </div>
            )}
            <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-[#2d2020]/80 px-1 text-[11px] font-medium text-white">
              {item.quantity}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <p className="line-clamp-2 font-medium leading-snug text-[#2d2020]">{item.name}</p>
            {item.variantLabel && <p className="text-xs text-[#987979]">{item.variantLabel}</p>}
            <p className="text-xs text-[#987979]">
              {formatPrice(item.unitPrice)} × {item.quantity}
            </p>
          </div>
          <p className="shrink-0 self-center font-medium text-[#2d2020]">
            {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}
          </p>
        </li>
      ))}
    </ul>
  );
}
