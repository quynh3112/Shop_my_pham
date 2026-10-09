import { Button, Result } from "antd";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdmin, isLoggedIn, loginPath } from "../utils/auth";

interface Props {
  adminOnly?: boolean;
}

export default function RequireAuth({ adminOnly = false }: Props) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to={loginPath(`${location.pathname}${location.search}`)} replace />;
  }

  if (adminOnly && !isAdmin()) {
    return (
      <Result
        status="403"
        title="Không có quyền truy cập"
        subTitle="Chỉ admin mới được vào trang này."
        extra={
          <Link to="/">
            <Button type="primary">Về trang chủ</Button>
          </Link>
        }
      />
    );
  }

  return <Outlet />;
}
