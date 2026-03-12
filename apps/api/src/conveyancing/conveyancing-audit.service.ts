import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database';

interface AuditParams {
  actorId?: string;
  actorRole?: string;
  firmId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ConveyancingAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditParams): Promise<void> {
    const {
      actorId,
      actorRole,
      firmId,
      action,
      resourceType,
      resourceId,
      payload,
      ipAddress,
      userAgent,
    } = params;

    await this.prisma.$executeRaw`
      INSERT INTO conveyancing.audit_logs
        (actor_id, actor_role, firm_id, action, resource_type, resource_id, payload, ip_address, user_agent)
      VALUES (
        ${actorId ?? null}::uuid,
        ${actorRole ?? null},
        ${firmId ?? null}::uuid,
        ${action},
        ${resourceType ?? null},
        ${resourceId ?? null}::uuid,
        ${payload ? JSON.stringify(payload) : null}::jsonb,
        ${ipAddress ?? null}::inet,
        ${userAgent ?? null}
      )
    `;
  }
}
