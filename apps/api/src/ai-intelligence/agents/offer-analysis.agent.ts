import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// OfferAnalysisAgent
// Surfaces offer-stage leads, conversion rate signals, and high-value hot
// prospects ready to move.
// Tool permissions: leads:read, properties:read, viewings:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class OfferAnalysisAgent extends BaseAgent {
  readonly agentName = 'OfferAnalysisAgent';
  readonly description = 'Analyses offers, conversion rates, and hot-prospect deal momentum.';
  readonly capabilities = ['property_db_read', 'buyer_db_read', 'payment_read'] as const;
  readonly actions = ['analyzeOffers', 'hotLeads', 'conversionRate'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['leads:read', 'properties:read', 'viewings:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    _params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'analyzeOffers':   return this.analyzeOffers(companyId);
      case 'hotLeads':        return this.hotLeads(companyId);
      case 'conversionRate':  return this.conversionRate(companyId);
      default:
        return { responseType: 'error', text: `OfferAnalysisAgent: unknown action "${action}"` };
    }
  }

  /** Leads currently in offer or negotiation stage, ordered by deal value */
  private async analyzeOffers(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { id: string; name: string; stage: string; deal_value: string | null; temperature: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, deal_value::text, temperature
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage IN ('proposal', 'negotiation', 'verbal_offer', 'written_offer')
      ORDER BY deal_value DESC NULLS LAST
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: 'No leads currently in the offer or negotiation stages.' };
    const colorMap: Record<string, 'red' | 'orange' | 'blue'> = { hot: 'red', warm: 'orange', cold: 'blue' };
    return {
      responseType: 'list',
      title: `${rows.length} active offer${rows.length !== 1 ? 's' : ''}`,
      items: rows.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: `Stage: ${r.stage.replace(/_/g, ' ')}`,
        badge: r.deal_value ? this.fmtZar(Number(r.deal_value)) : r.temperature,
        badgeColor: r.deal_value ? 'green' : (colorMap[r.temperature] ?? 'gray'),
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  /** Hot leads with deal values that have not yet closed */
  private async hotLeads(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { id: string; name: string; stage: string; deal_value: string | null; last_contact_at: Date | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, deal_value::text, last_contact_at
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND temperature = 'hot'
        AND deal_value IS NOT NULL
        AND stage NOT IN ('closed_lost', 'closed_won')
      ORDER BY deal_value DESC
      LIMIT 10
    `;
    if (!rows.length) return { responseType: 'text', text: 'No hot leads with deal values.' };
    return {
      responseType: 'list',
      title: `${rows.length} hot prospect${rows.length !== 1 ? 's' : ''} with deal values`,
      items: rows.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: `${r.stage.replace(/_/g, ' ')} · last contact ${r.last_contact_at ? this.relativeTime(r.last_contact_at) : 'never'}`,
        badge: this.fmtZar(Number(r.deal_value)),
        badgeColor: 'red',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  /** Pipeline conversion: closed-won vs all leads, plus stage-by-stage counts */
  private async conversionRate(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type TotalRow = { total: string; won: string; lost: string };
    const totals = await this.prisma.$queryRaw<TotalRow[]>`
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE stage = 'closed_won')::text  AS won,
        COUNT(*) FILTER (WHERE stage = 'closed_lost')::text AS lost
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
    `;
    const t = totals[0];
    const total = Number(t?.total ?? 0);
    const won   = Number(t?.won ?? 0);
    const lost  = Number(t?.lost ?? 0);
    const rate  = total > 0 ? ((won / total) * 100).toFixed(1) : '0';

    return {
      responseType: 'summary',
      title: 'Pipeline conversion summary',
      summaryCards: [
        { label: 'Total leads',       value: String(total) },
        { label: 'Won',               value: String(won) },
        { label: 'Lost',              value: String(lost) },
        { label: 'In progress',       value: String(total - won - lost) },
        { label: 'Conversion rate',   value: `${rate}%` },
      ],
    };
  }
}
