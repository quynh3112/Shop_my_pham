import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, Button, Drawer, Input, InputNumber, Segmented, Select, Space, Tabs, Tooltip, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import MovementHistoryTable from "../component/inventory/movementHistoryTable";
import StockActionModal, { type StockAction } from "../component/inventory/stockActionModal";
import StockSummaryCards from "../component/inventory/stockSummaryCards";
import StockTable from "../component/inventory/stockTable";
import useCategory from "../hooks/useCategory";
import { useStockActions, useStockList } from "../hooks/useInventory";
import type { Category } from "../types/category";
import type { AdjustStockInput, ReceiveStockInput, StockItem, StockStatus } from "../types/inventory";
import { getApiErrorMessage } from "../utils/error";
import { stockItemLabel } from "../utils/inventory";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { label: string; value: StockStatus }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Còn hàng", value: "in" },
  { label: "Sắp hết", value: "low" },
  { label: "Hết hàng", value: "out" },
];

const flattenCategories = (items: Category[]): Category[] =>
  items.flatMap((item) => [item, ...flattenCategories(item.children ?? [])]);

function StockTab() {
  const [messageApi, contextHolder] = message.useMessage();
  const { categories, fetchCategory } = useCategory();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState<string>();
  const [categoryId, setCategoryId] = useState<number>();
  const [status, setStatus] = useState<StockStatus>("all");
  const [lowThreshold, setLowThreshold] = useState(5);
  const [page, setPage] = useState(1);

  const [actionItem, setActionItem] = useState<StockItem | null>(null);
  const [action, setAction] = useState<StockAction>("receive");
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);

  useEffect(() => {
    void fetchCategory();
  }, []);

  const { items, summary, pagination, loading, fetching, error, refetch } = useStockList({
    search,
    categoryId,
    status,
    lowThreshold,
    page,
    limit: PAGE_SIZE,
  });
  const { receive, adjust, saving } = useStockActions();

  const categoryOptions = useMemo(
    () => flattenCategories(categories).map((category) => ({ label: category.name, value: category.id })),
    [categories],
  );

  const openAction = (item: StockItem, nextAction: StockAction) => {
    setAction(nextAction);
    setActionItem(item);
  };

  const runAction = async (run: () => Promise<unknown>, success: string) => {
    try {
      await run();
      messageApi.success(success);
      setActionItem(null);
    } catch (actionError) {
      messageApi.error(getApiErrorMessage(actionError, "Không thể cập nhật tồn kho."));
      // Tồn đã bị đơn hàng khác thay đổi -> tải lại để admin thấy số mới
      void refetch();
    }
  };

  const handleReceive = (input: ReceiveStockInput) =>
    runAction(() => receive({ variantId: actionItem!.variantId, input }), `Đã nhập thêm ${input.quantity} sản phẩm.`);
  const handleAdjust = (input: AdjustStockInput) =>
    runAction(() => adjust({ variantId: actionItem!.variantId, input }), "Đã cập nhật tồn kho.");

  const changeFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5">
      {contextHolder}
      <StockSummaryCards
        summary={summary}
        loading={loading}
        activeStatus={status}
        onFilter={changeFilter(setStatus)}
      />

      <Space wrap>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tên sản phẩm, màu, size..."
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            if (!event.target.value) changeFilter(setSearch)(undefined);
          }}
          onPressEnter={() => changeFilter(setSearch)(searchInput.trim() || undefined)}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Danh mục"
          options={categoryOptions}
          value={categoryId}
          onChange={changeFilter(setCategoryId)}
          style={{ width: 200 }}
        />
        <Segmented options={STATUS_OPTIONS} value={status} onChange={(value) => changeFilter(setStatus)(value as StockStatus)} />
        <Tooltip title="Tồn kho từ 1 đến ngưỡng này được coi là sắp hết">
          <InputNumber
            min={1}
            max={1000}
            precision={0}
            addonBefore="Ngưỡng sắp hết"
            value={lowThreshold}
            onChange={(value) => value && changeFilter(setLowThreshold)(value)}
            style={{ width: 190 }}
          />
        </Tooltip>
        <Button icon={<ReloadOutlined />} loading={fetching} onClick={() => void refetch()} />
      </Space>

      {error && <Alert type="error" showIcon message="Không tải được tồn kho" description={error} />}

      <StockTable
        items={items}
        loading={fetching}
        lowThreshold={lowThreshold}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: pagination?.total ?? 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
        onReceive={(item) => openAction(item, "receive")}
        onAdjust={(item) => openAction(item, "adjust")}
        onHistory={setHistoryItem}
      />

      <StockActionModal
        item={actionItem}
        action={action}
        saving={saving}
        onCancel={() => setActionItem(null)}
        onReceive={handleReceive}
        onAdjust={handleAdjust}
      />

      <Drawer
        open={Boolean(historyItem)}
        width={760}
        title={historyItem ? `Lịch sử kho: ${stockItemLabel(historyItem)}` : ""}
        onClose={() => setHistoryItem(null)}
        destroyOnHidden
      >
        {historyItem && <MovementHistoryTable variantId={historyItem.variantId} showFilters={false} />}
      </Drawer>
    </div>
  );
}

export default function MnInventory() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Quản lý kho</h1>
      <Tabs
        destroyOnHidden
        items={[
          { key: "stock", label: "Tồn kho", children: <StockTab /> },
          { key: "movements", label: "Lịch sử nhập xuất", children: <MovementHistoryTable /> },
        ]}
      />
    </div>
  );
}
