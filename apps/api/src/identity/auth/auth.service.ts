import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../../cache';
import { UsersService } from '../users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokens, JwtPayload } from './auth.types';
import { PrismaService } from '../../database';
import { NotificationService } from '../notification.service';
import { DEFAULT_ROLE } from '../identity.constants';
import { OAuthLoginDto } from './dto/oauth.dto';
import { AuditService } from '../audit.service';

@Injectable()
export class AuthService {
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly bcryptRounds: number;
  private readonly emailTokenExpiryMinutes: number;
  private readonly passwordTokenExpiryMinutes: number;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {
    this.accessTokenExpiry = this.configService.get<string>('JWT_EXPIRY') ?? '15m';
    this.refreshTokenExpiry = this.configService.get<string>('REFRESH_TOKEN_EXPIRY') ?? '7d';
    this.bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS') ?? 12;
    this.emailTokenExpiryMinutes =
      this.configService.get<number>('EMAIL_VERIFICATION_TOKEN_EXPIRY_MINUTES') ?? 60;
    this.passwordTokenExpiryMinutes =
      this.configService.get<number>('PASSWORD_RESET_TOKEN_EXPIRY_MINUTES') ?? 30;
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  async register(
    dto: RegisterDto,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<{ user: Record<string, unknown>; tokens: AuthTokens }> {
    if (!dto.isValidRole()) {
      throw new BadRequestException('Invalid role provided during registration');
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });

    await this.usersService.assignRole(user.id, dto.role ?? DEFAULT_ROLE, user.id);

    const verifyToken = randomUUID();
    const verifyKey = `auth:verify-email:${verifyToken}`;
    await this.redisService.set(
      verifyKey,
      JSON.stringify({ userId: user.id }),
      this.emailTokenExpiryMinutes * 60,
    );

    await this.notificationService.sendEmail(
      dto.email,
      'Verify your PRIBEC account',
      `${this.frontendUrl}/verify-email?token=${verifyToken}`,
    );

    await this.auditService.log({
      eventId: 'user.registered',
      actorId: user.id,
      actorRole: dto.role ?? DEFAULT_ROLE,
      action: 'register',
      resourceType: 'user',
      resourceId: user.id,
      payload: { role: dto.role ?? DEFAULT_ROLE },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: this.usersService.sanitizeUser(user), tokens };
  }

  async login(
    dto: LoginDto,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<{ user: Record<string, unknown>; tokens: AuthTokens }> {
    await this.checkLoginAttempts(requestContext.ip);

    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password_hash) {
      await this.trackFailedLogin(requestContext.ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      await this.trackFailedLogin(requestContext.ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.redisService.del(this.getFailedLoginKey(requestContext.ip));
    await this.usersService.markLastLogin(user.id);

    const tokens = await this.issueTokens(user.id, user.email);

    await this.auditService.log({
      eventId: 'user.login',
      actorId: user.id,
      actorRole: (await this.usersService.getUserRoleNames(user.id))[0] ?? null,
      action: 'login',
      resourceType: 'user',
      resourceId: user.id,
      payload: { successful: true },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });

    return {
      user: this.usersService.sanitizeUser(user),
      tokens,
    };
  }

  async refresh(
    refreshToken: string,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<AuthTokens> {
    const refreshHash = this.hashToken(refreshToken);
    const rows = await this.prisma.$queryRaw<Array<{ id: string; user_id: string; expires_at: Date; revoked_at: Date | null }>>`
      SELECT id, user_id, expires_at, revoked_at
      FROM identity.refresh_tokens
      WHERE token_hash = ${refreshHash}
      LIMIT 1
    `;

    const tokenRow = rows[0];
    if (!tokenRow || tokenRow.revoked_at || tokenRow.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.$executeRaw`
      UPDATE identity.refresh_tokens
      SET revoked_at = NOW()
      WHERE id = ${tokenRow.id}::uuid
    `;

    const user = await this.usersService.findById(tokenRow.user_id);
    const tokens = await this.issueTokens(user.id, user.email);

    await this.auditService.log({
      eventId: 'user.refresh',
      actorId: user.id,
      actorRole: (await this.usersService.getUserRoleNames(user.id))[0] ?? null,
      action: 'refresh_token',
      resourceType: 'refresh_token',
      resourceId: tokenRow.id,
      payload: { rotated: true },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });

    return tokens;
  }

  async logout(
    refreshToken: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<void> {
    const refreshHash = this.hashToken(refreshToken);

    const tokens = await this.prisma.$queryRaw<Array<{ id: string; user_id: string }>>`
      SELECT id, user_id
      FROM identity.refresh_tokens
      WHERE token_hash = ${refreshHash}
      LIMIT 1
    `;

    if (tokens[0]) {
      await this.prisma.$executeRaw`
        UPDATE identity.refresh_tokens
        SET revoked_at = NOW()
        WHERE id = ${tokens[0].id}::uuid
      `;

      await this.redisService.del(`session:${tokens[0].user_id}:${tokens[0].id}`);
    }

    await this.auditService.log({
      eventId: 'user.logout',
      actorId,
      actorRole: (await this.usersService.getUserRoleNames(actorId))[0] ?? null,
      action: 'logout',
      resourceType: 'user',
      resourceId: actorId,
      payload: {},
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });
  }

  async forgotPassword(
    email: string,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = randomUUID();
    const key = `auth:password-reset:${resetToken}`;
    await this.redisService.set(
      key,
      JSON.stringify({ userId: user.id }),
      this.passwordTokenExpiryMinutes * 60,
    );

    await this.notificationService.sendEmail(
      user.email,
      'Reset your PRIBEC password',
      `${this.frontendUrl}/reset-password?token=${resetToken}`,
    );

    await this.auditService.log({
      eventId: 'user.password_reset_requested',
      actorId: user.id,
      actorRole: (await this.usersService.getUserRoleNames(user.id))[0] ?? null,
      action: 'forgot_password',
      resourceType: 'user',
      resourceId: user.id,
      payload: {},
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });
  }

  async resetPassword(
    token: string,
    newPassword: string,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<void> {
    const key = `auth:password-reset:${token}`;
    const value = await this.redisService.getJson<{ userId: string }>(key);
    if (!value?.userId) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.bcryptRounds);
    await this.prisma.$executeRaw`
      UPDATE identity.users
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${value.userId}::uuid
    `;

    await this.redisService.del(key);

    await this.auditService.log({
      eventId: 'user.password_reset_completed',
      actorId: value.userId,
      actorRole: (await this.usersService.getUserRoleNames(value.userId))[0] ?? null,
      action: 'reset_password',
      resourceType: 'user',
      resourceId: value.userId,
      payload: {},
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });
  }

  async verifyEmail(
    token: string,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<void> {
    const key = `auth:verify-email:${token}`;
    const value = await this.redisService.getJson<{ userId: string }>(key);
    if (!value?.userId) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await this.usersService.markEmailVerified(value.userId);
    await this.redisService.del(key);

    const user = await this.usersService.findById(value.userId);
    await this.notificationService.sendEmail(
      user.email,
      'Welcome to PRIBEC',
      'Your email is verified and your account is active.',
    );

    await this.auditService.log({
      eventId: 'user.email_verified',
      actorId: value.userId,
      actorRole: (await this.usersService.getUserRoleNames(value.userId))[0] ?? null,
      action: 'verify_email',
      resourceType: 'user',
      resourceId: value.userId,
      payload: {},
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });
  }

  async oauthLogin(
    provider: 'google' | 'apple' | 'facebook',
    dto: OAuthLoginDto,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<{ user: Record<string, unknown>; tokens: AuthTokens }> {
    if (!dto.providerToken) {
      throw new UnauthorizedException('OAuth token is required');
    }

    let user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      const created = await this.usersService.create({
        email: dto.email,
        passwordHash: null,
        firstName: dto.firstName ?? provider,
        lastName: dto.lastName ?? 'user',
      });
      await this.usersService.assignRole(created.id, DEFAULT_ROLE, created.id);
      await this.usersService.markEmailVerified(created.id);
      user = await this.usersService.findByEmail(dto.email);
    }

    if (!user) {
      throw new UnauthorizedException('Unable to process OAuth login');
    }

    const tokens = await this.issueTokens(user.id, user.email);

    await this.auditService.log({
      eventId: `user.oauth.${provider}`,
      actorId: user.id,
      actorRole: (await this.usersService.getUserRoleNames(user.id))[0] ?? null,
      action: 'oauth_login',
      resourceType: 'user',
      resourceId: user.id,
      payload: { provider },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });

    return {
      user: this.usersService.sanitizeUser(user),
      tokens,
    };
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const roles = await this.usersService.getUserRoleNames(userId);
    const kycStatus = await this.usersService.getLatestKycStatus(userId);

    const payload: JwtPayload = {
      sub: userId,
      email,
      roles,
      kyc_status: kycStatus,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = randomUUID() + randomUUID();
    const refreshHash = this.hashToken(refreshToken);
    const refreshExpiresAt = this.resolveExpiryDate(this.refreshTokenExpiry);

    const refreshRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO identity.refresh_tokens (user_id, token_hash, expires_at)
      VALUES (${userId}::uuid, ${refreshHash}, ${refreshExpiresAt})
      RETURNING id
    `;

    const refreshTokenId = refreshRows[0].id;
    await this.redisService.setJson(
      `session:${userId}:${refreshTokenId}`,
      {
        userId,
        issuedAt: new Date().toISOString(),
      },
      Math.max(60, Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000)),
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.accessTokenExpiry,
      refreshTokenExpiresIn: this.refreshTokenExpiry,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private resolveExpiryDate(expiry: string): Date {
    const now = Date.now();
    if (expiry.endsWith('d')) {
      return new Date(now + Number(expiry.replace('d', '')) * 24 * 60 * 60 * 1000);
    }

    if (expiry.endsWith('h')) {
      return new Date(now + Number(expiry.replace('h', '')) * 60 * 60 * 1000);
    }

    if (expiry.endsWith('m')) {
      return new Date(now + Number(expiry.replace('m', '')) * 60 * 1000);
    }

    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }

  private getFailedLoginKey(ip: string): string {
    return `auth:failed-login:${ip}`;
  }

  private async checkLoginAttempts(ip: string): Promise<void> {
    const key = this.getFailedLoginKey(ip);
    const attempts = Number((await this.redisService.get(key)) ?? '0');
    if (attempts >= 5) {
      throw new HttpException(
        'Too many failed login attempts. Try again in 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async trackFailedLogin(ip: string): Promise<void> {
    const key = this.getFailedLoginKey(ip);
    const current = Number((await this.redisService.get(key)) ?? '0');
    const next = current + 1;
    await this.redisService.set(key, String(next), 15 * 60);
  }
}
