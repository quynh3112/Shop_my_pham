import { Module } from '@nestjs/common';
import { RefreshtokenService } from './refreshtoken.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entity/refresh_token.entity';
import { RefreshtokenController } from './refreshtoken.controller';

@Module({
  providers: [RefreshtokenService],
  controllers:[RefreshtokenController],
  imports:[TypeOrmModule.forFeature([RefreshToken])]
})
export class RefreshtokenModule {}
