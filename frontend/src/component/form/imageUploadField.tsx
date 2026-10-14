import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Image, Popconfirm, Upload } from "antd";
import { toFileUrl } from "../../service/product.service";
import { IMAGE_ACCEPT, IMAGE_RULE, fileListFromEvent, keepValidFile } from "../../utils/file";

export interface ExistingImage {
  id: number;
  url: string;
  thumbUrl?: string | null;
}

interface Props {
  /** Tên field trong Form, giá trị là UploadFile[] của các ảnh mới chọn */
  name: string;
  label?: string;
  maxCount?: number;
  /** Ảnh đã lưu trên server (khi sửa) */
  existingImages?: ExistingImage[];
  onRemoveExisting?: (imageId: number) => void | Promise<void>;
}

/** Chọn nhiều ảnh trong Form; ảnh chỉ được tải lên khi form được lưu */
export default function ImageUploadField({
  name,
  label = "Ảnh (JPG, PNG, WEBP, GIF - tối đa 5MB/ảnh)",
  maxCount = 10,
  existingImages = [],
  onRemoveExisting,
}: Props) {
  return (
    <Form.Item label={label}>
      {existingImages.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {existingImages.map((image) => (
            <div key={image.id} className="relative">
              <Image
                src={toFileUrl(image.thumbUrl || image.url)}
                width={96}
                height={96}
                className="rounded-lg object-cover"
              />
              {onRemoveExisting && (
                <Popconfirm
                  title="Xoá ảnh này?"
                  okText="Xoá"
                  cancelText="Huỷ"
                  onConfirm={() => onRemoveExisting(image.id)}
                >
                  <Button
                    danger
                    size="small"
                    shape="circle"
                    icon={<DeleteOutlined />}
                    className="!absolute right-1 top-1"
                  />
                </Popconfirm>
              )}
            </div>
          ))}
        </div>
      )}
      <Form.Item name={name} valuePropName="fileList" getValueFromEvent={fileListFromEvent} noStyle>
        <Upload
          listType="picture-card"
          accept={IMAGE_ACCEPT}
          multiple
          maxCount={maxCount}
          beforeUpload={keepValidFile(IMAGE_RULE)}
        >
          <div>
            <PlusOutlined />
            <div className="mt-1 text-xs">Thêm ảnh</div>
          </div>
        </Upload>
      </Form.Item>
    </Form.Item>
  );
}
