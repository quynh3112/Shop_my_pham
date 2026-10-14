import { Form, Input, Modal } from "antd";

interface Props {
  /** Tên nhân viên đang đặt lại mật khẩu, null thì đóng */
  staffName: string | null;
  saving?: boolean;
  onCancel: () => void;
  onSubmit: (password: string) => unknown;
}

/** Admin đặt mật khẩu mới cho nhân viên (đăng xuất nhân viên khỏi mọi thiết bị) */
export default function ResetPasswordModal({ staffName, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<{ password: string; confirm: string }>();

  return (
    <Modal
      open={staffName !== null}
      title={`Đặt lại mật khẩu: ${staffName ?? ""}`}
      okText="Đặt lại"
      cancelText="Huỷ"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      afterClose={() => form.resetFields()}
      forceRender
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={({ password }) => onSubmit(password)}>
        <Form.Item
          name="password"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Nhập mật khẩu mới" },
            { min: 6, message: "Ít nhất 6 ký tự" },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Nhập lại mật khẩu"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Nhập lại mật khẩu" },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || value === getFieldValue("password")
                  ? Promise.resolve()
                  : Promise.reject(new Error("Mật khẩu nhập lại không khớp")),
            }),
          ]}
          extra="Nhân viên sẽ bị đăng xuất khỏi mọi thiết bị và phải đăng nhập lại bằng mật khẩu mới."
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
