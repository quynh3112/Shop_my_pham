import {
  Button,
  Cascader,
  Form,
  Input,
  InputNumber,
  Space,
  type FormInstance,
} from "antd";
import type { Category } from "../types/category";
import TextArea from "antd/es/input/TextArea";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

interface Props {
  handleSubmit: (values: any) => void;
  form: FormInstance;
  categories: Category[];
  handleCategoryChange: (categoryId:number) => void;
}

type CategoryOption = {
  value: number;
  label: string;
  children?: CategoryOption[];
};

const buildCategoryOptions = (categories: Category[]): CategoryOption[] =>
  categories.map((category) => ({
    value: category.id,
    label: category.name,
    children: category.children?.length
      ? buildCategoryOptions(category.children)
      : undefined,
  }));

export default function CreateProduct({
  handleSubmit,
  form,
  categories,
  handleCategoryChange,
}: Props) {
  const categoryOptions = buildCategoryOptions(categories);
  const [categoryPath, setCategoryPath] = useState<number[]>([]);

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item name="name">
        <Input placeholder="Tên sản phẩm" />
      </Form.Item>
      <Form.Item name="description">
        <TextArea placeholder="Mô tả sản phẩm" />
      </Form.Item>
      <Form.Item name="price">
        <Input min={0} type={"number"} placeholder="Giá sản phẩm" />
      </Form.Item>
      <Form.Item label="Danh mục">
        <Cascader
          options={categoryOptions}
          value={categoryPath}
          showSearch
          placeholder="Chọn danh mục"
          changeOnSelect={false}
          displayRender={(labels) => labels.join(" / ")}
          onChange={(value) => {
            const path = value as number[];
            setCategoryPath(path);
            const selectedCategoryId = path[path.length - 1];
            form.setFieldValue("categoryId", selectedCategoryId);
            if (selectedCategoryId !== undefined) {
              handleCategoryChange(selectedCategoryId);
            }
          }}
        />
      </Form.Item>
      <Form.Item name="categoryId" hidden>
        <InputNumber />
      </Form.Item>
      <Form.Item label="Biến thể">
        <Form.List name="variants">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...resetField }) => (
                <>
                  <Space
                    key={key}
                    style={{
                      display: "flex",
                      marginBottom: 12,
                      alignItems: "flex-start",
                    }}
                    align="baseline"
                  >
                    <Form.Item {...resetField} name={[name, "name"]}>
                      <Input placeholder="Tên màu / shade" />
                    </Form.Item>
                    <Form.Item
                      {...resetField}
                      name={[name, "size"]}
                      rules={[
                        {
                          required: true,
                          message: "Nhập size",
                        },
                      ]}
                    >
                      <Input placeholder="VD: 3.5g" />
                    </Form.Item>
                    <Form.Item
                      {...resetField}
                      name={[name, "initialStock"]}
                      rules={[
                        {
                          required: true,
                          message: "Nhập tồn kho",
                        },
                      ]}
                    >
                      <InputNumber min={0} placeholder="Tồn kho" />
                    </Form.Item>

                    {/* Xóa */}
                    {fields.length > 1 && (
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    )}
                  </Space>
                </>
              ))}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => add()}
              >
                Thêm biến thể
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>
    </Form>
  );
}
