import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';

export interface PropertyAuditParams {
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
}

/**
 * Property-scoped audit service — writes to property.audit_logs.
 * Distinct from identity.AuditService which writes to identity.audit_logs.
 */
@Injectable()
export class PropertyAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: PropertyAuditParams): Promise<void> {
    const eventId = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO property.audit_logs (
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
        ${eventId},
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
