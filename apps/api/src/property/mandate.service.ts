import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';
import {
  CreateMandateDto,
  MarkSellerSignedOfflineDto,
  SignMandateDto,
  CancelMandateDto,
  MandateSigningParty,
} from './mandate.dto';
import { EsignService } from '../esign/esign.service';

export type MandateRecord = {
  id: string;
  property_id: string;
  agent_id: string;
  brokerage_id: string | null;
  mandate_type: string;
  commission_rate: string;
  commission_vat_inclusive: boolean;
  start_date: Date;
  end_date: Date;
  auto_renewal: boolean;
  terms_document_url: string | null;
  signed_by_seller_at: Date | null;
  signed_by_agent_at: Date | null;
  status: string;
  cancellation_reason: string | null;
  created_at: Date;
  seller_name: string | null;
  seller_email: string | null;
  seller_phone: string | null;
  seller_is_platform_user: boolean;
  agreement_document_url: string | null;
  esign_submission_id: string | null;
};

@Injectable()
export class MandateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
    @Optional() private readonly esign: EsignService | null = null,
  ) {}

  // ──────────────────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────────────────

  async create(
    propertyId: string,
    agentId: string,
    dto: CreateMandateDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<MandateRecord> {
    // Verify property exists
    const props = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!props.length) throw new NotFoundException('Property not found');

    // Enforce sole mandate uniqueness
    if (dto.mandateType === 'sole') {
      const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM property.mandates
        WHERE property_id = ${propertyId}::uuid
          AND mandate_type = 'sole'
          AND status = 'active'
        LIMIT 1
      `;
      if (existing.length) {
        throw new ConflictException(
          'Property already has an active sole mandate. Cancel it before creating a new one.',
        );
      }
    }

    const startDate = dto.startDate;
    const endDate = dto.endDate;

    const sellerIsPlatformUser = dto.sellerIsPlatformUser !== false; // default true

    const rows = await this.prisma.$queryRaw<MandateRecord[]>`
      INSERT INTO property.mandates (
        property_id, agent_id, brokerage_id, mandate_type,
        commission_rate, commission_vat_inclusive,
        start_date, end_date, auto_renewal, terms_document_url,
        seller_name, seller_email, seller_phone, seller_is_platform_user
      ) VALUES (
        ${propertyId}::uuid,
        ${agentId}::uuid,
        ${dto.brokerageId ?? null}::uuid,
        ${dto.mandateType},
        ${dto.commissionRate},
        ${dto.commissionVatInclusive ?? false},
        ${startDate}::date,
        ${endDate}::date,
        ${dto.autoRenewal ?? false},
        ${dto.termsDocumentUrl ?? null},
        ${dto.sellerName ?? null},
        ${dto.sellerEmail ?? null},
        ${dto.sellerPhone ?? null},
        ${sellerIsPlatformUser}
      )
      RETURNING *
    `;

    const mandate = rows[0];

    await this.audit.log({
      actorId: agentId,
      actorRole: 'agent',
      companyId: companyId ?? null,
      action: 'mandate.created',
      resourceType: 'mandate',
      resourceId: mandate.id,
      payload: { propertyId, mandateType: dto.mandateType },
      ipAddress,
      userAgent,
    });

    return mandate;
  }

  // ──────────────────────────────────────────────────────────
  // GET for a property
  // ──────────────────────────────────────────────────────────

  async findByProperty(propertyId: string): Promise<MandateRecord[]> {
    return this.prisma.$queryRaw<MandateRecord[]>`
      SELECT * FROM property.mandates
      WHERE property_id = ${propertyId}::uuid
      ORDER BY created_at DESC
    `;
  }

  // ──────────────────────────────────────────────────────────
  // SIGN
  // ──────────────────────────────────────────────────────────

  async sign(
    propertyId: string,
    mandateId: string,
    party: MandateSigningParty,
    actorId: string,
    actorRole: string,
    dto: SignMandateDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<MandateRecord> {
    const existing = await this.findMandateOrThrow(mandateId, propertyId);

    if (existing.status !== 'pending_signature') {
      throw new BadRequestException('Mandate is not in pending_signature state');
    }

    const now = new Date();
    let rows: MandateRecord[];

    if (party === 'seller') {
      rows = await this.prisma.$queryRaw<MandateRecord[]>`
        UPDATE property.mandates
        SET signed_by_seller_at = ${now}
        WHERE id = ${mandateId}::uuid
        RETURNING *
      `;
    } else {
      rows = await this.prisma.$queryRaw<MandateRecord[]>`
        UPDATE property.mandates
        SET signed_by_agent_at = ${now}
        WHERE id = ${mandateId}::uuid
        RETURNING *
      `;
    }

    // Activate when both parties have signed
    const updated = rows[0];
    let finalMandate = updated;
    if (updated.signed_by_seller_at && updated.signed_by_agent_at) {
      const activated = await this.prisma.$queryRaw<MandateRecord[]>`
        UPDATE property.mandates
        SET status = 'active'
        WHERE id = ${mandateId}::uuid
        RETURNING *
      `;
      finalMandate = activated[0];
    }

    await this.audit.log({
      actorId,
      actorRole,
      companyId: companyId ?? null,
      action: 'mandate.signed',
      resourceType: 'mandate',
      resourceId: mandateId,
      payload: { party, signedAt: now },
      ipAddress,
      userAgent,
    });

    return finalMandate;
  }

  // ──────────────────────────────────────────────────────────
  // CANCEL
  // ──────────────────────────────────────────────────────────

  async cancel(
    propertyId: string,
    mandateId: string,
    actorId: string,
    actorRole: string,
    dto: CancelMandateDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<MandateRecord> {
    const existing = await this.findMandateOrThrow(mandateId, propertyId);

    if (existing.status === 'cancelled') {
      throw new BadRequestException('Mandate is already cancelled');
    }

    if (actorRole !== 'admin' && existing.agent_id !== actorId) {
      // Sellers can also cancel — allow buyer_seller role
      if (!['agent', 'admin', 'buyer_seller'].includes(actorRole)) {
        throw new ForbiddenException('Not authorised to cancel this mandate');
      }
    }

    const rows = await this.prisma.$queryRaw<MandateRecord[]>`
      UPDATE property.mandates
      SET status = 'cancelled', cancellation_reason = ${dto.reason ?? null}
      WHERE id = ${mandateId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      companyId: companyId ?? null,
      action: 'mandate.cancelled',
      resourceType: 'mandate',
      resourceId: mandateId,
      payload: { reason: dto.reason },
      ipAddress,
      userAgent,
    });

    return rows[0];
  }

  // ──────────────────────────────────────────────────────────
  // OFFLINE SELLER SIGNING
  // ──────────────────────────────────────────────────────────

  async markSellerSignedOffline(
    propertyId: string,
    mandateId: string,
    dto: MarkSellerSignedOfflineDto,
    agentId: string,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<MandateRecord> {
    const existing = await this.findMandateOrThrow(mandateId, propertyId);

    if (existing.seller_is_platform_user) {
      throw new BadRequestException(
        'Seller is a platform user — they must sign digitally via their own account.',
      );
    }

    if (existing.signed_by_seller_at) {
      throw new BadRequestException('Seller has already signed this mandate.');
    }

    if (!['pending_signature', 'active'].includes(existing.status)) {
      throw new BadRequestException('Mandate is not in a signable state.');
    }

    if (existing.agent_id !== agentId) {
      throw new ForbiddenException('Only the mandate agent can record an offline seller signature.');
    }

    const now = new Date();

    const rows = await this.prisma.$queryRaw<MandateRecord[]>`
      UPDATE property.mandates
      SET signed_by_seller_at = ${now},
          agreement_document_url = ${dto.documentUrl}
      WHERE id = ${mandateId}::uuid
      RETURNING *
    `;

    const updated = rows[0];
    let finalMandate = updated;

    if (updated.signed_by_seller_at && updated.signed_by_agent_at) {
      const activated = await this.prisma.$queryRaw<MandateRecord[]>`
        UPDATE property.mandates
        SET status = 'active'
        WHERE id = ${mandateId}::uuid
        RETURNING *
      `;
      finalMandate = activated[0];
    }

    await this.audit.log({
      actorId: agentId,
      actorRole: 'agent',
      companyId: companyId ?? null,
      action: 'mandate.seller_signed_offline',
      resourceType: 'mandate',
      resourceId: mandateId,
      payload: { documentUrl: dto.documentUrl, signedAt: now },
      ipAddress,
      userAgent,
    });

    return finalMandate;
  }

  // ──────────────────────────────────────────────────────────
  // E-SIGNATURE — DocuSeal integration
  // ──────────────────────────────────────────────────────────

  /**
   * Create a DocuSeal submission for both parties (seller + agent).
   * Returns the per-signer sign_page_urls so the controller can redirect each
   * party.  Persists the submission ID on the mandate row.
   */
  async initiateEsign(
    propertyId: string,
    mandateId: string,
    agentName: string,
    agentEmail: string,
    templateId: number,
  ): Promise<{ sellerSignUrl: string | null; agentSignUrl: string | null; submissionId: string }> {
    const mandate = await this.findMandateOrThrow(mandateId, propertyId);

    if (mandate.status !== 'pending_signature') {
      throw new BadRequestException('Mandate is not pending signature');
    }
    if (!this.esign) {
      throw new BadRequestException('E-signature provider not configured');
    }

    const submission = await this.esign.createSubmission({
      templateId,
      submitters: [
        {
          name: mandate.seller_name ?? 'Seller',
          email: mandate.seller_email ?? '',
          role: 'Seller',
        },
        {
          name: agentName,
          email: agentEmail,
          role: 'Agent',
        },
      ],
      metadata: { flow: 'mandate', mandateId, propertyId },
    });

    const submissionId = String(submission.id);

    // Persist submission ID
    await this.prisma.$queryRaw`
      UPDATE property.mandates
      SET esign_submission_id = ${submissionId}
      WHERE id = ${mandateId}::uuid
    `;

    return {
      sellerSignUrl: this.esign.getSignerUrl(submission, 'Seller'),
      agentSignUrl: this.esign.getSignerUrl(submission, 'Agent'),
      submissionId,
    };
  }

  /**
   * Called by the DocuSeal webhook dispatcher when the mandate submission
   * completes for one or both parties.  Mirrors the logic in `sign()` and
   * `markSellerSignedOffline()` but is driven server-side.
   */
  async onEsignCompleted(
    submissionId: string,
    mandateId: string,
    propertyId: string,
  ): Promise<void> {
    const mandate = await this.findMandateOrThrow(mandateId, propertyId);

    if (mandate.esign_submission_id !== submissionId) return; // stale event

    const now = new Date();

    // Mark both parties signed since submission.completed fires when ALL signers are done
    const updated = await this.prisma.$queryRaw<MandateRecord[]>`
      UPDATE property.mandates
      SET signed_by_seller_at = COALESCE(signed_by_seller_at, ${now}),
          signed_by_agent_at  = COALESCE(signed_by_agent_at, ${now}),
          status              = 'active'
      WHERE id = ${mandateId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId: mandateId,
      actorRole: 'system',
      companyId: null,
      action: 'mandate.esign_completed',
      resourceType: 'mandate',
      resourceId: mandateId,
      payload: { submissionId, activatedAt: now },
    });

    void updated; // suppress unused-var warning
  }

  // ──────────────────────────────────────────────────────────
  // Agent's own mandates
  // ──────────────────────────────────────────────────────────

  async findAgentMandates(agentId: string): Promise<MandateRecord[]> {
    return this.prisma.$queryRaw<MandateRecord[]>`
      SELECT m.*, p.title as property_title
      FROM property.mandates m
      JOIN property.properties p ON p.id = m.property_id
      WHERE m.agent_id = ${agentId}::uuid
        AND m.status = 'active'
      ORDER BY m.start_date DESC
    `;
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  private async findMandateOrThrow(
    mandateId: string,
    propertyId: string,
  ): Promise<MandateRecord> {
    const rows = await this.prisma.$queryRaw<MandateRecord[]>`
      SELECT * FROM property.mandates
      WHERE id = ${mandateId}::uuid
        AND property_id = ${propertyId}::uuid
      LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Mandate not found');
    return rows[0];
  }
}
