import { ShoppingCartOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Tabs,
  message,
  type MenuProps,
  type TabsProps,
} from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { Login, User } from "../types/user";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import useRequireLogin from "../hooks/useRequireLogin";
import {
  AUTH_CHANGED_EVENT,
  clearAuth,
  getStoredUser,
  safeRedirectPath,
} from "../utils/auth";
import CategoryMenu from "./category";

export default function Header() {
  const { handleLogin, handleRegister, loading: authLoading, error: authError } = useAuth();
  const { cart } = useCart();
  const { requireLogin } = useRequireLogin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser);

  // Trang khác chuyển về "/?login=1" khi cần đăng nhập
  const loginRequested = searchParams.get("login") === "1";
  const isLoginOpen = isOpen || (loginRequested && !user);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    window.addEventListener(AUTH_CHANGED_EVENT, syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const clearLoginParams = () => {
    if (!loginRequested) return;
    const next = new URLSearchParams(searchParams);
    next.delete("login");
    next.delete("redirect");
    setSearchParams(next, { replace: true });
  };

  const handleClose = () => {
    setIsOpen(false);
    form.resetFields();
    clearLoginParams();
  };
  const submitLogin = async (value: Login) => {
    if (!(await handleLogin(value))) return;
    form.resetFields();
    setIsOpen(false);
    await queryClient.invalidateQueries();
    messageApi.success("Đăng nhập thành công.");

    const redirect = safeRedirectPath(searchParams.get("redirect"));
    if (redirect) navigate(redirect, { replace: true });
    else clearLoginParams();
  };
  const submitRegister = async (value: User) => {
    if (!(await handleRegister(value))) return;
    form.resetFields();
    setActiveTab("1");
    messageApi.success("Đăng ký thành công, vui lòng đăng nhập.");
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "1") {
      setIsProfileOpen(true);
    } else if (key === "2") {
      clearAuth();
      queryClient.clear();
      navigate("/", { replace: true });
    } else {
      navigate(key);
    }
  };

  const itemsDrop: MenuProps["items"] = [
    { label: "Profile", key: "1" },
    ...(user?.role === "ADMIN"
      ? [
          { label: "Quản lý sản phẩm", key: "/admin/products" },
          { label: "Quản lý banner", key: "/admin/banners" },
        ]
      : []),
    { label: "Đăng xuất", key: "2" },
  ];

 
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Login",
      children: (
        <Form
          className="form "
          form={form}
          onFinish={submitLogin}
          layout="vertical"
        >
          <Form.Item name="email">
            <Input placeholder="Email or phone" />
          </Form.Item>
          <Form.Item name="password">
            <Input type="password" placeholder="Password" />
          </Form.Item>
          <Button htmlType="submit" type="primary" loading={authLoading}>
            Login
          </Button>
        </Form>
      ),
    },
    {
      key: "2",
      label: "Register",
      children: (
        <Form
          className="form"
          form={form}
          onFinish={submitRegister}
          layout="vertical"
        >
          <Form.Item name="fullName">
            <Input placeholder="Name" />
          </Form.Item>
          <Form.Item name="email">
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="phone">
            <Input placeholder="Phone" />
          </Form.Item>
          <Form.Item name="passwordHash">
            <Input type="password" placeholder="Password" />
          </Form.Item>
          <Button htmlType="submit" type="primary" loading={authLoading}>
            Register
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 lg:px-12">
          <Link to="/" className="text-3xl font-bold !text-inherit">
            <h1 className="font-['Cormorant_Garamond']">LUNELLE</h1>
          </Link>
          <div className="flex items-center gap-5">
            <Input.Search
              allowClear
              placeholder="Tìm kiếm"
              className="!w-56"
              onSearch={(value) => {
                const keyword = value.trim();
                navigate(keyword ? `/products?search=${encodeURIComponent(keyword)}` : "/products");
              }}
            />

            <button
              type="button"
              aria-label="Mở giỏ hàng"
              onClick={() => {
                if (requireLogin()) navigate("/cart");
              }}
              className="relative text-2xl text-[#2d2020] transition hover:text-[#e16463]"
            >
              <ShoppingCartOutlined />
              {!!cart?.itemCount && (
                <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e16463] px-1 text-[10px] font-medium text-white">
                  {cart.itemCount}
                </span>
              )}
            </button>

            {user ? (
              <Dropdown menu={{ items: itemsDrop, onClick: handleMenuClick }}>
                <a
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={(e) => e.preventDefault()}
                >
                <img
                  src={
                    user.avatarUrl ||
                    "https://i.pinimg.com/736x/f4/c7/1c/f4c71c4050c8b01d4ec39ab4185bd23a.jpg"
                  }
                  alt="avatar"
                className="w-9 h-9 rounded-full object-cover"
              />

              <span className="text-[#E16463] font-medium">
                {user.fullName}
              </span>
              </a>
            </Dropdown>
          ) : (
            <button
              className="bg-[#E16463] rounded-lg text-white px-3 py-1.5"
              onClick={() => setIsOpen(true)}
            >
              Login
            </button>
          )}
          </div>
        </div>
        <div className="flex justify-center border-t border-[#f3d4d7]">
          <CategoryMenu />
        </div>
        <Modal open={isLoginOpen} footer={null} onCancel={handleClose}>
          {loginRequested && (
            <Alert
              className="!mb-2 !mt-6"
              type="info"
              showIcon
              message="Vui lòng đăng nhập để tiếp tục."
            />
          )}
          {authError && (
            <Alert className="!mb-2 !mt-2" type="error" showIcon message={authError} />
          )}
          <Tabs
            className="
      [&_.ant-tabs-tab]:!text-black
      [&_.ant-tabs-tab:hover]:!text-[#e16463]
      [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[#e16463]
      [&_.ant-tabs-ink-bar]:!bg-[#e16463]
    "
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items}
            centered
          />
        </Modal>
        <Modal
          title="Profile"
          open={isProfileOpen}
          footer={null}
          onCancel={() => setIsProfileOpen(false)}
        >
          {user && (
            <div className="flex flex-col items-center gap-4 py-4">
              <img
                src={
                  user.avatarUrl ||
                  "https://i.pinimg.com/736x/f4/c7/1c/f4c71c4050c8b01d4ec39ab4185bd23a.jpg"
                }
                alt="avatar"
                className="h-24 w-24 rounded-full object-cover"
              />
              <div className="w-full space-y-2 text-center">
                <h2 className="text-xl font-semibold">{user.fullName}</h2>
                <p>Email: {user.email}</p>
                <p>Phone: {user.phone || "Chưa cập nhật"}</p>
                <p>Role: {user.role || "Customer"}</p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
