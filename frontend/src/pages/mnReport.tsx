import { ClockCircleOutlined, FileExcelOutlined, ReloadOutlined, RightOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, DatePicker, Empty, List, Progress, Select, Space, Statistic, Table, Tag, Tooltip, message } from "antd";
import type { TableColumnsType } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RevenueBarChart from "../component/report/revenueBarChart";
import { formatPrice as formatMoney } from "../utils/format";
import {
  exportFullReport,
  getMonthlyRevenue,
  getOverview,
  getProductSales,
  getYearlyRevenue,
} from "../service/report.service";
import type { OrderStatusKey, ProductSalesQuery, ProductSalesRow } from "../types/report";

dayjs.extend(relativeTime);

type Range = [Dayjs, Dayjs];

const presets: { label: string; value: Range }[] = [
  { label: "7 ngày qua", value: [dayjs().subtract(6, "day"), dayjs()] },
  { label: "30 ngày qua", value: [dayjs().subtract(29, "day"), dayjs()] },
  { label: "Tháng này", value: [dayjs().startOf("month"), dayjs()] },
  {
    label: "Tháng trước",
    value: [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
  },
  { label: "Năm nay", value: [dayjs().startOf("year"), dayjs()] },
  {
    label: "Năm trước",
    value: [dayjs().subtract(1, "year").startOf("year"), dayjs().subtract(1, "year").endOf("year")],
  },
];

// Trạng thái đơn: màu chỉ ở thẻ nhãn, con số dùng màu chữ thường
const ORDER_STATUS: { key: OrderStatusKey; label: string; color: string }[] = [
  { key: "PENDING", label: "Chờ xác nhận", color: "gold" },
  { key: "CONFIRMED", label: "Đã xác nhận", color: "blue" },
  { key: "PROCESSING", label: "Đang xử lý", color: "geekblue" },
  { key: "SHIPPING", label: "Đang giao", color: "cyan" },
  { key: "DELIVERED", label: "Đã giao", color: "green" },
  { key: "CANCELLED", label: "Đã huỷ", color: "default" },
];

export default function MnReport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<Range | null>([dayjs().startOf("year"), dayjs()]);
  const [year, setYear] = useState(dayjs().year());
  const [exporting, setExporting] = useState(false);

  const query: ProductSalesQuery = {
    from: range?.[0].format("YYYY-MM-DD"),
    to: range?.[1].format("YYYY-MM-DD"),
  };

  const overviewQuery = useQuery({
    queryKey: ["report", "overview", query],
    queryFn: () => getOverview(query),
  });
  const monthlyQuery = useQuery({
    queryKey: ["report", "monthly", year],
    queryFn: () => getMonthlyRevenue(year),
  });
  const yearlyQuery = useQuery({
    queryKey: ["report", "yearly"],
    queryFn: () => getYearlyRevenue(),
  });
  const productsQuery = useQuery({
    queryKey: ["report", "product-sales", query],
    queryFn: () => getProductSales(query),
  });

  const overview = overviewQuery.data;
  const products = productsQuery.data;
  const totalRevenue = products?.summary.totalRevenue ?? 0;
  const anyError = overviewQuery.error || monthlyQuery.error || yearlyQuery.error || productsQuery.error;
  const fetching = overviewQuery.isFetching || monthlyQuery.isFetching || yearlyQuery.isFetching || productsQuery.isFetching;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportFullReport({ ...query, year });
    } catch {
      message.error("Không xuất được file Excel, vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const yearOptions = (yearlyQuery.data?.years ?? [{ year: dayjs().year() }])
    .map((y) => y.year)
    .sort((a, b) => b - a)
    .map((y) => ({ label: `Năm ${y}`, value: y }));

  const productColumns: TableColumnsType<ProductSalesRow> = [
    { title: "STT", key: "index", width: 60, align: "center", render: (_, __, index) => index + 1 },
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      render: (name: string, row) => (
        <div>
          <div className="font-medium">{name}</div>
          {row.productId === null && <div className="text-xs text-gray-400">Sản phẩm đã bị xoá</div>}
        </div>
      ),
    },
    { title: "Danh mục", dataIndex: "categoryName", width: 150, render: (v: string | null) => v ?? "—" },
    {
      title: "Số lượng bán",
      dataIndex: "quantity",
      width: 120,
      align: "right",
      sorter: (a, b) => a.quantity - b.quantity,
      render: (v: number) => v.toLocaleString("vi-VN"),
    },
    { title: "Số đơn", dataIndex: "orderCount", width: 90, align: "right", sorter: (a, b) => a.orderCount - b.orderCount },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      width: 150,
      align: "right",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.revenue - b.revenue,
      render: (v: number) => <span className="font-semibold">{formatMoney(v)}</span>,
    },
    {
      title: "Tỷ trọng",
      key: "share",
      width: 150,
      render: (_, row) => (
        <Progress
          percent={totalRevenue ? Math.round((row.revenue / totalRevenue) * 1000) / 10 : 0}
          size="small"
          strokeColor="#e16463"
        />
      ),
    },
  ];

  const kpis = [
    { title: "Doanh thu", value: overview?.revenue ?? 0, money: true, highlight: true },
    { title: "Số đơn hàng", value: overview?.orderCount ?? 0 },
    { title: "Giá trị trung bình / đơn", value: overview?.averageOrderValue ?? 0, money: true },
    { title: "Sản phẩm bán ra", value: overview?.itemsSold ?? 0 },
    { title: "Khách hàng mới", value: overview?.newCustomers ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Bộ lọc chung trên một hàng */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold">Báo cáo &amp; thống kê</h2>
        <Space wrap>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)}
            presets={presets}
            format="DD/MM/YYYY"
            allowClear
            placeholder={["Từ ngày", "Đến ngày"]}
            disabledDate={(d) => d.isAfter(dayjs(), "day")}
          />
          <Tooltip title="Đơn chờ xác nhận / đang xử lý / đang giao chưa được tính vì vẫn có thể bị huỷ">
            <Tag color="green" className="!m-0 !px-3 !py-1">
              Doanh thu: chỉ đơn đã giao thành công
            </Tag>
          </Tooltip>
          <Button
            icon={<ReloadOutlined />}
            loading={fetching}
            onClick={() => queryClient.invalidateQueries({ queryKey: ["report"] })}
          />
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            loading={exporting}
            onClick={handleExport}
            style={{ background: "#1d6f42" }}
          >
            Xuất Excel
          </Button>
        </Space>
      </div>

      {anyError && <Alert type="error" showIcon message="Không tải được một phần báo cáo, vui lòng thử lại." />}

      {/* Chỉ số tổng quan trong kỳ */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.title} size="small">
            <Statistic
              title={k.title}
              value={k.value}
              loading={overviewQuery.isLoading}
              formatter={(v) => (k.money ? formatMoney(Number(v)) : Number(v).toLocaleString("vi-VN"))}
              valueStyle={k.highlight ? { color: "#e16463", fontWeight: 600 } : undefined}
            />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Việc cần làm: đơn chờ xác nhận (mọi thời điểm) */}
        <Card
          size="small"
          title={
            <Space>
              <ClockCircleOutlined className="text-amber-500" />
              Đơn chờ xác nhận
              <Tag color="gold">{overview?.pendingCount ?? 0}</Tag>
            </Space>
          }
          extra={
            <Button type="link" size="small" onClick={() => navigate("/admin/orders?status=PENDING")}>
              Xử lý <RightOutlined />
            </Button>
          }
          loading={overviewQuery.isLoading}
        >
          {overview?.pendingOrders.length ? (
            <List
              size="small"
              dataSource={overview.pendingOrders}
              renderItem={(o) => (
                <List.Item
                  className="!cursor-pointer !px-0 hover:bg-gray-50"
                  onClick={() => navigate(`/admin/orders?code=${o.code}`)}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-sm">{o.code}</div>
                      <div className="truncate text-xs text-gray-500">
                        {o.receiverName} · {o.itemCount} sản phẩm · {dayjs(o.createdAt).locale("vi").fromNow()}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium">{formatMoney(o.total)}</span>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có đơn nào đang chờ" />
          )}
          {(overview?.pendingCount ?? 0) > (overview?.pendingOrders.length ?? 0) && (
            <div className="pt-2 text-center text-xs text-gray-500">
              và {(overview?.pendingCount ?? 0) - (overview?.pendingOrders.length ?? 0)} đơn khác
            </div>
          )}
        </Card>

        {/* Đơn hàng theo trạng thái trong kỳ */}
        <Card size="small" title="Đơn hàng theo trạng thái (trong kỳ)" loading={overviewQuery.isLoading} className="xl:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ORDER_STATUS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => navigate(`/admin/orders?status=${s.key}`)}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-3 text-left transition hover:border-gray-300"
              >
                <Tag color={s.color} className="!m-0">
                  {s.label}
                </Tag>
                <span className="text-lg font-semibold text-gray-800">{overview?.statusCounts[s.key] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-400">Bấm vào một trạng thái để xem danh sách đơn.</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          size="small"
          className="xl:col-span-2"
          title={`Doanh thu theo tháng năm ${year}`}
          extra={<Select size="small" value={year} onChange={setYear} options={yearOptions} style={{ width: 110 }} />}
          loading={monthlyQuery.isLoading}
        >
          <div className="mb-1 text-sm text-gray-500">
            Cả năm: <span className="font-semibold text-gray-800">{formatMoney(monthlyQuery.data?.totalRevenue ?? 0)}</span>
            {" · "}
            {monthlyQuery.data?.totalOrders ?? 0} đơn
          </div>
          <RevenueBarChart
            labelTitle="Tháng"
            data={(monthlyQuery.data?.months ?? []).map((m) => ({
              label: `T${m.month}`,
              revenue: m.revenue,
              orderCount: m.orderCount,
            }))}
          />
        </Card>

        <Card size="small" title="Doanh thu theo năm" loading={yearlyQuery.isLoading}>
          <RevenueBarChart
            labelTitle="Năm"
            data={(yearlyQuery.data?.years ?? []).map((y) => ({
              label: String(y.year),
              revenue: y.revenue,
              orderCount: y.orderCount,
            }))}
          />
        </Card>
      </div>

      <Card size="small" title="Sản phẩm bán ra (trong kỳ)">
        <Table<ProductSalesRow>
          rowKey={(row) => `${row.productId ?? "deleted"}-${row.productName}`}
          columns={productColumns}
          dataSource={products?.items ?? []}
          loading={productsQuery.isLoading}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={{ emptyText: "Không có sản phẩm nào được bán trong khoảng thời gian này" }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Card>

      <div className="text-xs text-gray-400">
        Doanh thu = tiền hàng trong đơn (không gồm phí vận chuyển), không tính đơn đã huỷ. "Đơn chờ xác nhận" tính
        mọi thời điểm; các số khác theo khoảng thời gian đã chọn.
      </div>
    </div>
  );
}
