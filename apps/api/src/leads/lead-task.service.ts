import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';
import { CreateLeadTaskDto, UpdateLeadTaskDto } from './leads.dto';
import { LeadTaskRow } from './leads.service';

@Injectable()
export class LeadTaskService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────

  private async verifyLeadAccess(
    leadId: string,
    companyId: string,
  ): Promise<void> {
    const lead = await this.prisma.$queryRaw<{ id: string; company_id: string }[]>`
      SELECT id, company_id FROM sales.leads
      WHERE id = ${leadId}::uuid LIMIT 1
    `;
    if (!lead[0]) throw new NotFoundException('Lead not found');
    if (lead[0].company_id !== companyId) throw new ForbiddenException('Access denied');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // List tasks for a lead
  // ──────────────────────────────────────────────────────────────────────────

  async list(
    leadId: string,
    _userId: string,
    _roles: string[],
    companyId: string,
  ): Promise<LeadTaskRow[]> {
    await this.verifyLeadAccess(leadId, companyId);

    return this.prisma.$queryRaw<LeadTaskRow[]>`
      SELECT t.*,
        CONCAT(u.first_name, ' ', u.last_name) AS assigned_agent_name
      FROM sales.lead_tasks t
      LEFT JOIN identity.users u ON u.id = t.assigned_to
      WHERE t.lead_id = ${leadId}::uuid
        AND t.company_id = ${companyId}::uuid
      ORDER BY t.completed ASC, t.due_date ASC NULLS LAST, t.priority DESC
    `;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Create task for a lead
  // ──────────────────────────────────────────────────────────────────────────

  async create(
    leadId: string,
    userId: string,
    _roles: string[],
    companyId: string,
    dto: CreateLeadTaskDto,
  ): Promise<LeadTaskRow> {
    await this.verifyLeadAccess(leadId, companyId);

    const id = randomUUID();

    const [task] = await this.prisma.$queryRaw<LeadTaskRow[]>`
      INSERT INTO sales.lead_tasks (
        id, lead_id, company_id, created_by, assigned_to,
        title, type, priority, due_date
      ) VALUES (
        ${id}::uuid,
        ${leadId}::uuid,
        ${companyId}::uuid,
        ${userId}::uuid,
        ${dto.assignedTo ?? null}::uuid,
        ${dto.title},
        ${dto.type},
        ${dto.priority},
        ${dto.dueDate ?? null}::date
      )
      RETURNING *
    `;

    return task;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Update task (supports marking complete)
  // ──────────────────────────────────────────────────────────────────────────

  async update(
    leadId: string,
    taskId: string,
    userId: string,
    _roles: string[],
    companyId: string,
    dto: UpdateLeadTaskDto,
  ): Promise<LeadTaskRow> {
    await this.verifyLeadAccess(leadId, companyId);

    // Confirm task belongs to this lead and company
    const existing = await this.prisma.$queryRaw<LeadTaskRow[]>`
      SELECT * FROM sales.lead_tasks
      WHERE id = ${taskId}::uuid AND lead_id = ${leadId}::uuid AND company_id = ${companyId}::uuid
      LIMIT 1
    `;
    if (!existing[0]) throw new NotFoundException('Task not found');

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const addField = (col: string, val: unknown, cast?: string) => {
      fields.push(`${col} = $${idx++}${cast ? `::${cast}` : ''}`);
      values.push(val);
    };

    if (dto.title !== undefined) addField('title', dto.title);
    if (dto.type !== undefined) addField('type', dto.type);
    if (dto.priority !== undefined) addField('priority', dto.priority);
    if (dto.dueDate !== undefined) addField('due_date', dto.dueDate, 'date');
    if (dto.assignedTo !== undefined) addField('assigned_to', dto.assignedTo, 'uuid');

    if (dto.completed !== undefined) {
      addField('completed', dto.completed);
      if (dto.completed && !existing[0].completed) {
        fields.push(`completed_at = NOW()`);
        fields.push(`completed_by = $${idx++}::uuid`);
        values.push(userId);
      } else if (!dto.completed) {
        fields.push(`completed_at = NULL`);
        fields.push(`completed_by = NULL`);
      }
    }

    fields.push('updated_at = NOW()');

    if (fields.length === 1) return existing[0];

    values.push(taskId, leadId, companyId);
    const tidIdx = idx++;
    const lidIdx = idx++;
    const cidIdx = idx++;

    const query = `
      UPDATE sales.lead_tasks
      SET ${fields.join(', ')}
      WHERE id = $${tidIdx}::uuid
        AND lead_id = $${lidIdx}::uuid
        AND company_id = $${cidIdx}::uuid
      RETURNING *
    `;

    const rows = await this.prisma.$queryRawUnsafe<LeadTaskRow[]>(query, ...values);
    if (!rows[0]) throw new NotFoundException('Task not found after update');
    return rows[0];
  }
}
