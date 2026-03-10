// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — OTP (Offer to Purchase) Service
// ─────────────────────────────────────────────────────────────────────────────
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { SalesAuditService } from './sales-audit.service';
import { CreateOtpDto, CounterOfferDto, SignOtpDto, WithdrawOtpDto } from './sales-enhanced.dto';

/** Utility: generate a human-readable OTP reference e.g. OTP-20260310-A1B2 */
function generateOtpReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `OTP-${date}-${suffix}`;
}

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: SalesAuditService,
  ) {}

  // ── Create initial OTP ────────────────────────────────────────────────────

  async createOtp(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: CreateOtpDto,
    ip?: string,
    ua?: string,
  ) {
    await this.assertSaleExists(saleId);
    if (!actorRoles.some((r) => ['agent', 'admin'].includes(r))) {
      throw new ForbiddenException('Only agents may generate an OTP');
    }

    const otp = await this.prisma.offerToPurchase.create({
      data: {
        saleId,
        otpReference: generateOtpReference(),
        version: 1,
        isCounterOffer: false,
        offeredPrice: dto.offeredPrice,
        currency: dto.currency ?? 'ZAR',
        depositAmount: dto.depositAmount,
        depositDueDays: dto.depositDueDays ?? 7,
        occupationalDate: dto.occupationalDate ? new Date(dto.occupationalDate) : null,
        occupationalRentalPerDay: dto.occupationalRentalPerDay,
        bondCondition: dto.bondCondition ?? true,
        bondAmount: dto.bondAmount,
        bondInstitution: dto.bondInstitution ?? 'any',
        bondDeadlineDays: dto.bondDeadlineDays ?? 30,
        inspectionCondition: dto.inspectionCondition ?? false,
        inspectionDeadlineDays: dto.inspectionDeadlineDays,
        subjectToSale: dto.subjectToSale ?? false,
        subjectToSaleDeadlineDate: dto.subjectToSaleDeadlineDate
          ? new Date(dto.subjectToSaleDeadlineDate)
          : null,
        voetstoetsAccepted: dto.voetstoetsAccepted ?? false,
        sellerDisclosureUrl: dto.sellerDisclosureUrl,
        offerValidUntil: new Date(dto.offerValidUntil),
        buyerId: dto.buyerId,
        sellerId: dto.sellerId,
        status: 'pending',
      },
    });

    await this.audit.log({
      action: 'otp.created',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'offer_to_purchase',
      resourceId: otp.id,
      payload: { saleId, reference: otp.otpReference },
      ipAddress: ip,
      userAgent: ua,
    });

    return otp;
  }

  // ── List OTP versions for a sale ──────────────────────────────────────────

  async listVersions(saleId: string) {
    await this.assertSaleExists(saleId);
    return this.prisma.offerToPurchase.findMany({
      where: { saleId },
      orderBy: { version: 'asc' },
    });
  }

  // ── Sign OTP (buyer or seller) ────────────────────────────────────────────

  async signOtp(
    saleId: string,
    otpId: string,
    actorId: string,
    actorRoles: string[],
    dto: SignOtpDto,
    ip?: string,
    ua?: string,
  ) {
    const otp = await this.findOtp(otpId, saleId);
    const now = new Date();
    if (otp.status !== 'pending') {
      throw new BadRequestException(`OTP is in status "${otp.status}", cannot sign`);
    }
    if (now > otp.offerValidUntil) {
      throw new BadRequestException('OTP has expired');
    }

    const isBuyer = actorRoles.includes('buyer') || actorRoles.includes('agent');
    const isSeller = actorRoles.includes('seller');

    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('Only buyer or seller may sign an OTP');
    }

    const update: Record<string, unknown> = {};
    if (isBuyer && !otp.buyerSignedAt) {
      update.buyerSignedAt = now;
      update.buyerSignatureUrl = dto.signatureUrl;
    } else if (isSeller && !otp.sellerSignedAt) {
      update.sellerSignedAt = now;
      update.sellerSignatureUrl = dto.signatureUrl;
    }

    // Both parties signed → accept
    const tentative = { ...otp, ...update };
    if (tentative.buyerSignedAt && tentative.sellerSignedAt) {
      update.status = 'accepted';
      update.acceptedAt = now;
    }

    const updated = await this.prisma.offerToPurchase.update({
      where: { id: otpId },
      data: update,
    });

    await this.audit.log({
      action: 'otp.signed',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'offer_to_purchase',
      resourceId: otpId,
      payload: { saleId, by: isBuyer ? 'buyer' : 'seller', status: updated.status },
      ipAddress: ip,
      userAgent: ua,
    });
    return updated;
  }

  // ── Counter-offer ─────────────────────────────────────────────────────────

  async counterOffer(
    saleId: string,
    otpId: string,
    actorId: string,
    actorRoles: string[],
    dto: CounterOfferDto,
    ip?: string,
    ua?: string,
  ) {
    const original = await this.findOtp(otpId, saleId);
    if (!['pending', 'accepted'].includes(original.status)) {
      throw new BadRequestException('Can only counter a pending or accepted OTP');
    }

    // Reject original
    await this.prisma.offerToPurchase.update({
      where: { id: otpId },
      data: { status: 'countered', rejectedAt: new Date() },
    });

    const counterVersion = original.version + 1;
    const counter = await this.prisma.offerToPurchase.create({
      data: {
        saleId,
        otpReference: generateOtpReference(),
        version: counterVersion,
        isCounterOffer: true,
        parentOtpId: otpId,
        offeredPrice: dto.offeredPrice,
        currency: original.currency,
        depositAmount: dto.depositAmount ?? original.depositAmount,
        depositDueDays: dto.depositDueDays ?? original.depositDueDays,
        occupationalDate: dto.occupationalDate
          ? new Date(dto.occupationalDate)
          : original.occupationalDate,
        bondCondition: original.bondCondition,
        bondAmount: original.bondAmount,
        bondInstitution: original.bondInstitution,
        bondDeadlineDays: original.bondDeadlineDays,
        inspectionCondition: original.inspectionCondition,
        subjectToSale: original.subjectToSale,
        voetstoetsAccepted: original.voetstoetsAccepted,
        offerValidUntil: new Date(dto.offerValidUntil),
        buyerId: original.buyerId,
        sellerId: original.sellerId,
        status: 'pending',
      },
    });

    // Record negotiation round
    await this.prisma.otpNegotiation.create({
      data: {
        saleId,
        roundNumber: counterVersion,
        otpId: counter.id,
        submittedById: actorId,
        submittedByRole: actorRoles.includes('seller') ? 'seller' : 'buyer',
        summary: dto.summary,
        changesFromPrevious: (dto.changes ?? {}) as unknown as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      action: 'otp.counter_offer',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'offer_to_purchase',
      resourceId: counter.id,
      payload: { saleId, parentOtpId: otpId, newVersion: counterVersion },
      ipAddress: ip,
      userAgent: ua,
    });
    return counter;
  }

  // ── Withdraw OTP ──────────────────────────────────────────────────────────

  async withdrawOtp(
    saleId: string,
    otpId: string,
    actorId: string,
    actorRoles: string[],
    dto: WithdrawOtpDto,
    ip?: string,
    ua?: string,
  ) {
    const otp = await this.findOtp(otpId, saleId);
    if (otp.status !== 'pending') {
      throw new BadRequestException('Only pending OTPs can be withdrawn');
    }
    if (!actorRoles.includes('buyer') && !actorRoles.includes('agent')) {
      throw new ForbiddenException('Only the buyer (or their agent) may withdraw an OTP');
    }

    const updated = await this.prisma.offerToPurchase.update({
      where: { id: otpId },
      data: { status: 'withdrawn', rejectedReason: dto.reason, rejectedAt: new Date() },
    });

    await this.audit.log({
      action: 'otp.withdrawn',
      actorId,
      actorRole: actorRoles[0],
      resourceType: 'offer_to_purchase',
      resourceId: otpId,
      payload: { saleId, reason: dto.reason },
      ipAddress: ip,
      userAgent: ua,
    });
    return updated;
  }

  // ── Compare all offers for a sale (seller view) ───────────────────────────

  async compareOffers(saleId: string) {
    await this.assertSaleExists(saleId);
    return this.prisma.offerToPurchase.findMany({
      where: { saleId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findOtp(otpId: string, saleId: string) {
    const otp = await this.prisma.offerToPurchase.findFirst({
      where: { id: otpId, saleId },
    });
    if (!otp) throw new NotFoundException('OTP not found');
    return otp;
  }

  private async assertSaleExists(saleId: string) {
    const sale = await this.prisma.propertySale.findUnique({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
  }
}
