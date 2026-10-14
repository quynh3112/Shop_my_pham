import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatMessage } from '../chat_message/entity/chat_message.entity';
import { ConversationService } from './conversation.service';
import { Conversation } from './entity/conversation.entity';

describe('ConversationService', () => {
  let service: ConversationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: getRepositoryToken(Conversation), useValue: {} },
        { provide: getRepositoryToken(ChatMessage), useValue: {} },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('validates message content', () => {
    expect(service.normalizeContent('  xin chào  ')).toBe('xin chào');
    expect(() => service.normalizeContent('   ')).toThrow();
    expect(() => service.normalizeContent('a'.repeat(2001))).toThrow();
  });
});
