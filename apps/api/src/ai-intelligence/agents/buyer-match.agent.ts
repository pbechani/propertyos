import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// BuyerMatchAgent
// Cross-references lead budget/preferences against active listings to surface
// best buyer-property pairings.
// Tool permissions: leads:read, properties:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class BuyerMatchAgent extends BaseAgent {
  readonly agentName = 'BuyerMatchAgent';
  readonly description = 'Matches active buyers to suitable properties using budget and preference overlap.';
  readonly capabilities = ['buyer_db_read', 'property_db_read', 'match_algo'] as const;
  readonly actions = ['findMatches', 'unmatchedBuyers', 'unmatchedProperties'] as const;
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
      case 'findMatches':           return this.findMatches(params, companyId);
      case 'unmatchedBuyers':       return this.unmatchedBuyers(companyId);
      case 'unmatchedProperties':   return this.unmatchedProperties(companyId);
      default:
        return { responseType: 'error', text: `BuyerMatchAgent: unknown action "${action}"` };
    }
  }

  /**
   * Finds property listings that fall within the budget range of a given lead
   * and optionally match the lead's preferred city.
   */
  private async findMatches(params: Record<string, string>, companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    this.assertPermission('properties:read');

    const leadId = params['leadId'];
    if (!leadId) return { responseType: 'error', text: 'leadId parameter is required.' };

    type LeadRow = { id: string; name: string; budget_min: string | null; budget_max: string | null; preferences: unknown };
    const leads = await this.prisma.$queryRaw<LeadRow[]>`
      SELECT id, name, budget_min::text, budget_max::text, preferences
      FROM sales.leads
      WHERE id = ${leadId}::uuid AND company_id = ${companyId}::uuid
      LIMIT 1
    `;
    if (!leads.length) return { responseType: 'error', text: 'Lead not found.' };
    const lead = leads[0];

    const budgetMin = lead.budget_min ? Number(lead.budget_min) : 0;
    const budgetMax = lead.budget_max ? Number(lead.budget_max) : Number.MAX_SAFE_INTEGER;

    type PropRow = { id: string; title: string; price: string; property_type: string; city: string | null };
    const props = await this.prisma.$queryRaw<PropRow[]>`
      SELECT id, title, price::text, property_type, city
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
        AND listing_status = 'active'
        AND price BETWEEN ${budgetMin} AND ${budgetMax}
      ORDER BY price ASC
      LIMIT 15
    `;

    if (!props.length) {
      return {
        responseType: 'text',
        text: `No active listings found within ${lead.name}'s budget (${this.fmtZar(budgetMin)} – ${budgetMax === Number.MAX_SAFE_INTEGER ? 'unlimited' : this.fmtZar(budgetMax)}).`,
      };
    }

    return {
      responseType: 'list',
      title: `${props.length} match${props.length !== 1 ? 'es' : ''} for ${lead.name}`,
      items: props.map(p => ({
        id: p.id,
        label: p.title,
        sublabel: `${p.property_type.replace(/_/g, ' ')} · ${p.city ?? 'Unknown'}`,
        badge: this.fmtZar(Number(p.price)),
        badgeColor: 'green',
        href: `/app/properties/${p.id}`,
      })),
      totalCount: props.length,
    };
  }

  /** Returns leads that have no properties matching their budget in the catalog */
  private async unmatchedBuyers(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    this.assertPermission('properties:read');

    type Row = { id: string; name: string; budget_min: string | null; budget_max: string | null; match_count: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT l.id, l.name, l.budget_min::text, l.budget_max::text,
             COUNT(p.id)::text AS match_count
      FROM sales.leads l
      LEFT JOIN property.listings p
        ON p.company_id = ${companyId}::uuid
       AND p.listing_status = 'active'
       AND (l.budget_min IS NULL OR p.price >= l.budget_min)
       AND (l.budget_max IS NULL OR p.price <= l.budget_max)
      WHERE l.company_id = ${companyId}::uuid
        AND l.stage NOT IN ('closed_lost', 'closed_won')
        AND (l.budget_min IS NOT NULL OR l.budget_max IS NOT NULL)
      GROUP BY l.id, l.name, l.budget_min, l.budget_max
      HAVING COUNT(p.id) = 0
      LIMIT 20
    `;

    if (!rows.length) return { responseType: 'text', text: 'All active buyers have at least one matching listing.' };
    return {
      responseType: 'list',
      title: `${rows.length} buyer${rows.length !== 1 ? 's' : ''} without matching properties`,
      items: rows.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: `Budget: ${r.budget_min ? this.fmtZar(Number(r.budget_min)) : '0'} – ${r.budget_max ? this.fmtZar(Number(r.budget_max)) : 'unlimited'}`,
        badge: 'No match',
        badgeColor: 'red',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  /** Returns active listings that have no buyers with matching budget */
  private async unmatchedProperties(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('properties:read');
    this.assertPermission('leads:read');

    type Row = { id: string; title: string; price: string; property_type: string; city: string | null; match_count: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT p.id, p.title, p.price::text, p.property_type, p.city,
             COUNT(l.id)::text AS match_count
      FROM property.listings p
      LEFT JOIN sales.leads l
        ON l.company_id = ${companyId}::uuid
       AND l.stage NOT IN ('closed_lost', 'closed_won')
       AND (l.budget_min IS NULL OR p.price >= l.budget_min)
       AND (l.budget_max IS NULL OR p.price <= l.budget_max)
      WHERE p.company_id = ${companyId}::uuid
        AND p.listing_status = 'active'
        AND p.price IS NOT NULL
      GROUP BY p.id, p.title, p.price, p.property_type, p.city
      HAVING COUNT(l.id) = 0
      LIMIT 20
    `;

    if (!rows.length) return { responseType: 'text', text: 'All active listings have at least one buyer with matching budget.' };
    return {
      responseType: 'list',
      title: `${rows.length} listing${rows.length !== 1 ? 's' : ''} without matching buyers`,
      items: rows.map(r => ({
        id: r.id,
        label: r.title,
        sublabel: `${r.property_type.replace(/_/g, ' ')} · ${r.city ?? 'Unknown'}`,
        badge: this.fmtZar(Number(r.price)),
        badgeColor: 'orange',
        href: `/app/properties/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }
}
