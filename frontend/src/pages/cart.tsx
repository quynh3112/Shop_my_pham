import { DeleteOutlined, MinusOutlined, PlusOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Spin } from "antd";
import useCart from "../hooks/useCart";
import type { CartItemView } from "../types/cart";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

function CartItem({ item, disabled, onUpdate, onRemove }: {
  item: CartItemView;
  disabled: boolean;
  onUpdate: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <article className="flex gap-4 border-b border-[#f0d8d8] py-5 last:border-b-0 sm:gap-6">
      <div className="h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-[#f8eeee] sm:h-32 sm:w-28">
        {item.thumbUrl ? <img className="h-full w-full object-cover" src={item.thumbUrl} alt={item.name} /> : <div className="flex h-full items-center justify-center text-[#d5a4a4]"><ShoppingOutlined className="text-2xl" /></div>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex justify-between gap-3">
          <div>
            <h2 className="font-['Bodoni_72'] text-xl leading-tight text-[#2d2020] sm:text-2xl">{item.name}</h2>
            <p className="mt-1 text-sm text-[#987979]">{item.size || "Standard"}{item.color ? ` · ${item.color}` : ""}</p>
            {!item.isAvailable && <p className="mt-1 text-xs font-medium text-[#c64f52]">Sản phẩm tạm hết hàng</p>}
          </div>
          <button type="button" aria-label={`Xóa ${item.name}`} className="h-8 w-8 shrink-0 text-[#b47777] hover:text-[#c64f52]" onClick={() => onRemove(item.id)} disabled={disabled}><DeleteOutlined /></button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-9 items-center border border-[#e8caca]">
            <button type="button" aria-label="Giảm số lượng" className="h-full w-9 text-[#8f6060] hover:bg-[#fff3f3] disabled:opacity-40" onClick={() => onUpdate(item.id, item.quantity - 1)} disabled={disabled || item.quantity <= 1}><MinusOutlined /></button>
            <span className="w-9 text-center text-sm">{item.quantity}</span>
            <button type="button" aria-label="Tăng số lượng" className="h-full w-9 text-[#8f6060] hover:bg-[#fff3f3] disabled:opacity-40" onClick={() => onUpdate(item.id, item.quantity + 1)} disabled={disabled || item.quantity >= item.stock}><PlusOutlined /></button>
          </div>
          <p className="font-medium text-[#2d2020]">{formatPrice(item.lineTotal)}</p>
        </div>
      </div>
    </article>
  );
}

export default function Cart() {
  const { cart, loading, error, updateCart, removeItem, clearCart, isMutating } = useCart();
  const items = cart?.items ?? [];

  return (
    <main className="min-h-[calc(100vh-110px)] bg-[#fffafa] px-5 py-10 sm:px-8 lg:px-16 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-4 border-b border-[#e8caca] pb-6">
          <div><h3 className="text-xl font-medium text-[#2d2020]">Giỏ hàng</h3></div>
          <p className="pb-1 text-sm text-[#987979]">{cart?.itemCount ?? 0} sản phẩm</p>
        </div>
        {error && <Alert className="mb-6" type="error" message="Không thể tải giỏ hàng" description={error} showIcon />}
        {loading ? <div className="flex min-h-72 items-center justify-center"><Spin size="large" /></div> : items.length === 0 ? <div className="border border-dashed border-[#e8caca] bg-white px-6 py-20"><Empty description="Giỏ hàng đang trống" /></div> : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
            <section className="bg-white px-5 sm:px-8">
              <div className="flex items-center justify-between border-b border-[#f0d8d8] py-4 text-xs uppercase tracking-[0.18em] text-[#987979]"><span>Sản phẩm</span><button type="button" className="normal-case tracking-normal text-[#b47777] hover:text-[#c64f52] disabled:opacity-40" onClick={() => void clearCart()} disabled={isMutating}>Xóa tất cả</button></div>
              {items.map((item) => <CartItem key={item.id} item={item} onUpdate={(id, quantity) => void updateCart({ id, quantity })} onRemove={(id) => void removeItem(id)} disabled={isMutating} />)}
            </section>
            <aside className="h-fit border border-[#e8caca] bg-[#fff4f2] p-6 sm:p-8 lg:sticky lg:top-6">
              <h2 className="font-['Bodoni_72'] text-3xl text-[#2d2020]">Tóm tắt đơn hàng</h2>
              <div className="mt-7 space-y-4 border-b border-[#e8caca] pb-6 text-sm text-[#765f5f]"><div className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(cart?.subtotal ?? 0)}</span></div><div className="flex justify-between"><span>Phí vận chuyển</span><span>{formatPrice(cart?.shippingFee ?? 0)}</span></div></div>
              <div className="flex justify-between py-6 text-lg font-medium text-[#2d2020]"><span>Tổng cộng</span><span>{formatPrice(cart?.total ?? 0)}</span></div>
              <Button type="primary" block size="large" className="!h-12 !border-[#d66c6d] !bg-[#d66c6d] hover:!border-[#bc5758] hover:!bg-[#bc5758]" disabled={cart?.hasUnavailableItems}>Tiến hành thanh toán</Button>
              {cart?.hasUnavailableItems && <p className="mt-3 text-center text-xs text-[#c64f52]">Vui lòng xử lý sản phẩm hết hàng trước khi thanh toán.</p>}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
