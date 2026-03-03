import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';

export interface SalesAuditParams {
  actorId?: string | null;
  actorRole?: string | null;
  companyId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  payload?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Sales-scoped audit service — writes to sales.audit_logs.
 * Modelled exactly after PropertyAuditService for consistency.
 * The underlying table is append-only (trigger blocks UPDATE / DELETE).
 */
@Injectable()
export class SalesAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: SalesAuditParams): Promise<void> {
    const eventId = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO sales.audit_logs (
        event_id,
        actor_id,
        actor_role,
        company_id,
        action,
        resource_type,
        resource_id,
        payload,
        ip_address,
        user_agent
      ) VALUES (
        ${eventId}::uuid,
        ${entry.actorId ?? null}::uuid,
        ${entry.actorRole ?? null},
        ${entry.companyId ?? null}::uuid,
        ${entry.action},
        ${entry.resourceType ?? null},
        ${entry.resourceId ?? null}::uuid,
        ${entry.payload ? JSON.stringify(entry.payload) : null}::jsonb,
        ${entry.ipAddress ?? null}::inet,
        ${entry.userAgent ?? null}
      )
    `;
  }
}
