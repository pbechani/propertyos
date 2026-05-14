import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PropertyConditionService, CreateAssessmentParams } from './property-condition.service';
import { PrismaService } from '../database';

describe('PropertyConditionService', () => {
  let service: PropertyConditionService;
  let module: TestingModule;

  const mockPrisma = { $queryRaw: jest.fn() };

  const agentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const propertyId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const otherId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  const baseParams: CreateAssessmentParams = {
    propertyId,
    submittedBy: agentId,
    inspectionDate: '2026-03-17',
    roomConditions: { kitchen: { status: 'good' } },
  };

  const baseAssessment = {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    property_id: propertyId,
    submitted_by: agentId,
    inspection_date: '2026-03-17',
    inspector_name: null,
    year_built: null,
    last_renovation: null,
    overall_notes: null,
    room_conditions: { kitchen: { status: 'good' } },
    created_at: '2026-03-17T00:00:00.000Z',
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        PropertyConditionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(PropertyConditionService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserts and returns the new assessment when caller is agent', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId, owner_id: null }]) // assertAccess
        .mockResolvedValueOnce([baseAssessment]);                        // INSERT

      const result = await service.create(baseParams);

      expect(result).toEqual(baseAssessment);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('inserts and returns the new assessment when caller is owner', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: null, owner_id: agentId }])
        .mockResolvedValueOnce([baseAssessment]);

      const result = await service.create(baseParams);

      expect(result).toEqual(baseAssessment);
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // no property row

      await expect(service.create(baseParams)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller is neither agent nor owner', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
      ]);

      await expect(service.create(baseParams)).rejects.toThrow(ForbiddenException);
    });

    it('passes optional fields through when provided', async () => {
      const params: CreateAssessmentParams = {
        ...baseParams,
        inspectorName: 'Jane Doe',
        yearBuilt: '2000',
        lastRenovation: '2020',
        overallNotes: 'All good',
      };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId, owner_id: null }])
        .mockResolvedValueOnce([{ ...baseAssessment, inspector_name: 'Jane Doe', year_built: '2000', last_renovation: '2020', overall_notes: 'All good' }]);

      const result = await service.create(params);

      expect(result.inspector_name).toBe('Jane Doe');
      expect(result.year_built).toBe('2000');
      expect(result.last_renovation).toBe('2020');
      expect(result.overall_notes).toBe('All good');
    });
  });

  // ─── list ──────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns assessments for owner', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: null, owner_id: agentId }]) // assertAccess
        .mockResolvedValueOnce([baseAssessment]);                        // SELECT

      const result = await service.list(propertyId, agentId);

      expect(result).toEqual([baseAssessment]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('returns empty array when no assessments exist', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId, owner_id: null }])
        .mockResolvedValueOnce([]);

      const result = await service.list(propertyId, agentId);

      expect(result).toEqual([]);
    });

    it('throws NotFoundException for unknown property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.list(propertyId, agentId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when requester has no access', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: otherId, owner_id: otherId },
      ]);

      await expect(service.list(propertyId, agentId)).rejects.toThrow(ForbiddenException);
    });
  });
});
