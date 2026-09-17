import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { RefreshToken } from '../refreshtoken/entity/refresh_token.entity';
import { Or } from 'typeorm';
import { Order } from '../order/entity/order.entity';

@Module({
  providers: [UserService],
  controllers: [UserController],
  imports:[TypeOrmModule.forFeature([User,RefreshToken,Order])],
  exports:[UserService]
})
export class UserModule {}
