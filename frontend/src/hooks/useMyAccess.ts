import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getMyProfile } from "../service/user.service";
import { getStoredUser, isLoggedIn, notifyAuthChanged } from "../utils/auth";
import { canAccess, type PageAccess } from "../utils/permissions";

export const myAccessKey = ["me", "access"] as const;

/**
 * Vai trò + quyền MỚI NHẤT từ server (admin có thể vừa đổi quyền / khoá tài khoản).
 * Đồng bộ lại user lưu trong trình duyệt để Header, menu hiển thị đúng.
 */
export default function useMyAccess(enabled = true) {
  const query = useQuery({
    queryKey: myAccessKey,
    queryFn: getMyProfile,
    enabled: enabled && isLoggedIn(),
    // Admin có thể đổi quyền bất cứ lúc nào: hỏi lại khi mở trang và định kỳ mỗi phút
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
  const profile = query.data;

  useEffect(() => {
    if (!profile) return;
    const stored = getStoredUser();
    const changed =
      stored?.role !== profile.role ||
      JSON.stringify(stored?.permissions ?? []) !== JSON.stringify(profile.permissions ?? []);
    if (changed) {
      localStorage.setItem("user", JSON.stringify({ ...stored, role: profile.role, permissions: profile.permissions }));
      notifyAuthChanged();
    }
  }, [profile]);

  // Trong lúc chờ server thì tạm dùng dữ liệu đã lưu
  const access = profile ?? getStoredUser();

  return {
    role: access?.role,
    permissions: access?.permissions ?? [],
    // Tài khoản bị khoá thì không vào được trang quản lý nào
    can: (page: PageAccess) => profile?.isActive !== false && canAccess(access, page),
    isActive: profile?.isActive !== false,
    loading: query.isLoading,
    error: query.error,
  };
}
