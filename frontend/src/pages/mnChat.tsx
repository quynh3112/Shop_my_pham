import { SendOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Empty, Input, List, Popconfirm, Segmented, Spin, Tag, message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatMessages from "../component/chatMessages";
import useChatSocket, { emitAck } from "../hooks/useChatSocket";
import type {
  AiChunk,
  ChatMessage,
  Conversation,
  ConversationDetail,
  ConversationStatus,
  ConversationSummary,
} from "../types/chat";
import { toFileUrl } from "../service/product.service";

type Filter = "OPEN" | ConversationStatus;

const filterOptions: { label: string; value: Filter }[] = [
  { label: "Cần xử lý", value: "OPEN" },
  { label: "Đang chat với AI", value: "AI" },
  { label: "Đã đóng", value: "CLOSED" },
];

const statusTag: Record<ConversationStatus, { color: string; text: string }> = {
  AI: { color: "purple", text: "AI" },
  PENDING: { color: "orange", text: "Chờ nhân viên" },
  ASSIGNED: { color: "green", text: "Đang hỗ trợ" },
  CLOSED: { color: "default", text: "Đã đóng" },
};

const matchesFilter = (status: ConversationStatus, filter: Filter) =>
  filter === "OPEN" ? status === "PENDING" || status === "ASSIGNED" : status === filter;

export default function MnChat() {
  const [messageApi, contextHolder] = message.useMessage();
  const { socket, connected } = useChatSocket(true, true);
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [list, setList] = useState<ConversationSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<{ runId: string; text: string } | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // Đọc id đang mở trong listener socket mà không phải đăng ký lại
  const activeIdRef = useRef<number | null>(null);

  const loadList = useCallback(async () => {
    if (!socket || !connected) return;
    setListLoading(true);
    try {
      setList(await emitAck<ConversationSummary[]>(socket, "admin:list", { status: filter }));
    } catch (err) {
      messageApi.error((err as Error).message);
    } finally {
      setListLoading(false);
    }
  }, [socket, connected, filter, messageApi]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openConversation = useCallback(
    async (id: number) => {
      if (!socket) return;
      activeIdRef.current = id;
      setActiveId(id);
      try {
        const data = await emitAck<ConversationDetail>(socket, "admin:open", { conversationId: id });
        setConversation(data.conversation);
        setMessages(data.messages);
        setStreaming(null);
      } catch (err) {
        messageApi.error((err as Error).message);
      }
    },
    [socket, messageApi],
  );

  // Kết nối lại thì mở lại hội thoại đang xem để vào lại phòng
  useEffect(() => {
    if (connected && activeIdRef.current) void openConversation(activeIdRef.current);
  }, [connected, openConversation]);

  useEffect(() => {
    if (!socket) return;
    const onSummary = (s: ConversationSummary) => {
      setList((prev) => {
        const rest = prev.filter((c) => c.id !== s.id);
        return matchesFilter(s.status, filter) ? [s, ...rest] : rest;
      });
      if (s.status === "PENDING" && s.lastMessage?.senderType !== "ADMIN") {
        messageApi.info(`${s.user?.fullName ?? "Khách hàng"} cần hỗ trợ`);
      }
    };
    const onMessage = (m: ChatMessage) => {
      if (m.conversationId !== activeIdRef.current) return;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    };
    const onChunk = (c: AiChunk) => {
      if (c.conversationId !== activeIdRef.current) return;
      setStreaming((s) => ({ runId: c.runId, text: (s?.runId === c.runId ? s.text : "") + c.text }));
    };
    const onDone = (d: { conversationId: number }) => {
      if (d.conversationId === activeIdRef.current) setStreaming(null);
    };
    const onConversation = (c: Conversation) => {
      if (c.id === activeIdRef.current) setConversation(c);
    };
    socket.on("admin:conversation", onSummary);
    socket.on("chat:message", onMessage);
    socket.on("chat:ai-chunk", onChunk);
    socket.on("chat:ai-done", onDone);
    socket.on("chat:conversation", onConversation);
    return () => {
      socket.off("admin:conversation", onSummary);
      socket.off("chat:message", onMessage);
      socket.off("chat:ai-chunk", onChunk);
      socket.off("chat:ai-done", onDone);
      socket.off("chat:conversation", onConversation);
    };
  }, [socket, filter, messageApi]);

  const send = async () => {
    const content = input.trim();
    if (!content || !socket || !activeId) return;
    setSending(true);
    try {
      await emitAck(socket, "admin:send", { conversationId: activeId, content });
      setInput("");
    } catch (err) {
      messageApi.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const close = async () => {
    if (!socket || !activeId) return;
    try {
      setConversation(await emitAck<Conversation>(socket, "admin:close", { conversationId: activeId }));
      messageApi.success("Đã kết thúc cuộc trò chuyện");
    } catch (err) {
      messageApi.error((err as Error).message);
    }
  };

  const active = list.find((c) => c.id === activeId);

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[480px] overflow-hidden rounded-xl border">
      {contextHolder}
      <div className="flex w-80 shrink-0 flex-col border-r">
        <div className="border-b p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Hội thoại</span>
            <Badge status={connected ? "success" : "error"} text={connected ? "Trực tuyến" : "Mất kết nối"} />
          </div>
          <Segmented block size="small" options={filterOptions} value={filter} onChange={(v) => setFilter(v as Filter)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Spin spinning={listLoading}>
            <List
              dataSource={list}
              locale={{ emptyText: <Empty description="Không có hội thoại" /> }}
              renderItem={(c) => (
                <List.Item
                  onClick={() => openConversation(c.id)}
                  className={`!cursor-pointer !px-3 hover:bg-gray-50 ${c.id === activeId ? "!bg-red-50" : ""}`}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={c.user?.avatarUrl ? toFileUrl(c.user.avatarUrl) : undefined} icon={<UserOutlined />} />}
                    title={
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{c.user?.fullName ?? `Khách #${c.id}`}</span>
                        <Tag color={statusTag[c.status].color} className="!mr-0">
                          {statusTag[c.status].text}
                        </Tag>
                      </div>
                    }
                    description={<span className="line-clamp-1 text-xs">{c.lastMessage?.content ?? "Chưa có tin nhắn"}</span>}
                  />
                </List.Item>
              )}
            />
          </Spin>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {!activeId || !conversation ? (
          <div className="flex flex-1 items-center justify-center">
            <Empty description="Chọn một hội thoại để bắt đầu" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <div className="font-semibold">{active?.user?.fullName ?? `Hội thoại #${conversation.id}`}</div>
                <div className="text-xs text-gray-500">
                  {[active?.user?.email, active?.user?.phone].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tag color={statusTag[conversation.status].color}>{statusTag[conversation.status].text}</Tag>
                {conversation.status !== "CLOSED" && (
                  <Popconfirm title="Kết thúc cuộc trò chuyện này?" onConfirm={close} okText="Kết thúc" cancelText="Huỷ">
                    <Button danger size="small">
                      Kết thúc
                    </Button>
                  </Popconfirm>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ChatMessages messages={messages} viewer="ADMIN" streamingText={streaming?.text} />
            </div>
            {conversation.status === "CLOSED" ? (
              <div className="border-t p-3 text-center text-sm text-gray-500">Cuộc trò chuyện đã kết thúc.</div>
            ) : (
              <div className="border-t p-3">
                {conversation.status === "AI" && (
                  <div className="mb-2 text-xs text-gray-500">Khách đang chat với AI. Gửi tin nhắn sẽ chuyển sang nhân viên hỗ trợ.</div>
                )}
                <div className="flex gap-2">
                  <Input.TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPressEnter={(e) => {
                      if (e.shiftKey) return;
                      e.preventDefault();
                      void send();
                    }}
                    placeholder="Nhập tin nhắn trả lời khách..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    maxLength={2000}
                    disabled={!connected}
                  />
                  <Button type="primary" icon={<SendOutlined />} loading={sending} disabled={!input.trim() || !connected} onClick={send}>
                    Gửi
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
