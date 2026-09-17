import { ShoppingCartOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Tabs,
  
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
      <div className="flex flex-row justify-between ml-[50px] ">
        <div className="text-3xl font-bold ">
          <h1 className="font-['Cormorant_Garamond']">LUNELLE</h1>
        </div>
        <CategoryMenu/>
        <div className="mt-2 flex items-center gap-5 mr-[50px]">
          <Search placeholder="Tìm kiếm" />

          <ShoppingCartOutlined className="text-2xl" />

          {user ? (
            <div className="flex items-center gap-2 cursor-pointer">
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
            </div>
          ) : (
            <button
              className="bg-[#E16463] rounded-lg text-white px-3 py-1.5"
              onClick={() => setIsOpen(true)}
            >
              Login
            </button>
          )}
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
      </div>
    </>
  );
}
