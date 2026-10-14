import { EyeOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Image,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import { isAxiosError } from "axios";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
} from "../service/adminOrder.service";
import { toFileUrl } from "../service/product.service";
import type {
  AdminOrder,
  AdminOrderListQuery,
  OrderStatusValue,
  PaymentStatusValue,
} from "../types/adminOrder";

const STATUS: Record<OrderStatusValue, { label: string; color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "gold" },
  CONFIRMED: { label: "Đã xác nhận", color: "blue" },
  PROCESSING: { label: "Đang xử lý", color: "geekblue" },
  SHIPPING: { label: "Đang giao", color: "cyan" },
  DELIVERED: { label: "Đã giao", color: "green" },
  CANCELLED: { label: "Đã huỷ", color: "default" },
};

// Giống ADMIN_TRANSITIONS ở backend: mỗi bước chỉ được tiến lên một trạng thái hoặc huỷ
const NEXT_STATUS: Record<OrderStatusValue, OrderStatusValue | null> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPING",
  SHIPPING: "DELIVERED",
  DELIVERED: null,
  CANCELLED: null,
};

const NEXT_ACTION_LABEL: Partial<Record<OrderStatusValue, string>> = {
  CONFIRMED: "Xác nhận đơn",
  PROCESSING: "Bắt đầu xử lý",
  SHIPPING: "Giao cho vận chuyển",
  DELIVERED: "Đã giao thành công",
};

const PAYMENT_STATUS: Record<PaymentStatusValue, { label: string; color: string }> = {
  UNPAID: { label: "Chưa thanh toán", color: "orange" },
  PAID: { label: "Đã thanh toán", color: "green" },
};

const PAYMENT_METHOD: Record<string, string> = { COD: "Thanh toán khi nhận hàng", MOMO: "MoMo" };

const ACTOR: Record<string, string> = { CUSTOMER: "Khách hàng", ADMIN: "Quản trị viên", SYSTEM: "Hệ thống" };

const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
const formatDateTime = (value: string) => dayjs(value).format("HH:mm DD/MM/YYYY");

const errorMessage = (err: unknown, fallback: string) => {
  const msg = isAxiosError(err) ? err.response?.data?.message : undefined;
  return Array.isArray(msg) ? msg[0] : typeof msg === "string" ? msg : fallback;
};

const PAGE_SIZE = 10;

