import { EyeOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Input, Select, Space, Table, Tag, Tooltip, message } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import CustomerDetailDrawer from "../component/customer/customerDetailDrawer";
import { useCustomerList, useCustomerStatus } from "../hooks/useCustomers";
import useMyAccess from "../hooks/useMyAccess";
import { toFileUrl } from "../service/product.service";
import type { CustomerDetail, CustomerListQuery, CustomerSort, CustomerSummary } from "../types/customer";
import { getApiErrorMessage } from "../utils/error";
import { formatPrice } from "../utils/format";
import { formatDateTime } from "../utils/order";

const PAGE_SIZE = 20;

const SORT_OPTIONS: { label: string; value: CustomerSort }[] = [
  { label: "Mới đăng ký", value: "newest" },
  { label: "Chi tiêu nhiều nhất", value: "spent" },
  { label: "Nhiều đơn nhất", value: "orders" },
  { label: "Tên A → Z", value: "name" },
];

export default function MnCustomer() {
  const [messageApi, contextHolder] = message.useMessage();
  const { can } = useMyAccess();
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState<CustomerListQuery>({ sort: "newest", page: 1, limit: PAGE_SIZE });
  const [viewingId, setViewingId] = useState<number>();
  const { customers, pagination, fetching, error } = useCustomerList(query);
  const { setStatus, updating } = useCustomerStatus();

  const updateQuery = (patch: Partial<CustomerListQuery>) => setQuery((current) => ({ ...current, page: 1, ...patch }));

  const toggleStatus = async (customer: Pick<CustomerDetail, "id" | "isActive">) => {
    try {
      await setStatus({ id: customer.id, isActive: !customer.isActive });
      messageApi.success(customer.isActive ? "Đã khoá tài khoản." : "Đã mở khoá tài khoản.");
    } catch (statusError) {
      messageApi.error(getApiErrorMessage(statusError, "Không thể cập nhật trạng thái."));
    }
  };

  const columns: TableColumnsType<CustomerSummary> = [
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, customer) => (
        <div className="flex items-center gap-3">
          <Avatar src={customer.avatarUrl ? toFileUrl(customer.avatarUrl) : undefined} icon={<UserOutlined />} />
          <div className="min-w-0">
            <p className="font-medium">
              {customer.fullName}
              {!customer.isEmailVerified && (
                <Tag color="orange" className="!ml-2">
                  Chưa xác thực
                </Tag>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {customer.email}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Số đơn",
      dataIndex: "orderCount",
      key: "orderCount",
      width: 90,
      align: "right",
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      width: 140,
      align: "right",
      render: (value: number) => <span className="font-medium">{formatPrice(value)}</span>,
    },
    {
      title: "Đơn gần nhất",
      dataIndex: "lastOrderAt",
      key: "lastOrderAt",
      width: 160,
      responsive: ["lg"],
      render: (value: string | null) => <span className="text-xs text-gray-500">{value ? formatDateTime(value) : "—"}</span>,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      responsive: ["xl"],
      render: (value: string) => <span className="text-xs text-gray-500">{formatDateTime(value)}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 110,
      render: (isActive: boolean) => <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Đã khoá"}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 60,
      align: "center",
      render: (_, customer) => (
        <Tooltip title="Xem chi tiết">
          <Button type="text" icon={<EyeOutlined />} onClick={() => setViewingId(customer.id)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý khách hàng</h1>
          <p className="text-sm text-gray-500">Tổng chi tiêu chỉ tính các đơn đã giao thành công.</p>
        </div>
      </div>

      <Space wrap className="!mb-4">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tên, email, SĐT"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            if (!event.target.value) updateQuery({ search: undefined });
          }}
          onPressEnter={() => updateQuery({ search: searchInput.trim() || undefined })}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          value={query.status}
          onChange={(status) => updateQuery({ status })}
          options={[
            { label: "Đang hoạt động", value: "active" },
            { label: "Đã khoá", value: "locked" },
          ]}
          style={{ width: 170 }}
        />
        <Select value={query.sort} onChange={(sort) => updateQuery({ sort })} options={SORT_OPTIONS} style={{ width: 190 }} />
      </Space>

      {error && <Alert type="error" showIcon message="Không tải được danh sách khách hàng" description={error} className="!mb-4" />}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={customers}
        loading={fetching}
        scroll={{ x: 800 }}
        onRow={(customer) => ({ onDoubleClick: () => setViewingId(customer.id) })}
        locale={{ emptyText: "Không có khách hàng phù hợp" }}
        pagination={{
          current: query.page,
          pageSize: PAGE_SIZE,
          total: pagination?.total ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `${total} khách hàng`,
          onChange: (page) => setQuery((current) => ({ ...current, page })),
        }}
      />

      <CustomerDetailDrawer
        customerId={viewingId}
        canViewOrders={can("orders")}
        updating={updating}
        onClose={() => setViewingId(undefined)}
        onToggleStatus={toggleStatus}
      />
    </div>
  );
}
