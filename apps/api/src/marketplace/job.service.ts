import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService as DatabaseService } from '../database';
import { MarketplaceAuditService } from './marketplace-audit.service';
import {
  JOB_AUDIT_ACTIONS,
  JOB_MILESTONE_STATUS,
  JOB_QUOTE_STATUS,
  JOB_STATUS,
} from './job.constants';
import {
  CreateJobDto,
  CreateJobQuoteDto,
  CreateMilestoneDto,
  JobListQueryDto,
  MarkReadDto,
  RespondToQuoteDto,
  SendMessageDto,
  UpdateJobDto,
  UpdateMilestoneStatusDto,
} from './job.dto';

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly audit: MarketplaceAuditService,
  ) {}

  // ─── Job CRUD ────────────────────────────────────────────────────────────

  async createJob(dto: CreateJobDto, clientId: string, ipAddress?: string) {
    const reference = await this.generateJobReference();

    const job = await this.prisma.marketplaceJob.create({
      data: {
        reference,
        clientId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationLabel: dto.locationLabel,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        currency: dto.currency ?? 'USD',
        isUrgent: dto.isUrgent ?? false,
        mediaUrls: (dto.mediaUrls as never) ?? [],
        status: JOB_STATUS.DRAFT,
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : undefined,
        scheduledEnd: dto.scheduledEnd
          ? new Date(dto.scheduledEnd)
          : undefined,
      },
    });

    await this.audit.log({
      actorId: clientId,
      action: JOB_AUDIT_ACTIONS.JOB_CREATED,
      resourceType: 'MarketplaceJob',
      resourceId: job.id,
      ipAddress,
    });

    return job;
  }

  async publishJob(jobId: string, clientId: string, ipAddress?: string) {
    const job = await this.requireJobOwner(jobId, clientId);

    if (job.status !== JOB_STATUS.DRAFT) {
      throw new BadRequestException('Only DRAFT jobs can be published');
    }

    const updated = await this.prisma.marketplaceJob.update({
      where: { id: jobId },
      data: { status: JOB_STATUS.OPEN },
    });

    await this.audit.log({
      actorId: clientId,
      action: JOB_AUDIT_ACTIONS.JOB_PUBLISHED,
      resourceType: 'MarketplaceJob',
      resourceId: jobId,
      ipAddress,
    });

    return updated;
  }

  async updateJob(
    jobId: string,
    dto: UpdateJobDto,
    clientId: string,
  ) {
    const job = await this.requireJobOwner(jobId, clientId);

    if (
      !([JOB_STATUS.DRAFT, JOB_STATUS.OPEN] as string[]).includes(
        job.status,
      )
    ) {
      throw new BadRequestException(
        'Only DRAFT or OPEN jobs can be edited',
      );
    }

    return this.prisma.marketplaceJob.update({
      where: { id: jobId },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationLabel: dto.locationLabel,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        isUrgent: dto.isUrgent,
        mediaUrls: dto.mediaUrls as never,
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : undefined,
        scheduledEnd: dto.scheduledEnd
          ? new Date(dto.scheduledEnd)
          : undefined,
      },
    });
  }

  async cancelJob(jobId: string, clientId: string, ipAddress?: string) {
    const job = await this.requireJobOwner(jobId, clientId);

    if (
      ([JOB_STATUS.COMPLETED, JOB_STATUS.CANCELLED] as string[]).includes(
        job.status,
      )
    ) {
      throw new BadRequestException('Job cannot be cancelled in its current status');
    }

    const updated = await this.prisma.marketplaceJob.update({
      where: { id: jobId },
      data: { status: JOB_STATUS.CANCELLED, cancelledAt: new Date() },
    });

    await this.audit.log({
      actorId: clientId,
      action: JOB_AUDIT_ACTIONS.JOB_CANCELLED,
      resourceType: 'MarketplaceJob',
      resourceId: jobId,
      ipAddress,
    });

    return updated;
  }

  async getJobById(jobId: string) {
    const job = await this.prisma.marketplaceJob.findUnique({
      where: { id: jobId },
      include: {
        quotes: { orderBy: { submittedAt: 'desc' } },
        milestones: { orderBy: { createdAt: 'asc' } },
        conversation: { include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } } },
      },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    return job;
  }

  async listJobs(query: JobListQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.category) where['category'] = query.category;
    if (query.status) {
      where['status'] = query.status;
    } else {
      where['status'] = JOB_STATUS.OPEN;
    }
    if (query.isUrgent !== undefined) where['isUrgent'] = query.isUrgent;

    const jobs = await this.prisma.marketplaceJob.findMany({
      where,
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
      take: query.limit ?? 20,
      skip: query.offset ?? 0,
      include: { _count: { select: { quotes: true } } },
    });

    // Client-side geo filter when lat/lng provided (avoids PostGIS requirement)
    if (query.lat !== undefined && query.lng !== undefined && query.radiusKm) {
      return jobs.filter((job) => {
        if (!job.locationLat || !job.locationLng) return true;
        const dist = haversineKm(
          query.lat!,
          query.lng!,
          Number(job.locationLat),
          Number(job.locationLng),
        );
        return dist <= (query.radiusKm ?? 50);
      });
    }

    return jobs;
  }

  async listClientJobs(clientId: string, status?: string) {
    return this.prisma.marketplaceJob.findMany({
      where: { clientId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { quotes: true } } },
    });
  }

  async listContractorJobs(contractorId: string, status?: string) {
    return this.prisma.marketplaceJob.findMany({
      where: { assignedContractorId: contractorId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { milestones: true },
    });
  }

  // ─── Quotes ───────────────────────────────────────────────────────────────

  async submitQuote(
    jobId: string,
    dto: CreateJobQuoteDto,
    contractorId: string,
    ipAddress?: string,
  ) {
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    if (job.status !== JOB_STATUS.OPEN && job.status !== JOB_STATUS.QUOTING) {
      throw new BadRequestException('Job is not accepting quotes');
    }

    if (job.clientId === contractorId) {
      throw new BadRequestException('Cannot quote on your own job');
    }

    const existing = await this.prisma.jobQuote.findFirst({
      where: { jobId, contractorId, status: JOB_QUOTE_STATUS.PENDING },
    });
    if (existing) {
      throw new BadRequestException('You already have a pending quote on this job');
    }

    const quote = await this.prisma.jobQuote.create({
      data: {
        jobId,
        contractorId,
        price: dto.price,
        laborAmount: dto.laborAmount,
        materialsAmount: dto.materialsAmount,
        breakdown: (dto.breakdown as never) ?? [],
        timelineDays: dto.timelineDays,
        message: dto.message,
        status: JOB_QUOTE_STATUS.PENDING,
      },
    });

    // Move job to QUOTING once first quote arrives
    if (job.status === JOB_STATUS.OPEN) {
      await this.prisma.marketplaceJob.update({
        where: { id: jobId },
        data: { status: JOB_STATUS.QUOTING },
      });
    }

    await this.audit.log({
      actorId: contractorId,
      action: JOB_AUDIT_ACTIONS.JOB_QUOTE_SUBMITTED,
      resourceType: 'JobQuote',
      resourceId: quote.id,
      payload: { jobId },
      ipAddress,
    });

    return quote;
  }

  async respondToQuote(
    jobId: string,
    quoteId: string,
    dto: RespondToQuoteDto,
    clientId: string,
    ipAddress?: string,
  ) {
    await this.requireJobOwner(jobId, clientId);

    const quote = await this.prisma.jobQuote.findFirst({ where: { id: quoteId, jobId } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== JOB_QUOTE_STATUS.PENDING) {
      throw new BadRequestException('Quote is no longer pending');
    }

    const updated = await this.prisma.jobQuote.update({
      where: { id: quoteId },
      data: { status: dto.decision, respondedAt: new Date() },
    });

    if (dto.decision === JOB_QUOTE_STATUS.ACCEPTED) {
      // Reject all other pending quotes and assign the job
      await this.prisma.jobQuote.updateMany({
        where: { jobId, id: { not: quoteId }, status: JOB_QUOTE_STATUS.PENDING },
        data: { status: JOB_QUOTE_STATUS.REJECTED, respondedAt: new Date() },
      });

      await this.prisma.marketplaceJob.update({
        where: { id: jobId },
        data: {
          status: JOB_STATUS.ASSIGNED,
          assignedContractorId: quote.contractorId,
        },
      });

      await this.audit.log({
        actorId: clientId,
        action: JOB_AUDIT_ACTIONS.JOB_ASSIGNED,
        resourceType: 'MarketplaceJob',
        resourceId: jobId,
        payload: { quoteId, contractorId: quote.contractorId },
        ipAddress,
      });
    } else {
      await this.audit.log({
        actorId: clientId,
        action: JOB_AUDIT_ACTIONS.JOB_QUOTE_REJECTED,
        resourceType: 'JobQuote',
        resourceId: quoteId,
        ipAddress,
      });
    }

    return updated;
  }

  async listJobQuotes(jobId: string, requesterId: string) {
    // Client sees all quotes; contractor sees only their own
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    if (job.clientId === requesterId) {
      return this.prisma.jobQuote.findMany({
        where: { jobId },
        orderBy: { submittedAt: 'desc' },
      });
    }

    return this.prisma.jobQuote.findMany({
      where: { jobId, contractorId: requesterId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // ─── Milestones ───────────────────────────────────────────────────────────

  async createMilestone(
    jobId: string,
    dto: CreateMilestoneDto,
    clientId: string,
  ) {
    const job = await this.requireJobOwner(jobId, clientId);

    if (
      !([JOB_STATUS.ASSIGNED, JOB_STATUS.IN_PROGRESS] as string[]).includes(
        job.status,
      )
    ) {
      throw new BadRequestException('Milestones can only be added to ASSIGNED or IN_PROGRESS jobs');
    }

    return this.prisma.jobMilestone.create({
      data: {
        jobId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        mediaUrls: (dto.mediaUrls as never) ?? [],
      },
    });
  }

  async updateMilestoneStatus(
    jobId: string,
    milestoneId: string,
    dto: UpdateMilestoneStatusDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const milestone = await this.prisma.jobMilestone.findFirst({
      where: { id: milestoneId, jobId },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    // Contractor completes; client approves
    const isClient = job.clientId === actorId;
    const isContractor = job.assignedContractorId === actorId;

    if (dto.status === JOB_MILESTONE_STATUS.COMPLETED && !isContractor) {
      throw new ForbiddenException('Only the assigned contractor can mark milestones complete');
    }
    if (dto.status === JOB_MILESTONE_STATUS.APPROVED && !isClient) {
      throw new ForbiddenException('Only the job client can approve milestones');
    }

    const timestamps: Record<string, Date> = {};
    if (dto.status === JOB_MILESTONE_STATUS.COMPLETED)
      timestamps.completedAt = new Date();
    if (dto.status === JOB_MILESTONE_STATUS.APPROVED)
      timestamps.approvedAt = new Date();

    const updated = await this.prisma.jobMilestone.update({
      where: { id: milestoneId },
      data: {
        status: dto.status,
        mediaUrls: dto.mediaUrls as never,
        ...timestamps,
      },
    });

    const auditAction =
      dto.status === JOB_MILESTONE_STATUS.COMPLETED
        ? JOB_AUDIT_ACTIONS.JOB_MILESTONE_COMPLETED
        : JOB_AUDIT_ACTIONS.JOB_MILESTONE_APPROVED;

    await this.audit.log({
      actorId,
      action: auditAction,
      resourceType: 'JobMilestone',
      resourceId: milestoneId,
      ipAddress,
    });

    return updated;
  }

  async listMilestones(jobId: string) {
    return this.prisma.jobMilestone.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Messaging ────────────────────────────────────────────────────────────

  async sendMessage(
    jobId: string,
    dto: SendMessageDto,
    senderId: string,
    ipAddress?: string,
  ) {
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    // Only client or assigned contractor can message
    if (job.clientId !== senderId && job.assignedContractorId !== senderId) {
      throw new ForbiddenException('You are not a participant in this job');
    }

    // Ensure conversation exists
    let conversation = await this.prisma.jobConversation.findUnique({
      where: { jobId },
    });

    if (!conversation) {
      const participants = [job.clientId];
      if (job.assignedContractorId) participants.push(job.assignedContractorId);
      conversation = await this.prisma.jobConversation.create({
        data: {
          jobId,
          participants: participants as never,
        },
      });
    }

    const message = await this.prisma.jobMessage.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content: dto.content,
        attachments: (dto.attachments as never) ?? [],
        readBy: [senderId] as never,
      },
    });

    await this.audit.log({
      actorId: senderId,
      action: JOB_AUDIT_ACTIONS.JOB_MESSAGE_SENT,
      resourceType: 'JobMessage',
      resourceId: message.id,
      payload: { jobId },
      ipAddress,
    });

    return message;
  }

  async getMessages(jobId: string, requesterId: string, limit = 50, before?: string) {
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    if (job.clientId !== requesterId && job.assignedContractorId !== requesterId) {
      throw new ForbiddenException('You are not a participant in this job');
    }

    const conversation = await this.prisma.jobConversation.findUnique({
      where: { jobId },
    });

    if (!conversation) return [];

    return this.prisma.jobMessage.findMany({
      where: {
        conversationId: conversation.id,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markMessagesRead(
    jobId: string,
    dto: MarkReadDto,
    userId: string,
  ) {
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    if (job.clientId !== userId && job.assignedContractorId !== userId) {
      throw new ForbiddenException('You are not a participant in this job');
    }

    // Update each message — append userId to readBy if not already present
    await Promise.all(
      dto.messageIds.map(async (msgId) => {
        const msg = await this.prisma.jobMessage.findUnique({ where: { id: msgId } });
        if (!msg) return;
        const readBy = (msg.readBy as string[]) ?? [];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
          await this.prisma.jobMessage.update({
            where: { id: msgId },
            data: { readBy: readBy as never },
          });
        }
      }),
    );

    return { updated: dto.messageIds.length };
  }

  // ─── Job Lifecycle Helpers ─────────────────────────────────────────────────

  async startJob(jobId: string, contractorId: string, ipAddress?: string) {
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    if (job.assignedContractorId !== contractorId) {
      throw new ForbiddenException('Only the assigned contractor can start the job');
    }

    if (job.status !== JOB_STATUS.ASSIGNED) {
      throw new BadRequestException('Job must be ASSIGNED before starting');
    }

    const updated = await this.prisma.marketplaceJob.update({
      where: { id: jobId },
      data: { status: JOB_STATUS.IN_PROGRESS },
    });

    await this.audit.log({
      actorId: contractorId,
      action: JOB_AUDIT_ACTIONS.JOB_STARTED,
      resourceType: 'MarketplaceJob',
      resourceId: jobId,
      ipAddress,
    });

    return updated;
  }

  async completeJob(jobId: string, clientId: string, ipAddress?: string) {
    await this.requireJobOwner(jobId, clientId);

    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (job?.status !== JOB_STATUS.IN_PROGRESS) {
      throw new BadRequestException('Job must be IN_PROGRESS to complete');
    }

    const updated = await this.prisma.marketplaceJob.update({
      where: { id: jobId },
      data: { status: JOB_STATUS.COMPLETED, completedAt: new Date() },
    });

    // Increment contractor's completed job count
    if (job.assignedContractorId) {
      await this.prisma.contractorProfile.updateMany({
        where: { userId: job.assignedContractorId },
        data: { totalJobsCompleted: { increment: 1 } },
      });
    }

    await this.audit.log({
      actorId: clientId,
      action: JOB_AUDIT_ACTIONS.JOB_COMPLETED,
      resourceType: 'MarketplaceJob',
      resourceId: jobId,
      ipAddress,
    });

    return updated;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async requireJobOwner(jobId: string, clientId: string) {
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (job.clientId !== clientId) {
      throw new ForbiddenException('You are not the owner of this job');
    }
    return job;
  }

  private async generateJobReference(): Promise<string> {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `JOB-${ts}-${rand}`;
  }
}

// ─── Haversine distance helper ────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
