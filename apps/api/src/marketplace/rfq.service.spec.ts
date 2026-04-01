import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RfqService } from './rfq.service';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { PrismaService as DatabaseService } from '../database';
import { QUOTE_STATUS, RFQ_STATUS } from './marketplace.constants';

const futureDt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const mockPrisma = {
  marketplaceRfq: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  marketplaceQuote: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  marketplaceContract: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAudit = { log: jest.fn() };

describe('RfqService', () => {
  let service: RfqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfqService,
        { provide: DatabaseService, useValue: mockPrisma },
        { provide: MarketplaceAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<RfqService>(RfqService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates an RFQ with a generated reference', async () => {
      const fakeRfq = { id: 'rfq-1', rfqReference: 'RFQ-2025-ABCDEF12', title: 'Foundation Work' };
      mockPrisma.marketplaceRfq.create.mockResolvedValue(fakeRfq);

      const result = await service.create(
        { rfqType: 'contractor', title: 'Foundation Work', deadlineForQuotes: futureDt },
        'user-1',
      );

      expect(result.rfqReference).toMatch(/^RFQ-\d{4}-/);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'rfq.created' }),
      );
    });
  });

  describe('findById', () => {
    it('returns RFQ with quotes', async () => {
      mockPrisma.marketplaceRfq.findUnique.mockResolvedValue({ id: 'rfq-1', quotes: [] });
      const result = await service.findById('rfq-1');
      expect(result.id).toBe('rfq-1');
    });

    it('throws NotFoundException for unknown RFQ', async () => {
      mockPrisma.marketplaceRfq.findUnique.mockResolvedValue(null);
      await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitQuote', () => {
    it('creates a quote for an open RFQ before deadline', async () => {
      const openRfq = {
        id: 'rfq-1',
        status: RFQ_STATUS.OPEN,
        deadlineForQuotes: futureDt,
      };
      mockPrisma.marketplaceRfq.findUnique.mockResolvedValue(openRfq);
      const fakeQuote = { id: 'q-1', totalAmount: 5000 };
      mockPrisma.marketplaceQuote.create.mockResolvedValue(fakeQuote);

      const result = await service.submitQuote(
        'rfq-1',
        { totalAmount: 5000, currency: 'USD', validityDays: 30 },
        'quoter-1',
      );
      expect(result).toEqual(fakeQuote);
    });

    it('throws NotFoundException when RFQ does not exist', async () => {
      mockPrisma.marketplaceRfq.findUnique.mockResolvedValue(null);
      await expect(
        service.submitQuote('bad', { totalAmount: 100, currency: 'USD' }, 'q-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when RFQ is not OPEN', async () => {
      mockPrisma.marketplaceRfq.findUnique.mockResolvedValue({
        id: 'rfq-1',
        status: RFQ_STATUS.AWARDED,
        deadlineForQuotes: futureDt,
      });
      await expect(
        service.submitQuote('rfq-1', { totalAmount: 100, currency: 'USD' }, 'q-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when quote deadline has passed', async () => {
      mockPrisma.marketplaceRfq.findUnique.mockResolvedValue({
        id: 'rfq-1',
        status: RFQ_STATUS.OPEN,
        deadlineForQuotes: new Date(Date.now() - 1000).toISOString(),
      });
      await expect(
        service.submitQuote('rfq-1', { totalAmount: 100, currency: 'USD' }, 'q-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptQuote', () => {
    it('throws NotFoundException when quote not found on RFQ', async () => {
      mockPrisma.marketplaceQuote.findFirst.mockResolvedValue(null);
      await expect(
        service.acceptQuote('rfq-1', 'q-bad', 'actor-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for non-acceptable quote state', async () => {
      mockPrisma.marketplaceQuote.findFirst.mockResolvedValue({
        id: 'q-1',
        rfqId: 'rfq-1',
        status: QUOTE_STATUS.REJECTED,
      });
      await expect(
        service.acceptQuote('rfq-1', 'q-1', 'actor-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listQuotes', () => {
    it('throws NotFoundException when RFQ does not exist', async () => {
      mockPrisma.marketplaceRfq.findUnique.mockResolvedValue(null);
      await expect(service.listQuotes('bad')).rejects.toThrow(NotFoundException);
    });

    it('returns quotes for a valid RFQ', async () => {
      mockPrisma.marketplaceRfq.findUnique.mockResolvedValue({ id: 'rfq-1' });
      const fakeQuotes = [{ id: 'q-1' }, { id: 'q-2' }];
      mockPrisma.marketplaceQuote.findMany.mockResolvedValue(fakeQuotes);

      const result = await service.listQuotes('rfq-1');
      expect(result).toHaveLength(2);
    });
  });
});
