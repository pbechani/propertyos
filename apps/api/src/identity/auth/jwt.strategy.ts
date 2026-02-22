import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private static readonly DEV_FALLBACK_SECRET =
    'development-only-jwt-secret-change-me-123456';
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    const env = configService.get<string>('NODE_ENV') ?? 'development';
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      if (env === 'production' || env === 'staging') {
        throw new Error(
          'JWT_SECRET environment variable must be set in production/staging. Refusing to start.',
        );
      }
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret ?? JwtStrategy.DEV_FALLBACK_SECRET,
    });

    if (!secret) {
      this.logger.warn(
        'JWT_SECRET is not set — using insecure development fallback. Never use this in production.',
      );
    }
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return payload;
  }
}
