import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ChatMessage } from '../chat_message/entity/chat_message.entity';
import { Product } from '../product/entity/product.entity';
import { AiChatService } from './ai-chat.service';
import { ConversationController } from './conversation.controller';
import { ConversationGateway } from './conversation.gateway';
import { ConversationService } from './conversation.service';
import { Conversation } from './entity/conversation.entity';
import { GuestChatService } from './guest-chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ChatMessage, Product]),
    AuthModule,
  ],
  providers: [
    ConversationService,
    AiChatService,
    GuestChatService,
    ConversationGateway,
  ],
  controllers: [ConversationController],
})
export class ConversationModule {}
