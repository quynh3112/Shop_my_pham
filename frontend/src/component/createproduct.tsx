import {
  Button,
  Cascader,
  Form,
  Input,
  InputNumber,
  Space,
  Upload,
  message,
  type FormInstance,
  type UploadFile,
} from "antd";
import type { Category } from "../types/category";
import TextArea from "antd/es/input/TextArea";
import { DeleteOutlined, FilePdfOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { toFileUrl } from "../service/product.service";
import { useState } from "react";

interface Props {
  handleSubmit: (values: any) => void;
  form: FormInstance;
  categories: Category[];
  handleCategoryChange: (categoryId:number) => void;
  existingPdfUrl?: string | null;
}

const MAX_PDF_SIZE = 10 * 1024 * 1024;

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
  existingPdfUrl,
}: Props) {
  const pdfFiles: UploadFile[] = Form.useWatch("descriptionPdf", form) ?? [];
  const removePdf: boolean = Form.useWatch("removeDescriptionPdf", form) ?? false;
  const showExistingPdf = Boolean(existingPdfUrl) && !removePdf && pdfFiles.length === 0;
  const categoryOptions = buildCategoryOptions(categories);
  const [categoryPath, setCategoryPath] = useState<number[]>([]);

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item name="name">
        <Input placeholder="Tên sản phẩm" />
      </Form.Item>
      <Form.Item name="description">
        <TextArea placeholder="Mô tả sản phẩm" autoSize={{ minRows: 4, maxRows: 12 }} />
      </Form.Item>
      <Form.Item label="Tài liệu mô tả (PDF, tối đa 10MB)">
        {showExistingPdf && existingPdfUrl && (
          <Space className="mb-2">
            <a href={toFileUrl(existingPdfUrl)} target="_blank" rel="noopener noreferrer">
              <FilePdfOutlined /> PDF hiện tại
            </a>
            <Button
              danger
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => form.setFieldValue("removeDescriptionPdf", true)}
            >
              Xóa PDF
            </Button>
          </Space>
        )}
        <Form.Item
          name="descriptionPdf"
          valuePropName="fileList"
          getValueFromEvent={(event: { fileList: UploadFile[] }) => event.fileList.slice(-1)}
          noStyle
        >
          <Upload
            accept="application/pdf,.pdf"
            maxCount={1}
            beforeUpload={(file) => {
              if (file.type !== "application/pdf") {
                message.error("Chỉ chấp nhận file PDF.");
                return Upload.LIST_IGNORE;
              }
              if (file.size > MAX_PDF_SIZE) {
                message.error("File PDF tối đa 10MB.");
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>
              {existingPdfUrl && !removePdf ? "Thay file PDF" : "Chọn file PDF"}
            </Button>
          </Upload>
        </Form.Item>
      </Form.Item>
      <Form.Item name="removeDescriptionPdf" hidden>
        <Input />
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
