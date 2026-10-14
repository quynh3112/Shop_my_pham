import {
  Body,
  Controller,
  Res,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { SkinAnalysisService } from './skin-analysis.service';
import { FACE_ZONES, SKIN_CONCERNS, SKIN_TYPES } from './skin.constants';

interface AuthenticatedRequest {
  user: { userId: number };
}

@Controller('skin-analysis')
export class SkinAnalysisController {
  constructor(private readonly skinAnalysisService: SkinAnalysisService) {}

  /** Bộ nhãn (loại da, vấn đề da, vùng mặt) cho form admin / frontend */
  @Get('options')
  options() {
    return { skinTypes: SKIN_TYPES, concerns: SKIN_CONCERNS, zones: FACE_ZONES };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 6 * 1024 * 1024, files: 1 } }))
  analyze(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: { buffer: Buffer },
    // Các field gửi kèm trong multipart đều là chuỗi
    @Body() body: { saveImage?: string; landmarks?: string; imageWidth?: string; imageHeight?: string } = {},
  ) {
    return this.skinAnalysisService.analyze(request.user.userId, file, {
      saveImage: body.saveImage === 'true',
      landmarks: body.landmarks,
      imageWidth: Number(body.imageWidth),
      imageHeight: Number(body.imageHeight),
    });
  }

  /** Ảnh khuôn mặt đã lưu — chỉ chủ tài khoản, không cho trình duyệt / proxy lưu cache */
  @Get(':id/image')
  @UseGuards(JwtAuthGuard)
  async image(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const path = await this.skinAnalysisService.getImagePath(request.user.userId, id);
    // Dùng @Res() thì decorator @Header bị bỏ qua -> đặt header trực tiếp
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(path);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listMine(@Req() request: AuthenticatedRequest, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.skinAnalysisService.listMine(request.user.userId, Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getMine(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.skinAnalysisService.getMine(request.user.userId, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  removeMine(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.skinAnalysisService.removeMine(request.user.userId, id);
  }
}
