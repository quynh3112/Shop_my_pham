import { ShoppingCartOutlined } from "@ant-design/icons";
import { Dropdown, Modal, type MenuProps } from "antd";
import Search from "antd/es/transfer/search";
import { useState } from "react";
import type { User } from "../types/user";
import useCart from "../hooks/useCart";
import CategoryMenu from "./category";
import Authencation from "./authencation";

export default function Header() {
  const { cart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLoginSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setIsOpen(false);
  };

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "1") {
      setIsProfileOpen(true);
    } else if (key === "2") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
  };

  const itemsDrop: MenuProps["items"] = [
    { label: "Profile", key: "1" },
    { label: "Đăng xuất", key: "2" },
  ];

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 lg:px-12">
          <div className="text-3xl font-bold">
            <h1 className="font-['Cormorant_Garamond']">LUNELLE</h1>
          </div>
          <div className="flex items-center gap-5">
          <Search placeholder="Tìm kiếm" />

            <button
              type="button"
              aria-label="Mở giỏ hàng"
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
        <Authencation
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
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
