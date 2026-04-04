import { ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';
import { CreateLeadDto, LEAD_STAGES, ListLeadsQueryDto, UpdateLeadDto } from './leads.dto';
import { WorkflowEngineService } from '../property/workflow-engine.service';

// ─────────────────────────────────────────────────────────────────────────────
// Row types
// ─────────────────────────────────────────────────────────────────────────────

export type LeadRow = {
  id: string;
  company_id: string;
  assigned_to: string | null;
  created_by: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  source: string | null;
  type: string;
  timeline: string | null;
  budget_min: string | null;
  budget_max: string | null;
  budget_currency: string;
  preferences: string | null;
  temperature: string;
  stage: string;
  prequalified: boolean;
  deal_value: string | null;
  notes: string | null;
  next_follow_up: Date | null;
  last_contact_at: Date | null;
  closed_at: Date | null;
  lost_reason: string | null;
  created_at: Date;
  updated_at: Date;
  assigned_agent_name?: string | null;
};

export type LeadActivityRow = {
  id: string;
  lead_id: string;
  company_id: string;
  actor_id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  actor_name?: string | null;
};

export type LeadTaskRow = {
  id: string;
  lead_id: string;
  company_id: string;
  assigned_to: string | null;
  created_by: string;
  title: string;
  type: string;
  priority: string;
  due_date: Date | null;
  completed: boolean;
  completed_at: Date | null;
  completed_by: string | null;
  created_at: Date;
  updated_at: Date;
  assigned_agent_name?: string | null;
};

export type LeadDashboardResponse = {
  totalLeads: number;
  hotLeads: number;
  activeDeals: number;
  pipelineValue: number;
  pendingTasks: LeadTaskRow[];
  recentActivities: LeadActivityRow[];
  recentLeads: LeadRow[];
  byType: Record<string, number>;
  byTemperature: Record<string, number>;
  byStage: Record<string, number>;
};

export type PipelineStage = {
  stage: string;
  leads: LeadRow[];
  count: number;
  totalValue: number;
};

export type LeadPipelineResponse = {
  stages: PipelineStage[];
};

export type LeadAnalyticsResponse = {
  conversionRate: number;
  closedRevenue: number;
  activeLeads: number;
  avgDealValue: number;
  avgTimeToClose: number;
  responseRate: number;
  bySource: { source: string; count: number }[];
  byType: { type: string; count: number }[];
  funnel: { stage: string; count: number }[];
  monthlyTrend: { month: string; leads: number; closed: number }[];
  sourcePerformance: {
    source: string;
    count: number;
    closed: number;
    conversion: number;
    value: number;
  }[];
};

const DEFAULT_LIMIT = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly workflowEngine?: WorkflowEngineService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // List leads — company-scoped with optional filters
  // ──────────────────────────────────────────────────────────────────────────

  async list(
    _userId: string,
    _roles: string[],
    companyId: string,
    query: ListLeadsQueryDto,
  ): Promise<{ data: LeadRow[]; total: number }> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = query.offset ?? 0;

    const conditions: string[] = ['l.company_id = $1::uuid'];
    const values: unknown[] = [companyId];
    let idx = 2;

    if (query.search) {
      conditions.push(
        `(l.name ILIKE $${idx} OR l.email ILIKE $${idx} OR l.phone ILIKE $${idx})`,
      );
      idx++;
      values.push(`%${query.search}%`);
    }

    if (query.type) {
      conditions.push(`l.type = $${idx++}`);
      values.push(query.type);
    }

    if (query.temperature) {
      conditions.push(`l.temperature = $${idx++}`);
      values.push(query.temperature);
    }

    if (query.stage) {
      conditions.push(`l.stage = $${idx++}`);
      values.push(query.stage);
    }

    if (query.assignedTo) {
      conditions.push(`l.assigned_to = $${idx++}::uuid`);
      values.push(query.assignedTo);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countQuery = `SELECT COUNT(*) AS total FROM sales.leads l ${where}`;
    const dataQuery = `
      SELECT l.*,
        CONCAT(u.first_name, ' ', u.last_name) AS assigned_agent_name
      FROM sales.leads l
      LEFT JOIN identity.users u ON u.id = l.assigned_to
      ${where}
      ORDER BY l.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const dataValues = [...values, limit, offset];

    const [countRows, leads] = await Promise.all([
      this.prisma.$queryRawUnsafe<[{ total: string }]>(countQuery, ...values),
      this.prisma.$queryRawUnsafe<LeadRow[]>(dataQuery, ...dataValues),
    ]);

    return { data: leads, total: parseInt(countRows[0]?.total ?? '0', 10) };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Get single lead by ID
  // ──────────────────────────────────────────────────────────────────────────

  async getById(
    id: string,
    _userId: string,
    _roles: string[],
    companyId: string,
  ): Promise<LeadRow> {
    const rows = await this.prisma.$queryRaw<LeadRow[]>`
      SELECT l.*,
        CONCAT(u.first_name, ' ', u.last_name) AS assigned_agent_name
      FROM sales.leads l
      LEFT JOIN identity.users u ON u.id = l.assigned_to
      WHERE l.id = ${id}::uuid
      LIMIT 1
    `;

    const lead = rows[0];
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.company_id !== companyId) throw new ForbiddenException('Access denied');

    return lead;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Create lead
  // ──────────────────────────────────────────────────────────────────────────

  async create(
    userId: string,
    _roles: string[],
    companyId: string,
    dto: CreateLeadDto,
  ): Promise<LeadRow> {
    const id = randomUUID();
    const stage = dto.stage ?? 'new';
    const temperature = dto.temperature ?? 'warm';

    const [lead] = await this.prisma.$queryRaw<LeadRow[]>`
      INSERT INTO sales.leads (
        id, company_id, created_by, assigned_to,
        name, email, phone, address, source, type, timeline,
        budget_min, budget_max, budget_currency,
        preferences, temperature, stage,
        prequalified, deal_value, notes, next_follow_up
      ) VALUES (
        ${id}::uuid,
        ${companyId}::uuid,
        ${userId}::uuid,
        ${dto.assignedTo ?? null}::uuid,
        ${dto.name},
        ${dto.email ?? null},
        ${dto.phone ?? null},
        ${dto.address ?? null},
        ${dto.source ?? null},
        ${dto.type},
        ${dto.timeline ?? null},
        ${dto.budgetMin ?? null},
        ${dto.budgetMax ?? null},
        ${dto.budgetCurrency ?? 'ZAR'},
        ${dto.preferences ?? null},
        ${temperature},
        ${stage},
        ${dto.prequalified ?? false},
        ${dto.dealValue ?? null},
        ${dto.notes ?? null},
        ${dto.nextFollowUp ?? null}::timestamptz
      )
      RETURNING *
    `;

    // Auto-log creation activity
    const activityId = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO sales.lead_activities (id, lead_id, company_id, actor_id, type, description)
      VALUES (
        ${activityId}::uuid,
        ${lead.id}::uuid,
        ${companyId}::uuid,
        ${userId}::uuid,
        'note',
        'Lead created'
      )
    `;

    // Fire workflow trigger asynchronously — does not affect lead creation response
    if (this.workflowEngine) {
      this.workflowEngine
        .triggerFor('New Lead', companyId, {
          leadId: lead.id,
          leadEmail: lead.email,
          leadName: lead.name,
        })
        .catch(() => { /* non-critical */ });
    }

    return lead;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Update lead  — stage change auto-logs activity
  // ──────────────────────────────────────────────────────────────────────────

  async update(
    id: string,
    userId: string,
    _roles: string[],
    companyId: string,
    dto: UpdateLeadDto,
  ): Promise<LeadRow> {
    const existing = await this.getById(id, userId, _roles, companyId);

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const addField = (col: string, val: unknown, cast?: string) => {
      fields.push(`${col} = $${idx++}${cast ? `::${cast}` : ''}`);
      values.push(val);
    };

    if (dto.name !== undefined) addField('name', dto.name);
    if (dto.email !== undefined) addField('email', dto.email);
    if (dto.phone !== undefined) addField('phone', dto.phone);
    if (dto.address !== undefined) addField('address', dto.address);
    if (dto.source !== undefined) addField('source', dto.source);
    if (dto.type !== undefined) addField('type', dto.type);
    if (dto.timeline !== undefined) addField('timeline', dto.timeline);
    if (dto.budgetMin !== undefined) addField('budget_min', dto.budgetMin);
    if (dto.budgetMax !== undefined) addField('budget_max', dto.budgetMax);
    if (dto.budgetCurrency !== undefined) addField('budget_currency', dto.budgetCurrency);
    if (dto.preferences !== undefined) addField('preferences', dto.preferences);
    if (dto.temperature !== undefined) addField('temperature', dto.temperature);
    if (dto.stage !== undefined) addField('stage', dto.stage);
    if (dto.prequalified !== undefined) addField('prequalified', dto.prequalified);
    if (dto.dealValue !== undefined) addField('deal_value', dto.dealValue);
    if (dto.notes !== undefined) addField('notes', dto.notes);
    if (dto.nextFollowUp !== undefined) addField('next_follow_up', dto.nextFollowUp, 'timestamptz');
    if (dto.assignedTo !== undefined) addField('assigned_to', dto.assignedTo, 'uuid');
    if (dto.lostReason !== undefined) addField('lost_reason', dto.lostReason);

    const stageChanged = dto.stage !== undefined && dto.stage !== existing.stage;
    if (stageChanged) {
      fields.push(`last_contact_at = NOW()`);
      if (dto.stage === 'closed' || dto.stage === 'lost') {
        fields.push(`closed_at = NOW()`);
      }
    }

    fields.push('updated_at = NOW()');

    if (fields.length === 1) {
      // Only updated_at — nothing meaningful changed
      return existing;
    }

    const setClause = fields.join(', ');
    values.push(id, companyId);
    const idIdx = idx++;
    const companyIdx = idx++;

    const query = `
      UPDATE sales.leads
      SET ${setClause}
      WHERE id = $${idIdx}::uuid AND company_id = $${companyIdx}::uuid
      RETURNING *
    `;

    const rows = await this.prisma.$queryRawUnsafe<LeadRow[]>(query, ...values);
    const updated = rows[0];
    if (!updated) throw new NotFoundException('Lead not found after update');

    if (stageChanged) {
      const activityId = randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO sales.lead_activities (id, lead_id, company_id, actor_id, type, description, metadata)
        VALUES (
          ${activityId}::uuid,
          ${id}::uuid,
          ${companyId}::uuid,
          ${userId}::uuid,
          'stage_change',
          ${`Stage changed from ${existing.stage} to ${dto.stage!}`},
          ${JSON.stringify({ from_stage: existing.stage, to_stage: dto.stage })}::jsonb
        )
      `;
    }

    return updated;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Delete lead
  // ──────────────────────────────────────────────────────────────────────────

  async remove(
    id: string,
    userId: string,
    roles: string[],
    companyId: string,
  ): Promise<void> {
    if (!roles.includes('agent') && !roles.includes('admin')) {
      throw new ForbiddenException('Only agents or admins can delete leads');
    }

    await this.getById(id, userId, roles, companyId);

    await this.prisma.$executeRaw`
      DELETE FROM sales.leads
      WHERE id = ${id}::uuid AND company_id = ${companyId}::uuid
    `;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Dashboard  — KPI cards + pending tasks + recent activities
  // ──────────────────────────────────────────────────────────────────────────

  async getDashboard(
    _userId: string,
    _roles: string[],
    companyId: string,
  ): Promise<LeadDashboardResponse> {
    const [kpiRows, pendingTasks, recentActivities, typeRows, tempRows, recentLeads, stageRows] = await Promise.all([
      this.prisma.$queryRaw<
        {
          total_leads: string;
          hot_leads: string;
          active_deals: string;
          pipeline_value: string;
        }[]
      >`
        SELECT
          COUNT(*) AS total_leads,
          COUNT(*) FILTER (WHERE temperature = 'hot') AS hot_leads,
          COUNT(*) FILTER (WHERE stage IN ('active', 'under_contract')) AS active_deals,
          COALESCE(SUM(deal_value) FILTER (WHERE stage NOT IN ('closed', 'lost')), 0) AS pipeline_value
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
      `,
      this.prisma.$queryRaw<LeadTaskRow[]>`
        SELECT t.*,
          CONCAT(u.first_name, ' ', u.last_name) AS assigned_agent_name
        FROM sales.lead_tasks t
        LEFT JOIN identity.users u ON u.id = t.assigned_to
        WHERE t.company_id = ${companyId}::uuid
          AND t.completed = false
        ORDER BY t.due_date ASC NULLS LAST, t.priority DESC
        LIMIT 10
      `,
      this.prisma.$queryRaw<LeadActivityRow[]>`
        SELECT a.*,
          CONCAT(u.first_name, ' ', u.last_name) AS actor_name
        FROM sales.lead_activities a
        LEFT JOIN identity.users u ON u.id = a.actor_id
        WHERE a.company_id = ${companyId}::uuid
        ORDER BY a.created_at DESC
        LIMIT 20
      `,
      this.prisma.$queryRaw<{ type: string; count: string }[]>`
        SELECT type, COUNT(*) AS count
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
        GROUP BY type
      `,
      this.prisma.$queryRaw<{ temperature: string; count: string }[]>`
        SELECT temperature, COUNT(*) AS count
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
        GROUP BY temperature
      `,
      this.prisma.$queryRaw<LeadRow[]>`
        SELECT l.*,
          CONCAT(u.first_name, ' ', u.last_name) AS assigned_agent_name
        FROM sales.leads l
        LEFT JOIN identity.users u ON u.id = l.assigned_to
        WHERE l.company_id = ${companyId}::uuid
        ORDER BY l.created_at DESC
        LIMIT 4
      `,
      this.prisma.$queryRaw<{ stage: string; count: string }[]>`
        SELECT stage, COUNT(*) AS count
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
        GROUP BY stage
      `,
    ]);

    const kpi = kpiRows[0];
    const byType: Record<string, number> = {};
    const byTemperature: Record<string, number> = {};
    const byStage: Record<string, number> = {};

    for (const r of typeRows) byType[r.type] = parseInt(r.count, 10);
    for (const r of tempRows) byTemperature[r.temperature] = parseInt(r.count, 10);
    for (const r of stageRows) byStage[r.stage] = parseInt(r.count, 10);

    return {
      totalLeads: parseInt(kpi?.total_leads ?? '0', 10),
      hotLeads: parseInt(kpi?.hot_leads ?? '0', 10),
      activeDeals: parseInt(kpi?.active_deals ?? '0', 10),
      pipelineValue: parseFloat(kpi?.pipeline_value ?? '0'),
      pendingTasks,
      recentActivities,
      recentLeads,
      byType,
      byTemperature,
      byStage,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Pipeline  — active leads grouped by stage
  // ──────────────────────────────────────────────────────────────────────────

  async getPipeline(
    _userId: string,
    _roles: string[],
    companyId: string,
  ): Promise<LeadPipelineResponse> {
    const leads = await this.prisma.$queryRaw<LeadRow[]>`
      SELECT l.*,
        CONCAT(u.first_name, ' ', u.last_name) AS assigned_agent_name
      FROM sales.leads l
      LEFT JOIN identity.users u ON u.id = l.assigned_to
      WHERE l.company_id = ${companyId}::uuid
        AND l.stage NOT IN ('closed', 'lost')
      ORDER BY l.created_at DESC
    `;

    const stageOrder = LEAD_STAGES.filter((s) => s !== 'closed' && s !== 'lost');
    const stageMap = new Map<string, LeadRow[]>();
    for (const s of stageOrder) stageMap.set(s, []);

    for (const lead of leads) {
      const bucket = stageMap.get(lead.stage);
      if (bucket) bucket.push(lead);
    }

    const stages: PipelineStage[] = stageOrder.map((stage) => {
      const stageLeads = stageMap.get(stage) ?? [];
      const totalValue = stageLeads.reduce(
        (sum, l) => sum + parseFloat(l.deal_value ?? '0'),
        0,
      );
      return { stage, leads: stageLeads, count: stageLeads.length, totalValue };
    });

    return { stages };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Analytics  — aggregated stats for charts
  // ──────────────────────────────────────────────────────────────────────────

  async getAnalytics(
    _userId: string,
    _roles: string[],
    companyId: string,
  ): Promise<LeadAnalyticsResponse> {
    const [summaryRows, bySourceRows, byTypeRows, funnelRows, monthlyRows, responseRateRows] = await Promise.all([
      this.prisma.$queryRaw<
        {
          total: string;
          closed: string;
          closed_revenue: string;
          active: string;
          avg_deal_value: string;
          avg_time_to_close: string;
        }[]
      >`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE stage = 'closed') AS closed,
          COALESCE(SUM(deal_value) FILTER (WHERE stage = 'closed'), 0) AS closed_revenue,
          COUNT(*) FILTER (WHERE stage NOT IN ('closed', 'lost')) AS active,
          COALESCE(ROUND(AVG(deal_value) FILTER (WHERE stage = 'closed' AND deal_value IS NOT NULL), 0), 0) AS avg_deal_value,
          COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400.0) FILTER (WHERE stage = 'closed' AND closed_at IS NOT NULL), 0), 0) AS avg_time_to_close
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
      `,
      this.prisma.$queryRaw<{ source: string; count: string; closed: string; value: string }[]>`
        SELECT
          COALESCE(source, 'Unknown') AS source,
          COUNT(*) AS count,
          COUNT(*) FILTER (WHERE stage = 'closed') AS closed,
          COALESCE(SUM(deal_value) FILTER (WHERE stage = 'closed'), 0) AS value
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
        GROUP BY source
        ORDER BY count DESC
      `,
      this.prisma.$queryRaw<{ type: string; count: string }[]>`
        SELECT type, COUNT(*) AS count
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
        GROUP BY type
        ORDER BY count DESC
      `,
      this.prisma.$queryRaw<{ stage: string; count: string }[]>`
        SELECT stage, COUNT(*) AS count
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
        GROUP BY stage
        ORDER BY COUNT(*) DESC
      `,
      this.prisma.$queryRaw<{ month: string; leads: string; closed: string }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
          COUNT(*) AS leads,
          COUNT(*) FILTER (WHERE stage = 'closed') AS closed
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `,
      this.prisma.$queryRaw<{ response_rate: string }[]>`
        SELECT
          COALESCE(ROUND(
            100.0 * COUNT(DISTINCT a.lead_id)::numeric / NULLIF(
              (SELECT COUNT(*) FROM sales.leads WHERE company_id = ${companyId}::uuid),
              0
            ),
            0
          ), 0) AS response_rate
        FROM sales.lead_activities a
        INNER JOIN sales.leads l ON l.id = a.lead_id
        WHERE l.company_id = ${companyId}::uuid
      `,
    ]);

    const summary = summaryRows[0];
    const total = parseInt(summary?.total ?? '0', 10);
    const closed = parseInt(summary?.closed ?? '0', 10);
    const conversionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return {
      conversionRate,
      closedRevenue: parseFloat(summary?.closed_revenue ?? '0'),
      activeLeads: parseInt(summary?.active ?? '0', 10),
      avgDealValue: parseFloat(summary?.avg_deal_value ?? '0'),
      avgTimeToClose: parseInt(summary?.avg_time_to_close ?? '0', 10),
      responseRate: parseInt(responseRateRows[0]?.response_rate ?? '0', 10),
      bySource: bySourceRows.map((r) => ({
        source: r.source,
        count: parseInt(r.count, 10),
      })),
      byType: byTypeRows.map((r) => ({
        type: r.type,
        count: parseInt(r.count, 10),
      })),
      funnel: funnelRows.map((r) => ({
        stage: r.stage,
        count: parseInt(r.count, 10),
      })),
      monthlyTrend: monthlyRows.map((r) => ({
        month: r.month,
        leads: parseInt(r.leads, 10),
        closed: parseInt(r.closed, 10),
      })),
      sourcePerformance: bySourceRows.map((r) => {
        const count = parseInt(r.count, 10);
        const sourceClosed = parseInt(r.closed, 10);
        return {
          source: r.source,
          count,
          closed: sourceClosed,
          conversion: count > 0 ? Math.round((sourceClosed / count) * 100) : 0,
          value: parseFloat(r.value),
        };
      }),
    };
  }
}
