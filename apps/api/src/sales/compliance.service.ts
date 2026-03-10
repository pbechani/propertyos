// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Compliance Requirements Service
// ─────────────────────────────────────────────────────────────────────────────
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SalesAuditService } from './sales-audit.service';
import {
  SetupComplianceRequirementsDto,
  UpdateComplianceStatusDto,
} from './sales-enhanced.dto';

export const CERT_TYPES = [
  'electrical',
  'plumbing',
  'gas',
  'electric_fence',
  'beetle',
  'rates_clearance',
] as const;
export type CertType = (typeof CERT_TYPES)[number];

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: SalesAuditService,
  ) {}

  async setupRequirements(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: SetupComplianceRequirementsDto,
    ip?: string,
    ua?: string,
  ) {
    await this.assertSaleExists(saleId);
    if (!actorRoles.some((r) => ['conveyancer', 'admin'].includes(r))) {
      throw new ForbiddenException('Only conveyancers may setup compliance requirements');
    }

    const created = await Promise.all(
      dto.requirements.map((req) =>
        this.prisma.complianceRequirement.upsert({
          where: {
            saleId_certType: { saleId, certType: req.certType },
          },
          create: {
            saleId,
            certType: req.certType,
            isRequired: req.isRequired ?? true,
            requiredBy: req.requiredBy,
            dueByStage: req.dueByStage,
            deadlineDate: req.deadlineDate ? new Date(req.deadlineDate) : null,
            waiverReason: req.waiverReason,
          },
          update: {
            isRequired: req.isRequired ?? true,
            requiredBy: req.requiredBy,
            dueByStage: req.dueByStage,
            deadlineDate: req.deadlineDate ? new Date(req.deadlineDate) : null,
            waiverReason: req.waiverReason,
          },
        }),
      ),
    );

    await this.audit.log({
      action: 'compliance.requirements_setup',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'sale',
      resourceId: saleId,
      payload: { count: created.length },
      ipAddress: ip,
      userAgent: ua,
    });
    return created;
  }

  async updateCertStatus(
    saleId: string,
    certType: string,
    actorId: string,
    actorRoles: string[],
    dto: UpdateComplianceStatusDto,
    ip?: string,
    ua?: string,
  ) {
    const req = await this.prisma.complianceRequirement.findFirst({
      where: { saleId, certType },
    });
    if (!req) throw new NotFoundException(`Compliance requirement "${certType}" not found`);

    if (!actorRoles.some((r) => ['conveyancer', 'admin'].includes(r))) {
      throw new ForbiddenException('Only conveyancers may update compliance status');
    }

    const validStatuses = ['pending', 'booked', 'received', 'verified', 'waived'];
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException(`Invalid status "${dto.status}"`);
    }

    const updated = await this.prisma.complianceRequirement.update({
      where: { id: req.id },
      data: {
        status: dto.status,
        certificateId: dto.certificateId,
        waiverReason: dto.waiverReason,
      },
    });

    await this.audit.log({
      action: 'compliance.status_updated',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'compliance_requirement',
      resourceId: req.id,
      payload: { saleId, certType, status: dto.status },
      ipAddress: ip,
      userAgent: ua,
    });
    return updated;
  }

  async getComplianceStatus(saleId: string) {
    await this.assertSaleExists(saleId);
    return this.prisma.complianceRequirement.findMany({ where: { saleId } });
  }

  private async assertSaleExists(saleId: string) {
    const sale = await this.prisma.propertySale.findUnique({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
  }
}
