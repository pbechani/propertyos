import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';

type KycRow = {
  id: string;
  user_id: string;
  status: string;
  id_document_url: string | null;
  id_document_type: string | null;
  address_proof_url: string | null;
  business_registration_url: string | null;
  selfie_url: string | null;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: Date | null;
  submitted_at: Date;
  created_at: Date;
};

type KycWithUserRow = KycRow & {
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_phone: string | null;
};

type KycUpdateResult = {
  record: KycRow;
  previousStatus: string;
};

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(params: {
    userId: string;
    idDocumentType: string;
    idDocumentUrl?: string;
    addressProofUrl?: string;
    businessRegistrationUrl?: string;
    selfieUrl?: string;
  }): Promise<KycRow> {
    const rows = await this.prisma.$queryRaw<KycRow[]>`
      INSERT INTO identity.kyc_verifications (
        user_id,
        status,
        id_document_type,
        id_document_url,
        address_proof_url,
        business_registration_url,
        selfie_url
      ) VALUES (
        ${params.userId}::uuid,
        'pending',
        ${params.idDocumentType},
        ${params.idDocumentUrl ?? null},
        ${params.addressProofUrl ?? null},
        ${params.businessRegistrationUrl ?? null},
        ${params.selfieUrl ?? null}
      )
      RETURNING id, user_id, status, id_document_url, id_document_type, address_proof_url, business_registration_url, selfie_url, reviewer_id, reviewer_notes, reviewed_at, submitted_at, created_at
    `;

    return rows[0];
  }

  async getLatestByUser(userId: string): Promise<KycRow | null> {
    const rows = await this.prisma.$queryRaw<KycRow[]>`
      SELECT id, user_id, status, id_document_url, id_document_type, address_proof_url, business_registration_url, selfie_url, reviewer_id, reviewer_notes, reviewed_at, submitted_at, created_at
      FROM identity.kyc_verifications
      WHERE user_id = ${userId}::uuid
      ORDER BY submitted_at DESC
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async listPending(limit = 50, offset = 0): Promise<KycRow[]> {
    const safeLimit = Math.min(limit, 500);
    return this.prisma.$queryRaw`
      SELECT id, user_id, status, id_document_url, id_document_type, address_proof_url, business_registration_url, selfie_url, reviewer_id, reviewer_notes, reviewed_at, submitted_at, created_at
      FROM identity.kyc_verifications
      WHERE status IN ('pending', 'under_review')
      ORDER BY submitted_at ASC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;
  }

  async listAll(params: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<KycWithUserRow[]> {
    const safeLimit = Math.min(params.limit ?? 100, 500);
    const offset = params.offset ?? 0;

    if (params.status) {
      return this.prisma.$queryRaw<KycWithUserRow[]>`
        SELECT k.id, k.user_id, k.status, k.id_document_url, k.id_document_type,
               k.address_proof_url, k.business_registration_url, k.selfie_url,
               k.reviewer_id, k.reviewer_notes, k.reviewed_at, k.submitted_at, k.created_at,
               u.email AS user_email, u.first_name AS user_first_name,
               u.last_name AS user_last_name, u.phone AS user_phone
        FROM identity.kyc_verifications k
        JOIN identity.users u ON u.id = k.user_id
        WHERE k.status = ${params.status}
        ORDER BY k.submitted_at DESC
        LIMIT ${safeLimit} OFFSET ${offset}
      `;
    }

    return this.prisma.$queryRaw<KycWithUserRow[]>`
      SELECT k.id, k.user_id, k.status, k.id_document_url, k.id_document_type,
             k.address_proof_url, k.business_registration_url, k.selfie_url,
             k.reviewer_id, k.reviewer_notes, k.reviewed_at, k.submitted_at, k.created_at,
             u.email AS user_email, u.first_name AS user_first_name,
             u.last_name AS user_last_name, u.phone AS user_phone
      FROM identity.kyc_verifications k
      JOIN identity.users u ON u.id = k.user_id
      ORDER BY k.submitted_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;
  }

  async getById(id: string): Promise<KycRow> {
    const rows = await this.prisma.$queryRaw<KycRow[]>`
      SELECT id, user_id, status, id_document_url, id_document_type, address_proof_url, business_registration_url, selfie_url, reviewer_id, reviewer_notes, reviewed_at, submitted_at, created_at
      FROM identity.kyc_verifications
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    if (!rows[0]) {
      throw new NotFoundException('KYC verification not found');
    }

    return rows[0];
  }

  async startReview(id: string, reviewerId: string): Promise<KycUpdateResult> {
    const existing = await this.getById(id);
    if (existing.status !== 'pending') {
      throw new ConflictException(
        `Cannot start review: record is in '${existing.status}' status, expected 'pending'`,
      );
    }
    const previousStatus = existing.status;

    const rows = await this.prisma.$queryRaw<KycRow[]>`
      UPDATE identity.kyc_verifications
      SET status = 'under_review',
          reviewer_id = ${reviewerId}::uuid,
          reviewed_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id, user_id, status, id_document_url, id_document_type, address_proof_url, business_registration_url, selfie_url, reviewer_id, reviewer_notes, reviewed_at, submitted_at, created_at
    `;

    if (!rows[0]) {
      throw new NotFoundException('KYC verification not found');
    }

    return { record: rows[0], previousStatus };
  }

  async approve(
    id: string,
    reviewerId: string,
    reviewerNotes?: string,
  ): Promise<KycUpdateResult> {
    const existing = await this.getById(id);
    if (!['pending', 'under_review'].includes(existing.status)) {
      throw new ConflictException(
        `Cannot approve: record is in '${existing.status}' status`,
      );
    }
    const previousStatus = existing.status;

    const rows = await this.prisma.$queryRaw<KycRow[]>`
      UPDATE identity.kyc_verifications
      SET status = 'approved',
          reviewer_id = ${reviewerId}::uuid,
          reviewer_notes = ${reviewerNotes ?? null},
          reviewed_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id, user_id, status, id_document_url, id_document_type, address_proof_url, business_registration_url, selfie_url, reviewer_id, reviewer_notes, reviewed_at, submitted_at, created_at
    `;

    if (!rows[0]) {
      throw new NotFoundException('KYC verification not found');
    }

    return { record: rows[0], previousStatus };
  }

  async reject(
    id: string,
    reviewerId: string,
    reviewerNotes?: string,
  ): Promise<KycUpdateResult> {
    const existing = await this.getById(id);
    if (!['pending', 'under_review'].includes(existing.status)) {
      throw new ConflictException(
        `Cannot reject: record is in '${existing.status}' status`,
      );
    }
    const previousStatus = existing.status;

    const rows = await this.prisma.$queryRaw<KycRow[]>`
      UPDATE identity.kyc_verifications
      SET status = 'rejected',
          reviewer_id = ${reviewerId}::uuid,
          reviewer_notes = ${reviewerNotes ?? null},
          reviewed_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id, user_id, status, id_document_url, id_document_type, address_proof_url, business_registration_url, selfie_url, reviewer_id, reviewer_notes, reviewed_at, submitted_at, created_at
    `;

    if (!rows[0]) {
      throw new NotFoundException('KYC verification not found');
    }

    return { record: rows[0], previousStatus };
  }

  sanitize(row: KycRow): Record<string, unknown> {
    return {
      id: row.id,
      userId: row.user_id,
      status: row.status,
      idDocumentUrl: row.id_document_url,
      idDocumentType: row.id_document_type,
      addressProofUrl: row.address_proof_url,
      businessRegistrationUrl: row.business_registration_url,
      selfieUrl: row.selfie_url,
      reviewerId: row.reviewer_id,
      reviewerNotes: row.reviewer_notes,
      reviewedAt: row.reviewed_at,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
    };
  }

  sanitizeWithUser(row: KycWithUserRow): Record<string, unknown> {
    const docsCount = [
      row.id_document_url,
      row.address_proof_url,
      row.business_registration_url,
      row.selfie_url,
    ].filter(Boolean).length;

    return {
      ...this.sanitize(row),
      docsCount,
      user: {
        id: row.user_id,
        email: row.user_email,
        firstName: row.user_first_name,
        lastName: row.user_last_name,
        phone: row.user_phone ?? null,
      },
    };
  }
}
