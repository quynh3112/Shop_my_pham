import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { UserService } from "src/modules/user/user.service";
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
    constructor (private readonly userSerVice:UserService){
        super({
            usernameField:"email"
        })

    }
    async validate(key:string, password:string){
        const user=await this.userSerVice.validateUser(key,password)
        if(!user){
            throw new UnauthorizedException('Unthorized')
           
        }
         return user
    }

}