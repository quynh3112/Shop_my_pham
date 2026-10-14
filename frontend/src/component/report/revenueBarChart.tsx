import { Empty, Segmented, Table } from "antd";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BRAND } from "../../config/theme";
import { formatPrice as formatMoney } from "../../utils/format";

export interface RevenueBarDatum {
  label: string;
  revenue: number;
  orderCount: number;
}

interface Props {
  data: RevenueBarDatum[];
  height?: number;
  /** Tên cột đầu trong dạng bảng, VD "Tháng" / "Năm" */
  labelTitle: string;
}

// Màu chữ dùng token chữ, không dùng màu của cột
const INK = { primary: "#1f1f1f", secondary: "#595959", muted: "#8c8c8c", grid: "#f0f0f0" };

const compact = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: RevenueBarDatum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium" style={{ color: INK.primary }}>
        {d.label}
      </div>
      <div className="flex items-center gap-2" style={{ color: INK.secondary }}>
        <span className="inline-block h-2 w-2 rounded-sm" style={{ background: BRAND }} />
        Doanh thu: <span style={{ color: INK.primary }}>{formatMoney(d.revenue)}</span>
      </div>
      <div className="mt-0.5 pl-4" style={{ color: INK.secondary }}>
        Số đơn: <span style={{ color: INK.primary }}>{d.orderCount}</span>
      </div>
    </div>
  );
}

/** Biểu đồ cột doanh thu (1 chuỗi, 1 trục), có thể chuyển sang dạng bảng */
export default function RevenueBarChart({ data, height = 280, labelTitle }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Segmented
          size="small"
          value={view}
          onChange={(v) => setView(v as "chart" | "table")}
          options={[
            { label: "Biểu đồ", value: "chart" },
            { label: "Bảng", value: "table" },
          ]}
        />
      </div>
      {view === "table" ? (
        <Table
          size="small"
          rowKey="label"
          pagination={false}
          dataSource={data}
          columns={[
            { title: labelTitle, dataIndex: "label" },
            { title: "Doanh thu", dataIndex: "revenue", align: "right", render: formatMoney },
            { title: "Số đơn", dataIndex: "orderCount", align: "right" },
          ]}
        />
      ) : !hasData ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <Empty description="Chưa có doanh thu trong khoảng này" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={INK.grid} strokeWidth={1} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: INK.grid }}
              tick={{ fill: INK.muted, fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: INK.muted, fontSize: 12 }}
              tickFormatter={(v: number) => compact.format(v)}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="revenue" fill={BRAND} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
