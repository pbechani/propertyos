import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// PropertySearchAgent
// Searches and filters the property listing catalog.
// Tool permissions: properties:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PropertySearchAgent extends BaseAgent {
  readonly agentName = 'PropertySearchAgent';
  readonly description = 'Searches and filters property listings by type, price, city, and status.';
  readonly capabilities = ['property_db_read', 'geo_filter', 'price_filter'] as const;
  readonly actions = ['listActive', 'listByType', 'listByCity', 'getCount', 'searchRecent'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['properties:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'listActive':    return this.listActive(companyId);
      case 'listByType':    return this.listByType(companyId, params.type ?? '');
      case 'listByCity':    return this.listByCity(companyId, params.city ?? '');
      case 'getCount':      return this.getCount(companyId);
      case 'searchRecent':  return this.searchRecent(companyId);
      default:
        return { responseType: 'error', text: `PropertySearchAgent: unknown action "${action}"` };
    }
  }

  private async listActive(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('properties:read');
    type Row = { id: string; title: string; price: string; property_type: string; city: string | null; listing_status: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, title, price::text, property_type, city, listing_status
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
        AND listing_status = 'active'
      ORDER BY created_at DESC
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: 'No active listings found.' };
    return {
      responseType: 'list',
      title: `${rows.length} active listing${rows.length !== 1 ? 's' : ''}`,
      items: rows.map(r => ({
        id: r.id,
        label: r.title,
        sublabel: `${r.property_type.replace(/_/g, ' ')} · ${r.city ?? 'Unknown city'}`,
        badge: this.fmtZar(Number(r.price)),
        badgeColor: 'green',
        href: `/app/properties/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  private async listByType(companyId: string, type: string): Promise<AssistantResponse> {
    this.assertPermission('properties:read');
    type Row = { id: string; title: string; price: string; city: string | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, title, price::text, city
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
        AND property_type = ${type}
        AND listing_status = 'active'
      ORDER BY price ASC
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: `No active ${type} listings found.` };
    return {
      responseType: 'list',
      title: `${rows.length} ${type} listing${rows.length !== 1 ? 's' : ''}`,
      items: rows.map(r => ({
        id: r.id,
        label: r.title,
        sublabel: r.city ?? 'Unknown city',
        badge: this.fmtZar(Number(r.price)),
        badgeColor: 'green',
        href: `/app/properties/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  private async listByCity(companyId: string, city: string): Promise<AssistantResponse> {
    this.assertPermission('properties:read');
    type Row = { id: string; title: string; price: string; property_type: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, title, price::text, property_type
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
        AND lower(city) LIKE ${'%' + city.toLowerCase() + '%'}
        AND listing_status = 'active'
      ORDER BY price ASC
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: `No active listings found in "${city}".` };
    return {
      responseType: 'list',
      title: `${rows.length} listing${rows.length !== 1 ? 's' : ''} in ${city}`,
      items: rows.map(r => ({
        id: r.id,
        label: r.title,
        sublabel: r.property_type.replace(/_/g, ' '),
        badge: this.fmtZar(Number(r.price)),
        badgeColor: 'green',
        href: `/app/properties/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  private async getCount(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('properties:read');
    type Row = { listing_status: string; cnt: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT listing_status, count(*)::text AS cnt
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
      GROUP BY listing_status
    `;
    return {
      responseType: 'summary',
      title: 'Property listing counts',
      summaryCards: rows.map(r => ({ label: r.listing_status, value: Number(r.cnt) })),
    };
  }

  private async searchRecent(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('properties:read');
    type Row = { id: string; title: string; price: string; property_type: string; city: string | null; created_at: Date };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, title, price::text, property_type, city, created_at
      FROM property.listings
      WHERE company_id = ${companyId}::uuid
      ORDER BY created_at DESC
      LIMIT 10
    `;
    if (!rows.length) return { responseType: 'text', text: 'No listings found.' };
    return {
      responseType: 'list',
      title: 'Most recently added listings',
      items: rows.map(r => ({
        id: r.id,
        label: r.title,
        sublabel: `${r.property_type.replace(/_/g, ' ')} · ${r.city ?? 'Unknown'} · added ${this.relativeTime(r.created_at)}`,
        badge: this.fmtZar(Number(r.price)),
        badgeColor: 'blue',
        href: `/app/properties/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }
}
