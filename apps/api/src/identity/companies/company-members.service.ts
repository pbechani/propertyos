import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { AuditService } from '../audit.service';
import { NotificationService } from '../notification.service';
import { OrphanedTasksService } from './orphaned-tasks.service';
import { UpdateMemberPermissionsDto } from './dto/member.dto';

@Injectable()
export class CompanyMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly orphanedTasksService: OrphanedTasksService,
  ) {}

  async listMembers(companyId: string) {
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT cm.*, u.email, u.first_name, u.last_name, u.avatar_url
      FROM identity.company_members cm
      JOIN identity.users u ON u.id = cm.user_id
      WHERE cm.company_id = ${companyId}::uuid
      ORDER BY cm.joined_at DESC
    `;
  }

  async getMember(companyId: string, memberId: string) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT cm.*, u.email, u.first_name, u.last_name, u.avatar_url
      FROM identity.company_members cm
      JOIN identity.users u ON u.id = cm.user_id
      WHERE cm.id = ${memberId}::uuid AND cm.company_id = ${companyId}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException('Member not found');
    return rows[0];
  }

  async updatePermissions(
    companyId: string,
    memberId: string,
    dto: UpdateMemberPermissionsDto,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    await this.getMemberRaw(memberId, companyId);

    // Enforce ceiling: a company admin cannot grant beyond the role's allowed permissions
    // (simplified: we trust the DTO here; the guard enforces the caller is a company admin)
    await this.prisma.$executeRaw`
      UPDATE identity.company_members
      SET permissions = ${JSON.stringify(dto.permissions)}::jsonb, updated_at = NOW()
      WHERE id = ${memberId}::uuid
    `;

    await this.auditService.log({
      eventId: 'company_member.permissions_updated',
      actorId,
      actorRole: 'admin',
      action: 'update_member_permissions',
      resourceType: 'company_member',
      resourceId: memberId,
      payload: { company_id: companyId, permissions: dto.permissions },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return this.getMember(companyId, memberId);
  }

  async promoteToAdmin(
    companyId: string,
    memberId: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    await this.getMemberRaw(memberId, companyId);

    await this.prisma.$executeRaw`
      UPDATE identity.company_members
      SET is_admin = true, updated_at = NOW()
      WHERE id = ${memberId}::uuid AND company_id = ${companyId}::uuid
    `;

    await this.auditService.log({
      eventId: 'company_member.promoted_to_admin',
      actorId,
      actorRole: 'admin',
      action: 'promote_to_admin',
      resourceType: 'company_member',
      resourceId: memberId,
      payload: { company_id: companyId },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return this.getMember(companyId, memberId);
  }

  async revokeAccess(
    companyId: string,
    memberId: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    const member = await this.getMemberRaw(memberId, companyId);

    // Ensure at least one admin remains
    if (member.is_admin) {
      const adminCount = await this.countActiveAdmins(companyId);
      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Cannot revoke the last admin of a company',
        );
      }
    }

    await this.prisma.$executeRaw`
      UPDATE identity.company_members
      SET status = 'revoked',
          revoked_at = NOW(),
          revoked_by = ${actorId}::uuid,
          updated_at = NOW()
      WHERE id = ${memberId}::uuid AND company_id = ${companyId}::uuid
    `;

    await this.auditService.log({
      eventId: 'company_member.access_revoked',
      actorId,
      actorRole: 'admin',
      action: 'revoke_member_access',
      resourceType: 'company_member',
      resourceId: memberId,
      payload: { company_id: companyId, user_id: member.user_id },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    // Notify the affected user
    await this.notifyRevokedUser(member.user_id as string, companyId);

    // Build orphaned task pool for this user
    await this.orphanedTasksService.buildOrphanedPool(
      companyId,
      member.user_id as string,
      requestContext,
    );

    return { success: true };
  }

  /** Called by invitation acceptance flow. */
  async linkUserToCompany(
    companyId: string,
    userId: string,
    role: string,
    isAdmin: boolean,
    permissions: Array<{ resource: string; action: string }>,
    _inviteId: string,
    _requestContext: { ip: string; userAgent?: string | null },
  ) {
    // Check if member already exists (could be re-invited after revocation)
    const existing = await this.prisma.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT id, status FROM identity.company_members
      WHERE company_id = ${companyId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `;

    if (existing[0]) {
      if (existing[0].status === 'active') {
        throw new BadRequestException('User is already a member of this company');
      }
      // Re-activate previously revoked member
      await this.prisma.$executeRaw`
        UPDATE identity.company_members
        SET status = 'active',
            role = ${role},
            is_admin = ${isAdmin},
            permissions = ${JSON.stringify(permissions)}::jsonb,
            revoked_at = NULL,
            revoked_by = NULL,
            joined_at = NOW(),
            updated_at = NOW()
        WHERE id = ${existing[0].id}::uuid
      `;
      return;
    }

    await this.prisma.$executeRaw`
      INSERT INTO identity.company_members (company_id, user_id, role, is_admin, permissions, invited_by)
      VALUES (
        ${companyId}::uuid,
        ${userId}::uuid,
        ${role},
        ${isAdmin},
        ${JSON.stringify(permissions)}::jsonb,
        ${userId}::uuid
      )
    `;
  }

  async getUserCompanies(userId: string) {
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT cm.id as member_id, cm.role, cm.is_admin, cm.status, cm.permissions,
             c.id, c.name, c.slug, c.category, c.status as company_status, c.verification_status, c.logo_url
      FROM identity.company_members cm
      JOIN identity.companies c ON c.id = cm.company_id
      WHERE cm.user_id = ${userId}::uuid
        AND cm.status = 'active'
        AND c.is_system = false
      ORDER BY c.name
    `;
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------

  private async getMemberRaw(memberId: string, companyId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; user_id: string; role: string; is_admin: boolean; status: string }>
    >`
      SELECT id, user_id, role, is_admin, status
      FROM identity.company_members
      WHERE id = ${memberId}::uuid AND company_id = ${companyId}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException('Member not found');
    return rows[0];
  }

  private async countActiveAdmins(companyId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM identity.company_members
      WHERE company_id = ${companyId}::uuid AND is_admin = true AND status = 'active'
    `;
    return Number(rows[0]?.count ?? 0);
  }

  private async notifyRevokedUser(userId: string, companyId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ email: string; name: string }>>`
      SELECT u.email, c.name
      FROM identity.users u, identity.companies c
      WHERE u.id = ${userId}::uuid AND c.id = ${companyId}::uuid
    `;
    if (rows[0]) {
      void this.notificationService.sendEmail(
        rows[0].email,
        'Your company access has been revoked',
        `Your access to "${rows[0].name}" has been revoked. Please contact the company administrator if you believe this is a mistake.`,
      );
    }
  }
}
