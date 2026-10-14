/** Link nội bộ của web (bắt đầu bằng "/"), mở bằng router thay vì tải lại trang */
export const isInternalLink = (url?: string | null): url is string =>
  Boolean(url && url.startsWith("/") && !url.startsWith("//"));

/** Link ngoài hợp lệ (http/https), mở ở tab mới */
export const isExternalLink = (url?: string | null): url is string =>
  Boolean(url && /^https?:\/\//i.test(url));
