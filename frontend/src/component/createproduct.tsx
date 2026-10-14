import { Form, Input, InputNumber, type FormInstance } from "antd";
import type { Category } from "../types/category";
import CategoryCascaderField from "./form/categoryCascaderField";
import ImageUploadField, { type ExistingImage } from "./form/imageUploadField";
import PdfUploadField from "./form/pdfUploadField";
import SkinTagFields from "./form/skinTagFields";
import VariantListField from "./form/variantListField";

interface Props {
  handleSubmit: (values: any) => void;
  form: FormInstance;
  categories: Category[];
  handleCategoryChange: (categoryId: number) => void;
  existingPdfUrl?: string | null;
  existingImages?: ExistingImage[];
  onRemoveExistingImage?: (imageId: number) => void | Promise<void>;
}

export default function CreateProduct({
  handleSubmit,
  form,
  categories,
  handleCategoryChange,
  existingPdfUrl,
  existingImages,
  onRemoveExistingImage,
}: Props) {
  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item name="name" rules={[{ required: true, whitespace: true, message: "Nhập tên sản phẩm" }]}>
        <Input placeholder="Tên sản phẩm" />
      </Form.Item>
      <ImageUploadField
        name="newImages"
        label="Ảnh sản phẩm (JPG, PNG, WEBP, GIF - tối đa 5MB/ảnh)"
        existingImages={existingImages}
        onRemoveExisting={onRemoveExistingImage}
      />
      <Form.Item name="description">
        <Input.TextArea placeholder="Mô tả sản phẩm" autoSize={{ minRows: 4, maxRows: 12 }} />
      </Form.Item>
      <PdfUploadField
        name="descriptionPdf"
        removeName="removeDescriptionPdf"
        label="Tài liệu mô tả (PDF, tối đa 10MB)"
        existingUrl={existingPdfUrl}
      />
      <Form.Item name="price" rules={[{ required: true, message: "Nhập giá sản phẩm" }]}>
        <InputNumber<number>
          min={0}
          step={1000}
          className="!w-full"
          placeholder="Giá sản phẩm (đ)"
          formatter={(value) => (value ? Number(value).toLocaleString("vi-VN") : "")}
          parser={(value) => Number((value ?? "").replace(/\D/g, ""))}
        />
      </Form.Item>
      <CategoryCascaderField categories={categories} onSelect={handleCategoryChange} />
      <SkinTagFields />
      <VariantListField />
    </Form>
  );
}
