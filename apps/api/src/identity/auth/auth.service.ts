import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
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
import { OAuthVerificationService } from './oauth-verification.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
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
    private readonly oauthVerificationService: OAuthVerificationService,
  ) {
    this.accessTokenExpiry =
      this.configService.get<string>('JWT_EXPIRY') ?? '15m';
    this.refreshTokenExpiry =
      this.configService.get<string>('REFRESH_TOKEN_EXPIRY') ?? '7d';
    this.bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS') ?? 12;
    this.emailTokenExpiryMinutes =
      this.configService.get<number>(
        'EMAIL_VERIFICATION_TOKEN_EXPIRY_MINUTES',
      ) ?? 60;
    this.passwordTokenExpiryMinutes =
      this.configService.get<number>('PASSWORD_RESET_TOKEN_EXPIRY_MINUTES') ??
      30;
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  async register(
    dto: RegisterDto,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<{ user: Record<string, unknown>; tokens: AuthTokens }> {
    if (!dto.isValidRole()) {
      throw new BadRequestException(
        'Invalid role provided during registration',
      );
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

    await this.usersService.assignRole(
      user.id,
      dto.role ?? DEFAULT_ROLE,
      user.id,
    );

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

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordValid) {
      await this.trackFailedLogin(requestContext.ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    await this.redisService.del(this.getFailedLoginKey(requestContext.ip));
    await this.usersService.markLastLogin(user.id);

    const roles = await this.usersService.getUserRoleNames(user.id);
    const tokens = await this.issueTokens(user.id, user.email, roles);

    await this.auditService.log({
      eventId: 'user.login',
      actorId: user.id,
      actorRole: roles[0] ?? null,
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
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        user_id: string;
        expires_at: Date;
        revoked_at: Date | null;
      }>
    >`
      SELECT id, user_id, expires_at, revoked_at
      FROM identity.refresh_tokens
      WHERE token_hash = ${refreshHash}
      LIMIT 1
    `;

    const tokenRow = rows[0];
    if (
      !tokenRow ||
      tokenRow.revoked_at ||
      tokenRow.expires_at.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.$executeRaw`
      UPDATE identity.refresh_tokens
      SET revoked_at = NOW()
      WHERE id = ${tokenRow.id}::uuid
    `;

    const user = await this.usersService.findById(tokenRow.user_id);
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const roles = await this.usersService.getUserRoleNames(user.id);
    const tokens = await this.issueTokens(user.id, user.email, roles);

    await this.auditService.log({
      eventId: 'user.refresh',
      actorId: user.id,
      actorRole: roles[0] ?? null,
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
    actorRole?: string | null,
  ): Promise<void> {
    const refreshHash = this.hashToken(refreshToken);

    const tokens = await this.prisma.$queryRaw<
      Array<{ id: string; user_id: string }>
    >`
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

      await this.redisService.del(
        `session:${tokens[0].user_id}:${tokens[0].id}`,
      );
    }

    const resolvedRole =
      actorRole ??
      (await this.usersService.getUserRoleNames(actorId))[0] ??
      null;

    await this.auditService.log({
      eventId: 'user.logout',
      actorId,
      actorRole: resolvedRole,
      action: 'logout',
      resourceType: 'user',
      resourceId: actorId,
      payload: {},
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    const tokens = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM identity.refresh_tokens
      WHERE user_id = ${userId}::uuid AND revoked_at IS NULL
    `;

    if (tokens.length > 0) {
      await this.prisma.$executeRaw`
        UPDATE identity.refresh_tokens
        SET revoked_at = NOW()
        WHERE user_id = ${userId}::uuid AND revoked_at IS NULL
      `;

      for (const token of tokens) {
        await this.redisService.del(`session:${userId}:${token.id}`);
      }
    }
  }

  async forgotPassword(
    email: string,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.status !== 'active') {
      // silently return — do not reveal whether account exists or is suspended
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
    await this.revokeAllSessions(value.userId);

    await this.auditService.log({
      eventId: 'user.password_reset_completed',
      actorId: value.userId,
      actorRole:
        (await this.usersService.getUserRoleNames(value.userId))[0] ?? null,
      action: 'reset_password',
      resourceType: 'user',
      resourceId: value.userId,
      payload: {},
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<void> {
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
        status: string;
        password_hash: string | null;
      }>
    >`
      SELECT id, email, status, password_hash
      FROM identity.users
      WHERE id = ${userId}::uuid
      LIMIT 1
    `;

    const user = rows[0];
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    if (!user.password_hash) {
      throw new BadRequestException(
        'Password change is unavailable for this account',
      );
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const nextHash = await bcrypt.hash(newPassword, this.bcryptRounds);
    await this.prisma.$executeRaw`
      UPDATE identity.users
      SET password_hash = ${nextHash}, updated_at = NOW()
      WHERE id = ${userId}::uuid
    `;

    await this.revokeAllSessions(userId);

    await this.auditService.log({
      eventId: 'user.password_changed',
      actorId: userId,
      actorRole: (await this.usersService.getUserRoleNames(userId))[0] ?? null,
      action: 'change_password',
      resourceType: 'user',
      resourceId: userId,
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
      actorRole:
        (await this.usersService.getUserRoleNames(value.userId))[0] ?? null,
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

    const verifiedIdentity = await this.oauthVerificationService.verify(
      provider,
      dto.providerToken,
    );

    if (
      dto.email &&
      verifiedIdentity.email &&
      dto.email.toLowerCase() !== verifiedIdentity.email.toLowerCase()
    ) {
      throw new UnauthorizedException('OAuth identity mismatch');
    }

    const trustedEmail = verifiedIdentity.email ?? dto.email ?? null;
    if (!trustedEmail) {
      throw new UnauthorizedException(
        'OAuth provider did not return an email address',
      );
    }

    let user = await this.usersService.findByEmail(trustedEmail);

    if (!user) {
      const created = await this.usersService.create({
        email: trustedEmail,
        passwordHash: null,
        firstName: verifiedIdentity.firstName ?? dto.firstName ?? provider,
        lastName: verifiedIdentity.lastName ?? dto.lastName ?? 'user',
      });
      await this.usersService.assignRole(created.id, DEFAULT_ROLE, created.id);
      if (verifiedIdentity.emailVerified) {
        await this.usersService.markEmailVerified(created.id);
      }
      user = await this.usersService.findByEmail(trustedEmail);
    }

    if (!user) {
      throw new UnauthorizedException('Unable to process OAuth login');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const roles = await this.usersService.getUserRoleNames(user.id);
    const tokens = await this.issueTokens(user.id, user.email, roles);

    await this.auditService.log({
      eventId: `user.oauth.${provider}`,
      actorId: user.id,
      actorRole: roles[0] ?? null,
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

  private async issueTokens(
    userId: string,
    email: string,
    prefetchedRoles?: string[],
  ): Promise<AuthTokens> {
    const roles =
      prefetchedRoles ?? (await this.usersService.getUserRoleNames(userId));
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
      Math.max(
        60,
        Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000),
      ),
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
      return new Date(
        now + Number(expiry.replace('d', '')) * 24 * 60 * 60 * 1000,
      );
    }

    if (expiry.endsWith('h')) {
      return new Date(now + Number(expiry.replace('h', '')) * 60 * 60 * 1000);
    }

    if (expiry.endsWith('m')) {
      return new Date(now + Number(expiry.replace('m', '')) * 60 * 1000);
    }

    if (expiry.endsWith('s')) {
      return new Date(now + Number(expiry.replace('s', '')) * 1000);
    }

    this.logger.warn(
      `Unrecognised expiry suffix in '${expiry}'; defaulting to 7 days. ` +
        `Check JWT_EXPIRY / REFRESH_TOKEN_EXPIRY configuration.`,
    );
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
