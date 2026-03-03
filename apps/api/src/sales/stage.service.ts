import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { SalesAuditService } from './sales-audit.service';
import { SalesService } from './sales.service';
import { CompleteStageDto, FlagStageDto, StartStageDto } from './sales.dto';
import {
  STAGE_TRANSITIONS,
  StageStatus,
  TOTAL_STAGES,
  resolveSalesActorRole,
} from './sales.constants';

type StageProgressRow = {
  id: string;
  sale_id: string;
  stage_number: number;
  status: string;
  started_at: Date | null;
  completed_at: Date | null;
  completed_by: string | null;
  days_in_stage: number | null;
  notes: string | null;
};

type StageConfigRow = {
  stage_number: number;
  stage_name: string;
  responsible_role: string | null;
  is_blocker: boolean;
  government_dept: string | null;
  typical_duration_days: number | null;
  required_documents: unknown;
};

@Injectable()
export class StageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sales: SalesService,
    private readonly audit: SalesAuditService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // List stages for a sale (with config metadata)
  // ─────────────────────────────────────────────────────────

  async listStages(saleId: string, requesterId: string, requesterRoles: string[]): Promise<unknown[]> {
    const sale = await this.sales.findSaleOrThrow(saleId);
    this.sales.assertParticipant(sale, requesterId, requesterRoles);

    return this.prisma.$queryRaw<unknown[]>`
      SELECT
        sp.id,
        sp.stage_number,
        sp.status,
        sp.started_at,
        sp.completed_at,
        sp.completed_by,
        sp.days_in_stage,
        sp.notes,
        sc.stage_name,
        sc.description,
        sc.responsible_role,
        sc.is_blocker,
        sc.government_dept,
        sc.typical_duration_days,
        sc.required_documents
      FROM sales.sale_stage_progress sp
      JOIN sales.stage_configs sc
        ON sc.country = ${sale.country} AND sc.stage_number = sp.stage_number
      WHERE sp.sale_id = ${saleId}::uuid
      ORDER BY sp.stage_number ASC
    `;
  }

  // ─────────────────────────────────────────────────────────
  // Start a stage
  // ─────────────────────────────────────────────────────────

  async startStage(
    saleId: string,
    stageNumber: number,
    actorId: string,
    actorRoles: string[],
    dto: StartStageDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<StageProgressRow> {
    const sale = await this.sales.findSaleOrThrow(saleId);
    this.sales.assertParticipant(sale, actorId, actorRoles);

    await this.assertStageUnlocked(saleId, stageNumber, sale.country);
    const stage = await this.getStageOrThrow(saleId, stageNumber);
    this.assertTransition(stage.status as StageStatus, 'in_progress');

    const [updated] = await this.prisma.$queryRaw<StageProgressRow[]>`
      UPDATE sales.sale_stage_progress
      SET status = 'in_progress', started_at = NOW(), notes = COALESCE(${dto.notes ?? null}, notes)
      WHERE sale_id = ${saleId}::uuid AND stage_number = ${stageNumber}
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole: resolveSalesActorRole(actorRoles),
      action: 'sale.stage.started',
      resourceType: 'property_sale',
      resourceId: saleId,
      payload: { stageNumber },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────
  // Complete a stage
  // ─────────────────────────────────────────────────────────

  async completeStage(
    saleId: string,
    stageNumber: number,
    actorId: string,
    actorRoles: string[],
    dto: CompleteStageDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<StageProgressRow> {
    const sale = await this.sales.findSaleOrThrow(saleId);
    this.sales.assertParticipant(sale, actorId, actorRoles);

    const stage = await this.getStageOrThrow(saleId, stageNumber);
    this.assertTransition(stage.status as StageStatus, 'completed');

    // Blocker check: all required documents must be in 'received' or 'verified' status
    const config = await this.getStageConfig(sale.country, stageNumber);
    if (config?.is_blocker) {
      const missing = await this.prisma.$queryRaw<{ count: string }[]>`
        SELECT COUNT(*)::text AS count
        FROM sales.stage_documents
        WHERE sale_id = ${saleId}::uuid
          AND stage_number = ${stageNumber}
          AND is_required = TRUE
          AND status NOT IN ('received','verified')
      `;
      if (Number(missing[0].count) > 0) {
        throw new BadRequestException(
          `Stage ${stageNumber} is a blocker stage — all required documents must be received/verified before completing`,
        );
      }
    }

    const [updated] = await this.prisma.$queryRaw<StageProgressRow[]>`
      UPDATE sales.sale_stage_progress
      SET
        status = 'completed',
        completed_at = NOW(),
        completed_by = ${actorId}::uuid,
        notes = COALESCE(${dto.notes ?? null}, notes)
      WHERE sale_id = ${saleId}::uuid AND stage_number = ${stageNumber}
      RETURNING *
    `;

    // Advance the master current_stage
    if (stageNumber < TOTAL_STAGES) {
      await this.prisma.$executeRaw`
        UPDATE sales.property_sales
        SET current_stage = ${stageNumber + 1}
        WHERE id = ${saleId}::uuid AND current_stage = ${stageNumber}
      `;
    } else {
      // Stage 14 = final — mark sale completed
      await this.prisma.$executeRaw`
        UPDATE sales.property_sales
        SET status = 'completed', updated_at = NOW()
        WHERE id = ${saleId}::uuid
      `;
    }

    await this.audit.log({
      actorId,
      actorRole: resolveSalesActorRole(actorRoles),
      action: 'sale.stage.completed',
      resourceType: 'property_sale',
      resourceId: saleId,
      payload: { stageNumber },
      ipAddress,
      userAgent,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────
  // Flag a stage (creates a sale issue)
  // ─────────────────────────────────────────────────────────

  async flagStage(
    saleId: string,
    stageNumber: number,
    actorId: string,
    actorRoles: string[],
    dto: FlagStageDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<unknown> {
    const sale = await this.sales.findSaleOrThrow(saleId);
    this.sales.assertParticipant(sale, actorId, actorRoles);

    // Mark stage as blocked
    await this.prisma.$executeRaw`
      UPDATE sales.sale_stage_progress
      SET status = 'blocked'
      WHERE sale_id = ${saleId}::uuid AND stage_number = ${stageNumber}
        AND status IN ('not_started','in_progress')
    `;

    const [issue] = await this.prisma.$queryRaw<unknown[]>`
      INSERT INTO sales.sale_issues (sale_id, stage_number, reported_by, issue_type, description)
      VALUES (${saleId}::uuid, ${stageNumber}, ${actorId}::uuid, ${dto.issueType}, ${dto.description})
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole: resolveSalesActorRole(actorRoles),
      action: 'sale.stage.flagged',
      resourceType: 'property_sale',
      resourceId: saleId,
      payload: { stageNumber, issueType: dto.issueType },
      ipAddress,
      userAgent,
    });

    return issue;
  }

  // ─────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────

  private async getStageOrThrow(saleId: string, stageNumber: number): Promise<StageProgressRow> {
    const rows = await this.prisma.$queryRaw<StageProgressRow[]>`
      SELECT * FROM sales.sale_stage_progress
      WHERE sale_id = ${saleId}::uuid AND stage_number = ${stageNumber}
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException(`Stage ${stageNumber} not found for sale ${saleId}`);
    return rows[0];
  }

  private async getStageConfig(country: string, stageNumber: number): Promise<StageConfigRow | null> {
    const rows = await this.prisma.$queryRaw<StageConfigRow[]>`
      SELECT * FROM sales.stage_configs
      WHERE country = ${country} AND stage_number = ${stageNumber}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  /** Blocker stages: all previous blocker stages must be completed before this stage can start */
  private async assertStageUnlocked(saleId: string, stageNumber: number, country: string): Promise<void> {
    if (stageNumber <= 1) return;

    const blockers = await this.prisma.$queryRaw<{ stage_number: number; status: string }[]>`
      SELECT sp.stage_number, sp.status
      FROM sales.sale_stage_progress sp
      JOIN sales.stage_configs sc
        ON sc.country = ${country} AND sc.stage_number = sp.stage_number
      WHERE sp.sale_id = ${saleId}::uuid
        AND sc.is_blocker = TRUE
        AND sp.stage_number < ${stageNumber}
        AND sp.status <> 'completed'
    `;
    if (blockers.length > 0) {
      const nums = blockers.map((b) => b.stage_number).join(', ');
      throw new ConflictException(
        `Stage ${stageNumber} cannot start — blocker stage(s) [${nums}] are not yet completed`,
      );
    }
  }

  private assertTransition(current: StageStatus, next: StageStatus): void {
    const allowed = STAGE_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new ConflictException(
        `Stage transition '${current}' → '${next}' is not allowed`,
      );
    }
  }
}
