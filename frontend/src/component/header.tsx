import { ShoppingCartOutlined } from "@ant-design/icons";
import {
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Tabs,
  
  type MenuProps,
  
  type TabsProps,
} from "antd";
import Search from "antd/es/transfer/search";
import { useState } from "react";
import type { Login, User } from "../types/user";
import useAuth from "../hooks/useAuth";
import CategoryMenu from "./category";

export default function Header() {
  const { handleLogin, handleRegister } = useAuth();
  const [form] = Form.useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const handleClose = () => {
    setIsOpen(false);
    form.resetFields();
  };
  const submitLogin = async (value: Login) => {
    await handleLogin(value);
    form.resetFields();
    setIsOpen(false);
  };
  const submitRegister = async (value: User) => {
    await handleRegister(value);
    form.resetFields();
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
          <Button htmlType="submit" type="primary">
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
          <Button htmlType="submit" type="primary">
            Register
          </Button>
        </Form>
      ),
    },
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

            <ShoppingCartOutlined className="text-2xl" />

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
        <Modal open={isOpen} footer={null} onCancel={handleClose}>
          <Tabs
            className="
      [&_.ant-tabs-tab]:!text-black
      [&_.ant-tabs-tab:hover]:!text-[#e16463]
      [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[#e16463]
      [&_.ant-tabs-ink-bar]:!bg-[#e16463]
    "
            defaultActiveKey="1"
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
