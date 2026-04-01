import { Injectable } from '@nestjs/common';
import { PrismaService as DatabaseService } from '../database';

interface AuditLogParams {
  actorId?: string;
  actorRole?: string;
  companyId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class MarketplaceAuditService {
  constructor(private readonly prisma: DatabaseService) {}

  async log(params: AuditLogParams): Promise<void> {
    await this.prisma.marketplaceAuditLog.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        companyId: params.companyId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        payload: params.payload as never,
        ipAddress: params.ipAddress,
      },
    });
  }
}
