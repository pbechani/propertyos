import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AuditService } from '../audit.service';

export type TaskStatus = 'unassigned' | 'assigned' | 'closed';

@Injectable()
export class OrphanedTasksService {
  private readonly logger = new Logger(OrphanedTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * After a member is revoked, scan their open resources and populate
   * the orphaned task pool for this company.
   */
  async buildOrphanedPool(
    companyId: string,
    revokedUserId: string,
    _requestContext: { ip: string; userAgent?: string | null },
  ): Promise<void> {
    // Detect open property listings created by this agent under the company
    const listings = await this.prisma.$queryRaw<
      Array<{ id: string; title: string }>
    >`
      SELECT id, title
      FROM property.properties
      WHERE agent_id = ${revokedUserId}::uuid
        AND status NOT IN ('sold', 'withdrawn')
    `;

    for (const listing of listings) {
      await this.prisma.$executeRaw`
        INSERT INTO identity.company_orphaned_tasks (
          company_id, original_user_id, resource_type,
          resource_id, description, requires_notification
        ) VALUES (
          ${companyId}::uuid,
          ${revokedUserId}::uuid,
          'property_listing',
          ${listing.id}::uuid,
          ${'Active listing: ' + listing.title},
          true
        )
        ON CONFLICT DO NOTHING
      `;

      await this.auditService.log({
        eventId: 'orphaned_task.created',
        actorId: revokedUserId,
        actorRole: 'system',
        action: 'create_orphaned_task',
        resourceType: 'orphaned_task',
        resourceId: listing.id,
        payload: { company_id: companyId, resource_type: 'property_listing', resource_id: listing.id },
        ipAddress: _requestContext.ip,
        userAgent: _requestContext.userAgent,
      });
    }

    this.logger.log(
      `Orphaned task pool built for user ${revokedUserId} in company ${companyId}: ${listings.length} listings`,
    );
  }

  async list(companyId: string, status?: TaskStatus) {
    if (status) {
      return this.prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT ot.*,
               ou.email as original_user_email,
               au.email as assignee_email
        FROM identity.company_orphaned_tasks ot
        JOIN identity.users ou ON ou.id = ot.original_user_id
        LEFT JOIN identity.users au ON au.id = ot.assignee_id
        WHERE ot.company_id = ${companyId}::uuid
          AND ot.status = ${status}
        ORDER BY ot.created_at DESC
      `;
    }

    return this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT ot.*,
             ou.email as original_user_email,
             au.email as assignee_email
      FROM identity.company_orphaned_tasks ot
      JOIN identity.users ou ON ou.id = ot.original_user_id
      LEFT JOIN identity.users au ON au.id = ot.assignee_id
      WHERE ot.company_id = ${companyId}::uuid
      ORDER BY ot.created_at DESC
    `;
  }

  async assign(
    companyId: string,
    taskId: string,
    assigneeId: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    await this.findTask(taskId, companyId);

    // Validate assignee is an active member
    const member = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM identity.company_members
      WHERE company_id = ${companyId}::uuid AND user_id = ${assigneeId}::uuid AND status = 'active'
      LIMIT 1
    `;
    if (!member[0]) {
      throw new BadRequestException('Assignee is not an active member of this company');
    }

    await this.prisma.$executeRaw`
      UPDATE identity.company_orphaned_tasks
      SET assignee_id = ${assigneeId}::uuid,
          status = 'assigned',
          assigned_at = NOW(),
          updated_at = NOW()
      WHERE id = ${taskId}::uuid
    `;

    await this.auditService.log({
      eventId: 'orphaned_task.assigned',
      actorId,
      actorRole: 'admin',
      action: 'assign_orphaned_task',
      resourceType: 'orphaned_task',
      resourceId: taskId,
      payload: { company_id: companyId, assignee_id: assigneeId },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return { success: true };
  }

  async close(
    companyId: string,
    taskId: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    await this.findTask(taskId, companyId);

    await this.prisma.$executeRaw`
      UPDATE identity.company_orphaned_tasks
      SET status = 'closed',
          closed_at = NOW(),
          closed_by = ${actorId}::uuid,
          updated_at = NOW()
      WHERE id = ${taskId}::uuid
    `;

    await this.auditService.log({
      eventId: 'orphaned_task.closed',
      actorId,
      actorRole: 'admin',
      action: 'close_orphaned_task',
      resourceType: 'orphaned_task',
      resourceId: taskId,
      payload: { company_id: companyId },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return { success: true };
  }

  private async findTask(taskId: string, companyId: string) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT * FROM identity.company_orphaned_tasks
      WHERE id = ${taskId}::uuid AND company_id = ${companyId}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException('Orphaned task not found');
    return rows[0];
  }
}
