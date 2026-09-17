import { Module } from '@nestjs/common';
import { ChatMessageService } from './chat_message.service';
import { ChatMessageController } from './chat_message.controller';

@Module({
  providers: [ChatMessageService],
  controllers: [ChatMessageController]
})
export class ChatMessageModule {}
