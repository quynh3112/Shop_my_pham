import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessageService } from './chat_message.service';
import { ChatMessageController } from './chat_message.controller';
import { ChatMessage } from './entity/chat_message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage])],
  providers: [ChatMessageService],
  controllers: [ChatMessageController],
})
export class ChatMessageModule {}
