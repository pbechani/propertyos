import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  CommunicationLogService,
  CreateCommunicationLogParams,
  CommunicationLogRow,
} from './communication-log.service';
import { PrismaService } from '../database';

describe('CommunicationLogService', () => {
  let service: CommunicationLogService;
  let module: TestingModule;

  const mockPrisma = { $queryRaw: jest.fn() };

  const userId     = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const propertyId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const otherId    = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const logId      = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  const baseCreateParams: CreateCommunicationLogParams = {
    propertyId,
    loggedBy: userId,
    type: 'call-out',
    contactName: 'Alice Smith',
    contactRole: 'Prospective Buyer',
    contactEmail: 'alice@example.com',
    contactPhone: '555-1234',
    subject: 'Initial inquiry about pricing',
    summary: 'Discussed listing price and property features.',
    communicationDate: '2026-03-18T10:00:00.000Z',
    duration: '15 min',
    outcome: 'Positive - Follow-up scheduled',
    followUpRequired: true,
    followUpDetails: 'Send brochure',
    followUpDate: '2026-03-20',
    tags: ['pricing', 'buyer-call'],
  };

  const baseRow: CommunicationLogRow = {
    id: logId,
    property_id: propertyId,
    logged_by: userId,
    type: 'call-out',
    contact_name: 'Alice Smith',
    contact_role: 'Prospective Buyer',
    contact_email: 'alice@example.com',
    contact_phone: '555-1234',
    subject: 'Initial inquiry about pricing',
    summary: 'Discussed listing price and property features.',
    communication_date: '2026-03-18T10:00:00.000Z',
    duration: '15 min',
    outcome: 'Positive - Follow-up scheduled',
    follow_up_required: true,
    follow_up_details: 'Send brochure',
    follow_up_date: '2026-03-20',
    tags: ['pricing', 'buyer-call'],
    created_at: '2026-03-18T10:05:00.000Z',
    updated_at: '2026-03-18T10:05:00.000Z',
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CommunicationLogService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(CommunicationLogService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserts and returns the row when caller is the agent', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }]) // assertAccess
        .mockResolvedValueOnce([baseRow]);                              // INSERT

      const result = await service.create(baseCreateParams);

      expect(result).toEqual(baseRow);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('inserts and returns the row when caller is the owner', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: null, owner_id: userId }])
        .mockResolvedValueOnce([baseRow]);

      const result = await service.create(baseCreateParams);

      expect(result).toEqual(baseRow);
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.create(baseCreateParams)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException when caller has no access to the property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
      ]);

      await expect(service.create(baseCreateParams)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns logs for the property when caller has access', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])
        .mockResolvedValueOnce([baseRow]);

      const result = await service.list(propertyId, userId);

      expect(result).toEqual([baseRow]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('returns empty array when no logs exist', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])
        .mockResolvedValueOnce([]);

      const result = await service.list(propertyId, userId);

      expect(result).toEqual([]);
    });

    it('throws ForbiddenException when caller has no access', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
      ]);

      await expect(service.list(propertyId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates and returns the updated row', async () => {
      const updatedRow = { ...baseRow, subject: 'Updated subject', outcome: 'Neutral - Awaiting response' };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseRow])                                           // SELECT existing
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])             // assertAccess
        .mockResolvedValueOnce([updatedRow]);                                       // UPDATE

      const result = await service.update(logId, userId, {
        subject: 'Updated subject',
        outcome: 'Neutral - Awaiting response',
      });

      expect(result).toEqual(updatedRow);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('throws NotFoundException when log does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.update(logId, userId, { subject: 'X' })).rejects.toThrow(NotFoundException);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException when caller has no access to the property', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseRow])
        .mockResolvedValueOnce([
          { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
        ]);

      await expect(service.update(logId, userId, { subject: 'X' }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the log when caller has access', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseRow])                                // SELECT existing
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])  // assertAccess
        .mockResolvedValueOnce([]);                                      // DELETE

      await expect(service.delete(logId, userId)).resolves.toBeUndefined();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('throws NotFoundException when log does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.delete(logId, userId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller has no access to the property', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseRow])
        .mockResolvedValueOnce([
          { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
        ]);

      await expect(service.delete(logId, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});
