import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// RankingAgent
// Scores and ranks properties and leads by price, recency, and activity.
// Tool permissions: properties:read, leads:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RankingAgent extends BaseAgent {
  readonly agentName = 'RankingAgent';
  readonly description = 'Ranks and scores properties by value and leads by activity and pipeline stage.';
  readonly capabilities = ['scoring_model', 'sort', 'filter'] as const;
  readonly actions = ['topProperties', 'topLeads', 'hotLeads'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['properties:read', 'leads:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    _params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'topProperties': return this.topProperties(companyId);
      case 'topLeads':      return this.topLeads(companyId);
      case 'hotLeads':      return this.hotLeads(companyId);
      default:
        return { responseType: 'error', text: `RankingAgent: unknown action "${action}"` };
    }
  }

  private async topProperties(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('properties:read');
    type Row = { id: string; title: string; price: string; property_type: string; city: string | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, title, price::text, property_type, city
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
        AND listing_status = 'active'
        AND price IS NOT NULL
      ORDER BY price DESC
      LIMIT 10
    `;
    if (!rows.length) return { responseType: 'text', text: 'No properties to rank.' };
    return {
      responseType: 'list',
      title: 'Top 10 listings by value',
      items: rows.map((r, i) => ({
        id: r.id,
        label: `#${i + 1} ${r.title}`,
        sublabel: `${r.property_type.replace(/_/g, ' ')} · ${r.city ?? 'Unknown'}`,
        badge: this.fmtZar(Number(r.price)),
        badgeColor: 'purple',
        href: `/app/properties/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  private async topLeads(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { id: string; name: string; stage: string; deal_value: string | null; last_contact_at: Date | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, deal_value::text, last_contact_at
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage NOT IN ('closed_lost', 'closed_won')
      ORDER BY deal_value DESC NULLS LAST, last_contact_at DESC NULLS LAST
      LIMIT 10
    `;
    if (!rows.length) return { responseType: 'text', text: 'No active leads to rank.' };
    return {
      responseType: 'list',
      title: 'Top 10 leads by deal value',
      items: rows.map((r, i) => ({
        id: r.id,
        label: `#${i + 1} ${r.name}`,
        sublabel: `Stage: ${r.stage.replace(/_/g, ' ')} · last contact ${r.last_contact_at ? this.relativeTime(r.last_contact_at) : 'never'}`,
        badge: r.deal_value ? this.fmtZar(Number(r.deal_value)) : 'No deal',
        badgeColor: r.deal_value ? 'green' : 'gray',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  private async hotLeads(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { id: string; name: string; stage: string; deal_value: string | null; last_contact_at: Date | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, deal_value::text, last_contact_at
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND temperature = 'hot'
        AND stage NOT IN ('closed_lost', 'closed_won')
      ORDER BY deal_value DESC NULLS LAST
      LIMIT 10
    `;
    if (!rows.length) return { responseType: 'text', text: 'No hot leads currently in the pipeline.' };
    return {
      responseType: 'list',
      title: `${rows.length} hot lead${rows.length !== 1 ? 's' : ''}`,
      items: rows.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: `Stage: ${r.stage.replace(/_/g, ' ')}`,
        badge: r.deal_value ? this.fmtZar(Number(r.deal_value)) : 'Hot',
        badgeColor: 'red',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }
}
