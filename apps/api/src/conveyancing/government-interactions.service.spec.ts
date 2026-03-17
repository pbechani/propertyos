import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GovernmentInteractionsService } from './government-interactions.service';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { PrismaService } from '../database';

describe('GovernmentInteractionsService', () => {
  let service: GovernmentInteractionsService;
  let module: TestingModule;

  const mockAudit = { log: jest.fn() };
  const mockPrisma = { $queryRaw: jest.fn() };

  const FIRM_ID = 'firm-uuid-0001';
  const CASE_ID = 'case-uuid-0010';
  const ACTOR_ID = 'actor-uuid-0001';
  const INTERACTION_ID = 'interaction-uuid-0001';

  const baseCase = { id: CASE_ID, lifecycle_phase: 1, status: 'open' };

  const baseInteraction = {
    id: INTERACTION_ID,
    case_id: CASE_ID,
    department: 'deeds_office',
    interaction_type: 'submission',
    reference_number: 'DEEDS-2026-001',
    description: 'Lodge transfer documents',
    submitted_at: new Date('2026-03-10'),
    expected_response_at: new Date('2026-03-17'),
    resolved_at: null,
    status: 'submitted',
    notes: null,
    recorded_by: ACTOR_ID,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        GovernmentInteractionsService,
        { provide: ConveyancingAuditService, useValue: mockAudit },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GovernmentInteractionsService>(GovernmentInteractionsService);
    jest.resetAllMocks();
  });

  afterAll(() => module.close());

  // ── listInteractions ───────────────────────────────────────────────────────

  describe('listInteractions()', () => {
    it('should return all interactions for a case', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([baseInteraction]);

      const result = await service.listInteractions(CASE_ID);

      expect(result).toHaveLength(1);
      expect(result[0].department).toBe('deeds_office');
    });

    it('should return empty array when no interactions exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.listInteractions(CASE_ID, 'sars');

      expect(result).toEqual([]);
    });
  });

  // ── createInteraction ──────────────────────────────────────────────────────

  describe('createInteraction()', () => {
    const dto = {
      department: 'deeds_office',
      interactionType: 'submission',
      description: 'Lodge transfer docs',
      referenceNumber: 'DEEDS-2026-001',
    };

    it('should create an interaction and write audit log', async () => {
      // First call: assertCaseExists, second: insert
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: CASE_ID }])   // assertCaseExists
        .mockResolvedValueOnce([baseInteraction]);   // INSERT

      const result = await service.createInteraction(
        ACTOR_ID, 'conveyancer', FIRM_ID, CASE_ID, dto,
      );

      expect(result.id).toBe(INTERACTION_ID);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'gov_interaction.created' }),
      );
    });

    it('should throw NotFoundException when case does not belong to firm', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);  // assertCaseExists → not found

      await expect(
        service.createInteraction(ACTOR_ID, 'conveyancer', 'wrong-firm', CASE_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateInteraction ──────────────────────────────────────────────────────

  describe('updateInteraction()', () => {
    const dto = { status: 'approved', referenceNumber: 'DEEDS-2026-001-A' };

    it('should update status and write audit log', async () => {
      const updated = { ...baseInteraction, status: 'approved' };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: INTERACTION_ID }])  // assertInteractionExists
        .mockResolvedValueOnce([updated]);                 // UPDATE

      const result = await service.updateInteraction(
        ACTOR_ID, 'conveyancer', FIRM_ID, INTERACTION_ID, dto,
      );

      expect(result.status).toBe('approved');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'gov_interaction.updated' }),
      );
    });

    it('should throw NotFoundException for interaction not belonging to firm', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await expect(
        service.updateInteraction(ACTOR_ID, 'conveyancer', 'wrong-firm', INTERACTION_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── advanceLifecycle ───────────────────────────────────────────────────────

  describe('advanceLifecycle()', () => {
    const dto = { toPhase: 2, trigger: 'manual' as const, notes: 'Legal verification started' };

    it('should advance phase and record history', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseCase])                      // fetch case
        .mockResolvedValueOnce([{ id: 'hist-uuid-0001' }])     // INSERT history
        .mockResolvedValueOnce([]);                             // UPDATE case

      const result = await service.advanceLifecycle(
        ACTOR_ID, 'conveyancer', FIRM_ID, CASE_ID, dto,
      );

      expect(result.lifecyclePhase).toBe(2);
      expect(result.phaseName).toBe('Legal Verification');
      expect(result.historyId).toBe('hist-uuid-0001');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'case.lifecycle_advanced' }),
      );
    });

    it('should throw NotFoundException for invalid phase number', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseCase]);

      await expect(
        service.advanceLifecycle(
          ACTOR_ID, 'conveyancer', FIRM_ID, CASE_ID, { toPhase: 99, trigger: 'manual' },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when case not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await expect(
        service.advanceLifecycle(ACTOR_ID, 'conveyancer', 'wrong-firm', CASE_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getLifecycleHistory ────────────────────────────────────────────────────

  describe('getLifecycleHistory()', () => {
    it('should return lifecycle transitions in descending order', async () => {
      const history = [
        { id: 'h2', case_id: CASE_ID, from_phase: 1, to_phase: 2, to_status: 'open',
          triggered_by: ACTOR_ID, trigger: 'manual', created_at: new Date() },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(history);

      const result = await service.getLifecycleHistory(CASE_ID);

      expect(result).toHaveLength(1);
      expect(result[0].to_phase).toBe(2);
    });

    it('should return empty array for a brand new case', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getLifecycleHistory(CASE_ID);

      expect(result).toEqual([]);
    });
  });
});
