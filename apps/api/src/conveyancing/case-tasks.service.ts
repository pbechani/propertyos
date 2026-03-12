import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { CreateTaskDto, UpdateTaskDto } from './conveyancing.dto';
import { TASK_STATUSES } from './conveyancing.constants';

export type TaskRow = {
  id: string;
  case_id: string;
  template_task_id: string | null;
  title: string;
  description: string | null;
  stage_number: number | null;
  responsible_id: string | null;
  responsible_role: string | null;
  due_date: Date | null;
  status: string;
  completed_at: Date | null;
  completed_by: string | null;
  escalated_at: Date | null;
  escalation_reason: string | null;
  priority: string;
  is_blocker: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class CaseTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ConveyancingAuditService,
  ) {}

  async listTasks(caseId: string, status?: string): Promise<TaskRow[]> {
    return this.prisma.$queryRaw<TaskRow[]>`
      SELECT * FROM conveyancing.case_tasks
      WHERE case_id = ${caseId}::uuid
        AND (${status ?? null}::varchar IS NULL OR status = ${status ?? null})
      ORDER BY COALESCE(stage_number, 999), is_blocker DESC, due_date ASC NULLS LAST
    `;
  }

  async createTask(
    actorId: string,
    actorRole: string,
    firmId: string,
    caseId: string,
    dto: CreateTaskDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TaskRow> {
    await this.assertCaseExists(caseId, firmId);

    const rows = await this.prisma.$queryRaw<TaskRow[]>`
      INSERT INTO conveyancing.case_tasks
        (case_id, title, description, stage_number, responsible_id, responsible_role,
         due_date, priority, is_blocker)
      VALUES (
        ${caseId}::uuid,
        ${dto.title},
        ${dto.description ?? null},
        ${dto.stageNumber ?? null},
        ${dto.responsibleId ?? null}::uuid,
        ${dto.responsibleRole ?? null},
        ${dto.dueDate ?? null}::date,
        ${dto.priority ?? 'normal'},
        ${dto.isBlocker ?? false}
      )
      RETURNING *
    `;
    const task = rows[0];

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'task.created',
      resourceType: 'case_task',
      resourceId: task.id,
      payload: { caseId, title: dto.title },
      ipAddress,
      userAgent,
    });

    return task;
  }

  async updateTask(
    actorId: string,
    actorRole: string,
    firmId: string,
    taskId: string,
    dto: UpdateTaskDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TaskRow> {
    const existing = await this.getTask(taskId);

    if (dto.status && !TASK_STATUSES.includes(dto.status as any)) {
      throw new BadRequestException('Invalid task status');
    }

    const completedAt =
      dto.status === 'completed' && existing.status !== 'completed'
        ? new Date().toISOString()
        : null;
    const completedBy =
      dto.status === 'completed' && existing.status !== 'completed' ? actorId : null;
    const escalatedAt =
      dto.status === 'escalated' && existing.status !== 'escalated'
        ? new Date().toISOString()
        : null;

    const rows = await this.prisma.$queryRaw<TaskRow[]>`
      UPDATE conveyancing.case_tasks
      SET
        status            = COALESCE(${dto.status ?? null}, status),
        due_date          = COALESCE(${dto.dueDate ?? null}::date, due_date),
        responsible_id    = COALESCE(${dto.responsibleId ?? null}::uuid, responsible_id),
        notes             = COALESCE(${dto.notes ?? null}, notes),
        escalation_reason = COALESCE(${dto.escalationReason ?? null}, escalation_reason),
        completed_at      = CASE WHEN ${completedAt ?? null}::timestamptz IS NOT NULL THEN ${completedAt ?? null}::timestamptz ELSE completed_at END,
        completed_by      = CASE WHEN ${completedBy ?? null}::uuid IS NOT NULL THEN ${completedBy ?? null}::uuid ELSE completed_by END,
        escalated_at      = CASE WHEN ${escalatedAt ?? null}::timestamptz IS NOT NULL THEN ${escalatedAt ?? null}::timestamptz ELSE escalated_at END,
        updated_at        = NOW()
      WHERE id = ${taskId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'task.updated',
      resourceType: 'case_task',
      resourceId: taskId,
      payload: { changes: dto },
      ipAddress,
      userAgent,
    });

    return rows[0];
  }

  async addNote(caseId: string, authorId: string, content: string, attachments: string[] = []): Promise<{ id: string }> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO conveyancing.case_notes (case_id, author_id, content, attachments)
      VALUES (${caseId}::uuid, ${authorId}::uuid, ${content}, ${JSON.stringify(attachments)}::jsonb)
      RETURNING id
    `;
    return rows[0];
  }

  async listNotes(caseId: string): Promise<{ id: string; author_id: string; content: string; is_pinned: boolean; created_at: Date }[]> {
    return this.prisma.$queryRaw`
      SELECT id, author_id, content, is_pinned, created_at
      FROM conveyancing.case_notes
      WHERE case_id = ${caseId}::uuid
      ORDER BY is_pinned DESC, created_at DESC
    `;
  }

  private async getTask(taskId: string): Promise<TaskRow> {
    const rows = await this.prisma.$queryRaw<TaskRow[]>`
      SELECT * FROM conveyancing.case_tasks WHERE id = ${taskId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Task not found');
    return rows[0];
  }

  private async assertCaseExists(caseId: string, firmId: string): Promise<void> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM conveyancing.cases
      WHERE id = ${caseId}::uuid AND firm_id = ${firmId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Conveyancing case not found');
  }
}
