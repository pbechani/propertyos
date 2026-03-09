import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';
import { CreateLeadActivityDto } from './leads.dto';
import { LeadActivityRow } from './leads.service';

@Injectable()
export class LeadActivityService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // List activities for a lead
  // ──────────────────────────────────────────────────────────────────────────

  async list(
    leadId: string,
    _userId: string,
    _roles: string[],
    companyId: string,
  ): Promise<LeadActivityRow[]> {
    // Verify lead belongs to this company
    const lead = await this.prisma.$queryRaw<{ id: string; company_id: string }[]>`
      SELECT id, company_id FROM sales.leads
      WHERE id = ${leadId}::uuid LIMIT 1
    `;
    if (!lead[0]) throw new NotFoundException('Lead not found');
    if (lead[0].company_id !== companyId) throw new ForbiddenException('Access denied');

    return this.prisma.$queryRaw<LeadActivityRow[]>`
      SELECT a.*,
        CONCAT(u.first_name, ' ', u.last_name) AS actor_name
      FROM sales.lead_activities a
      LEFT JOIN identity.users u ON u.id = a.actor_id
      WHERE a.lead_id = ${leadId}::uuid
        AND a.company_id = ${companyId}::uuid
      ORDER BY a.created_at DESC
    `;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Create activity for a lead
  // ──────────────────────────────────────────────────────────────────────────

  async create(
    leadId: string,
    actorId: string,
    _roles: string[],
    companyId: string,
    dto: CreateLeadActivityDto,
  ): Promise<LeadActivityRow> {
    // Verify lead belongs to this company
    const lead = await this.prisma.$queryRaw<{ id: string; company_id: string }[]>`
      SELECT id, company_id FROM sales.leads
      WHERE id = ${leadId}::uuid LIMIT 1
    `;
    if (!lead[0]) throw new NotFoundException('Lead not found');
    if (lead[0].company_id !== companyId) throw new ForbiddenException('Access denied');

    const id = randomUUID();
    const metadata = dto.metadata ?? {};

    const [activity] = await this.prisma.$queryRaw<LeadActivityRow[]>`
      INSERT INTO sales.lead_activities (id, lead_id, company_id, actor_id, type, description, metadata)
      VALUES (
        ${id}::uuid,
        ${leadId}::uuid,
        ${companyId}::uuid,
        ${actorId}::uuid,
        ${dto.type},
        ${dto.description},
        ${JSON.stringify(metadata)}::jsonb
      )
      RETURNING *
    `;

    // Update last_contact_at on the lead
    await this.prisma.$executeRaw`
      UPDATE sales.leads
      SET last_contact_at = NOW(), updated_at = NOW()
      WHERE id = ${leadId}::uuid
    `;

    return activity;
  }
}
