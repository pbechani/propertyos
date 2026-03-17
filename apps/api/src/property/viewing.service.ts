import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';
import { NotificationService } from '../identity/notification.service';
import { SELF_COMPANY_SLUG } from '../identity/identity.constants';
import {
  AgentBookViewingDto,
  AgentDeclineViewingDto,
  CancelViewingDto,
  CreateViewingDto,
  RescheduleViewingDto,
  ViewingFeedbackDto,
  AgentViewingUpdateDto,
  CreateOpenHouseDto,
  CancelOpenHouseDto,
  RescheduleOpenHouseDto,
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
  cancel_reason: string | null;
  cancelled_by: string | null;
  rescheduled_at: Date | null;
  rescheduled_reason: string | null;
  declined_at: Date | null;
  confirmed_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
};

export type ViewingWithBuyerRecord = ViewingRecord & {
  buyer_first_name: string | null;
  buyer_last_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
};
export type OpenHouseRecord = {
  id: string;
  property_id: string;
  property_title?: string;
  agent_id: string;
  scheduled_at: Date;
  end_at: Date;
  max_attendees: number | null;
  description: string | null;
  status: string;
  cancel_reason: string | null;
  rescheduled_at: Date | null;
  rescheduled_reason: string | null;
  preparation_checklist?: { task: string; completed: boolean }[] | null;
  marketing_options?: { channel: string; enabled: boolean }[] | null;
  created_at: Date;
};

export type OpenHouseRegistrationRecord = {
  id: string;
  open_house_id: string;
  buyer_id: string;
  registered_at: Date;
  attended: boolean | null;
  feedback: unknown;
  qr_token: string;
};

