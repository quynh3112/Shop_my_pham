import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ingnoreExpiration: false,
      secretOrKey:
        'b0e56384e3a1e879e8ffb2fabb71ca8091363bb2dfa070c80356eba707ea4af9',
    });
  }
  async validate(payload: any) {
    return {
      userId: payload.sub,
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      role: payload.role,
    };
  }
}
