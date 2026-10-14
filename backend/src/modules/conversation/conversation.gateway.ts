import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { loadStaffAccess } from '../guard/staff-access';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import type { Namespace, Socket } from 'socket.io';
import { MessageSender } from '../chat_message/entity/chat_message.entity';
import { Role } from '../user/entity/user.entity';
import {
  AI_FALLBACK_REPLY,
  AiChatService,
  type AiHistoryMessage,
} from './ai-chat.service';
import {
  AdminConversationFilter,
  ChatUser,
  ConversationService,
} from './conversation.service';
import {
  Conversation,
  ConversationStatus,
} from './entity/conversation.entity';
import {
  GUEST_CONVERSATION_ID,
  GuestChatService,
} from './guest-chat.service';

const ADMIN_ROOM = 'admins';
const roomOf = (conversationId: number) => `conversation:${conversationId}`;
const guestRoomOf = (guestId: string) => `guest:${guestId}`;

type Ack<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Sự kiện server -> client:
 * - chat:message            tin nhắn mới (USER / ADMIN / AI)
 * - chat:ai-chunk           đoạn text AI đang trả lời { conversationId, runId, text }
 * - chat:ai-done            AI trả lời xong { conversationId, runId }
 * - chat:conversation       trạng thái hội thoại thay đổi
 * - admin:conversation      (chỉ admin) tóm tắt hội thoại vừa cập nhật
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: 'http://localhost:5173', credentials: true },
})
export class ConversationGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ConversationGateway.name);

  @WebSocketServer()
  private readonly server!: Namespace;

  constructor(
    private readonly jwtService: JwtService,
    private readonly conversationService: ConversationService,
    private readonly aiChatService: AiChatService,
    private readonly guestChatService: GuestChatService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      // Khách chưa đăng nhập: chỉ được chat với AI, lịch sử theo guestId của trình duyệt
      const guestId = client.handshake.auth?.guestId as unknown;
      if (!this.guestChatService.isValidGuestId(guestId)) {
        client.emit('chat:error', { message: 'Thiếu mã khách, vui lòng tải lại trang.' });
        client.disconnect(true);
        return;
      }
      client.data.guestId = guestId;
      void client.join(guestRoomOf(guestId));
      return;
    }
    try {
      // Xác thực đồng bộ để các sự kiện tới ngay sau khi kết nối đã có user
      const payload = this.jwtService.verify<{
        sub: number;
        role: Role;
        fullName?: string;
        permissions?: string[];
      }>(token);
      const user: ChatUser = {
        userId: payload.sub,
        role: payload.role,
        fullName: payload.fullName,
        // Quyền lấy từ token (access token sống 15 phút) vì bước xác thực socket phải đồng bộ
        canManageChat:
          payload.role === Role.ADMIN ||
          (payload.role === Role.STAFF && (payload.permissions ?? []).includes('chat')),
      };
      client.data.user = user;
      if (user.canManageChat) void client.join(ADMIN_ROOM);
    } catch {
      client.emit('chat:unauthorized', {
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
      });
      client.disconnect(true);
    }
  }

  // ---------- Khách hàng ----------

  @SubscribeMessage('chat:join')
  join(@ConnectedSocket() client: Socket) {
    return this.handle(async () => {
      const user = this.userOf(client);
      const conversation = await this.conversationService.getOrCreateOpen(
        user.userId,
      );
      return this.openConversation(client, conversation);
    });
  }

  @SubscribeMessage('chat:send')
  send(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: number; content: string },
  ) {
    return this.handle(async () => {
      const user = this.userOf(client);
      const content = this.conversationService.normalizeContent(body?.content);
      const conversation = await this.conversationService.findAccessible(
        Number(body?.conversationId),
        user,
      );
      if (conversation.userId !== user.userId) {
        throw new ForbiddenException('Chỉ khách hàng của cuộc trò chuyện mới gửi được tin nhắn ở đây.');
      }
      if (conversation.status === ConversationStatus.CLOSED) {
        throw new BadRequestException('Cuộc trò chuyện đã kết thúc, hãy bắt đầu cuộc trò chuyện mới.');
      }
      if (
        conversation.status === ConversationStatus.AI &&
        this.conversationService.isAiRunning(conversation)
      ) {
        throw new BadRequestException('Trợ lý đang trả lời, bạn đợi một chút nhé.');
      }

      const message = await this.conversationService.addMessage(
        conversation.id,
        MessageSender.USER,
        user.userId,
        content,
      );
      this.server.to(roomOf(conversation.id)).emit('chat:message', message);

      if (conversation.status === ConversationStatus.AI) {
        void this.runAi(conversation.id);
      } else {
        void this.notifyAdmins(conversation.id);
      }
      return message;
    });
  }

  @SubscribeMessage('chat:request-admin')
  requestAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: number },
  ) {
    return this.handle(async () => {
      const user = this.userOf(client);
      const conversation = await this.conversationService.findAccessible(
        Number(body?.conversationId),
        user,
      );
      const updated = await this.conversationService.requestAdmin(conversation);
      this.server.to(roomOf(updated.id)).emit('chat:conversation', updated);
      void this.notifyAdmins(updated.id);
      return updated;
    });
  }

  @SubscribeMessage('chat:back-to-ai')
  backToAi(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: number },
  ) {
    return this.handle(async () => {
      const user = this.userOf(client);
      const conversation = await this.conversationService.findAccessible(
        Number(body?.conversationId),
        user,
      );
      const updated = await this.conversationService.backToAi(conversation);
      this.server.to(roomOf(updated.id)).emit('chat:conversation', updated);
      void this.notifyAdmins(updated.id);
      // Tin nhắn cuối của khách chưa ai trả lời thì để AI trả lời luôn
      const [last] = await this.conversationService.getMessages(updated.id, 1);
      if (last?.senderType === MessageSender.USER) void this.runAi(updated.id);
      return updated;
    });
  }

  // ---------- Khách chưa đăng nhập ----------

  @SubscribeMessage('guest:join')
  guestJoin(@ConnectedSocket() client: Socket) {
    return this.handle(() => {
      const guestId = this.guestOf(client);
      return Promise.resolve({
        conversation: this.guestConversation(),
        messages: this.guestChatService.getMessages(guestId),
      });
    });
  }

  @SubscribeMessage('guest:send')
  guestSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { content: string },
  ) {
    return this.handle(() => {
      const guestId = this.guestOf(client);
      const content = this.conversationService.normalizeContent(body?.content);
      const message = this.guestChatService.addUserMessage(
        guestId,
        client.handshake.address,
        content,
      );
      this.server.to(guestRoomOf(guestId)).emit('chat:message', message);
      void this.runGuestAi(guestId);
      return Promise.resolve(message);
    });
  }

  // ---------- Admin ----------

  @SubscribeMessage('admin:list')
  adminList(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { status?: AdminConversationFilter },
  ) {
    return this.handle(async () => {
      await this.adminOf(client);
      const filter = body?.status ?? 'OPEN';
      if (filter !== 'OPEN' && !Object.values(ConversationStatus).includes(filter)) {
        throw new BadRequestException('Trạng thái không hợp lệ.');
      }
      return this.conversationService.listForAdmin(filter);
    });
  }

  @SubscribeMessage('admin:open')
  adminOpen(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: number },
  ) {
    return this.handle(async () => {
      const admin = await this.adminOf(client);
      const conversation = await this.conversationService.findAccessible(
        Number(body?.conversationId),
        admin,
      );
      return this.openConversation(client, conversation);
    });
  }

  @SubscribeMessage('admin:send')
  adminSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: number; content: string },
  ) {
    return this.handle(async () => {
      const admin = await this.adminOf(client);
      const content = this.conversationService.normalizeContent(body?.content);
      let conversation = await this.conversationService.findAccessible(
        Number(body?.conversationId),
        admin,
      );
      // Admin nhắn là nhận xử lý luôn, AI dừng trả lời
      if (
        conversation.status !== ConversationStatus.ASSIGNED ||
        conversation.assignedAdminId !== admin.userId
      ) {
        conversation = await this.conversationService.assign(
          conversation,
          admin.userId,
        );
        this.server
          .to(roomOf(conversation.id))
          .emit('chat:conversation', conversation);
      }
      const message = await this.conversationService.addMessage(
        conversation.id,
        MessageSender.ADMIN,
        admin.userId,
        content,
        { adminName: admin.fullName ?? null },
      );
      this.server.to(roomOf(conversation.id)).emit('chat:message', message);
      void this.notifyAdmins(conversation.id);
      return message;
    });
  }

  @SubscribeMessage('admin:close')
  adminClose(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: number },
  ) {
    return this.handle(async () => {
      const admin = await this.adminOf(client);
      const conversation = await this.conversationService.findAccessible(
        Number(body?.conversationId),
        admin,
      );
      const closed = await this.conversationService.close(conversation);
      this.server.to(roomOf(closed.id)).emit('chat:conversation', closed);
      void this.notifyAdmins(closed.id);
      return closed;
    });
  }

  // ---------- Nội bộ ----------

  private async openConversation(client: Socket, conversation: Conversation) {
    await client.join(roomOf(conversation.id));
    const messages = await this.conversationService.getMessages(conversation.id);
    return { conversation, messages };
  }

  private async runAi(conversationId: number) {
    const runId = await this.conversationService.tryStartAiRun(conversationId);
    if (!runId) return;
    const room = roomOf(conversationId);
    try {
      const history = await this.conversationService.getMessages(conversationId, 20);
      const reply = await this.streamAi(room, conversationId, runId, history);
      const message = await this.conversationService.addMessage(
        conversationId,
        MessageSender.AI,
        null,
        reply,
        { runId },
      );
      this.server.to(room).emit('chat:message', message);
    } catch (error) {
      this.logger.error(`Không lưu được câu trả lời AI (${room})`, error as Error);
    } finally {
      await this.conversationService.finishAiRun(conversationId, runId);
      this.server.to(room).emit('chat:ai-done', { conversationId, runId });
    }
  }

  private async runGuestAi(guestId: string) {
    const runId = randomUUID();
    const room = guestRoomOf(guestId);
    const conversationId = GUEST_CONVERSATION_ID;
    this.guestChatService.setAiRunning(guestId, true);
    try {
      const history = this.guestChatService.getMessages(guestId);
      const reply = await this.streamAi(room, conversationId, runId, history);
      const message = this.guestChatService.addAiMessage(guestId, reply, runId);
      this.server.to(room).emit('chat:message', message);
    } finally {
      this.guestChatService.setAiRunning(guestId, false);
      this.server.to(room).emit('chat:ai-done', { conversationId, runId });
    }
  }

  /** Stream câu trả lời AI tới phòng chat, lỗi thì trả câu mặc định */
  private async streamAi(
    room: string,
    conversationId: number,
    runId: string,
    history: AiHistoryMessage[],
  ) {
    let reply = '';
    try {
      for await (const text of this.aiChatService.streamReply(history)) {
        reply += text;
        this.server.to(room).emit('chat:ai-chunk', { conversationId, runId, text });
      }
    } catch (error) {
      this.logger.error(`Gemini lỗi (${room})`, error as Error);
      return AI_FALLBACK_REPLY;
    }
    return reply.trim() || AI_FALLBACK_REPLY;
  }

  /** Hội thoại ảo cho khách chưa đăng nhập, luôn ở chế độ AI */
  private guestConversation() {
    const now = new Date();
    return {
      id: GUEST_CONVERSATION_ID,
      userId: null,
      assignedAdminId: null,
      status: ConversationStatus.AI,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };
  }

  private guestOf(client: Socket): string {
    const guestId = client.data.guestId as string | undefined;
    if (!guestId) {
      throw new BadRequestException('Bạn đã đăng nhập, hãy dùng chat của tài khoản.');
    }
    return guestId;
  }

  private async notifyAdmins(conversationId: number) {
    try {
      const summary = await this.conversationService.getSummary(conversationId);
      if (summary) this.server.to(ADMIN_ROOM).emit('admin:conversation', summary);
    } catch (error) {
      this.logger.error('Không gửi được cập nhật cho admin', error as Error);
    }
  }

  private userOf(client: Socket): ChatUser {
    const user = client.data.user as ChatUser | undefined;
    if (!user) throw new UnauthorizedException('Bạn cần đăng nhập để dùng chức năng này.');
    return user;
  }

  /**
   * Quyền xử lý chat đọc từ DB ở mỗi thao tác (không tin token), nên admin cấp / thu hồi quyền
   * "chat" cho nhân viên hay khoá tài khoản thì có hiệu lực ngay, không cần đăng nhập lại.
   */
  private async adminOf(client: Socket): Promise<ChatUser> {
    const user = this.userOf(client);
    const access = await loadStaffAccess(this.dataSource, user.userId).catch(() => null);
    const allowed =
      access?.role === Role.ADMIN || (access?.role === Role.STAFF && access.permissions.includes('chat'));

    user.canManageChat = allowed;
    if (!allowed) {
      void client.leave(ADMIN_ROOM);
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    }
    // Vừa được cấp quyền thì vào phòng admin để nhận thông báo tin nhắn mới
    void client.join(ADMIN_ROOM);
    return user;
  }

  /** Bọc handler, trả về ack dạng { ok, data | error } cho client */
  private async handle<T>(fn: () => Promise<T>): Promise<Ack<T>> {
    try {
      return { ok: true, data: await fn() };
    } catch (error) {
      if (error instanceof HttpException) {
        return { ok: false, error: error.message };
      }
      this.logger.error('Lỗi chat socket', error);
      return { ok: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại.' };
    }
  }
}
