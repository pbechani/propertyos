import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';

export interface CommunicationLogRow {
  id: string;
  property_id: string;
  logged_by: string;
  type: string;
  contact_name: string;
  contact_role: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  subject: string;
  summary: string;
  communication_date: string;
  duration: string | null;
  outcome: string | null;
  follow_up_required: boolean;
  follow_up_details: string | null;
  follow_up_date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateCommunicationLogParams {
  propertyId: string;
  loggedBy: string;
  type: string;
  contactName: string;
  contactRole?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  subject: string;
  summary: string;
  communicationDate: string;
  duration?: string | null;
  outcome?: string | null;
  followUpRequired: boolean;
  followUpDetails?: string | null;
  followUpDate?: string | null;
  tags: string[];
}

export interface UpdateCommunicationLogParams {
  type?: string;
  contactName?: string;
  contactRole?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  subject?: string;
  summary?: string;
  communicationDate?: string;
  duration?: string | null;
  outcome?: string | null;
  followUpRequired?: boolean;
  followUpDetails?: string | null;
  followUpDate?: string | null;
  tags?: string[];
}

@Injectable()
export class CommunicationLogService {
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

  async create(params: CreateCommunicationLogParams): Promise<CommunicationLogRow> {
    await this.assertAccess(params.propertyId, params.loggedBy);
    const rows = await this.prisma.$queryRaw<CommunicationLogRow[]>`
      INSERT INTO property.communication_logs (
        property_id, logged_by, type,
        contact_name, contact_role, contact_email, contact_phone,
        subject, summary, communication_date,
        duration, outcome,
        follow_up_required, follow_up_details, follow_up_date,
        tags
      ) VALUES (
        ${params.propertyId}::uuid,
        ${params.loggedBy}::uuid,
        ${params.type},
        ${params.contactName},
        ${params.contactRole ?? null},
        ${params.contactEmail ?? null},
        ${params.contactPhone ?? null},
        ${params.subject},
        ${params.summary},
        ${params.communicationDate}::timestamptz,
        ${params.duration ?? null},
        ${params.outcome ?? null},
        ${params.followUpRequired},
        ${params.followUpDetails ?? null},
        ${params.followUpDate ?? null}::date,
        ${'{' + params.tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',') + '}'}::text[]
      )
      RETURNING *
    `;
    return rows[0];
  }

  async list(propertyId: string, userId: string): Promise<CommunicationLogRow[]> {
    await this.assertAccess(propertyId, userId);
    return this.prisma.$queryRaw<CommunicationLogRow[]>`
      SELECT * FROM property.communication_logs
      WHERE property_id = ${propertyId}::uuid
      ORDER BY communication_date DESC, created_at DESC
    `;
  }

  async update(
    id: string,
    userId: string,
    params: UpdateCommunicationLogParams,
  ): Promise<CommunicationLogRow> {
    const existing = await this.prisma.$queryRaw<CommunicationLogRow[]>`
      SELECT * FROM property.communication_logs WHERE id = ${id}::uuid LIMIT 1
    `;
    if (!existing.length) {
      throw new NotFoundException('Communication log not found');
    }
    await this.assertAccess(existing[0].property_id, userId);

    const rows = await this.prisma.$queryRaw<CommunicationLogRow[]>`
      UPDATE property.communication_logs SET
        type               = COALESCE(${params.type ?? null},          type),
        contact_name       = COALESCE(${params.contactName ?? null},   contact_name),
        contact_role       = COALESCE(${params.contactRole ?? null},   contact_role),
        contact_email      = COALESCE(${params.contactEmail ?? null},  contact_email),
        contact_phone      = COALESCE(${params.contactPhone ?? null},  contact_phone),
        subject            = COALESCE(${params.subject ?? null},       subject),
        summary            = COALESCE(${params.summary ?? null},       summary),
        communication_date = COALESCE(${params.communicationDate != null ? params.communicationDate : null}::timestamptz, communication_date),
        duration           = COALESCE(${params.duration ?? null},      duration),
        outcome            = COALESCE(${params.outcome ?? null},       outcome),
        follow_up_required = COALESCE(${params.followUpRequired ?? null}, follow_up_required),
        follow_up_details  = CASE WHEN ${params.followUpDetails !== undefined} THEN ${params.followUpDetails ?? null} ELSE follow_up_details END,
        follow_up_date     = CASE WHEN ${params.followUpDate !== undefined} THEN ${params.followUpDate ?? null}::date ELSE follow_up_date END,
        tags               = COALESCE(${params.tags != null ? ('{' + params.tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',') + '}') : null}::text[], tags),
        updated_at         = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `;
    return rows[0];
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.$queryRaw<CommunicationLogRow[]>`
      SELECT * FROM property.communication_logs WHERE id = ${id}::uuid LIMIT 1
    `;
    if (!existing.length) {
      throw new NotFoundException('Communication log not found');
    }
    await this.assertAccess(existing[0].property_id, userId);
    await this.prisma.$queryRaw`
      DELETE FROM property.communication_logs WHERE id = ${id}::uuid
    `;
  }
}
