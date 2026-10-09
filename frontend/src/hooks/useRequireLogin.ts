import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearAuth, isLoggedIn, isUnauthorizedError, loginPath } from "../utils/auth";

/**
 * Dùng cho các thao tác cần đăng nhập (yêu thích, giỏ hàng, mua ngay, đánh giá).
 * Chưa đăng nhập -> chuyển về trang chủ và mở hộp đăng nhập, xong quay lại trang hiện tại.
 */
export default function useRequireLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectToLogin = useCallback(() => {
    navigate(loginPath(`${location.pathname}${location.search}`));
  }, [navigate, location.pathname, location.search]);

  const requireLogin = useCallback(() => {
    if (isLoggedIn()) return true;
    redirectToLogin();
    return false;
  }, [redirectToLogin]);

  // Token hết hạn / không hợp lệ -> xoá phiên và bắt đăng nhập lại
  const handleAuthError = useCallback(
    (error: unknown) => {
      if (!isUnauthorizedError(error)) return false;
      clearAuth();
      redirectToLogin();
      return true;
    },
    [redirectToLogin],
  );

  return { requireLogin, redirectToLogin, handleAuthError };
}
