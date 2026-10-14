import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, ConfigProvider, Popconfirm, Spin, Tag, message } from "antd";
import { Link, useParams } from "react-router-dom";
import CheckoutSection from "../component/order/checkoutSection";
import OrderItemList from "../component/order/orderItemList";
import OrderPriceSummary from "../component/order/orderPriceSummary";
import OrderShippingInfo from "../component/order/orderShippingInfo";
import OrderStatusProgress from "../component/order/orderStatusProgress";
import { authTheme } from "../config/theme";
import useOrderDetail from "../hooks/useOrderDetail";
import { getApiErrorMessage } from "../utils/error";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, formatDateTime, orderItemToLine } from "../utils/order";

export default function OrderDetail() {
  const { code = "" } = useParams();
  const { order, loading, error, cancelOrder, cancelling } = useOrderDetail(code);
  const [messageApi, contextHolder] = message.useMessage();

  const handleCancel = async () => {
    try {
      await cancelOrder();
      messageApi.success("Đã huỷ đơn hàng.");
    } catch (cancelError) {
      messageApi.error(getApiErrorMessage(cancelError, "Không thể huỷ đơn hàng."));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-14">
        <Alert
          type="error"
          showIcon
          message="Không tìm thấy đơn hàng"
          description={getApiErrorMessage(error, "Đơn hàng không tồn tại hoặc không thuộc về bạn.")}
          action={
            <Link to="/">
              <Button size="small">Về trang chủ</Button>
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <ConfigProvider theme={authTheme}>
      {contextHolder}
      <main className="min-h-screen bg-[#fffafa] px-5 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <Link to="/orders" className="mb-6 inline-flex items-center gap-2 text-sm !text-[#987979] hover:!text-[#e16463]">
            <ArrowLeftOutlined /> Đơn hàng của tôi
          </Link>

          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#bd8585]">Chi tiết đơn hàng</p>
              <h1 className="mt-1 font-['Cormorant_Garamond'] text-4xl font-semibold text-[#2d2020]">{order.code}</h1>
              <p className="mt-1 text-sm text-[#987979]">Đặt lúc {formatDateTime(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Tag color={ORDER_STATUS_COLOR[order.status]} className="!m-0 !rounded-full !px-3 !py-1 !text-sm">
                {ORDER_STATUS_LABEL[order.status]}
              </Tag>
              {/* MoMo chưa thanh toán (vd. đã huỷ ở cổng thanh toán) -> cho thanh toán lại */}
              {order.paymentMethod === "MOMO" && order.paymentStatus === "UNPAID" && order.status !== "CANCELLED" && (
                <Link to={`/payment/momo/${encodeURIComponent(order.code)}`}>
                  <Button type="primary" style={{ background: "#a50064", borderColor: "#a50064" }}>
                    Thanh toán MoMo
                  </Button>
                </Link>
              )}
              {order.status === "PENDING" && (
                <Popconfirm
                  title="Huỷ đơn hàng này?"
                  description="Sản phẩm sẽ được hoàn lại kho."
                  okText="Huỷ đơn"
                  cancelText="Không"
                  onConfirm={() => handleCancel()}
                >
                  <Button danger loading={cancelling}>
                    Huỷ đơn
                  </Button>
                </Popconfirm>
              )}
            </div>
          </header>

          <div className="mb-6">
            <CheckoutSection title="Tiến trình đơn hàng">
              <OrderStatusProgress order={order} />
            </CheckoutSection>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <CheckoutSection title={`Sản phẩm (${order.items.length})`}>
              <OrderItemList items={order.items.map(orderItemToLine)} />
            </CheckoutSection>
            <div className="flex flex-col gap-6">
              <CheckoutSection title="Thanh toán">
                <OrderPriceSummary subtotal={order.subtotal} shippingFee={order.shippingFee} total={order.total} />
              </CheckoutSection>
              <CheckoutSection title="Giao hàng">
                <OrderShippingInfo order={order} />
              </CheckoutSection>
            </div>
          </div>
        </div>
      </main>
    </ConfigProvider>
  );
}
