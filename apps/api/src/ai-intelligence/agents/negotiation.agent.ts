import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// NegotiationAgent
// Compares buyer budget headroom against listing prices to guide negotiation
// strategy and identify deals closest to agreement.
// Tool permissions: leads:read, properties:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class NegotiationAgent extends BaseAgent {
  readonly agentName = 'NegotiationAgent';
  readonly description = 'Identifies negotiation windows by comparing buyer budgets against property asking prices.';
  readonly capabilities = ['negotiation_model', 'market_data'] as const;
  readonly actions = ['strategize', 'comparePriceVsBudget', 'nearDeal'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['leads:read', 'properties:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'strategize':           return this.strategize(params, companyId);
      case 'comparePriceVsBudget': return this.comparePriceVsBudget(companyId);
      case 'nearDeal':             return this.nearDeal(companyId);
      default:
        return { responseType: 'error', text: `NegotiationAgent: unknown action "${action}"` };
    }
  }

  /**
   * For a specific lead, compare each matching property's asking price against
   * the lead's budget maximum to quantify negotiation room.
   */
  private async strategize(params: Record<string, string>, companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    this.assertPermission('properties:read');

    const leadId = params['leadId'];
    if (!leadId) return { responseType: 'error', text: 'leadId parameter is required.' };

    type LeadRow = { name: string; budget_max: string | null };
    const leads = await this.prisma.$queryRaw<LeadRow[]>`
      SELECT name, budget_max::text
      FROM sales.leads
      WHERE id = ${leadId}::uuid AND company_id = ${companyId}::uuid
      LIMIT 1
    `;
    if (!leads.length) return { responseType: 'error', text: 'Lead not found.' };
    const lead = leads[0];
    if (!lead.budget_max) return { responseType: 'text', text: `${lead.name} has no budget maximum recorded.` };

    const budgetMax = Number(lead.budget_max);

    type PropRow = { id: string; title: string; price: string; city: string | null };
    const props = await this.prisma.$queryRaw<PropRow[]>`
      SELECT id, title, price::text, city
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
        AND listing_status = 'active'
        AND price > 0
        AND price <= ${budgetMax * 1.2}   -- include 20% above max to show stretch targets
      ORDER BY ABS(price - ${budgetMax}) ASC
      LIMIT 10
    `;

    if (!props.length) return { responseType: 'text', text: 'No properties found in the negotiation range.' };

    return {
      responseType: 'list',
      title: `Negotiation strategy for ${lead.name} (budget up to ${this.fmtZar(budgetMax)})`,
      items: props.map(p => {
        const price  = Number(p.price);
        const gap    = price - budgetMax;
        const gapPct = ((gap / price) * 100).toFixed(1);
        const affordable = gap <= 0;
        return {
          id: p.id,
          label: p.title,
          sublabel: `${p.city ?? 'Unknown'} · asking ${this.fmtZar(price)} · gap ${affordable ? 'within budget' : `${this.fmtZar(gap)} over (${gapPct}%)`}`,
          badge: affordable ? 'In budget' : `+${gapPct}%`,
          badgeColor: affordable ? 'green' : gap < budgetMax * 0.1 ? 'orange' : 'red',
          href: `/app/properties/${p.id}`,
        };
      }),
      totalCount: props.length,
    };
  }

  /** Summary chart of average asking price vs average buyer budget max */
  private async comparePriceVsBudget(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    this.assertPermission('properties:read');

    type PriceRow = { avg_price: string | null };
    type BudgetRow = { avg_budget: string | null };

    const [priceRows, budgetRows] = await Promise.all([
      this.prisma.$queryRaw<PriceRow[]>`
        SELECT AVG(price)::numeric(18,2)::text AS avg_price
        FROM property.listings
        WHERE company_id = ${companyId}::uuid
          AND listing_status = 'active'
          AND price IS NOT NULL
      `,
      this.prisma.$queryRaw<BudgetRow[]>`
        SELECT AVG(budget_max)::numeric(18,2)::text AS avg_budget
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
          AND budget_max IS NOT NULL
          AND stage NOT IN ('closed_lost', 'closed_won')
      `,
    ]);

    const avgPrice  = Number(priceRows[0]?.avg_price  ?? 0);
    const avgBudget = Number(budgetRows[0]?.avg_budget ?? 0);
    const gap  = avgPrice - avgBudget;
    const note = gap > 0
      ? `Average listing is ${this.fmtZar(gap)} above average buyer budget — negotiation pressure exists.`
      : `Average buyer budget exceeds average asking price by ${this.fmtZar(Math.abs(gap))} — market favours buyers.`;

    return {
      responseType: 'summary',
      title: 'Average asking price vs buyer budget',
      text: note,
      summaryCards: [
        { label: 'Avg asking price', value: this.fmtZar(avgPrice) },
        { label: 'Avg buyer budget', value: this.fmtZar(avgBudget) },
        { label: 'Gap',              value: this.fmtZar(Math.abs(gap)) },
        { label: 'Market bias',      value: gap > 0 ? 'Seller' : 'Buyer' },
      ],
    };
  }

  /** Leads in negotiation stage with deal value within 10% of matched listing prices */
  private async nearDeal(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { id: string; name: string; stage: string; deal_value: string; last_contact_at: Date | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, deal_value::text, last_contact_at
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage IN ('negotiation', 'verbal_offer', 'written_offer')
        AND deal_value IS NOT NULL
      ORDER BY deal_value DESC
      LIMIT 10
    `;
    if (!rows.length) return { responseType: 'text', text: 'No leads in active negotiation with deal values.' };
    return {
      responseType: 'list',
      title: `${rows.length} lead${rows.length !== 1 ? 's' : ''} in active negotiation`,
      items: rows.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: `${r.stage.replace(/_/g, ' ')} · last contact ${r.last_contact_at ? this.relativeTime(r.last_contact_at) : 'never'}`,
        badge: this.fmtZar(Number(r.deal_value)),
        badgeColor: 'orange',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }
}
