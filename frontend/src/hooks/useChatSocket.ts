import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api, refreshSession } from "../config/api";
import { AUTH_CHANGED_EVENT, getToken } from "../utils/auth";

type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

const GUEST_ID_KEY = "chatGuestId";

// Mã ngẫu nhiên của trình duyệt để khách chưa đăng nhập giữ được lịch sử chat với AI
const getGuestId = () => {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
};

// Gửi sự kiện và chờ server phản hồi, lỗi thì ném Error kèm message tiếng Việt
export async function emitAck<T>(socket: Socket, event: string, data?: unknown): Promise<T> {
  const res: Ack<T> = await socket.timeout(15000).emitWithAck(event, data ?? {});
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

/**
 * Kết nối socket chat, tự kết nối lại khi đăng nhập / đăng xuất.
 * Chưa đăng nhập thì kết nối dưới dạng khách (chỉ chat với AI), trừ khi requireAuth.
 */
export default function useChatSocket(enabled = true, requireAuth = false) {
  const [token, setToken] = useState(getToken);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const sync = () => setToken(getToken());
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled || (requireAuth && !token)) return;
    const s = io(`${api.defaults.baseURL}/chat`, {
      // Dạng hàm: mỗi lần kết nối lại sẽ lấy token mới nhất (token được làm mới sau 15 phút)
      auth: (cb) => {
        const current = getToken();
        cb(current ? { token: current } : { guestId: getGuestId() });
      },
    });
    setUnauthorized(false);
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    // Token hết hạn: thử làm mới phiên rồi kết nối lại, không được mới báo đăng nhập lại
    s.on("chat:unauthorized", async () => {
      if (await refreshSession()) s.connect();
      else setUnauthorized(true);
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [enabled, requireAuth, token]);

  return { socket, connected, unauthorized, loggedIn: Boolean(token) };
}
