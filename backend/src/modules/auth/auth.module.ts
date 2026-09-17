import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../refreshtoken/entity/refresh_token.entity';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { LocalStrategy } from './passport/local.strategy';
import { JwtStrategy } from './passport/jwt.strategy';

@Module({
  providers: [AuthService,LocalStrategy,JwtStrategy],
  controllers: [AuthController],
  imports:[ JwtModule.register({
      secret:'b0e56384e3a1e879e8ffb2fabb71ca8091363bb2dfa070c80356eba707ea4af9' ,
      signOptions: {
        expiresIn: '1h',
      },
    }),TypeOrmModule.forFeature([RefreshToken]),UserModule]
})
export class AuthModule {}
