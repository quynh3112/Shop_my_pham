import { Button, Result, Spin } from "antd";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import useMyAccess from "../hooks/useMyAccess";
import type { PageAccess } from "../utils/permissions";
import { getApiErrorMessage } from "../utils/error";

interface Props {
  access: PageAccess;
  children: ReactNode;
}

/**
 * Chặn trang trong khu quản lý theo quyền (ADMIN qua hết, STAFF theo quyền được gán).
 * Chỉ là lớp giao diện — backend vẫn kiểm tra quyền ở từng API.
 */
export default function RequirePermission({ access, children }: Props) {
  const { can, loading, error } = useMyAccess();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="warning"
        title="Không kiểm tra được quyền truy cập"
        subTitle={getApiErrorMessage(error, "Vui lòng tải lại trang.")}
      />
    );
  }

  if (!can(access)) {
    return (
      <Result
        status="403"
        title="Không có quyền truy cập"
        subTitle={
          access === "admin"
            ? "Chỉ quản trị viên mới được vào trang này."
            : "Tài khoản của bạn chưa được cấp quyền cho chức năng này. Liên hệ quản trị viên nếu cần."
        }
        extra={
          <Link to="/admin">
            <Button type="primary">Về trang quản lý</Button>
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
