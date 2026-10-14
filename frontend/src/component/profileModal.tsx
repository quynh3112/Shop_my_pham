import { CameraOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, ConfigProvider, Form, Input, Modal, Spin, Upload, message } from "antd";
import { useEffect, useState } from "react";
import { BRAND, authTheme } from "../config/theme";
import { toFileUrl } from "../service/product.service";
import { getApiErrorMessage as getErrorMessage } from "../utils/error";
import { IMAGE_ACCEPT, IMAGE_RULE, validateFile } from "../utils/file";
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  type Profile,
} from "../service/user.service";
import { getStoredUser, notifyAuthChanged } from "../utils/auth";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Cập nhật user lưu trong localStorage để Header hiển thị thông tin mới
const syncStoredUser = (profile: Profile) => {
  localStorage.setItem("user", JSON.stringify({ ...getStoredUser(), ...profile }));
  notifyAuthChanged();
};

export default function ProfileModal({ open, onClose }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [infoForm] = Form.useForm<Pick<Profile, "fullName" | "phone">>();
  const [passwordForm] = Form.useForm<PasswordValues>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Form chỉ render sau khi tải xong để nhận đúng giá trị ban đầu
    setProfile(null);
    setLoading(true);
    getMyProfile()
      .then(setProfile)
      .catch((error) => messageApi.error(getErrorMessage(error, "Không tải được thông tin cá nhân.")))
      .finally(() => setLoading(false));
  }, [open]);

  const applyProfile = (data: Profile) => {
    setProfile(data);
    syncStoredUser(data);
  };

  const saveInfo = async (values: Pick<Profile, "fullName" | "phone">) => {
    setSaving(true);
    try {
      applyProfile(await updateMyProfile({ fullName: values.fullName, phone: values.phone ?? undefined }));
      messageApi.success("Đã cập nhật thông tin cá nhân.");
    } catch (error) {
      messageApi.error(getErrorMessage(error, "Không thể cập nhật thông tin."));
    } finally {
      setSaving(false);
    }
  };

  const changeAvatar = async (file: File) => {
    setUploading(true);
    try {
      applyProfile(await uploadMyAvatar(file));
      messageApi.success("Đã đổi ảnh đại diện.");
    } catch (error) {
      messageApi.error(getErrorMessage(error, "Không thể đổi ảnh đại diện."));
    } finally {
      setUploading(false);
    }
  };

  const savePassword = async ({ currentPassword, newPassword }: PasswordValues) => {
    setSaving(true);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      messageApi.success("Đã đổi mật khẩu.");
      passwordForm.resetFields();
      setEditingPassword(false);
    } catch (error) {
      messageApi.error(getErrorMessage(error, "Không thể đổi mật khẩu."));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    passwordForm.resetFields();
    setEditingPassword(false);
    onClose();
  };

  return (
    <ConfigProvider theme={authTheme}>
    <Modal
      title={<span className="text-lg font-semibold text-[#2d2020]">Thông tin cá nhân</span>}
      open={open}
      footer={null}
      onCancel={handleClose}
      width={480}
      centered
      destroyOnHidden
      rootClassName="auth-modal"
      styles={{ container: { borderRadius: 24 } }}
    >
      {contextHolder}
      {loading || !profile ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <div className="flex flex-col gap-6 py-2">
          <div className="flex flex-col items-center gap-3">
            <Upload
              accept={IMAGE_ACCEPT}
              showUploadList={false}
              beforeUpload={(file) => {
                const error = validateFile(file, IMAGE_RULE);
                if (error) messageApi.error(error);
                else void changeAvatar(file);
                return false;
              }}
            >
              <button
                type="button"
                className="group relative rounded-full"
                aria-label="Đổi ảnh đại diện"
                disabled={uploading}
              >
                <Avatar
                  size={96}
                  style={{ backgroundColor: "#fbeef0", color: BRAND, border: `2px solid ${BRAND}` }}
                  src={profile.avatarUrl ? toFileUrl(profile.avatarUrl) : undefined}
                  icon={<UserOutlined />}
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xl text-white opacity-0 transition group-hover:opacity-100">
                  {uploading ? <Spin size="small" /> : <CameraOutlined />}
                </span>
              </button>
            </Upload>
            <div className="text-center">
              <p className="text-lg font-semibold text-[#2d2020]">{profile.fullName}</p>
              <p className="text-sm text-[#987979]">{profile.email}</p>
            </div>
          </div>

          <Form
            form={infoForm}
            layout="vertical"
            onFinish={saveInfo}
            requiredMark={false}
            initialValues={{ fullName: profile.fullName, phone: profile.phone ?? "" }}
          >
            <Form.Item label="Email">
              <Input value={profile.email} disabled />
            </Form.Item>
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[
                { required: true, whitespace: true, message: "Vui lòng nhập họ tên" },
                { max: 120, message: "Họ tên tối đa 120 ký tự" },
              ]}
            >
              <Input placeholder="Họ và tên" />
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
              <Input placeholder="0901234567" inputMode="tel" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving && !editingPassword} block>
              Lưu thông tin
            </Button>
          </Form>

          <div className="border-t border-[#f3d4d7] pt-5">
            {!editingPassword ? (
              <Button icon={<LockOutlined />} onClick={() => setEditingPassword(true)} block>
                Đổi mật khẩu
              </Button>
            ) : (
              <Form form={passwordForm} layout="vertical" onFinish={savePassword} requiredMark={false}>
                <Form.Item
                  name="currentPassword"
                  label="Mật khẩu hiện tại"
                  rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
                >
                  <Input.Password autoComplete="current-password" />
                </Form.Item>
                <Form.Item
                  name="newPassword"
                  label="Mật khẩu mới"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu mới" },
                    { min: 6, message: "Ít nhất 6 ký tự" },
                  ]}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Nhập lại mật khẩu mới"
                  dependencies={["newPassword"]}
                  rules={[
                    { required: true, message: "Vui lòng nhập lại mật khẩu" },
                    ({ getFieldValue }) => ({
                      validator: (_, value) =>
                        !value || value === getFieldValue("newPassword")
                          ? Promise.resolve()
                          : Promise.reject(new Error("Mật khẩu nhập lại không khớp")),
                    }),
                  ]}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
                <div className="flex gap-3">
                  <Button
                    block
                    onClick={() => {
                      passwordForm.resetFields();
                      setEditingPassword(false);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="primary" htmlType="submit" loading={saving} block>
                    Đổi mật khẩu
                  </Button>
                </div>
              </Form>
            )}
          </div>
        </div>
      )}
    </Modal>
    </ConfigProvider>
  );
}
