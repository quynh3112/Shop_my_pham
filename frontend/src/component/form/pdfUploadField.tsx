import { DeleteOutlined, FilePdfOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Form, Input, Space, Upload, type UploadFile } from "antd";
import { toFileUrl } from "../../service/product.service";
import { PDF_ACCEPT, PDF_RULE, keepValidFile, lastFileFromEvent } from "../../utils/file";

interface Props {
  /** Field chứa file PDF mới chọn (UploadFile[]) */
  name: string;
  /** Field boolean: true khi người dùng muốn xoá PDF đang có */
  removeName: string;
  label?: string;
  /** PDF đã lưu trên server (khi sửa) */
  existingUrl?: string | null;
}

/** Chọn 1 file PDF trong Form, hỗ trợ xem / xoá / thay PDF đang có */
export default function PdfUploadField({
  name,
  removeName,
  label = "Tài liệu (PDF, tối đa 10MB)",
  existingUrl,
}: Props) {
  const form = Form.useFormInstance();
  const newFiles: UploadFile[] = Form.useWatch(name, form) ?? [];
  const removed: boolean = Form.useWatch(removeName, form) ?? false;
  const showExisting = Boolean(existingUrl) && !removed && newFiles.length === 0;

  return (
    <>
      <Form.Item label={label}>
        {showExisting && existingUrl && (
          <Space className="mb-2">
            <a href={toFileUrl(existingUrl)} target="_blank" rel="noopener noreferrer">
              <FilePdfOutlined /> PDF hiện tại
            </a>
            <Button
              danger
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => form.setFieldValue(removeName, true)}
            >
              Xóa PDF
            </Button>
          </Space>
        )}
        <Form.Item name={name} valuePropName="fileList" getValueFromEvent={lastFileFromEvent} noStyle>
          <Upload accept={PDF_ACCEPT} maxCount={1} beforeUpload={keepValidFile(PDF_RULE)}>
            <Button icon={<UploadOutlined />}>
              {existingUrl && !removed ? "Thay file PDF" : "Chọn file PDF"}
            </Button>
          </Upload>
        </Form.Item>
      </Form.Item>
      <Form.Item name={removeName} hidden>
        <Input />
      </Form.Item>
    </>
  );
}
