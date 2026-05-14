import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';
import { SubmitBuyerOfferDto } from './offer.dto';

@Injectable()
export class OfferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
  ) {}

  async submitByBuyer(
    propertyId: string,
    buyerId: string,
    buyerEmail: string,
    dto: SubmitBuyerOfferDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<unknown> {
    const property = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM property.properties
      WHERE id = ${propertyId}::uuid AND status = 'active'
      LIMIT 1
    `;
    if (!property[0]) throw new NotFoundException('Property not found or not active');

    const buyerName = `${dto.buyerFirstName} ${dto.buyerLastName}`.trim();
    const amount = parseFloat(dto.amount as unknown as string);
    const depositAmount = parseFloat(dto.depositAmount as unknown as string);

    if (isNaN(amount) || amount <= 0) throw new BadRequestException('Invalid offer amount');
    if (isNaN(depositAmount) || depositAmount < 0) throw new BadRequestException('Invalid deposit amount');

    const conditions: string[] = [];
    if (dto.conditionBuildingInspection) conditions.push('Building Inspection');
    if (dto.conditionBondApproval) conditions.push('Bond Approval');
    if (dto.conditionSubjectToSale) conditions.push('Subject to Sale');
    if (dto.conditionVacantOccupation) conditions.push('Vacant Occupation');
    if (dto.conditionElectricalCoc) conditions.push('Electrical CoC');
    if (dto.inclusions?.length) conditions.push(...dto.inclusions);

    const metadata = {
      buyerIdNumber: dto.buyerIdNumber ?? null,
      buyerNationality: dto.buyerNationality ?? null,
      buyerPhone: dto.buyerPhone ?? null,
      buyerWhatsapp: dto.buyerWhatsapp ?? null,
      buyerPreferredContact: dto.buyerPreferredContact ?? null,
      buyerAddress: dto.buyerAddress ?? null,
      buyingEntity: dto.buyingEntity,
      agentRepresented: dto.agentRepresented ?? false,
      agentName: dto.agentName ?? null,
      preQualStatus: dto.preQualStatus,
      preQualBank: dto.preQualBank ?? null,
      preQualReference: dto.preQualReference ?? null,
      depositDueDays: dto.depositDueDays,
      depositHeldBy: dto.depositHeldBy ?? null,
      bondAmount: dto.bondAmount ?? null,
      bondLender: dto.bondLender ?? null,
      bondDeadline: dto.bondDeadline ?? null,
      escalationEnabled: dto.escalationEnabled ?? false,
      escalationIncrement: dto.escalationIncrement ?? null,
      escalationCap: dto.escalationCap ?? null,
      preferredOccupationDate: dto.preferredOccupationDate ?? null,
      preferredTransferDate: dto.preferredTransferDate ?? null,
      messageToSeller: dto.messageToSeller ?? null,
      customConditions: dto.customConditions ?? null,
    };

    const closingDate = dto.preferredTransferDate ? new Date(dto.preferredTransferDate) : null;
    const expiresAt = new Date(`${dto.expiresAt}`);
    const notes = [dto.messageToSeller, dto.customConditions].filter(Boolean).join('\n\n') || null;

    const result = await this.prisma.$queryRaw<unknown[]>`
      INSERT INTO sales.property_offers (
        property_id, buyer_id, buyer_name, buyer_email,
        amount, deposit_amount, earnest_money, financing,
        contingencies, closing_date, notes, expires_at, metadata, status
      ) VALUES (
        ${propertyId}::uuid,
        ${buyerId}::uuid,
        ${buyerName},
        ${buyerEmail},
        ${amount},
        ${depositAmount},
        ${depositAmount},
        ${dto.financing},
        ${conditions}::text[],
        ${closingDate}::date,
        ${notes},
        ${expiresAt}::timestamptz,
        ${JSON.stringify(metadata)}::jsonb,
        'pending'
      )
      RETURNING id, property_id, buyer_id, amount, deposit_amount, financing, status, expires_at, submitted_at, created_at
    `;

    await this.audit.log({
      actorId: buyerId,
      actorRole: 'buyer_seller',
      action: 'property.offer.submitted',
      resourceType: 'property',
      resourceId: propertyId,
      payload: { amount, financing: dto.financing },
      ipAddress,
      userAgent,
    });

    return (result as unknown[])[0];
  }

  async listByBuyer(buyerId: string): Promise<unknown[]> {
    return this.prisma.$queryRaw`
      SELECT
        o.id, o.property_id, o.buyer_id, o.amount, o.deposit_amount,
        o.financing, o.status, o.expires_at, o.submitted_at, o.created_at,
        o.counter_amount, o.counter_notes, o.counter_closing_date, o.countered_at,
        p.title AS property_title, p.price AS property_price, p.currency AS property_currency
      FROM sales.property_offers o
      LEFT JOIN property.properties p ON p.id = o.property_id
      WHERE o.buyer_id = ${buyerId}::uuid
      ORDER BY o.created_at DESC
    `;
  }

  async respondToCounter(
    offerId: string,
    buyerId: string,
    action: 'accept' | 'decline' | 'counter',
    payload?: { counterAmount?: number; counterNotes?: string; counterExpiresAt?: string },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<unknown> {
    const rows = await this.prisma.$queryRaw<{ id: string; status: string; property_id: string }[]>`
      SELECT id, status, property_id FROM sales.property_offers
      WHERE id = ${offerId}::uuid AND buyer_id = ${buyerId}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException('Offer not found');
    if (!['countered', 'buyer_countered'].includes(rows[0].status)) {
      throw new ForbiddenException('Only countered offers can be responded to');
    }

    let result: unknown[];

    if (action === 'accept') {
      result = await this.prisma.$queryRaw<unknown[]>`
        UPDATE sales.property_offers
        SET status = 'accepted', updated_at = NOW()
        WHERE id = ${offerId}::uuid AND buyer_id = ${buyerId}::uuid
        RETURNING id, status, updated_at
      `;
      await this.audit.log({
        actorId: buyerId,
        actorRole: 'buyer_seller',
        action: 'property.offer.counter_accepted',
        resourceType: 'property',
        resourceId: rows[0].property_id,
        payload: { offerId },
        ipAddress,
        userAgent,
      });
    } else if (action === 'decline') {
      result = await this.prisma.$queryRaw<unknown[]>`
        UPDATE sales.property_offers
        SET status = 'rejected', updated_at = NOW()
        WHERE id = ${offerId}::uuid AND buyer_id = ${buyerId}::uuid
        RETURNING id, status, updated_at
      `;
      await this.audit.log({
        actorId: buyerId,
        actorRole: 'buyer_seller',
        action: 'property.offer.counter_declined',
        resourceType: 'property',
        resourceId: rows[0].property_id,
        payload: { offerId },
        ipAddress,
        userAgent,
      });
    } else {
      if (!payload?.counterAmount || payload.counterAmount <= 0) {
        throw new BadRequestException('Counter amount is required and must be positive');
      }
      const expiresAt = payload.counterExpiresAt ? new Date(payload.counterExpiresAt) : new Date(Date.now() + 48 * 60 * 60 * 1000);
      result = await this.prisma.$queryRaw<unknown[]>`
        UPDATE sales.property_offers
        SET
          status = 'buyer_countered',
          counter_amount = ${payload.counterAmount},
          counter_notes = ${payload.counterNotes ?? null},
          countered_at = NOW(),
          expires_at = ${expiresAt}::timestamptz,
          updated_at = NOW()
        WHERE id = ${offerId}::uuid AND buyer_id = ${buyerId}::uuid
        RETURNING id, status, counter_amount, counter_notes, countered_at, expires_at, updated_at
      `;
      await this.audit.log({
        actorId: buyerId,
        actorRole: 'buyer_seller',
        action: 'property.offer.buyer_countered',
        resourceType: 'property',
        resourceId: rows[0].property_id,
        payload: { offerId, counterAmount: payload.counterAmount },
        ipAddress,
        userAgent,
      });
    }

    return (result as unknown[])[0];
  }

  async withdrawByBuyer(offerId: string, buyerId: string): Promise<unknown> {
    const rows = await this.prisma.$queryRaw<{ id: string; status: string }[]>`
      SELECT id, status FROM sales.property_offers
      WHERE id = ${offerId}::uuid AND buyer_id = ${buyerId}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException('Offer not found');
    if (!['pending', 'submitted'].includes(rows[0].status)) {
      throw new BadRequestException('Only pending offers can be withdrawn');
    }

    const result = await this.prisma.$queryRaw<unknown[]>`
      UPDATE sales.property_offers
      SET status = 'withdrawn', updated_at = NOW()
      WHERE id = ${offerId}::uuid AND buyer_id = ${buyerId}::uuid
      RETURNING id, status, updated_at
    `;
    return (result as unknown[])[0];
  }
}
