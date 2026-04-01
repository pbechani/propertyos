import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService as DatabaseService } from '../database';
import { MarketplaceAuditService } from './marketplace-audit.service';
import {
  MARKETPLACE_AUDIT_ACTIONS,
  QUOTE_STATUS,
  RFQ_STATUS,
} from './marketplace.constants';
import {
  CreateRfqDto,
  RfqListQueryDto,
  SubmitQuoteDto,
} from './marketplace.dto';

@Injectable()
export class RfqService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly audit: MarketplaceAuditService,
  ) {}

  private generateRfqReference(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `RFQ-${year}-${random}`;
  }

  async create(dto: CreateRfqDto, actorId: string, ipAddress?: string) {
    const rfq = await this.prisma.marketplaceRfq.create({
      data: {
        rfqReference: this.generateRfqReference(),
        rfqType: dto.rfqType,
        projectId: dto.projectId,
        requesterId: actorId,
        title: dto.title,
        description: dto.description,
        scopeOfWork: dto.scopeOfWork,
        requiredSkills: (dto.requiredSkills as never) ?? [],
        siteLocation: (dto.siteLocation as never) ?? undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budgetEstimate: dto.budgetEstimate,
        currency: dto.currency ?? 'USD',
        deadlineForQuotes: new Date(dto.deadlineForQuotes),
      },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.RFQ_CREATED,
      resourceType: 'rfq',
      resourceId: rfq.id,
      payload: { rfqReference: rfq.rfqReference, title: rfq.title },
      ipAddress,
    });

    return rfq;
  }

  async findAll(query: RfqListQueryDto, requesterId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.rfqType) where['rfqType'] = query.rfqType;
    if (query.status) where['status'] = query.status;
    if (requesterId) where['requesterId'] = requesterId;

    const [data, total] = await Promise.all([
      this.prisma.marketplaceRfq.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { quotes: true } },
        },
      }),
      this.prisma.marketplaceRfq.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const rfq = await this.prisma.marketplaceRfq.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found.');
    return rfq;
  }

  async submitQuote(
    rfqId: string,
    dto: SubmitQuoteDto,
    quoterId: string,
    ipAddress?: string,
  ) {
    const rfq = await this.prisma.marketplaceRfq.findUnique({
      where: { id: rfqId },
    });
    if (!rfq) throw new NotFoundException('RFQ not found.');
    if (rfq.status !== RFQ_STATUS.OPEN) {
      throw new BadRequestException('RFQ is no longer accepting quotes.');
    }
    if (new Date() > new Date(rfq.deadlineForQuotes)) {
      throw new BadRequestException('The deadline for quotes has passed.');
    }

    const expiresAt = dto.validityDays
      ? new Date(Date.now() + dto.validityDays * 24 * 60 * 60 * 1000)
      : undefined;

    const quote = await this.prisma.marketplaceQuote.create({
      data: {
        rfqId,
        quoterId,
        totalAmount: dto.totalAmount,
        currency: dto.currency,
        laborAmount: dto.laborAmount,
        materialsAmount: dto.materialsAmount,
        overheadAmount: dto.overheadAmount,
        lineItems: (dto.lineItems as never) ?? [],
        timelineDays: dto.timelineDays,
        validityDays: dto.validityDays ?? 30,
        termsAndConditions: dto.termsAndConditions,
        notes: dto.notes,
        documents: (dto.documents as never) ?? [],
        expiresAt,
      },
    });

    await this.audit.log({
      actorId: quoterId,
      action: MARKETPLACE_AUDIT_ACTIONS.QUOTE_SUBMITTED,
      resourceType: 'quote',
      resourceId: quote.id,
      payload: { rfqId, totalAmount: dto.totalAmount, currency: dto.currency },
      ipAddress,
    });

    return quote;
  }

  async listQuotes(rfqId: string) {
    const rfq = await this.prisma.marketplaceRfq.findUnique({
      where: { id: rfqId },
    });
    if (!rfq) throw new NotFoundException('RFQ not found.');

    return this.prisma.marketplaceQuote.findMany({
      where: { rfqId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async acceptQuote(
    rfqId: string,
    quoteId: string,
    actorId: string,
    ipAddress?: string,
  ) {
    const quote = await this.prisma.marketplaceQuote.findFirst({
      where: { id: quoteId, rfqId },
    });
    if (!quote) throw new NotFoundException('Quote not found on this RFQ.');
    if (quote.status !== QUOTE_STATUS.SUBMITTED && quote.status !== QUOTE_STATUS.VIEWED) {
      throw new BadRequestException('Quote cannot be accepted in its current state.');
    }

    const rfq = await this.prisma.marketplaceRfq.findUnique({
      where: { id: rfqId },
    });

    const [updatedQuote] = await this.prisma.$transaction([
      this.prisma.marketplaceQuote.update({
        where: { id: quoteId },
        data: { status: QUOTE_STATUS.ACCEPTED },
      }),
      this.prisma.marketplaceRfq.update({
        where: { id: rfqId },
        data: { status: RFQ_STATUS.AWARDED, awardedTo: quote.quoterId },
      }),
      // Reject all other quotes
      this.prisma.marketplaceQuote.updateMany({
        where: { rfqId, id: { not: quoteId }, status: { not: QUOTE_STATUS.ACCEPTED } },
        data: { status: QUOTE_STATUS.REJECTED },
      }),
    ]);

    // Generate a contract for contractor RFQs
    if (rfq?.rfqType === 'contractor') {
      const contractRef = `CON-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await this.prisma.marketplaceContract.create({
        data: {
          contractReference: contractRef,
          quoteId,
          projectId: rfq.projectId,
          clientId: actorId,
          contractorId: quote.quoterId,
          contractValue: quote.totalAmount,
          currency: quote.currency,
        },
      });

      await this.audit.log({
        actorId,
        action: MARKETPLACE_AUDIT_ACTIONS.CONTRACT_GENERATED,
        resourceType: 'contract',
        payload: { rfqId, quoteId, contractRef },
        ipAddress,
      });
    }

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.QUOTE_ACCEPTED,
      resourceType: 'quote',
      resourceId: quoteId,
      payload: { rfqId },
      ipAddress,
    });

    return updatedQuote;
  }

  async rejectQuote(
    rfqId: string,
    quoteId: string,
    actorId: string,
    ipAddress?: string,
  ) {
    const quote = await this.prisma.marketplaceQuote.findFirst({
      where: { id: quoteId, rfqId },
    });
    if (!quote) throw new NotFoundException('Quote not found on this RFQ.');

    const updated = await this.prisma.marketplaceQuote.update({
      where: { id: quoteId },
      data: { status: QUOTE_STATUS.REJECTED },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.QUOTE_REJECTED,
      resourceType: 'quote',
      resourceId: quoteId,
      payload: { rfqId },
      ipAddress,
    });

    return updated;
  }
}
