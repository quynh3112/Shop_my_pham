import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './entity/banner.entity';

@Module({
  providers: [BannerService],
  controllers: [BannerController],
  imports:[TypeOrmModule.forFeature([Banner])]
})
export class BannerModule {}
