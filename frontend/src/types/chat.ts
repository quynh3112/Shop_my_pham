export type ConversationStatus = "AI" | "PENDING" | "ASSIGNED" | "CLOSED";
export type MessageSender = "USER" | "ADMIN" | "AI";

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderType: MessageSender;
  senderUserId: number | null;
  content: string;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface Conversation {
  id: number;
  userId: number;
  assignedAdminId: number | null;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: ChatMessage[];
}

export interface ConversationSummary {
  id: number;
  status: ConversationStatus;
  assignedAdminId: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
  } | null;
  lastMessage: ChatMessage | null;
}

export interface AiChunk {
  conversationId: number;
  runId: string;
  text: string;
}
