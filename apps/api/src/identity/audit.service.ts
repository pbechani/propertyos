import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database';

type AuditLogParams = {
  eventId?: string;
  actorId?: string | null;
  actorRole?: string | null;
  /** Active company context at the time of the action. */
  companyId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  payload?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceMetadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogParams): Promise<void> {
    const eventId = entry.eventId ?? randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO identity.audit_logs (
        event_id,
        actor_id,
        actor_role,
        company_id,
        action,
        resource_type,
        resource_id,
        payload,
        ip_address,
        user_agent,
        device_metadata
      ) VALUES (
        ${eventId},
        ${entry.actorId ?? null}::uuid,
        ${entry.actorRole ?? null},
        ${entry.companyId ?? null}::uuid,
        ${entry.action},
        ${entry.resourceType ?? null},
        ${entry.resourceId ?? null}::uuid,
        ${entry.payload ? JSON.stringify(entry.payload) : null}::jsonb,
        ${entry.ipAddress ?? null}::inet,
        ${entry.userAgent ?? null},
        ${entry.deviceMetadata ? JSON.stringify(entry.deviceMetadata) : null}::jsonb
      )
    `;
  }

  async findAdminLogs(filters: {
    actorId?: string;
    resourceType?: string;
    action?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<unknown[]> {
    const conditions: Prisma.Sql[] = [];

    if (filters.actorId) {
      conditions.push(Prisma.sql`actor_id = ${filters.actorId}::uuid`);
    }

    if (filters.resourceType) {
      conditions.push(Prisma.sql`resource_type = ${filters.resourceType}`);
    }

    if (filters.action) {
      conditions.push(Prisma.sql`action = ${filters.action}`);
    }

    if (filters.from) {
      conditions.push(Prisma.sql`created_at >= ${filters.from}::timestamptz`);
    }

    if (filters.to) {
      conditions.push(Prisma.sql`created_at <= ${filters.to}::timestamptz`);
    }

    const whereClause = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.sql``;

    const limit = filters.limit ? Math.min(filters.limit, 1000) : 200;
    const offset = filters.offset ?? 0;

    return this.prisma.$queryRaw`
      SELECT id, event_id, actor_id, actor_role, action, resource_type, resource_id, payload, ip_address, user_agent, device_metadata, created_at
      FROM identity.audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  async findByActor(
    actorId: string,
    limit: number = 200,
    offset: number = 0,
  ): Promise<unknown[]> {
    const safeLimit = Math.min(limit, 1000);
    return this.prisma.$queryRaw`
      SELECT id, event_id, actor_id, actor_role, action, resource_type, resource_id, payload, created_at
      FROM identity.audit_logs
      WHERE actor_id = ${actorId}::uuid
      ORDER BY created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;
  }

  async findByCompany(
    companyId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<unknown[]> {
    const safeLimit = Math.min(limit, 200);
    return this.prisma.$queryRaw`
      SELECT al.id, al.actor_id, al.actor_role, al.action, al.resource_type, al.resource_id, al.payload, al.created_at,
             u.first_name, u.last_name, u.email
      FROM identity.audit_logs al
      LEFT JOIN identity.users u ON u.id = al.actor_id
      WHERE al.company_id = ${companyId}::uuid
      ORDER BY al.created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;
  }

  async countTodayByCompany(companyId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ cnt: bigint }>>`
      SELECT COUNT(*) AS cnt
      FROM identity.audit_logs
      WHERE company_id = ${companyId}::uuid
        AND created_at >= CURRENT_DATE::timestamptz
    `;
    return Number(rows[0]?.cnt ?? 0);
  }
}
