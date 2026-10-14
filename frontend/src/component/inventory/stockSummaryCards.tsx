import { AppstoreOutlined, InboxOutlined, StopOutlined, WarningOutlined } from "@ant-design/icons";
import { Card, Statistic } from "antd";
import type { ReactNode } from "react";
import type { StockStatus, StockSummary } from "../../types/inventory";

interface Props {
  summary?: StockSummary;
  loading?: boolean;
  /** Bấm vào thẻ "Sắp hết" / "Hết hàng" để lọc nhanh */
  onFilter?: (status: StockStatus) => void;
  activeStatus?: StockStatus;
}

interface CardItem {
  key: StockStatus;
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
}

export default function StockSummaryCards({ summary, loading, onFilter, activeStatus }: Props) {
  const cards: CardItem[] = [
    { key: "all", title: "Biến thể", value: summary?.variantCount ?? 0, icon: <AppstoreOutlined />, color: "#6b5b5e" },
    { key: "in", title: "Tổng số lượng tồn", value: summary?.totalUnits ?? 0, icon: <InboxOutlined />, color: "#389e0d" },
    {
      key: "low",
      title: `Sắp hết (≤ ${summary?.lowThreshold ?? 5})`,
      value: summary?.lowCount ?? 0,
      icon: <WarningOutlined />,
      color: "#d46b08",
    },
    { key: "out", title: "Hết hàng", value: summary?.outCount ?? 0, icon: <StopOutlined />, color: "#cf1322" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const active = activeStatus === card.key && card.key !== "all" && card.key !== "in";
        const clickable = Boolean(onFilter) && (card.key === "low" || card.key === "out" || card.key === "all");
        return (
          <Card
            key={card.key}
            size="small"
            hoverable={clickable}
            onClick={clickable ? () => onFilter?.(card.key) : undefined}
            className={active ? "!border-current" : ""}
            style={active ? { color: card.color } : undefined}
          >
            <Statistic
              loading={loading}
              title={card.title}
              value={card.value}
              prefix={<span style={{ color: card.color }}>{card.icon}</span>}
              valueStyle={{ color: card.key === "all" ? undefined : card.color }}
            />
          </Card>
        );
      })}
    </div>
  );
}
