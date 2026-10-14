import axios, { type AxiosRequestConfig } from "axios";
import { clearAuth, getRefreshToken, getStoredUser, saveTokens } from "../utils/auth";

const baseURL = 'http://localhost:3000'

export const api=axios.create({
    baseURL
})

let refreshing: Promise<boolean> | null = null;

/**
 * Đổi refresh token lấy access token mới (access token chỉ sống 15 phút).
 * Nhiều request cùng hết hạn thì chỉ gọi refresh một lần, vì refresh token cũ bị thu hồi sau mỗi lần đổi.
 */
export const refreshSession = (): Promise<boolean> => {
    if (refreshing) return refreshing;
    const refreshToken = getRefreshToken();
    const userId = getStoredUser()?.id;
    if (!refreshToken || !userId) return Promise.resolve(false);

    refreshing = axios
        .post(`${baseURL}/auth/refresh`, { userId, refreshToken })
        .then((res) => {
            saveTokens(res.data.accessToken, res.data.refreshToken);
            return true;
        })
        .catch(() => false)
        .finally(() => {
            refreshing = null;
        });
    return refreshing;
};

// Gặp 401 thì làm mới token rồi gửi lại request, hết cách mới đăng xuất
api.interceptors.response.use(undefined, async (error) => {
    const config = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const hadToken = Boolean(config?.headers?.Authorization);
    if (error.response?.status !== 401 || !config || config._retried || !hadToken) {
        throw error;
    }
    config._retried = true;
    if (await refreshSession()) {
        config.headers = { ...config.headers, Authorization: `Bearer ${localStorage.getItem("token")}` };
        return api.request(config);
    }
    clearAuth();
    throw error;
});

// Đăng xuất: xoá phiên ở trình duyệt ngay, rồi báo server thu hồi refresh token (lỗi cũng bỏ qua)
export const logoutSession = () => {
    const refreshToken = getRefreshToken();
    const userId = getStoredUser()?.id;
    clearAuth();
    if (refreshToken && userId) {
        void axios.post(`${baseURL}/auth/logout`, { userId, refreshToken }).catch(() => undefined);
    }
};
