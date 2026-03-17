import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';

export interface NoteRow {
  id: string;
  property_id: string;
  created_by: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  visibility: string;
  tags: string[];
  reminder: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteParams {
  propertyId: string;
  createdBy: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  visibility: string;
  tags: string[];
  reminder?: string | null;
}

export interface UpdateNoteParams {
  title?: string;
  content?: string;
  category?: string;
  isPinned?: boolean;
  visibility?: string;
  tags?: string[];
  reminder?: string | null;
}

@Injectable()
export class NoteService {
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
      throw new ForbiddenException('Access denied');
    }
  }

  async create(params: CreateNoteParams): Promise<NoteRow> {
    await this.assertAccess(params.propertyId, params.createdBy);
    const rows = await this.prisma.$queryRaw<NoteRow[]>`
      INSERT INTO property.notes
        (property_id, created_by, title, content, category, is_pinned, visibility, tags, reminder)
      VALUES (
        ${params.propertyId}::uuid,
        ${params.createdBy}::uuid,
        ${params.title},
        ${params.content},
        ${params.category},
        ${params.isPinned},
        ${params.visibility},
        ${JSON.stringify(params.tags)}::jsonb,
        ${params.reminder ?? null}::date
      )
      RETURNING *
    `;
    return rows[0];
  }

  async list(propertyId: string, userId: string): Promise<NoteRow[]> {
    await this.assertAccess(propertyId, userId);
    return this.prisma.$queryRaw<NoteRow[]>`
      SELECT * FROM property.notes
      WHERE property_id = ${propertyId}::uuid
      ORDER BY is_pinned DESC, created_at DESC
    `;
  }

  async update(id: string, userId: string, params: UpdateNoteParams): Promise<NoteRow> {
    const existing = await this.prisma.$queryRaw<NoteRow[]>`
      SELECT * FROM property.notes WHERE id = ${id}::uuid LIMIT 1
    `;
    if (!existing.length) {
      throw new NotFoundException('Note not found');
    }
    await this.assertAccess(existing[0].property_id, userId);

    const rows = await this.prisma.$queryRaw<NoteRow[]>`
      UPDATE property.notes SET
        title      = COALESCE(${params.title ?? null},      title),
        content    = COALESCE(${params.content ?? null},    content),
        category   = COALESCE(${params.category ?? null},  category),
        is_pinned  = COALESCE(${params.isPinned ?? null},  is_pinned),
        visibility = COALESCE(${params.visibility ?? null}, visibility),
        tags       = COALESCE(${params.tags != null ? JSON.stringify(params.tags) : null}::jsonb, tags),
        reminder   = CASE WHEN ${params.reminder !== undefined} THEN ${params.reminder ?? null}::date ELSE reminder END,
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `;
    return rows[0];
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.$queryRaw<NoteRow[]>`
      SELECT * FROM property.notes WHERE id = ${id}::uuid LIMIT 1
    `;
    if (!existing.length) {
      throw new NotFoundException('Note not found');
    }
    await this.assertAccess(existing[0].property_id, userId);
    await this.prisma.$queryRaw`
      DELETE FROM property.notes WHERE id = ${id}::uuid
    `;
  }
}
