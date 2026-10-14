import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, IsNull, LessThan, Not, Repository } from 'typeorm';
import {
  ChatMessage,
  MessageSender,
} from '../chat_message/entity/chat_message.entity';
import { Role } from '../user/entity/user.entity';
import {
  Conversation,
  ConversationStatus,
} from './entity/conversation.entity';

export interface ChatUser {
  userId: number;
  role: Role;
  fullName?: string;
  /** ADMIN, hoặc STAFF được gán quyền "chat" */
  canManageChat?: boolean;
}

export type AdminConversationFilter = ConversationStatus | 'OPEN';

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_LIMIT = 100;
// Lượt trả lời AI quá thời gian này coi như bị treo (vd server khởi động lại giữa chừng)
const AI_RUN_TIMEOUT_MS = 60_000;

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
  ) {}

  normalizeContent(content: unknown): string {
    const text = typeof content === 'string' ? content.trim() : '';
    if (!text) throw new BadRequestException('Tin nhắn không được để trống.');
    if (text.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự.`,
      );
    }
    return text;
  }

  /** Hội thoại đang mở của khách, chưa có thì tạo mới ở chế độ AI */
  async getOrCreateOpen(userId: number): Promise<Conversation> {
    const existing = await this.conversationRepo.findOne({
      where: { userId, status: Not(ConversationStatus.CLOSED) },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    if (existing) return existing;
    return this.conversationRepo.save(
      this.conversationRepo.create({ userId, status: ConversationStatus.AI }),
    );
  }

  async findAccessible(conversationId: number, user: ChatUser) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    }
    if (!user.canManageChat && conversation.userId !== user.userId) {
      throw new ForbiddenException('Bạn không có quyền xem cuộc trò chuyện này.');
    }
    return conversation;
  }

  /** Tin nhắn mới nhất, sắp xếp cũ -> mới */
  async getMessages(conversationId: number, limit = HISTORY_LIMIT) {
    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: limit,
    });
    return messages.reverse();
  }

  async addMessage(
    conversationId: number,
    senderType: MessageSender,
    senderUserId: number | null,
    content: string,
    metadata: Record<string, any> | null = null,
  ) {
    const message = await this.messageRepo.save(
      this.messageRepo.create({
        conversationId,
        senderType,
        senderUserId,
        content,
        metadata,
      }),
    );
    // Đẩy hội thoại lên đầu danh sách của admin
    await this.conversationRepo.update(conversationId, { updatedAt: new Date() });
    return message;
  }

  async requestAdmin(conversation: Conversation) {
    if (conversation.status === ConversationStatus.CLOSED) {
      throw new BadRequestException('Cuộc trò chuyện đã kết thúc.');
    }
    if (conversation.status !== ConversationStatus.AI) return conversation;
    conversation.status = ConversationStatus.PENDING;
    return this.conversationRepo.save(conversation);
  }

  /** Khách huỷ yêu cầu gặp nhân viên khi chưa có ai nhận, quay lại chat với AI */
  async backToAi(conversation: Conversation) {
    if (conversation.status === ConversationStatus.AI) return conversation;
    if (conversation.status !== ConversationStatus.PENDING) {
      throw new BadRequestException(
        'Nhân viên đã tiếp nhận cuộc trò chuyện, không thể chuyển lại cho AI.',
      );
    }
    conversation.status = ConversationStatus.AI;
    return this.conversationRepo.save(conversation);
  }

  async assign(conversation: Conversation, adminId: number) {
    if (conversation.status === ConversationStatus.CLOSED) {
      throw new BadRequestException('Cuộc trò chuyện đã kết thúc.');
    }
    conversation.status = ConversationStatus.ASSIGNED;
    conversation.assignedAdminId = adminId;
    return this.conversationRepo.save(conversation);
  }

  async close(conversation: Conversation) {
    if (conversation.status === ConversationStatus.CLOSED) return conversation;
    conversation.status = ConversationStatus.CLOSED;
    conversation.closedAt = new Date();
    conversation.activeAiRunId = null;
    conversation.activeAiRunStartedAt = null;
    return this.conversationRepo.save(conversation);
  }

  /** Giữ khoá trả lời AI cho hội thoại, trả về runId nếu giữ được */
  async tryStartAiRun(conversationId: number): Promise<string | null> {
    const runId = randomUUID();
    const staleBefore = new Date(Date.now() - AI_RUN_TIMEOUT_MS);
    const result = await this.conversationRepo.update(
      [
        {
          id: conversationId,
          status: ConversationStatus.AI,
          activeAiRunId: IsNull(),
        },
        {
          id: conversationId,
          status: ConversationStatus.AI,
          activeAiRunStartedAt: LessThan(staleBefore),
        },
      ],
      { activeAiRunId: runId, activeAiRunStartedAt: new Date() },
    );
    return result.affected ? runId : null;
  }

  async finishAiRun(conversationId: number, runId: string) {
    await this.conversationRepo.update(
      { id: conversationId, activeAiRunId: runId },
      { activeAiRunId: null, activeAiRunStartedAt: null },
    );
  }

  isAiRunning(conversation: Conversation) {
    return Boolean(
      conversation.activeAiRunId &&
        conversation.activeAiRunStartedAt &&
        conversation.activeAiRunStartedAt.getTime() >
          Date.now() - AI_RUN_TIMEOUT_MS,
    );
  }

  async listForAdmin(filter: AdminConversationFilter = 'OPEN', limit = 50) {
    const statuses =
      filter === 'OPEN'
        ? [ConversationStatus.PENDING, ConversationStatus.ASSIGNED]
        : [filter];
    const conversations = await this.conversationRepo.find({
      where: { status: In(statuses) },
      relations: { user: true },
      order: { updatedAt: 'DESC', id: 'DESC' },
      take: limit,
    });
    const lastMessages = await this.getLastMessages(
      conversations.map((c) => c.id),
    );
    return conversations.map((c) => this.toSummary(c, lastMessages.get(c.id)));
  }

  async getSummary(conversationId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: { user: true },
    });
    if (!conversation) return null;
    const lastMessages = await this.getLastMessages([conversationId]);
    return this.toSummary(conversation, lastMessages.get(conversationId));
  }

  private async getLastMessages(conversationIds: number[]) {
    const result = new Map<number, ChatMessage>();
    if (!conversationIds.length) return result;
    const rows: ChatMessage[] = await this.messageRepo
      .createQueryBuilder('m')
      .distinctOn(['m.conversationId'])
      .where('m.conversationId IN (:...ids)', { ids: conversationIds })
      .orderBy('m.conversationId')
      .addOrderBy('m.createdAt', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .getMany();
    rows.forEach((m) => result.set(m.conversationId, m));
    return result;
  }

  private toSummary(conversation: Conversation, lastMessage?: ChatMessage) {
    return {
      id: conversation.id,
      status: conversation.status,
      assignedAdminId: conversation.assignedAdminId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      user: conversation.user
        ? {
            id: conversation.user.id,
            fullName: conversation.user.fullName,
            email: conversation.user.email,
            phone: conversation.user.phone,
            avatarUrl: conversation.user.avatarUrl,
          }
        : null,
      lastMessage: lastMessage ?? null,
    };
  }
}
