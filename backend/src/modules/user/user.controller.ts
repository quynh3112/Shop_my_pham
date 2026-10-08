import { Controller } from '@nestjs/common';
import { UserService } from './user.service';

// Đăng ký đã chuyển sang POST /auth/register (bắt buộc xác thực OTP qua email)
@Controller('user')
export class UserController {
    constructor(private readonly userService:UserService){}
}
