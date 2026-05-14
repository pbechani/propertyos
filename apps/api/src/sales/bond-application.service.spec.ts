// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Bond Application Service Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BondApplicationService } from './bond-application.service';
import { SalesAuditService } from './sales-audit.service';
import { PrismaService } from '../database';

describe('BondApplicationService', () => {
  let service: BondApplicationService;
  let module: TestingModule;

  const mockAudit = { log: jest.fn() };
  const saleId = 'sale-uuid-0001';
  const appId = 'app-uuid-0001';
  const buyerId = 'buyer-uuid-0001';

  const baseApp = {
    id: appId,
    saleId,
    buyerId,
    status: 'in_progress',
    banksAppliedTo: [],
    conditions: null,
    approvedAt: null,
  };

  const mockPrisma = {
    propertySale: { findUnique: jest.fn() },
    bondApplication: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        BondApplicationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SalesAuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(BondApplicationService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ── createBondApplication ──────────────────────────────────────────────────

  describe('createBondApplication', () => {
    const dto = { buyerId, loanAmount: 400000 } as any;

    it('creates a bond application for buyer', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.bondApplication.findFirst.mockResolvedValue(null); // no existing
      mockPrisma.bondApplication.create.mockResolvedValue(baseApp);

      const result = await service.createBondApplication(
        saleId, buyerId, ['buyer'], dto,
      );

      expect(result).toEqual(baseApp);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'bond_application.created' }),
      );
    });

    it('throws BadRequestException when application already exists', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.bondApplication.findFirst.mockResolvedValue(baseApp);

      await expect(
        service.createBondApplication(saleId, buyerId, ['buyer'], dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException for invalid role (seller)', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.bondApplication.findFirst.mockResolvedValue(null);

      await expect(
        service.createBondApplication(saleId, 'seller-id', ['seller'], dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when sale not found', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(null);

      await expect(
        service.createBondApplication(saleId, buyerId, ['buyer'], dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateBondApplication ─────────────────────────────────────────────────

  describe('updateBondApplication', () => {
    it('updates bond application status', async () => {
      mockPrisma.bondApplication.findFirst
        .mockResolvedValueOnce(baseApp) // findApp
        .mockResolvedValueOnce(baseApp); // findApp called internally
      const updated = { ...baseApp, status: 'approved' };
      mockPrisma.bondApplication.update.mockResolvedValue(updated);

      const result = await service.updateBondApplication(
        saleId, appId, buyerId, ['buyer'], { status: 'approved' } as any,
      );

      expect(result.status).toBe('approved');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'bond_application.updated' }),
      );
    });

    it('throws BadRequestException for invalid status', async () => {
      mockPrisma.bondApplication.findFirst.mockResolvedValue(baseApp);

      await expect(
        service.updateBondApplication(
          saleId, appId, buyerId, ['buyer'], { status: 'invalid' } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when application not found', async () => {
      mockPrisma.bondApplication.findFirst.mockResolvedValue(null);

      await expect(
        service.updateBondApplication(
          saleId, appId, buyerId, ['buyer'], {} as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getBondApplication ────────────────────────────────────────────────────

  describe('getBondApplication', () => {
    it('returns existing bond application', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.bondApplication.findFirst.mockResolvedValue(baseApp);

      const result = await service.getBondApplication(saleId);
      expect(result.id).toBe(appId);
    });

    it('throws NotFoundException when no application found', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue({ id: saleId });
      mockPrisma.bondApplication.findFirst.mockResolvedValue(null);

      await expect(service.getBondApplication(saleId)).rejects.toThrow(NotFoundException);
    });
  });
});
