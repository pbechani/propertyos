import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';
import {
  CreateViewingDto,
  ViewingFeedbackDto,
  AgentViewingUpdateDto,
  CreateOpenHouseDto,
} from './mandate.dto';

export type ViewingRecord = {
  id: string;
  property_id: string;
  agent_id: string;
  buyer_id: string;
  viewing_type: string;
  scheduled_at: Date;
  duration_minutes: number;
  status: string;
  virtual_link: string | null;
  agent_notes: string | null;
  buyer_feedback: unknown;
  no_show_reason: string | null;
  confirmed_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
};

export type OpenHouseRecord = {
  id: string;
  property_id: string;
  agent_id: string;
  scheduled_at: Date;
  end_at: Date;
  max_attendees: number | null;
  description: string | null;
  status: string;
  created_at: Date;
};

export type OpenHouseRegistrationRecord = {
  id: string;
  open_house_id: string;
  buyer_id: string;
  registered_at: Date;
  attended: boolean | null;
  feedback: unknown;
};

@Injectable()
export class ViewingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // REQUEST VIEWING (buyer)
  // ──────────────────────────────────────────────────────────

  async request(
    propertyId: string,
    buyerId: string,
    dto: CreateViewingDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ViewingRecord> {
    // Find the agent for this property
    const props = await this.prisma.$queryRaw<Array<{ agent_id: string | null }>>`
      SELECT agent_id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!props.length) throw new NotFoundException('Property not found');
    if (!props[0].agent_id) throw new BadRequestException('Property has no assigned agent');

    const agentId = props[0].agent_id;

    const rows = await this.prisma.$queryRaw<ViewingRecord[]>`
      INSERT INTO property.viewings (
        property_id, agent_id, buyer_id, viewing_type,
        scheduled_at, duration_minutes, virtual_link
      ) VALUES (
        ${propertyId}::uuid,
        ${agentId}::uuid,
        ${buyerId}::uuid,
        ${dto.viewingType},
        ${dto.scheduledAt}::timestamptz,
        ${dto.durationMinutes ?? 30},
        ${dto.virtualLink ?? null}
      )
      RETURNING *
    `;

    const viewing = rows[0];

    await this.audit.log({
      actorId: buyerId,
      actorRole: 'buyer',
      companyId: companyId ?? null,
      action: 'viewing.requested',
      resourceType: 'viewing',
      resourceId: viewing.id,
      payload: { propertyId, scheduledAt: dto.scheduledAt },
      ipAddress,
      userAgent,
    });

    return viewing;
  }

  // ──────────────────────────────────────────────────────────
  // LIST for a property (agent)
  // ──────────────────────────────────────────────────────────

  async findByProperty(propertyId: string): Promise<ViewingRecord[]> {
    return this.prisma.$queryRaw<ViewingRecord[]>`
      SELECT * FROM property.viewings
      WHERE property_id = ${propertyId}::uuid
      ORDER BY scheduled_at ASC
    `;
  }

  // ──────────────────────────────────────────────────────────
  // CONFIRM (agent)
  // ──────────────────────────────────────────────────────────

  async confirm(
    viewingId: string,
    agentId: string,
    agentRole: string,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ViewingRecord> {
    const viewing = await this.findViewingOrThrow(viewingId);
    this.assertAgentOwns(viewing, agentId, agentRole);

    if (viewing.status !== 'requested') {
      throw new BadRequestException('Viewing is not in requested state');
    }

    const now = new Date();
    const rows = await this.prisma.$queryRaw<ViewingRecord[]>`
      UPDATE property.viewings
      SET status = 'confirmed', confirmed_at = ${now}
      WHERE id = ${viewingId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      companyId: companyId ?? null,
      action: 'viewing.confirmed',
      resourceType: 'viewing',
      resourceId: viewingId,
      payload: {},
      ipAddress,
      userAgent,
    });

    return rows[0];
  }

  // ──────────────────────────────────────────────────────────
  // COMPLETE (agent)
  // ──────────────────────────────────────────────────────────

  async complete(
    viewingId: string,
    agentId: string,
    agentRole: string,
    dto: AgentViewingUpdateDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ViewingRecord> {
    const viewing = await this.findViewingOrThrow(viewingId);
    this.assertAgentOwns(viewing, agentId, agentRole);

    const now = new Date();
    const rows = await this.prisma.$queryRaw<ViewingRecord[]>`
      UPDATE property.viewings
      SET status = 'completed',
          completed_at = ${now},
          agent_notes = ${dto.agentNotes ?? viewing.agent_notes}
      WHERE id = ${viewingId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      companyId: companyId ?? null,
      action: 'viewing.completed',
      resourceType: 'viewing',
      resourceId: viewingId,
      payload: {},
      ipAddress,
      userAgent,
    });

    return rows[0];
  }

  // ──────────────────────────────────────────────────────────
  // BUYER FEEDBACK
  // ──────────────────────────────────────────────────────────

  async submitFeedback(
    viewingId: string,
    buyerId: string,
    dto: ViewingFeedbackDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ViewingRecord> {
    const viewing = await this.findViewingOrThrow(viewingId);

    if (viewing.buyer_id !== buyerId) {
      throw new ForbiddenException('Only the buyer can submit feedback for this viewing');
    }

    if (!['completed', 'confirmed'].includes(viewing.status)) {
      throw new BadRequestException('Feedback can only be submitted for confirmed or completed viewings');
    }

    const rows = await this.prisma.$queryRaw<ViewingRecord[]>`
      UPDATE property.viewings
      SET buyer_feedback = ${JSON.stringify(dto)}::jsonb
      WHERE id = ${viewingId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId: buyerId,
      actorRole: 'buyer',
      companyId: companyId ?? null,
      action: 'viewing.feedback_submitted',
      resourceType: 'viewing',
      resourceId: viewingId,
      payload: dto as unknown as Record<string, unknown>,
      ipAddress,
      userAgent,
    });

    return rows[0];
  }

  // ──────────────────────────────────────────────────────────
  // AGENT CALENDAR
  // ──────────────────────────────────────────────────────────

  async agentCalendar(
    agentId: string,
    from?: string,
    to?: string,
  ): Promise<ViewingRecord[]> {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.$queryRaw<ViewingRecord[]>`
      SELECT v.*, p.title as property_title
      FROM property.viewings v
      JOIN property.properties p ON p.id = v.property_id
      WHERE v.agent_id = ${agentId}::uuid
        AND v.scheduled_at BETWEEN ${fromDate}::timestamptz AND ${toDate}::timestamptz
      ORDER BY v.scheduled_at ASC
    `;
  }

  async propertyOpenHouses(propertyId: string): Promise<OpenHouseRecord[]> {
    return this.prisma.$queryRaw<OpenHouseRecord[]>`
      SELECT id, property_id, agent_id, scheduled_at, end_at, max_attendees, description, status, created_at
      FROM property.open_houses
      WHERE property_id = ${propertyId}::uuid
        AND status = 'scheduled'
        AND scheduled_at > NOW()
      ORDER BY scheduled_at ASC
    `;
  }

  async agentOpenHouses(
    agentId: string,
  ): Promise<(OpenHouseRecord & { property_title: string })[]> {
    return this.prisma.$queryRaw<
      (OpenHouseRecord & { property_title: string })[]
    >`
      SELECT oh.*, p.title as property_title
      FROM property.open_houses oh
      JOIN property.properties p ON p.id = oh.property_id
      WHERE oh.agent_id = ${agentId}::uuid
      ORDER BY oh.scheduled_at DESC
    `;
  }

  // ──────────────────────────────────────────────────────────
  // OPEN HOUSES
  // ──────────────────────────────────────────────────────────

  async createOpenHouse(
    propertyId: string,
    agentId: string,
    dto: CreateOpenHouseDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<OpenHouseRecord> {
    const props = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!props.length) throw new NotFoundException('Property not found');

    const rows = await this.prisma.$queryRaw<OpenHouseRecord[]>`
      INSERT INTO property.open_houses (
        property_id, agent_id, scheduled_at, end_at, max_attendees, description
      ) VALUES (
        ${propertyId}::uuid,
        ${agentId}::uuid,
        ${dto.scheduledAt}::timestamptz,
        ${dto.endAt}::timestamptz,
        ${dto.maxAttendees ?? null},
        ${dto.description ?? null}
      )
      RETURNING *
    `;

    const openHouse = rows[0];

    await this.audit.log({
      actorId: agentId,
      actorRole: 'agent',
      companyId: companyId ?? null,
      action: 'open_house.created',
      resourceType: 'open_house',
      resourceId: openHouse.id,
      payload: { propertyId },
      ipAddress,
      userAgent,
    });

    return openHouse;
  }

  async registerForOpenHouse(
    openHouseId: string,
    buyerId: string,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<OpenHouseRegistrationRecord> {
    const oh = await this.prisma.$queryRaw<OpenHouseRecord[]>`
      SELECT * FROM property.open_houses WHERE id = ${openHouseId}::uuid LIMIT 1
    `;
    if (!oh.length) throw new NotFoundException('Open house not found');

    if (oh[0].status !== 'scheduled') {
      throw new BadRequestException('Registration is only available for scheduled open houses');
    }

    // Check max attendees
    if (oh[0].max_attendees !== null) {
      const count = await this.prisma.$queryRaw<Array<{ cnt: bigint }>>`
        SELECT COUNT(*) as cnt FROM property.open_house_registrations
        WHERE open_house_id = ${openHouseId}::uuid
      `;
      if (Number(count[0]?.cnt ?? 0) >= oh[0].max_attendees) {
        throw new BadRequestException('Open house is fully booked');
      }
    }

    try {
      const rows = await this.prisma.$queryRaw<OpenHouseRegistrationRecord[]>`
        INSERT INTO property.open_house_registrations (open_house_id, buyer_id)
        VALUES (${openHouseId}::uuid, ${buyerId}::uuid)
        ON CONFLICT (open_house_id, buyer_id) DO NOTHING
        RETURNING *
      `;

      if (!rows.length) throw new ConflictException('Already registered for this open house');

      await this.audit.log({
        actorId: buyerId,
        actorRole: 'buyer',
        companyId: companyId ?? null,
        action: 'open_house.registered',
        resourceType: 'open_house_registration',
        resourceId: rows[0].id,
        payload: { openHouseId },
        ipAddress,
        userAgent,
      });

      return rows[0];
    } catch (err: unknown) {
      if (err instanceof ConflictException) throw err;
      throw new BadRequestException('Could not complete registration');
    }
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  private async findViewingOrThrow(viewingId: string): Promise<ViewingRecord> {
    const rows = await this.prisma.$queryRaw<ViewingRecord[]>`
      SELECT * FROM property.viewings WHERE id = ${viewingId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Viewing not found');
    return rows[0];
  }

  private assertAgentOwns(viewing: ViewingRecord, agentId: string, agentRole: string): void {
    if (agentRole !== 'admin' && viewing.agent_id !== agentId) {
      throw new ForbiddenException('Not the assigned agent for this viewing');
    }
  }
}
