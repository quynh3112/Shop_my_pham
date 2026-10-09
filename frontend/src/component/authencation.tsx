import {
  ArrowLeftOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  ConfigProvider,
  Form,
  Input,
  Modal,
  message,
  type FormRule,
  type ThemeConfig,
} from "antd";
import { useEffect, useState, type ReactNode } from "react";
import useAuth from "../hooks/useAuth";
import type { Login, OtpSent, Register, User } from "../types/user";

interface Props {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

type Tab = "login" | "register";

// auth: form Đăng nhập/Đăng ký | registerOtp: nhập OTP xác thực email đăng ký
// forgotEmail -> forgotOtp -> resetPassword: luồng quên mật khẩu
type View =
  | "auth"
  | "registerOtp"
  | "forgotEmail"
  | "forgotOtp"
  | "resetPassword";

type RegisterValues = Register & { confirmPassword: string };

const BRAND = "#e16463";

// Theme riêng cho modal: hồng thương hiệu, input bo tròn và cao hơn mặc định
const authTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND,
    colorPrimaryHover: "#c95050",
    colorPrimaryActive: "#b84444",
    colorLink: BRAND,
    borderRadius: 12,
    controlHeight: 44,
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Input: {
      hoverBorderColor: "#e88f98",
      activeBorderColor: BRAND,
      activeShadow: "0 0 0 3px rgba(225, 100, 99, 0.12)",
    },
    Button: {
      primaryShadow: "none",
      fontWeight: 600,
      controlHeight: 48,
      borderRadius: 999,
      contentFontSize: 15,
    },
    Form: {
      labelColor: "#6b5b5e",
      labelFontSize: 13,
      verticalLabelPadding: "0 0 6px",
      itemMarginBottom: 16,
    },
  },
};

// Ảnh khung vòm bên trái, đổi theo tab
const SIDE_IMAGES: Record<Tab, string> = {
  login: "https://i.pinimg.com/736x/75/14/37/751437b7a230d0d519d5bfe3abe680a6.jpg",
  register: "https://i.pinimg.com/736x/3a/cc/58/3acc58ff2232a962db63fd17cf0c51ad.jpg",
};

const otpRules: FormRule[] = [
  { required: true, len: 6, message: "Vui lòng nhập đủ 6 số" },
];
const passwordRules: FormRule[] = [
  { required: true, message: "Vui lòng nhập mật khẩu" },
  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
];
// Ô nhập lại mật khẩu phải khớp với ô `field`
const confirmRules = (field: string): FormRule[] => [
  { required: true, message: "Vui lòng nhập lại mật khẩu" },
  ({ getFieldValue }) => ({
    validator: (_, value) =>
      !value || getFieldValue(field) === value
        ? Promise.resolve()
        : Promise.reject(new Error("Mật khẩu nhập lại không khớp")),
  }),
];
const onlyDigits = (value: string) => value.replace(/\D/g, "");
const fieldIcon = (icon: ReactNode) => (
  <span className="mr-1 text-[#c9a3a8]">{icon}</span>
);

// Đếm ngược số giây còn lại trước khi được gửi lại OTP
function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}

