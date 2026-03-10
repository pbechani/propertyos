// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Seller Disclosure Service
// ─────────────────────────────────────────────────────────────────────────────
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SalesAuditService } from './sales-audit.service';
import { CreateSellerDisclosureDto, SignSellerDisclosureDto } from './sales-enhanced.dto';

@Injectable()
export class SellerDisclosureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: SalesAuditService,
  ) {}

  async createDisclosure(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: CreateSellerDisclosureDto,
    ip?: string,
    ua?: string,
  ) {
    await this.assertSaleExists(saleId);
    if (!actorRoles.some((r) => ['seller', 'agent', 'admin'].includes(r))) {
      throw new ForbiddenException('Only the seller (or their agent) may submit a disclosure');
    }

    const existing = await this.prisma.sellerDisclosure.findUnique({ where: { saleId } });
    if (existing) {
      throw new BadRequestException('A seller disclosure for this sale already exists');
    }

    const disclosure = await this.prisma.sellerDisclosure.create({
      data: {
        saleId,
        sellerId: actorId,
        structuralDefectsKnown: dto.structuralDefectsKnown,
        structuralDefectsDescription: dto.structuralDefectsDescription,
        waterLeakHistory: dto.waterLeakHistory,
        waterLeakDescription: dto.waterLeakDescription,
        pestInfestationHistory: dto.pestInfestationHistory,
        pestDescription: dto.pestDescription,
        boundaryDisputes: dto.boundaryDisputes,
        neighbourRelationsNotes: dto.neighbourRelationsNotes,
        bodyCorporateDisputes: dto.bodyCorporateDisputes,
        outstandingLevies: dto.outstandingLevies,
        interdictsOrCourtOrders: dto.interdictsOrCourtOrders ?? false,
        pendingLitigation: dto.pendingLitigation ?? false,
        approvedBuildingPlans: dto.approvedBuildingPlans,
        unauthorisedStructures: dto.unauthorisedStructures,
        unauthorisedStructuresDescription: dto.unauthorisedStructuresDescription,
      },
    });

    await this.audit.log({
      action: 'seller_disclosure.created',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'seller_disclosure',
      resourceId: disclosure.id,
      payload: { saleId },
      ipAddress: ip,
      userAgent: ua,
    });
    return disclosure;
  }

  async getDisclosure(saleId: string) {
    const d = await this.prisma.sellerDisclosure.findUnique({ where: { saleId } });
    if (!d) throw new NotFoundException('No seller disclosure found for this sale');
    return d;
  }

  async signDisclosure(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: SignSellerDisclosureDto,
    ip?: string,
    ua?: string,
  ) {
    const d = await this.getDisclosure(saleId);
    if (d.signedBySellerAt) {
      throw new BadRequestException('Disclosure already signed');
    }
    if (!actorRoles.some((r) => ['seller', 'admin'].includes(r))) {
      throw new ForbiddenException('Only the seller may sign the disclosure');
    }

    const updated = await this.prisma.sellerDisclosure.update({
      where: { saleId },
      data: {
        signedBySellerAt: new Date(),
        disclosureDocumentUrl: dto.disclosureDocumentUrl,
        hash: dto.hash,
      },
    });

    await this.audit.log({
      action: 'seller_disclosure.signed',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'seller_disclosure',
      resourceId: d.id,
      payload: { saleId },
      ipAddress: ip,
      userAgent: ua,
    });
    return updated;
  }

  private async assertSaleExists(saleId: string) {
    const sale = await this.prisma.propertySale.findUnique({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
  }
}
