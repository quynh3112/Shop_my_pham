import { Button, Layout, Menu, theme } from 'antd';
import React, { useState } from 'react';
import {
  AppstoreOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
const { Header, Sider, Content } = Layout;
export default function AdminLayout({ children }: { children?: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer },
      } = theme.useToken();
  return (
    <Layout>
        <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            items={[
                {
                key: '/admin/products',
                icon: <AppstoreOutlined />,
                label: 'Sản phẩm',
              },
              {
                key: '/admin/banners',
                icon: <PictureOutlined />,
                label: 'Banner',
              },
                {

                key: '/',
              icon: <HomeOutlined />,
              label: 'Về cửa hàng',
                }
            ]}/>

        </Sider>
        <Layout>
            <Header style={{ padding: 0, background: colorBgContainer }}>
                <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    fontSize: '16px',
                    width: 64,
                    height: 64,
                }}
                />
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