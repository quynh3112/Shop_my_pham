import { Upload, message, type UploadFile, type UploadProps } from "antd";

export const MB = 1024 * 1024;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
export const PDF_TYPES = ["application/pdf"];
export const PDF_ACCEPT = "application/pdf,.pdf";

export interface FileRule {
  types: string[];
  maxSize: number;
  typeLabel: string; // VD: "ảnh JPG, PNG, WEBP hoặc GIF"
}

export const IMAGE_RULE: FileRule = {
  types: IMAGE_TYPES,
  maxSize: 5 * MB,
  typeLabel: "ảnh JPG, PNG, WEBP hoặc GIF",
};

export const PDF_RULE: FileRule = {
  types: PDF_TYPES,
  maxSize: 10 * MB,
  typeLabel: "file PDF",
};

/** Trả về thông báo lỗi nếu file không hợp lệ, hợp lệ thì trả về null */
export const validateFile = (file: File, rule: FileRule): string | null => {
  if (!rule.types.includes(file.type)) return `"${file.name}" không phải ${rule.typeLabel}.`;
  if (file.size > rule.maxSize) return `"${file.name}" lớn hơn ${rule.maxSize / MB}MB.`;
  return null;
};

/**
 * beforeUpload cho antd Upload: kiểm tra file, chỉ giữ file trong form
 * (không tự upload) để tải lên sau khi bấm lưu.
 */
export const keepValidFile =
  (rule: FileRule): NonNullable<UploadProps["beforeUpload"]> =>
  (file) => {
    const error = validateFile(file, rule);
    if (error) {
      message.error(error);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

/** Dùng cho Form.Item bọc Upload: valuePropName="fileList" + getValueFromEvent */
export const fileListFromEvent = (event: { fileList: UploadFile[] }) => event.fileList;
export const lastFileFromEvent = (event: { fileList: UploadFile[] }) => event.fileList.slice(-1);

/** Lấy các File thật từ fileList của antd Upload */
export const toFiles = (fileList?: UploadFile[]): File[] =>
  (fileList ?? [])
    .map((file) => file.originFileObj)
    .filter((file): file is NonNullable<typeof file> => Boolean(file));
