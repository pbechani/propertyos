import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database';
import { SalesAuditService } from './sales-audit.service';
import { SalesService } from './sales.service';
import { SendMessageDto } from './sales.dto';
import { resolveSalesActorRole } from './sales.constants';

type MessageRow = {
  id: string;
  sale_id: string;
  sender_id: string;
  message: string;
  attachments: unknown;
  visible_to_roles: unknown;
  created_at: Date;
};

@Injectable()
export class SaleMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sales: SalesService,
    private readonly audit: SalesAuditService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // Send a message
  // ─────────────────────────────────────────────────────────

  async send(
    saleId: string,
    senderId: string,
    senderRoles: string[],
    dto: SendMessageDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MessageRow> {
    const sale = await this.sales.findSaleOrThrow(saleId);
    this.sales.assertParticipant(sale, senderId, senderRoles);

    const visibleToRoles = dto.visibleToRoles ?? ['buyer', 'seller', 'agent', 'conveyancer'];
    const attachments = dto.attachments ?? [];

    const [msg] = await this.prisma.$queryRaw<MessageRow[]>`
      INSERT INTO sales.sale_messages (sale_id, sender_id, message, attachments, visible_to_roles)
      VALUES (
        ${saleId}::uuid,
        ${senderId}::uuid,
        ${dto.message},
        ${JSON.stringify(attachments)}::jsonb,
        ${JSON.stringify(visibleToRoles)}::jsonb
      )
      RETURNING *
    `;

    await this.audit.log({
      actorId: senderId,
      actorRole: resolveSalesActorRole(senderRoles),
      action: 'sale.message.sent',
      resourceType: 'property_sale',
      resourceId: saleId,
      ipAddress,
      userAgent,
    });

    return msg;
  }

  // ─────────────────────────────────────────────────────────
  // List messages (role-filtered)
  // ─────────────────────────────────────────────────────────

  async list(
    saleId: string,
    requesterId: string,
    requesterRoles: string[],
  ): Promise<MessageRow[]> {
    const sale = await this.sales.findSaleOrThrow(saleId);
    this.sales.assertParticipant(sale, requesterId, requesterRoles);

    const actorRole = resolveSalesActorRole(requesterRoles);

    // Admins see everything; others only see messages visible to their role
    if (actorRole === 'admin') {
      return this.prisma.$queryRaw<MessageRow[]>`
        SELECT * FROM sales.sale_messages
        WHERE sale_id = ${saleId}::uuid
        ORDER BY created_at ASC
      `;
    }

    return this.prisma.$queryRaw<MessageRow[]>`
      SELECT * FROM sales.sale_messages
      WHERE sale_id = ${saleId}::uuid
        AND visible_to_roles @> ${JSON.stringify([actorRole])}::jsonb
      ORDER BY created_at ASC
    `;
  }
}
