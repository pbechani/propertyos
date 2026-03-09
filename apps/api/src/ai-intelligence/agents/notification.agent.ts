import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// NotificationAgent
// Surfaces overdue tasks and recently inactive leads that need follow-up
// attention — acts as the alert / activity-monitoring layer.
// Tool permissions: activity:read, tasks:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class NotificationAgent extends BaseAgent {
  readonly agentName = 'NotificationAgent';
  readonly description = 'Monitors pipeline health and alerts on overdue tasks, stale leads, and follow-up gaps.';
  readonly capabilities = ['activity_read', 'push_alerts'] as const;
  readonly actions = ['overdueAlerts', 'staleLeads', 'summarizeAlerts'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['activity:read', 'tasks:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    _params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'overdueAlerts':   return this.overdueAlerts(companyId);
      case 'staleLeads':      return this.staleLeads(companyId);
      case 'summarizeAlerts': return this.summarizeAlerts(companyId);
      default:
        return { responseType: 'error', text: `NotificationAgent: unknown action "${action}"` };
    }
  }

  /** Tasks past their due date that are not yet completed */
  private async overdueAlerts(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('tasks:read');
    type Row = { id: string; title: string; type: string; priority: string; due_date: Date; lead_id: string | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, title, type, priority, due_date, lead_id
      FROM sales.lead_tasks
      WHERE company_id = ${companyId}::uuid
        AND completed = false
        AND due_date < NOW()
      ORDER BY due_date ASC
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: 'No overdue tasks — pipeline is on track.' };
    const colorMap: Record<string, 'red' | 'orange' | 'blue'> = { high: 'red', medium: 'orange', low: 'blue' };
    return {
      responseType: 'list',
      title: `${rows.length} overdue task${rows.length !== 1 ? 's' : ''}`,
      items: rows.map(r => ({
        id: r.id,
        label: r.title,
        sublabel: `${r.type.replace(/_/g, ' ')} · due ${this.relativeTime(r.due_date)}`,
        badge: r.priority,
        badgeColor: colorMap[r.priority] ?? 'gray',
        href: r.lead_id ? `/app/leads/${r.lead_id}` : undefined,
      })),
      totalCount: rows.length,
    };
  }

  /** Active leads with no contact in the last 14 days */
  private async staleLeads(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('activity:read');
    type Row = { id: string; name: string; stage: string; last_contact_at: Date | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, last_contact_at
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage NOT IN ('closed_lost', 'closed_won')
        AND (last_contact_at IS NULL OR last_contact_at < NOW() - INTERVAL '14 days')
      ORDER BY last_contact_at ASC NULLS FIRST
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: 'All active leads have been contacted in the past 14 days.' };
    return {
      responseType: 'list',
      title: `${rows.length} stale lead${rows.length !== 1 ? 's' : ''} (no contact > 14 days)`,
      items: rows.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: `Stage: ${r.stage.replace(/_/g, ' ')} · last contact ${r.last_contact_at ? this.relativeTime(r.last_contact_at) : 'never'}`,
        badge: r.last_contact_at ? 'Stale' : 'Never contacted',
        badgeColor: r.last_contact_at ? 'orange' : 'red',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  /** High-level summary of overdue tasks and stale leads in one response */
  private async summarizeAlerts(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('tasks:read');
    this.assertPermission('activity:read');

    type OverdueRow  = { count: string };
    type StaleRow    = { count: string };
    type HighPriRow  = { count: string };

    const [overdue, stale, highPri] = await Promise.all([
      this.prisma.$queryRaw<OverdueRow[]>`
        SELECT COUNT(*)::text AS count FROM sales.lead_tasks
        WHERE company_id = ${companyId}::uuid AND completed = false AND due_date < NOW()
      `,
      this.prisma.$queryRaw<StaleRow[]>`
        SELECT COUNT(*)::text AS count FROM sales.leads
        WHERE company_id = ${companyId}::uuid
          AND stage NOT IN ('closed_lost', 'closed_won')
          AND (last_contact_at IS NULL OR last_contact_at < NOW() - INTERVAL '14 days')
      `,
      this.prisma.$queryRaw<HighPriRow[]>`
        SELECT COUNT(*)::text AS count FROM sales.lead_tasks
        WHERE company_id = ${companyId}::uuid
          AND completed = false
          AND priority = 'high'
          AND due_date < NOW() + INTERVAL '24 hours'
      `,
    ]);

    return {
      responseType: 'summary',
      title: 'Pipeline health alerts',
      summaryCards: [
        { label: 'Overdue tasks',             value: overdue[0]?.count ?? '0' },
        { label: 'High-priority within 24h',  value: highPri[0]?.count ?? '0' },
        { label: 'Stale leads (>14 days)',     value: stale[0]?.count  ?? '0' },
      ],
    };
  }
}
