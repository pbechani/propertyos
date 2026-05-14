// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Post-Sale Checklist Service
// ─────────────────────────────────────────────────────────────────────────────
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SalesAuditService } from './sales-audit.service';
import { UpdatePostSaleChecklistDto } from './sales-enhanced.dto';

@Injectable()
export class PostSaleChecklistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: SalesAuditService,
  ) {}

  async getOrCreate(saleId: string) {
    const sale = await this.prisma.propertySale.findUnique({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');

    const existing = await this.prisma.postSaleChecklist.findUnique({ where: { saleId } });
    if (existing) return existing;

    return this.prisma.postSaleChecklist.create({ data: { saleId } });
  }

  async update(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: UpdatePostSaleChecklistDto,
    ip?: string,
    ua?: string,
  ) {
    if (!actorRoles.some((r) => ['conveyancer', 'agent', 'admin'].includes(r))) {
      throw new ForbiddenException('Insufficient permissions to update post-sale checklist');
    }

    await this.getOrCreate(saleId);

    const updated = await this.prisma.postSaleChecklist.update({
      where: { saleId },
      data: {
        keysHandoverConfirmed: dto.keysHandoverConfirmed,
        keysHandoverAt:
          dto.keysHandoverConfirmed === true && !dto.keysHandoverAt
            ? new Date()
            : dto.keysHandoverAt
              ? new Date(dto.keysHandoverAt)
              : undefined,
        titleDeedReceivedByBuyer: dto.titleDeedReceivedByBuyer,
        titleDeedReceivedAt: dto.titleDeedReceivedAt
          ? new Date(dto.titleDeedReceivedAt)
          : undefined,
        newBondRegistered: dto.newBondRegistered,
        sellerProceedsPaid: dto.sellerProceedsPaid,
        agentCommissionPaid: dto.agentCommissionPaid,
        listingArchived: dto.listingArchived,
        ownershipRegistryUpdated: dto.ownershipRegistryUpdated,
        buyerReviewSubmitted: dto.buyerReviewSubmitted,
        sellerReviewSubmitted: dto.sellerReviewSubmitted,
      },
    });

    await this.audit.log({
      action: 'post_sale_checklist.updated',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'sale',
      resourceId: saleId,
      payload: { fields: Object.keys(dto) },
      ipAddress: ip,
      userAgent: ua,
    });
    return updated;
  }
}
