import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { StageService } from './stage.service';
import { SalesService } from './sales.service';
import { SalesAuditService } from './sales-audit.service';
import { PrismaService } from '../database';

describe('StageService', () => {
  let service: StageService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };
  const mockAudit = { log: jest.fn() };

  const saleId = 'sale-uuid-0001';
  const agentId = 'agent-uuid-0001';

  const baseSale = {
    id: saleId,
    property_id: 'prop-uuid-0001',
    sale_reference: 'SALE-20260302-ABCD',
    seller_id: 'seller-uuid-0001',
    buyer_id: null,
    agent_id: agentId,
    buyer_conveyancer_id: null,
    seller_conveyancer_id: null,
    agreed_price: '500000',
    currency: 'ZAR',
    deposit_amount: null,
    status: 'active',
    current_stage: 1,
    country: 'ZA',
    company_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const stageProgress1 = {
    id: 'sp-uuid-0001',
    sale_id: saleId,
    stage_number: 1,
    status: 'not_started',
    started_at: null,
    completed_at: null,
    completed_by: null,
    days_in_stage: null,
    notes: null,
  };

  const stageConfig1 = {
    stage_number: 1,
    stage_name: 'Offer Submitted',
    responsible_role: 'agent',
    is_blocker: false,
    government_dept: null,
    typical_duration_days: 2,
    required_documents: [],
  };

  const mockSalesService = {
    findSaleOrThrow: jest.fn(),
    assertParticipant: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        StageService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SalesService, useValue: mockSalesService },
        { provide: SalesAuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(StageService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── listStages ─────────────────────────────────────────

  describe('listStages', () => {
    it('returns stages with config metadata', async () => {
      mockSalesService.findSaleOrThrow.mockResolvedValue(baseSale);
      mockSalesService.assertParticipant.mockReturnValue(undefined);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...stageProgress1, ...stageConfig1 },
      ]);

      const result = await service.listStages(saleId, agentId, ['agent']);
      expect(Array.isArray(result)).toBe(true);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  // ─── startStage ─────────────────────────────────────────

  describe('startStage', () => {
    it('starts a not_started stage', async () => {
      mockSalesService.findSaleOrThrow.mockResolvedValue(baseSale);
      mockSalesService.assertParticipant.mockReturnValue(undefined);
      // NOTE: assertStageUnlocked short-circuits for stageNumber <= 1, no $queryRaw call
      // getStageOrThrow
      mockPrisma.$queryRaw.mockResolvedValueOnce([stageProgress1]);
      // UPDATE
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...stageProgress1, status: 'in_progress' }]);

      const result = await service.startStage(saleId, 1, agentId, ['agent'], {});

      expect((result as any).status).toBe('in_progress');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'sale.stage.started' }),
      );
    });

    it('throws ConflictException when transition is not allowed (stage already completed)', async () => {
      mockSalesService.findSaleOrThrow.mockResolvedValue(baseSale);
      mockSalesService.assertParticipant.mockReturnValue(undefined);
      // NOTE: no blocker check mock needed for stage=1 (short-circuits)
      // Stage already completed
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...stageProgress1, status: 'completed' }]);

      await expect(
        service.startStage(saleId, 1, agentId, ['agent'], {}),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when a prior blocker stage is incomplete', async () => {
      const sale5 = { ...baseSale, current_stage: 5 };
      mockSalesService.findSaleOrThrow.mockResolvedValue(sale5);
      mockSalesService.assertParticipant.mockReturnValue(undefined);
      // assertStageUnlocked calls $queryRaw for stageNumber > 1
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ stage_number: 4, status: 'in_progress' }]);

      await expect(
        service.startStage(saleId, 5, agentId, ['agent'], {}),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── completeStage ──────────────────────────────────────

  describe('completeStage', () => {
    const stageInProgress = { ...stageProgress1, status: 'in_progress' };

    it('completes a non-blocker stage and advances current_stage', async () => {
      mockSalesService.findSaleOrThrow.mockResolvedValue(baseSale);
      mockSalesService.assertParticipant.mockReturnValue(undefined);
      // getStageOrThrow
      mockPrisma.$queryRaw.mockResolvedValueOnce([stageInProgress]);
      // getStageConfig
      mockPrisma.$queryRaw.mockResolvedValueOnce([stageConfig1]);
      // UPDATE stage
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...stageInProgress, status: 'completed' }]);
      mockPrisma.$executeRaw.mockResolvedValue(1); // advance stage

      const result = await service.completeStage(saleId, 1, agentId, ['agent'], {});
      expect((result as any).status).toBe('completed');
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('marks sale as completed when stage 14 is completed', async () => {
      const sale14 = { ...baseSale, current_stage: 14 };
      const stage14InProgress = {
        id: 'sp-uuid-0014',
        sale_id: saleId,
        stage_number: 14,
        status: 'in_progress',
        started_at: new Date(),
        completed_at: null,
        completed_by: null,
        days_in_stage: null,
        notes: null,
      };
      const config14 = {
        stage_number: 14,
        stage_name: 'Final Payment & Handover',
        responsible_role: 'conveyancer',
        is_blocker: false,
        government_dept: null,
        typical_duration_days: 1,
        required_documents: [],
      };

      mockSalesService.findSaleOrThrow.mockResolvedValue(sale14);
      mockSalesService.assertParticipant.mockReturnValue(undefined);
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([stage14InProgress])                                   // getStageOrThrow
        .mockResolvedValueOnce([config14])                                             // getStageConfig
        .mockResolvedValueOnce([{ ...stage14InProgress, status: 'completed' }]);       // UPDATE
      mockPrisma.$executeRaw.mockResolvedValue(1); // mark sale as completed

      const result = await service.completeStage(saleId, 14, agentId, ['agent'], {});
      expect((result as any).status).toBe('completed');
      // $executeRaw called once (mark sale as completed)
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException for blocker stage with missing docs', async () => {
      const blockerConfig = { ...stageConfig1, is_blocker: true };
      mockSalesService.findSaleOrThrow.mockResolvedValue(baseSale);
      mockSalesService.assertParticipant.mockReturnValue(undefined);
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([stageInProgress])     // getStageOrThrow
        .mockResolvedValueOnce([blockerConfig])        // getStageConfig
        .mockResolvedValueOnce([{ count: '2' }]);      // missing docs count

      await expect(
        service.completeStage(saleId, 1, agentId, ['agent'], {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── flagStage ──────────────────────────────────────────

  describe('flagStage', () => {
    it('flags a stage and creates a sale issue', async () => {
      mockSalesService.findSaleOrThrow.mockResolvedValue(baseSale);
      mockSalesService.assertParticipant.mockReturnValue(undefined);
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'issue-uuid-001', status: 'open' }]);

      const result = await service.flagStage(saleId, 1, agentId, ['agent'], {
        issueType: 'missing_doc',
        description: 'Title deed not yet uploaded',
      });

      expect(result).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'sale.stage.flagged' }),
      );
    });
  });
});
