import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      expiresIn:process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET ,
       
    });
  }

  async validate(payload) {
    if (payload.exp > Date.now()) {
      throw new UnauthorizedException();
    } else {
      delete payload.exp;
      delete payload.iat;
      return payload;
    }
  }
}
