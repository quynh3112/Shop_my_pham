import { Alert, Button, Empty, Pagination, Skeleton, Tabs } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import AccountPageLayout from "../component/accountPageLayout";
import OrderCard from "../component/order/orderCard";
import useMyOrders from "../hooks/useMyOrders";
import { ORDER_STATUSES, type OrderStatusValue } from "../types/order";
import { ORDER_STATUS_LABEL } from "../utils/order";

const PAGE_SIZE = 10;
const ALL = "ALL";

const TAB_ITEMS = [
  { key: ALL, label: "Tất cả" },
  ...ORDER_STATUSES.map((status) => ({ key: status, label: ORDER_STATUS_LABEL[status] })),
];

export default function MyOrders() {
  // Lưu tab / trang trên URL để tải lại hoặc quay lại vẫn giữ đúng vị trí
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const status = ORDER_STATUSES.includes(statusParam as OrderStatusValue)
    ? (statusParam as OrderStatusValue)
    : undefined;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const { orders, pagination, loading, error } = useMyOrders({ status, page, limit: PAGE_SIZE });

  const updateParams = (next: { status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextStatus = next.status ?? status ?? ALL;
    if (nextStatus !== ALL) params.set("status", nextStatus);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    setSearchParams(params);
  };

  return (
    <AccountPageLayout title="Đơn hàng của tôi" description="Theo dõi trạng thái và xem lại các đơn bạn đã đặt.">
      <Tabs
        activeKey={status ?? ALL}
        items={TAB_ITEMS}
        onChange={(key) => updateParams({ status: key, page: 1 })}
        className="[&_.ant-tabs-nav]:!mb-6"
      />

      {error && <Alert type="error" showIcon message="Không tải được đơn hàng" description={error} className="!mb-6" />}

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} active avatar paragraph={{ rows: 2 }} className="rounded-3xl bg-white p-6" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#e8caca] bg-white py-16">
          <Empty description={status ? `Không có đơn "${ORDER_STATUS_LABEL[status]}".` : "Bạn chưa có đơn hàng nào."}>
            <Link to="/products">
              <Button type="primary">Mua sắm ngay</Button>
            </Link>
          </Empty>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {pagination && pagination.total > PAGE_SIZE && (
        <div className="mt-8 flex justify-center">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={pagination.total}
            showSizeChanger={false}
            onChange={(nextPage) => {
              updateParams({ page: nextPage });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </AccountPageLayout>
  );
}
