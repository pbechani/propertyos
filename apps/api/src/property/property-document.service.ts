import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database';
import { DocumentStorageService } from '../identity/document-storage.service';

export interface PropertyDocumentRow {
  id: string;
  property_id: string;
  uploaded_by: string;
  title: string;
  category: string;
  description: string | null;
  status: string;
  access_level: string;
  file_url: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  is_required: boolean;
  expiration_date: Date | null;
  tags: string[];
  created_at: Date;
}

export interface UploadPropertyDocumentParams {
  propertyId: string;
  uploadedBy: string;
  title: string;
  category: string;
  description?: string;
  status?: string;
  accessLevel?: string;
  isRequired?: boolean;
  expirationDate?: string;
  tags?: string[];
  file: Express.Multer.File;
}

const ALLOWED_CATEGORIES = new Set([
  'listing',
  'disclosures',
  'hoa',
  'offers',
  'inspections',
  'marketing',
  'pricing',
  'title',
  'escrow',
  'other',
]);

const ALLOWED_STATUSES = new Set([
  'current',
  'draft',
  'pending-signature',
  'archived',
]);

const ALLOWED_ACCESS_LEVELS = new Set(['private', 'team', 'client', 'public']);

@Injectable()
export class PropertyDocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentStorage: DocumentStorageService,
  ) {}

  async uploadDocument(
    params: UploadPropertyDocumentParams,
  ): Promise<PropertyDocumentRow> {
    // Validate category
    if (!ALLOWED_CATEGORIES.has(params.category)) {
      throw new BadRequestException(`Invalid category: ${params.category}`);
    }

    const status = params.status ?? 'current';
    if (!ALLOWED_STATUSES.has(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const accessLevel = params.accessLevel ?? 'team';
    if (!ALLOWED_ACCESS_LEVELS.has(accessLevel)) {
      throw new BadRequestException(`Invalid accessLevel: ${accessLevel}`);
    }

    // Verify property exists
    const property = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM property.properties WHERE id = ${params.propertyId}::uuid LIMIT 1
    `;
    if (!property.length) {
      throw new NotFoundException('Property not found');
    }

    // Upload file to storage
    const { publicUrl, storagePath } = await this.documentStorage.upload({
      context: 'property-docs',
      userId: params.uploadedBy,
      documentType: params.category,
      file: params.file,
    });

    const title = params.title || params.file.originalname.replace(/\.[^/.]+$/, '');
    const tags = params.tags ?? [];
    const expirationDate = params.expirationDate || null;

    // Build a safe PostgreSQL array literal for tags: {} or {"tag1","tag2"}
    const tagsSql = Prisma.raw(
      `'{${tags.map((t) => `"${t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}'`,
    );

    const rows = await this.prisma.$queryRaw<PropertyDocumentRow[]>`
      INSERT INTO property.property_documents (
        property_id, uploaded_by, title, category, description, status,
        access_level, file_url, storage_path, file_name, file_size, file_type,
        is_required, expiration_date, tags
      ) VALUES (
        ${params.propertyId}::uuid,
        ${params.uploadedBy}::uuid,
        ${title},
        ${params.category},
        ${params.description ?? null},
        ${status},
        ${accessLevel},
        ${publicUrl},
        ${storagePath},
        ${params.file.originalname},
        ${params.file.size}::int4,
        ${params.file.mimetype},
        ${params.isRequired ?? false},
        ${expirationDate}::date,
        ${tagsSql}::text[]
      )
      RETURNING *
    `;

    return rows[0];
  }

  async listDocuments(
    propertyId: string,
    requesterId: string,
  ): Promise<PropertyDocumentRow[]> {
    // Verify property exists
    const property = await this.prisma.$queryRaw<{ id: string; agent_id: string | null; owner_id: string | null }[]>`
      SELECT id, agent_id, owner_id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!property.length) {
      throw new NotFoundException('Property not found');
    }

    const prop = property[0];
    const isOwner =
      prop.agent_id === requesterId || prop.owner_id === requesterId;

    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have access to this property\'s documents',
      );
    }

    return this.prisma.$queryRaw<PropertyDocumentRow[]>`
      SELECT * FROM property.property_documents
      WHERE property_id = ${propertyId}::uuid
      ORDER BY created_at DESC
    `;
  }

  async deleteDocument(
    propertyId: string,
    documentId: string,
    requesterId: string,
  ): Promise<void> {
    const rows = await this.prisma.$queryRaw<PropertyDocumentRow[]>`
      SELECT pd.*, p.agent_id, p.owner_id
      FROM property.property_documents pd
      JOIN property.properties p ON p.id = pd.property_id
      WHERE pd.id = ${documentId}::uuid
        AND pd.property_id = ${propertyId}::uuid
      LIMIT 1
    `;

    if (!rows.length) {
      throw new NotFoundException('Document not found');
    }

    const row = rows[0] as PropertyDocumentRow & {
      agent_id: string | null;
      owner_id: string | null;
    };

    if (row.uploaded_by !== requesterId &&
        (row as { agent_id?: string | null }).agent_id !== requesterId &&
        (row as { owner_id?: string | null }).owner_id !== requesterId) {
      throw new ForbiddenException('Not authorized to delete this document');
    }

    await this.prisma.$executeRaw`
      DELETE FROM property.property_documents
      WHERE id = ${documentId}::uuid
    `;
  }
}
