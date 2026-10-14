import { Checkbox, ConfigProvider, Form, Input, Modal } from "antd";
import { useEffect } from "react";
import { authTheme } from "../../config/theme";
import type { Address, AddressInput } from "../../types/address";

interface Props {
  open: boolean;
  /** Có giá trị khi sửa địa chỉ, không có khi thêm mới */
  address?: Address | null;
  saving?: boolean;
  onCancel: () => void;
  onSubmit: (input: AddressInput) => void | Promise<void>;
}

const toFormValues = (address?: Address | null): Partial<AddressInput> =>
  address
    ? {
        fullName: address.fullname,
        phone: address.phone,
        line1: address.line,
        ward: address.ward,
        district: address.district,
        province: address.province,
        isDefault: address.isDefault,
      }
    : { isDefault: false };

/** Form thêm / sửa địa chỉ giao hàng, dùng lại được ở trang đặt hàng và trang tài khoản */
export default function AddressFormModal({ open, address, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<AddressInput>();

  useEffect(() => {
    if (open) form.setFieldsValue(toFormValues(address));
  }, [open, address]);

  return (
    <ConfigProvider theme={authTheme}>
      <Modal
        open={open}
        title={address ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
        okText={address ? "Lưu địa chỉ" : "Thêm địa chỉ"}
        cancelText="Huỷ"
        confirmLoading={saving}
        onOk={() => form.submit()}
        onCancel={onCancel}
        afterClose={() => form.resetFields()}
        forceRender
        centered
      >
        <Form form={form} layout="vertical" requiredMark={false} onFinish={onSubmit} className="pt-2">
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item
              name="fullName"
              label="Họ tên người nhận"
              rules={[
                { required: true, whitespace: true, message: "Vui lòng nhập họ tên" },
                { min: 2, message: "Họ tên quá ngắn" },
              ]}
            >
              <Input placeholder="Nguyễn Thị Lan" autoComplete="name" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              normalize={(value?: string) => value?.replace(/\D/g, "")}
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
                { pattern: /^0\d{9}$/, message: "Gồm 10 số, bắt đầu bằng 0" },
              ]}
            >
              <Input placeholder="0901234567" inputMode="tel" autoComplete="tel" />
            </Form.Item>
          </div>
          <Form.Item
            name="line1"
            label="Số nhà, tên đường"
            rules={[
              { required: true, whitespace: true, message: "Vui lòng nhập địa chỉ" },
              { min: 3, message: "Địa chỉ quá ngắn" },
            ]}
          >
            <Input placeholder="12 Lê Lợi" autoComplete="address-line1" />
          </Form.Item>
          <div className="grid gap-x-3 sm:grid-cols-3">
            <Form.Item
              name="ward"
              label="Phường / Xã"
              rules={[{ required: true, whitespace: true, message: "Nhập phường/xã" }]}
            >
              <Input placeholder="Bến Nghé" />
            </Form.Item>
            <Form.Item
              name="district"
              label="Quận / Huyện"
              rules={[{ required: true, whitespace: true, message: "Nhập quận/huyện" }]}
            >
              <Input placeholder="Quận 1" />
            </Form.Item>
            <Form.Item
              name="province"
              label="Tỉnh / Thành phố"
              rules={[{ required: true, whitespace: true, message: "Nhập tỉnh/thành" }]}
            >
              <Input placeholder="TP. Hồ Chí Minh" autoComplete="address-level1" />
            </Form.Item>
          </div>
          <Form.Item name="isDefault" valuePropName="checked" className="!mb-0">
            <Checkbox disabled={address?.isDefault}>Đặt làm địa chỉ mặc định</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
