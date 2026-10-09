import { isAxiosError } from "axios";

export interface StoredUser {
  id?: number;
  email?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
}

// Phát ra khi đăng nhập / đăng xuất để các component cập nhật lại
export const AUTH_CHANGED_EVENT = "auth-changed";

export const getToken = () => localStorage.getItem("token");

export const isLoggedIn = () => Boolean(getToken());

export const getStoredUser = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
};

export const isAdmin = () => getStoredUser()?.role === "ADMIN";

export const notifyAuthChanged = () => window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  notifyAuthChanged();
};

export const isUnauthorizedError = (error: unknown) =>
  isAxiosError(error) && error.response?.status === 401;

// Chỉ cho phép quay lại đường dẫn nội bộ, tránh chuyển hướng ra trang ngoài
export const safeRedirectPath = (path: string | null) =>
  path && path.startsWith("/") && !path.startsWith("//") ? path : null;

export const loginPath = (redirect?: string) =>
  redirect && redirect !== "/"
    ? `/?login=1&redirect=${encodeURIComponent(redirect)}`
    : "/?login=1";
