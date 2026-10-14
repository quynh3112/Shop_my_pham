import { Button, Result, Spin } from "antd";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import useMyAccess from "../hooks/useMyAccess";
import { isLoggedIn, loginPath } from "../utils/auth";
import { isStaffRole } from "../utils/permissions";

interface Props {
  /** Khu quản lý: ADMIN hoặc nhân viên (từng trang còn kiểm tra quyền riêng bằng RequirePermission) */
  staffArea?: boolean;
}

export default function RequireAuth({ staffArea = false }: Props) {
  const location = useLocation();
  // Khu quản lý: hỏi vai trò mới nhất từ server, không chỉ tin user lưu trong trình duyệt
  // (tài khoản có thể vừa được admin đổi vai trò / khoá)
  const { role, isActive, loading } = useMyAccess(staffArea);

  if (!isLoggedIn()) {
    return <Navigate to={loginPath(`${location.pathname}${location.search}`)} replace />;
  }

  if (staffArea && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (staffArea && (!isStaffRole(role) || !isActive)) {
    return (
      <Result
        status="403"
        title="Không có quyền truy cập"
        subTitle={
          isActive
            ? "Chỉ quản trị viên và nhân viên mới được vào trang này."
            : "Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên."
        }
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
