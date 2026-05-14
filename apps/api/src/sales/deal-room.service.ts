// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Deal Room Service
// ─────────────────────────────────────────────────────────────────────────────
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { SendDealRoomMessageDto, MarkReadDto } from './sales-enhanced.dto';

/** Valid deal-room thread types */
export const THREAD_TYPES = [
  'offer_negotiation',
  'general',
  'conveyancer_only',
  'agent_only',
  'compliance',
] as const;

/** Role visibility rules per thread type */
const THREAD_VISIBILITY: Record<string, string[]> = {
  offer_negotiation: ['buyer', 'seller', 'agent'],
  general: ['buyer', 'seller', 'agent', 'conveyancer'],
  conveyancer_only: ['conveyancer'],
  agent_only: ['agent'],
  compliance: ['agent', 'conveyancer', 'admin'],
};

@Injectable()
export class DealRoomService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Send message ──────────────────────────────────────────────────────────

  async sendMessage(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: SendDealRoomMessageDto,
  ) {
    await this.assertSaleExists(saleId);
    const threadType = dto.threadType ?? 'general';
    this.assertRoleCanAccessThread(actorRoles, threadType);

    const visibleTo = THREAD_VISIBILITY[threadType] ?? ['agent', 'admin'];

    return this.prisma.dealRoomMessage.create({
      data: {
        saleId,
        otpId: dto.otpId ?? null,
        threadType,
        senderId: actorId,
        content: dto.content,
        attachments: (dto.attachments ?? []) as unknown as Prisma.InputJsonValue,
        visibleTo,
        readBy: { [actorId]: new Date().toISOString() },
      },
    });
  }

  // ── List messages (filtered to caller's visible threads) ──────────────────

  async listMessages(saleId: string, actorRoles: string[], otpId?: string) {
    await this.assertSaleExists(saleId);

    const accessibleThreads = Object.entries(THREAD_VISIBILITY)
      .filter(([, roles]) => actorRoles.some((r) => roles.includes(r)))
      .map(([type]) => type);

    return this.prisma.dealRoomMessage.findMany({
      where: {
        saleId,
        threadType: { in: accessibleThreads },
        ...(otpId ? { otpId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Mark message as read ──────────────────────────────────────────────────

  async markRead(saleId: string, messageId: string, actorId: string, _dto: MarkReadDto) {
    const msg = await this.prisma.dealRoomMessage.findFirst({
      where: { id: messageId, saleId },
    });
    if (!msg) throw new NotFoundException('Message not found');

    const readBy = (msg.readBy as Record<string, string>) ?? {};
    readBy[actorId] = new Date().toISOString();

    return this.prisma.dealRoomMessage.update({
      where: { id: messageId },
      data: { readBy },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private assertRoleCanAccessThread(roles: string[], threadType: string) {
    const allowed = THREAD_VISIBILITY[threadType];
    if (!allowed || !roles.some((r) => allowed.includes(r))) {
      throw new ForbiddenException(
        `Your role does not have access to the "${threadType}" thread`,
      );
    }
  }

  private async assertSaleExists(saleId: string) {
    const sale = await this.prisma.propertySale.findUnique({ where: { id: saleId } });
    if (!sale) throw new NotFoundException('Sale not found');
  }
}
