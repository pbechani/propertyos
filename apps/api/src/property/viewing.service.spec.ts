import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ViewingService } from './viewing.service';
import { PropertyAuditService } from './property-audit.service';
import { PrismaService } from '../database';

describe('ViewingService', () => {
  let service: ViewingService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockAudit = { log: jest.fn() };

  const buyerId = '11111111-1111-1111-1111-111111111111';
  const agentId = '22222222-2222-2222-2222-222222222222';
  const propertyId = '33333333-3333-3333-3333-333333333333';
  const viewingId = '44444444-4444-4444-4444-444444444444';
  const openHouseId = '55555555-5555-5555-5555-555555555555';

  const baseViewing = {
    id: viewingId,
    property_id: propertyId,
    buyer_id: buyerId,
    agent_id: agentId,
    status: 'pending',
    scheduled_at: new Date('2026-08-01T10:00:00Z'),
    viewing_type: 'in_person',
    duration_minutes: 30,
    created_at: new Date(),
    updated_at: new Date(),
    confirmed_at: null,
    completed_at: null,
    cancelled_at: null,
    feedback_notes: null,
    rating: null,
  };

  const baseProperty = {
    id: propertyId,
    title: 'Test Property',
    agent_id: agentId,
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ViewingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PropertyAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ViewingService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  describe('request', () => {
    it('creates a viewing request and resolves agent from property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseProperty]); // property lookup
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseViewing]);  // INSERT

      const result = await service.request(propertyId, buyerId, {
        scheduledAt: '2026-08-01T10:00:00Z',
        viewingType: 'physical',
        durationMinutes: 30,
      });

      expect(result).toMatchObject({ id: viewingId, status: 'pending' });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'viewing.requested' }),
      );
    });

    it('throws NotFoundException if property not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // no property

      await expect(
        service.request(propertyId, buyerId, {
          scheduledAt: '2026-08-01T10:00:00Z',
          viewingType: 'physical',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirm', () => {
    it('confirms a requested viewing', async () => {
      const requestedViewing = { ...baseViewing, status: 'requested' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([requestedViewing]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...requestedViewing, status: 'confirmed', confirmed_at: new Date() },
      ]);

      const result = await service.confirm(viewingId, agentId, 'agent');

      expect(result).toMatchObject({ status: 'confirmed' });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'viewing.confirmed' }),
      );
    });

    it('throws ForbiddenException if non-agent tries to confirm', async () => {
      const stranger = '99999999-9999-9999-9999-999999999999';
      const requestedViewing = { ...baseViewing, status: 'requested' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([requestedViewing]);

      await expect(service.confirm(viewingId, stranger, 'agent')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('submitFeedback', () => {
    it('allows buyer to submit feedback on a confirmed viewing', async () => {
      const confirmedViewing = { ...baseViewing, status: 'confirmed' };
      const updatedViewing = { ...confirmedViewing, buyer_feedback: { rating: 4, notes: 'Great!' } };
      mockPrisma.$queryRaw.mockResolvedValueOnce([confirmedViewing]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([updatedViewing]);

      const result = await service.submitFeedback(viewingId, buyerId, {
        rating: 4,
        interested: true,
        notes: 'Great property!',
      });

      expect(result).toMatchObject({ buyer_feedback: { rating: 4 } });
    });

    it('throws ForbiddenException if someone other than buyer submits feedback', async () => {
      const stranger = '99999999-9999-9999-9999-999999999999';
      const confirmedViewing = { ...baseViewing, status: 'confirmed' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([confirmedViewing]);

      await expect(
        service.submitFeedback(viewingId, stranger, { rating: 3, notes: 'ok' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if viewing is not confirmed or completed', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseViewing]); // status: 'pending'

      await expect(
        service.submitFeedback(viewingId, buyerId, { rating: 3, notes: 'early' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerForOpenHouse', () => {
    const baseOpenHouse = {
      id: openHouseId,
      property_id: propertyId,
      agent_id: agentId,
      status: 'scheduled',
      starts_at: new Date('2026-09-01T10:00:00Z'),
      ends_at: new Date('2026-09-01T12:00:00Z'),
      max_attendees: 20,
    };

    it('registers a buyer for an open house', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseOpenHouse]);             // open house exists
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ cnt: BigInt(5) }]);        // 5 of 20 taken
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: 'reg-id', open_house_id: openHouseId, buyer_id: buyerId },
      ]);                                                                        // INSERT registration

      const result = await service.registerForOpenHouse(openHouseId, buyerId);

      expect(result).toMatchObject({ open_house_id: openHouseId });
    });

    it('throws ConflictException if buyer already registered (INSERT returns empty)', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseOpenHouse]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ cnt: BigInt(3) }]); // not full
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);                   // ON CONFLICT DO NOTHING

      await expect(
        service.registerForOpenHouse(openHouseId, buyerId),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if open house is at capacity', async () => {
      const fullHouse = { ...baseOpenHouse, max_attendees: 5 };
      mockPrisma.$queryRaw.mockResolvedValueOnce([fullHouse]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ cnt: BigInt(5) }]); // exactly at capacity

      await expect(
        service.registerForOpenHouse(openHouseId, buyerId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
