import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Order } from '../order/entity/order.entity';
import { RefreshToken } from '../refreshtoken/entity/refresh_token.entity';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}
  async create(data: User) {
    const exisEmail = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (exisEmail) {
      throw new ConflictException('Email đã tồn tại!');
    }
    const exisPhone = await this.userRepo.findOne({
      where: { phone: data.phone },
    });
    if (exisPhone) {
      throw new ConflictException('SĐT đã tồn tại!');
    }
    const passwordHash = await bcrypt.hash(data.passwordHash, 10);
    const user = this.userRepo.create({
      
      email: data.email,
      passwordHash: passwordHash,
      phone: data.phone,
      fullName: data.fullName,
    });
    return this.userRepo.save(user);
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

  async findUser(keys: string) {
    const user = await this.userRepo.findOne({
      where: [{ email: keys }, { phone: keys }],
    });
    return user;
  }
  async validateUser(key:string, password:string){
    const user=await this.findUser(key)
    if(!user){
      throw new NotFoundException('Không tìm thấy tài khoản!')

    }
    if(user &&(await bcrypt.compare(password,user.passwordHash))){
      return user
    }
    return null;
  }
  async findUserById(userId:number){
    const user=await this.userRepo.findOne({where:{id:userId}})
    delete (user as any).passwordHash;
return user
  }
  
}
