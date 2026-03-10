// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Bond Application Service
// ─────────────────────────────────────────────────────────────────────────────
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { SalesAuditService } from './sales-audit.service';
import { CreateBondApplicationDto, UpdateBondApplicationDto } from './sales-enhanced.dto';

@Injectable()
export class BondApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: SalesAuditService,
  ) {}

  async createBondApplication(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: CreateBondApplicationDto,
    ip?: string,
    ua?: string,
  ) {
    await this.assertSaleExists(saleId);
    if (!actorRoles.some((r) => ['buyer', 'mortgage_broker', 'agent', 'admin'].includes(r))) {
      throw new ForbiddenException('Insufficient permissions to submit bond application');
    }

    const existing = await this.prisma.bondApplication.findFirst({ where: { saleId } });
    if (existing) {
      throw new BadRequestException('A bond application for this sale already exists');
    }

    const app = await this.prisma.bondApplication.create({
      data: {
        saleId,
        buyerId: dto.buyerId,
        mortgageBrokerId: dto.mortgageBrokerId,
        banksAppliedTo: (dto.banksAppliedTo ?? []) as unknown as Prisma.InputJsonValue,
        originator: dto.originator,
        loanAmount: dto.loanAmount,
        propertyValueUsed: dto.propertyValueUsed,
        ltvPct: dto.ltvPct,
        status: 'in_progress',
      },
    });

    await this.audit.log({
      action: 'bond_application.created',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'bond_application',
      resourceId: app.id,
      payload: { saleId },
      ipAddress: ip,
      userAgent: ua,
    });
    return app;
  }

  async updateBondApplication(
    saleId: string,
    appId: string,
    actorId: string,
    actorRoles: string[],
    dto: UpdateBondApplicationDto,
    ip?: string,
    ua?: string,
  ) {
    const app = await this.findApp(appId, saleId);
    if (!actorRoles.some((r) => ['buyer', 'mortgage_broker', 'agent', 'admin'].includes(r))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const validStatuses = [
      'in_progress',
      'approved',
      'approved_with_conditions',
      'declined',
    ];
    if (dto.status && !validStatuses.includes(dto.status)) {
      throw new BadRequestException(`Invalid status "${dto.status}"`);
    }

    const updated = await this.prisma.bondApplication.update({
      where: { id: appId },
      data: {
        banksAppliedTo: (dto.banksAppliedTo ?? app.banksAppliedTo) as unknown as Prisma.InputJsonValue,
        status: dto.status ?? app.status,
        approvedAmount: dto.approvedAmount,
        interestRatePct: dto.interestRatePct,
        loanTermYears: dto.loanTermYears,
        conditions: (dto.conditions ?? app.conditions) as unknown as Prisma.InputJsonValue,
        grantCertificateUrl: dto.grantCertificateUrl,
        approvedAt: dto.status?.startsWith('approved') ? new Date() : app.approvedAt,
        declinedReason: dto.declinedReason,
      },
    });

    await this.audit.log({
      action: 'bond_application.updated',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'bond_application',
      resourceId: appId,
      payload: { saleId, status: updated.status },
      ipAddress: ip,
      userAgent: ua,
    });
    return updated;
  }

  async getBondApplication(saleId: string) {
    await this.assertSaleExists(saleId);
    const app = await this.prisma.bondApplication.findFirst({ where: { saleId } });
    if (!app) throw new NotFoundException('No bond application found for this sale');
    return app;
  }

  private async findApp(appId: string, saleId: string) {
    const app = await this.prisma.bondApplication.findFirst({
      where: { id: appId, saleId },
    });
    if (!app) throw new NotFoundException('Bond application not found');
    return app;
  }

  private async assertSaleExists(saleId: string) {
    const sale = await this.prisma.propertySale.findUnique({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
  }
}
