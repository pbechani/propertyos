import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database';
import { BaseAuditService, type BaseAuditParams } from '../common';

export type SalesAuditParams = BaseAuditParams;

/**
 * Sales-scoped audit service — writes to sales.audit_logs.
 * The underlying table is append-only (trigger blocks UPDATE / DELETE).
 */
@Injectable()
export class SalesAuditService extends BaseAuditService {
  constructor(prisma: PrismaService) {
    super(prisma, 'sales');
  }
}
