import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import {
  CreateGovInteractionDto,
  UpdateGovInteractionDto,
  AdvanceLifecycleDto,
} from './conveyancing.dto';
import { LIFECYCLE_PHASES } from './conveyancing.constants';

export type GovInteractionRow = {
  id: string;
  case_id: string;
  department: string;
  interaction_type: string;
  reference_number: string | null;
  description: string;
  submitted_at: Date | null;
  expected_response_at: Date | null;
  resolved_at: Date | null;
  status: string;
  notes: string | null;
  recorded_by: string;
  created_at: Date;
  updated_at: Date;
};

export type LifecycleHistoryRow = {
  id: string;
  case_id: string;
  from_phase: number | null;
  to_phase: number;
  from_status: string | null;
  to_status: string;
  triggered_by: string;
  trigger: string;
  notes: string | null;
  created_at: Date;
};

@Injectable()
export class GovernmentInteractionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ConveyancingAuditService,
  ) {}

  // ─── Government Interactions ────────────────────────────────────────────────

  async listInteractions(caseId: string, department?: string): Promise<GovInteractionRow[]> {
    return this.prisma.$queryRaw<GovInteractionRow[]>`
      SELECT * FROM conveyancing.government_interactions
      WHERE case_id = ${caseId}::uuid
        AND (${department ?? null}::varchar IS NULL OR department = ${department ?? null})
      ORDER BY created_at DESC
    `;
  }

  async createInteraction(
    actorId: string,
    actorRole: string,
    firmId: string,
    caseId: string,
    dto: CreateGovInteractionDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GovInteractionRow> {
    await this.assertCaseExists(caseId, firmId);

    const rows = await this.prisma.$queryRaw<GovInteractionRow[]>`
      INSERT INTO conveyancing.government_interactions
        (case_id, department, interaction_type, description,
         reference_number, submitted_at, expected_response_at, notes, recorded_by)
      VALUES (
        ${caseId}::uuid,
        ${dto.department},
        ${dto.interactionType},
        ${dto.description},
        ${dto.referenceNumber ?? null},
        ${dto.submittedAt ?? null}::timestamptz,
        ${dto.expectedResponseAt ?? null}::date,
        ${dto.notes ?? null},
        ${actorId}::uuid
      )
      RETURNING *
    `;
    const interaction = rows[0];

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'gov_interaction.created',
      resourceType: 'gov_interaction',
      resourceId: interaction.id,
      payload: { caseId, department: dto.department, interactionType: dto.interactionType },
      ipAddress,
      userAgent,
    });

    return interaction;
  }

  async updateInteraction(
    actorId: string,
    actorRole: string,
    firmId: string,
    interactionId: string,
    dto: UpdateGovInteractionDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<GovInteractionRow> {
    await this.assertInteractionExists(interactionId, firmId);

    const rows = await this.prisma.$queryRaw<GovInteractionRow[]>`
      UPDATE conveyancing.government_interactions
      SET
        status           = COALESCE(${dto.status ?? null}, status),
        reference_number = COALESCE(${dto.referenceNumber ?? null}, reference_number),
        resolved_at      = COALESCE(${dto.resolvedAt ?? null}::timestamptz, resolved_at),
        notes            = COALESCE(${dto.notes ?? null}, notes),
        updated_at       = NOW()
      WHERE id = ${interactionId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'gov_interaction.updated',
      resourceType: 'gov_interaction',
      resourceId: interactionId,
      payload: { changes: dto },
      ipAddress,
      userAgent,
    });

    return rows[0];
  }

  // ─── Case Lifecycle ─────────────────────────────────────────────────────────

  async getLifecycleHistory(caseId: string): Promise<LifecycleHistoryRow[]> {
    return this.prisma.$queryRaw<LifecycleHistoryRow[]>`
      SELECT * FROM conveyancing.case_lifecycle_history
      WHERE case_id = ${caseId}::uuid
      ORDER BY created_at DESC
    `;
  }

  async advanceLifecycle(
    actorId: string,
    actorRole: string,
    firmId: string,
    caseId: string,
    dto: AdvanceLifecycleDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ lifecyclePhase: number; phaseName: string; historyId: string }> {
    const caseRows = await this.prisma.$queryRaw<
      { id: string; lifecycle_phase: number; status: string }[]
    >`
      SELECT id, lifecycle_phase, status FROM conveyancing.cases
      WHERE id = ${caseId}::uuid AND firm_id = ${firmId}::uuid LIMIT 1
    `;
    if (!caseRows.length) throw new NotFoundException('Conveyancing case not found');

    const currentCase = caseRows[0];
    const phaseName = LIFECYCLE_PHASES[dto.toPhase];
    if (!phaseName) {
      throw new NotFoundException(`Invalid lifecycle phase: ${dto.toPhase}. Must be 1–13.`);
    }

    // Record history entry
    const historyRows = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO conveyancing.case_lifecycle_history
        (case_id, from_phase, to_phase, from_status, to_status, triggered_by, trigger, notes)
      VALUES (
        ${caseId}::uuid,
        ${currentCase.lifecycle_phase ?? null},
        ${dto.toPhase},
        ${currentCase.status},
        ${currentCase.status},
        ${actorId}::uuid,
        ${dto.trigger},
        ${dto.notes ?? null}
      )
      RETURNING id
    `;

    // Update case lifecycle_phase
    await this.prisma.$queryRaw`
      UPDATE conveyancing.cases
      SET lifecycle_phase = ${dto.toPhase}, updated_at = NOW()
      WHERE id = ${caseId}::uuid
    `;

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'case.lifecycle_advanced',
      resourceType: 'conveyancing_case',
      resourceId: caseId,
      payload: {
        fromPhase: currentCase.lifecycle_phase,
        toPhase: dto.toPhase,
        phaseName,
        trigger: dto.trigger,
      },
      ipAddress,
      userAgent,
    });

    return {
      lifecyclePhase: dto.toPhase,
      phaseName,
      historyId: historyRows[0].id,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async assertCaseExists(caseId: string, firmId: string): Promise<void> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM conveyancing.cases
      WHERE id = ${caseId}::uuid AND firm_id = ${firmId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Conveyancing case not found');
  }

  private async assertInteractionExists(interactionId: string, firmId: string): Promise<void> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT gi.id FROM conveyancing.government_interactions gi
      JOIN conveyancing.cases c ON c.id = gi.case_id
      WHERE gi.id = ${interactionId}::uuid AND c.firm_id = ${firmId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Government interaction not found');
  }
}