function SidePanel({ tab }: { tab: Tab }) {
  return (
    <div className="relative hidden w-[42%] shrink-0 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#fdf6f6] to-[#f8e1e4] px-8 py-12 md:flex">
      <span className="absolute left-8 top-8 text-2xl text-[#c87985]">✦</span>
      <span className="absolute bottom-28 right-9 text-lg text-[#e88f98]">✦</span>
      <div className="relative h-[330px] w-[230px]">
        {/* Viền vòm lệch phía sau, giống khung ảnh ở trang chủ */}
        <div className="absolute -right-4 top-4 h-full w-full rounded-t-full border border-[#e88f98]" />
        <div className="relative h-full w-full overflow-hidden rounded-t-full bg-[#f3d4d7]">
          <img
            key={tab}
            src={SIDE_IMAGES[tab]}
            alt=""
            className="auth-fade h-full w-full object-cover"
          />
        </div>
      </div>
      <p className="mt-12 font-['Cormorant_Garamond'] text-2xl font-semibold tracking-[0.35em] text-[#3d2c2e]">
        LUNELLE
      </p>
      <p className="font-['Allura'] text-3xl leading-none text-[#c87985]">
        reveal your beauty
      </p>
    </div>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-['Cormorant_Garamond'] text-[32px] font-semibold leading-tight text-[#2b1f21]">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 inline-flex items-center gap-1.5 self-start text-sm text-gray-500 transition-colors hover:text-[#e16463]"
    >
      <ArrowLeftOutlined className="text-xs" /> Quay lại
    </button>
  );
}

function TabSwitch({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "login", label: "Đăng nhập" },
    { key: "register", label: "Đăng ký" },
  ];
  return (
    <div role="tablist" className="mb-7 grid grid-cols-2 rounded-full bg-[#fbeef0] p-1">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={tab === key}
          onClick={() => onChange(key)}
          className={`rounded-full py-2 text-sm font-medium transition-all ${
            tab === key
              ? "bg-white text-[#e16463] shadow-sm"
              : "text-gray-500 hover:text-[#e16463]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function OtpStep({
  title,
  otpInfo,
  resendIn,
  loading,
  onBack,
  onSubmit,
  onResend,
}: {
  title: string;
  otpInfo: OtpSent | null;
  resendIn: number;
  loading: boolean;
  onBack: () => void;
  onSubmit: (values: { otp: string }) => void;
  onResend: () => void;
}) {
  return (
    <div className="auth-fade flex flex-col">
      <BackButton onClick={onBack} />
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#fdecee] text-2xl text-[#e16463]">
          <MailOutlined />
        </div>
        <h3 className="font-['Cormorant_Garamond'] text-[30px] font-semibold leading-tight text-[#2b1f21]">
          {title}
        </h3>
        {otpInfo && (
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Mã gồm 6 chữ số đã được gửi tới
            <br />
            <span className="font-semibold text-[#2b1f21]">{otpInfo.email}</span>
          </p>
        )}
      </div>
      <Form layout="vertical" requiredMark={false} onFinish={onSubmit} className="mt-7">
        <Form.Item name="otp" rules={otpRules} className="auth-otp">
          <Input.OTP length={6} formatter={onlyDigits} autoFocus />
        </Form.Item>
        <Button htmlType="submit" type="primary" block loading={loading}>
          Xác nhận
        </Button>
      </Form>
      <p className="mt-5 text-center text-sm text-gray-500">
        {otpInfo && <>Mã có hiệu lực trong {Math.round(otpInfo.expiresIn / 60)} phút. </>}
        {resendIn > 0 ? (
          <>
            Gửi lại mã sau <span className="font-semibold text-[#e16463]">{resendIn}s</span>
          </>
        ) : (
          <button
            type="button"
            className="font-semibold text-[#e16463] hover:underline disabled:opacity-50"
            disabled={loading}
            onClick={onResend}
          >
            Gửi lại mã
          </button>
        )}
      </p>
    </div>
  );
}

function AuthContent({ onLoginSuccess }: Pick<Props, "onLoginSuccess">) {
  const {
    loading,
    handleLogin,
    handleRegister,
    handleResendRegisterOtp,
    handleVerifyRegisterOtp,
    handleForgotPassword,
    handleVerifyResetOtp,
    handleResetPassword,
  } = useAuth();
  const [loginForm] = Form.useForm<Login>();
  const [registerForm] = Form.useForm<RegisterValues>();

  const [view, setView] = useState<View>("auth");
  const [tab, setTab] = useState<Tab>("login");
  const [registerEmail, setRegisterEmail] = useState(""); // email đang chờ xác thực đăng ký
  const [account, setAccount] = useState(""); // email/SĐT đang quên mật khẩu
  const [resetOtp, setResetOtp] = useState("");
  const [otpInfo, setOtpInfo] = useState<OtpSent | null>(null);
  const [resendIn, setResendIn] = useCountdown();

  const onOtpSent = (res: OtpSent) => {
    setOtpInfo(res);
    setResendIn(res.resendAfter);
  };

  // ----- Đăng nhập: đúng mật khẩu là vào luôn, không cần OTP -----
  const submitLogin = async (values: Login) => {
    const res = await handleLogin(values);
    if (!res) return;
    message.success("Đăng nhập thành công");
    onLoginSuccess(res.user);
  };

  // ----- Đăng ký: gửi OTP về email -> xác thực xong là đăng nhập luôn -----
  const submitRegister = async ({ fullName, email, phone, password }: RegisterValues) => {
    const res = await handleRegister({ fullName, email, phone, password });
    if (!res) return;
    setRegisterEmail(email);
    onOtpSent(res);
    setView("registerOtp");
  };

  const resendRegister = async () => {
    const res = await handleResendRegisterOtp(registerEmail);
    if (res) {
      onOtpSent(res);
      message.success("Đã gửi lại mã OTP");
    }
  };

  const submitRegisterOtp = async ({ otp }: { otp: string }) => {
    const res = await handleVerifyRegisterOtp({ email: registerEmail, otp });
    if (!res) return;
    message.success("Đăng ký thành công, chào mừng bạn đến với LUNELLE");
    onLoginSuccess(res.user);
  };

  // ----- Quên mật khẩu -----
  const submitForgot = async ({ email }: { email: string }) => {
    const res = await handleForgotPassword(email);
    if (!res) return;
    setAccount(email);
    onOtpSent(res);
    setView("forgotOtp");
  };

  const resendResetOtp = async () => {
    const res = await handleForgotPassword(account);
    if (res) {
      onOtpSent(res);
      message.success("Đã gửi lại mã OTP");
    }
  };

  const submitResetOtp = async ({ otp }: { otp: string }) => {
    const res = await handleVerifyResetOtp({ email: account, otp });
    if (!res) return;
    setResetOtp(otp);
    setView("resetPassword");
  };

  const submitNewPassword = async ({ newPassword }: { newPassword: string }) => {
    const res = await handleResetPassword({
      email: account,
      otp: resetOtp,
      newPassword,
    });
    if (!res) return;
    message.success("Đổi mật khẩu thành công, vui lòng đăng nhập lại");
    loginForm.setFieldsValue({ email: account, password: "" });
    setTab("login");
    setView("auth");
  };

  const otpStepProps = { otpInfo, resendIn, loading };

  return (
    <div className="flex min-h-[600px]">
      <SidePanel tab={tab} />

      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10">
        <p className="mb-6 font-['Cormorant_Garamond'] text-xl font-semibold tracking-[0.35em] text-[#3d2c2e] md:hidden">
          LUNELLE
        </p>

        {/* Giữ form luôn mount để không mất dữ liệu đã nhập khi sang bước OTP rồi quay lại */}
        <div className={view === "auth" ? "" : "hidden"}>
          {tab === "login" ? (
            <Heading
              title="Chào mừng trở lại"
              subtitle="Đăng nhập để tiếp tục mua sắm cùng LUNELLE."
            />
          ) : (
            <Heading
              title="Tạo tài khoản"
              subtitle="Điền thông tin bên dưới, chúng tôi sẽ gửi mã xác thực tới email của bạn."
            />
          )}
          <TabSwitch tab={tab} onChange={setTab} />

          <div className={tab === "login" ? "auth-fade" : "hidden"}>
            <Form form={loginForm} layout="vertical" requiredMark={false} onFinish={submitLogin}>
              <Form.Item
                name="email"
                label="Email hoặc số điện thoại"
                rules={[{ required: true, message: "Vui lòng nhập email hoặc số điện thoại" }]}
              >
                <Input
                  prefix={fieldIcon(<MailOutlined />)}
                  placeholder="ban@email.com"
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                className="!mb-2"
              >
                <Input.Password
                  prefix={fieldIcon(<LockOutlined />)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
              </Form.Item>
              <div className="mb-6 text-right">
                <button
                  type="button"
                  className="text-sm text-[#e16463] hover:underline"
                  onClick={() => setView("forgotEmail")}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <Button htmlType="submit" type="primary" block loading={loading}>
                Đăng nhập
              </Button>
            </Form>
          </div>

          <div className={tab === "register" ? "auth-fade" : "hidden"}>
            <Form
              form={registerForm}
              layout="vertical"
              requiredMark={false}
              onFinish={submitRegister}
            >
              <div className="grid gap-x-3 sm:grid-cols-2">
                <Form.Item
                  name="fullName"
                  label="Họ và tên"
                  rules={[{ required: true, whitespace: true, message: "Vui lòng nhập họ tên" }]}
                >
                  <Input
                    prefix={fieldIcon(<UserOutlined />)}
                    placeholder="Nguyễn Thị Lan"
                    autoComplete="name"
                  />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                    { pattern: /^0\d{9}$/, message: "Gồm 10 số, bắt đầu bằng 0" },
                  ]}
                >
                  <Input
                    prefix={fieldIcon(<PhoneOutlined />)}
                    placeholder="0912345678"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel"
                  />
                </Form.Item>
              </div>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input
                  prefix={fieldIcon(<MailOutlined />)}
                  placeholder="ban@email.com"
                  autoComplete="email"
                />
              </Form.Item>
              <div className="grid gap-x-3 sm:grid-cols-2">
                <Form.Item name="password" label="Mật khẩu" rules={passwordRules}>
                  <Input.Password
                    prefix={fieldIcon(<LockOutlined />)}
                    placeholder="Ít nhất 6 ký tự"
                    autoComplete="new-password"
                  />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Nhập lại mật khẩu"
                  dependencies={["password"]}
                  rules={confirmRules("password")}
                >
                  <Input.Password
                    prefix={fieldIcon(<LockOutlined />)}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                  />
                </Form.Item>
              </div>
              <Button htmlType="submit" type="primary" block loading={loading} className="mt-2">
                Tiếp tục
              </Button>
            </Form>
          </div>
        </div>

        {view === "registerOtp" && (
          <OtpStep
            {...otpStepProps}
            title="Xác thực email"
            onBack={() => setView("auth")}
            onSubmit={submitRegisterOtp}
            onResend={resendRegister}
          />
        )}

        {view === "forgotEmail" && (
          <div className="auth-fade flex flex-col">
            <BackButton onClick={() => setView("auth")} />
            <Heading
              title="Quên mật khẩu"
              subtitle="Nhập email hoặc số điện thoại của tài khoản, chúng tôi sẽ gửi mã OTP về email để đặt lại mật khẩu."
            />
            <Form
              layout="vertical"
              requiredMark={false}
              onFinish={submitForgot}
              initialValues={{ email: account }}
            >
              <Form.Item
                name="email"
                label="Email hoặc số điện thoại"
                rules={[{ required: true, message: "Vui lòng nhập email hoặc số điện thoại" }]}
              >
                <Input
                  prefix={fieldIcon(<MailOutlined />)}
                  placeholder="ban@email.com"
                  autoFocus
                />
              </Form.Item>
              <Button htmlType="submit" type="primary" block loading={loading} className="mt-2">
                Gửi mã OTP
              </Button>
            </Form>
          </div>
        )}

        {view === "forgotOtp" && (
          <OtpStep
            {...otpStepProps}
            title="Nhập mã OTP"
            onBack={() => setView("forgotEmail")}
            onSubmit={submitResetOtp}
            onResend={resendResetOtp}
          />
        )}

        {view === "resetPassword" && (
          <div className="auth-fade flex flex-col">
            <BackButton onClick={() => setView("forgotOtp")} />
            <Heading
              title="Đặt mật khẩu mới"
              subtitle="Mật khẩu mới phải có ít nhất 6 ký tự."
            />
            <Form layout="vertical" requiredMark={false} onFinish={submitNewPassword}>
              <Form.Item name="newPassword" label="Mật khẩu mới" rules={passwordRules}>
                <Input.Password
                  prefix={fieldIcon(<LockOutlined />)}
                  placeholder="Ít nhất 6 ký tự"
                  autoComplete="new-password"
                  autoFocus
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Nhập lại mật khẩu mới"
                dependencies={["newPassword"]}
                rules={confirmRules("newPassword")}
              >
                <Input.Password
                  prefix={fieldIcon(<LockOutlined />)}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />
              </Form.Item>
              <Button htmlType="submit" type="primary" block loading={loading} className="mt-2">
                Đổi mật khẩu
              </Button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Authencation({ open, onClose, onLoginSuccess }: Props) {
  // destroyOnHidden: đóng modal là reset toàn bộ bước/form
  return (
    <ConfigProvider theme={authTheme}>
      <Modal
        open={open}
        footer={null}
        onCancel={onClose}
        destroyOnHidden
        centered
        width={860}
        rootClassName="auth-modal"
        styles={{ container: { padding: 0, overflow: "hidden", borderRadius: 24 } }}
      >
        <AuthContent onLoginSuccess={onLoginSuccess} />
      </Modal>
    </ConfigProvider>
  );
}
