import { Form, Select } from "antd";
import { SKIN_CONCERN_OPTIONS, SKIN_TYPE_OPTIONS } from "../../utils/skin";

/**
 * Nhãn dùng cho chức năng phân tích da: sản phẩm hợp loại da nào, xử lý vấn đề da nào.
 * Sản phẩm không gắn nhãn sẽ không được gợi ý sau khi phân tích.
 */
export default function SkinTagFields() {
  return (
    <div className="grid gap-x-3 sm:grid-cols-2">
      <Form.Item
        name="skinTypes"
        label="Phù hợp loại da"
        tooltip="Dùng để gợi ý sản phẩm sau khi khách phân tích da"
      >
        <Select mode="multiple" allowClear placeholder="VD: Da dầu, Da hỗn hợp" options={SKIN_TYPE_OPTIONS} />
      </Form.Item>
      <Form.Item
        name="concerns"
        label="Xử lý vấn đề da"
        tooltip="Sản phẩm phải có ít nhất 1 vấn đề da trùng với kết quả phân tích mới được gợi ý"
      >
        <Select mode="multiple" allowClear placeholder="VD: Mụn, Lỗ chân lông to" options={SKIN_CONCERN_OPTIONS} />
      </Form.Item>
    </div>
  );
}
