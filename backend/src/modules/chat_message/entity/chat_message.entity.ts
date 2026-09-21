export enum MessageSender {
  USER = 'USER',
  ADMIN = 'ADMIN',
  AI = 'AI',
  // TODO: thay bằng đúng danh sách giá trị enum MessageSender gốc trong schema Prisma
}
import { Conversation } from 'src/modules/conversation/entity/conversation.entity';
import { User } from 'src/modules/user/entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';


@Entity('chat_messages')
@Index(['conversationId', 'createdAt', 'id'])
@Index(['senderUserId'])
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'conversationId', type: 'int' })
  conversationId!: number;

  @Column({
    name: 'senderType',
    type: 'enum',
    enum: MessageSender,
  })
  senderType!: MessageSender;

  @Column({ name: 'senderUserId', type: 'int', nullable: true })
  senderUserId!: number | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation;

  @ManyToOne(() => User, (user) => user.sentChatMessages, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'senderUserId' })
  sender!: User | null;
}