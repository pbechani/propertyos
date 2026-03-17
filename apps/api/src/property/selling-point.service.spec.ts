import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  SellingPointService,
  CreateSellingPointParams,
  SellingPointRow,
} from './selling-point.service';
import { PrismaService } from '../database';

describe('SellingPointService', () => {
  let service: SellingPointService;
  let module: TestingModule;

  const mockPrisma = { $queryRaw: jest.fn() };

  const userId     = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const propertyId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const otherId    = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const pointId    = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  const baseCreateParams: CreateSellingPointParams = {
    propertyId,
    createdBy: userId,
    title: 'Prime Location',
    description: 'Walking distance to schools and shopping centres.',
    priority: 'high',
    category: 'location',
    tags: ['location', 'schools'],
    showInListing: true,
    showInFlyer: true,
    showOnWebsite: true,
  };

  const baseRow: SellingPointRow = {
    id: pointId,
    property_id: propertyId,
    created_by: userId,
    title: 'Prime Location',
    description: 'Walking distance to schools and shopping centres.',
    priority: 'high',
    category: 'location',
    tags: ['location', 'schools'],
    show_in_listing: true,
    show_in_flyer: true,
    show_on_website: true,
    created_at: '2026-03-17T00:00:00.000Z',
    updated_at: '2026-03-17T00:00:00.000Z',
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        SellingPointService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(SellingPointService);
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
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns selling points for the property when caller has access', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }]) // assertAccess
        .mockResolvedValueOnce([baseRow]);                              // SELECT

      const result = await service.list(propertyId, userId);

      expect(result).toEqual([baseRow]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('returns empty array when no selling points exist', async () => {
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
      const updatedRow = { ...baseRow, title: 'Updated Title', property_id: propertyId };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ ...baseRow, property_id: propertyId }]) // SELECT existing
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])    // assertAccess
        .mockResolvedValueOnce([updatedRow]);                              // UPDATE

      const result = await service.update(pointId, userId, { title: 'Updated Title' });

      expect(result).toEqual(updatedRow);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('throws NotFoundException when selling point does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // no existing row

      await expect(service.update(pointId, userId, { title: 'X' })).rejects.toThrow(NotFoundException);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException when caller has no access to the property', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ ...baseRow, property_id: propertyId }]) // SELECT existing
        .mockResolvedValueOnce([
          { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
        ]); // assertAccess → forbidden

      await expect(service.update(pointId, userId, { title: 'X' }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the selling point when caller has access', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ ...baseRow, property_id: propertyId }]) // SELECT existing
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])    // assertAccess
        .mockResolvedValueOnce([]);                                        // DELETE

      await expect(service.delete(pointId, userId)).resolves.toBeUndefined();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('throws NotFoundException when selling point does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.delete(pointId, userId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller has no access to the property', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ ...baseRow, property_id: propertyId }])
        .mockResolvedValueOnce([
          { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
        ]);

      await expect(service.delete(pointId, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});
