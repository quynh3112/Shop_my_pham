import { DatePicker, Select, Space, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMovements } from "../../hooks/useInventory";
import type { InventoryMovement, InventoryMovementType } from "../../types/inventory";
import { MOVEMENT_TYPE, formatDelta } from "../../utils/inventory";
import { formatDateTime } from "../../utils/order";

const PAGE_SIZE = 20;

interface Props {
  /** Chỉ xem lịch sử của 1 biến thể (dùng trong Drawer), bỏ trống để xem toàn bộ */
  variantId?: number;
  showFilters?: boolean;
}

const ACTOR_LABEL: Record<InventoryMovement["actorType"], string> = {
  ADMIN: "Admin",
  CUSTOMER: "Khách hàng",
  SYSTEM: "Hệ thống",
};

/** Bảng lịch sử nhập / xuất / kiểm kho */
export default function MovementHistoryTable({ variantId, showFilters = true }: Props) {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<InventoryMovementType>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);

  const { items, pagination, fetching } = useMovements({
    variantId,
    type,
    from: range?.[0].format("YYYY-MM-DD"),
    to: range?.[1].format("YYYY-MM-DD"),
    page,
    limit: PAGE_SIZE,
  });

  const columns: TableColumnsType<InventoryMovement> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (value: string) => <span className="text-xs">{formatDateTime(value)}</span>,
    },
    ...(variantId === undefined
      ? [
          {
            title: "Sản phẩm",
            key: "product",
            render: (_: unknown, m: InventoryMovement) => (
              <div>
                <p className="font-medium">{m.productNameSnapshot}</p>
                <p className="text-xs text-gray-500">
                  {[m.variantNameSnapshot, m.sizeSnapshot].filter(Boolean).join(" · ")}
                </p>
              </div>
            ),
          },
        ]
      : []),
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (value: InventoryMovementType) => <Tag color={MOVEMENT_TYPE[value].color}>{MOVEMENT_TYPE[value].label}</Tag>,
    },
    {
      title: "Thay đổi",
      dataIndex: "delta",
      key: "delta",
      width: 90,
      align: "right",
      render: (delta: number | null) => (
        <span className={`font-semibold ${delta && delta > 0 ? "text-green-600" : delta && delta < 0 ? "text-red-600" : ""}`}>
          {formatDelta(delta)}
        </span>
      ),
    },
    {
      title: "Tồn",
      key: "stock",
      width: 100,
      align: "right",
      render: (_, m) => (
        <span className="text-xs text-gray-500">
          {m.beforeStock ?? "—"} → <b className="text-gray-800">{m.afterStock}</b>
        </span>
      ),
    },
    {
      title: "Ghi chú",
      key: "reason",
      render: (_, m) => (
        <div className="text-sm">
          {m.reason && <p>{m.reason}</p>}
          {m.orderCode && (
            <Link to={`/admin/orders?code=${encodeURIComponent(m.orderCode)}`} className="text-xs">
              Đơn {m.orderCode}
            </Link>
          )}
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      key: "actor",
      width: 150,
      responsive: ["md"],
      render: (_, m) => <span className="text-xs">{m.actorName ?? ACTOR_LABEL[m.actorType]}</span>,
    },
  ];

  return (
    <div>
      {showFilters && (
        <Space wrap className="!mb-4">
          <Select
            allowClear
            placeholder="Loại biến động"
            value={type}
            onChange={(value) => {
              setType(value);
              setPage(1);
            }}
            options={Object.entries(MOVEMENT_TYPE).map(([value, { label }]) => ({ value, label }))}
            style={{ width: 170 }}
          />
          <DatePicker.RangePicker
            value={range}
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
            onChange={(value) => {
              setRange(value && value[0] && value[1] ? [value[0], value[1]] : null);
              setPage(1);
            }}
          />
        </Space>
      )}
      <Table
        rowKey="id"
        size={variantId === undefined ? "middle" : "small"}
        columns={columns}
        dataSource={items}
        loading={fetching}
        scroll={{ x: variantId === undefined ? 900 : 600 }}
        locale={{ emptyText: "Chưa có lịch sử kho" }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: pagination?.total ?? 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />
    </div>
  );
}
