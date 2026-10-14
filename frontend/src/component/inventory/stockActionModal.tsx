import { Alert, Form, Input, InputNumber, Modal } from "antd";
import { useEffect } from "react";
import type { AdjustStockInput, ReceiveStockInput, StockItem } from "../../types/inventory";
import { formatDelta, stockItemLabel } from "../../utils/inventory";

export type StockAction = "receive" | "adjust";

interface Props {
  /** Biến thể đang thao tác, null thì đóng modal */
  item: StockItem | null;
  action: StockAction;
  saving?: boolean;
  onCancel: () => void;
  onReceive: (input: ReceiveStockInput) => void | Promise<void>;
  onAdjust: (input: AdjustStockInput) => void | Promise<void>;
}

interface FormValues {
  quantity?: number;
  stock?: number;
  reason?: string;
}

const COPY: Record<StockAction, { title: string; ok: string }> = {
  receive: { title: "Nhập thêm hàng", ok: "Nhập kho" },
  adjust: { title: "Kiểm kho (đặt lại số tồn)", ok: "Lưu tồn kho" },
};

/** Nhập thêm hàng (cộng dồn) hoặc kiểm kho (ghi đè số tồn thực tế) cho 1 biến thể */
export default function StockActionModal({ item, action, saving, onCancel, onReceive, onAdjust }: Props) {
  const [form] = Form.useForm<FormValues>();
  const quantity = Form.useWatch("quantity", form) ?? 0;
  const newStock = Form.useWatch("stock", form);
  const current = item?.stock ?? 0;

  useEffect(() => {
    if (item) form.setFieldsValue(action === "adjust" ? { stock: item.stock, reason: "" } : { quantity: undefined, reason: "" });
  }, [item, action]);

  const preview =
    action === "receive"
      ? { after: current + (quantity || 0), delta: quantity || 0 }
      : { after: newStock ?? current, delta: (newStock ?? current) - current };

  const submit = (values: FormValues) =>
    action === "receive"
      ? onReceive({ quantity: values.quantity!, reason: values.reason?.trim() || undefined })
      : onAdjust({ stock: values.stock!, expectedStock: current, reason: values.reason!.trim() });

  return (
    <Modal
      open={Boolean(item)}
      title={COPY[action].title}
      okText={COPY[action].ok}
      cancelText="Huỷ"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      afterClose={() => form.resetFields()}
      forceRender
    >
      {item && (
        <>
          <p className="mb-1 font-medium">{stockItemLabel(item)}</p>
          <p className="mb-4 text-sm text-gray-500">
            Tồn hiện tại: <b>{current}</b> → sau khi lưu: <b>{preview.after}</b>{" "}
            <span className={preview.delta > 0 ? "text-green-600" : preview.delta < 0 ? "text-red-600" : ""}>
              ({formatDelta(preview.delta)})
            </span>
          </p>
        </>
      )}

      <Form form={form} layout="vertical" requiredMark={false} onFinish={submit}>
        {action === "receive" ? (
          <Form.Item
            name="quantity"
            label="Số lượng nhập thêm"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={1} max={100000} precision={0} className="!w-full" placeholder="VD: 50" autoFocus />
          </Form.Item>
        ) : (
          <>
            <Alert
              className="!mb-4"
              type="info"
              showIcon
              message="Dùng khi đếm thực tế lệch với hệ thống (hư hỏng, thất lạc, đếm sai...)."
            />
            <Form.Item
              name="stock"
              label="Số tồn thực tế"
              rules={[{ required: true, message: "Nhập số tồn thực tế" }]}
            >
              <InputNumber min={0} max={1000000} precision={0} className="!w-full" autoFocus />
            </Form.Item>
          </>
        )}
        <Form.Item
          name="reason"
          label={action === "receive" ? "Ghi chú (nhà cung cấp, số phiếu nhập...)" : "Lý do điều chỉnh"}
          rules={action === "adjust" ? [{ required: true, whitespace: true, message: "Nhập lý do điều chỉnh" }] : []}
          className="!mb-0"
        >
          <Input.TextArea
            maxLength={500}
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder={action === "receive" ? "VD: Nhập lô tháng 10 từ NCC A" : "VD: Kiểm kho cuối tháng, 2 hộp bị móp"}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
