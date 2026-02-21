import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database';

type AuditLogParams = {
  eventId: string;
  actorId?: string | null;
  actorRole?: string | null;
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
    await this.prisma.$executeRaw`
      INSERT INTO identity.audit_logs (
        event_id,
        actor_id,
        actor_role,
        action,
        resource_type,
        resource_id,
        payload,
        ip_address,
        user_agent,
        device_metadata
      ) VALUES (
        ${entry.eventId},
        ${entry.actorId ?? null}::uuid,
        ${entry.actorRole ?? null},
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
    from?: string;
    to?: string;
  }): Promise<unknown[]> {
    const conditions: Prisma.Sql[] = [];

    if (filters.actorId) {
      conditions.push(Prisma.sql`actor_id = ${filters.actorId}::uuid`);
    }

    if (filters.resourceType) {
      conditions.push(Prisma.sql`resource_type = ${filters.resourceType}`);
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

    return this.prisma.$queryRaw`
      SELECT id, event_id, actor_id, actor_role, action, resource_type, resource_id, payload, ip_address, user_agent, device_metadata, created_at
      FROM identity.audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 200
    `;
  }

  async findByActor(actorId: string): Promise<unknown[]> {
    return this.prisma.$queryRaw`
      SELECT id, event_id, actor_id, actor_role, action, resource_type, resource_id, payload, created_at
      FROM identity.audit_logs
      WHERE actor_id = ${actorId}::uuid
      ORDER BY created_at DESC
      LIMIT 200
    `;
  }
}
