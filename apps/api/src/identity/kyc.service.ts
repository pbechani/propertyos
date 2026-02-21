import { Injectable, NotFoundException } from '@nestjs/common';
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

  async listPending(): Promise<KycRow[]> {
    return this.prisma.$queryRaw`
      SELECT id, user_id, status, id_document_url, id_document_type, address_proof_url, business_registration_url, selfie_url, reviewer_id, reviewer_notes, reviewed_at, submitted_at, created_at
      FROM identity.kyc_verifications
      WHERE status IN ('pending', 'under_review')
      ORDER BY submitted_at ASC
      LIMIT 200
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

  async approve(id: string, reviewerId: string, reviewerNotes?: string): Promise<KycRow> {
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

    return rows[0];
  }

  async reject(id: string, reviewerId: string, reviewerNotes?: string): Promise<KycRow> {
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

    return rows[0];
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
}
