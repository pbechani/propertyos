import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database';
import { CreateLeadDto, LogActivityDto } from './agent-crm.dto';

type LeadRow = {
  id: string;
  agent_id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  lead_source: string | null;
  buyer_requirements: unknown;
  status: string;
  notes: string | null;
  assigned_property_id: string | null;
  created_at: Date;
  updated_at: Date;
};

type ActivityRow = {
  id: string;
  lead_id: string;
  agent_id: string;
  activity_type: string | null;
  notes: string | null;
  scheduled_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
};

@Injectable()
export class AgentCrmService {
  constructor(private readonly prisma: PrismaService) {}

  async createLead(agentId: string, dto: CreateLeadDto): Promise<LeadRow> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO identity.leads
        (agent_id, contact_name, contact_email, contact_phone,
         lead_source, buyer_requirements, notes, assigned_property_id)
      VALUES
        (${agentId}::uuid,
         ${dto.contactName},
         ${dto.contactEmail ?? null},
         ${dto.contactPhone ?? null},
         ${dto.leadSource ?? null},
         ${dto.buyerRequirements ? JSON.stringify(dto.buyerRequirements) : null}::jsonb,
         ${dto.notes ?? null},
         ${dto.assignedPropertyId ?? null}::uuid)
      RETURNING id
    `;
    return this.findLeadById(agentId, rows[0].id);
  }

  async getLeads(
    agentId: string,
    opts: { status?: string; page: number; limit: number },
  ): Promise<{ data: LeadRow[]; total: number }> {
    const offset = (opts.page - 1) * opts.limit;
    const statusFilter = opts.status ?? null;

    const data = await this.prisma.$queryRaw<LeadRow[]>`
      SELECT *
      FROM identity.leads
      WHERE agent_id = ${agentId}::uuid
        AND (${statusFilter}::text IS NULL OR status = ${statusFilter})
      ORDER BY updated_at DESC
      LIMIT ${opts.limit} OFFSET ${offset}
    `;

    const counts = await this.prisma.$queryRaw<Array<{ count: string }>>`
      SELECT COUNT(*)::text
      FROM identity.leads
      WHERE agent_id = ${agentId}::uuid
        AND (${statusFilter}::text IS NULL OR status = ${statusFilter})
    `;

    return { data, total: parseInt(counts[0]?.count ?? '0', 10) };
  }

  async findLeadById(agentId: string, leadId: string): Promise<LeadRow> {
    const rows = await this.prisma.$queryRaw<LeadRow[]>`
      SELECT * FROM identity.leads
      WHERE id = ${leadId}::uuid AND agent_id = ${agentId}::uuid
      LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException('Lead not found');
    return rows[0];
  }

  async updateLeadStatus(
    agentId: string,
    leadId: string,
    status: string,
  ): Promise<LeadRow> {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      new: ['contacted', 'inactive'],
      contacted: ['qualified', 'inactive'],
      qualified: ['showing', 'inactive'],
      showing: ['offer', 'qualified', 'inactive'],
      offer: ['closed', 'showing', 'inactive'],
      closed: [],
      inactive: ['new'],
    };

    const lead = await this.findLeadById(agentId, leadId);
    const allowed = VALID_TRANSITIONS[lead.status] ?? [];

    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition lead from '${lead.status}' to '${status}'.`,
      );
    }

    await this.prisma.$executeRaw`
      UPDATE identity.leads
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${leadId}::uuid AND agent_id = ${agentId}::uuid
    `;

    return this.findLeadById(agentId, leadId);
  }

  async logActivity(
    agentId: string,
    leadId: string,
    dto: LogActivityDto,
  ): Promise<ActivityRow> {
    // Ensure the lead belongs to this agent
    const lead = await this.findLeadById(agentId, leadId);
    if (lead.agent_id !== agentId) {
      throw new ForbiddenException('Not your lead');
    }

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    const completedAt = dto.completedAt ? new Date(dto.completedAt) : null;

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO identity.lead_activities
        (lead_id, agent_id, activity_type, notes, scheduled_at, completed_at)
      VALUES
        (${leadId}::uuid, ${agentId}::uuid, ${dto.activityType},
         ${dto.notes ?? null}, ${scheduledAt}, ${completedAt})
      RETURNING id
    `;

    const activities = await this.prisma.$queryRaw<ActivityRow[]>`
      SELECT * FROM identity.lead_activities WHERE id = ${rows[0].id}::uuid LIMIT 1
    `;
    return activities[0];
  }

  async getActivities(agentId: string, leadId: string): Promise<ActivityRow[]> {
    // Activity read only for the lead's owner
    await this.findLeadById(agentId, leadId);

    return this.prisma.$queryRaw<ActivityRow[]>`
      SELECT * FROM identity.lead_activities
      WHERE lead_id = ${leadId}::uuid
      ORDER BY created_at DESC
    `;
  }

  async getDashboard(agentId: string): Promise<{
    totalLeads: number;
    byStatus: Record<string, number>;
    activitiesThisWeek: number;
  }> {
    const statusCounts = await this.prisma.$queryRaw<
      Array<{ status: string; count: string }>
    >`
      SELECT status, COUNT(*)::text
      FROM identity.leads
      WHERE agent_id = ${agentId}::uuid
      GROUP BY status
    `;

    const weekActivity = await this.prisma.$queryRaw<Array<{ count: string }>>`
      SELECT COUNT(*)::text
      FROM identity.lead_activities
      WHERE agent_id = ${agentId}::uuid
        AND created_at >= NOW() - INTERVAL '7 days'
    `;

    const byStatus: Record<string, number> = {};
    let totalLeads = 0;
    for (const row of statusCounts) {
      byStatus[row.status] = parseInt(row.count, 10);
      totalLeads += byStatus[row.status];
    }

    return {
      totalLeads,
      byStatus,
      activitiesThisWeek: parseInt(weekActivity[0]?.count ?? '0', 10),
    };
  }
}
