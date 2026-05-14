import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';

@Injectable()
export class SellerDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
  ) {}

  /** All properties owned / listed by this seller */
  async getSellerProperties(userId: string) {
    return this.prisma.$queryRaw<unknown[]>`
      SELECT
        p.id, p.title, p.price, p.currency, p.status, p.listing_type,
        p.property_type, p.verification_status, p.floor_area_sqm, p.area_sqm,
        p.bedrooms, p.bathrooms, p.created_at, p.listing_reference,
        pl.city, pl.region AS suburb,
        (SELECT pm.url FROM property.property_media pm
         WHERE pm.property_id = p.id AND pm.is_primary = TRUE LIMIT 1) AS media_url,
        (SELECT COUNT(*)::int FROM property.viewings v
         WHERE v.property_id = p.id AND v.status = 'completed') AS completed_viewings,
        (SELECT COUNT(*)::int FROM property.viewings v
         WHERE v.property_id = p.id AND v.status = 'confirmed') AS upcoming_viewings,
        (SELECT COUNT(*)::int FROM property.inquiries i
         WHERE i.property_id = p.id) AS total_inquiries,
        (SELECT COUNT(*)::int FROM property.saved_properties s
         WHERE s.property_id = p.id) AS save_count,
        m.mandate_type, m.status AS mandate_status, m.end_date AS mandate_expiry,
        au.first_name AS agent_first_name, au.last_name AS agent_last_name
      FROM property.properties p
      LEFT JOIN property.property_locations pl ON pl.property_id = p.id
      LEFT JOIN property.mandates m
        ON m.property_id = p.id AND m.status = 'active'
      LEFT JOIN identity.users au ON au.id = m.agent_id
      WHERE p.owner_id = ${userId}
      ORDER BY p.created_at DESC
    `;
  }

  /** Activity timeline for a specific property owned by this seller */
  async getSellerPropertyActivity(userId: string, propertyId: string) {
    const props = await this.prisma.$queryRaw<{id: string}[]>`
      SELECT id FROM property.properties WHERE id = ${propertyId}::uuid AND owner_id = ${userId}
    `;
    if (!props.length) {
      throw new NotFoundException('Property not found or not owned by you');
    }

    return this.prisma.$queryRaw<unknown[]>`
      SELECT action, payload, created_at, actor_id
      FROM property.audit_logs
      WHERE resource_id = ${propertyId}::uuid
      ORDER BY created_at DESC
      LIMIT 100
    `;
  }

  /** Viewings booked for a property owned by this seller */
  async getSellerPropertyViewings(userId: string, propertyId: string) {
    const props = await this.prisma.$queryRaw<{id: string}[]>`
      SELECT id FROM property.properties WHERE id = ${propertyId}::uuid AND owner_id = ${userId}
    `;
    if (!props.length) {
      throw new NotFoundException('Property not found or not owned by you');
    }

    return this.prisma.$queryRaw<unknown[]>`
      SELECT
        v.id, v.scheduled_at, v.status, v.buyer_feedback,
        v.viewing_type, v.duration_minutes,
        bu.first_name AS buyer_first_name, bu.last_name AS buyer_last_name,
        au.first_name AS agent_first_name, au.last_name AS agent_last_name
      FROM property.viewings v
      LEFT JOIN identity.users bu ON bu.id = v.buyer_id
      LEFT JOIN identity.users au ON au.id = v.agent_id
      WHERE v.property_id = ${propertyId}::uuid
      ORDER BY v.scheduled_at DESC
    `;
  }

  /** Offers / sales-stage progress for a property owned by this seller */
  async getSellerPropertyOffers(userId: string, propertyId: string) {
    const props = await this.prisma.$queryRaw<{id: string}[]>`
      SELECT id FROM property.properties WHERE id = ${propertyId}::uuid AND owner_id = ${userId}
    `;
    if (!props.length) {
      throw new NotFoundException('Property not found or not owned by you');
    }

    return this.prisma.$queryRaw<unknown[]>`
      SELECT
        t.id, t.stage_number, t.stage_name, t.status, t.notes,
        t.completed_at, t.created_at,
        u.first_name AS buyer_first_name, u.last_name AS buyer_last_name
      FROM sales.transaction_stages t
      LEFT JOIN identity.users u ON u.id = t.buyer_id
      WHERE t.property_id = ${propertyId}::uuid
      ORDER BY t.stage_number ASC
    `;
  }
}
