import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// WorkflowAgent
// Provides pipeline and task-workflow summaries, routes work items to stages,
// and identifies bottlenecks in the operational pipeline.
// Tool permissions: tasks:read, leads:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class WorkflowAgent extends BaseAgent {
  readonly agentName = 'WorkflowAgent';
  readonly description = 'Summarises pipeline workflows, routes tasks, and surfaces operational bottlenecks.';
  readonly capabilities = ['workflow_trigger', 'task_routing'] as const;
  readonly actions = ['getPipelineSummary', 'tasksByType', 'bottlenecks'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['tasks:read', 'leads:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    _params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'getPipelineSummary': return this.getPipelineSummary(companyId);
      case 'tasksByType':        return this.tasksByType(companyId);
      case 'bottlenecks':        return this.bottlenecks(companyId);
      default:
        return { responseType: 'error', text: `WorkflowAgent: unknown action "${action}"` };
    }
  }

  /** High-level pipeline: leads per stage plus open task counts */
  private async getPipelineSummary(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    this.assertPermission('tasks:read');

    type LeadRow  = { stage: string; count: string };
    type TaskRow  = { total: string; overdue: string };

    const [stages, tasks] = await Promise.all([
      this.prisma.$queryRaw<LeadRow[]>`
        SELECT stage, COUNT(*)::text AS count
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
          AND stage NOT IN ('closed_lost', 'closed_won')
        GROUP BY stage
        ORDER BY count DESC
      `,
      this.prisma.$queryRaw<TaskRow[]>`
        SELECT
          COUNT(*)::text                                          AS total,
          COUNT(*) FILTER (WHERE due_date < NOW())::text         AS overdue
        FROM sales.lead_tasks
        WHERE company_id = ${companyId}::uuid AND completed = false
      `,
    ]);

    const t = tasks[0];
    const summaryCards = [
      { label: 'Open tasks',   value: t?.total   ?? '0' },
      { label: 'Overdue tasks', value: t?.overdue ?? '0' },
      ...stages.map(s => ({ label: s.stage.replace(/_/g, ' '), value: s.count })),
    ];

    return {
      responseType: 'summary',
      title: 'Pipeline workflow summary',
      summaryCards,
    };
  }

  /** Open tasks grouped by type, to understand workflow load distribution */
  private async tasksByType(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('tasks:read');
    type Row = { type: string; total: string; overdue: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        type,
        COUNT(*)::text                                          AS total,
        COUNT(*) FILTER (WHERE due_date < NOW())::text         AS overdue
      FROM sales.lead_tasks
      WHERE company_id = ${companyId}::uuid AND completed = false
      GROUP BY type
      ORDER BY total DESC
    `;
    if (!rows.length) return { responseType: 'text', text: 'No open tasks in the workflow.' };
    return {
      responseType: 'chart',
      chart: {
        title: 'Open tasks by type',
        bars: rows.map(r => ({
          label: r.type.replace(/_/g, ' '),
          value: Number(r.total),
        })),
      },
    };
  }

  /**
   * Identifies pipeline stages with the most overdue tasks — these are the
   * workflow bottlenecks that need immediate attention.
   */
  private async bottlenecks(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('tasks:read');
    this.assertPermission('leads:read');

    type Row = { stage: string; lead_count: string; overdue_tasks: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT l.stage,
             COUNT(DISTINCT l.id)::text                                          AS lead_count,
             COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.completed = false)::text AS overdue_tasks
      FROM sales.leads l
      LEFT JOIN sales.lead_tasks t
        ON t.lead_id = l.id AND t.company_id = ${companyId}::uuid
      WHERE l.company_id = ${companyId}::uuid
        AND l.stage NOT IN ('closed_lost', 'closed_won')
      GROUP BY l.stage
      HAVING COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.completed = false) > 0
      ORDER BY overdue_tasks DESC
      LIMIT 10
    `;
    if (!rows.length) return { responseType: 'text', text: 'No workflow bottlenecks detected.' };
    return {
      responseType: 'list',
      title: 'Pipeline bottlenecks by stage',
      items: rows.map(r => ({
        id: r.stage,
        label: r.stage.replace(/_/g, ' '),
        sublabel: `${r.lead_count} lead${Number(r.lead_count) !== 1 ? 's' : ''} · ${r.overdue_tasks} overdue task${Number(r.overdue_tasks) !== 1 ? 's' : ''}`,
        badge: `${r.overdue_tasks} overdue`,
        badgeColor: Number(r.overdue_tasks) >= 5 ? 'red' : 'orange',
      })),
      totalCount: rows.length,
    };
  }
}
