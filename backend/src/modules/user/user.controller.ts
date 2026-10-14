import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { ChangePasswordDto, UpdateProfileDto } from './dto/user.dto';
import { UserService } from './user.service';

interface AuthenticatedRequest {
  user: { userId: number };
}

// Đăng ký đã chuyển sang POST /auth/register (bắt buộc xác thực OTP qua email)
@Controller('user')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.userService.getProfile(request.user.userId);
  }

  @Patch('me')
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() data: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(request.user.userId, data);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  updateAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string },
  ) {
    return this.userService.updateAvatar(request.user.userId, file);
  }

  @Patch('me/password')
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() data: ChangePasswordDto,
  ) {
    return this.userService.changePassword(request.user.userId, data);
  }
}
