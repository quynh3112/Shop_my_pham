import { Modal, Button } from "antd";
import type { ReactNode } from "react";

interface Props {
  title?: string;
  open: boolean;
  width?: number;
  cancelText?: string;
  okText?: string;

  onClose?: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;

  children: ReactNode;
  headerAction?: ReactNode;
}

export default function Dialog({
  title,
  open,
  width = 500,
  cancelText = "Hủy",
  okText = "Xác nhận",
  onClose,
  onCancel,
  onSubmit,
  children,
  headerAction,
}: Props) {
  return (
    <Modal
      open={open}
      width={width}
      footer={null}
      onCancel={onClose}
      title={
        <div className="flex items-center justify-between pr-5">
          <h3 className="m-0 font-medium text-black">{title}</h3>

          <div>{headerAction}</div>
        </div>
      }
    >
      {/* content */}
      {children}

      {/* footer */}
      <div className="flex justify-end gap-3 mt-5">
        <Button onClick={onCancel}>{cancelText}</Button>

        <Button type="primary" onClick={onSubmit}>
          {okText}
        </Button>
      </div>
    </Modal>
  );
}
