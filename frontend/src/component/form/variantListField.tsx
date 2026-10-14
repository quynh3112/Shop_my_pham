import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Space, Tag } from "antd";

interface Props {
  name?: string;
  label?: string;
}

/**
 * Danh sách biến thể sản phẩm: tên màu/shade, size, tồn kho.
 * Biến thể đã lưu giữ lại id (để backend cập nhật thay vì tạo mới) và chỉ hiển thị tồn kho hiện tại;
 * chỉ biến thể mới thêm mới nhập tồn kho ban đầu.
 */
export default function VariantListField({ name = "variants", label = "Biến thể" }: Props) {
  const form = Form.useFormInstance();

  return (
    <Form.Item label={label}>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name: index, ...restField }) => {
              const existing = form.getFieldValue([name, index]) as { id?: number; stock?: number } | undefined;
              const isSaved = existing?.id !== undefined;
              return (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 12, alignItems: "flex-start" }}
                  align="baseline"
                >
                  <Form.Item {...restField} name={[index, "id"]} hidden>
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[index, "name"]}
                    rules={[{ required: true, whitespace: true, message: "Nhập tên" }]}
                  >
                    <Input placeholder="Tên màu / shade" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[index, "size"]}
                    rules={[{ required: true, message: "Nhập size" }]}
                  >
                    <Input placeholder="VD: 3.5g" />
                  </Form.Item>
                  {isSaved ? (
                    <Tag className="!mt-1">Tồn kho: {existing?.stock ?? 0}</Tag>
                  ) : (
                    <Form.Item
                      {...restField}
                      name={[index, "initialStock"]}
                      rules={[{ required: true, message: "Nhập tồn kho" }]}
                    >
                      <InputNumber min={0} placeholder="Tồn kho ban đầu" />
                    </Form.Item>
                  )}
                  {fields.length > 1 && (
                    <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(index)} />
                  )}
                </Space>
              );
            })}
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
              Thêm biến thể
            </Button>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
}
