import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Address } from '../../address/entity/address.entity';
import { Cart } from '../../cart/entity/cart.entity';
import { Order } from '../../order/entity/order.entity';
import { RefreshToken } from 'src/modules/refreshtoken/entity/refresh_token.entity';
import { OrderStatusHistory } from 'src/modules/order_status_history/entity/order_status_history';
import { InventoryMovement } from 'src/modules/inventory_movement/entity/inventory_movement.entity';
import { ChatMessage } from 'src/modules/chat_message/entity/chat_message.entity';
import { Conversation } from 'src/modules/conversation/entity/conversation.entity';


export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 191 })
  email!: string;

  @Column({ length: 255 })
  passwordHash!: string;

  @Column({ length: 120 })
  fullName!: string;

  @Column({ length: 10, nullable: true, unique:true })
  phone!: string ;

  @Column({ length: 500, nullable: true })
  avatarUrl!: string

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // 1 User - N Address
  @OneToMany(() => Address, (address) => address.user)
  addresses!: Address[];

  // 1 User - 1 Cart
  @OneToOne(() => Cart, (cart) => cart.user)
  cart!: Cart | null;

  // 1 User - N Order
  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  // 1 User - N RefreshToken
  @OneToMany(
    () => RefreshToken,
    (refreshToken) => refreshToken.user,
  )
  refreshTokens!: RefreshToken[];

  // 1 User - N OrderStatusHistory
  @OneToMany(
    () => OrderStatusHistory,
    (history) => history.actor,
  )
  orderStatusHistory!: OrderStatusHistory[];

  // 1 User - N InventoryMovement
  @OneToMany(
    () => InventoryMovement,
    (movement) => movement.actor,
  )
  inventoryMovements!: InventoryMovement[];

  // @OneToMany(
  //   () => Conversation,
  //   (conversation) => conversation.customer,
  // )
  // customerConversations!: Conversation[];

  // @OneToMany(
  //   () => Conversation,
  //   (conversation) => conversation.admin,
  // )
  // assignedConversations!: Conversation[];

  // @OneToMany(
  //   () => ChatMessage,
  //   (message) => message.sender,
  // )
  // chatMessages!: ChatMessage[];
  @OneToMany(() => Conversation, (conversation) => conversation.user)
  customerConversations!: Conversation[];

  // Các conversation mà user này (admin) được gán xử lý (ConversationAdmin)
  @OneToMany(() => Conversation, (conversation) => conversation.assignedAdmin)
  adminConversations!: Conversation[];

  // Các tin nhắn mà user này đã gửi (ChatMessageSender)
  @OneToMany(() => ChatMessage, (message) => message.sender)
  sentChatMessages!: ChatMessage[];
}