import { Button, Empty, Layout, Menu, Spin, Tag, theme } from 'antd';
import React, { useState } from 'react';
import {
  InboxOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  HomeOutlined,
  ApartmentOutlined,
  MessageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useMyAccess from '../hooks/useMyAccess';
import { getStoredUser } from '../utils/auth';
import { ADMIN_PAGES, ROLE_LABEL } from '../utils/permissions';
const { Header, Sider, Content } = Layout;

// Độ rộng mặc định của antd Sider (mở / thu gọn)
const SIDER_WIDTH = 200;
const SIDER_COLLAPSED_WIDTH = 80;
const HEADER_HEIGHT = 64;

const PAGE_ICON: Record<string, React.ReactNode> = {
  '/admin/products': <AppstoreOutlined />,
  '/admin/categories': <ApartmentOutlined />,
  '/admin/inventory': <InboxOutlined />,
  '/admin/orders': <ShoppingOutlined />,
  '/admin/customers': <UserOutlined />,
  '/admin/banners': <PictureOutlined />,
  '/admin/chat': <MessageOutlined />,
  '/admin/reports': <BarChartOutlined />,
  '/admin/staff': <TeamOutlined />,
};

/** /admin -> chuyển tới trang đầu tiên mà tài khoản có quyền */
export function AdminHome() {
  const { can, loading } = useMyAccess();
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }
  const first = ADMIN_PAGES.find((page) => can(page.access));
  if (first) return <Navigate to={first.path} replace />;
  return (
    <Empty
      className="py-20"
      description="Tài khoản của bạn chưa được cấp quyền quản lý nào. Vui lòng liên hệ quản trị viên."
    />
  );
}

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { can, role } = useMyAccess();
    const user = getStoredUser();
    const {
        token: { colorBgContainer },
      } = theme.useToken();
    const siderWidth = collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH;

    // Nhân viên chỉ thấy các mục được cấp quyền
    const menuItems = [
      ...ADMIN_PAGES.filter((page) => can(page.access)).map((page) => ({
        key: page.path,
        icon: PAGE_ICON[page.path],
        label: page.label,
      })),
      { key: '/', icon: <HomeOutlined />, label: 'Về cửa hàng' },
    ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
        {/* Sidebar cố định, cao bằng màn hình; menu dài thì cuộn bên trong sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={SIDER_WIDTH}
          collapsedWidth={SIDER_COLLAPSED_WIDTH}
          style={{ position: 'fixed', insetBlock: 0, left: 0, height: '100vh', overflowY: 'auto', zIndex: 100 }}
        >
        <Link
          to="/admin"
          className="flex items-center justify-center font-['Cormorant_Garamond'] text-2xl font-semibold tracking-wider !text-white"
          style={{ height: HEADER_HEIGHT }}
        >
          {collapsed ? 'L' : 'LUNELLE'}
        </Link>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
        />
        </Sider>
        {/* Chừa chỗ cho sidebar cố định, đổi theo khi thu gọn / mở rộng */}
        <Layout style={{ marginLeft: siderWidth, transition: 'margin-left 0.2s' }}>
            <Header
              style={{
                padding: '0 24px 0 0',
                background: colorBgContainer,
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
                <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
                style={{
                    fontSize: '16px',
                    width: HEADER_HEIGHT,
                    height: HEADER_HEIGHT,
                }}
                />
                {user && (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{user.fullName}</span>
                    <Tag color={role === 'ADMIN' ? 'magenta' : 'blue'} className="!m-0">
                      {ROLE_LABEL[role ?? ''] ?? role}
                    </Tag>
                  </span>
                )}
            </Header>
            <Content
                style={{
                    margin: '24px 16px',
                    padding: 24,
                    minHeight: 280,
                    background: colorBgContainer,
                }}
            >
                {children ?? <Outlet />}
            </Content>
        </Layout>
    </Layout>
  )

}
