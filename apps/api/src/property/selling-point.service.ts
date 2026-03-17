import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';

export interface SellingPointRow {
  id: string;
  property_id: string;
  created_by: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  tags: string[];
  show_in_listing: boolean;
  show_in_flyer: boolean;
  show_on_website: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSellingPointParams {
  propertyId: string;
  createdBy: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  tags: string[];
  showInListing: boolean;
  showInFlyer: boolean;
  showOnWebsite: boolean;
}

export interface UpdateSellingPointParams {
  title?: string;
  description?: string;
  priority?: string;
  category?: string;
  tags?: string[];
  showInListing?: boolean;
  showInFlyer?: boolean;
  showOnWebsite?: boolean;
}

@Injectable()
export class SellingPointService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(propertyId: string, userId: string): Promise<void> {
    const rows = await this.prisma.$queryRaw<
      { agent_id: string | null; owner_id: string | null }[]
    >`
      SELECT agent_id, owner_id FROM property.properties
      WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!rows.length) {
      throw new NotFoundException('Property not found');
    }
    const { agent_id, owner_id } = rows[0];
    if (agent_id !== userId && owner_id !== userId) {
      throw new ForbiddenException('You do not have access to this property');
    }
  }

  async create(params: CreateSellingPointParams): Promise<SellingPointRow> {
    await this.assertAccess(params.propertyId, params.createdBy);

    const tagsJson = JSON.stringify(params.tags);

    const rows = await this.prisma.$queryRaw<SellingPointRow[]>`
      INSERT INTO property.selling_points (
        property_id, created_by, title, description, priority, category,
        tags, show_in_listing, show_in_flyer, show_on_website
      ) VALUES (
        ${params.propertyId}::uuid,
        ${params.createdBy}::uuid,
        ${params.title},
        ${params.description},
        ${params.priority},
        ${params.category},
        ${tagsJson}::jsonb,
        ${params.showInListing},
        ${params.showInFlyer},
        ${params.showOnWebsite}
      )
      RETURNING *
    `;
    return rows[0];
  }

  async list(propertyId: string, userId: string): Promise<SellingPointRow[]> {
    await this.assertAccess(propertyId, userId);

    return this.prisma.$queryRaw<SellingPointRow[]>`
      SELECT * FROM property.selling_points
      WHERE property_id = ${propertyId}::uuid
      ORDER BY
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        created_at DESC
    `;
  }

  async update(
    id: string,
    userId: string,
    params: UpdateSellingPointParams,
  ): Promise<SellingPointRow> {
    const existing = await this.prisma.$queryRaw<SellingPointRow[]>`
      SELECT * FROM property.selling_points WHERE id = ${id}::uuid LIMIT 1
    `;
    if (!existing.length) {
      throw new NotFoundException('Selling point not found');
    }
    await this.assertAccess(existing[0].property_id, userId);

    const tagsJson =
      params.tags !== undefined ? JSON.stringify(params.tags) : undefined;

    const rows = await this.prisma.$queryRaw<SellingPointRow[]>`
      UPDATE property.selling_points SET
        title            = COALESCE(${params.title ?? null}, title),
        description      = COALESCE(${params.description ?? null}, description),
        priority         = COALESCE(${params.priority ?? null}, priority),
        category         = COALESCE(${params.category ?? null}, category),
        tags             = COALESCE(${tagsJson ?? null}::jsonb, tags),
        show_in_listing  = COALESCE(${params.showInListing ?? null}, show_in_listing),
        show_in_flyer    = COALESCE(${params.showInFlyer ?? null}, show_in_flyer),
        show_on_website  = COALESCE(${params.showOnWebsite ?? null}, show_on_website),
        updated_at       = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `;
    return rows[0];
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.$queryRaw<SellingPointRow[]>`
      SELECT * FROM property.selling_points WHERE id = ${id}::uuid LIMIT 1
    `;
    if (!existing.length) {
      throw new NotFoundException('Selling point not found');
    }
    await this.assertAccess(existing[0].property_id, userId);

    await this.prisma.$queryRaw`
      DELETE FROM property.selling_points WHERE id = ${id}::uuid
    `;
  }
}
