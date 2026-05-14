import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../database';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { GenerateDocumentDto, RequestSignatureDto } from './conveyancing.dto';
import { DOCUMENT_STATUSES } from './conveyancing.constants';
import { EsignService } from '../esign/esign.service';

export type GeneratedDocumentRow = {
  id: string;
  case_id: string;
  template_id: string | null;
  document_name: string;
  document_type: string;
  generated_by: string;
  document_url: string | null;
  status: string;
  field_values: unknown;
  signatures: unknown;
  fully_signed_at: Date | null;
  hash: string | null;
  esign_provider: string | null;
  esign_envelope_id: string | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class DocumentWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ConveyancingAuditService,
    @Optional() private readonly esign: EsignService | null = null,
  ) {}

  async listTemplates(country = 'ZA', caseType = 'transfer'): Promise<unknown[]> {
    return this.prisma.$queryRaw`
      SELECT id, template_name, document_type, required_fields,
             requires_buyer_signature, requires_seller_signature, requires_conveyancer_signature,
             version, is_active
      FROM conveyancing.document_templates
      WHERE country = ${country} AND case_type = ${caseType} AND is_active = TRUE
      ORDER BY template_name
    `;
  }

  async generateDocument(
    actorId: string,
    actorRole: string,
    firmId: string,
    caseId: string,
    dto: GenerateDocumentDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GeneratedDocumentRow> {
    // Validate template exists
    const templates = await this.prisma.$queryRaw<{ id: string; document_type: string; required_fields: string[] }[]>`
      SELECT id, document_type, required_fields FROM conveyancing.document_templates
      WHERE id = ${dto.templateId}::uuid AND is_active = TRUE LIMIT 1
    `;
    if (!templates.length) throw new NotFoundException('Document template not found');

    const template = templates[0];
    const requiredFields: string[] = Array.isArray(template.required_fields) ? template.required_fields : [];
    const missingFields = requiredFields.filter((f) => !(f in (dto.fieldValues ?? {})));
    if (missingFields.length) {
      throw new BadRequestException(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Compute content hash so generated document is tamper-evident
    const contentHash = createHash('sha256')
      .update(JSON.stringify(dto.fieldValues))
      .digest('hex');

    const rows = await this.prisma.$queryRaw<GeneratedDocumentRow[]>`
      INSERT INTO conveyancing.generated_documents
        (case_id, template_id, document_name, document_type, generated_by,
         status, field_values, hash)
      VALUES (
        ${caseId}::uuid,
        ${dto.templateId}::uuid,
        ${dto.documentName},
        ${template.document_type},
        ${actorId}::uuid,
        'draft',
        ${JSON.stringify(dto.fieldValues)}::jsonb,
        ${contentHash}
      )
      RETURNING *
    `;
    const doc = rows[0];

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'document.generated',
      resourceType: 'generated_document',
      resourceId: doc.id,
      payload: { caseId, templateId: dto.templateId, documentName: dto.documentName },
      ipAddress,
      userAgent,
    });

    return doc;
  }

  async listDocuments(caseId: string): Promise<GeneratedDocumentRow[]> {
    return this.prisma.$queryRaw<GeneratedDocumentRow[]>`
      SELECT * FROM conveyancing.generated_documents
      WHERE case_id = ${caseId}::uuid
      ORDER BY created_at DESC
    `;
  }

  async requestSignatures(
    actorId: string,
    actorRole: string,
    firmId: string,
    dto: RequestSignatureDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GeneratedDocumentRow> {
    const rows = await this.prisma.$queryRaw<GeneratedDocumentRow[]>`
      SELECT * FROM conveyancing.generated_documents WHERE id = ${dto.documentId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Document not found');

    const signerMeta = dto.signerIds.map((id) => ({ signer_id: id, status: 'pending', requested_at: new Date().toISOString() }));

    const updated = await this.prisma.$queryRaw<GeneratedDocumentRow[]>`
      UPDATE conveyancing.generated_documents
      SET
        status     = 'sent_for_signature',
        signatures = ${JSON.stringify(signerMeta)}::jsonb,
        updated_at = NOW()
      WHERE id = ${dto.documentId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'document.signature_requested',
      resourceType: 'generated_document',
      resourceId: dto.documentId,
      payload: { signerIds: dto.signerIds },
      ipAddress,
      userAgent,
    });

    return updated[0];
  }

  async recordSignature(
    actorId: string,
    actorRole: string,
    firmId: string,
    documentId: string,
    signerId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GeneratedDocumentRow> {
    const rows = await this.prisma.$queryRaw<GeneratedDocumentRow[]>`
      SELECT * FROM conveyancing.generated_documents WHERE id = ${documentId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Document not found');
    const doc = rows[0];

    const sigs: { signer_id: string; status: string; signed_at?: string }[] =
      Array.isArray(doc.signatures) ? (doc.signatures as any[]) : [];

    const idx = sigs.findIndex((s) => s.signer_id === signerId);
    if (idx === -1) throw new BadRequestException('Signer not in signature request');
    sigs[idx] = { ...sigs[idx], status: 'signed', signed_at: new Date().toISOString() };

    const allSigned = sigs.every((s) => s.status === 'signed');
    const newStatus = allSigned ? 'fully_signed' : 'sent_for_signature';

    const updated = await this.prisma.$queryRaw<GeneratedDocumentRow[]>`
      UPDATE conveyancing.generated_documents
      SET
        signatures    = ${JSON.stringify(sigs)}::jsonb,
        status        = ${newStatus},
        fully_signed_at = CASE WHEN ${allSigned} THEN NOW() ELSE fully_signed_at END,
        updated_at    = NOW()
      WHERE id = ${documentId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'document.signature_recorded',
      resourceType: 'generated_document',
      resourceId: documentId,
      payload: { signerId, allSigned },
      ipAddress,
      userAgent,
    });

    return updated[0];
  }

  // ── E-SIGNATURE — DocuSeal webhook callback ───────────────────────────────

  /**
   * Called by EsignWebhookDispatcher when submission.completed fires.
   * Marks all signers as signed and promotes the document to fully_signed.
   */
  async onEsignCompleted(
    submissionId: string,
    documentId: string,
    caseId: string,
  ): Promise<void> {
    const rows = await this.prisma.$queryRaw<GeneratedDocumentRow[]>`
      SELECT * FROM conveyancing.generated_documents
      WHERE id = ${documentId}::uuid
        AND case_id = ${caseId}::uuid
      LIMIT 1
    `;
    if (!rows.length) return;
    const doc = rows[0];

    if (doc.esign_envelope_id !== submissionId) return; // stale

    const sigs: { signer_id: string; status: string; signed_at?: string }[] =
      Array.isArray(doc.signatures) ? (doc.signatures as { signer_id: string; status: string; signed_at?: string }[]) : [];

    const now = new Date().toISOString();
    const updatedSigs = sigs.map((s) => ({ ...s, status: 'signed', signed_at: s.signed_at ?? now }));

    await this.prisma.$queryRaw`
      UPDATE conveyancing.generated_documents
      SET
        signatures      = ${JSON.stringify(updatedSigs)}::jsonb,
        status          = 'fully_signed',
        fully_signed_at = NOW(),
        updated_at      = NOW()
      WHERE id = ${documentId}::uuid
    `;

    await this.audit.log({
      actorId: documentId,
      actorRole: 'system',
      firmId: '',
      action: 'document.esign_completed',
      resourceType: 'generated_document',
      resourceId: documentId,
      payload: { submissionId, caseId },
    });
  }
}
