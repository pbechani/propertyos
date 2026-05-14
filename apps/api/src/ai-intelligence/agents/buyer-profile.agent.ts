import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// BuyerProfileAgent
// Builds and surfaces structured buyer profiles from lead data.
// Tool permissions: leads:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class BuyerProfileAgent extends BaseAgent {
  readonly agentName = 'BuyerProfileAgent';
  readonly description = 'Builds buyer profiles from leads and identifies high-value opportunities.';
  readonly capabilities = ['buyer_db_read', 'profile_build'] as const;
  readonly actions = ['buildProfile', 'listActiveProfiles', 'getHighBudget'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['leads:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'buildProfile':       return this.buildProfile(params, companyId);
      case 'listActiveProfiles': return this.listActiveProfiles(companyId);
      case 'getHighBudget':      return this.getHighBudget(companyId);
      default:
        return { responseType: 'error', text: `BuyerProfileAgent: unknown action "${action}"` };
    }
  }

  private async buildProfile(params: Record<string, string>, companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    const leadId = params['leadId'];
    if (!leadId) return { responseType: 'error', text: 'leadId parameter is required.' };

    type Row = {
      id: string; name: string; temperature: string; stage: string;
      prequalified: boolean; budget_min: string | null; budget_max: string | null;
      budget_currency: string | null; deal_value: string | null;
      preferences: unknown; last_contact_at: Date | null; created_at: Date;
    };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, temperature, stage, prequalified,
             budget_min::text, budget_max::text, budget_currency, deal_value::text,
             preferences, last_contact_at, created_at
      FROM sales.leads
      WHERE id = ${leadId}::uuid
        AND company_id = ${companyId}::uuid
      LIMIT 1
    `;
    if (!rows.length) return { responseType: 'error', text: 'Lead not found.' };
    const l = rows[0];

    const budgetStr = (l.budget_min || l.budget_max)
      ? `${l.budget_min ? this.fmtZar(Number(l.budget_min)) : '?'} – ${l.budget_max ? this.fmtZar(Number(l.budget_max)) : '?'}`
      : 'Not specified';

    return {
      responseType: 'summary',
      title: `Buyer profile: ${l.name}`,
      summaryCards: [
        { label: 'Stage', value: l.stage.replace(/_/g, ' ') },
        { label: 'Temperature', value: l.temperature },
        { label: 'Pre-qualified', value: l.prequalified ? 'Yes' : 'No' },
        { label: 'Budget range', value: budgetStr },
        { label: 'Deal value', value: l.deal_value ? this.fmtZar(Number(l.deal_value)) : 'N/A' },
        { label: 'Last contact', value: l.last_contact_at ? this.relativeTime(l.last_contact_at) : 'Never' },
        { label: 'Client since', value: this.relativeTime(l.created_at) },
      ],
    };
  }

  private async listActiveProfiles(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { id: string; name: string; stage: string; temperature: string; prequalified: boolean; budget_max: string | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, temperature, prequalified, budget_max::text
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage NOT IN ('closed_lost', 'closed_won')
      ORDER BY created_at DESC
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: 'No active buyer profiles found.' };
    const colorMap: Record<string, 'red' | 'orange' | 'blue'> = { hot: 'red', warm: 'orange', cold: 'blue' };
    return {
      responseType: 'list',
      title: `${rows.length} active buyer profile${rows.length !== 1 ? 's' : ''}`,
      items: rows.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: `${r.stage.replace(/_/g, ' ')} · ${r.prequalified ? 'Pre-qualified' : 'Not pre-qualified'}`,
        badge: r.temperature,
        badgeColor: colorMap[r.temperature] ?? 'gray',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  private async getHighBudget(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { id: string; name: string; stage: string; budget_max: string; budget_currency: string | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, budget_max::text, budget_currency
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND budget_max IS NOT NULL
        AND stage NOT IN ('closed_lost', 'closed_won')
      ORDER BY budget_max DESC
      LIMIT 10
    `;
    if (!rows.length) return { responseType: 'text', text: 'No leads with budget data found.' };
    return {
      responseType: 'list',
      title: 'Top 10 buyers by maximum budget',
      items: rows.map((r, i) => ({
        id: r.id,
        label: `#${i + 1} ${r.name}`,
        sublabel: `Stage: ${r.stage.replace(/_/g, ' ')}`,
        badge: this.fmtZar(Number(r.budget_max)),
        badgeColor: 'green',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }
}
