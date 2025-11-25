import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'mySecretKey',
    });
  }

  async validate(payload: any) {
    console.log('aaa'); // Return user object that will be added to Request.user
    return {
      userId: payload.sub, // Using sub as userId to match login payload
      email: payload.email,
    };
  }
}
