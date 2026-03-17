import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database';
import { BaseAuditService, type BaseAuditParams } from '../common';

export type PropertyAuditParams = BaseAuditParams;

/**
 * Property-scoped audit service — writes to property.audit_logs.
 * Distinct from identity.AuditService which writes to identity.audit_logs.
 */
@Injectable()
export class PropertyAuditService extends BaseAuditService {
  constructor(prisma: PrismaService) {
    super(prisma, 'property');
  }
}
