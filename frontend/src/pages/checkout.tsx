import { ArrowLeftOutlined, LockOutlined } from "@ant-design/icons";
import { Alert, Button, ConfigProvider, Empty, Input, Spin, message } from "antd";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AddressSelector from "../component/address/addressSelector";
import CheckoutSection from "../component/order/checkoutSection";
import OrderItemList from "../component/order/orderItemList";
import OrderPriceSummary from "../component/order/orderPriceSummary";
import PaymentMethodSelector from "../component/order/paymentMethodSelector";
import { authTheme } from "../config/theme";
import useCart from "../hooks/useCart";
import usePlaceOrder from "../hooks/usePlaceOrder";
import useRequireLogin from "../hooks/useRequireLogin";
import type { BuyNowState, OrderLine, PaymentMethod } from "../types/order";
import { getApiErrorMessage } from "../utils/error";
import { cartItemToLine } from "../utils/order";

const BACK_LINK = "mb-6 inline-flex items-center gap-2 text-sm !text-[#987979] hover:!text-[#e16463]";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  // Có state "buyNow" khi bấm Mua ngay ở trang sản phẩm, không có thì đặt cả giỏ hàng
  const buyNow = (location.state as { buyNow?: BuyNowState } | null)?.buyNow;
  const { cart, loading: cartLoading } = useCart();
  const { placeCartOrder, placeBuyNowOrder, placing } = usePlaceOrder();
  const { handleAuthError } = useRequireLogin();
  const [messageApi, contextHolder] = message.useMessage();

  const [addressId, setAddressId] = useState<number>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [note, setNote] = useState("");

  const lines: OrderLine[] = buyNow ? [buyNow.line] : (cart?.items ?? []).map(cartItemToLine);
  const subtotal = buyNow
    ? buyNow.line.unitPrice * buyNow.quantity
    : (cart?.subtotal ?? 0);
  const shippingFee = buyNow ? 0 : (cart?.shippingFee ?? 0);
  const blockedByStock = !buyNow && Boolean(cart?.hasUnavailableItems);

  const placeOrder = async () => {
    if (!addressId) {
      messageApi.warning("Vui lòng chọn địa chỉ giao hàng.");
      return;
    }
    const payload = { addressId, paymentMethod, note: note.trim() || undefined };
    try {
      const order = buyNow
        ? await placeBuyNowOrder({ ...payload, variantId: buyNow.variantId, quantity: buyNow.quantity })
        : await placeCartOrder(payload);
      // Thanh toán online (MoMo) -> sang trang thanh toán; COD -> trang đặt hàng thành công
      navigate(order.paymentUrl || `/order-success/${encodeURIComponent(order.code)}`, { replace: true });
    } catch (error) {
      if (!handleAuthError(error)) {
        messageApi.error(getApiErrorMessage(error, "Không thể đặt hàng, vui lòng thử lại."));
      }
    }
  };

  if (!buyNow && cartLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#fffafa] px-6">
        <Empty description="Chưa có sản phẩm nào để đặt hàng." />
        <Link to="/products">
          <Button type="primary" className="!bg-[#e16463]">
            Tiếp tục mua sắm
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <ConfigProvider theme={authTheme}>
      {contextHolder}
      <main className="min-h-screen bg-[#fffafa] px-5 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl">
          {buyNow ? (
            <button type="button" onClick={() => navigate(-1)} className={BACK_LINK}>
              <ArrowLeftOutlined /> Quay lại sản phẩm
            </button>
          ) : (
            <Link to="/cart" className={BACK_LINK}>
              <ArrowLeftOutlined /> Quay lại giỏ hàng
            </Link>
          )}
          <h1 className="mb-8 font-['Cormorant_Garamond'] text-4xl font-semibold text-[#2d2020] sm:text-5xl">
            Đặt hàng
          </h1>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="flex flex-col gap-6">
              <CheckoutSection step={1} title="Địa chỉ giao hàng">
                <AddressSelector value={addressId} onChange={setAddressId} />
              </CheckoutSection>

              <CheckoutSection step={2} title="Phương thức thanh toán">
                <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
              </CheckoutSection>

              <CheckoutSection step={3} title="Ghi chú cho đơn hàng">
                <Input.TextArea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  showCount
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao..."
                />
              </CheckoutSection>
            </div>

            <aside className="h-fit lg:sticky lg:top-20">
              <CheckoutSection title={`Đơn hàng (${lines.length} sản phẩm)`}>
                <OrderItemList items={lines} />
                <div className="mt-6">
                  <OrderPriceSummary subtotal={subtotal} shippingFee={shippingFee} />
                </div>
                {blockedByStock && (
                  <Alert
                    className="!mt-5"
                    type="warning"
                    showIcon
                    message="Có sản phẩm đã hết hàng"
                    description={<Link to="/cart">Quay lại giỏ hàng để cập nhật</Link>}
                  />
                )}
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<LockOutlined />}
                  loading={placing}
                  disabled={blockedByStock || !addressId}
                  onClick={() => void placeOrder()}
                  className="!mt-6"
                >
                  Xác nhận đặt hàng
                </Button>
                <p className="mt-3 text-center text-xs text-[#987979]">
                  Tổng tiền cuối cùng được xác nhận khi đặt hàng thành công.
                </p>
              </CheckoutSection>
            </aside>
          </div>
        </div>
      </main>
    </ConfigProvider>
  );
}
