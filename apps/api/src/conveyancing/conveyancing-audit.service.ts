import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';
import { type BaseAuditParams } from '../common';

export type ConveyancingAuditParams = Omit<BaseAuditParams, 'companyId'> & {
  firmId?: string;
};

/**
 * Conveyancing-scoped audit service — writes to conveyancing.audit_logs.
 * Uses `firm_id` column instead of `company_id`, so this cannot use BaseAuditService directly.
 */
@Injectable()
export class ConveyancingAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: ConveyancingAuditParams): Promise<void> {
    const eventId = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO conveyancing.audit_logs
        (event_id, actor_id, actor_role, firm_id, action, resource_type, resource_id, payload, ip_address, user_agent)
      VALUES (
        ${eventId}::uuid,
        ${params.actorId ?? null}::uuid,
        ${params.actorRole ?? null},
        ${params.firmId ?? null}::uuid,
        ${params.action},
        ${params.resourceType ?? null},
        ${params.resourceId ?? null}::uuid,
        ${params.payload ? JSON.stringify(params.payload) : null}::jsonb,
        ${params.ipAddress ?? null}::inet,
        ${params.userAgent ?? null}
      )
    `;
  }
}
