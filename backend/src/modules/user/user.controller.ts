import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService:UserService){}
    @Post('register')
    create(@Body()data:any){
        return this.userService.create(data)

    }
}
