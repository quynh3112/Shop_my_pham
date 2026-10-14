import { CloseOutlined, CustomerServiceOutlined, MessageOutlined, RobotOutlined, SendOutlined } from "@ant-design/icons";
import { Alert, Badge, Button, ConfigProvider, Input, Spin, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { BRAND } from "../config/theme";
import useChatSocket, { emitAck } from "../hooks/useChatSocket";
import useRequireLogin from "../hooks/useRequireLogin";
import type { AiChunk, ChatMessage, Conversation, ConversationDetail } from "../types/chat";
import { clearAuth } from "../utils/auth";
import ChatMessages from "./chatMessages";

const statusText: Record<Conversation["status"], string> = {
  AI: "Trợ lý AI đang hỗ trợ bạn",
  PENDING: "Đang chờ nhân viên tiếp nhận...",
  ASSIGNED: "Nhân viên đang hỗ trợ bạn",
  CLOSED: "Cuộc trò chuyện đã kết thúc",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { requireLogin } = useRequireLogin();
  const { socket, connected, unauthorized, loggedIn } = useChatSocket(open);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<{ runId: string; text: string } | null>(null);
  const [waitingAi, setWaitingAi] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const join = useCallback(async () => {
    if (!socket) return;
    setLoading(true);
    try {
      // Chưa đăng nhập thì chat với AI dưới dạng khách (lịch sử không lưu vào tài khoản)
      const data = await emitAck<ConversationDetail>(socket, loggedIn ? "chat:join" : "guest:join");
      setConversation(data.conversation);
      setMessages(data.messages);
      setStreaming(null);
      setWaitingAi(false);
    } catch (err) {
      messageApi.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [socket, loggedIn, messageApi]);

  // Kết nối (lại) thì vào lại phòng chat để không bỏ lỡ tin nhắn
  useEffect(() => {
    if (connected) void join();
  }, [connected, join]);

  useEffect(() => {
    if (!unauthorized) return;
    // Token hết hạn: xoá phiên, socket tự kết nối lại dưới dạng khách
    clearAuth();
    messageApi.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
  }, [unauthorized]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (m: ChatMessage) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      if (m.senderType === "AI") setWaitingAi(false);
    };
    const onChunk = (c: AiChunk) => {
      setWaitingAi(false);
      setStreaming((s) => ({ runId: c.runId, text: (s?.runId === c.runId ? s.text : "") + c.text }));
    };
    // Tin nhắn AI đầy đủ đã tới qua chat:message, bỏ phần đang stream
    const onDone = () => {
      setStreaming(null);
      setWaitingAi(false);
    };
    const onConversation = (c: Conversation) => setConversation(c);
    socket.on("chat:message", onMessage);
    socket.on("chat:ai-chunk", onChunk);
    socket.on("chat:ai-done", onDone);
    socket.on("chat:conversation", onConversation);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:ai-chunk", onChunk);
      socket.off("chat:ai-done", onDone);
      socket.off("chat:conversation", onConversation);
    };
  }, [socket]);

  const toggle = () => setOpen((v) => !v);

  const send = async () => {
    const content = input.trim();
    if (!content || !socket || !conversation) return;
    setSending(true);
    // Bật trước khi gửi: AI có thể trả lời xong trước cả khi nhận được phản hồi gửi
    if (conversation.status === "AI") setWaitingAi(true);
    try {
      if (loggedIn) {
        await emitAck(socket, "chat:send", { conversationId: conversation.id, content });
      } else {
        await emitAck(socket, "guest:send", { content });
      }
      setInput("");
    } catch (err) {
      setWaitingAi(false);
      messageApi.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const requestAdmin = async () => {
    if (!loggedIn) {
      messageApi.info("Vui lòng đăng nhập để trò chuyện với nhân viên.");
      requireLogin();
      return;
    }
    if (!socket || !conversation) return;
    try {
      setConversation(
        await emitAck<Conversation>(socket, "chat:request-admin", { conversationId: conversation.id }),
      );
      messageApi.success("Đã gửi yêu cầu, nhân viên sẽ phản hồi sớm nhất!");
    } catch (err) {
      messageApi.error((err as Error).message);
    }
  };

  const backToAi = async () => {
    if (!socket || !conversation) return;
    try {
      const updated = await emitAck<Conversation>(socket, "chat:back-to-ai", { conversationId: conversation.id });
      setConversation(updated);
      // Server tự để AI trả lời tin nhắn cuối nếu còn bỏ dở
      if (messages[messages.length - 1]?.senderType === "USER") setWaitingAi(true);
    } catch (err) {
      messageApi.error((err as Error).message);
    }
  };

  const status = conversation?.status;
  const aiBusy = status === "AI" && (waitingAi || Boolean(streaming));

  return (
    <ConfigProvider theme={{ token: { colorPrimary: BRAND } }}>
      {contextHolder}
      {open && (
        <div className="fixed bottom-24 right-4 z-[1000] flex h-[560px] max-h-[calc(100vh-120px)] w-[370px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-[#e16463] px-4 py-3 text-white">
            <div>
              <div className="font-semibold">Lunelle hỗ trợ</div>
              <div className="text-xs opacity-90">
                {!connected ? "Đang kết nối..." : status ? statusText[status] : ""}
              </div>
            </div>
            <Button type="text" icon={<CloseOutlined />} className="!text-white" onClick={() => setOpen(false)} />
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {loading && !messages.length ? (
              <div className="flex h-full items-center justify-center">
                <Spin />
              </div>
            ) : (
              <ChatMessages
                messages={messages}
                viewer="USER"
                streamingText={streaming?.text}
                typing={waitingAi}
                emptyText={
                  <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                    Xin chào! Mình là trợ lý AI của Lunelle. Bạn cần tư vấn sản phẩm theo loại da, nhu cầu hay
                    ngân sách nào? Muốn nói chuyện với nhân viên thì bấm "Gặp nhân viên" nhé.
                    {!loggedIn && (
                      <div className="mt-2 text-xs text-gray-400">
                        Bạn đang chat với tư cách khách, lịch sử chỉ lưu tạm. Đăng nhập để lưu lại cuộc trò chuyện.
                      </div>
                    )}
                  </div>
                }
              />
            )}
          </div>

          {status === "CLOSED" ? (
            <div className="border-t p-3">
              <Alert type="info" showIcon message="Cuộc trò chuyện đã kết thúc." className="!mb-2" />
              <Button type="primary" block onClick={join}>
                Bắt đầu cuộc trò chuyện mới
              </Button>
            </div>
          ) : (
            <div className="border-t p-3">
              {status === "AI" && (
                <Button
                  size="small"
                  icon={<CustomerServiceOutlined />}
                  className="!mb-2"
                  disabled={!connected}
                  onClick={requestAdmin}
                >
                  Gặp nhân viên
                </Button>
              )}
              {status === "PENDING" && (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-orange-50 px-2 py-1.5 text-xs text-orange-700">
                  <span>Đang chờ nhân viên, trợ lý AI tạm dừng.</span>
                  <Button size="small" icon={<RobotOutlined />} disabled={!connected} onClick={backToAi}>
                    Chat với AI
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPressEnter={(e) => {
                    if (e.shiftKey) return;
                    e.preventDefault();
                    if (!aiBusy) void send();
                  }}
                  placeholder={aiBusy ? "Trợ lý đang trả lời..." : "Nhập tin nhắn..."}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  maxLength={2000}
                  disabled={!connected || !conversation}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sending}
                  disabled={!input.trim() || !connected || aiBusy}
                  onClick={send}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-6 right-4 z-[1000]">
        <Badge dot={!open && status === "ASSIGNED"}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            className="!h-14 !w-14 shadow-lg"
            icon={open ? <CloseOutlined /> : <MessageOutlined className="text-xl" />}
            onClick={toggle}
            aria-label="Chat với Lunelle"
          />
        </Badge>
      </div>
    </ConfigProvider>
  );
}