export type OpenHouseAttendeeRow = {
  id: string;
  open_house_id: string;
  buyer_id: string | null;
  registered_at: Date;
  attended: boolean | null;
  checked_in_at: Date | null;
  interest_level: 'high' | 'medium' | 'low' | null;
  notes: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  qr_token: string;
  // joined from identity.users
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

export type UserNotificationRecord = {
  id: string;
  user_id: string;
  company_id: string | null;
  type: string;
  title: string;
  body: string;
  resource_type: string | null;
  resource_id: string | null;
  read_at: Date | null;
  created_at: Date;
};

@Injectable()
export class ViewingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
    private readonly notifications: NotificationService,
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
    const props = await this.prisma.$queryRaw<Array<{ agent_id: string | null; company_id: string | null }>>`
      SELECT agent_id, company_id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!props.length) throw new NotFoundException('Property not found');
    if (!props[0].agent_id) throw new BadRequestException('Property has no assigned agent');

    const agentId = props[0].agent_id;
    const propertyCompanyId = props[0].company_id;

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

    // Notify agent of new viewing request
    const agent = await this.getUserContact(agentId);
    const property = await this.getPropertyTitle(propertyId);
    const scheduledStr = new Date(dto.scheduledAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
    await this.notifications.sendEmail(
      agent.email,
      `New viewing request — ${property}`,
      `Hi ${agent.full_name ?? 'there'},\n\nA buyer has requested a viewing for **${property}** on ${scheduledStr}.\n\nPlease log in to accept or decline the request.\n\nKind regards,\nThe PRIBEC Team`,
    );
    await this.createInAppNotification(
      agentId,
      'viewing_requested',
      `New viewing request — ${property}`,
      `A buyer requested a viewing on ${scheduledStr}. Please accept or decline.`,
      viewing.id,
      propertyCompanyId,  // use the listing's company, not the buyer's context
    );

    return viewing;
  }

  // ──────────────────────────────────────────────────────────
  // LIST for a property (agent)
  // ──────────────────────────────────────────────────────────

  async findByProperty(propertyId: string): Promise<ViewingWithBuyerRecord[]> {
    return this.prisma.$queryRaw<ViewingWithBuyerRecord[]>`
      SELECT v.*,
             u.first_name  AS buyer_first_name,
             u.last_name   AS buyer_last_name,
             u.email       AS buyer_email,
             u.phone       AS buyer_phone
      FROM property.viewings v
      LEFT JOIN identity.users u ON u.id = v.buyer_id
      WHERE v.property_id = ${propertyId}::uuid
      ORDER BY v.scheduled_at ASC
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

    // Notify buyer their viewing is confirmed
    const buyer = await this.getUserContact(viewing.buyer_id);
    const property = await this.getPropertyTitle(viewing.property_id);
    const scheduledStr = new Date(viewing.scheduled_at).toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    await this.notifications.sendEmail(
      buyer.email,
      `Viewing confirmed — ${property}`,
      `Hi ${buyer.full_name ?? 'there'},\n\nGreat news! Your viewing for **${property}** on ${scheduledStr} has been confirmed.\n\nPlease ensure you arrive on time. Contact the agent if you need to make any changes.\n\nKind regards,\nThe PRIBEC Team`,
    );
    await this.createInAppNotification(
      viewing.buyer_id,
      'viewing_confirmed',
      `Viewing confirmed — ${property}`,
      `Your viewing on ${scheduledStr} has been confirmed.`,
      viewingId,
      await this.getBuyerSelfCompanyId(viewing.buyer_id),
    );

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
      SELECT oh.*, p.title as property_title
      FROM property.open_houses oh
      JOIN property.properties p ON p.id = oh.property_id
      WHERE oh.property_id = ${propertyId}::uuid
      ORDER BY oh.scheduled_at ASC
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
        property_id, agent_id, scheduled_at, end_at, max_attendees, description, preparation_checklist, marketing_options
      ) VALUES (
        ${propertyId}::uuid,
        ${agentId}::uuid,
        ${dto.scheduledAt}::timestamptz,
        ${dto.endAt}::timestamptz,
        ${dto.maxAttendees ?? null},
        ${dto.description ?? null},
        ${dto.preparationChecklist ? JSON.stringify(dto.preparationChecklist) : null}::jsonb,
        ${dto.marketingOptions ? JSON.stringify(dto.marketingOptions) : null}::jsonb
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

      const registration = rows[0];

      await this.audit.log({
        actorId: buyerId,
        actorRole: 'buyer',
        companyId: companyId ?? null,
        action: 'open_house.registered',
        resourceType: 'open_house_registration',
        resourceId: registration.id,
        payload: { openHouseId },
        ipAddress,
        userAgent,
      });

      // Send confirmation email with QR code to the buyer
      void this.sendRegistrationConfirmationEmail(registration, oh[0]);

      return registration;
    } catch (err: unknown) {
      if (err instanceof ConflictException) throw err;
      throw new BadRequestException('Could not complete registration');
    }
  }

  /**
   * Generates a QR code PNG (base64) encoding the registration's qr_token.
   * The token is resolved to a registration during check-in via lookupByQrToken.
   */
  async getRegistrationQrCode(registrationId: string, requesterId: string): Promise<string> {
    const rows = await this.prisma.$queryRaw<Array<{ qr_token: string; buyer_id: string }>>`
      SELECT qr_token, buyer_id FROM property.open_house_registrations
      WHERE id = ${registrationId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Registration not found');
    if (rows[0].buyer_id !== requesterId) throw new ForbiddenException('Not your registration');
    return QRCode.toDataURL(rows[0].qr_token, { width: 300, margin: 2 });
  }

  private async sendRegistrationConfirmationEmail(
    registration: OpenHouseRegistrationRecord,
    oh: OpenHouseRecord,
  ): Promise<void> {
    try {
      const buyerRows = await this.prisma.$queryRaw<Array<{ email: string; first_name: string }>>`
        SELECT email, first_name FROM identity.users WHERE id = ${registration.buyer_id}::uuid LIMIT 1
      `;
      if (!buyerRows.length) return;

      const buyer = buyerRows[0];
      const qrDataUrl = await QRCode.toDataURL(registration.qr_token, { width: 250, margin: 2 });
      // Convert data URL to base64 portion for inline CID embedding
      const base64Img = qrDataUrl.replace(/^data:image\/png;base64,/, '');

      const eventDate = new Date(oh.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const startTime = new Date(oh.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
      });
      const endTime = new Date(oh.end_at).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
      });

      const subject = `Your Open House Confirmation – ${eventDate}`;
      const body = `
Hi ${buyer.first_name},

You're registered for the open house on ${eventDate} from ${startTime} to ${endTime}.

Your check-in QR code is attached below. Please present it at the door on the day.

[QR CODE IMAGE: data:image/png;base64,${base64Img}]

Registration ID: ${registration.id}

See you there!
The PropertyOS Team
      `.trim();

      await this.notifications.sendEmail(buyer.email, subject, body);
    } catch {
      // Non-fatal — registration was saved; email failure is logged by NotificationService
    }
  }

  async getOpenHouseRegistrations(
    openHouseId: string,
    agentId: string,
  ): Promise<OpenHouseAttendeeRow[]> {
    // Verify ownership
    const oh = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM property.open_houses WHERE id = ${openHouseId}::uuid AND agent_id = ${agentId}::uuid LIMIT 1
    `;
    if (!oh.length) throw new NotFoundException('Open house not found');

    return this.prisma.$queryRaw<OpenHouseAttendeeRow[]>`
      SELECT
        r.id,
        r.open_house_id,
        r.buyer_id,
        r.registered_at,
        r.attended,
        r.checked_in_at,
        r.interest_level,
        r.notes,
        r.guest_name,
        r.guest_email,
        r.guest_phone,
        r.qr_token,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM property.open_house_registrations r
      LEFT JOIN identity.users u ON u.id = r.buyer_id
      WHERE r.open_house_id = ${openHouseId}::uuid
      ORDER BY r.registered_at ASC
    `;
  }

  async checkInAttendee(
    openHouseId: string,
    agentId: string,
    payload: {
      registrationId?: string;
      qrToken?: string;
      guestName?: string;
      guestEmail?: string;
      guestPhone?: string;
      interestLevel?: 'high' | 'medium' | 'low';
      notes?: string;
    },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<OpenHouseAttendeeRow> {
    const oh = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM property.open_houses WHERE id = ${openHouseId}::uuid AND agent_id = ${agentId}::uuid LIMIT 1
    `;
    if (!oh.length) throw new NotFoundException('Open house not found');

    const now = new Date();
    let row: OpenHouseAttendeeRow;

    if (payload.qrToken) {
      // QR scan path — resolve qr_token to a registration
      const rows = await this.prisma.$queryRaw<OpenHouseAttendeeRow[]>`
        UPDATE property.open_house_registrations
        SET attended = true,
            checked_in_at = ${now},
            interest_level = COALESCE(${payload.interestLevel ?? null}, interest_level),
            notes = COALESCE(${payload.notes ?? null}, notes)
        WHERE qr_token = ${payload.qrToken}::uuid AND open_house_id = ${openHouseId}::uuid
        RETURNING *
      `;
      if (!rows.length) throw new NotFoundException('QR code not recognised for this open house');
      row = rows[0];
    } else if (payload.registrationId) {
      // Mark existing registration as attended
      const rows = await this.prisma.$queryRaw<OpenHouseAttendeeRow[]>`
        UPDATE property.open_house_registrations
        SET attended = true,
            checked_in_at = ${now},
            interest_level = COALESCE(${payload.interestLevel ?? null}, interest_level),
            notes = COALESCE(${payload.notes ?? null}, notes)
        WHERE id = ${payload.registrationId}::uuid AND open_house_id = ${openHouseId}::uuid
        RETURNING *
      `;
      if (!rows.length) throw new NotFoundException('Registration not found');
      row = rows[0];
    } else {
      // Walk-in guest — insert new record
      if (!payload.guestName) {
        throw new BadRequestException('Guest name is required for walk-in check-in');
      }
      const interestLevel = payload.interestLevel ?? 'medium';
      const rows = await this.prisma.$queryRaw<OpenHouseAttendeeRow[]>`
        INSERT INTO property.open_house_registrations
          (open_house_id, attended, checked_in_at, guest_name, guest_email, guest_phone, interest_level, notes)
        VALUES
          (${openHouseId}::uuid, true, ${now}, ${payload.guestName}, ${payload.guestEmail},
           ${payload.guestPhone ?? null}, ${interestLevel}, ${payload.notes ?? null})
        RETURNING *
      `;
      row = rows[0];
    }

    await this.audit.log({
      actorId: agentId,
      actorRole: 'agent',
      action: 'open_house.checked_in',
      resourceType: 'open_house_registration',
      resourceId: row.id,
      payload: { openHouseId },
      ipAddress,
      userAgent,
    });

    return row;
  }

  async cancelOpenHouse(
    openHouseId: string,
    agentId: string,
    agentRole: string,
    dto: CancelOpenHouseDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<OpenHouseRecord> {
    const rows = await this.prisma.$queryRaw<OpenHouseRecord[]>`
      SELECT * FROM property.open_houses WHERE id = ${openHouseId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Open house not found');

    const oh = rows[0];
    if (agentRole !== 'admin' && oh.agent_id !== agentId) {
      throw new ForbiddenException('You do not own this open house');
    }
    if (oh.status !== 'scheduled') {
      throw new BadRequestException('Only scheduled open houses can be cancelled');
    }

    const updated = await this.prisma.$queryRaw<OpenHouseRecord[]>`
      UPDATE property.open_houses
      SET status = 'cancelled', cancel_reason = ${dto.reason}
      WHERE id = ${openHouseId}::uuid
      RETURNING *
    `;

    // Notify all registered attendees
    const registrations = await this.prisma.$queryRaw<Array<{ buyer_id: string }>>`
      SELECT buyer_id FROM property.open_house_registrations
      WHERE open_house_id = ${openHouseId}::uuid
    `;
    const propertyTitle = await this.getPropertyTitle(oh.property_id);
    const scheduledDate = new Date(oh.scheduled_at).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });

    for (const reg of registrations) {
      const contact = await this.getUserContact(reg.buyer_id);
      await this.notifications.sendEmail(
        contact.email,
        `Open House Cancelled — ${propertyTitle}`,
        `Hi ${contact.full_name ?? 'there'},\n\nThe open house for "${propertyTitle}" that was scheduled for ${scheduledDate} has been cancelled.\n\nReason: ${dto.reason}\n\nWe apologise for any inconvenience. Please check the listing for any rescheduled viewings.\n\nThe Pribec Team`,
      );
      await this.createInAppNotification(
        reg.buyer_id,
        'open_house.cancelled',
        `Open House Cancelled`,
        `The open house for "${propertyTitle}" on ${scheduledDate} has been cancelled.`,
        openHouseId,
        await this.getBuyerSelfCompanyId(reg.buyer_id),
      );
    }

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      companyId: companyId ?? null,
      action: 'open_house.cancelled',
      resourceType: 'open_house',
      resourceId: openHouseId,
      payload: { reason: dto.reason },
      ipAddress,
      userAgent,
    });

    return updated[0];
  }

  async rescheduleOpenHouse(
    openHouseId: string,
    agentId: string,
    agentRole: string,
    dto: RescheduleOpenHouseDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<OpenHouseRecord> {
    const rows = await this.prisma.$queryRaw<OpenHouseRecord[]>`
      SELECT * FROM property.open_houses WHERE id = ${openHouseId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Open house not found');

    const oh = rows[0];
    if (agentRole !== 'admin' && oh.agent_id !== agentId) {
      throw new ForbiddenException('You do not own this open house');
    }
    if (oh.status !== 'scheduled') {
      throw new BadRequestException('Only scheduled open houses can be rescheduled');
    }

    const updated = await this.prisma.$queryRaw<OpenHouseRecord[]>`
      UPDATE property.open_houses
      SET
        scheduled_at = ${dto.scheduledAt}::timestamptz,
        end_at = ${dto.endAt}::timestamptz,
        rescheduled_at = NOW(),
        rescheduled_reason = ${dto.reason ?? null}
      WHERE id = ${openHouseId}::uuid
      RETURNING *
    `;

    // Notify all registered attendees
    const registrations = await this.prisma.$queryRaw<Array<{ buyer_id: string }>>`
      SELECT buyer_id FROM property.open_house_registrations
      WHERE open_house_id = ${openHouseId}::uuid
    `;
    const propertyTitle = await this.getPropertyTitle(oh.property_id);
    const newDate = new Date(dto.scheduledAt).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    const newTimeStart = new Date(dto.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const newTimeEnd = new Date(dto.endAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    for (const reg of registrations) {
      const contact = await this.getUserContact(reg.buyer_id);
      await this.notifications.sendEmail(
        contact.email,
        `Open House Rescheduled — ${propertyTitle}`,
        `Hi ${contact.full_name ?? 'there'},\n\nThe open house for "${propertyTitle}" has been rescheduled.\n\nNew date: ${newDate}\nNew time: ${newTimeStart} – ${newTimeEnd}${dto.reason ? `\n\nReason: ${dto.reason}` : ''}\n\nYour registration has been kept. We look forward to seeing you!\n\nThe Pribec Team`,
      );
      await this.createInAppNotification(
        reg.buyer_id,
        'open_house.rescheduled',
        `Open House Rescheduled`,
        `The open house for "${propertyTitle}" has moved to ${newDate} at ${newTimeStart}.`,
        openHouseId,
        await this.getBuyerSelfCompanyId(reg.buyer_id),
      );
    }

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      companyId: companyId ?? null,
      action: 'open_house.rescheduled',
      resourceType: 'open_house',
      resourceId: openHouseId,
      payload: { scheduledAt: dto.scheduledAt, endAt: dto.endAt, reason: dto.reason },
      ipAddress,
      userAgent,
    });

    return updated[0];
  }

  // ──────────────────────────────────────────────────────────
  // AGENT BOOK VIEWING (on behalf of a buyer who called in)
  // ──────────────────────────────────────────────────────────

  async bookForBuyer(
    propertyId: string,
    agentId: string,
    dto: AgentBookViewingDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ViewingRecord> {
    const props = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!props.length) throw new NotFoundException('Property not found');

    // Buyer contact is stored in agent_notes as JSON so it is fully auditable
    // without requiring a separate users record for the external buyer.
    const contactJson = JSON.stringify({
      bookedByAgent: true,
      name: dto.buyerContactName,
      email: dto.buyerContactEmail ?? null,
      phone: dto.buyerContactPhone ?? null,
      notes: dto.notes ?? null,
    });

    const rows = await this.prisma.$queryRaw<ViewingRecord[]>`
      INSERT INTO property.viewings (
        property_id, agent_id, buyer_id, viewing_type,
        scheduled_at, duration_minutes, virtual_link, agent_notes, status
      ) VALUES (
        ${propertyId}::uuid,
        ${agentId}::uuid,
        ${agentId}::uuid,
        ${dto.viewingType},
        ${dto.scheduledAt}::timestamptz,
        ${dto.durationMinutes ?? 30},
        ${dto.virtualLink ?? null},
        ${contactJson},
        'confirmed'
      )
      RETURNING *
    `;

    const viewing = rows[0];

    await this.audit.log({
      actorId: agentId,
      actorRole: 'agent',
      companyId: companyId ?? null,
      action: 'viewing.agent_booked',
      resourceType: 'viewing',
      resourceId: viewing.id,
      payload: { propertyId, scheduledAt: dto.scheduledAt, buyerContact: dto.buyerContactName },
      ipAddress,
      userAgent,
    });

    return viewing;
  }

  // ──────────────────────────────────────────────────────────
  // DECLINE (agent) — buyer is notified with reason + alternatives
  // ──────────────────────────────────────────────────────────

  async decline(
    viewingId: string,
    agentId: string,
    agentRole: string,
    dto: AgentDeclineViewingDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ViewingRecord> {
    const viewing = await this.findViewingOrThrow(viewingId);
    this.assertAgentOwns(viewing, agentId, agentRole);

    if (viewing.status !== 'requested') {
      throw new BadRequestException('Only requested viewings can be declined');
    }

    const now = new Date();
    const declineNotes = JSON.stringify({
      declined: true,
      reason: dto.reason,
      alternatives: dto.alternativeDates ?? [],
      message: dto.message ?? null,
    });

    const rows = await this.prisma.$queryRaw<ViewingRecord[]>`
      UPDATE property.viewings
      SET    status       = 'declined',
             agent_notes  = ${declineNotes},
             declined_at  = ${now}
      WHERE  id = ${viewingId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      companyId: companyId ?? null,
      action: 'viewing.declined',
      resourceType: 'viewing',
      resourceId: viewingId,
      payload: { reason: dto.reason },
      ipAddress,
      userAgent,
    });

    // Notify buyer
    const buyer = await this.getUserContact(viewing.buyer_id);
    const agent = await this.getUserContact(agentId);
    const property = await this.getPropertyTitle(viewing.property_id);
    const scheduledStr = new Date(viewing.scheduled_at).toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const altText =
      dto.alternativeDates && dto.alternativeDates.length > 0
        ? `\n\nAlternative dates offered:\n${dto.alternativeDates.map((d) => `  • ${new Date(d).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}`).join('\n')}`
        : '';

    await this.notifications.sendEmail(
      buyer.email,
      `Viewing declined — ${property}`,
      `Hi ${buyer.full_name ?? 'there'},\n\nUnfortunately your viewing request for **${property}** scheduled for ${scheduledStr} has been declined by the agent.\n\nReason: ${dto.reason}${altText}${dto.message ? `\n\nMessage from agent: ${dto.message}` : ''}\n\nPlease contact the agent to arrange a new time.\n\nKind regards,\nThe PRIBEC Team`,
    );

    await this.createInAppNotification(
      viewing.buyer_id,
      'viewing_declined',
      `Viewing declined — ${property}`,
      `Your viewing on ${scheduledStr} was declined. Reason: ${dto.reason}`,
      viewingId,
      await this.getBuyerSelfCompanyId(viewing.buyer_id),
    );

    // Notify agent (confirmation copy)
    await this.createInAppNotification(
      agentId,
      'viewing_declined_sent',
      `Decline sent for ${property}`,
      `You declined the ${scheduledStr} viewing. The buyer has been notified.`,
      viewingId,
      companyId,
    );

    void agent; // suppress unused warning
    return rows[0];
  }

  // ──────────────────────────────────────────────────────────
  // CANCEL (agent or buyer)
  // ──────────────────────────────────────────────────────────

  async cancel(
    viewingId: string,
    userId: string,
    userRole: string,
    dto: CancelViewingDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ViewingRecord> {
    const viewing = await this.findViewingOrThrow(viewingId);

    const isAgent =
      userRole === 'admin' || viewing.agent_id === userId;
    const isBuyer = viewing.buyer_id === userId;

    if (!isAgent && !isBuyer) {
      throw new ForbiddenException('You do not have permission to cancel this viewing');
    }

    if (!['requested', 'confirmed'].includes(viewing.status)) {
      throw new BadRequestException('Only requested or confirmed viewings can be cancelled');
    }

    const cancelledBy = isAgent ? 'agent' : 'buyer';

    const rows = await this.prisma.$queryRaw<ViewingRecord[]>`
      UPDATE property.viewings
      SET    status       = 'cancelled',
             cancel_reason = ${dto.reason},
             cancelled_by  = ${cancelledBy}
      WHERE  id = ${viewingId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId: userId,
      actorRole: userRole,
      companyId: companyId ?? null,
      action: `viewing.cancelled_by_${cancelledBy}`,
      resourceType: 'viewing',
      resourceId: viewingId,
      payload: { reason: dto.reason },
      ipAddress,
      userAgent,
    });

    const property = await this.getPropertyTitle(viewing.property_id);
    const scheduledStr = new Date(viewing.scheduled_at).toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (isAgent) {
      // Notify buyer
      const buyer = await this.getUserContact(viewing.buyer_id);
      await this.notifications.sendEmail(
        buyer.email,
        `Viewing cancelled — ${property}`,
        `Hi ${buyer.full_name ?? 'there'},\n\nYour viewing for **${property}** scheduled on ${scheduledStr} has been cancelled by the agent.\n\nReason: ${dto.reason}\n\nPlease get in touch to arrange an alternative time.\n\nKind regards,\nThe PRIBEC Team`,
      );
      await this.createInAppNotification(
        viewing.buyer_id,
        'viewing_cancelled',
        `Viewing cancelled — ${property}`,
        `Your ${scheduledStr} viewing was cancelled by the agent. Reason: ${dto.reason}`,
        viewingId,
        await this.getBuyerSelfCompanyId(viewing.buyer_id),
      );
    } else {
      // Notify agent — use the property's company_id so the notification appears
      // in the correct company context for the agent, not the buyer's company context
      const propInfo = await this.getPropertyInfo(viewing.property_id);
      const agent = await this.getUserContact(viewing.agent_id);
      await this.notifications.sendEmail(
        agent.email,
        `Viewing cancelled by buyer — ${property}`,
        `Hi ${agent.full_name ?? 'there'},\n\nThe buyer has cancelled their viewing for **${property}** scheduled on ${scheduledStr}.\n\nReason: ${dto.reason}\n\nKind regards,\nThe PRIBEC Team`,
      );
      await this.createInAppNotification(
        viewing.agent_id,
        'viewing_cancelled',
        `Buyer cancelled — ${property}`,
        `The buyer cancelled their ${scheduledStr} viewing. Reason: ${dto.reason}`,
        viewingId,
        propInfo.company_id,  // use the listing's company, not the buyer's context
      );
    }

    return rows[0];
  }

  // ──────────────────────────────────────────────────────────
  // RESCHEDULE (agent) — buyer is notified
  // ──────────────────────────────────────────────────────────

  async reschedule(
    viewingId: string,
    agentId: string,
    agentRole: string,
    dto: RescheduleViewingDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<ViewingRecord> {
    const viewing = await this.findViewingOrThrow(viewingId);
    this.assertAgentOwns(viewing, agentId, agentRole);

    if (!['requested', 'confirmed'].includes(viewing.status)) {
      throw new BadRequestException('Only requested or confirmed viewings can be rescheduled');
    }

    const now = new Date();
    const rows = await this.prisma.$queryRaw<ViewingRecord[]>`
      UPDATE property.viewings
      SET    scheduled_at       = ${dto.scheduledAt}::timestamptz,
             duration_minutes   = ${dto.durationMinutes ?? viewing.duration_minutes},
             virtual_link       = ${dto.virtualLink ?? viewing.virtual_link},
             status             = 'confirmed',
             confirmed_at       = ${now},
             rescheduled_at     = ${now},
             rescheduled_reason = ${dto.reason ?? null}
      WHERE  id = ${viewingId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      companyId: companyId ?? null,
      action: 'viewing.rescheduled',
      resourceType: 'viewing',
      resourceId: viewingId,
      payload: { newScheduledAt: dto.scheduledAt, reason: dto.reason },
      ipAddress,
      userAgent,
    });

    const buyer = await this.getUserContact(viewing.buyer_id);
    const property = await this.getPropertyTitle(viewing.property_id);
    const oldStr = new Date(viewing.scheduled_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
    const newStr = new Date(dto.scheduledAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });

    await this.notifications.sendEmail(
      buyer.email,
      `Viewing rescheduled — ${property}`,
      `Hi ${buyer.full_name ?? 'there'},\n\nYour viewing for **${property}** has been rescheduled.\n\nOriginal time: ${oldStr}\nNew time: ${newStr}${dto.reason ? `\n\nReason: ${dto.reason}` : ''}\n\nPlease let us know if this new time does not work for you.\n\nKind regards,\nThe PRIBEC Team`,
    );

    await this.createInAppNotification(
      viewing.buyer_id,
      'viewing_rescheduled',
      `Viewing rescheduled — ${property}`,
      `Your viewing was moved from ${oldStr} to ${newStr}.`,
      viewingId,
      await this.getBuyerSelfCompanyId(viewing.buyer_id),
    );

    return rows[0];
  }

  // ──────────────────────────────────────────────────────────
  // GET BUYER'S OWN VIEWINGS
  // ──────────────────────────────────────────────────────────

  async getBuyerViewings(buyerId: string): Promise<(ViewingRecord & { property_title: string | null })[]> {
    return this.prisma.$queryRaw<(ViewingRecord & { property_title: string | null })[]>`
      SELECT v.*, p.title AS property_title
      FROM   property.viewings v
      LEFT JOIN property.properties p ON p.id = v.property_id
      WHERE  v.buyer_id = ${buyerId}::uuid
      ORDER  BY v.scheduled_at DESC
    `;
  }

  // ──────────────────────────────────────────────────────────
  // GET USER NOTIFICATIONS
  // ──────────────────────────────────────────────────────────

  async getNotifications(userId: string, companyId?: string | null): Promise<UserNotificationRecord[]> {
    if (companyId) {
      return this.prisma.$queryRaw<UserNotificationRecord[]>`
        SELECT * FROM identity.user_notifications
        WHERE  user_id   = ${userId}::uuid
          AND  company_id = ${companyId}::uuid
        ORDER  BY created_at DESC
        LIMIT  50
      `;
    }
    return this.prisma.$queryRaw<UserNotificationRecord[]>`
      SELECT * FROM identity.user_notifications
      WHERE  user_id    = ${userId}::uuid
        AND  company_id IS NULL
      ORDER  BY created_at DESC
      LIMIT  50
    `;
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.$queryRaw`
      UPDATE identity.user_notifications
      SET    read_at = NOW()
      WHERE  id = ${notificationId}::uuid
        AND  user_id = ${userId}::uuid
        AND  read_at IS NULL
    `;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.prisma.$queryRaw`
      UPDATE identity.user_notifications
      SET    read_at = NOW()
      WHERE  user_id = ${userId}::uuid
        AND  read_at IS NULL
    `;
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

  private async getBuyerSelfCompanyId(buyerId: string): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT c.id
      FROM   identity.company_members cm
      JOIN   identity.companies c ON c.id = cm.company_id
      WHERE  cm.user_id  = ${buyerId}::uuid
        AND  c.is_system = true
        AND  c.slug      = ${SELF_COMPANY_SLUG}
        AND  cm.status   = 'active'
      LIMIT 1
    `;
    return rows[0]?.id ?? null;
  }

  private async getUserContact(
    userId: string,
  ): Promise<{ email: string; full_name: string | null }> {
    const rows = await this.prisma.$queryRaw<Array<{ email: string; full_name: string | null }>>`
      SELECT email, CONCAT(first_name, ' ', last_name) AS full_name FROM identity.users WHERE id = ${userId}::uuid LIMIT 1
    `;
    return rows[0] ?? { email: '', full_name: null };
  }

  private async getPropertyTitle(propertyId: string): Promise<string> {
    const rows = await this.prisma.$queryRaw<Array<{ title: string }>>`
      SELECT title FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    return rows[0]?.title ?? 'the property';
  }

  private async getPropertyInfo(propertyId: string): Promise<{ title: string; company_id: string | null }> {
    const rows = await this.prisma.$queryRaw<Array<{ title: string; company_id: string | null }>>`
      SELECT title, company_id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    return rows[0] ?? { title: 'the property', company_id: null };
  }

  private async createInAppNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    resourceId?: string,
    companyId?: string | null,
  ): Promise<void> {
    const resId = resourceId ?? null;
    const coId = companyId ?? null;
    if (resId) {
      await this.prisma.$queryRaw`
        INSERT INTO identity.user_notifications (user_id, company_id, type, title, body, resource_type, resource_id)
        VALUES (${userId}::uuid, ${coId}::uuid, ${type}, ${title}, ${body}, 'viewing', ${resId}::uuid)
      `;
    } else {
      await this.prisma.$queryRaw`
        INSERT INTO identity.user_notifications (user_id, company_id, type, title, body, resource_type)
        VALUES (${userId}::uuid, ${coId}::uuid, ${type}, ${title}, ${body}, 'viewing')
      `;
    }
  }
}

