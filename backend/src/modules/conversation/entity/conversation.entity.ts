import { ChatMessage } from 'src/modules/chat_message/entity/chat_message.entity';
import { User } from 'src/modules/user/entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
export enum ConversationStatus {
  AI = 'AI',
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  CLOSED = 'CLOSED',
  // TODO: thay bằng đúng danh sách giá trị enum gốc trong schema Prisma
}
@Entity('conversations')
@Index(['userId', 'createdAt', 'id'])
@Index(['status', 'createdAt', 'id'])
@Index(['assignedAdminId', 'status', 'updatedAt', 'id'])
@Index(['status', 'activeAiRunStartedAt'])
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'int' })
  userId!: number;

  @Column({ name: 'assignedAdminId', type: 'int', nullable: true })
  assignedAdminId!: number | null;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.AI,
  })
  status!: ConversationStatus;

  @Column({ name: 'activeAiRunId', type: 'varchar', length: 64, nullable: true })
  activeAiRunId!: string | null;

  @Column({ name: 'activeAiRunStartedAt', type: 'timestamp', nullable: true })
  activeAiRunStartedAt!: Date | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @Column({ name: 'closedAt', type: 'timestamp', nullable: true })
  closedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.customerConversations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => User, (user) => user.adminConversations, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assignedAdminId' })
  assignedAdmin!: User | null;

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages!: ChatMessage[];
}