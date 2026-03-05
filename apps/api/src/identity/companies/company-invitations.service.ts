import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database';
import { AuditService } from '../audit.service';
import { NotificationService } from '../notification.service';
import { ConfigService } from '@nestjs/config';
import { InviteMemberDto } from './dto/member.dto';
import { CompanyMembersService } from './company-members.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users.service';
import { DEFAULT_ROLE } from '../identity.constants';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

const INVITE_EXPIRY_HOURS = 72;
const BCRYPT_ROUNDS = 12;

export class RegisterViaInviteDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

@Injectable()
export class CompanyInvitationsService {
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    private readonly membersService: CompanyMembersService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  async invite(
    companyId: string,
    dto: InviteMemberDto,
    invitedBy: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    // Company must be verified before inviting
    const company = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; verification_status: string; status: string }>
    >`SELECT id, name, verification_status, status FROM identity.companies WHERE id = ${companyId}::uuid LIMIT 1`;

    if (!company[0]) throw new NotFoundException('Company not found');
    if (company[0].verification_status !== 'verified') {
      throw new BadRequestException(
        'Company must be verified before inviting members',
      );
    }

    // Reject if a pending invitation already exists for this email+company
    const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM identity.company_invitations
      WHERE company_id = ${companyId}::uuid
        AND invited_email = ${dto.email}
        AND status = 'pending'
      LIMIT 1
    `;
    if (existing[0]) {
      throw new BadRequestException(
        'A pending invitation already exists for this email',
      );
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(
      Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    const inviteId = randomBytes(16).toString('hex');

    // Default to role's canonical permissions when caller omits them
    const permissions =
      dto.permissions && dto.permissions.length > 0
        ? dto.permissions
        : await this.membersService.getRolePermissions(dto.role);

    await this.prisma.$executeRaw`
      INSERT INTO identity.company_invitations (
        company_id, invited_email, role, is_admin, permissions,
        token_hash, invited_by, expires_at
      ) VALUES (
        ${companyId}::uuid,
        ${dto.email},
        ${dto.role},
        ${dto.is_admin ?? false},
        ${JSON.stringify(permissions)}::jsonb,
        ${tokenHash},
        ${invitedBy}::uuid,
        ${expiresAt}
      )
    `;

    await this.auditService.log({
      eventId: 'company_invitation.created',
      actorId: invitedBy,
      actorRole: 'admin',
      action: 'invite_member',
      resourceType: 'invitation',
      resourceId: inviteId,
      payload: {
        company_id: companyId,
        invitee_email: dto.email,
        role: dto.role,
      },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    const inviteLink = `${this.frontendUrl}/invitations/${rawToken}`;
    void this.notificationService.sendEmail(
      dto.email,
      `You're invited to join ${company[0].name} on PRIBEC`,
      `You have been invited to join "${company[0].name}" as a ${dto.role}.\n\nAccept your invitation here (valid for ${INVITE_EXPIRY_HOURS} hours):\n${inviteLink}`,
    );

    return { invitee_email: dto.email, expires_at: expiresAt };
  }

  /**
   * Public preview — returns just enough for the frontend invitation page
   * WITHOUT exposing permissions or the token hash.
   */
  async preview(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        invited_email: string;
        role: string;
        is_admin: boolean;
        expires_at: Date;
        status: string;
        company_id: string;
        company_name: string;
        company_category: string;
        inviter_first_name: string | null;
        inviter_last_name: string | null;
      }>
    >`
      SELECT
        ci.id,
        ci.invited_email,
        ci.role,
        ci.is_admin,
        ci.expires_at,
        ci.status,
        c.id        AS company_id,
        c.name      AS company_name,
        c.category  AS company_category,
        u.first_name AS inviter_first_name,
        u.last_name  AS inviter_last_name
      FROM identity.company_invitations ci
      JOIN identity.companies c ON c.id = ci.company_id
      LEFT JOIN identity.users u ON u.id = ci.invited_by
      WHERE ci.token_hash = ${tokenHash}
      LIMIT 1
    `;

    const inv = rows[0];
    if (!inv) throw new NotFoundException('Invitation not found');
    if (inv.status !== 'pending') {
      throw new BadRequestException(
        inv.status === 'accepted' ? 'This invitation has already been accepted' : 'Invitation is no longer valid',
      );
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('Invitation has expired');
    }

    return {
      id: inv.id,
      invited_email: inv.invited_email,
      role: inv.role,
      is_admin: inv.is_admin,
      expires_at: inv.expires_at,
      company_id: inv.company_id,
      company_name: inv.company_name,
      company_category: inv.company_category,
      invited_by: inv.inviter_first_name
        ? `${inv.inviter_first_name} ${inv.inviter_last_name ?? ''}`.trim()
        : null,
    };
  }

  async accept(
    token: string,
    userId: string,
    userEmail: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    const invitation = await this.findValidInvitation(token);

    // Security: the authenticated user's email must match the invitation
    if (invitation.invited_email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address',
      );
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    await this.membersService.linkUserToCompany(
      invitation.company_id,
      userId,
      invitation.role,
      invitation.is_admin,
      invitation.permissions as Array<{ resource: string; action: string }>,
      invitation.id,
      requestContext,
    );

    // Ensure the invited role is reflected in the user's system-level profile
    // so it is included in their next JWT (idempotent — ON CONFLICT DO NOTHING).
    await this.usersService.assignRole(userId, invitation.role, userId);

    await this.prisma.$executeRaw`
      UPDATE identity.company_invitations
      SET status = 'accepted', accepted_by = ${userId}::uuid, accepted_at = NOW()
      WHERE token_hash = ${tokenHash}
    `;

    await this.auditService.log({
      eventId: 'company_invitation.accepted',
      actorId: userId,
      actorRole: invitation.role,
      action: 'accept_invitation',
      resourceType: 'company_member',
      resourceId: invitation.company_id,
      payload: { company_id: invitation.company_id, invitation_id: invitation.id },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    // Notify company admins and the invitee
    void this.notifyAdminsOfJoin(invitation.company_id, invitation.invited_email, invitation.role);
    void this.notifyInviteeOfAcceptance(invitation.company_id, invitation.invited_email, invitation.role);

    // Issue fresh tokens so the caller gets a JWT that already includes the
    // new company context and the invited role — no extra login round-trip needed.
    const tokens = await this.authService.issueTokensForUser(userId, userEmail, {
      active_company_id: invitation.company_id,
      active_company_role: invitation.role,
      active_company_is_admin: invitation.is_admin,
    });

    const user = await this.usersService.findByEmail(userEmail);

    return {
      success: true,
      company_id: invitation.company_id,
      user: user ? this.usersService.sanitizeUser(user) : null,
      tokens,
    };
  }

  /**
   * Register a brand-new user and accept the invitation atomically.
   * Called by the public `/invitations/:token/register-and-accept` endpoint.
   * - Email pre-validated by the invitation token (marks as verified immediately)
   * - Issues full auth tokens so the frontend can log the user in directly
   */
  async registerAndAccept(
    token: string,
    dto: RegisterViaInviteDto,
    requestContext: { ip: string; userAgent?: string | null },
  ): Promise<{
    user: Record<string, unknown>;
    tokens: import('../auth/auth.types').AuthTokens;
    company_id: string;
  }> {
    const invitation = await this.findValidInvitation(token);

    if (invitation.invited_email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new ForbiddenException(
        'Registration email must match the invitation email',
      );
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'An account with this email already exists. Please log in and accept the invitation.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // Every PRIBEC user MUST have the default buyer_seller role and a Self company
    // membership — this mirrors what the normal registration path does.
    await this.usersService.assignRole(user.id, DEFAULT_ROLE, user.id);
    await this.authService.enrolInSelfCompany(user.id);

    // Also assign the company-specific invited role when it differs from the default.
    if (invitation.role && invitation.role !== DEFAULT_ROLE) {
      await this.usersService.assignRole(user.id, invitation.role, user.id);
    }

    // Mark email verified — the invitation token proves email ownership
    await this.usersService.markEmailVerified(user.id);

    await this.auditService.log({
      eventId: 'user.registered_via_invitation',
      actorId: user.id,
      actorRole: invitation.role,
      action: 'register',
      resourceType: 'user',
      resourceId: user.id,
      payload: { invitation_id: invitation.id, company_id: invitation.company_id },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent ?? null,
    });

    // Accept the invitation (links user to company)
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.membersService.linkUserToCompany(
      invitation.company_id,
      user.id,
      invitation.role,
      invitation.is_admin,
      invitation.permissions as Array<{ resource: string; action: string }>,
      invitation.id,
      requestContext,
    );

    await this.prisma.$executeRaw`
      UPDATE identity.company_invitations
      SET status = 'accepted', accepted_by = ${user.id}::uuid, accepted_at = NOW()
      WHERE token_hash = ${tokenHash}
    `;

    await this.auditService.log({
      eventId: 'company_invitation.accepted',
      actorId: user.id,
      actorRole: invitation.role,
      action: 'accept_invitation',
      resourceType: 'company_member',
      resourceId: invitation.company_id,
      payload: { company_id: invitation.company_id, invitation_id: invitation.id },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    void this.notifyAdminsOfJoin(invitation.company_id, dto.email, invitation.role);
    void this.notifyInviteeOfAcceptance(invitation.company_id, dto.email, invitation.role);

    // Issue JWT pair with the new company context embedded so the user is
    // immediately logged into their company without an extra context-select step.
    const tokens = await this.authService.issueTokensForUser(user.id, user.email, {
      active_company_id: invitation.company_id,
      active_company_role: invitation.role,
      active_company_is_admin: invitation.is_admin,
    });

    return {
      user: this.usersService.sanitizeUser(user),
      tokens,
      company_id: invitation.company_id,
    };
  }

  async listInvitations(companyId: string) {
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        ci.id, ci.invited_email, ci.role, ci.is_admin, ci.status,
        ci.expires_at, ci.created_at, ci.revoked_at, ci.accepted_at,
        u.first_name  AS invited_by_first_name,
        u.last_name   AS invited_by_last_name,
        u.email       AS invited_by_email
      FROM identity.company_invitations ci
      LEFT JOIN identity.users u ON u.id = ci.invited_by
      WHERE ci.company_id = ${companyId}::uuid
        AND ci.status IN ('pending', 'revoked')
      ORDER BY ci.created_at DESC
    `;
  }

  async revoke(
    inviteId: string,
    companyId: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT id, status FROM identity.company_invitations
      WHERE id = ${inviteId}::uuid AND company_id = ${companyId}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException('Invitation not found');
    if (rows[0].status !== 'pending') {
      throw new BadRequestException('Invitation is no longer pending');
    }

    await this.prisma.$executeRaw`
      UPDATE identity.company_invitations
      SET status = 'revoked', revoked_at = NOW()
      WHERE id = ${inviteId}::uuid
    `;

    await this.auditService.log({
      eventId: 'company_invitation.revoked',
      actorId,
      actorRole: 'admin',
      action: 'revoke_invitation',
      resourceType: 'invitation',
      resourceId: inviteId,
      payload: { company_id: companyId },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return { success: true };
  }

  private async findValidInvitation(token: string): Promise<{
    id: string;
    company_id: string;
    invited_email: string;
    role: string;
    is_admin: boolean;
    permissions: unknown;
    expires_at: Date;
    status: string;
  }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        company_id: string;
        invited_email: string;
        role: string;
        is_admin: boolean;
        permissions: unknown;
        expires_at: Date;
        status: string;
      }>
    >`
      SELECT id, company_id, invited_email, role, is_admin, permissions, expires_at, status
      FROM identity.company_invitations
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;
    const inv = rows[0];
    if (!inv || inv.status !== 'pending') {
      throw new NotFoundException('Invitation is invalid or has expired');
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      throw new NotFoundException('Invitation has expired');
    }
    return inv;
  }

  private async notifyInviteeOfAcceptance(
    companyId: string,
    email: string,
    role: string,
  ) {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM identity.companies WHERE id = ${companyId}::uuid LIMIT 1
      `;
      if (!rows[0]) return;
      const companyName = rows[0].name;
      const loginUrl = `${this.frontendUrl}/login`;
      void this.notificationService.sendEmail(
        email,
        `Welcome to ${companyName} on PRIBEC`,
        `Congratulations! You have successfully accepted your invitation and joined "${companyName}" as ${role}.\n\nYou can now log in to access your company dashboard:\n${loginUrl}`,
      );
    } catch {
      // Non-critical — do not propagate
    }
  }

  private async notifyAdminsOfJoin(
    companyId: string,
    joinedEmail: string,
    role: string,
  ) {
    try {
      const result = await this.prisma.$queryRaw<Array<{ email: string }>>`
        SELECT u.email
        FROM identity.company_members cm
        JOIN identity.users u ON u.id = cm.user_id
        WHERE cm.company_id = ${companyId}::uuid
          AND cm.is_admin = true
          AND cm.status = 'active'
      `;
      const admins = Array.isArray(result) ? result : [];
      for (const admin of admins) {
        void this.notificationService.sendEmail(
          admin.email,
          'New team member joined',
          `${joinedEmail} has accepted an invitation and joined your company as ${role}.`,
        );
      }
    } catch {
      // Non-critical — do not propagate
    }
  }
}
