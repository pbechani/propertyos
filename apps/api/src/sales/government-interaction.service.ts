import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';
import { SalesAuditService } from './sales-audit.service';
import { SalesService } from './sales.service';
import {
  CreateGovernmentInteractionDto,
  UpdateGovernmentInteractionDto,
} from './sales.dto';
import { resolveSalesActorRole } from './sales.constants';

type GovInteractionRow = {
  id: string;
  sale_id: string;
  stage_number: number;
  department_name: string;
  application_reference: string | null;
  submission_date: Date | null;
  expected_completion_date: Date | null;
  actual_completion_date: Date | null;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class GovernmentInteractionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sales: SalesService,
    private readonly audit: SalesAuditService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // Create government interaction
  // ─────────────────────────────────────────────────────────

  async create(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: CreateGovernmentInteractionDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GovInteractionRow> {
    const actorRole = resolveSalesActorRole(actorRoles);
    if (!['admin', 'conveyancer'].includes(actorRole)) {
      throw new ForbiddenException('Only conveyancers and admins may record government interactions');
    }

    const sale = await this.sales.findSaleOrThrow(saleId);

    const [row] = await this.prisma.$queryRaw<GovInteractionRow[]>`
      INSERT INTO sales.government_interactions
        (sale_id, stage_number, department_name, application_reference,
         submission_date, expected_completion_date, notes)
      VALUES (
        ${saleId}::uuid,
        ${dto.stageNumber},
        ${dto.departmentName},
        ${dto.applicationReference ?? null},
        ${dto.submissionDate ?? null}::date,
        ${dto.expectedCompletionDate ?? null}::date,
        ${dto.notes ?? null}
      )
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.gov_interaction.created',
      resourceType: 'government_interaction',
      resourceId: row.id,
      payload: { saleId, stageNumber: dto.stageNumber, departmentName: dto.departmentName },
      ipAddress,
      userAgent,
    });

    return row;
  }

  // ─────────────────────────────────────────────────────────
  // Update government interaction
  // ─────────────────────────────────────────────────────────

  async update(
    saleId: string,
    interactionId: string,
    actorId: string,
    actorRoles: string[],
    dto: UpdateGovernmentInteractionDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GovInteractionRow> {
    const actorRole = resolveSalesActorRole(actorRoles);
    if (!['admin', 'conveyancer'].includes(actorRole)) {
      throw new ForbiddenException('Only conveyancers and admins may update government interactions');
    }

    const rows = await this.prisma.$queryRaw<GovInteractionRow[]>`
      SELECT * FROM sales.government_interactions
      WHERE id = ${interactionId}::uuid AND sale_id = ${saleId}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException(`Government interaction ${interactionId} not found`);

    const [updated] = await this.prisma.$queryRaw<GovInteractionRow[]>`
      UPDATE sales.government_interactions SET
        status                    = COALESCE(${dto.status ?? null}, status),
        application_reference     = COALESCE(${dto.applicationReference ?? null}, application_reference),
        submission_date           = COALESCE(${dto.submissionDate ?? null}::date, submission_date),
        expected_completion_date  = COALESCE(${dto.expectedCompletionDate ?? null}::date, expected_completion_date),
        actual_completion_date    = COALESCE(${dto.actualCompletionDate ?? null}::date, actual_completion_date),
        notes                     = COALESCE(${dto.notes ?? null}, notes),
        updated_at                = NOW()
      WHERE id = ${interactionId}::uuid AND sale_id = ${saleId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.gov_interaction.updated',
      resourceType: 'government_interaction',
      resourceId: interactionId,
      payload: { saleId, ...(dto as unknown as Record<string, unknown>) },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────
  // List interactions for a sale
  // ─────────────────────────────────────────────────────────

  async list(
    saleId: string,
    requesterId: string,
    requesterRoles: string[],
  ): Promise<GovInteractionRow[]> {
    const sale = await this.sales.findSaleOrThrow(saleId);
    this.sales.assertParticipant(sale, requesterId, requesterRoles);

    return this.prisma.$queryRaw<GovInteractionRow[]>`
      SELECT * FROM sales.government_interactions
      WHERE sale_id = ${saleId}::uuid
      ORDER BY stage_number ASC, created_at DESC
    `;
  }
}
