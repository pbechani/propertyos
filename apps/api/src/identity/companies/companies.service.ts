import {
  BadRequestException,
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
    const company = await this.findById(id);

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
