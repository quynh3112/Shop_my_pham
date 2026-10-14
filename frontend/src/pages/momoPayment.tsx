import { CheckCircleFilled, ClockCircleOutlined, ExperimentOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Popconfirm, Result, Spin, message } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FakeQrCode from "../component/order/fakeQrCode";
import { orderDetailKey } from "../hooks/useOrderDetail";
import useOrderDetail from "../hooks/useOrderDetail";
import useRequireLogin from "../hooks/useRequireLogin";
import { confirmMomoSandbox } from "../service/order.service";
import { getApiErrorMessage } from "../utils/error";
import { formatPrice } from "../utils/format";

const MOMO_PINK = "#a50064";
const EXPIRE_SECONDS = 10 * 60;

const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Trang thanh toán MoMo GIẢ LẬP (MOMO_MODE=sandbox): không kết nối MoMo thật, không trừ tiền.
 * Khách tự bấm thành công / huỷ để chạy thử luồng thanh toán online.
 */
export default function MomoPayment() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { handleAuthError } = useRequireLogin();
  const { order, loading, error } = useOrderDetail(code);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRE_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const confirmMutation = useMutation({
    mutationFn: (success: boolean) => confirmMomoSandbox(code, success),
    onSuccess: (updated) => {
      queryClient.setQueryData(orderDetailKey(code), updated);
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const pay = async (success: boolean) => {
    try {
      await confirmMutation.mutateAsync(success);
      if (success) {
        navigate(`/order-success/${encodeURIComponent(code)}`, { replace: true });
      } else {
        messageApi.info("Đã huỷ thanh toán. Bạn có thể thanh toán lại trong chi tiết đơn hàng.");
        navigate(`/orders/${encodeURIComponent(code)}`, { replace: true });
      }
    } catch (payError) {
      if (!handleAuthError(payError)) messageApi.error(getApiErrorMessage(payError, "Không xử lý được thanh toán."));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <Result
        status="404"
        title="Không tìm thấy đơn hàng"
        subTitle={getApiErrorMessage(error, "Đơn hàng không tồn tại hoặc không thuộc về bạn.")}
        extra={
          <Link to="/orders">
            <Button type="primary">Đơn hàng của tôi</Button>
          </Link>
        }
      />
    );
  }

  const blocked =
    order.paymentMethod !== "MOMO"
      ? "Đơn hàng này không thanh toán bằng MoMo."
      : order.status === "CANCELLED"
        ? "Đơn hàng đã bị huỷ nên không thể thanh toán."
        : null;

  if (order.paymentStatus === "PAID" || blocked) {
    return (
      <Result
        status={order.paymentStatus === "PAID" ? "success" : "warning"}
        title={order.paymentStatus === "PAID" ? "Đơn hàng đã được thanh toán" : blocked}
        extra={
          <Link to={`/orders/${encodeURIComponent(order.code)}`}>
            <Button type="primary">Xem đơn hàng</Button>
          </Link>
        }
      />
    );
  }

  const expired = secondsLeft === 0;

  return (
    <main className="min-h-screen bg-[#f6f6f8] px-4 py-10">
      {contextHolder}
      <div className="mx-auto max-w-3xl">
        <Alert
          type="warning"
          showIcon
          icon={<ExperimentOutlined />}
          message="MÔI TRƯỜNG THỬ NGHIỆM — không kết nối MoMo thật, không trừ tiền."
          className="!mb-6"
        />

        <div className="overflow-hidden bg-white shadow-lg sm:grid sm:grid-cols-[1fr_1.1fr]">
          {/* Thông tin đơn */}
          <section className="p-6 text-white sm:p-8" style={{ background: MOMO_PINK }}>
            <p className="text-2xl font-bold tracking-wide">MoMo</p>
            <p className="text-xs opacity-80">Cổng thanh toán (giả lập)</p>
            <dl className="mt-8 space-y-4 text-sm">
              <div>
                <dt className="opacity-75">Nhà cung cấp</dt>
                <dd className="text-base font-semibold">LUNELLE</dd>
              </div>
              <div>
                <dt className="opacity-75">Mã đơn hàng</dt>
                <dd className="text-base font-semibold">{order.code}</dd>
              </div>
              <div>
                <dt className="opacity-75">Mô tả</dt>
                <dd>Thanh toán đơn hàng {order.code}</dd>
              </div>
              <div>
                <dt className="opacity-75">Số tiền</dt>
                <dd className="text-3xl font-bold">{formatPrice(order.total)}</dd>
              </div>
            </dl>
            <p className="mt-8 flex items-center gap-2 text-sm">
              <ClockCircleOutlined /> Đơn hàng hết hạn sau{" "}
              <span className="font-mono font-semibold">{formatCountdown(secondsLeft)}</span>
            </p>
          </section>

          {/* Quét mã */}
          <section className="flex flex-col items-center p-6 text-center sm:p-8">
            <p className="font-semibold" style={{ color: MOMO_PINK }}>
              Quét mã để thanh toán
            </p>
            <div className="mt-4 border-4 p-2" style={{ borderColor: MOMO_PINK }}>
              <FakeQrCode value={order.code} size={190} />
            </div>
            

            {expired && (
              <Alert type="error" showIcon message="Phiên thanh toán đã hết hạn." className="!mt-4 !w-full" />
            )}

            <div className="mt-6 flex w-full flex-col gap-3">
              <Button
                type="primary"
                size="large"
                block
                icon={<CheckCircleFilled />}
                loading={confirmMutation.isPending && confirmMutation.variables === true}
                disabled={expired || confirmMutation.isPending}
                onClick={() => void pay(true)}
                style={{ background: MOMO_PINK, borderColor: MOMO_PINK }}
              >
                Thanh toán thành công (giả lập)
              </Button>
              <Popconfirm
                title="Huỷ thanh toán?"
                description="Đơn hàng vẫn được giữ, bạn có thể thanh toán lại sau."
                okText="Huỷ thanh toán"
                cancelText="Quay lại"
                onConfirm={() => pay(false)}
              >
                <Button size="large" block disabled={confirmMutation.isPending}>
                  Huỷ thanh toán
                </Button>
              </Popconfirm>
            </div>
            <p className="mt-6 flex items-center gap-1 text-xs text-gray-400">
              <SafetyCertificateOutlined /> Giao dịch thử nghiệm, không dùng thông tin ví thật
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
