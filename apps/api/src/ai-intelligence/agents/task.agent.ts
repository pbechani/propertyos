import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantListItem, AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// TaskAgent
// Handles all task-related queries: pending, overdue, upcoming, high-priority.
// Tool permissions: tasks:read, leads:read (for task ↔ lead join)
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class TaskAgent extends BaseAgent {
  readonly agentName = 'TaskAgent';
  readonly description = 'Handles all task-related queries: overdue, upcoming, high-priority, and today\'s tasks.';
  readonly capabilities = ['task_management', 'deadline_tracking', 'priority_management'] as const;
  readonly actions = ['listOverdue', 'listUpcoming', 'listHighPriority', 'listToday', 'getCount'] as const;
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
      case 'listOverdue':     return this.listOverdue(companyId);
      case 'listUpcoming':    return this.listUpcoming(companyId);
      case 'listHighPriority':return this.listHighPriority(companyId);
      case 'listToday':       return this.listToday(companyId);
      case 'getCount':        return this.getCount(companyId);
      default:
        return { responseType: 'error', text: `TaskAgent: unknown action "${action}"` };
    }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async listOverdue(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('tasks:read');
    type Row = { id: string; title: string; type: string; priority: string; due_date: string; lead_name: string; lead_id: string };
    const tasks = await this.prisma.$queryRaw<Row[]>`
      SELECT t.id, t.title, t.type, t.priority, t.due_date::text,
             l.name AS lead_name, l.id AS lead_id
      FROM sales.lead_tasks t
      JOIN sales.leads l ON l.id = t.lead_id
      WHERE t.company_id = ${companyId}::uuid
        AND t.completed = false
        AND t.due_date < CURRENT_DATE
      ORDER BY t.due_date ASC,
               CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
      LIMIT 20
    `;
    if (!tasks.length) return { responseType: 'text', text: 'No overdue tasks — you are all caught up!' };
    return {
      responseType: 'list',
      title: `${tasks.length} overdue task${tasks.length !== 1 ? 's' : ''}`,
      items: tasks.map((t) => ({
        id: t.id,
        label: t.title,
        sublabel: `${t.type.replace(/_/g, ' ')} for ${t.lead_name} · due ${t.due_date}`,
        badge: t.priority === 'high' ? 'High' : 'Overdue',
        badgeColor: 'red' as AssistantListItem['badgeColor'],
        href: `/app/leads/${t.lead_id}`,
      })),
      totalCount: tasks.length,
    };
  }

  async listUpcoming(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('tasks:read');
    type Row = { id: string; title: string; type: string; priority: string; due_date: string; lead_name: string; lead_id: string };
    const tasks = await this.prisma.$queryRaw<Row[]>`
      SELECT t.id, t.title, t.type, t.priority, t.due_date::text,
             l.name AS lead_name, l.id AS lead_id
      FROM sales.lead_tasks t
      JOIN sales.leads l ON l.id = t.lead_id
      WHERE t.company_id = ${companyId}::uuid
        AND t.completed = false
        AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY t.due_date ASC,
               CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
      LIMIT 20
    `;
    if (!tasks.length) return { responseType: 'text', text: 'No tasks due in the next 7 days.' };
    const today = new Date().toISOString().split('T')[0];
    return {
      responseType: 'list',
      title: `${tasks.length} task${tasks.length !== 1 ? 's' : ''} due this week`,
      items: tasks.map((t) => ({
        id: t.id,
        label: t.title,
        sublabel: `${t.type.replace(/_/g, ' ')} for ${t.lead_name} · due ${t.due_date}`,
        badge: t.due_date === today ? 'Today' : t.priority,
        badgeColor: (t.due_date === today ? 'orange' : t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'orange' : 'gray') as AssistantListItem['badgeColor'],
        href: `/app/leads/${t.lead_id}`,
      })),
      totalCount: tasks.length,
    };
  }

  async listHighPriority(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('tasks:read');
    type Row = { id: string; title: string; type: string; due_date: string | null; lead_name: string; lead_id: string };
    const tasks = await this.prisma.$queryRaw<Row[]>`
      SELECT t.id, t.title, t.type, t.due_date::text,
             l.name AS lead_name, l.id AS lead_id
      FROM sales.lead_tasks t
      JOIN sales.leads l ON l.id = t.lead_id
      WHERE t.company_id = ${companyId}::uuid
        AND t.completed = false
        AND t.priority = 'high'
      ORDER BY t.due_date ASC NULLS LAST
      LIMIT 20
    `;
    if (!tasks.length) return { responseType: 'text', text: 'No high priority tasks found. Keep on top of your pipeline!' };
    return {
      responseType: 'list',
      title: `${tasks.length} high priority task${tasks.length !== 1 ? 's' : ''}`,
      items: tasks.map((t) => ({
        id: t.id,
        label: t.title,
        sublabel: `${t.type.replace(/_/g, ' ')} for ${t.lead_name}${t.due_date ? ` · due ${t.due_date}` : ''}`,
        badge: 'High',
        badgeColor: 'red' as AssistantListItem['badgeColor'],
        href: `/app/leads/${t.lead_id}`,
      })),
      totalCount: tasks.length,
    };
  }

  async listToday(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('tasks:read');
    type Row = { id: string; title: string; type: string; priority: string; due_date: string | null; lead_name: string; lead_id: string };
    const tasks = await this.prisma.$queryRaw<Row[]>`
      SELECT t.id, t.title, t.type, t.priority, t.due_date::text,
             l.name AS lead_name, l.id AS lead_id
      FROM sales.lead_tasks t
      JOIN sales.leads l ON l.id = t.lead_id
      WHERE t.company_id = ${companyId}::uuid
        AND t.completed = false
        AND (t.due_date <= CURRENT_DATE)
      ORDER BY
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        t.due_date ASC NULLS LAST
      LIMIT 20
    `;
    if (!tasks.length) return { responseType: 'text', text: "You're all caught up! No pending tasks due today or overdue." };
    const today = new Date().toISOString().split('T')[0];
    return {
      responseType: 'list',
      title: `${tasks.length} task${tasks.length !== 1 ? 's' : ''} pending`,
      items: tasks.map((t) => {
        const isOverdue = t.due_date !== null && t.due_date < today;
        return {
          id: t.id,
          label: t.title,
          sublabel: `${t.type.replace('_', ' ')} for ${t.lead_name}`,
          badge: isOverdue ? 'Overdue' : t.due_date === today ? 'Today' : t.priority,
          badgeColor: (isOverdue ? 'red' : t.due_date === today ? 'orange' : t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'orange' : 'gray') as AssistantListItem['badgeColor'],
          href: `/app/leads/${t.lead_id}`,
        };
      }),
      totalCount: tasks.length,
    };
  }

  async getCount(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('tasks:read');
    type Row = { overdue: string; today: string; pending: string; done: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT COUNT(*) FILTER (WHERE completed = false AND due_date < CURRENT_DATE)::text AS overdue,
             COUNT(*) FILTER (WHERE completed = false AND due_date = CURRENT_DATE)::text AS today,
             COUNT(*) FILTER (WHERE completed = false)::text AS pending,
             COUNT(*) FILTER (WHERE completed = true)::text AS done
      FROM sales.lead_tasks
      WHERE company_id = ${companyId}::uuid
    `;
    const r = rows[0];
    const overdue = parseInt(r?.overdue ?? '0', 10);
    const todayCount = parseInt(r?.today ?? '0', 10);
    return {
      responseType: 'summary',
      title: `Your tasks — ${r?.pending ?? 0} pending`,
      summaryCards: [
        { label: 'Overdue', value: r?.overdue ?? '0', color: overdue > 0 ? 'red' : 'gray' },
        { label: 'Due Today', value: r?.today ?? '0', color: todayCount > 0 ? 'orange' : 'gray' },
        { label: 'Pending', value: r?.pending ?? '0', color: 'blue' },
        { label: 'Completed', value: r?.done ?? '0', color: 'green' },
      ],
    };
  }
}
