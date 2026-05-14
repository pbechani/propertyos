import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';

export type NeighbourhoodStatRecord = {
  id: string;
  suburb: string;
  city: string;
  region: string;
  country: string;
  avg_price_per_sqm: string | null;
  median_sale_price: string | null;
  avg_days_on_market: number | null;
  yoy_price_change_pct: string | null;
  demand_score: number | null;
  school_rating: number | null;
  infrastructure_score: number | null;
  crime_index: number | null;
  walkability_score: number | null;
  last_calculated_at: Date | null;
  data_sources: unknown;
};

export type SyndicationConfigRecord = {
  id: string;
  portal_name: string;
  portal_api_endpoint: string | null;
  auth_type: string | null;
  supported_countries: unknown;
  is_active: boolean;
  last_sync_at: Date | null;
};

export type SyndicationRecordRow = {
  id: string;
  property_id: string;
  portal_id: string;
  external_listing_id: string | null;
  external_url: string | null;
  sync_status: string;
  last_synced_at: Date | null;
  error_message: string | null;
  created_at: Date;
  portal_name: string;
};

@Injectable()
export class NeighbourhoodService {
  constructor(private readonly prisma: PrismaService) {}

  async getByPropertyLocation(propertyId: string): Promise<NeighbourhoodStatRecord | null> {
    const locations = await this.prisma.$queryRaw<
      Array<{ city: string | null; region: string | null; country: string; postal_code: string | null }>
    >`
      SELECT city, region, country, postal_code
      FROM property.property_locations
      WHERE property_id = ${propertyId}::uuid
      LIMIT 1
    `;

    if (!locations.length || !locations[0].city) return null;

    const loc = locations[0];
    const rows = await this.prisma.$queryRaw<NeighbourhoodStatRecord[]>`
      SELECT * FROM property.neighbourhood_stats
      WHERE country = ${loc.country}
        AND city = ${loc.city}
      ORDER BY last_calculated_at DESC NULLS LAST
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async getBySuburb(
    suburb: string,
    city: string,
    country: string,
  ): Promise<NeighbourhoodStatRecord | null> {
    const rows = await this.prisma.$queryRaw<NeighbourhoodStatRecord[]>`
      SELECT * FROM property.neighbourhood_stats
      WHERE suburb = ${suburb}
        AND city = ${city}
        AND country = ${country}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }
}

@Injectable()
export class SyndicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // SYNDICATE property to all active portals
  // ──────────────────────────────────────────────────────────

  async syndicateProperty(
    propertyId: string,
    agentId: string,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<SyndicationRecordRow[]> {
    // Get active portals
    const portals = await this.prisma.$queryRaw<SyndicationConfigRecord[]>`
      SELECT * FROM property.syndication_configs
      WHERE is_active = TRUE
    `;

    const results: SyndicationRecordRow[] = [];

    for (const portal of portals) {
      // Upsert a syndication record set to 'pending'
      const rows = await this.prisma.$queryRaw<SyndicationRecordRow[]>`
        INSERT INTO property.syndication_records (property_id, portal_id, sync_status)
        VALUES (${propertyId}::uuid, ${portal.id}::uuid, 'pending')
        ON CONFLICT (property_id, portal_id)
        DO UPDATE SET sync_status = 'pending', error_message = NULL
        RETURNING *,
          (SELECT portal_name FROM property.syndication_configs WHERE id = portal_id) as portal_name
      `;
      if (rows[0]) results.push(rows[0]);
    }

    await this.audit.log({
      actorId: agentId,
      actorRole: 'agent',
      companyId: companyId ?? null,
      action: 'syndication.queued',
      resourceType: 'property',
      resourceId: propertyId,
      payload: { portalCount: portals.length },
      ipAddress,
      userAgent,
    });

    return results;
  }

  // ──────────────────────────────────────────────────────────
  // PAUSE a specific portal syndication
  // ──────────────────────────────────────────────────────────

  async pauseSyndication(
    propertyId: string,
    portalId: string,
    agentId: string,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<SyndicationRecordRow | null> {
    const rows = await this.prisma.$queryRaw<SyndicationRecordRow[]>`
      UPDATE property.syndication_records
      SET sync_status = 'paused'
      WHERE property_id = ${propertyId}::uuid
        AND portal_id = ${portalId}::uuid
      RETURNING *,
        (SELECT portal_name FROM property.syndication_configs WHERE id = portal_id) as portal_name
    `;

    if (rows.length) {
      await this.audit.log({
        actorId: agentId,
        actorRole: 'agent',
        companyId: companyId ?? null,
        action: 'syndication.paused',
        resourceType: 'syndication_record',
        resourceId: rows[0].id,
        payload: { propertyId, portalId },
        ipAddress,
        userAgent,
      });
    }

    return rows[0] ?? null;
  }

  // ──────────────────────────────────────────────────────────
  // GET syndication status for a property
  // ──────────────────────────────────────────────────────────

  async getSyndicationStatus(propertyId: string): Promise<SyndicationRecordRow[]> {
    return this.prisma.$queryRaw<SyndicationRecordRow[]>`
      SELECT sr.*, sc.portal_name
      FROM property.syndication_records sr
      JOIN property.syndication_configs sc ON sc.id = sr.portal_id
      WHERE sr.property_id = ${propertyId}::uuid
      ORDER BY sc.portal_name
    `;
  }
}
