import {
  BadRequestException,
  ConflictException,
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
import { AuthTokens, ContextSelectorResponse, JwtPayload } from './auth.types';
import { PrismaService } from '../../database';
import { NotificationService } from '../notification.service';
import { DEFAULT_ROLE, SELF_COMPANY_SLUG } from '../identity.constants';
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
      throw new ConflictException('Email already registered');
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

    // Automatically enrol the new user in the Self company as a buyer
    await this.enrolInSelfCompany(user.id);

    // Auto-accept any pending invitations for this email address.
    // This handles the case where a user registers via the normal /register
    // page instead of clicking the invitation link directly.
    const pendingInvitations = await this.prisma.$queryRaw<
      Array<{
        id: string;
        company_id: string;
        role: string;
        is_admin: boolean;
        permissions: unknown;
        token_hash: string;
      }>
    >`
      SELECT id, company_id, role, is_admin, permissions, token_hash
      FROM identity.company_invitations
      WHERE invited_email = LOWER(${dto.email})
        AND status = 'pending'
        AND expires_at > NOW()
    `;

    for (const inv of pendingInvitations) {
      // Get role permissions if none were stored on the invitation
      const perms =
        inv.permissions && Array.isArray(inv.permissions) && inv.permissions.length > 0
          ? (inv.permissions as Array<{ resource: string; action: string }>)
          : await this.prisma.$queryRaw<Array<{ resource: string; action: string }>>`
              SELECT p.resource, p.action
              FROM identity.role_permissions rp
              JOIN identity.permissions p ON p.id = rp.permission_id
              JOIN identity.roles r ON r.id = rp.role_id
              WHERE r.name = ${inv.role}
            `;

      // Add the user as a company member
      const existing = await this.prisma.$queryRaw<Array<{ id: string; status: string }>>`
        SELECT id, status FROM identity.company_members
        WHERE company_id = ${inv.company_id}::uuid AND user_id = ${user.id}::uuid
        LIMIT 1
      `;
      if (existing[0]) {
        if (existing[0].status !== 'active') {
          await this.prisma.$executeRaw`
            UPDATE identity.company_members
            SET status = 'active', role = ${inv.role}, is_admin = ${inv.is_admin},
                permissions = ${JSON.stringify(perms)}::jsonb,
                revoked_at = NULL, revoked_by = NULL, joined_at = NOW(), updated_at = NOW()
            WHERE id = ${existing[0].id}::uuid
          `;
        }
      } else {
        await this.prisma.$executeRaw`
          INSERT INTO identity.company_members (company_id, user_id, role, is_admin, permissions, invited_by)
          VALUES (${inv.company_id}::uuid, ${user.id}::uuid, ${inv.role}, ${inv.is_admin},
                  ${JSON.stringify(perms)}::jsonb, ${user.id}::uuid)
        `;
      }

      // Assign the invited role to the user's system profile
      if (inv.role !== DEFAULT_ROLE) {
        await this.usersService.assignRole(user.id, inv.role, user.id);
      }

      // Mark the invitation as accepted
      await this.prisma.$executeRaw`
        UPDATE identity.company_invitations
        SET status = 'accepted', accepted_by = ${user.id}::uuid, accepted_at = NOW()
        WHERE id = ${inv.id}::uuid
      `;

      await this.auditService.log({
        eventId: 'company_invitation.accepted',
        actorId: user.id,
        actorRole: inv.role,
        action: 'accept_invitation',
        resourceType: 'company_member',
        resourceId: inv.company_id,
        payload: { company_id: inv.company_id, invitation_id: inv.id, via: 'auto_on_register' },
        ipAddress: requestContext.ip,
        userAgent: requestContext.userAgent ?? null,
      });
    }

    // If there is exactly one pending invitation, issue the token with that
    // company pre-selected so the user lands in the right context immediately.
    const firstInvite = pendingInvitations[0];
    const companyCtx =
      firstInvite
        ? {
            active_company_id: firstInvite.company_id,
            active_company_role: firstInvite.role,
            active_company_is_admin: firstInvite.is_admin,
          }
        : undefined;

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

    const tokens = await this.issueTokens(user.id, user.email, undefined, companyCtx);
    return { user: this.usersService.sanitizeUser(user), tokens };
  }

  async login(
    dto: LoginDto,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<
    | { user: Record<string, unknown>; tokens: AuthTokens }
    | ContextSelectorResponse
  > {
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

    // Detect company memberships
    const memberships = await this.getUserActiveMemberships(user.id);

    await this.auditService.log({
      eventId: 'user.login',
      actorId: user.id,
      actorRole: roles[0] ?? null,
      action: 'login',
      resourceType: 'user',
      resourceId: user.id,
      payload: { successful: true, company_count: memberships.length },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });

    // Multi-company: issue interim tokens (no company context) so the client
    // can call POST /auth/contexts/select with a valid Bearer token.
    if (memberships.length > 1) {
      const interimTokens = await this.issueTokens(user.id, user.email, roles, {
        active_company_id: null,
        active_company_role: null,
        active_company_is_admin: false,
      });
      return {
        requires_context_selection: true,
        user: this.usersService.sanitizeUser(user),
        tokens: interimTokens,
        companies: memberships,
      };
    }

    // Single company: embed context automatically.
    // memberships always includes Self, so length 0 is a data-integrity edge case —
    // fall back to Self to guarantee active_company_id is never null.
    const companyCtx =
      memberships.length >= 1
        ? {
            active_company_id: memberships[0].id,
            active_company_role: memberships[0].role,
            active_company_is_admin: memberships[0].is_admin,
          }
        : await this.resolveSelfCompanyCtx(user.id);

    const tokens = await this.issueTokens(user.id, user.email, roles, companyCtx);

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
        active_company_id: string | null;
      }>
    >`
      SELECT id, user_id, expires_at, revoked_at, active_company_id
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

    // Re-embed the exact company context that was active when the token was issued.
    // For multi-company users this preserves the specific company they selected;
    // single-company users are auto-resolved as a fallback.
    let companyCtx: {
      active_company_id: string | null;
      active_company_role: string | null;
      active_company_is_admin: boolean;
    };

    if (tokenRow.active_company_id) {
      // Re-validate membership is still active (role/admin may have changed)
      const memberRows = await this.prisma.$queryRaw<
        Array<{ role: string; is_admin: boolean }>
      >`
        SELECT cm.role, cm.is_admin
        FROM identity.company_members cm
        JOIN identity.companies c ON c.id = cm.company_id
        WHERE cm.user_id = ${user.id}::uuid
          AND cm.company_id = ${tokenRow.active_company_id}::uuid
          AND cm.status = 'active'
          AND c.status != 'deactivated'
        LIMIT 1
      `;
      if (memberRows[0]) {
        companyCtx = {
          active_company_id: tokenRow.active_company_id,
          active_company_role: memberRows[0].role,
          active_company_is_admin: memberRows[0].is_admin,
        };
      } else {
        // Membership revoked or company deactivated — fall back to Self so the
        // refreshed token always has a valid company context.
        companyCtx = await this.resolveSelfCompanyCtx(user.id);
      }
    } else {
      // No stored context (token predates this column or was an interim multi-company
      // token). Resolve the best available context — always at least Self.
      const memberships = await this.getUserActiveMemberships(user.id);
      companyCtx =
        memberships.length >= 1
          ? {
              active_company_id: memberships[0].id,
              active_company_role: memberships[0].role,
              active_company_is_admin: memberships[0].is_admin,
            }
          : await this.resolveSelfCompanyCtx(user.id);
    }

    const tokens = await this.issueTokens(user.id, user.email, roles, companyCtx);

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

  async resendVerificationEmail(
    userId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (user.email_verified_at) {
      return;
    }

    const verifyToken = randomUUID();
    const verifyKey = `auth:verify-email:${verifyToken}`;
    await this.redisService.set(
      verifyKey,
      JSON.stringify({ userId: user.id }),
      this.emailTokenExpiryMinutes * 60,
    );

    await this.notificationService.sendEmail(
      user.email,
      'Verify your PRIBEC account',
      `${this.frontendUrl}/verify-email?token=${verifyToken}`,
    );

    await this.auditService.log({
      eventId: 'user.verification_email_resent',
      actorId: user.id,
      actorRole: (await this.usersService.getUserRoleNames(user.id))[0] ?? null,
      action: 'resend_verification_email',
      resourceType: 'user',
      resourceId: user.id,
      payload: {},
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });
  }

  async oauthLogin(
    provider: 'google' | 'apple' | 'facebook',
    dto: OAuthLoginDto,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<{ user: Record<string, unknown>; tokens: AuthTokens } | ContextSelectorResponse> {
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
      await this.enrolInSelfCompany(created.id);
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
    const memberships = await this.getUserActiveMemberships(user.id);
    // Multi-company OAuth users must select context just like regular login.
    if (memberships.length > 1) {
      const interimTokens = await this.issueTokens(user.id, user.email, roles, {
        active_company_id: null,
        active_company_role: null,
        active_company_is_admin: false,
      });
      return {
        requires_context_selection: true,
        user: this.usersService.sanitizeUser(user),
        tokens: interimTokens,
        companies: memberships,
      };
    }
    const singleCtx =
      memberships.length === 1
        ? {
            active_company_id: memberships[0].id,
            active_company_role: memberships[0].role,
            active_company_is_admin: memberships[0].is_admin,
          }
        : await this.resolveSelfCompanyCtx(user.id);
    const tokens = await this.issueTokens(user.id, user.email, roles, singleCtx);

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

  /** Return all active company memberships for context selector UI. */
  async getUserContexts(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      role: string;
      is_admin: boolean;
      logo_url: string | null;
    }>
  > {
    return this.getUserActiveMemberships(userId);
  }

  /** Select a company context and issue a fresh JWT pair with that context embedded. */
  async selectContext(
    userId: string,
    email: string,
    companyId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<AuthTokens> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        company_id: string;
        role: string;
        is_admin: boolean;
        status: string;
      }>
    >`
      SELECT cm.company_id, cm.role, cm.is_admin, cm.status
      FROM identity.company_members cm
      JOIN identity.companies c ON c.id = cm.company_id
      WHERE cm.user_id = ${userId}::uuid
        AND cm.company_id = ${companyId}::uuid
        AND cm.status = 'active'
        AND c.status != 'deactivated'
      LIMIT 1
    `;

    if (!rows[0]) {
      throw new UnauthorizedException('Company context not available');
    }

    const roles = await this.usersService.getUserRoleNames(userId);
    const tokens = await this.issueTokens(userId, email, roles, {
      active_company_id: companyId,
      active_company_role: rows[0].role,
      active_company_is_admin: rows[0].is_admin,
    });

    await this.auditService.log({
      eventId: 'company_context.selected',
      actorId: userId,
      actorRole: rows[0].role,
      action: 'select_context',
      resourceType: 'company',
      resourceId: companyId,
      payload: { company_id: companyId },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });

    return tokens;
  }

  private async getUserActiveMemberships(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
      role: string;
      is_admin: boolean;
      is_system: boolean;
      logo_url: string | null;
    }>
  > {
    return this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        slug: string;
        category: string;
        role: string;
        is_admin: boolean;
        is_system: boolean;
        logo_url: string | null;
      }>
    >`
      SELECT c.id, c.name, c.slug, c.category, cm.role, cm.is_admin, c.is_system, c.logo_url
      FROM identity.company_members cm
      JOIN identity.companies c ON c.id = cm.company_id
      WHERE cm.user_id = ${userId}::uuid
        AND cm.status = 'active'
        AND c.status != 'deactivated'
      ORDER BY c.is_system DESC, c.name
    `;
  }

  /** Enrols a user in the built-in "Self" system company as a buyer_seller.
   * Called automatically on every registration path (password + OAuth + invite).
   * Safe to call multiple times — INSERT is idempotent via ON CONFLICT DO NOTHING.
   * Public so that InvitationsService can reuse the same logic without duplication.
   */
  async enrolInSelfCompany(userId: string): Promise<void> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM identity.companies
      WHERE slug = ${SELF_COMPANY_SLUG} AND is_system = true
      LIMIT 1
    `;
    if (rows.length === 0) {
      this.logger.warn(
        'Self company not found — skipping auto-enrolment for user ' + userId,
      );
      return;
    }
    const permissions = await this.getRolePermissions('buyer_seller');
    await this.prisma.$executeRaw`
      INSERT INTO identity.company_members
        (company_id, user_id, role, is_admin, status, permissions)
      VALUES
        (${rows[0].id}::uuid, ${userId}::uuid, 'buyer_seller', false, 'active', ${JSON.stringify(permissions)}::jsonb)
      ON CONFLICT (company_id, user_id) DO NOTHING
    `;
  }

  /**
   * Looks up the user's membership in the built-in Self system company and
   * returns a company context object suitable for `issueTokens`.
   * Falls back to a context-less (null) object if the membership is missing
   * due to a data-integrity edge-case.
   */
  private async resolveSelfCompanyCtx(userId: string): Promise<{
    active_company_id: string | null;
    active_company_role: string | null;
    active_company_is_admin: boolean;
  }> {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; role: string; is_admin: boolean }>
    >`
      SELECT c.id, cm.role, cm.is_admin
      FROM identity.company_members cm
      JOIN identity.companies c ON c.id = cm.company_id
      WHERE cm.user_id = ${userId}::uuid
        AND c.is_system = true
        AND c.slug = ${SELF_COMPANY_SLUG}
        AND cm.status = 'active'
      LIMIT 1
    `;
    if (rows[0]) {
      return {
        active_company_id: rows[0].id,
        active_company_role: rows[0].role,
        active_company_is_admin: rows[0].is_admin,
      };
    }
    this.logger.warn(
      `Self company membership not found for user ${userId} — issuing context-less token`,
    );
    return {
      active_company_id: null,
      active_company_role: null,
      active_company_is_admin: false,
    };
  }

  /** Fetches the canonical permission set for a role from identity.role_permissions. */
  private async getRolePermissions(
    role: string,
  ): Promise<Array<{ resource: string; action: string }>> {
    return this.prisma.$queryRaw<Array<{ resource: string; action: string }>>`
      SELECT p.resource, p.action
      FROM identity.role_permissions rp
      JOIN identity.permissions p ON p.id = rp.permission_id
      JOIN identity.roles r ON r.id = rp.role_id
      WHERE r.name = ${role}
    `;
  }

  /** Public wrapper so companion services (e.g. InvitationsService) can issue
   *  tokens without duplicating the JwtService plumbing. */
  async issueTokensForUser(
    userId: string,
    email: string,
    companyCtx?: {
      active_company_id: string | null;
      active_company_role: string | null;
      active_company_is_admin: boolean;
    },
  ): Promise<AuthTokens> {
    return this.issueTokens(userId, email, undefined, companyCtx);
  }

  private async issueTokens(
    userId: string,
    email: string,
    prefetchedRoles?: string[],
    companyCtx?: {
      active_company_id: string | null;
      active_company_role: string | null;
      active_company_is_admin: boolean;
    },
  ): Promise<AuthTokens> {
    const roles =
      prefetchedRoles ?? (await this.usersService.getUserRoleNames(userId));
    const kycStatus = await this.usersService.getLatestKycStatus(userId);

    const payload: JwtPayload = {
      sub: userId,
      email,
      roles,
      kyc_status: kycStatus,
      active_company_id: companyCtx?.active_company_id ?? null,
      active_company_role: companyCtx?.active_company_role ?? null,
      active_company_is_admin: companyCtx?.active_company_is_admin ?? false,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = randomUUID() + randomUUID();
    const refreshHash = this.hashToken(refreshToken);
    const refreshExpiresAt = this.resolveExpiryDate(this.refreshTokenExpiry);

    const activeCompanyId = companyCtx?.active_company_id ?? null;
    const refreshRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO identity.refresh_tokens (user_id, token_hash, expires_at, active_company_id)
      VALUES (${userId}::uuid, ${refreshHash}, ${refreshExpiresAt}, ${activeCompanyId}::uuid)
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
