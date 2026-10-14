import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../refreshtoken/entity/refresh_token.entity';
import { User } from '../user/entity/user.entity';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshToken])],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
