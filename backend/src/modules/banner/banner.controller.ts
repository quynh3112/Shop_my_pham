import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannerService } from './banner.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { BannerPlacement } from './entity/banner.entity';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { PermissionGuard } from '../guard/permission.guard';
import { RequirePermission } from '../guard/require-permission.decorator';

type BannerUploadFile = { buffer: Buffer };

@RequirePermission('banners')
@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get('active')
  listActive(@Query('placement') placement: BannerPlacement) {
    return this.bannerService.listActiveBanners(placement);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  listAdmin() {
    return this.bannerService.listAdminBanners();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() input: CreateBannerDto,
    @UploadedFile() file?: BannerUploadFile,
  ) {
    if (!file) {
      throw new Error('Ảnh banner là bắt buộc.');
    }
    return this.bannerService.createBanner(input, file);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateBannerDto,
  ) {
    return this.bannerService.updateBanner(id, input);
  }

  @Patch(':id/active')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  setActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.bannerService.setBannerActive(id, isActive);
  }

  @Patch(':id/image')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(FileInterceptor('image'))
  replaceImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: BannerUploadFile,
  ) {
    if (!file) {
      throw new Error('Ảnh banner mới là bắt buộc.');
    }
    return this.bannerService.replaceBannerImage(id, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.removeBanner(id);
  }
}
