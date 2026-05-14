// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Disbursement Service Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DisbursementService, calculateTransferDuty } from './disbursement.service';
import { SalesAuditService } from './sales-audit.service';
import { PrismaService } from '../database';

describe('calculateTransferDuty (SA SARS 2024/25)', () => {
  it('returns 0 for price ≤ R1,100,000', () => {
    expect(calculateTransferDuty(1_100_000)).toBe(0);
    expect(calculateTransferDuty(500_000)).toBe(0);
  });

  it('applies 3% on value above R1,100,000 up to R1,512,500', () => {
    // R1,200,000 → (100000 * 0.03) = 3000
    expect(calculateTransferDuty(1_200_000)).toBeCloseTo(3000);
  });

  it('applies progressive rates for higher values', () => {
    // R2,000,000: 12375 + (2000000 - 1512500) * 0.06 = 12375 + 29250 = 41625
    expect(calculateTransferDuty(2_000_000)).toBeCloseTo(41625);
  });

  it('charges 13% marginal rate above R12,100,000', () => {
    const base = calculateTransferDuty(12_100_000);
    const extra = calculateTransferDuty(13_100_000);
    expect(extra - base).toBeCloseTo(1_000_000 * 0.13);
  });
});

describe('DisbursementService', () => {
  let service: DisbursementService;
  let module: TestingModule;

  const mockAudit = { log: jest.fn() };
  const saleId = 'sale-uuid-0001';
  const instrId = 'instr-uuid-0001';
  const conveyancerId = 'conv-uuid-0001';

  const baseInstruction = {
    id: instrId,
    saleId,
    status: 'draft',
    totalProceeds: 1000000,
    netProceedsToSeller: 850000,
  };

  const mockPrisma = {
    propertySale: { findUnique: jest.fn() },
    disbursementInstruction: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        DisbursementService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SalesAuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(DisbursementService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ── createInstruction ──────────────────────────────────────────────────────

  describe('createInstruction', () => {
    const dto = {
      totalProceeds: 1000000,
      conveyancerFees: 50000,
      agentCommission: 100000,
    } as any;

    it('creates disbursement instruction for conveyancer', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.disbursementInstruction.create.mockResolvedValue(baseInstruction);

      const result = await service.createInstruction(
        saleId, conveyancerId, ['conveyancer'], dto,
      );

      expect(result).toEqual(baseInstruction);
      expect(mockPrisma.disbursementInstruction.create).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'disbursement.created' }),
      );
    });

    it('throws ForbiddenException for non-conveyancer', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });

      await expect(
        service.createInstruction(saleId, 'buyer-id', ['buyer'], dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when sale not found', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(null);

      await expect(
        service.createInstruction(saleId, conveyancerId, ['conveyancer'], dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── approveInstruction ────────────────────────────────────────────────────

  describe('approveInstruction', () => {
    it('approves a draft instruction', async () => {
      mockPrisma.disbursementInstruction.findFirst.mockResolvedValue(baseInstruction);
      const approved = { ...baseInstruction, status: 'approved_by_conveyancer' };
      mockPrisma.disbursementInstruction.update.mockResolvedValue(approved);

      const result = await service.approveInstruction(
        saleId, instrId, conveyancerId, ['conveyancer'], {},
      );

      expect(result.status).toBe('approved_by_conveyancer');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'disbursement.approved' }),
      );
    });

    it('throws BadRequestException when instruction is not draft', async () => {
      mockPrisma.disbursementInstruction.findFirst.mockResolvedValue({
        ...baseInstruction,
        status: 'approved_by_conveyancer',
      });

      await expect(
        service.approveInstruction(saleId, instrId, conveyancerId, ['conveyancer'], {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException for non-conveyancer', async () => {
      mockPrisma.disbursementInstruction.findFirst.mockResolvedValue(baseInstruction);

      await expect(
        service.approveInstruction(saleId, instrId, 'buyer-id', ['buyer'], {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException for missing instruction', async () => {
      mockPrisma.disbursementInstruction.findFirst.mockResolvedValue(null);

      await expect(
        service.approveInstruction(saleId, instrId, conveyancerId, ['conveyancer'], {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getInstruction ────────────────────────────────────────────────────────

  describe('getInstruction', () => {
    it('returns existing instruction', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.disbursementInstruction.findFirst.mockResolvedValue(baseInstruction);

      const result = await service.getInstruction(saleId);
      expect(result.id).toBe(instrId);
    });

    it('throws NotFoundException when no instruction exists', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.disbursementInstruction.findFirst.mockResolvedValue(null);

      await expect(service.getInstruction(saleId)).rejects.toThrow(NotFoundException);
    });
  });

  // ── calculateTransferDuty (instance method) ───────────────────────────────

  describe('calculateTransferDuty (service method)', () => {
    it('returns purchase price and computed duty', () => {
      const result = service.calculateTransferDuty(500_000);
      expect(result).toEqual({ purchasePrice: 500_000, transferDuty: 0 });
    });
  });
});
