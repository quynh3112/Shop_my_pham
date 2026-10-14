import { RobotOutlined, UserOutlined, CustomerServiceOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { ChatMessage, MessageSender } from "../types/chat";

interface Props {
  messages: ChatMessage[];
  // Phía đang xem: khách thấy tin của mình bên phải, admin thấy tin admin bên phải
  viewer: "USER" | "ADMIN";
  streamingText?: string;
  typing?: boolean;
  emptyText?: ReactNode;
}

const senderLabel: Record<MessageSender, string> = {
  USER: "Khách hàng",
  ADMIN: "Nhân viên",
  AI: "Trợ lý AI",
};

const senderIcon: Record<MessageSender, ReactNode> = {
  USER: <UserOutlined />,
  ADMIN: <CustomerServiceOutlined />,
  AI: <RobotOutlined />,
};

// Biến "/product/12" trong câu trả lời thành link tới trang sản phẩm
function renderContent(text: string) {
  return text.split(/(\/product\/\d+)/g).map((part, i) =>
    /^\/product\/\d+$/.test(part) ? (
      <Link key={i} to={part} className="text-[#e16463] underline">
        Xem sản phẩm
      </Link>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

function Bubble({ sender, mine, children, time }: { sender: MessageSender; mine: boolean; children: ReactNode; time?: string }) {
  return (
    <div className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      {!mine && (
        <Avatar
          size="small"
          icon={senderIcon[sender]}
          className={sender === "AI" ? "!bg-purple-500" : "!bg-[#e16463]"}
        />
      )}
      <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        {!mine && <span className="mb-0.5 text-xs text-gray-400">{senderLabel[sender]}</span>}
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
            mine ? "bg-[#e16463] text-white" : "bg-gray-100 text-gray-800"
          }`}
        >
          {children}
        </div>
        {time && <span className="mt-0.5 text-[11px] text-gray-400">{time}</span>}
      </div>
    </div>
  );
}

export default function ChatMessages({ messages, viewer, streamingText, typing, emptyText }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streamingText, typing]);

  const isMine = (sender: MessageSender) =>
    viewer === "USER" ? sender === "USER" : sender === "ADMIN";

  return (
    <div className="flex flex-col gap-3">
      {!messages.length && !streamingText && emptyText}
      {messages.map((m) => (
        <Bubble key={m.id} sender={m.senderType} mine={isMine(m.senderType)} time={formatTime(m.createdAt)}>
          {renderContent(m.content)}
        </Bubble>
      ))}
      {streamingText ? (
        <Bubble sender="AI" mine={false}>{renderContent(streamingText)}</Bubble>
      ) : (
        typing && (
          <Bubble sender="AI" mine={false}>
            <span className="animate-pulse">Đang soạn câu trả lời...</span>
          </Bubble>
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}
