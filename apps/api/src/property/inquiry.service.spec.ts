import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { PropertyAuditService } from './property-audit.service';
import { PrismaService } from '../database';

describe('InquiryService', () => {
  let service: InquiryService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockAudit = {
    log: jest.fn(),
  };

  const buyerId = 'buyer-uuid-0001';
  const agentId = 'agent-uuid-0001';
  const propertyId = 'prop-uuid-0001';
  const inquiryId = 'inq-uuid-0001';

  const baseInquiry = {
    id: inquiryId,
    property_id: propertyId,
    buyer_id: buyerId,
    inquiry_type: 'viewing',
    message: 'I would like to schedule a viewing',
    preferred_date: new Date('2026-03-01'),
    status: 'pending',
    created_at: new Date('2026-02-21'),
  };

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        InquiryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PropertyAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(InquiryService);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates an inquiry and logs audit', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId, agent_id: agentId }]) // property check
        .mockResolvedValueOnce([baseInquiry]); // INSERT

      const result = await service.create(
        propertyId,
        buyerId,
        'buyer_seller',
        {
          inquiryType: 'viewing',
          message: 'I would like to schedule a viewing',
          preferredDate: '2026-03-01T10:00:00Z',
        },
      );

      expect((result as typeof baseInquiry).inquiry_type).toBe('viewing');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.inquiry.created' }),
      );
    });

    it('throws NotFoundException when property is not active', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.create(propertyId, buyerId, 'buyer_seller', {
          inquiryType: 'question',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates an inquiry with contact preferences', async () => {
      const inquiryWithPrefs = {
        ...baseInquiry,
        preferred_contact_method: 'whatsapp',
        best_contact_time: 'morning',
      };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId, agent_id: agentId }])
        .mockResolvedValueOnce([inquiryWithPrefs]);

      const result = await service.create(
        propertyId,
        buyerId,
        'buyer_seller',
        {
          inquiryType: 'viewing',
          message: 'Looking to view',
          preferredContactMethod: 'whatsapp',
          bestContactTime: 'morning',
        },
      );

      expect((result as typeof inquiryWithPrefs).preferred_contact_method).toBe('whatsapp');
      expect((result as typeof inquiryWithPrefs).best_contact_time).toBe('morning');
    });

    it('creates an inquiry with null contact preferences when not provided', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId, agent_id: agentId }])
        .mockResolvedValueOnce([baseInquiry]);

      await service.create(
        propertyId,
        buyerId,
        'buyer_seller',
        { inquiryType: 'question' },
      );

      // The actual SQL will use NULL for missing preferences –
      // verify the audit was still logged (means create succeeded)
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.inquiry.created' }),
      );
    });
  });

  describe('respond', () => {
    it('marks inquiry as responded and stores response', async () => {
      const respondedInquiry = {
        ...baseInquiry,
        status: 'responded',
        response: 'Available this Saturday',
      };

      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: inquiryId, property_id: propertyId, status: 'pending' },
      ]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([respondedInquiry]);

      const result = await service.respond(
        inquiryId,
        agentId,
        'agent',
        { response: 'Available this Saturday' },
      );

      expect((result as typeof respondedInquiry).status).toBe('responded');
    });

    it('throws NotFoundException when inquiry not found or not authorized', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.respond(inquiryId, agentId, 'agent', { response: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProperty', () => {
    it('returns inquiries for agent-owned property', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId }]) // property check
        .mockResolvedValueOnce([baseInquiry])            // SELECT inquiries
        .mockResolvedValueOnce([{ total: '1' }]);         // COUNT

      const result = await service.findByProperty(propertyId, agentId, 'agent', {});
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('throws ForbiddenException when agent tries to see inquiries for another listing', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ agent_id: 'other-agent' }]);
      await expect(
        service.findByProperty(propertyId, agentId, 'agent', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
