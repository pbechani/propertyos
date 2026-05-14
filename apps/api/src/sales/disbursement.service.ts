// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Disbursement Service
// ─────────────────────────────────────────────────────────────────────────────
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { SalesAuditService } from './sales-audit.service';
import { CreateDisbursementInstructionDto, ApproveDisbursementDto } from './sales-enhanced.dto';

/**
 * South Africa transfer duty schedule 2024/25 (SARS).
 * Configurable per country — SA defaults applied here.
 */
export function calculateTransferDuty(purchasePrice: number): number {
  if (purchasePrice <= 1_100_000) return 0;
  if (purchasePrice <= 1_512_500) return (purchasePrice - 1_100_000) * 0.03;
  if (purchasePrice <= 2_117_500) return 12_375 + (purchasePrice - 1_512_500) * 0.06;
  if (purchasePrice <= 2_722_500) return 48_675 + (purchasePrice - 2_117_500) * 0.08;
  if (purchasePrice <= 12_100_000) return 97_075 + (purchasePrice - 2_722_500) * 0.11;
  return 1_128_600 + (purchasePrice - 12_100_000) * 0.13;
}

@Injectable()
export class DisbursementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: SalesAuditService,
  ) {}

  async createInstruction(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: CreateDisbursementInstructionDto,
    ip?: string,
    ua?: string,
  ) {
    await this.assertSaleExists(saleId);
    if (!actorRoles.some((r) => ['conveyancer', 'admin'].includes(r))) {
      throw new ForbiddenException(
        'Only conveyancers may create disbursement instructions',
      );
    }

    const existingBondSettlement = dto.existingBondSettlement ?? 0;
    const transferDutyPaid = dto.transferDutyPaid ?? 0;
    const conveyancerFees = dto.conveyancerFees ?? 0;
    const agentCommission = dto.agentCommission ?? 0;
    const ratesClearancePayment = dto.ratesClearancePayment ?? 0;
    const otherTotal = (dto.otherDeductions ?? []).reduce(
      (acc: number, d: { amount: number }) => acc + Number(d.amount),
      0,
    );

    const netProceedsToSeller =
      Number(dto.totalProceeds) -
      existingBondSettlement -
      transferDutyPaid -
      conveyancerFees -
      agentCommission -
      ratesClearancePayment -
      otherTotal;

    const instruction = await this.prisma.disbursementInstruction.create({
      data: {
        saleId,
        conveyancerId: actorId,
        totalProceeds: dto.totalProceeds,
        existingBondSettlement,
        transferDutyPaid,
        conveyancerFees,
        agentCommission,
        ratesClearancePayment,
        otherDeductions: (dto.otherDeductions ?? []) as unknown as Prisma.InputJsonValue,
        netProceedsToSeller,
        status: 'draft',
      },
    });

    await this.audit.log({
      action: 'disbursement.created',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'disbursement_instruction',
      resourceId: instruction.id,
      payload: { saleId, netProceedsToSeller },
      ipAddress: ip,
      userAgent: ua,
    });
    return instruction;
  }

  async getInstruction(saleId: string) {
    await this.assertSaleExists(saleId);
    const instr = await this.prisma.disbursementInstruction.findFirst({ where: { saleId } });
    if (!instr) throw new NotFoundException('No disbursement instruction for this sale');
    return instr;
  }

  async approveInstruction(
    saleId: string,
    instrId: string,
    actorId: string,
    actorRoles: string[],
    _dto: ApproveDisbursementDto,
    ip?: string,
    ua?: string,
  ) {
    const instr = await this.prisma.disbursementInstruction.findFirst({
      where: { id: instrId, saleId },
    });
    if (!instr) throw new NotFoundException('Disbursement instruction not found');
    if (!actorRoles.some((r) => ['conveyancer', 'admin'].includes(r))) {
      throw new ForbiddenException('Only conveyancers may approve disbursements');
    }
    if (instr.status !== 'draft') {
      throw new BadRequestException(`Instruction is already "${instr.status}"`);
    }

    const updated = await this.prisma.disbursementInstruction.update({
      where: { id: instrId },
      data: { status: 'approved_by_conveyancer', approvedAt: new Date() },
    });

    await this.audit.log({
      action: 'disbursement.approved',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'disbursement_instruction',
      resourceId: instrId,
      payload: { saleId },
      ipAddress: ip,
      userAgent: ua,
    });
    return updated;
  }

  /** Convenience: calculate transfer duty from a purchase price */
  calculateTransferDuty(purchasePrice: number) {
    return { purchasePrice, transferDuty: calculateTransferDuty(purchasePrice) };
  }

  private async assertSaleExists(saleId: string) {
    const sale = await this.prisma.propertySale.findUnique({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
  }
}
