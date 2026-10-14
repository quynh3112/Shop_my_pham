import { LockOutlined, UnlockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Descriptions, Drawer, Empty, Popconfirm, Skeleton, Statistic, Table, Tag } from "antd";
import { Link } from "react-router-dom";
import { useCustomerDetail } from "../../hooks/useCustomers";
import { toFileUrl } from "../../service/product.service";
import type { CustomerDetail } from "../../types/customer";
import { getApiErrorMessage } from "../../utils/error";
import { formatPrice } from "../../utils/format";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, formatAddress, formatDateTime } from "../../utils/order";

interface Props {
  customerId?: number;
  /** Có quyền xem đơn hàng thì mã đơn bấm được sang trang quản lý đơn */
  canViewOrders?: boolean;
  updating?: boolean;
  onClose: () => void;
  onToggleStatus: (customer: CustomerDetail) => unknown;
}

/** Hồ sơ khách hàng: liên hệ, thống kê mua hàng, địa chỉ, đơn gần đây */
export default function CustomerDetailDrawer({ customerId, canViewOrders, updating, onClose, onToggleStatus }: Props) {
  const { customer, loading, error } = useCustomerDetail(customerId);

  const footer = customer && (
    <div className="flex justify-end">
      <Popconfirm
        title={customer.isActive ? "Khoá tài khoản khách hàng này?" : "Mở khoá tài khoản này?"}
        description={customer.isActive ? "Khách sẽ bị đăng xuất và không đăng nhập / đặt hàng được." : undefined}
        okText={customer.isActive ? "Khoá" : "Mở khoá"}
        cancelText="Huỷ"
        okButtonProps={{ danger: customer.isActive }}
        onConfirm={() => onToggleStatus(customer)}
      >
        <Button
          danger={customer.isActive}
          loading={updating}
          icon={customer.isActive ? <LockOutlined /> : <UnlockOutlined />}
        >
          {customer.isActive ? "Khoá tài khoản" : "Mở khoá tài khoản"}
        </Button>
      </Popconfirm>
    </div>
  );

  return (
    <Drawer
      open={customerId !== undefined}
      onClose={onClose}
      width={680}
      title="Thông tin khách hàng"
      footer={footer}
      destroyOnHidden
    >
      {loading ? (
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      ) : error || !customer ? (
        <Alert
          type="error"
          showIcon
          message="Không tải được thông tin khách hàng"
          description={getApiErrorMessage(error, "Vui lòng thử lại.")}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar size={64} src={customer.avatarUrl ? toFileUrl(customer.avatarUrl) : undefined} icon={<UserOutlined />} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{customer.fullName}</h2>
                <Tag color={customer.isActive ? "green" : "red"}>{customer.isActive ? "Hoạt động" : "Đã khoá"}</Tag>
                {!customer.isEmailVerified && <Tag color="orange">Chưa xác thực email</Tag>}
              </div>
              <p className="text-sm text-gray-500">Tham gia {formatDateTime(customer.createdAt)}</p>
            </div>
          </div>

          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Email">{customer.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{customer.phone || "—"}</Descriptions.Item>
          </Descriptions>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card size="small">
              <Statistic title="Tổng chi tiêu" value={formatPrice(customer.stats.totalSpent)} valueStyle={{ fontSize: 16, color: "#e16463" }} />
            </Card>
            <Card size="small">
              <Statistic title="Số đơn" value={customer.stats.orderCount} valueStyle={{ fontSize: 16 }} />
            </Card>
            <Card size="small">
              <Statistic title="Đã giao" value={customer.stats.deliveredCount} valueStyle={{ fontSize: 16 }} />
            </Card>
            <Card size="small">
              <Statistic title="Đã huỷ" value={customer.stats.cancelledCount} valueStyle={{ fontSize: 16 }} />
            </Card>
          </div>
          <p className="-mt-3 text-xs text-gray-500">
            Giá trị trung bình mỗi đơn đã giao: <b>{formatPrice(customer.stats.averageOrderValue)}</b> · Yêu thích{" "}
            <b>{customer.stats.favoriteCount}</b> sản phẩm · <b>{customer.stats.reviewCount}</b> đánh giá ·{" "}
            <b>{customer.stats.skinAnalysisCount}</b> lần phân tích da
          </p>

          <div>
            <h3 className="mb-2 font-medium">Đơn hàng gần đây</h3>
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={customer.recentOrders}
              locale={{ emptyText: "Chưa có đơn hàng" }}
              columns={[
                {
                  title: "Mã đơn",
                  dataIndex: "code",
                  key: "code",
                  render: (code: string) =>
                    canViewOrders ? <Link to={`/admin/orders?code=${encodeURIComponent(code)}`}>{code}</Link> : code,
                },
                {
                  title: "Ngày đặt",
                  dataIndex: "createdAt",
                  key: "createdAt",
                  render: (value: string) => <span className="text-xs">{formatDateTime(value)}</span>,
                },
                {
                  title: "Trạng thái",
                  dataIndex: "status",
                  key: "status",
                  render: (status: CustomerDetail["recentOrders"][number]["status"]) => (
                    <Tag color={ORDER_STATUS_COLOR[status]}>{ORDER_STATUS_LABEL[status]}</Tag>
                  ),
                },
                {
                  title: "Tổng tiền",
                  dataIndex: "total",
                  key: "total",
                  align: "right",
                  render: (total: number) => formatPrice(total),
                },
              ]}
            />
          </div>

          <div>
            <h3 className="mb-2 font-medium">Địa chỉ ({customer.addresses.length})</h3>
            {customer.addresses.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có địa chỉ" />
            ) : (
              <ul className="flex flex-col gap-2">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{address.fullname}</b>
                      <span className="text-gray-500">{address.phone}</span>
                      {address.isDefault && <Tag color="magenta">Mặc định</Tag>}
                    </div>
                    <p className="mt-1 text-gray-600">{formatAddress(address)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