export default function MnOrder() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  // Trang báo cáo dẫn sang với ?status=PENDING (lọc sẵn) hoặc ?code=DH... (mở luôn chi tiết đơn)
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") as OrderStatusValue | null;
  const initialCode = searchParams.get("code");
  const [searchInput, setSearchInput] = useState(initialCode ?? "");
  const [query, setQuery] = useState<AdminOrderListQuery>({
    page: 1,
    limit: PAGE_SIZE,
    status: initialStatus && initialStatus in STATUS ? initialStatus : undefined,
    search: initialCode ?? undefined,
  });
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [openCode, setOpenCode] = useState<string | null>(initialCode);

  const listQuery = useQuery({
    queryKey: ["admin-orders", query],
    queryFn: () => listAdminOrders(query),
    placeholderData: keepPreviousData,
  });

  const detailQuery = useQuery({
    queryKey: ["admin-order", openCode],
    queryFn: () => getAdminOrder(openCode!),
    enabled: Boolean(openCode),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-order"] });
    // Đổi trạng thái đơn làm thay đổi số liệu báo cáo
    void queryClient.invalidateQueries({ queryKey: ["report"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatusValue }) => updateAdminOrderStatus(id, status),
    onSuccess: (_, { status }) => {
      messageApi.success(`Đã chuyển đơn sang "${STATUS[status].label}"`);
      refresh();
    },
    onError: (err) => {
      messageApi.error(errorMessage(err, "Không cập nhật được trạng thái đơn"));
      refresh();
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: number; paymentStatus: PaymentStatusValue }) =>
      updateAdminPaymentStatus(id, paymentStatus),
    onSuccess: () => {
      messageApi.success("Đã cập nhật thanh toán");
      refresh();
    },
    onError: (err) => messageApi.error(errorMessage(err, "Không cập nhật được thanh toán")),
  });

  const setFilter = (patch: Partial<AdminOrderListQuery>) => setQuery((q) => ({ ...q, ...patch, page: 1 }));

  const columns: TableColumnsType<AdminOrder> = [
    {
      title: "Mã đơn",
      dataIndex: "code",
      width: 170,
      render: (code: string) => <span className="font-mono font-medium">{code}</span>,
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_, o) => (
        <div>
          <div className="font-medium">{o.receiverName}</div>
          <div className="text-xs text-gray-500">{o.receiverPhone}</div>
          {o.user?.email && <div className="text-xs text-gray-400">{o.user.email}</div>}
        </div>
      ),
    },
    {
      title: "Sản phẩm",
      key: "items",
      render: (_, o) => (
        <div className="text-sm">
          {o.items.slice(0, 2).map((i) => (
            <div key={i.id} className="truncate">
              {i.productName}
              {i.variantName ? ` (${i.variantName})` : ""} × {i.quantity}
            </div>
          ))}
          {o.items.length > 2 && <div className="text-xs text-gray-400">+{o.items.length - 2} sản phẩm khác</div>}
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      width: 130,
      align: "right",
      render: (v: number) => <span className="font-semibold">{formatMoney(v)}</span>,
    },
    {
      title: "Thanh toán",
      key: "payment",
      width: 150,
      render: (_, o) => (
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-gray-500">{o.paymentMethod}</span>
          <Tag color={PAYMENT_STATUS[o.paymentStatus].color}>{PAYMENT_STATUS[o.paymentStatus].label}</Tag>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      render: (s: OrderStatusValue) => <Tag color={STATUS[s].color}>{STATUS[s].label}</Tag>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      width: 140,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: "",
      key: "action",
      width: 70,
      fixed: "right",
      render: (_, o) => <Button icon={<EyeOutlined />} onClick={() => setOpenCode(o.code)} />,
    },
  ];

  const order = detailQuery.data;
  const next = order ? NEXT_STATUS[order.status] : null;
  const mutating = statusMutation.isPending || paymentMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      {contextHolder}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold">Quản lý đơn hàng</h2>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Mã đơn, tên, SĐT, email..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (!e.target.value) setFilter({ search: undefined });
            }}
            onPressEnter={() => setFilter({ search: searchInput.trim() || undefined })}
            style={{ width: 240 }}
          />
          <Select
            allowClear
            placeholder="Trạng thái đơn"
            style={{ width: 160 }}
            value={query.status}
            onChange={(v) => setFilter({ status: v })}
            options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))}
          />
          <Select
            allowClear
            placeholder="Thanh toán"
            style={{ width: 160 }}
            value={query.paymentStatus}
            onChange={(v) => setFilter({ paymentStatus: v })}
            options={Object.entries(PAYMENT_STATUS).map(([value, s]) => ({ value, label: s.label }))}
          />
          <DatePicker.RangePicker
            value={range}
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
            onChange={(v) => {
              const r = v && v[0] && v[1] ? ([v[0], v[1]] as [Dayjs, Dayjs]) : null;
              setRange(r);
              setFilter({ from: r?.[0].format("YYYY-MM-DD"), to: r?.[1].format("YYYY-MM-DD") });
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={listQuery.isFetching && !listQuery.isLoading} />
        </Space>
      </div>

      {listQuery.error && <Alert type="error" showIcon message={errorMessage(listQuery.error, "Không tải được danh sách đơn")} />}

      <Table<AdminOrder>
        rowKey="id"
        columns={columns}
        dataSource={listQuery.data?.items ?? []}
        loading={listQuery.isLoading}
        scroll={{ x: 1100 }}
        onRow={(o) => ({ onDoubleClick: () => setOpenCode(o.code) })}
        locale={{ emptyText: "Không có đơn hàng nào" }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: listQuery.data?.pagination.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (total) => `${total} đơn`,
          onChange: (page, limit) => setQuery((q) => ({ ...q, page, limit })),
        }}
      />

      <Drawer
        open={Boolean(openCode)}
        onClose={() => setOpenCode(null)}
        width={640}
        title={order ? `Đơn hàng ${order.code}` : "Chi tiết đơn hàng"}
        extra={order && <Tag color={STATUS[order.status].color}>{STATUS[order.status].label}</Tag>}
      >
        {detailQuery.isLoading || !order ? (
          detailQuery.error ? (
            <Alert type="error" showIcon message={errorMessage(detailQuery.error, "Không tải được đơn hàng")} />
          ) : (
            <div className="flex justify-center py-10">
              <Spin />
            </div>
          )
        ) : (
          <div className="flex flex-col gap-5">
            {/* Đơn đã giao hoặc đã huỷ thì không đổi trạng thái được nữa */}
            {next && (
              <Space wrap>
                <Popconfirm
                  title={`Chuyển đơn sang "${STATUS[next].label}"?`}
                  onConfirm={() => statusMutation.mutate({ id: order.id, status: next })}
                  okText="Đồng ý"
                  cancelText="Không"
                >
                  <Button type="primary" loading={statusMutation.isPending} disabled={mutating}>
                    {NEXT_ACTION_LABEL[next]}
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="Huỷ đơn hàng này?"
                  description="Hàng trong đơn sẽ được hoàn lại kho."
                  onConfirm={() => statusMutation.mutate({ id: order.id, status: "CANCELLED" })}
                  okText="Huỷ đơn"
                  okButtonProps={{ danger: true }}
                  cancelText="Không"
                >
                  <Button danger disabled={mutating}>
                    Huỷ đơn
                  </Button>
                </Popconfirm>
              </Space>
            )}

            <Descriptions size="small" column={1} bordered title="Giao hàng">
              <Descriptions.Item label="Người nhận">
                {order.receiverName} - {order.receiverPhone}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {[order.shippingLine1, order.shippingWard, order.shippingDistrict, order.shippingProvince]
                  .filter(Boolean)
                  .join(", ")}
              </Descriptions.Item>
              {order.user && (
                <Descriptions.Item label="Tài khoản">
                  {order.user.fullName} ({order.user.email})
                </Descriptions.Item>
              )}
              {order.note && <Descriptions.Item label="Ghi chú">{order.note}</Descriptions.Item>}
              <Descriptions.Item label="Ngày đặt">{formatDateTime(order.createdAt)}</Descriptions.Item>
            </Descriptions>

            <Descriptions size="small" column={1} bordered title="Thanh toán">
              <Descriptions.Item label="Phương thức">{PAYMENT_METHOD[order.paymentMethod] ?? order.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Tình trạng">
                <Space>
                  <Tag color={PAYMENT_STATUS[order.paymentStatus].color}>{PAYMENT_STATUS[order.paymentStatus].label}</Tag>
                  {order.paymentStatus === "UNPAID" && order.status !== "CANCELLED" && (
                    <Popconfirm
                      title="Đánh dấu đơn đã thanh toán?"
                      onConfirm={() => paymentMutation.mutate({ id: order.id, paymentStatus: "PAID" })}
                      okText="Đồng ý"
                      cancelText="Không"
                    >
                      <Button size="small" loading={paymentMutation.isPending} disabled={mutating}>
                        Đánh dấu đã thanh toán
                      </Button>
                    </Popconfirm>
                  )}
                  {order.paymentStatus === "PAID" && (
                    <Popconfirm
                      title="Chuyển về chưa thanh toán?"
                      onConfirm={() => paymentMutation.mutate({ id: order.id, paymentStatus: "UNPAID" })}
                      okText="Đồng ý"
                      cancelText="Không"
                    >
                      <Button size="small" type="link" disabled={mutating}>
                        Chuyển về chưa thanh toán
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="mb-2 font-semibold">Sản phẩm</div>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={order.items}
                columns={[
                  {
                    title: "Sản phẩm",
                    key: "name",
                    render: (_, i) => (
                      <div className="flex items-center gap-2">
                        {i.productImage ? (
                          <Image src={toFileUrl(i.productImage)} width={40} height={40} className="rounded object-cover" />
                        ) : null}
                        <div>
                          <div>{i.productName}</div>
                          <div className="text-xs text-gray-500">
                            {[i.variantName, i.variantSize].filter(Boolean).join(" - ")}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  { title: "Đơn giá", dataIndex: "unitPrice", align: "right", render: formatMoney },
                  { title: "SL", dataIndex: "quantity", align: "center", width: 50 },
                  { title: "Thành tiền", dataIndex: "lineTotal", align: "right", render: formatMoney },
                ]}
              />
              <div className="mt-3 flex flex-col items-end gap-1 text-sm">
                <div>
                  Tạm tính: <span className="inline-block w-28 text-right">{formatMoney(order.subtotal)}</span>
                </div>
                <div>
                  Phí vận chuyển: <span className="inline-block w-28 text-right">{formatMoney(order.shippingFee)}</span>
                </div>
                <div className="text-base font-semibold">
                  Tổng cộng: <span className="inline-block w-28 text-right text-[#e16463]">{formatMoney(order.total)}</span>
                </div>
              </div>
            </div>

            {!!order.statusHistory?.length && (
              <div>
                <div className="mb-3 font-semibold">Lịch sử đơn hàng</div>
                <Timeline
                  items={order.statusHistory.map((h) => ({
                    color: h.toStatus === "CANCELLED" ? "red" : h.toStatus === "DELIVERED" ? "green" : "blue",
                    children: (
                      <div>
                        <div>
                          {STATUS[h.toStatus]?.label ?? h.toStatus}
                          <span className="text-xs text-gray-500"> · {ACTOR[h.actorType] ?? h.actorType}</span>
                        </div>
                        <div className="text-xs text-gray-400">{formatDateTime(h.occurredAt ?? h.recordedAt)}</div>
                        {h.reason && <div className="text-xs text-gray-500">{h.reason}</div>}
                      </div>
                    ),
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
