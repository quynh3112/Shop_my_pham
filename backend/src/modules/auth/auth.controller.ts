import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { LocalAuthGuard } from '../guard/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  @UseGuards(LocalAuthGuard)
  login(@Body() data: any) {
    return this.authService.login(data);
  }
  
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Request() req: any) {
    return req.user
  }
  @Post('logout')
  logout(@Request() req){
    

  }
}
