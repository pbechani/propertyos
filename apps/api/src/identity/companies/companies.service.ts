import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { AuditService } from '../audit.service';
import { NotificationService } from '../notification.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  ListCompaniesQueryDto,
} from './dto/company.dto';

export const COMPANY_CATEGORY_ROLES: Record<string, string[]> = {
  agent: ['agent', 'admin'],
  contractor: ['contractor', 'admin'],
  supplier: ['supplier', 'admin'],
  conveyancer: ['conveyancer', 'admin'],
  inspector: ['inspector', 'admin'],
  logistics: ['truck_operator', 'admin'],
  developing: ['buyer_seller', 'contractor', 'agent', 'admin'],
};

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------

  /** Returns the non-admin roles that can be invited into a company based on its category. */
  async getAllowedRoles(companyId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ category: string }>>`
      SELECT category FROM identity.companies WHERE id = ${companyId}::uuid LIMIT 1
    `;
    if (!rows[0]) return [];
    const all = COMPANY_CATEGORY_ROLES[rows[0].category] ?? [];
    return all.filter((r) => r !== 'admin');
  }

  async create(
    dto: CreateCompanyDto,
    createdBy: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    const allowedRoles = COMPANY_CATEGORY_ROLES[dto.category];
    if (!allowedRoles) {
      throw new BadRequestException(`Unknown company category: ${dto.category}`);
    }

    const slug = await this.generateUniqueSlug(dto.name);

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO identity.companies (
        name, slug, category, registration_number, tax_number,
        website, phone, email, address, logo_url, description, created_by
      ) VALUES (
        ${dto.name},
        ${slug},
        ${dto.category},
        ${dto.registration_number ?? null},
        ${dto.tax_number ?? null},
        ${dto.website ?? null},
        ${dto.phone ?? null},
        ${dto.email},
        ${JSON.stringify(dto.address ?? {})}::jsonb,
        ${dto.logo_url ?? null},
        ${dto.description ?? null},
        ${createdBy}::uuid
      )
      RETURNING id
    `;
    const companyId = rows[0].id;

    // Auto-add creator as admin member
    await this.prisma.$executeRaw`
      INSERT INTO identity.company_members (company_id, user_id, role, is_admin, invited_by)
      VALUES (
        ${companyId}::uuid,
        ${createdBy}::uuid,
        'admin',
        true,
        ${createdBy}::uuid
      )
    `;

    await this.auditService.log({
      eventId: 'company.created',
      actorId: createdBy,
      actorRole: 'admin',
      action: 'create',
      resourceType: 'company',
      resourceId: companyId,
      payload: { company_id: companyId, category: dto.category },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    // Notify platform admins
    void this.notificationService.sendEmail(
      'platform-admin@pribec.com',
      'New company registered',
      `A new company "${dto.name}" (${dto.category}) has been registered and requires verification. ID: ${companyId}`,
    );

    return this.findById(companyId);
  }

  async findById(id: string) {
    const rows = await this.prisma.$queryRaw<
      Array<Record<string, unknown>>
    >`SELECT * FROM identity.companies WHERE id = ${id}::uuid LIMIT 1`;
    if (!rows[0]) throw new NotFoundException('Company not found');
    return rows[0];
  }

  async update(
    id: string,
    dto: UpdateCompanyDto,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    const company = await this.findById(id) as Record<string, unknown>;

    if (company['is_system']) {
      throw new ForbiddenException('System companies cannot be modified');
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined) {
      setClauses.push(`name = $${values.length + 1}`);
      values.push(dto.name);
    }
    if (dto.email !== undefined) {
      setClauses.push(`email = $${values.length + 1}`);
      values.push(dto.email);
    }
    if (dto.registration_number !== undefined) {
      setClauses.push(`registration_number = $${values.length + 1}`);
      values.push(dto.registration_number);
    }
    if (dto.tax_number !== undefined) {
      setClauses.push(`tax_number = $${values.length + 1}`);
      values.push(dto.tax_number);
    }
    if (dto.website !== undefined) {
      setClauses.push(`website = $${values.length + 1}`);
      values.push(dto.website);
    }
    if (dto.phone !== undefined) {
      setClauses.push(`phone = $${values.length + 1}`);
      values.push(dto.phone);
    }
    if (dto.address !== undefined) {
      setClauses.push(`address = $${values.length + 1}::jsonb`);
      values.push(JSON.stringify(dto.address));
    }
    if (dto.logo_url !== undefined) {
      setClauses.push(`logo_url = $${values.length + 1}`);
      values.push(dto.logo_url);
    }
    if (dto.description !== undefined) {
      setClauses.push(`description = $${values.length + 1}`);
      values.push(dto.description);
    }

    if (setClauses.length === 0) return company;

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE identity.companies SET ${setClauses.join(', ')} WHERE id = $${values.length}::uuid`;
    await this.prisma.$executeRawUnsafe(sql, ...values);

    await this.auditService.log({
      eventId: 'company.updated',
      actorId,
      actorRole: 'admin',
      action: 'update',
      resourceType: 'company',
      resourceId: id,
      payload: { company_id: id, fields: Object.keys(dto) },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return this.findById(id);
  }

  async submitForVerification(
    id: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    const company = await this.findById(id) as Record<string, string>;

    if ((company as Record<string, unknown>)['is_system']) {
      throw new ForbiddenException('System companies cannot be modified');
    }

    if (company['verification_status'] !== 'unverified') {
      throw new BadRequestException(
        'Verification already submitted or completed',
      );
    }

    await this.prisma.$executeRaw`
      UPDATE identity.companies
      SET verification_status = 'pending', updated_at = NOW()
      WHERE id = ${id}::uuid
    `;

    await this.auditService.log({
      eventId: 'company.submitted_for_verification',
      actorId,
      actorRole: 'admin',
      action: 'submit_verification',
      resourceType: 'company',
      resourceId: id,
      payload: { company_id: id },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return this.findById(id);
  }

  async listForAdmin(query: ListCompaniesQueryDto) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (query.status) {
      values.push(query.status);
      conditions.push(`status = $${values.length}`);
    }
    if (query.category) {
      values.push(query.category);
      conditions.push(`category = $${values.length}`);
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const offset = (page - 1) * limit;

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM identity.companies ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const data = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql, ...values);

    return { data, page, limit };
  }

  async verify(
    id: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    await this.findById(id);

    await this.prisma.$executeRaw`
      UPDATE identity.companies
      SET verification_status = 'verified',
          status = 'active',
          verified_by = ${actorId}::uuid,
          verified_at = NOW(),
          updated_at = NOW()
      WHERE id = ${id}::uuid
    `;

    await this.auditService.log({
      eventId: 'company.verified',
      actorId,
      actorRole: 'admin',
      action: 'verify',
      resourceType: 'company',
      resourceId: id,
      payload: { company_id: id },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    const updated = await this.findById(id) as Record<string, unknown>;

    // Notify company admin
    void this.notifyCompanyAdmin(id, updated,
      'Your company has been verified on PRIBEC',
      `Your company "${updated['name']}" has been successfully verified. You can now invite team members and start using all company features.`,
      true,
    );

    return updated;
  }

  async reject(
    id: string,
    reason: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    await this.findById(id);

    await this.prisma.$executeRaw`
      UPDATE identity.companies
      SET verification_status = 'rejected',
          rejection_reason = ${reason},
          updated_at = NOW()
      WHERE id = ${id}::uuid
    `;

    await this.auditService.log({
      eventId: 'company.rejected',
      actorId,
      actorRole: 'admin',
      action: 'reject',
      resourceType: 'company',
      resourceId: id,
      payload: { company_id: id, reason },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    const updated = await this.findById(id) as Record<string, unknown>;
    void this.notifyCompanyAdmin(id, updated,
      'Your company verification was not approved',
      `Your company "${updated['name']}" verification was rejected. Reason: ${reason}`,
      false,
    );

    return updated;
  }

  async suspend(
    id: string,
    reason: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    await this.findById(id);

    await this.prisma.$executeRaw`
      UPDATE identity.companies
      SET status = 'suspended', updated_at = NOW()
      WHERE id = ${id}::uuid
    `;

    await this.auditService.log({
      eventId: 'company.suspended',
      actorId,
      actorRole: 'admin',
      action: 'suspend',
      resourceType: 'company',
      resourceId: id,
      payload: { company_id: id, reason },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    const updated = await this.findById(id) as Record<string, unknown>;
    void this.notifyCompanyAdmin(id, updated,
      'Your company has been suspended',
      `Your company "${updated['name']}" has been suspended. Reason: ${reason}. Please contact support.`,
      true,
    );

    return updated;
  }

  async deactivate(
    id: string,
    actorId: string,
    requestContext: { ip: string; userAgent?: string | null },
  ) {
    const company = await this.findById(id) as Record<string, unknown>;

    if (company['status'] === 'deactivated') {
      throw new BadRequestException('Company is already deactivated');
    }

    await this.prisma.$executeRaw`
      UPDATE identity.companies
      SET status = 'deactivated', updated_at = NOW()
      WHERE id = ${id}::uuid
    `;

    await this.auditService.log({
      eventId: 'company.deactivated',
      actorId,
      actorRole: 'admin',
      action: 'deactivate',
      resourceType: 'company',
      resourceId: id,
      payload: { company_id: id },
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
    });

    return { id, status: 'deactivated' };
  }

  async getDashboard(companyId: string) {
    const [company, memberRows, inviteRows, orphanRows, recentActivity, todayCount] =
      await Promise.all([
        this.findById(companyId),
        this.prisma.$queryRaw<Array<{ cnt: bigint }>>`
          SELECT COUNT(*) AS cnt
          FROM identity.company_members
          WHERE company_id = ${companyId}::uuid
            AND status = 'active'
        `,
        this.prisma.$queryRaw<Array<{ cnt: bigint }>>`
          SELECT COUNT(*) AS cnt
          FROM identity.company_invitations
          WHERE company_id = ${companyId}::uuid
            AND status = 'pending'
        `,
        this.prisma.$queryRaw<Array<{ cnt: bigint }>>`
          SELECT COUNT(*) AS cnt
          FROM identity.company_orphaned_tasks
          WHERE company_id = ${companyId}::uuid
            AND status = 'open'
        `,
        this.auditService.findByCompany(companyId, 5),
        this.auditService.countTodayByCompany(companyId),
      ]);

    return {
      company,
      stats: {
        activeMembers: Number(memberRows[0]?.cnt ?? 0),
        pendingInvitations: Number(inviteRows[0]?.cnt ?? 0),
        openOrphanedTasks: Number(orphanRows[0]?.cnt ?? 0),
        todayActivities: todayCount,
      },
      recentActivity,
    };
  }

  async getAuditLogs(companyId: string, limit: number = 50, offset: number = 0) {
    const safeLimit = Math.min(limit, 200);
    const safeOffset = Math.max(offset, 0);
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT al.id, al.event_id, al.actor_id, al.actor_role, al.action,
             al.resource_type, al.resource_id, al.payload, al.created_at,
             u.first_name, u.last_name, u.email
      FROM identity.audit_logs al
      LEFT JOIN identity.users u ON u.id = al.actor_id
      WHERE al.company_id = ${companyId}::uuid
      ORDER BY al.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80);

    let slug = base;
    let counter = 0;
    while (true) {
      const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM identity.companies WHERE slug = ${slug} LIMIT 1
      `;
      if (!existing[0]) break;
      counter++;
      slug = `${base}-${counter}`;
    }
    return slug;
  }

  // ----------------------------------------------------------------
  // Verification Documents
  // ----------------------------------------------------------------

  async listDocuments(companyId: string) {
    await this.findById(companyId); // 404 guard
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        cd.id, cd.company_id, cd.uploaded_by, cd.document_type,
        cd.document_name, cd.file_name, cd.storage_path, cd.public_url,
        cd.mime_type, cd.file_size_bytes, cd.status,
        cd.review_notes, cd.reviewed_by, cd.reviewed_at,
        cd.created_at, cd.updated_at,
        u.first_name, u.last_name
      FROM identity.company_documents cd
      LEFT JOIN identity.users u ON u.id = cd.uploaded_by
      WHERE cd.company_id = ${companyId}::uuid
      ORDER BY cd.created_at DESC
    `;
  }

  async addDocument(params: {
    companyId: string;
    uploadedBy: string;
    documentType: string;
    documentName: string;
    fileName: string;
    storagePath: string;
    publicUrl: string;
    mimeType: string;
    fileSizeBytes: number;
  }) {
    await this.findById(params.companyId); // 404 guard
    await this.prisma.$executeRaw`
      INSERT INTO identity.company_documents (
        company_id, uploaded_by, document_type, document_name,
        file_name, storage_path, public_url, mime_type, file_size_bytes
      ) VALUES (
        ${params.companyId}::uuid,
        ${params.uploadedBy}::uuid,
        ${params.documentType},
        ${params.documentName},
        ${params.fileName},
        ${params.storagePath},
        ${params.publicUrl},
        ${params.mimeType},
        ${params.fileSizeBytes}
      )
    `;
    return this.listDocuments(params.companyId);
  }

  private async notifyCompanyAdmin(
    companyId: string,
    _company: Record<string, unknown>,
    subject: string,
    body: string,
    sms: boolean,
  ) {
    const admins = await this.prisma.$queryRaw<
      Array<{ email: string; phone: string | null }>
    >`
      SELECT u.email, u.phone
      FROM identity.company_members cm
      JOIN identity.users u ON u.id = cm.user_id
      WHERE cm.company_id = ${companyId}::uuid
        AND cm.is_admin = true
        AND cm.status = 'active'
    `;

    for (const admin of admins) {
      void this.notificationService.sendEmail(admin.email, subject, body);
      if (sms && admin.phone) {
        void this.notificationService.sendSms(admin.phone, body.slice(0, 160));
      }
    }
  }
}
