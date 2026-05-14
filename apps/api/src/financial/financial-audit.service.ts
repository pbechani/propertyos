import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';

export interface FinancialAuditParams {
  actorId: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  amount?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Financial-scoped audit service — writes to financial.audit_logs.
 * The underlying table is append-only (DB trigger blocks UPDATE / DELETE).
 */
@Injectable()
export class FinancialAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: FinancialAuditParams): Promise<void> {
    const eventId = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO financial.audit_logs (
        event_id,
        actor_id,
        action,
        resource_type,
        resource_id,
        amount,
        currency,
        metadata,
        ip_address
      ) VALUES (
        ${eventId}::uuid,
        ${entry.actorId}::uuid,
        ${entry.action},
        ${entry.resourceType ?? null},
        ${entry.resourceId ?? null}::uuid,
        ${entry.amount ?? null},
        ${entry.currency ?? null},
        ${entry.metadata ? JSON.stringify(entry.metadata) : null}::jsonb,
        ${entry.ipAddress ?? null}::inet
      )
    `;
  }
}
