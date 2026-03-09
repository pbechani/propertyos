import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// PropertyValuationAgent
// Provides market valuation estimates by comparing similar active listings.
// Tool permissions: properties:read, analytics:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PropertyValuationAgent extends BaseAgent {
  readonly agentName = 'PropertyValuationAgent';
  readonly description = 'Estimates property valuations from comparable active listings using market averages.';
  readonly capabilities = ['property_db_read', 'market_analysis', 'valuation_model'] as const;
  readonly actions = ['marketAverages', 'comparables', 'priceDistribution'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['properties:read', 'analytics:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'marketAverages':     return this.marketAverages(companyId);
      case 'comparables':        return this.comparables(companyId, params.city ?? '', params.type ?? '');
      case 'priceDistribution':  return this.priceDistribution(companyId);
      default:
        return { responseType: 'error', text: `PropertyValuationAgent: unknown action "${action}"` };
    }
  }

  private async marketAverages(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('analytics:read');
    type Row = { property_type: string; city: string | null; avg_price: string; cnt: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT property_type, city,
             round(avg(price))::text AS avg_price,
             count(*)::text AS cnt
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
        AND listing_status = 'active'
        AND price IS NOT NULL
      GROUP BY property_type, city
      ORDER BY avg(price) DESC
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: 'No market data available yet.' };
    return {
      responseType: 'list',
      title: 'Market averages by type & city',
      items: rows.map((r, i) => ({
        id: String(i),
        label: `${r.property_type.replace(/_/g, ' ')} — ${r.city ?? 'All cities'}`,
        sublabel: `${r.cnt} comparable listings`,
        badge: this.fmtZar(Number(r.avg_price)),
        badgeColor: 'purple',
      })),
      totalCount: rows.length,
    };
  }

  private async comparables(companyId: string, city: string, type: string): Promise<AssistantResponse> {
    this.assertPermission('properties:read');
    type Row = { id: string; title: string; price: string; city: string | null; property_type: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, title, price::text, city, property_type
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
        AND listing_status = 'active'
        AND (${city} = '' OR lower(city) LIKE ${'%' + city.toLowerCase() + '%'})
        AND (${type} = '' OR property_type = ${type})
      ORDER BY created_at DESC
      LIMIT 10
    `;
    if (!rows.length) return { responseType: 'text', text: 'No comparable listings found.' };
    const prices = rows.map(r => Number(r.price)).filter(p => p > 0);
    const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    return {
      responseType: 'list',
      title: `${rows.length} comparable${rows.length !== 1 ? 's' : ''} — avg ${this.fmtZar(avg)}`,
      items: rows.map(r => ({
        id: r.id,
        label: r.title,
        sublabel: `${r.property_type.replace(/_/g, ' ')} · ${r.city ?? 'Unknown'}`,
        badge: this.fmtZar(Number(r.price)),
        badgeColor: 'green',
        href: `/app/properties/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  private async priceDistribution(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('analytics:read');
    type Row = { bucket: string; cnt: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        CASE
          WHEN price < 500000    THEN '< R500K'
          WHEN price < 1000000   THEN 'R500K–R1M'
          WHEN price < 2000000   THEN 'R1M–R2M'
          WHEN price < 5000000   THEN 'R2M–R5M'
          ELSE 'R5M+'
        END AS bucket,
        count(*)::text AS cnt
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
        AND listing_status = 'active'
        AND price IS NOT NULL
      GROUP BY bucket
      ORDER BY min(price)
    `;
    if (!rows.length) return { responseType: 'text', text: 'No listing price data available.' };
    return {
      responseType: 'chart',
      chart: {
        title: 'Price distribution (active listings)',
        bars: rows.map(r => ({ label: r.bucket, value: Number(r.cnt) })),
      },
    };
  }
}
