import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { PropertyAuditService } from './property-audit.service';
import { PrismaService } from '../database';

describe('FraudService', () => {
  let service: FraudService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockAudit = { log: jest.fn() };

  const reporterId = 'user-uuid-0001';
  const adminId = 'admin-uuid-0001';
  const propertyId = 'prop-uuid-0001';
  const reportId = 'report-uuid-0001';

  const baseReport = {
    id: reportId,
    property_id: propertyId,
    reporter_id: reporterId,
    report_type: 'fake_title',
    description: 'The title deed is forged',
    evidence_urls: [],
    status: 'submitted',
    created_at: new Date('2026-02-21'),
  };

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        FraudService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PropertyAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(FraudService);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a fraud report and flags the property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: propertyId }]); // property check
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseReport]);          // INSERT report
      mockPrisma.$executeRaw.mockResolvedValueOnce(1);                    // flag property

      await service.create(
        propertyId,
        reporterId,
        'buyer_seller',
        {
          reportType: 'fake_title',
          description: 'The title deed is forged',
          evidenceUrls: [],
        },
      );

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1); // flag property
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.fraud.reported' }),
      );
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.create(propertyId, reporterId, 'buyer_seller', {
          reportType: 'other',
          description: 'Some issue',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolve', () => {
    it('resolves a fraud report and logs audit', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: reportId, property_id: propertyId }]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...baseReport, status: 'resolved' }]);

      await service.resolve(
        reportId,
        adminId,
        { resolution: 'resolved', resolutionNotes: 'Confirmed fraudulent listing' },
      );

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.fraud.resolved' }),
      );
    });

    it('throws NotFoundException when report does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.resolve(reportId, adminId, { resolution: 'dismissed' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns paginated list with status filter', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseReport])
        .mockResolvedValueOnce([{ total: '1' }]);

      const result = await service.findAll({ status: 'submitted', limit: 10, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('throws BadRequestException for invalid status filter', async () => {
      await expect(
        service.findAll({ status: 'invalid-status' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
