import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../database';
import { AuditService } from '../audit.service';
import { NotificationService } from '../notification.service';
import { ConfigService } from '@nestjs/config';
import { InviteMemberDto } from './dto/member.dto';
import { CompanyMembersService } from './company-members.service';

const INVITE_EXPIRY_HOURS = 72;

@Injectable()
export class CompanyInvitationsService {
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    private readonly membersService: CompanyMembersService,
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

    const inviteLink = `${this.frontendUrl}/invitations/${rawToken}/accept`;
    void this.notificationService.sendEmail(
      dto.email,
      `You're invited to join ${company[0].name} on PRIBEC`,
      `You have been invited to join "${company[0].name}" as a ${dto.role}.\n\nAccept your invitation here (valid for ${INVITE_EXPIRY_HOURS} hours):\n${inviteLink}`,
    );

    return { invitee_email: dto.email, expires_at: expiresAt };
  }

  async preview(token: string) {
    const invitation = await this.findValidInvitation(token);
    return { ...invitation };
  }

  async accept(
    token: string,
    userId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    const invitation = await this.findValidInvitation(token);
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

    // Notify company admins
    void this.notifyAdminsOfJoin(invitation.company_id, invitation.invited_email, invitation.role);

    return { success: true, company_id: invitation.company_id };
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
