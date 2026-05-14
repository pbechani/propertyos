// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Compliance Service Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { SalesAuditService } from './sales-audit.service';
import { PrismaService } from '../database';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let module: TestingModule;

  const mockAudit = { log: jest.fn() };
  const saleId = 'sale-uuid-0001';
  const reqId = 'req-uuid-0001';
  const conveyancerId = 'conv-uuid-0001';

  const baseReq = {
    id: reqId,
    saleId,
    certType: 'electrical',
    isRequired: true,
    status: 'pending',
  };

  const mockPrisma = {
    propertySale: { findUnique: jest.fn() },
    complianceRequirement: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SalesAuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(ComplianceService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ── setupRequirements ──────────────────────────────────────────────────────

  describe('setupRequirements', () => {
    const dto = {
      requirements: [
        { certType: 'electrical', isRequired: true },
        { certType: 'plumbing', isRequired: false },
      ],
    } as any;

    it('upserts all required cert types for conveyancer', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.complianceRequirement.upsert.mockResolvedValue(baseReq);

      const result = await service.setupRequirements(
        saleId, conveyancerId, ['conveyancer'], dto,
      );

      expect(result).toHaveLength(2);
      expect(mockPrisma.complianceRequirement.upsert).toHaveBeenCalledTimes(2);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'compliance.requirements_setup' }),
      );
    });

    it('throws ForbiddenException for non-conveyancer', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });

      await expect(
        service.setupRequirements(saleId, 'buyer-id', ['buyer'], dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when sale not found', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(null);

      await expect(
        service.setupRequirements(saleId, conveyancerId, ['conveyancer'], dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateCertStatus ──────────────────────────────────────────────────────

  describe('updateCertStatus', () => {
    it('updates cert status for conveyancer', async () => {
      mockPrisma.complianceRequirement.findFirst.mockResolvedValue(baseReq);
      const updated = { ...baseReq, status: 'received' };
      mockPrisma.complianceRequirement.update.mockResolvedValue(updated);

      const result = await service.updateCertStatus(
        saleId, 'electrical', conveyancerId, ['conveyancer'],
        { status: 'received' } as any,
      );

      expect(result.status).toBe('received');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'compliance.status_updated' }),
      );
    });

    it('throws NotFoundException when cert requirement not found', async () => {
      mockPrisma.complianceRequirement.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCertStatus(
          saleId, 'electrical', conveyancerId, ['conveyancer'],
          { status: 'received' } as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for non-conveyancer', async () => {
      mockPrisma.complianceRequirement.findFirst.mockResolvedValue(baseReq);

      await expect(
        service.updateCertStatus(
          saleId, 'electrical', 'buyer-id', ['buyer'],
          { status: 'received' } as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for invalid status', async () => {
      mockPrisma.complianceRequirement.findFirst.mockResolvedValue(baseReq);

      await expect(
        service.updateCertStatus(
          saleId, 'electrical', conveyancerId, ['conveyancer'],
          { status: 'invalid_status' } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getComplianceStatus ───────────────────────────────────────────────────

  describe('getComplianceStatus', () => {
    it('returns all requirements for a sale', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.complianceRequirement.findMany.mockResolvedValue([baseReq]);

      const result = await service.getComplianceStatus(saleId);
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException when sale not found', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(null);

      await expect(service.getComplianceStatus(saleId)).rejects.toThrow(NotFoundException);
    });
  });
});
