import {
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  HeartOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Dropdown,
  Input,
  message,
  type MenuProps,
} from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { User } from "../types/user";
import useCart from "../hooks/useCart";
import useRequireLogin from "../hooks/useRequireLogin";
import {
  AUTH_CHANGED_EVENT,
  getStoredUser,
  safeRedirectPath,
} from "../utils/auth";
import MainNav from "./mainNav";
import Authencation from "./authencation";
import ProfileModal from "./profileModal";
import { toFileUrl } from "../service/product.service";
import { logoutSession } from "../config/api";

export default function Header() {
  const { cart } = useCart();
  const { requireLogin } = useRequireLogin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    if (loginRequested && !user) messageApi.info("Vui lòng đăng nhập để tiếp tục.");
  }, [loginRequested]);

  const clearLoginParams = () => {
    if (!loginRequested) return;
    const next = new URLSearchParams(searchParams);
    next.delete("login");
    next.delete("redirect");
    setSearchParams(next, { replace: true });
  };

  const handleClose = () => {
    setIsOpen(false);
    clearLoginParams();
  };

  // Authencation đã lưu token và báo "Đăng nhập thành công"
  const handleLoginSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setIsOpen(false);
    void queryClient.invalidateQueries();

    const redirect = safeRedirectPath(searchParams.get("redirect"));
    // Admin vào thẳng trang quản lý (trừ khi đang được đưa về một trang admin cụ thể)
    if (loggedUser.role === "ADMIN" || loggedUser.role === "STAFF") {
      navigate(redirect?.startsWith("/admin") ? redirect : "/admin", { replace: true });
    } else if (redirect) navigate(redirect, { replace: true });
    else clearLoginParams();
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "1") {
      setIsProfileOpen(true);
    } else if (key === "2") {
      logoutSession();
      queryClient.clear();
      navigate("/", { replace: true });
    } else {
      navigate(key);
    }
  };

  const itemsDrop: MenuProps["items"] = [
    { label: "Thông tin cá nhân", key: "1", icon: <UserOutlined /> },
    { label: "Đơn hàng của tôi", key: "/orders", icon: <FileTextOutlined /> },
    { label: "Sản phẩm yêu thích", key: "/favorites", icon: <HeartOutlined /> },
    { label: "Lịch sử phân tích da", key: "/skin-analysis", icon: <ExperimentOutlined /> },
    // Admin + nhân viên: 1 lối vào khu quản lý; menu bên trái chỉ hiện mục được cấp quyền
    ...(user?.role === "ADMIN" || user?.role === "STAFF"
      ? [
          {
            label: "Quản lý",
            key: "/admin",
            icon: <DashboardOutlined />,
            // children: [
            //   { label: "Sản phẩm", key: "/admin/products" },
            //   { label: "Danh mục", key: "/admin/categories" },
            //   { label: "Kho hàng", key: "/admin/inventory" },
            //   { label: "Đơn hàng", key: "/admin/orders" },
            //   { label: "Banner", key: "/admin/banners" },
            //   { label: "Chat khách hàng", key: "/admin/chat" },
            //   { label: "Báo cáo", key: "/admin/reports" },
            // ],
          },
        ]
      : []),
    { type: "divider" },
    { label: "Đăng xuất", key: "2", icon: <LogoutOutlined />, danger: true },
  ];

  return (
    <>
      {contextHolder}
      {/* Không bọc chung với nav: nav cần nằm trực tiếp trong trang để sticky theo cả trang */}
      <header>
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
                    user.avatarUrl
                      ? toFileUrl(user.avatarUrl)
                      : "https://i.pinimg.com/736x/f4/c7/1c/f4c71c4050c8b01d4ec39ab4185bd23a.jpg"
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
      </header>
      <MainNav />
        <Authencation
          open={isLoginOpen}
          onClose={handleClose}
          onLoginSuccess={handleLoginSuccess}
        />
        <ProfileModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
