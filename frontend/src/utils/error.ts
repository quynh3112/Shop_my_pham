import { isAxiosError } from "axios";

/** Lấy thông báo lỗi dễ hiểu từ lỗi gọi API (axios) */
export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return "Vui lòng đăng nhập lại.";
    if (error.response?.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    const serverMessage = error.response?.data?.message;
    // ValidationPipe của backend trả về mảng thông báo
    if (Array.isArray(serverMessage) && serverMessage.length) return String(serverMessage[0]);
    if (typeof serverMessage === "string") return serverMessage;
  }
  return fallback;
};
