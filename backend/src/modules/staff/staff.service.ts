import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { pickPermissions } from '../auth/permissions';
import { RefreshToken } from '../refreshtoken/entity/refresh_token.entity';
import { Role, User } from '../user/entity/user.entity';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';

const STAFF_FIELDS: (keyof User)[] = [
  'id',
  'fullName',
  'email',
  'phone',
  'avatarUrl',
  'role',
  'permissions',
  'isActive',
  'createdAt',
];

const toStaffView = (user: User) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  permissions: user.permissions ?? [],
  isActive: user.isActive,
  createdAt: user.createdAt,
});

/** Quản lý tài khoản nhân viên (role STAFF) — chỉ ADMIN dùng */
@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async list() {
    const staff = await this.userRepo.find({
      where: { role: Role.STAFF },
      select: STAFF_FIELDS,
      order: { createdAt: 'DESC' },
    });
    return staff.map(toStaffView);
  }

  async create(data: CreateStaffDto) {
    await this.assertContactAvailable(data.email, data.phone);
    const user = await this.userRepo.save(
      this.userRepo.create({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash: await bcrypt.hash(data.password, 10),
        role: Role.STAFF,
        permissions: pickPermissions(data.permissions),
        // Admin tạo trực tiếp nên không cần xác thực OTP
        isEmailVerified: true,
        isActive: true,
      }),
    );
    return toStaffView(user);
  }

  async update(id: number, data: UpdateStaffDto) {
    const staff = await this.findStaffOrFail(id);
    if (data.phone !== undefined && data.phone !== staff.phone) {
      await this.assertContactAvailable(undefined, data.phone, id);
      staff.phone = data.phone;
    }
    if (data.fullName !== undefined) staff.fullName = data.fullName;
    if (data.permissions !== undefined) staff.permissions = pickPermissions(data.permissions);

    const locking = data.isActive === false && staff.isActive;
    if (data.isActive !== undefined) staff.isActive = data.isActive;

    const saved = await this.userRepo.save(staff);
    // Khoá tài khoản -> đăng xuất khỏi mọi thiết bị (không làm mới phiên được nữa)
    if (locking) await this.revokeSessions(id);
    return toStaffView(saved);
  }

  async resetPassword(id: number, password: string) {
    await this.findStaffOrFail(id);
    await this.userRepo.update(id, { passwordHash: await bcrypt.hash(password, 10) });
    await this.revokeSessions(id);
    return { success: true };
  }

  async remove(id: number) {
    await this.findStaffOrFail(id);
    try {
      await this.userRepo.delete(id);
    } catch {
      // Còn dữ liệu liên quan (lịch sử thao tác, tin nhắn...) không xoá được
      throw new ConflictException(
        'Không thể xoá nhân viên đã có lịch sử thao tác trong hệ thống. Hãy khoá tài khoản thay vì xoá.',
      );
    }
    return { deleted: true, id };
  }

  private async findStaffOrFail(id: number) {
    const staff = await this.userRepo.findOne({ where: { id, role: Role.STAFF } });
    if (!staff) throw new NotFoundException('Không tìm thấy nhân viên.');
    return staff;
  }

  /** Email / SĐT không được trùng với bất kỳ tài khoản nào (khách hàng, nhân viên, admin) */
  private async assertContactAvailable(email?: string, phone?: string, exceptId?: number) {
    if (email) {
      const existing = await this.userRepo.findOne({ where: { email }, select: ['id'] });
      if (existing && existing.id !== exceptId) throw new ConflictException('Email đã được tài khoản khác sử dụng.');
    }
    if (phone) {
      const existing = await this.userRepo.findOne({ where: { phone }, select: ['id'] });
      if (existing && existing.id !== exceptId) throw new ConflictException('SĐT đã được tài khoản khác sử dụng.');
    }
  }

  private revokeSessions(userId: number) {
    return this.refreshTokenRepo.update({ userId, revokeAt: IsNull() }, { revokeAt: new Date() });
  }
}
