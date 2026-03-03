import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { SalesAuditService } from './sales-audit.service';
import { SalesService } from './sales.service';
import { UpdateDocumentStatusDto, UploadDocumentDto } from './sales.dto';
import { resolveSalesActorRole } from './sales.constants';

type DocumentRow = {
  id: string;
  sale_id: string;
  stage_number: number;
  document_name: string;
  document_type: string | null;
  url: string | null;
  version: number;
  uploaded_by: string | null;
  status: string;
  is_required: boolean;
  uploaded_at: Date;
};

@Injectable()
export class StageDocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sales: SalesService,
    private readonly audit: SalesAuditService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // Upload document for a stage
  // ─────────────────────────────────────────────────────────

  async uploadDocument(
    saleId: string,
    stageNumber: number,
    uploaderId: string,
    uploaderRoles: string[],
    dto: UploadDocumentDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DocumentRow> {
    const sale = await this.sales.findSaleOrThrow(saleId);
    this.sales.assertParticipant(sale, uploaderId, uploaderRoles);

    const actorRole = resolveSalesActorRole(uploaderRoles);

    const [doc] = await this.prisma.$queryRaw<DocumentRow[]>`
      INSERT INTO sales.stage_documents
        (sale_id, stage_number, document_name, document_type, url, uploaded_by, is_required)
      VALUES (
        ${saleId}::uuid,
        ${stageNumber},
        ${dto.documentName},
        ${dto.documentType ?? null},
        ${dto.url ?? null},
        ${uploaderId}::uuid,
        ${dto.isRequired ?? false}
      )
      RETURNING *
    `;

    await this.audit.log({
      actorId: uploaderId,
      actorRole,
      action: 'sale.document.uploaded',
      resourceType: 'stage_document',
      resourceId: doc.id,
      payload: { saleId, stageNumber, documentName: dto.documentName },
      ipAddress,
      userAgent,
    });

    return doc;
  }

  // ─────────────────────────────────────────────────────────
  // List all documents for a sale
  // ─────────────────────────────────────────────────────────

  async listDocuments(
    saleId: string,
    requesterId: string,
    requesterRoles: string[],
  ): Promise<DocumentRow[]> {
    const sale = await this.sales.findSaleOrThrow(saleId);
    this.sales.assertParticipant(sale, requesterId, requesterRoles);

    return this.prisma.$queryRaw<DocumentRow[]>`
      SELECT * FROM sales.stage_documents
      WHERE sale_id = ${saleId}::uuid
      ORDER BY stage_number ASC, uploaded_at DESC
    `;
  }

  // ─────────────────────────────────────────────────────────
  // Update document status
  // ─────────────────────────────────────────────────────────

  async updateDocumentStatus(
    saleId: string,
    docId: string,
    actorId: string,
    actorRoles: string[],
    dto: UpdateDocumentStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<DocumentRow> {
    const actorRole = resolveSalesActorRole(actorRoles);
    if (!['admin', 'conveyancer'].includes(actorRole)) {
      throw new ForbiddenException('Only conveyancers and admins may update document status');
    }

    const doc = await this.findDocOrThrow(docId, saleId);

    const [updated] = await this.prisma.$queryRaw<DocumentRow[]>`
      UPDATE sales.stage_documents SET status = ${dto.status}
      WHERE id = ${docId}::uuid AND sale_id = ${saleId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.document.status_updated',
      resourceType: 'stage_document',
      resourceId: docId,
      payload: { saleId, status: dto.status },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────
  // Delete document
  // ─────────────────────────────────────────────────────────

  async deleteDocument(
    saleId: string,
    docId: string,
    actorId: string,
    actorRoles: string[],
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const doc = await this.findDocOrThrow(docId, saleId);

    const actorRole = resolveSalesActorRole(actorRoles);
    if (actorRole !== 'admin' && doc.uploaded_by !== actorId) {
      throw new ForbiddenException('You may only delete documents you uploaded');
    }

    await this.prisma.$executeRaw`
      DELETE FROM sales.stage_documents WHERE id = ${docId}::uuid AND sale_id = ${saleId}::uuid
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.document.deleted',
      resourceType: 'stage_document',
      resourceId: docId,
      payload: { saleId },
      ipAddress,
      userAgent,
    });
  }

  // ─────────────────────────────────────────────────────────
  // Internal
  // ─────────────────────────────────────────────────────────

  private async findDocOrThrow(docId: string, saleId: string): Promise<DocumentRow> {
    const rows = await this.prisma.$queryRaw<DocumentRow[]>`
      SELECT * FROM sales.stage_documents
      WHERE id = ${docId}::uuid AND sale_id = ${saleId}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException(`Document ${docId} not found`);
    return rows[0];
  }
}
