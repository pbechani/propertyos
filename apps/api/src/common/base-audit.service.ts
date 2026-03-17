import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';

/**
 * Base audit params — superset of all schema-specific audit interfaces.
 * Each concrete audit service picks the fields it needs.
 */
export interface BaseAuditParams {
  actorId?: string | null;
  actorRole?: string | null;
  companyId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  payload?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Financial audit extras */
  amount?: number | null;
  currency?: string | null;
}

/**
 * Base audit service that writes to a schema-qualified audit_logs table.
 * Subclass and pass the schema name to eliminate duplicate INSERT logic
 * found in PropertyAuditService, SalesAuditService, ConveyancingAuditService,
 * and FinancialAuditService.
 *
 * Usage:
 * ```ts
 * @Injectable()
 * export class PropertyAuditService extends BaseAuditService {
 *   constructor(prisma: PrismaService) { super(prisma, 'property'); }
 * }
 * ```
 */
@Injectable()
export abstract class BaseAuditService {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly schema: string,
  ) {}

  async log(entry: BaseAuditParams): Promise<void> {
    const eventId = randomUUID();
    const table = `${this.schema}.audit_logs`;

    // Use a parameterized raw query.
    // Prisma's $executeRawUnsafe is used because the table name is NOT user input —
    // it's set at construction from a trusted string literal in each subclass.
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO ${table} (
        event_id, actor_id, actor_role, company_id, action,
        resource_type, resource_id, payload, ip_address, user_agent
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4::uuid, $5,
        $6, $7::uuid, $8::jsonb, $9::inet, $10
      )`,
      eventId,
      entry.actorId ?? null,
      entry.actorRole ?? null,
      entry.companyId ?? null,
      entry.action,
      entry.resourceType ?? null,
      entry.resourceId ?? null,
      entry.payload ? JSON.stringify(entry.payload) : null,
      entry.ipAddress ?? null,
      entry.userAgent ?? null,
    );
  }
}
