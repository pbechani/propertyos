import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database';

export type ComparisonWinner = {
  propertyId: string;
  value: number;
};

export interface PropertyComparison {
  properties: ComparisonProperty[];
  comparison: {
    price: { values: Array<{ propertyId: string; value: number }>; winner: string | null };
    pricePerSqm: { values: Array<{ propertyId: string; value: number | null }>; winner: string | null };
    size: { values: Array<{ propertyId: string; value: number | null }>; winner: string | null };
    bedrooms: { values: Array<{ propertyId: string; value: number | null }> };
    monthlyLevy: { values: Array<{ propertyId: string; value: number | null }> };
    verificationStatus: { values: Array<{ propertyId: string; value: string }> };
    daysOnMarket: { values: Array<{ propertyId: string; value: number | null }>; winner: string | null };
  };
}

export type ComparisonProperty = {
  id: string;
  title: string;
  price: string;
  currency: string;
  area_sqm: string | null;
  floor_area_sqm: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  monthly_levy: string | null;
  verification_status: string;
  status: string;
  property_type: string;
  city: string | null;
  created_at: Date;
  media_url: string | null;
};

@Injectable()
export class ComparisonService {
  private static readonly MAX_COMPARE = 4;

  constructor(private readonly prisma: PrismaService) {}

  async compare(ids: string[]): Promise<PropertyComparison> {
    if (!ids.length || ids.length > ComparisonService.MAX_COMPARE) {
      throw new BadRequestException(`Provide between 1 and ${ComparisonService.MAX_COMPARE} property IDs`);
    }

    // Validate UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of ids) {
      if (!uuidRegex.test(id)) {
        throw new BadRequestException(`Invalid UUID: ${id}`);
      }
    }

    // Prisma $queryRaw with an IN clause using safe parameterisation
    const placeholders = ids.map((_, i) => `$${i + 1}::uuid`).join(', ');
    const rows = await this.prisma.$queryRawUnsafe<ComparisonProperty[]>(
      `
      SELECT
        p.id, p.title, p.price::text, p.currency,
        p.area_sqm::text, p.floor_area_sqm::text, p.bedrooms, p.bathrooms,
        p.monthly_levy::text, p.verification_status, p.status, p.property_type,
        p.created_at,
        pl.city,
        (
          SELECT pm.url
          FROM property.property_media pm
          WHERE pm.property_id = p.id AND pm.is_primary = TRUE
          LIMIT 1
        ) AS media_url
      FROM property.properties p
      LEFT JOIN property.property_locations pl ON pl.property_id = p.id
      WHERE p.id IN (${placeholders})
      `,
      ...ids,
    );

    const now = Date.now();

    // Build comparison vectors
    const priceValues = rows.map((p) => ({
      propertyId: p.id,
      value: parseFloat(p.price),
    }));

    const sizeValues = rows.map((p) => ({
      propertyId: p.id,
      value: p.floor_area_sqm ? parseFloat(p.floor_area_sqm) : (p.area_sqm ? parseFloat(p.area_sqm) : null),
    }));

    const pricePerSqmValues = rows.map((p) => {
      const price = parseFloat(p.price);
      const size = p.floor_area_sqm
        ? parseFloat(p.floor_area_sqm)
        : p.area_sqm
          ? parseFloat(p.area_sqm)
          : null;
      return {
        propertyId: p.id,
        value: size && size > 0 ? Math.round(price / size) : null,
      };
    });

    const daysOnMarketValues = rows.map((p) => ({
      propertyId: p.id,
      value: Math.round((now - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    }));

    return {
      properties: rows,
      comparison: {
        price: {
          values: priceValues,
          winner: this.lowestWinner(priceValues),
        },
        pricePerSqm: {
          values: pricePerSqmValues,
          winner: this.lowestWinnerNullable(pricePerSqmValues),
        },
        size: {
          values: sizeValues,
          winner: this.highestWinnerNullable(sizeValues),
        },
        bedrooms: {
          values: rows.map((p) => ({ propertyId: p.id, value: p.bedrooms })),
        },
        monthlyLevy: {
          values: rows.map((p) => ({
            propertyId: p.id,
            value: p.monthly_levy ? parseFloat(p.monthly_levy) : null,
          })),
        },
        verificationStatus: {
          values: rows.map((p) => ({
            propertyId: p.id,
            value: p.verification_status,
          })),
        },
        daysOnMarket: {
          values: daysOnMarketValues,
          winner: this.lowestWinner(daysOnMarketValues),
        },
      },
    };
  }

  private lowestWinner(
    values: Array<{ propertyId: string; value: number }>,
  ): string | null {
    if (!values.length) return null;
    return values.reduce((min, cur) => (cur.value < min.value ? cur : min)).propertyId;
  }

  private lowestWinnerNullable(
    values: Array<{ propertyId: string; value: number | null }>,
  ): string | null {
    const defined = values.filter((v) => v.value !== null) as Array<{
      propertyId: string;
      value: number;
    }>;
    return this.lowestWinner(defined);
  }

  private highestWinnerNullable(
    values: Array<{ propertyId: string; value: number | null }>,
  ): string | null {
    const defined = values.filter((v) => v.value !== null) as Array<{
      propertyId: string;
      value: number;
    }>;
    if (!defined.length) return null;
    return defined.reduce((max, cur) => (cur.value > max.value ? cur : max)).propertyId;
  }
}
