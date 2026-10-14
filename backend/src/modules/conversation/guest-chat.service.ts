import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ChatMessage,
  MessageSender,
} from '../chat_message/entity/chat_message.entity';

/** Tin nhắn của khách chưa đăng nhập, không lưu DB nên conversationId luôn là 0 */
export type GuestMessage = Pick<
  ChatMessage,
  'id' | 'conversationId' | 'senderType' | 'senderUserId' | 'content' | 'metadata'
> & { createdAt: Date };

interface GuestSession {
  messages: GuestMessage[];
  seq: number;
  aiRunning: boolean;
  lastActiveAt: number;
}

export const GUEST_CONVERSATION_ID = 0;
const SESSION_TTL_MS = 2 * 60 * 60_000;
const MAX_MESSAGES = 30;
// Giới hạn để khách vãng lai không dùng quá nhiều lượt gọi Gemini
const RATE_WINDOW_MS = 10 * 60_000;
const MAX_PER_GUEST = 15;
const MAX_PER_IP = 40;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class GuestChatService {
  private readonly sessions = new Map<string, GuestSession>();
  private readonly sendLog = new Map<string, number[]>();

  isValidGuestId(guestId: unknown): guestId is string {
    return typeof guestId === 'string' && UUID_RE.test(guestId);
  }

  getMessages(guestId: string) {
    return this.session(guestId).messages;
  }

  /** Thêm tin nhắn của khách, kiểm tra trùng lượt AI và giới hạn tần suất */
  addUserMessage(guestId: string, ip: string, content: string) {
    const session = this.session(guestId);
    if (session.aiRunning) {
      throw new BadRequestException('Trợ lý đang trả lời, bạn đợi một chút nhé.');
    }
    this.checkRate(`guest:${guestId}`, MAX_PER_GUEST);
    this.checkRate(`ip:${ip}`, MAX_PER_IP);
    return this.push(session, MessageSender.USER, content);
  }

  addAiMessage(guestId: string, content: string, runId: string) {
    return this.push(this.session(guestId), MessageSender.AI, content, { runId });
  }

  setAiRunning(guestId: string, running: boolean) {
    this.session(guestId).aiRunning = running;
  }

  private push(
    session: GuestSession,
    senderType: MessageSender,
    content: string,
    metadata: Record<string, any> | null = null,
  ) {
    session.seq += 1;
    const message: GuestMessage = {
      // id âm để không trùng id tin nhắn thật trong DB
      id: -session.seq,
      conversationId: GUEST_CONVERSATION_ID,
      senderType,
      senderUserId: null,
      content,
      metadata,
      createdAt: new Date(),
    };
    session.messages.push(message);
    if (session.messages.length > MAX_MESSAGES) {
      session.messages.splice(0, session.messages.length - MAX_MESSAGES);
    }
    return message;
  }

  private session(guestId: string) {
    this.cleanup();
    let session = this.sessions.get(guestId);
    if (!session) {
      session = { messages: [], seq: 0, aiRunning: false, lastActiveAt: Date.now() };
      this.sessions.set(guestId, session);
    }
    session.lastActiveAt = Date.now();
    return session;
  }

  private checkRate(key: string, limit: number) {
    const now = Date.now();
    const recent = (this.sendLog.get(key) ?? []).filter((t) => t > now - RATE_WINDOW_MS);
    if (recent.length >= limit) {
      throw new HttpException(
        'Bạn đã nhắn quá nhiều, vui lòng thử lại sau ít phút hoặc đăng nhập để tiếp tục.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.sendLog.set(key, recent);
  }

  private cleanup() {
    const now = Date.now();
    for (const [id, s] of this.sessions) {
      if (s.lastActiveAt < now - SESSION_TTL_MS) this.sessions.delete(id);
    }
    for (const [key, times] of this.sendLog) {
      if (!times.some((t) => t > now - RATE_WINDOW_MS)) this.sendLog.delete(key);
    }
  }
}
