import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Order } from '../order/entity/order.entity';
import { RefreshToken } from '../refreshtoken/entity/refresh_token.entity';
import type { RegisterDto } from '../auth/dto/auth.dto';
import type { ChangePasswordDto, UpdateProfileDto } from './dto/user.dto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const avatarDirectory = join(process.cwd(), 'uploads', 'avatars');
const avatarExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function toPublicProfile(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    permissions: user.permissions ?? [],
    isActive: user.isActive,
  };
}
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}
  /**
   * Đăng ký: tạo tài khoản CHƯA xác thực email (chưa đăng nhập được).
   * Bản đăng ký cũ chưa xác thực trùng email thì ghi đè, trùng SĐT thì xóa,
   * để không ai giữ chỗ được email/SĐT của người khác mà không có OTP.
   */
  async createUnverified(data: RegisterDto) {
    const exisEmail = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (exisEmail?.isEmailVerified) {
      throw new ConflictException('Email đã tồn tại!');
    }
    const exisPhone = await this.userRepo.findOne({
      where: { phone: data.phone },
    });
    if (exisPhone && exisPhone.id !== exisEmail?.id) {
      if (exisPhone.isEmailVerified) {
        throw new ConflictException('SĐT đã tồn tại!');
      }
      await this.userRepo.delete(exisPhone.id);
    }
    const user = exisEmail ?? this.userRepo.create({ email: data.email });
    user.passwordHash = await bcrypt.hash(data.password, 10);
    user.phone = data.phone;
    user.fullName = data.fullName;
    user.isEmailVerified = false;
    return this.userRepo.save(user);
  }
  findUnverifiedByEmail(email: string) {
    return this.userRepo.findOne({ where: { email, isEmailVerified: false } });
  }
  async markEmailVerified(userId: number) {
    await this.userRepo.update({ id: userId }, { isEmailVerified: true });
  }
  async getUserDetail(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['address', 'orders'],
      order: {
        addresses: { isDefault: 'DESC', id: 'ASC' },
        orders: { createdAt: 'DESC' },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản này');
    user.orders = (user.orders ?? []).slice(0, 20);
    delete (user as any).passwordHash;
    const spentResult = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'totalSpent')
      .addSelect('COUNT(order.id)', 'deliveredOrders')
      .where('order.userId== :userId', { userId })
      .andWhere('order.status = :status', { status: 'DELIVERED' })
      .getRawOne<{ totalSpent: string | null; deliveredOrders: string }>();

    return {
      ...user,
      stats: {
        deliveredOrders: Number(spentResult?.deliveredOrders ?? 0),
        totalSpent: Number(spentResult?.totalSpent ?? 0),
      },
    };
  }
  async revokeUserSessions(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng!');
    const result = await this.refreshTokenRepo.update(
      {
        userId,
        revokeAt: null as any,
      },
      { revokeAt: new Date() },
    );
    return { revoked: result.affected ?? 0 };
  }

  // Tài khoản chưa xác thực email coi như chưa tồn tại (không đăng nhập,
  // không quên mật khẩu được)
  async findUser(keys: string) {
    const user = await this.userRepo.findOne({
      where: [
        { email: keys, isEmailVerified: true },
        { phone: keys, isEmailVerified: true },
      ],
    });
    return user;
  }
  async validateUser(key:string, password:string){
    const user=await this.findUser(key)
    if(!user){
      throw new NotFoundException('Không tìm thấy tài khoản!')

    }
    if(user &&(await bcrypt.compare(password,user.passwordHash))){
      // Đúng mật khẩu nhưng bị khoá thì báo rõ thay vì "sai mật khẩu"
      if(!user.isActive) throw new ForbiddenException('Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên.')
      return user
    }
    return null;
  }
  async updatePassword(userId: number, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update({ id: userId }, { passwordHash });
  }
  private async findByIdOrFail(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng!');
    return user;
  }

  async getProfile(userId: number) {
    return toPublicProfile(await this.findByIdOrFail(userId));
  }

  async updateProfile(userId: number, data: UpdateProfileDto) {
    const user = await this.findByIdOrFail(userId);

    if (data.phone !== undefined && data.phone !== user.phone) {
      const existing = await this.userRepo.findOne({
        where: { phone: data.phone },
      });
      if (existing && existing.id !== userId) {
        if (existing.isEmailVerified) {
          throw new ConflictException('SĐT đã được tài khoản khác sử dụng!');
        }
        // Bản đăng ký chưa xác thực không được giữ chỗ SĐT
        await this.userRepo.delete(existing.id);
      }
      user.phone = data.phone;
    }
    if (data.fullName !== undefined) user.fullName = data.fullName;

    return toPublicProfile(await this.userRepo.save(user));
  }

  async updateAvatar(
    userId: number,
    file?: { buffer: Buffer; mimetype: string },
  ) {
    if (!file) throw new BadRequestException('Chưa chọn ảnh.');
    const extension = avatarExtensions[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.');
    }

    const user = await this.findByIdOrFail(userId);
    const oldAvatar = user.avatarUrl;

    await mkdir(avatarDirectory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(join(avatarDirectory, filename), file.buffer);
    user.avatarUrl = `/uploads/avatars/${filename}`;
    const saved = await this.userRepo.save(user);

    // Chỉ xoá ảnh cũ do mình lưu, không đụng tới link ảnh ngoài
    if (oldAvatar?.startsWith('/uploads/avatars/')) {
      await unlink(join(avatarDirectory, basename(oldAvatar))).catch(() => {});
    }
    return toPublicProfile(saved);
  }

  async changePassword(userId: number, data: ChangePasswordDto) {
    const user = await this.findByIdOrFail(userId);
    if (!(await bcrypt.compare(data.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng.');
    }
    await this.updatePassword(userId, data.newPassword);
    return { success: true };
  }

  async findUserById(userId:number){
    const user=await this.userRepo.findOne({where:{id:userId}})
    delete (user as any).passwordHash;
return user
  }
  
}
