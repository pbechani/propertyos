import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { CreateProfessionalLicenceDto } from './professional-licences.dto';

type LicenceRow = {
  id: string;
  user_id: string;
  licence_type: string;
  licence_number: string;
  issuing_body: string;
  issue_date: Date | null;
  expiry_date: Date | null;
  licence_document_url: string | null;
  status: string;
  verified_by: string | null;
  verified_at: Date | null;
  auto_check_url: string | null;
  auto_checked_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class ProfessionalLicencesService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(
    userId: string,
    dto: CreateProfessionalLicenceDto,
  ): Promise<LicenceRow> {
    // Prevent duplicate active licence of the same type per user
    const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM identity.professional_licences
      WHERE user_id = ${userId}::uuid
        AND licence_type = ${dto.licenceType}
        AND status NOT IN ('revoked', 'expired')
      LIMIT 1
    `;

    if (existing.length > 0) {
      throw new ConflictException(
        `An active ${dto.licenceType} licence already exists. Revoke or let it expire before submitting a new one.`,
      );
    }

    const issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
    const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO identity.professional_licences
        (user_id, licence_type, licence_number, issuing_body, issue_date, expiry_date, auto_check_url)
      VALUES
        (${userId}::uuid, ${dto.licenceType}, ${dto.licenceNumber},
         ${dto.issuingBody}, ${issueDate}, ${expiryDate}, ${dto.autoCheckUrl ?? null})
      RETURNING id
    `;

    return this.findById(rows[0].id);
  }

  async findByUser(userId: string): Promise<LicenceRow[]> {
    return this.prisma.$queryRaw<LicenceRow[]>`
      SELECT *
      FROM identity.professional_licences
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `;
  }

  async findById(id: string): Promise<LicenceRow> {
    const rows = await this.prisma.$queryRaw<LicenceRow[]>`
      SELECT * FROM identity.professional_licences
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException('Licence not found');
    return rows[0];
  }

  async setDocumentUrl(id: string, userId: string, url: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE identity.professional_licences
      SET licence_document_url = ${url}, updated_at = NOW()
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
    `;
  }

  async adminVerify(
    licenceId: string,
    reviewerId: string,
    status: 'verified' | 'pending_review' | 'revoked',
  ): Promise<LicenceRow> {
    const verifiedAt =
      status === 'verified' ? new Date() : null;

    await this.prisma.$executeRaw`
      UPDATE identity.professional_licences
      SET status      = ${status},
          verified_by = ${status === 'verified' ? reviewerId : null}::uuid,
          verified_at = ${verifiedAt},
          updated_at  = NOW()
      WHERE id = ${licenceId}::uuid
    `;

    return this.findById(licenceId);
  }

  async adminListAll(opts: {
    status?: string;
    licenceType?: string;
    page: number;
    limit: number;
  }): Promise<{ data: LicenceRow[]; total: number }> {
    const offset = (opts.page - 1) * opts.limit;

    const statusFilter = opts.status ? opts.status : null;
    const typeFilter = opts.licenceType ? opts.licenceType : null;

    const data = await this.prisma.$queryRaw<LicenceRow[]>`
      SELECT *
      FROM identity.professional_licences
      WHERE (${statusFilter}::text IS NULL OR status = ${statusFilter})
        AND (${typeFilter}::text IS NULL OR licence_type = ${typeFilter})
      ORDER BY created_at DESC
      LIMIT ${opts.limit} OFFSET ${offset}
    `;

    const counts = await this.prisma.$queryRaw<Array<{ count: string }>>`
      SELECT COUNT(*)::text
      FROM identity.professional_licences
      WHERE (${statusFilter}::text IS NULL OR status = ${statusFilter})
        AND (${typeFilter}::text IS NULL OR licence_type = ${typeFilter})
    `;

    return { data, total: parseInt(counts[0]?.count ?? '0', 10) };
  }

  /** Returns licences expiring within `daysAhead` days (for alerting). */
  async findExpiring(daysAhead: number): Promise<LicenceRow[]> {
    return this.prisma.$queryRaw<LicenceRow[]>`
      SELECT *
      FROM identity.professional_licences
      WHERE status = 'verified'
        AND expiry_date IS NOT NULL
        AND expiry_date <= (NOW() + (${daysAhead} || ' days')::interval)
        AND expiry_date > NOW()
      ORDER BY expiry_date ASC
    `;
  }
}
