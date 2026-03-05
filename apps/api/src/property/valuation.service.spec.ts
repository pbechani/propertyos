import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ValuationService } from './valuation.service';
import { PropertyAuditService } from './property-audit.service';
import { PrismaService } from '../database';

describe('ValuationService', () => {
  let service: ValuationService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockAudit = { log: jest.fn() };

  const ownerId = '11111111-1111-1111-1111-111111111111';
  const valuerId = '22222222-2222-2222-2222-222222222222';
  const propertyId = '33333333-3333-3333-3333-333333333333';
  const valuationId = '44444444-4444-4444-4444-444444444444';

  const baseValuation = {
    id: valuationId,
    property_id: propertyId,
    requested_by: ownerId,
    valuer_id: valuerId,
    status: 'requested',
    purpose: 'sale',
    created_at: new Date(),
    updated_at: new Date(),
    formal_value: null,
    lower_bound: null,
    upper_bound: null,
    report_url: null,
    methodology: null,
    conducted_at: null,
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ValuationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PropertyAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ValuationService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  describe('requestValuation', () => {
    it('creates a new valuation request', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: propertyId }]); // property exists
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseValuation]);       // INSERT

      const result = await service.requestValuation(propertyId, ownerId, 'buyer_seller', {
        valuationType: 'cma',
        estimatedValue: 1200000,
        currency: 'ZAR',
        valuationDate: '2026-06-15',
        methodology: 'comparative',
      });

      expect(result).toMatchObject({ id: valuationId });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'valuation.requested' }),
      );
    });

    it('throws NotFoundException if property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // no property

      await expect(
        service.requestValuation(propertyId, ownerId, 'buyer_seller', {
          valuationType: 'cma',
          estimatedValue: 1200000,
          currency: 'ZAR',
          valuationDate: '2026-06-15',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitReport', () => {
    it('submits a valuation report when valuer owns it', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...baseValuation, valuer_id: valuerId }]); // existing valuation
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...baseValuation, report_document_url: 'https://example.com/report.pdf' },
      ]);

      const result = await service.submitReport(valuationId, valuerId, 'valuer', {
        reportDocumentUrl: 'https://example.com/report.pdf',
        isBankAccepted: true,
      });

      expect(result).toMatchObject({ report_document_url: 'https://example.com/report.pdf' });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'valuation.report_submitted' }),
      );
    });

    it('throws NotFoundException if valuation not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        service.submitReport(valuationId, valuerId, 'valuer', {
          reportDocumentUrl: 'https://example.com/r.pdf',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if valuer does not own the valuation', async () => {
      const otherValuerId = '99999999-9999-9999-9999-999999999999';
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...baseValuation, valuer_id: valuerId }]);

      await expect(
        service.submitReport(valuationId, otherValuerId, 'valuer', {
          reportDocumentUrl: 'https://example.com/r.pdf',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
