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
  listing_type: string | null;
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
  /** Company the listing was created under. */
  company_id: string | null;
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

export type FeaturedAgent = {
  id: string;
  fullName: string;
  location: string;
  tier: 'gold' | 'silver' | 'bronze';
  deals: number;
};

export type AgentProfileListing = {
  id: string;
  title: string;
  location: string;
  price: string;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: string | null;
  status: string;
  verification_status: string;
  created_at: Date;
  media_url: string | null;
};

export type AgentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  totalListings: number;
  activeListings: number;
  verifiedListings: number;
  primaryCity: string;
  /** Slug of the agent's primary non-system company, or null when they only belong to "Self". */
  primaryCompanySlug: string | null;
  createdAt: Date | null;
  listings: AgentProfileListing[];
};

export type AgentReviewRow = {
  id: string;
  reviewerName: string | null;
  reviewerEmail: string | null;
  rating: number;
  comment: string | null;
  propertyType: string | null;
  propertyId: string | null;
  createdAt: Date;
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
    companyId?: string | null,
  ): Promise<PropertyRecord> {
    const normalized = this.normalizeCreateDto(dto);

    const property = await this.prisma.$queryRaw<PropertyRecord[]>`
      INSERT INTO property.properties (
        title, description, property_type, listing_type, price, currency,
        area_sqm, bedrooms, bathrooms, parking_spaces, features, agent_id, owner_id, company_id
      ) VALUES (
        ${normalized.title},
        ${normalized.description ?? null},
        ${normalized.propertyType},
        ${normalized.listingType ?? null},
        ${normalized.price},
        ${normalized.currency ?? 'USD'},
        ${normalized.areaSqm ?? null},
        ${normalized.bedrooms ?? null},
        ${normalized.bathrooms ?? null},
        ${normalized.parkingSpaces ?? null},
        ${JSON.stringify(normalized.features ?? [])}::jsonb,
        ${agentId}::uuid,
        ${agentId}::uuid,
        ${companyId ?? null}::uuid
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
      companyId,
      action: 'property.created',
      resourceType: 'property',
      resourceId: created.id,
      payload: { title: created.title, propertyType: created.property_type },
      ipAddress,
      userAgent,
    });

    return created;
  }

  async findById(
    id: string,
    viewContext?: {
      actorId?: string;
      actorRole?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<PropertyWithLocation> {
    const properties = await this.prisma.$queryRaw<PropertyRecord[]>`
      SELECT * FROM property.properties WHERE id = ${id}::uuid LIMIT 1
    `;

    if (!properties[0]) {
      throw new NotFoundException('Property not found');
    }

    const property = properties[0];
    const location = await this.getLocation(id);
    const media = await this.getMedia(id);

    try {
      await this.audit.log({
        actorId: viewContext?.actorId,
        actorRole: viewContext?.actorRole ?? 'public',
        action: 'property.viewed',
        resourceType: 'property',
        resourceId: id,
        ipAddress: viewContext?.ipAddress,
        userAgent: viewContext?.userAgent,
      });
    } catch {
      // View tracking should not block property reads.
    }

    return { ...property, location: location ?? null, media };
  }

  async update(
    id: string,
    actorId: string,
    actorRole: string,
    dto: UpdatePropertyDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<PropertyRecord> {
    const normalized = this.normalizeUpdateDto(dto);

    const existing = await this.prisma.$queryRaw<PropertyRecord[]>`
      SELECT * FROM property.properties WHERE id = ${id}::uuid LIMIT 1
    `;

    if (!existing[0]) throw new NotFoundException('Property not found');

    // Any non-admin may only edit their own listings
    if (actorRole !== 'admin' && existing[0].agent_id !== actorId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      status: 'status',
      propertyType: 'property_type',
      listingType: 'listing_type',
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
      companyId,
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
    companyId?: string | null,
  ): Promise<void> {
    const existing = await this.prisma.$queryRaw<PropertyRecord[]>`
      SELECT * FROM property.properties WHERE id = ${id}::uuid LIMIT 1
    `;

    if (!existing[0]) throw new NotFoundException('Property not found');

    if (actorRole !== 'admin' && existing[0].agent_id !== actorId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.prisma.$executeRaw`
      DELETE FROM property.properties WHERE id = ${id}::uuid
    `;

    await this.audit.log({
      actorId,
      actorRole,
      companyId,
      action: 'property.deleted',
      resourceType: 'property',
      resourceId: id,
      ipAddress,
      userAgent,
    });
  }

  // ──────────────────────────────────────────────────────────
  // Agent: own listings (all statuses, including drafts)
  // ──────────────────────────────────────────────────────────

  async getMyListings(
    agentId: string,
    status?: string,
  ): Promise<{ data: PropertyWithLocation[]; total: number }> {
    const hasStatusFilter = !!status && status !== 'all';
    const values: unknown[] = hasStatusFilter ? [agentId, status] : [agentId];

    const whereClause = hasStatusFilter
      ? 'WHERE p.agent_id = $1::uuid AND p.status = $2'
      : 'WHERE p.agent_id = $1::uuid';

    const countQuery = `SELECT COUNT(*) as total FROM property.properties p ${whereClause}`;
    const dataQuery = `
      SELECT p.* FROM property.properties p
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    const [countRows, dataRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<[{ total: string }]>(countQuery, ...values),
      this.prisma.$queryRawUnsafe<PropertyRecord[]>(dataQuery, ...values),
    ]);

    const total = parseInt(countRows[0]?.total ?? '0', 10);

    const enriched = await Promise.all(
      dataRows.map(async (p) => {
        const location = await this.getLocation(p.id);
        const media = await this.getMedia(p.id);
        return { ...p, location: location ?? null, media };
      }),
    );

    return { data: enriched, total };
  }

  // ──────────────────────────────────────────────────────────
  // Buyer/Seller: own listings by owner_id (all statuses)
  // ──────────────────────────────────────────────────────────

  async getOwnerListings(
    userId: string,
    status?: string,
  ): Promise<{ data: PropertyWithLocation[]; total: number }> {
    const hasStatusFilter = !!status && status !== 'all';
    const values: unknown[] = hasStatusFilter ? [userId, status] : [userId];

    const whereClause = hasStatusFilter
      ? 'WHERE (p.owner_id = $1::uuid OR p.agent_id = $1::uuid) AND p.status = $2'
      : 'WHERE (p.owner_id = $1::uuid OR p.agent_id = $1::uuid)';

    const countQuery = `SELECT COUNT(*) as total FROM property.properties p ${whereClause}`;
    const dataQuery = `
      SELECT DISTINCT p.* FROM property.properties p
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    const [countRows, dataRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<[{ total: string }]>(countQuery, ...values),
      this.prisma.$queryRawUnsafe<PropertyRecord[]>(dataQuery, ...values),
    ]);

    const total = parseInt(countRows[0]?.total ?? '0', 10);

    const enriched = await Promise.all(
      dataRows.map(async (p) => {
        const location = await this.getLocation(p.id);
        const media = await this.getMedia(p.id);
        return { ...p, location: location ?? null, media };
      }),
    );

    return { data: enriched, total };
  }

  // ──────────────────────────────────────────────────────────
  // Search
  // ──────────────────────────────────────────────────────────

  async search(
    dto: SearchPropertiesDto,
  ): Promise<{ data: PropertyWithLocation[]; total: number; page: number; limit: number }> {
    const agentId = dto.agentId ?? dto.agent_id;
    const minPrice = dto.minPrice ?? dto.min_price;
    const maxPrice = dto.maxPrice ?? dto.max_price;
    const radiusKm = dto.radiusKm ?? dto.radius_km ?? DEFAULT_RADIUS_KM;
    const verificationStatus =
      dto.verificationStatus ?? dto.verification_status;

    const page = dto.page ?? 1;
    const limit = dto.limit ?? DEFAULT_PAGE_LIMIT;
    const offset = (page - 1) * limit;

    const conditions: string[] = [
      "p.status IN ('active', 'under_offer', 'sold')",
    ];
    const values: unknown[] = [];
    let idx = 1;

    if (dto.type) {
      conditions.push(`p.property_type = $${idx++}`);
      values.push(dto.type);
    }

    if (agentId) {
      conditions.push(`p.agent_id = $${idx++}::uuid`);
      values.push(agentId);
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
    listingViewsLast7d: number;
    listingViewsPrevious7d: number;
    listingViewsTrendPct: number;
    inquiryResponseRatePct: number;
  }> {
    const [listingRows, inquiryRows, verRows, viewRows, responseRows] = await Promise.all([
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
      this.prisma.$queryRaw<[{ current_views: string; previous_views: string }]>`
        SELECT
          COUNT(*) FILTER (WHERE al.created_at >= NOW() - INTERVAL '7 days')::text AS current_views,
          COUNT(*) FILTER (
            WHERE al.created_at < NOW() - INTERVAL '7 days'
              AND al.created_at >= NOW() - INTERVAL '14 days'
          )::text AS previous_views
        FROM property.audit_logs al
        JOIN property.properties p ON p.id = al.resource_id
        WHERE al.action = 'property.viewed'
          AND al.resource_type = 'property'
          AND p.agent_id = ${agentId}::uuid
      `,
      this.prisma.$queryRaw<[{ total_inquiries: string; responded_inquiries: string }]>`
        SELECT
          COUNT(*)::text AS total_inquiries,
          COUNT(*) FILTER (
            WHERE i.status IN ('responded', 'closed') OR i.responded_at IS NOT NULL
          )::text AS responded_inquiries
        FROM property.inquiries i
        JOIN property.properties p ON p.id = i.property_id
        WHERE p.agent_id = ${agentId}::uuid
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

    const currentViews = parseInt(viewRows[0]?.current_views ?? '0', 10);
    const previousViews = parseInt(viewRows[0]?.previous_views ?? '0', 10);
    const listingViewsTrendPct =
      previousViews > 0
        ? Math.round(((currentViews - previousViews) / previousViews) * 100)
        : currentViews > 0
          ? 100
          : 0;

    const totalInquiries = parseInt(responseRows[0]?.total_inquiries ?? '0', 10);
    const respondedInquiries = parseInt(responseRows[0]?.responded_inquiries ?? '0', 10);
    const inquiryResponseRatePct =
      totalInquiries > 0
        ? Math.round((respondedInquiries / totalInquiries) * 100)
        : 0;

    return {
      totalListings,
      byStatus,
      newInquiries7d: parseInt(inquiryRows[0]?.count ?? '0', 10),
      verificationSummary,
      listingViewsLast7d: currentViews,
      listingViewsPrevious7d: previousViews,
      listingViewsTrendPct,
      inquiryResponseRatePct,
    };
  }

  async getFeaturedAgents(limit = 8): Promise<FeaturedAgent[]> {
    const rows = await this.prisma.$queryRawUnsafe<
      {
        id: string;
        first_name: string;
        last_name: string;
        city: string | null;
        active_listings: string;
        verified_listings: string;
      }[]
    >(
      `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        MAX(loc.city) AS city,
        COUNT(*)::text AS active_listings,
        COUNT(*) FILTER (WHERE p.verification_status = 'verified')::text AS verified_listings
      FROM property.properties p
      JOIN identity.users u ON u.id = p.agent_id
      LEFT JOIN property.property_locations loc ON loc.property_id = p.id
      WHERE p.status = 'active' AND p.agent_id IS NOT NULL
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY COUNT(*) FILTER (WHERE p.verification_status = 'verified') DESC, COUNT(*) DESC
      LIMIT $1
      `,
      limit,
    );

    return rows.map((row) => {
      const verifiedListings = parseInt(row.verified_listings, 10) || 0;
      const activeListings = parseInt(row.active_listings, 10) || 0;
      const tier: FeaturedAgent['tier'] =
        verifiedListings >= 10 ? 'gold' : verifiedListings >= 5 ? 'silver' : 'bronze';

      return {
        id: row.id,
        fullName: `${row.first_name} ${row.last_name}`.trim(),
        location: row.city ?? 'Location unavailable',
        tier,
        deals: activeListings,
      };
    });
  }

  async getAgentProfile(agentId: string): Promise<AgentProfile> {
    const profileRows = await this.prisma.$queryRawUnsafe<
      {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
        avatar_url: string | null;
        status: string;
        created_at: Date | null;
        total_listings: string;
        active_listings: string;
        verified_listings: string;
        primary_city: string | null;
        primary_company_slug: string | null;
      }[]
    >(
      `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.avatar_url,
        u.status,
        u.created_at,
        COUNT(p.id)::text AS total_listings,
        COUNT(*) FILTER (WHERE p.status = 'active')::text AS active_listings,
        COUNT(*) FILTER (WHERE p.verification_status = 'verified')::text AS verified_listings,
        MAX(loc.city) AS primary_city,
        (
          SELECT c.slug
          FROM identity.company_members cm
          JOIN identity.companies c ON c.id = cm.company_id
          WHERE cm.user_id = u.id
            AND c.is_system = false
            AND cm.status = 'active'
          ORDER BY c.name
          LIMIT 1
        ) AS primary_company_slug
      FROM identity.users u
      LEFT JOIN property.properties p ON p.agent_id = u.id
      LEFT JOIN property.property_locations loc ON loc.property_id = p.id
      WHERE u.id = $1::uuid
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.status, u.created_at
      LIMIT 1
      `,
      agentId,
    );

    if (!profileRows[0]) {
      throw new NotFoundException('Agent not found');
    }

    const listings = await this.prisma.$queryRawUnsafe<
      {
        id: string;
        title: string;
        city: string | null;
        region: string | null;
        price: string;
        currency: string;
        bedrooms: number | null;
        bathrooms: number | null;
        area_sqm: string | null;
        status: string;
        verification_status: string;
        created_at: Date;
        media_url: string | null;
      }[]
    >(
      `
      SELECT
        p.id,
        p.title,
        loc.city,
        loc.region,
        p.price::text,
        p.currency,
        p.bedrooms,
        p.bathrooms,
        p.area_sqm::text,
        p.status,
        p.verification_status,
        p.created_at,
        (
          SELECT pm.url
          FROM property.property_media pm
          WHERE pm.property_id = p.id
          ORDER BY pm.is_primary DESC, pm.display_order ASC, pm.created_at ASC
          LIMIT 1
        ) AS media_url
      FROM property.properties p
      LEFT JOIN property.property_locations loc ON loc.property_id = p.id
      WHERE p.agent_id = $1::uuid
      ORDER BY p.created_at DESC
      LIMIT 12
      `,
      agentId,
    );

    const profile = profileRows[0];

    return {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      status: profile.status,
      totalListings: parseInt(profile.total_listings, 10) || 0,
      activeListings: parseInt(profile.active_listings, 10) || 0,
      verifiedListings: parseInt(profile.verified_listings, 10) || 0,
      primaryCity: profile.primary_city ?? 'Location unavailable',
      primaryCompanySlug: profile.primary_company_slug ?? null,
      createdAt: profile.created_at ?? null,
      listings: listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        location: [listing.city, listing.region].filter(Boolean).join(', ') || 'Location unavailable',
        price: listing.price,
        currency: listing.currency,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        area_sqm: listing.area_sqm,
        status: listing.status,
        verification_status: listing.verification_status,
        created_at: listing.created_at,
        media_url: listing.media_url,
      })),
    };
  }

  // ──────────────────────────────────────────────────────────
  // Agent Reviews
  // ──────────────────────────────────────────────────────────

  async getAgentReviews(
    agentId: string,
    limit = 10,
    offset = 0,
  ): Promise<{ reviews: AgentReviewRow[]; total: number; averageRating: number }> {
    const agent = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM identity.users WHERE id = ${agentId}::uuid LIMIT 1
    `;
    if (!agent[0]) throw new NotFoundException('Agent not found');

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<AgentReviewRow[]>`
        SELECT
          id,
          reviewer_name  AS "reviewerName",
          reviewer_email AS "reviewerEmail",
          rating,
          comment,
          property_type  AS "propertyType",
          property_id    AS "propertyId",
          created_at     AS "createdAt"
        FROM property.agent_reviews
        WHERE agent_id = ${agentId}::uuid
          AND status = 'published'
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<{ total: string; avg_rating: string }[]>`
        SELECT
          COUNT(*)::text                               AS total,
          COALESCE(AVG(rating), 0)::text              AS avg_rating
        FROM property.agent_reviews
        WHERE agent_id = ${agentId}::uuid
          AND status = 'published'
      `,
    ]);

    return {
      reviews: rows,
      total: parseInt(countRows[0]?.total ?? '0', 10),
      averageRating:
        Math.round(parseFloat(countRows[0]?.avg_rating ?? '0') * 10) / 10,
    };
  }

  // ──────────────────────────────────────────────────────────
  // Agent Contact & Schedule Call
  // ──────────────────────────────────────────────────────────

  async contactAgent(
    agentId: string,
    dto: {
      message?: string;
      requesterName?: string;
      requesterEmail?: string;
      requesterPhone?: string;
    },
    requesterId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: string; createdAt: Date }> {
    // Verify the agent exists
    const agent = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM identity.users WHERE id = ${agentId}::uuid LIMIT 1
    `;
    if (!agent[0]) throw new NotFoundException('Agent not found');

    const rows = await this.prisma.$queryRaw<{ id: string; status: string; created_at: Date }[]>`
      INSERT INTO property.agent_contacts
        (agent_id, requester_id, contact_type, message, requester_name, requester_email, requester_phone, ip_address, user_agent)
      VALUES (
        ${agentId}::uuid,
        ${requesterId ? requesterId : null}::uuid,
        'contact',
        ${dto.message ?? null},
        ${dto.requesterName ?? null},
        ${dto.requesterEmail ?? null},
        ${dto.requesterPhone ?? null},
        ${ipAddress ?? null}::inet,
        ${userAgent ?? null}
      )
      RETURNING id, status, created_at
    `;

    await this.audit.log({
      actorId: requesterId,
      actorRole: requesterId ? 'authenticated' : 'public',
      action: 'agent.contact.requested',
      resourceType: 'agent',
      resourceId: agentId,
      payload: { contactType: 'contact', hasMessage: Boolean(dto.message) },
      ipAddress,
      userAgent,
    });

    return { id: rows[0].id, status: rows[0].status, createdAt: rows[0].created_at };
  }

  async scheduleAgentCall(
    agentId: string,
    dto: {
      preferredDate: string;
      message?: string;
      requesterName?: string;
      requesterEmail?: string;
      requesterPhone?: string;
    },
    requesterId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: string; createdAt: Date }> {
    // Verify the agent exists
    const agent = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM identity.users WHERE id = ${agentId}::uuid LIMIT 1
    `;
    if (!agent[0]) throw new NotFoundException('Agent not found');

    const preferredDateTs = new Date(dto.preferredDate);
    if (Number.isNaN(preferredDateTs.getTime())) {
      throw new BadRequestException('Invalid preferredDate – must be an ISO date-time string');
    }

    const rows = await this.prisma.$queryRaw<{ id: string; status: string; created_at: Date }[]>`
      INSERT INTO property.agent_contacts
        (agent_id, requester_id, contact_type, message, requester_name, requester_email, requester_phone, preferred_date, ip_address, user_agent)
      VALUES (
        ${agentId}::uuid,
        ${requesterId ? requesterId : null}::uuid,
        'schedule_call',
        ${dto.message ?? null},
        ${dto.requesterName ?? null},
        ${dto.requesterEmail ?? null},
        ${dto.requesterPhone ?? null},
        ${preferredDateTs}::timestamptz,
        ${ipAddress ?? null}::inet,
        ${userAgent ?? null}
      )
      RETURNING id, status, created_at
    `;

    await this.audit.log({
      actorId: requesterId,
      actorRole: requesterId ? 'authenticated' : 'public',
      action: 'agent.call.scheduled',
      resourceType: 'agent',
      resourceId: agentId,
      payload: { contactType: 'schedule_call', preferredDate: dto.preferredDate },
      ipAddress,
      userAgent,
    });

    return { id: rows[0].id, status: rows[0].status, createdAt: rows[0].created_at };
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
    companyId?: string | null,
  ): Promise<{ id: string; url: string; mediaType: string }> {
    const items = await this.addMediaBatch(
      propertyId,
      agentId,
      agentRole,
      [file],
      ipAddress,
      userAgent,
      companyId,
    );

    return items[0];
  }

  async addMediaBatch(
    propertyId: string,
    agentId: string,
    agentRole: string,
    files: Express.Multer.File[],
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<Array<{ id: string; url: string; mediaType: string }>> {
    if (!files.length) {
      throw new BadRequestException('At least one media file is required');
    }

    await this.assertAgentOwns(propertyId, agentId, agentRole);

    const countRows = await this.prisma.$queryRaw<[{ count: string }]>`
      SELECT COUNT(*)::text as count FROM property.property_media
      WHERE property_id = ${propertyId}::uuid
    `;

    const existingCount = parseInt(countRows[0].count, 10);
    if (existingCount + files.length > MAX_MEDIA_PER_PROPERTY) {
      throw new BadRequestException(
        `Maximum ${MAX_MEDIA_PER_PROPERTY} media files per property`,
      );
    }

    const uploadedItems: Array<{ id: string; url: string; mediaType: string }> = [];
    const uploadedTypes: string[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const sourceFile = files[index];
      const { signedUrl, mediaType } = await this.mediaStorage.uploadPropertyMedia({
        propertyId,
        agentId,
        file: sourceFile,
      });

      const isPrimary = existingCount === 0 && index === 0;
      const result = await this.prisma.$queryRaw<
        { id: string; url: string; media_type: string }[]
      >`
        INSERT INTO property.property_media (property_id, media_type, url, is_primary)
        VALUES (${propertyId}::uuid, ${mediaType}, ${signedUrl}, ${isPrimary})
        RETURNING id, url, media_type
      `;

      uploadedItems.push({
        id: result[0].id,
        url: result[0].url,
        mediaType,
      });
      uploadedTypes.push(mediaType);
    }

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      companyId,
      action: uploadedItems.length === 1 ? 'property.media.added' : 'property.media.added_batch',
      resourceType: 'property',
      resourceId: propertyId,
      payload: { count: uploadedItems.length, mediaTypes: uploadedTypes },
      ipAddress,
      userAgent,
    });

    return uploadedItems;
  }

  async deleteMedia(
    propertyId: string,
    mediaId: string,
    agentId: string,
    agentRole: string,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
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
      companyId,
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
      propertyType: dto.propertyType ?? dto.property_type,
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
