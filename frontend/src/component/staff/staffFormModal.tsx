import { Alert, Checkbox, Form, Input, Modal } from "antd";
import { useEffect } from "react";
import type { Staff, StaffCreate } from "../../types/staff";
import { PERMISSION_OPTIONS } from "../../utils/permissions";

interface Props {
  open: boolean;
  /** Có giá trị khi sửa, không có khi thêm mới */
  staff?: Staff | null;
  saving?: boolean;
  onCancel: () => void;
  onSubmit: (values: StaffCreate) => unknown;
}

/** Tạo / sửa nhân viên: thông tin cơ bản + chọn quyền khu quản lý */
export default function StaffFormModal({ open, staff, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<StaffCreate>();
  const editing = Boolean(staff);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (staff) {
      form.setFieldsValue({
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phone,
        permissions: staff.permissions,
      });
    }
  }, [open, staff]);

  return (
    <Modal
      open={open}
      title={editing ? "Sửa nhân viên" : "Thêm nhân viên"}
      okText={editing ? "Lưu thay đổi" : "Tạo tài khoản"}
      cancelText="Huỷ"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      forceRender
      width={560}
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={onSubmit} initialValues={{ permissions: [] }}>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, whitespace: true, message: "Nhập họ tên" }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            normalize={(value?: string) => value?.replace(/\D/g, "")}
            rules={[
              { required: true, message: "Nhập số điện thoại" },
              { pattern: /^0\d{9}$/, message: "Gồm 10 số, bắt đầu bằng 0" },
            ]}
          >
            <Input placeholder="0901234567" inputMode="tel" />
          </Form.Item>
        </div>
        <Form.Item
          name="email"
          label="Email đăng nhập"
          normalize={(value?: string) => value?.trim()}
          rules={[
            { required: true, message: "Nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
          extra={editing ? "Email dùng để đăng nhập nên không đổi được." : undefined}
        >
          <Input placeholder="nhanvien@lunelle.vn" disabled={editing} autoComplete="off" />
        </Form.Item>
        {!editing && (
          <Form.Item
            name="password"
            label="Mật khẩu ban đầu"
            rules={[
              { required: true, message: "Nhập mật khẩu" },
              { min: 6, message: "Ít nhất 6 ký tự" },
            ]}
            extra="Gửi mật khẩu này cho nhân viên; họ có thể tự đổi trong Thông tin cá nhân."
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        )}

        <Form.Item name="permissions" label="Quyền truy cập khu quản lý">
          <Checkbox.Group className="!grid grid-cols-2 gap-2">
            {PERMISSION_OPTIONS.map((option) => (
              <Checkbox key={option.value} value={option.value}>
                {option.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
        <Alert
          type="info"
          showIcon
          message="Nhân viên chỉ thấy và thao tác được các mục được chọn. Thay đổi quyền có hiệu lực ngay."
        />
      </Form>
    </Modal>
  );
}
