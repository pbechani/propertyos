import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';
import { ValuationRequestDto, SubmitValuationReportDto } from './mandate.dto';

export type ValuationRecord = {
  id: string;
  property_id: string;
  valuation_type: string;
  valuer_id: string | null;
  estimated_value: string;
  market_low: string | null;
  market_high: string | null;
  currency: string;
  valuation_date: Date;
  methodology: string | null;
  comparables: unknown;
  report_document_url: string | null;
  is_bank_accepted: boolean;
  requesting_purpose: string | null;
  notes: string | null;
  created_at: Date;
};

export type ComparableSaleRecord = {
  id: string;
  address: string;
  city: string | null;
  region: string | null;
  country: string;
  property_type: string | null;
  property_subtype: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor_area_sqm: string | null;
  erf_size_sqm: string | null;
  sale_price: string;
  currency: string;
  sale_date: Date;
  days_on_market: number | null;
  lat: string | null;
  lng: string | null;
  data_source: string | null;
  created_at: Date;
};

@Injectable()
export class ValuationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // REQUEST / CREATE
  // ──────────────────────────────────────────────────────────

  async requestValuation(
    propertyId: string,
    actorId: string,
    actorRole: string,
    dto: ValuationRequestDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ValuationRecord> {
    const props = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!props.length) throw new NotFoundException('Property not found');

    // For formal valuations, valuer_id is the actor
    const valuerId = dto.valuationType === 'formal' ? actorId : null;

    const rows = await this.prisma.$queryRaw<ValuationRecord[]>`
      INSERT INTO property.valuations (
        property_id, valuation_type, valuer_id, estimated_value,
        market_low, market_high, currency, valuation_date,
        methodology, comparables, report_document_url,
        is_bank_accepted, requesting_purpose, notes
      ) VALUES (
        ${propertyId}::uuid,
        ${dto.valuationType},
        ${valuerId}::uuid,
        ${dto.estimatedValue},
        ${dto.marketLow ?? null},
        ${dto.marketHigh ?? null},
        ${dto.currency ?? 'ZAR'},
        ${dto.valuationDate}::date,
        ${dto.methodology ?? null},
        ${JSON.stringify(dto.comparables ?? [])}::jsonb,
        ${dto.reportDocumentUrl ?? null},
        ${dto.isBankAccepted ?? false},
        ${dto.requestingPurpose ?? null},
        ${dto.notes ?? null}
      )
      RETURNING *
    `;

    const valuation = rows[0];

    await this.audit.log({
      actorId,
      actorRole,
      companyId: companyId ?? null,
      action: 'valuation.requested',
      resourceType: 'valuation',
      resourceId: valuation.id,
      payload: { propertyId, valuationType: dto.valuationType },
      ipAddress,
      userAgent,
    });

    return valuation;
  }

  // ──────────────────────────────────────────────────────────
  // LIST by property
  // ──────────────────────────────────────────────────────────

  async findByProperty(propertyId: string): Promise<ValuationRecord[]> {
    return this.prisma.$queryRaw<ValuationRecord[]>`
      SELECT * FROM property.valuations
      WHERE property_id = ${propertyId}::uuid
      ORDER BY valuation_date DESC
    `;
  }

  // ──────────────────────────────────────────────────────────
  // SUBMIT REPORT (formal valuer uploads report)
  // ──────────────────────────────────────────────────────────

  async submitReport(
    valuationId: string,
    actorId: string,
    actorRole: string,
    dto: SubmitValuationReportDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ValuationRecord> {
    const existing = await this.findValuationOrThrow(valuationId);

    // Only the valuer assigned or an admin may submit the report
    if (actorRole !== 'admin' && existing.valuer_id !== actorId) {
      throw new ForbiddenException('Only the assigned valuer can submit the report');
    }

    const rows = await this.prisma.$queryRaw<ValuationRecord[]>`
      UPDATE property.valuations
      SET report_document_url = ${dto.reportDocumentUrl},
          is_bank_accepted     = ${dto.isBankAccepted ?? false}
      WHERE id = ${valuationId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      companyId: companyId ?? null,
      action: 'valuation.report_submitted',
      resourceType: 'valuation',
      resourceId: valuationId,
      payload: { reportDocumentUrl: dto.reportDocumentUrl },
      ipAddress,
      userAgent,
    });

    return rows[0];
  }

  // ──────────────────────────────────────────────────────────
  // COMPARABLE SALES near a property
  // ──────────────────────────────────────────────────────────

  async getComparableSales(
    propertyId: string,
    radiusKm: number = 2,
  ): Promise<ComparableSaleRecord[]> {
    // Get property location
    const locations = await this.prisma.$queryRaw<
      Array<{ latitude: string | null; longitude: string | null; country: string; city: string | null }>
    >`
      SELECT pl.latitude, pl.longitude, pl.country, pl.city
      FROM property.property_locations pl
      WHERE pl.property_id = ${propertyId}::uuid
      LIMIT 1
    `;

    if (!locations.length || !locations[0].latitude || !locations[0].longitude) {
      // Fall back to city-level match
      const loc = locations[0];
      if (!loc) return [];
      return this.prisma.$queryRaw<ComparableSaleRecord[]>`
        SELECT * FROM property.comparable_sales
        WHERE country = ${loc.country}
          AND city = ${loc.city ?? ''}
        ORDER BY sale_date DESC
        LIMIT 20
      `;
    }

    const lat = parseFloat(locations[0].latitude);
    const lng = parseFloat(locations[0].longitude);

    // Simple bounding box approximation (1 degree latitude ≈ 111 km)
    const latDelta = radiusKm / 111.0;
    const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));

    return this.prisma.$queryRaw<ComparableSaleRecord[]>`
      SELECT * FROM property.comparable_sales
      WHERE lat BETWEEN ${lat - latDelta} AND ${lat + latDelta}
        AND lng BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}
      ORDER BY sale_date DESC
      LIMIT 20
    `;
  }

  // ──────────────────────────────────────────────────────────
  // FIND VALUERS
  // ──────────────────────────────────────────────────────────

  async findValuers(country?: string, specialization?: string) {
    return this.prisma.$queryRaw<
      Array<{ id: string; first_name: string; last_name: string; email: string }>
    >`
      SELECT u.id, u.first_name, u.last_name, u.email
      FROM identity.users u
      JOIN identity.user_roles ur ON ur.user_id = u.id
      JOIN identity.roles r ON r.id = ur.role_id
      WHERE r.name = 'valuer'
        AND u.status = 'active'
      ORDER BY u.first_name
      LIMIT 50
    `;
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────
  // AI ESTIMATE (Automated Valuation Model)
  // ──────────────────────────────────────────────────────────

  async getAiEstimate(propertyId: string): Promise<{
    estimate: number;
    low: number;
    high: number;
    currency: string;
    confidence: 'high' | 'medium' | 'low';
    methodology: string;
    comparables_count: number;
  }> {
    // 1. Fetch property attributes
    const propRows = await this.prisma.$queryRaw<Array<{
      price: string | null;
      currency: string | null;
      area_sqm: string | null;
      bedrooms: number | null;
      bathrooms: number | null;
      property_type: string | null;
    }>>`
      SELECT price, currency, area_sqm, bedrooms, bathrooms, property_type
      FROM property.properties
      WHERE id = ${propertyId}::uuid
      LIMIT 1
    `;
    if (!propRows.length) throw new NotFoundException('Property not found');
    const prop = propRows[0];

    // 2. Fetch comparable sales (up to 5 km radius)
    const comparables = await this.getComparableSales(propertyId, 5);

    const currency = prop.currency ?? 'ZAR';

    // 3. No comparables — fall back to asking price with wide band
    if (!comparables.length) {
      const askingPrice = prop.price ? parseFloat(prop.price) : 0;
      if (askingPrice <= 0) {
        return {
          estimate: 0, low: 0, high: 0, currency,
          confidence: 'low',
          methodology: 'Insufficient data — no comparable sales found within 5 km and no asking price set.',
          comparables_count: 0,
        };
      }
      return {
        estimate: Math.round(askingPrice),
        low: Math.round(askingPrice * 0.85),
        high: Math.round(askingPrice * 1.15),
        currency,
        confidence: 'low',
        methodology: 'Based on asking price only — no comparable sales found within 5 km.',
        comparables_count: 0,
      };
    }

    // 4. Filter to same property type if we have enough matches
    const sameType = prop.property_type
      ? comparables.filter((c) => !c.property_type || c.property_type === prop.property_type)
      : comparables;
    const pool = sameType.length >= 3 ? sameType : comparables;

    // 5. Choose price-per-m² approach if both subject and comparables have area
    const subjectArea = prop.area_sqm ? parseFloat(prop.area_sqm) : null;
    const withArea = pool.filter((c) => c.floor_area_sqm && parseFloat(c.floor_area_sqm) > 0);

    let estimate: number;
    let methodology: string;

    if (subjectArea && subjectArea > 0 && withArea.length >= 2) {
      const pricePerSqm = withArea.map(
        (c) => parseFloat(c.sale_price) / parseFloat(c.floor_area_sqm!),
      );
      const med = median(pricePerSqm);
      estimate = Math.round(med * subjectArea);
      methodology = `Price-per-m² method using ${withArea.length} comparable sale${withArea.length !== 1 ? 's' : ''} — median ZAR ${Math.round(med).toLocaleString('en-ZA')}/m² × ${subjectArea} m².`;
    } else {
      const prices = pool.map((c) => parseFloat(c.sale_price));
      estimate = Math.round(median(prices));
      methodology = `Median sale price from ${pool.length} comparable sale${pool.length !== 1 ? 's' : ''} within 5 km radius.`;
    }

    // 6. Calculate confidence band from variance of comparable prices
    const prices = pool.map((c) => parseFloat(c.sale_price));
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, v) => sum + (v - mean) ** 2, 0) / prices.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0.3;

    const bandPct = Math.min(0.30, Math.max(0.05, cv));
    const low = Math.round(estimate * (1 - bandPct));
    const high = Math.round(estimate * (1 + bandPct));

    const confidence: 'high' | 'medium' | 'low' =
      pool.length >= 5 && cv < 0.15 ? 'high' :
      pool.length >= 3 && cv < 0.25 ? 'medium' : 'low';

    return {
      estimate,
      low,
      high,
      currency,
      confidence,
      methodology,
      comparables_count: pool.length,
    };
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  private async findValuationOrThrow(valuationId: string): Promise<ValuationRecord> {
    const rows = await this.prisma.$queryRaw<ValuationRecord[]>`
      SELECT * FROM property.valuations WHERE id = ${valuationId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Valuation not found');
    return rows[0];
  }
}

// ──────────────────────────────────────────────────────────
// Pure statistical helpers (module-level)
// ──────────────────────────────────────────────────────────

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
