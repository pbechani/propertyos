import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { MediaStorageService } from './media-storage.service';
import { PropertyAuditService } from './property-audit.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  SearchPropertiesDto,
} from './property.dto';
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_RADIUS_KM,
  MAX_MEDIA_PER_PROPERTY,
} from './property.constants';

export type PropertyRecord = {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  status: string;
  price: string;
  currency: string;
  area_sqm: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  features: unknown;
  agent_id: string | null;
  owner_id: string | null;
  verification_status: string;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type PropertyWithLocation = PropertyRecord & {
  location?: {
    id: string;
    address_line1: string | null;
    city: string | null;
    region: string | null;
    country: string;
    postal_code: string | null;
    latitude: string | null;
    longitude: string | null;
  } | null;
  media?: {
    id: string;
    media_type: string;
    url: string;
    thumbnail_url: string | null;
    display_order: number;
    is_primary: boolean;
  }[];
};

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorageService,
    private readonly audit: PropertyAuditService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────────────────────────

  async create(
    agentId: string,
    agentRole: string,
    dto: CreatePropertyDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PropertyRecord> {
    const normalized = this.normalizeCreateDto(dto);

    const property = await this.prisma.$queryRaw<PropertyRecord[]>`
      INSERT INTO property.properties (
        title, description, property_type, price, currency,
        area_sqm, bedrooms, bathrooms, parking_spaces, features, agent_id
      ) VALUES (
        ${normalized.title},
        ${normalized.description ?? null},
        ${normalized.propertyType},
        ${normalized.price},
        ${normalized.currency ?? 'USD'},
        ${normalized.areaSqm ?? null},
        ${normalized.bedrooms ?? null},
        ${normalized.bathrooms ?? null},
        ${normalized.parkingSpaces ?? null},
        ${JSON.stringify(normalized.features ?? [])}::jsonb,
        ${agentId}::uuid
      )
      RETURNING *
    `;

    const created = property[0];

    if (normalized.location) {
      await this.upsertLocation(created.id, normalized.location);
    }

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      action: 'property.created',
      resourceType: 'property',
      resourceId: created.id,
      payload: { title: created.title, propertyType: created.property_type },
      ipAddress,
      userAgent,
    });

    return created;
  }

  async findById(id: string): Promise<PropertyWithLocation> {
    const properties = await this.prisma.$queryRaw<PropertyRecord[]>`
      SELECT * FROM property.properties WHERE id = ${id}::uuid LIMIT 1
    `;

    if (!properties[0]) {
      throw new NotFoundException('Property not found');
    }

    const property = properties[0];
    const location = await this.getLocation(id);
    const media = await this.getMedia(id);

    return { ...property, location: location ?? null, media };
  }

  async update(
    id: string,
    actorId: string,
    actorRole: string,
    dto: UpdatePropertyDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PropertyRecord> {
    const normalized = this.normalizeUpdateDto(dto);

    const existing = await this.prisma.$queryRaw<PropertyRecord[]>`
      SELECT * FROM property.properties WHERE id = ${id}::uuid LIMIT 1
    `;

    if (!existing[0]) throw new NotFoundException('Property not found');

    // Agents may only edit their own listings; admins may edit any
    if (actorRole === 'agent' && existing[0].agent_id !== actorId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      status: 'status',
      price: 'price',
      currency: 'currency',
      areaSqm: 'area_sqm',
      bedrooms: 'bedrooms',
      bathrooms: 'bathrooms',
      parkingSpaces: 'parking_spaces',
    };

    for (const [dtoKey, colName] of Object.entries(fieldMap)) {
      const val = (normalized as Record<string, unknown>)[dtoKey];
      if (val !== undefined) {
        setClauses.push(`${colName} = $${idx++}`);
        values.push(val);
      }
    }

    if (normalized.features !== undefined) {
      setClauses.push(`features = $${idx++}::jsonb`);
      values.push(JSON.stringify(normalized.features));
    }

    if (setClauses.length === 0 && !normalized.location) {
      return existing[0];
    }

    let updated = existing[0];

    if (setClauses.length > 0) {
      values.push(id);
      const query = `
        UPDATE property.properties
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${idx}::uuid
        RETURNING *
      `;
      const rows = await this.prisma.$queryRawUnsafe<PropertyRecord[]>(
        query,
        ...values,
      );
      updated = rows[0];
    }

    if (normalized.location) {
      await this.upsertLocation(id, normalized.location);
    }

    await this.audit.log({
      actorId,
      actorRole,
      action: 'property.updated',
      resourceType: 'property',
      resourceId: id,
      payload: normalized as Record<string, unknown>,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async delete(
    id: string,
    actorId: string,
    actorRole: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const existing = await this.prisma.$queryRaw<PropertyRecord[]>`
      SELECT * FROM property.properties WHERE id = ${id}::uuid LIMIT 1
    `;

    if (!existing[0]) throw new NotFoundException('Property not found');

    if (actorRole === 'agent' && existing[0].agent_id !== actorId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.prisma.$executeRaw`
      DELETE FROM property.properties WHERE id = ${id}::uuid
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'property.deleted',
      resourceType: 'property',
      resourceId: id,
      ipAddress,
      userAgent,
    });
  }

  // ──────────────────────────────────────────────────────────
  // Search
  // ──────────────────────────────────────────────────────────

  async search(
    dto: SearchPropertiesDto,
  ): Promise<{ data: PropertyWithLocation[]; total: number; page: number; limit: number }> {
    const minPrice = dto.minPrice ?? dto.min_price;
    const maxPrice = dto.maxPrice ?? dto.max_price;
    const radiusKm = dto.radiusKm ?? dto.radius_km ?? DEFAULT_RADIUS_KM;
    const verificationStatus =
      dto.verificationStatus ?? dto.verification_status;

    const page = dto.page ?? 1;
    const limit = dto.limit ?? DEFAULT_PAGE_LIMIT;
    const offset = (page - 1) * limit;

    const conditions: string[] = ["p.status = 'active'"];
    const values: unknown[] = [];
    let idx = 1;

    if (dto.type) {
      conditions.push(`p.property_type = $${idx++}`);
      values.push(dto.type);
    }

    if (minPrice !== undefined) {
      conditions.push(`p.price >= $${idx++}`);
      values.push(minPrice);
    }

    if (maxPrice !== undefined) {
      conditions.push(`p.price <= $${idx++}`);
      values.push(maxPrice);
    }

    if (dto.currency) {
      conditions.push(`p.currency = $${idx++}`);
      values.push(dto.currency.toUpperCase());
    }

    if (dto.bedrooms !== undefined) {
      conditions.push(`p.bedrooms >= $${idx++}`);
      values.push(dto.bedrooms);
    }

    if (dto.bathrooms !== undefined) {
      conditions.push(`p.bathrooms >= $${idx++}`);
      values.push(dto.bathrooms);
    }

    if (verificationStatus) {
      conditions.push(`p.verification_status = $${idx++}`);
      values.push(verificationStatus);
    }

    if (dto.features) {
      const featureList = dto.features.split(',').map((f) => f.trim());
      for (const feat of featureList) {
        conditions.push(`p.features @> $${idx++}::jsonb`);
        values.push(JSON.stringify([feat]));
      }
    }

    // Geo-radius filter using PostGIS ST_DWithin
    const hasGeo = dto.lat !== undefined && dto.lng !== undefined;
    if (hasGeo) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM property.property_locations loc
          WHERE loc.property_id = p.id
            AND ST_DWithin(
              loc.geom,
              ST_SetSRID(ST_MakePoint($${idx++}, $${idx++}), 4326)::geography,
              $${idx++}
            )
        )
      `);
      values.push(dto.lng, dto.lat, radiusKm * 1000); // ST_DWithin expects meters
    } else if (dto.city) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM property.property_locations loc
          WHERE loc.property_id = p.id
            AND LOWER(loc.city) = LOWER($${idx++})
        )
      `);
      values.push(dto.city);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderMap: Record<string, string> = {
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
      newest: 'p.created_at DESC',
      relevance: 'p.created_at DESC',
    };
    const orderBy = orderMap[dto.sort ?? 'newest'];

    const countQuery = `SELECT COUNT(*) as total FROM property.properties p ${whereClause}`;
    const dataQuery = `
      SELECT p.* FROM property.properties p
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${idx++}
      OFFSET $${idx++}
    `;
    const dataValues = [...values, limit, offset];

    const [countRows, dataRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<[{ total: string }]>(countQuery, ...values),
      this.prisma.$queryRawUnsafe<PropertyRecord[]>(dataQuery, ...dataValues),
    ]);

    const total = parseInt(countRows[0]?.total ?? '0', 10);

    // Attach location + primary media for each property
    const enriched = await Promise.all(
      dataRows.map(async (p) => {
        const location = await this.getLocation(p.id);
        const media = await this.getMedia(p.id);
        return { ...p, location: location ?? null, media };
      }),
    );

    return { data: enriched, total, page, limit };
  }

  // ──────────────────────────────────────────────────────────
  // Agent dashboard stats
  // ──────────────────────────────────────────────────────────

  async getAgentDashboard(agentId: string): Promise<{
    totalListings: number;
    byStatus: Record<string, number>;
    newInquiries7d: number;
    verificationSummary: Record<string, number>;
  }> {
    const [listingRows, inquiryRows, verRows] = await Promise.all([
      this.prisma.$queryRaw<{ status: string; count: string }[]>`
        SELECT status, COUNT(*)::text as count
        FROM property.properties
        WHERE agent_id = ${agentId}::uuid
        GROUP BY status
      `,
      this.prisma.$queryRaw<[{ count: string }]>`
        SELECT COUNT(*)::text as count
        FROM property.inquiries i
        JOIN property.properties p ON i.property_id = p.id
        WHERE p.agent_id = ${agentId}::uuid
          AND i.created_at >= NOW() - INTERVAL '7 days'
      `,
      this.prisma.$queryRaw<{ verification_status: string; count: string }[]>`
        SELECT verification_status, COUNT(*)::text as count
        FROM property.properties
        WHERE agent_id = ${agentId}::uuid
        GROUP BY verification_status
      `,
    ]);

    const byStatus: Record<string, number> = {};
    let totalListings = 0;
    for (const row of listingRows) {
      const c = parseInt(row.count, 10);
      byStatus[row.status] = c;
      totalListings += c;
    }

    const verificationSummary: Record<string, number> = {};
    for (const row of verRows) {
      verificationSummary[row.verification_status] = parseInt(row.count, 10);
    }

    return {
      totalListings,
      byStatus,
      newInquiries7d: parseInt(inquiryRows[0]?.count ?? '0', 10),
      verificationSummary,
    };
  }

  // ──────────────────────────────────────────────────────────
  // Media
  // ──────────────────────────────────────────────────────────

  async addMedia(
    propertyId: string,
    agentId: string,
    agentRole: string,
    file: Express.Multer.File,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; url: string; mediaType: string }> {
    await this.assertAgentOwns(propertyId, agentId, agentRole);

    // Check media count limit
    const count = await this.prisma.$queryRaw<[{ count: string }]>`
      SELECT COUNT(*)::text as count FROM property.property_media
      WHERE property_id = ${propertyId}::uuid
    `;
    if (parseInt(count[0].count, 10) >= MAX_MEDIA_PER_PROPERTY) {
      throw new BadRequestException(
        `Maximum ${MAX_MEDIA_PER_PROPERTY} media files per property`,
      );
    }

    const { signedUrl, mediaType } = await this.mediaStorage.uploadPropertyMedia({
      propertyId,
      agentId,
      file,
    });

    const isFirst = parseInt(count[0].count, 10) === 0;

    const result = await this.prisma.$queryRaw<{ id: string; url: string; media_type: string }[]>`
      INSERT INTO property.property_media (property_id, media_type, url, is_primary)
      VALUES (${propertyId}::uuid, ${mediaType}, ${signedUrl}, ${isFirst})
      RETURNING id, url, media_type
    `;

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      action: 'property.media.added',
      resourceType: 'property',
      resourceId: propertyId,
      payload: { mediaType },
      ipAddress,
      userAgent,
    });

    return { id: result[0].id, url: result[0].url, mediaType };
  }

  async deleteMedia(
    propertyId: string,
    mediaId: string,
    agentId: string,
    agentRole: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.assertAgentOwns(propertyId, agentId, agentRole);

    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM property.property_media
      WHERE id = ${mediaId}::uuid AND property_id = ${propertyId}::uuid
    `;
    if (!rows[0]) throw new NotFoundException('Media not found');

    await this.prisma.$executeRaw`
      DELETE FROM property.property_media WHERE id = ${mediaId}::uuid
    `;

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      action: 'property.media.deleted',
      resourceType: 'property',
      resourceId: propertyId,
      payload: { mediaId },
      ipAddress,
      userAgent,
    });
  }

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  private async upsertLocation(
    propertyId: string,
    loc: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      region?: string;
      country: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<void> {
    // Build geom from lat/lng when both are provided
    if (loc.latitude !== undefined && loc.longitude !== undefined) {
      await this.prisma.$executeRaw`
        INSERT INTO property.property_locations
          (property_id, address_line1, address_line2, city, region, country, postal_code, latitude, longitude, geom)
        VALUES (
          ${propertyId}::uuid,
          ${loc.addressLine1 ?? null},
          ${loc.addressLine2 ?? null},
          ${loc.city ?? null},
          ${loc.region ?? null},
          ${loc.country},
          ${loc.postalCode ?? null},
          ${loc.latitude},
          ${loc.longitude},
          ST_SetSRID(ST_MakePoint(${loc.longitude}, ${loc.latitude}), 4326)
        )
        ON CONFLICT (property_id) DO UPDATE SET
          address_line1 = EXCLUDED.address_line1,
          address_line2 = EXCLUDED.address_line2,
          city = EXCLUDED.city,
          region = EXCLUDED.region,
          country = EXCLUDED.country,
          postal_code = EXCLUDED.postal_code,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          geom = EXCLUDED.geom
      `;
    } else {
      await this.prisma.$executeRaw`
        INSERT INTO property.property_locations
          (property_id, address_line1, address_line2, city, region, country, postal_code)
        VALUES (
          ${propertyId}::uuid,
          ${loc.addressLine1 ?? null},
          ${loc.addressLine2 ?? null},
          ${loc.city ?? null},
          ${loc.region ?? null},
          ${loc.country},
          ${loc.postalCode ?? null}
        )
        ON CONFLICT (property_id) DO UPDATE SET
          address_line1 = EXCLUDED.address_line1,
          address_line2 = EXCLUDED.address_line2,
          city = EXCLUDED.city,
          region = EXCLUDED.region,
          country = EXCLUDED.country,
          postal_code = EXCLUDED.postal_code
      `;
    }
  }

  private normalizeCreateDto(dto: CreatePropertyDto): CreatePropertyDto {
    return {
      ...dto,
      propertyType: dto.propertyType ?? dto.property_type,
      areaSqm: dto.areaSqm ?? dto.area_sqm,
      parkingSpaces: dto.parkingSpaces ?? dto.parking_spaces,
      location: this.normalizeLocation(dto.location),
    };
  }

  private normalizeUpdateDto(dto: UpdatePropertyDto): UpdatePropertyDto {
    return {
      ...dto,
      areaSqm: dto.areaSqm ?? dto.area_sqm,
      parkingSpaces: dto.parkingSpaces ?? dto.parking_spaces,
      location: this.normalizeLocation(dto.location),
    };
  }

  private normalizeLocation(
    location: CreatePropertyDto['location'] | UpdatePropertyDto['location'],
  ) {
    if (!location) return location;

    return {
      ...location,
      addressLine1: location.addressLine1 ?? location.address_line1,
      addressLine2: location.addressLine2 ?? location.address_line2,
      postalCode: location.postalCode ?? location.postal_code,
    };
  }

  private async getLocation(propertyId: string) {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        address_line1: string | null;
        city: string | null;
        region: string | null;
        country: string;
        postal_code: string | null;
        latitude: string | null;
        longitude: string | null;
      }[]
    >`
      SELECT id, address_line1, city, region, country, postal_code, latitude, longitude
      FROM property.property_locations
      WHERE property_id = ${propertyId}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  private async getMedia(propertyId: string) {
    return this.prisma.$queryRaw<
      {
        id: string;
        media_type: string;
        url: string;
        thumbnail_url: string | null;
        display_order: number;
        is_primary: boolean;
      }[]
    >`
      SELECT id, media_type, url, thumbnail_url, display_order, is_primary
      FROM property.property_media
      WHERE property_id = ${propertyId}::uuid
      ORDER BY display_order ASC, created_at ASC
    `;
  }

  private async assertAgentOwns(
    propertyId: string,
    agentId: string,
    agentRole: string,
  ): Promise<void> {
    const rows = await this.prisma.$queryRaw<{ agent_id: string }[]>`
      SELECT agent_id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException('Property not found');
    if (agentRole !== 'admin' && rows[0].agent_id !== agentId) {
      throw new ForbiddenException('You can only manage your own listings');
    }
  }
}
