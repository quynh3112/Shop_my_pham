import { EditOutlined, HistoryOutlined, PlusOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag, Tooltip } from "antd";
import type { TableColumnsType, TablePaginationConfig } from "antd";
import { toFileUrl } from "../../service/product.service";
import type { StockItem } from "../../types/inventory";
import { STOCK_LEVEL, stockLevel } from "../../utils/inventory";
import { formatDateTime } from "../../utils/order";

interface Props {
  items: StockItem[];
  loading?: boolean;
  lowThreshold: number;
  pagination?: TablePaginationConfig;
  onReceive: (item: StockItem) => void;
  onAdjust: (item: StockItem) => void;
  onHistory: (item: StockItem) => void;
}

export default function StockTable({ items, loading, lowThreshold, pagination, onReceive, onAdjust, onHistory }: Props) {
  const columns: TableColumnsType<StockItem> = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, item) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#fbf1ef]">
            {item.image ? (
              <img src={toFileUrl(item.image)} alt={item.productName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[#d5a4a4]">
                <ShoppingOutlined />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium">{item.productName}</p>
            <p className="text-xs text-gray-500">
              {item.categoryName ?? "Chưa phân loại"}
              {!item.isActive && <Tag className="!ml-2">Đã ẩn</Tag>}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Biến thể",
      key: "variant",
      render: (_, item) => [item.variantName, item.size].filter(Boolean).join(" · ") || "—",
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
      align: "right",
      width: 110,
      render: (stock: number) => {
        const level = stockLevel(stock, lowThreshold);
        return <span className={`text-base font-semibold ${level === "in" ? "" : level === "low" ? "text-orange-600" : "text-red-600"}`}>{stock}</span>;
      },
    },
    {
      title: "Trạng thái",
      key: "level",
      width: 120,
      render: (_, item) => {
        const level = STOCK_LEVEL[stockLevel(item.stock, lowThreshold)];
        return <Tag color={level.color}>{level.label}</Tag>;
      },
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 160,
      responsive: ["lg"],
      render: (value: string) => <span className="text-xs text-gray-500">{formatDateTime(value)}</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, item) => (
        <Space size={4}>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => onReceive(item)}>
            Nhập
          </Button>
          <Tooltip title="Kiểm kho">
            <Button size="small" icon={<EditOutlined />} onClick={() => onAdjust(item)} />
          </Tooltip>
          <Tooltip title="Lịch sử">
            <Button size="small" icon={<HistoryOutlined />} onClick={() => onHistory(item)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="variantId"
      columns={columns}
      dataSource={items}
      loading={loading}
      pagination={pagination}
      scroll={{ x: 900 }}
      locale={{ emptyText: "Không có biến thể nào phù hợp" }}
    />
  );
}
