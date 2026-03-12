import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { CreateCaseDto, UpdateCaseDto } from './conveyancing.dto';
import { CASE_STATUSES, CASE_PRIORITIES } from './conveyancing.constants';

let caseRefCounter = 0;
function generateCaseReference(country: string): string {
  const ts = Date.now();
  caseRefCounter = (caseRefCounter + 1) % 10000;
  return `${country}-CV-${ts}-${String(caseRefCounter).padStart(4, '0')}`;
}

export type CaseRow = {
  id: string;
  case_reference: string;
  sale_id: string;
  firm_id: string;
  lead_conveyancer_id: string;
  support_staff_ids: unknown;
  case_type: string;
  priority: string;
  status: string;
  opened_at: Date;
  target_registration_date: Date | null;
  actual_registration_date: Date | null;
  country: string;
  notes: string | null;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class ConveyancingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ConveyancingAuditService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // Create Case
  // ─────────────────────────────────────────────────────────

  async createCase(
    actorId: string,
    actorRole: string,
    dto: CreateCaseDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CaseRow> {
    // Validate sale exists (cross-schema read)
    const saleRows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM sales.property_sales WHERE id = ${dto.saleId}::uuid LIMIT 1
    `;
    if (!saleRows.length) throw new NotFoundException('Sale not found');

    // Prevent duplicate conveyancing case for same sale
    const existing = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM conveyancing.cases WHERE sale_id = ${dto.saleId}::uuid LIMIT 1
    `;
    if (existing.length) throw new ConflictException('A conveyancing case for this sale already exists');

    const ref = generateCaseReference(dto.country ?? 'ZA');
    const priority = dto.priority ?? 'normal';

    const rows = await this.prisma.$queryRaw<CaseRow[]>`
      INSERT INTO conveyancing.cases
        (case_reference, sale_id, firm_id, lead_conveyancer_id, case_type, priority, country, target_registration_date, notes)
      VALUES (
        ${ref},
        ${dto.saleId}::uuid,
        ${dto.firmId}::uuid,
        ${dto.leadConveyancerId}::uuid,
        ${dto.caseType},
        ${priority},
        ${dto.country ?? 'ZA'},
        ${dto.targetRegistrationDate ?? null}::date,
        ${dto.notes ?? null}
      )
      RETURNING *
    `;
    const convCase = rows[0];

    await this.seedTasksForCase(convCase.id, dto.caseType, dto.country ?? 'ZA');

    await this.audit.log({
      actorId,
      actorRole,
      firmId: dto.firmId,
      action: 'case.created',
      resourceType: 'conveyancing_case',
      resourceId: convCase.id,
      payload: { caseReference: ref, saleId: dto.saleId },
      ipAddress,
      userAgent,
    });

    return convCase;
  }

  // ─────────────────────────────────────────────────────────
  // List Cases (firm-scoped or admin-wide)
  // ─────────────────────────────────────────────────────────

  async listCases(
    actorRoles: string[],
    firmId?: string,
    conveyancerId?: string,
    status?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: CaseRow[]; total: number }> {
    const isAdmin = actorRoles.includes('admin');
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const offset = (Math.max(page, 1) - 1) * safeLimit;

    const firmFilter = !isAdmin && firmId ? firmId : null;
    const convFilter = actorRoles.includes('conveyancer') && !isAdmin && conveyancerId ? conveyancerId : null;

    const rows = await this.prisma.$queryRaw<(CaseRow & { total_count: string })[]>`
      SELECT *, COUNT(*) OVER () AS total_count
      FROM conveyancing.cases
      WHERE
        (${firmFilter}::uuid IS NULL OR firm_id = ${firmFilter}::uuid)
        AND (${convFilter}::uuid IS NULL OR lead_conveyancer_id = ${convFilter}::uuid)
        AND (${status ?? null}::varchar IS NULL OR status = ${status ?? null})
      ORDER BY opened_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    const total = rows.length > 0 ? parseInt(rows[0].total_count as string, 10) : 0;
    return { data: rows, total };
  }

  // ─────────────────────────────────────────────────────────
  // Get Case
  // ─────────────────────────────────────────────────────────

  async getCase(
    actorRoles: string[],
    caseId: string,
    firmId?: string,
  ): Promise<CaseRow> {
    const rows = await this.prisma.$queryRaw<CaseRow[]>`
      SELECT * FROM conveyancing.cases WHERE id = ${caseId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Conveyancing case not found');
    const convCase = rows[0];

    if (!actorRoles.includes('admin') && firmId && convCase.firm_id !== firmId) {
      throw new ForbiddenException('Access denied to this case');
    }

    return convCase;
  }

  // ─────────────────────────────────────────────────────────
  // Update Case
  // ─────────────────────────────────────────────────────────

  async updateCase(
    actorId: string,
    actorRole: string,
    caseId: string,
    firmId: string,
    dto: UpdateCaseDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CaseRow> {
    await this.getCase([actorRole], caseId, actorRole === 'admin' ? undefined : firmId);

    if (dto.status && !CASE_STATUSES.includes(dto.status as any)) {
      throw new ConflictException('Invalid case status');
    }
    if (dto.priority && !CASE_PRIORITIES.includes(dto.priority as any)) {
      throw new ConflictException('Invalid priority');
    }

    const rows = await this.prisma.$queryRaw<CaseRow[]>`
      UPDATE conveyancing.cases
      SET
        status = COALESCE(${dto.status ?? null}, status),
        priority = COALESCE(${dto.priority ?? null}, priority),
        lead_conveyancer_id = COALESCE(${dto.leadConveyancerId ?? null}::uuid, lead_conveyancer_id),
        target_registration_date = COALESCE(${dto.targetRegistrationDate ?? null}::date, target_registration_date),
        actual_registration_date = COALESCE(${dto.actualRegistrationDate ?? null}::date, actual_registration_date),
        notes = COALESCE(${dto.notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${caseId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'case.updated',
      resourceType: 'conveyancing_case',
      resourceId: caseId,
      payload: { changes: dto },
      ipAddress,
      userAgent,
    });

    return rows[0];
  }

  // ─────────────────────────────────────────────────────────
  // Seed tasks from templates when case is created
  // ─────────────────────────────────────────────────────────

  private async seedTasksForCase(
    caseId: string,
    caseType: string,
    country: string,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO conveyancing.case_tasks
        (case_id, template_task_id, title, description, stage_number, responsible_role,
         due_date, priority, is_blocker, sort_order)
      SELECT
        ${caseId}::uuid,
        id,
        title,
        description,
        stage_number,
        responsible_role,
        CASE
          WHEN default_due_days_from_stage_open IS NOT NULL
          THEN (NOW() + (default_due_days_from_stage_open || ' days')::interval)::date
          ELSE NULL
        END,
        'normal',
        is_blocker,
        sort_order
      FROM conveyancing.task_templates
      WHERE country = ${country} AND case_type = ${caseType} AND is_active = TRUE
    `;
  }
}
