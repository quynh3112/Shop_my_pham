import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BannerService } from './banner.service';
import { Banner } from './entity/banner.entity';

describe('BannerService', () => {
  let service: BannerService;

  const bannerRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerService,
        {
          provide: getRepositoryToken(Banner),
          useValue: bannerRepo,
        },
      ],
    }).compile();

    service = module.get<BannerService>(BannerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
