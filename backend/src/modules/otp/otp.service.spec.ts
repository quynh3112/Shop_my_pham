import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpCode, OtpPurpose } from './entity/otp.entity';
import { MailService } from '../mail/mail.service';
import { User } from '../user/entity/user.entity';

// Repo giả lưu trong bộ nhớ, đủ cho các hàm OtpService dùng
function createFakeRepo() {
  let rows: OtpCode[] = [];
  let nextId = 1;
  return {
    rows: () => rows,
    findOne: jest.fn(({ where }: { where: Partial<OtpCode> }) => {
      const found = rows
        .filter((r) => r.userId === where.userId && r.purpose === where.purpose)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      return Promise.resolve(found ?? null);
    }),
    delete: jest.fn((where: Partial<OtpCode>) => {
      rows = rows.filter(
        (r) => !(r.userId === where.userId && r.purpose === where.purpose),
      );
      return Promise.resolve();
    }),
    create: jest.fn((data: Partial<OtpCode>) => ({ ...data }) as OtpCode),
    save: jest.fn((row: OtpCode) => {
      if (!row.id) {
        row.id = nextId++;
        row.attempts ??= 0;
        row.usedAt ??= null;
        row.createdAt = new Date();
        rows.push(row);
      }
      return Promise.resolve(row);
    }),
  };
}

describe('OtpService', () => {
  let service: OtpService;
  let repo: ReturnType<typeof createFakeRepo>;
  let sentCodes: string[];
  const user = { id: 1, email: 'customer@gmail.com' } as User;

  beforeEach(async () => {
    repo = createFakeRepo();
    sentCodes = [];
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: getRepositoryToken(OtpCode), useValue: repo },
        // Không có .env trong test -> dùng giá trị mặc định
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
        {
          provide: MailService,
          useValue: {
            sendOtp: jest.fn((_to: string, otp: string) => {
              sentCodes.push(otp);
              return Promise.resolve();
            }),
          },
        },
      ],
    }).compile();

    service = module.get(OtpService);
  });

  it('gửi mã 6 số, che email và chỉ lưu hash', async () => {
    const res = await service.send(user, OtpPurpose.LOGIN);

    expect(sentCodes).toHaveLength(1);
    expect(sentCodes[0]).toMatch(/^\d{6}$/);
    expect(res).toEqual({
      email: 'cu******@gmail.com',
      expiresIn: 300,
      resendAfter: 60,
    });
    expect(repo.rows()[0].codeHash).not.toBe(sentCodes[0]);
  });

  it('không gửi mã mới khi chưa hết thời gian chờ', async () => {
    await service.send(user, OtpPurpose.LOGIN);
    const res = await service.send(user, OtpPurpose.LOGIN);

    expect(sentCodes).toHaveLength(1);
    expect(res.resendAfter).toBeGreaterThan(0);
    expect(res.resendAfter).toBeLessThanOrEqual(60);
  });

  it('hết thời gian chờ thì gửi mã mới và bỏ mã cũ', async () => {
    await service.send(user, OtpPurpose.LOGIN);
    repo.rows()[0].createdAt = new Date(Date.now() - 61_000);
    await service.send(user, OtpPurpose.LOGIN);

    expect(sentCodes).toHaveLength(2);
    expect(repo.rows()).toHaveLength(1);
    await expect(
      service.verify(user.id, OtpPurpose.LOGIN, sentCodes[1]),
    ).resolves.toBeUndefined();
  });

  it('mã đúng chỉ dùng được 1 lần', async () => {
    await service.send(user, OtpPurpose.LOGIN);
    await service.verify(user.id, OtpPurpose.LOGIN, sentCodes[0]);

    await expect(
      service.verify(user.id, OtpPurpose.LOGIN, sentCodes[0]),
    ).rejects.toThrow('hết hạn hoặc không tồn tại');
  });

  it('consume = false thì mã vẫn dùng được ở bước sau', async () => {
    await service.send(user, OtpPurpose.RESET_PASSWORD);
    await service.verify(
      user.id,
      OtpPurpose.RESET_PASSWORD,
      sentCodes[0],
      false,
    );

    await expect(
      service.verify(user.id, OtpPurpose.RESET_PASSWORD, sentCodes[0]),
    ).resolves.toBeUndefined();
  });

  it('mã của mục đích này không dùng được cho mục đích khác', async () => {
    await service.send(user, OtpPurpose.LOGIN);

    await expect(
      service.verify(user.id, OtpPurpose.RESET_PASSWORD, sentCodes[0]),
    ).rejects.toThrow(BadRequestException);
  });

  it('sai 5 lần thì khóa mã, kể cả nhập đúng sau đó', async () => {
    await service.send(user, OtpPurpose.LOGIN);
    const wrong = sentCodes[0] === '000000' ? '111111' : '000000';

    for (let left = 4; left >= 1; left--) {
      await expect(
        service.verify(user.id, OtpPurpose.LOGIN, wrong),
      ).rejects.toThrow(`còn ${left} lần thử`);
    }
    await expect(
      service.verify(user.id, OtpPurpose.LOGIN, wrong),
    ).rejects.toThrow('sai quá nhiều lần');
    await expect(
      service.verify(user.id, OtpPurpose.LOGIN, sentCodes[0]),
    ).rejects.toThrow('sai quá nhiều lần');
  });

  it('mã hết hạn thì bị từ chối', async () => {
    await service.send(user, OtpPurpose.LOGIN);
    repo.rows()[0].expireAt = new Date(Date.now() - 1000);

    await expect(
      service.verify(user.id, OtpPurpose.LOGIN, sentCodes[0]),
    ).rejects.toThrow('hết hạn');
  });
});
