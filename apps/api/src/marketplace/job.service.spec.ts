import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { PrismaService as DatabaseService } from '../database';
import { JOB_AUDIT_ACTIONS, JOB_MILESTONE_STATUS, JOB_QUOTE_STATUS, JOB_STATUS } from './job.constants';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  marketplaceJob: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  jobQuote: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  jobMilestone: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  jobConversation: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  jobMessage: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  contractorProfile: {
    updateMany: jest.fn(),
  },
};

const mockAudit = { log: jest.fn() };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeJob = (overrides: Record<string, unknown> = {}) => ({
  id: 'job-1',
  reference: 'JOB-0001',
  clientId: 'client-1',
  title: 'Fix my roof',
  description: '',
  category: 'roofing',
  status: JOB_STATUS.DRAFT,
  budgetMin: null,
  budgetMax: null,
  currency: 'USD',
  isUrgent: false,
  locationLat: null,
  locationLng: null,
  locationLabel: null,
  mediaUrls: [],
  createdAt: new Date('2025-01-01'),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('JobService', () => {
  let service: JobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: DatabaseService, useValue: mockPrisma },
        { provide: MarketplaceAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
    jest.clearAllMocks();


  });

  // ─── createJob ──────────────────────────────────────────────────────────

  describe('createJob', () => {
    it('creates a job with DRAFT status and emits audit event', async () => {
      const fakeJob = makeJob();
      mockPrisma.marketplaceJob.create.mockResolvedValue(fakeJob);

      const result = await service.createJob(
        { title: 'Fix my roof', category: 'roofing' } as any,
        'client-1',
        '127.0.0.1',
      );

      expect(result).toEqual(fakeJob);
      expect(mockPrisma.marketplaceJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: JOB_STATUS.DRAFT,
            clientId: 'client-1',
            title: 'Fix my roof',
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'job.created', resourceId: 'job-1' }),
      );
    });

    it('defaults currency to USD when not supplied', async () => {
      const fakeJob = makeJob();
      mockPrisma.marketplaceJob.create.mockResolvedValue(fakeJob);

      await service.createJob(
        { title: 'Fix my roof', category: 'roofing' } as any,
        'client-1',
      );

      expect(mockPrisma.marketplaceJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currency: 'USD' }),
        }),
      );
    });
  });

  // ─── publishJob ─────────────────────────────────────────────────────────

  describe('publishJob', () => {
    it('publishes a DRAFT job to OPEN status', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(makeJob());
      const updated = makeJob({ status: JOB_STATUS.OPEN });
      mockPrisma.marketplaceJob.update.mockResolvedValue(updated);

      const result = await service.publishJob('job-1', 'client-1');

      expect(result.status).toBe(JOB_STATUS.OPEN);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'job.published' }),
      );
    });

    it('throws ForbiddenException when requester is not the owner', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ clientId: 'other-client' }),
      );

      await expect(service.publishJob('job-1', 'client-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when job is not DRAFT', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.OPEN }),
      );

      await expect(service.publishJob('job-1', 'client-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when job does not exist', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(null);

      await expect(service.publishJob('nonexistent', 'client-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getJobById ─────────────────────────────────────────────────────────

  describe('getJobById', () => {
    it('returns job with quotes and milestones', async () => {
      const job = { ...makeJob(), quotes: [], milestones: [], conversation: null };
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(job);

      const result = await service.getJobById('job-1');
      expect(result).toEqual(job);
    });

    it('throws NotFoundException when job not found', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(null);

      await expect(service.getJobById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── cancelJob ──────────────────────────────────────────────────────────

  describe('cancelJob', () => {
    it('cancels an OPEN job', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.OPEN }),
      );
      const cancelled = makeJob({ status: JOB_STATUS.CANCELLED });
      mockPrisma.marketplaceJob.update.mockResolvedValue(cancelled);

      const result = await service.cancelJob('job-1', 'client-1');
      expect(result.status).toBe(JOB_STATUS.CANCELLED);
    });

    it('throws BadRequestException when job is already COMPLETED', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.COMPLETED }),
      );

      await expect(service.cancelJob('job-1', 'client-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when caller is not owner', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ clientId: 'someone-else' }),
      );

      await expect(service.cancelJob('job-1', 'client-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── submitQuote ────────────────────────────────────────────────────────

  describe('submitQuote', () => {
    const openJob = () => makeJob({ status: JOB_STATUS.OPEN });

    it('creates a quote for an OPEN job', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(openJob());
      mockPrisma.jobQuote.findFirst.mockResolvedValue(null);
      const quote = {
        id: 'quote-1',
        jobId: 'job-1',
        contractorId: 'contractor-1',
        price: 1000,
        status: JOB_QUOTE_STATUS.PENDING,
        submittedAt: new Date(),
      };
      mockPrisma.jobQuote.create.mockResolvedValue(quote);
      // Update job to QUOTING when first quote arrives
      mockPrisma.marketplaceJob.update.mockResolvedValue({ ...openJob(), status: JOB_STATUS.QUOTING });

      const result = await service.submitQuote(
        'job-1',
        { price: 1000 } as any,
        'contractor-1',
      );

      expect(result).toEqual(quote);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: JOB_AUDIT_ACTIONS.JOB_QUOTE_SUBMITTED }),
      );
    });

    it('throws BadRequestException when job is not OPEN', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.DRAFT }),
      );

      await expect(
        service.submitQuote('job-1', { price: 1000 } as any, 'contractor-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when contractor already submitted a quote', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(openJob());
      mockPrisma.jobQuote.findFirst.mockResolvedValue({ id: 'existing-quote' });

      await expect(
        service.submitQuote('job-1', { price: 1000 } as any, 'contractor-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── respondToQuote ─────────────────────────────────────────────────────

  describe('respondToQuote', () => {
    it('accepts a pending quote and updates job status to ASSIGNED', async () => {
      const job = makeJob({ status: JOB_STATUS.OPEN });
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(job);
      const quote = {
        id: 'quote-1',
        jobId: 'job-1',
        contractorId: 'contractor-1',
        status: JOB_QUOTE_STATUS.PENDING,
      };
      mockPrisma.jobQuote.findFirst.mockResolvedValue(quote);
      mockPrisma.jobQuote.update.mockResolvedValue({
        ...quote,
        status: JOB_QUOTE_STATUS.ACCEPTED,
      });
      mockPrisma.jobQuote.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.marketplaceJob.update.mockResolvedValue({
        ...job,
        status: JOB_STATUS.ASSIGNED,
      });

      const result = await service.respondToQuote(
        'job-1',
        'quote-1',
        { decision: 'ACCEPTED' } as any,
        'client-1',
      );

      expect(result.status).toBe(JOB_QUOTE_STATUS.ACCEPTED);
      expect(mockPrisma.marketplaceJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: JOB_STATUS.ASSIGNED }),
        }),
      );
    });

    it('throws ForbiddenException when caller is not job owner', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ clientId: 'other-client', status: JOB_STATUS.OPEN }),
      );

      await expect(
        service.respondToQuote('job-1', 'quote-1', { decision: 'ACCEPTED' } as any, 'client-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when quote does not exist', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.OPEN }),
      );
      mockPrisma.jobQuote.findFirst.mockResolvedValue(null);

      await expect(
        service.respondToQuote('job-1', 'missing', { decision: 'REJECTED' } as any, 'client-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when quote is not pending', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.OPEN }),
      );
      mockPrisma.jobQuote.findFirst.mockResolvedValue({
        id: 'quote-1',
        jobId: 'job-1',
        status: JOB_QUOTE_STATUS.ACCEPTED,
      });

      await expect(
        service.respondToQuote('job-1', 'quote-1', { decision: 'ACCEPTED' } as any, 'client-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── createMilestone ────────────────────────────────────────────────────

  describe('createMilestone', () => {
    it('creates a milestone for an ASSIGNED job', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.ASSIGNED }),
      );
      const milestone = { id: 'ms-1', title: 'Foundation', amount: 500 };
      mockPrisma.jobMilestone.create.mockResolvedValue(milestone);

      const result = await service.createMilestone(
        'job-1',
        { title: 'Foundation', amount: 500 } as any,
        'client-1',
      );

      expect(result).toEqual(milestone);
    });

    it('throws BadRequestException for non-ASSIGNED/IN_PROGRESS job', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.OPEN }),
      );

      await expect(
        service.createMilestone('job-1', { title: 'F', amount: 500 } as any, 'client-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── sendMessage ────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    it('sends a message and creates conversation if needed', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.ASSIGNED, assignedContractorId: 'contractor-1' }),
      );
      // No existing conversation → will create
      mockPrisma.jobConversation.findUnique.mockResolvedValue(null);
      mockPrisma.jobConversation.create.mockResolvedValue({ id: 'conv-1', jobId: 'job-1' });
      const message = {
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'Hello',
        senderId: 'client-1',
        createdAt: new Date(),
      };
      mockPrisma.jobMessage.create.mockResolvedValue(message);

      const result = await service.sendMessage(
        'job-1',
        { content: 'Hello' } as any,
        'client-1',
      );

      expect(result).toEqual(message);
    });

    it('throws NotFoundException when job does not exist', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage('missing', { content: 'hi' } as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when sender is not a participant', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.ASSIGNED, assignedContractorId: 'contractor-1', clientId: 'client-1' }),
      );

      await expect(
        service.sendMessage('job-1', { content: 'hi' } as any, 'random-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── startJob ───────────────────────────────────────────────────────────

  describe('startJob', () => {
    it('transitions ASSIGNED job to IN_PROGRESS', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.ASSIGNED, assignedContractorId: 'contractor-1' }),
      );
      const updated = makeJob({ status: JOB_STATUS.IN_PROGRESS });
      mockPrisma.marketplaceJob.update.mockResolvedValue(updated);

      const result = await service.startJob('job-1', 'contractor-1');
      expect(result.status).toBe(JOB_STATUS.IN_PROGRESS);
    });

    it('throws ForbiddenException when caller is not the assigned contractor', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.ASSIGNED, assignedContractorId: 'other-contractor' }),
      );

      await expect(service.startJob('job-1', 'contractor-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when job is not ASSIGNED', async () => {
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.OPEN, assignedContractorId: 'contractor-1' }),
      );

      await expect(service.startJob('job-1', 'contractor-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── completeJob ────────────────────────────────────────────────────────

  describe('completeJob', () => {
    it('completes an IN_PROGRESS job', async () => {
      // findUnique is called twice: once in requireJobOwner, once for status check
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.IN_PROGRESS }),
      );
      const completed = makeJob({ status: JOB_STATUS.COMPLETED });
      mockPrisma.marketplaceJob.update.mockResolvedValue(completed);
      mockPrisma.contractorProfile.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.completeJob('job-1', 'client-1');
      expect(result.status).toBe(JOB_STATUS.COMPLETED);
    });

    it('throws BadRequestException when job is not IN_PROGRESS', async () => {
      // Both findUnique calls return same ASSIGNED job (ownership passes, status fails)
      mockPrisma.marketplaceJob.findUnique.mockResolvedValue(
        makeJob({ status: JOB_STATUS.ASSIGNED }),
      );

      await expect(service.completeJob('job-1', 'client-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
