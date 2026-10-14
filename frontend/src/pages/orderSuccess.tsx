import { CheckOutlined, FileTextOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Skeleton } from "antd";
import { Link, useParams } from "react-router-dom";
import CheckoutSection from "../component/order/checkoutSection";
import OrderShippingInfo from "../component/order/orderShippingInfo";
import { authTheme } from "../config/theme";
import useOrderDetail from "../hooks/useOrderDetail";
import { formatPrice } from "../utils/format";

export default function OrderSuccess() {
  const { code = "" } = useParams();
  const { order, loading } = useOrderDetail(code);
  const detailPath = `/orders/${encodeURIComponent(code)}`;

  return (
    <ConfigProvider theme={authTheme}>
      <main className="min-h-[70vh] bg-[#fffafa] px-5 py-14 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e16463] text-4xl text-white shadow-[0_0_0_10px_rgba(225,100,99,0.12)]">
            <CheckOutlined />
          </span>
          <h1 className="mt-8 font-['Cormorant_Garamond'] text-4xl font-semibold text-[#2d2020] sm:text-5xl">
            Đặt hàng thành công!
          </h1>
          <p className="mt-3 max-w-md text-[#765f5f]">
            Cảm ơn bạn đã mua sắm tại LUNELLE. Chúng tôi sẽ sớm liên hệ để xác nhận và giao hàng cho bạn.
          </p>
          <p className="mt-5 rounded-full bg-[#fbeef0] px-5 py-2 text-sm text-[#8f6060]">
            Mã đơn hàng: <span className="font-semibold tracking-wide text-[#e16463]">{code}</span>
          </p>

          <div className="mt-10 w-full text-left">
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              order && (
                <CheckoutSection
                  title="Thông tin giao hàng"
                  extra={<span className="text-lg font-semibold text-[#e16463]">{formatPrice(order.total)}</span>}
                >
                  <OrderShippingInfo order={order} />
                </CheckoutSection>
              )
            )}
          </div>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={detailPath} className="sm:min-w-56">
              <Button type="primary" size="large" block icon={<FileTextOutlined />}>
                Xem chi tiết đơn hàng
              </Button>
            </Link>
            <Link to="/" className="sm:min-w-56">
              <Button size="large" block icon={<ShoppingOutlined />}>
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </ConfigProvider>
  );
}
