import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConveyancingService } from './conveyancing.service';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { PrismaService } from '../database';

describe('ConveyancingService', () => {
  let service: ConveyancingService;
  let module: TestingModule;

  const mockAudit = { log: jest.fn() };

  const SALE_ID = 'sale-uuid-0001';
  const CASE_ID = 'case-uuid-0001';
  const FIRM_ID = 'firm-uuid-0001';
  const ACTOR_ID = 'actor-uuid-0001';
  const CONVEYANCER_ID = 'conv-uuid-0001';

  const baseCase = {
    id: CASE_ID,
    case_reference: 'ZA-CV-123456-0001',
    sale_id: SALE_ID,
    firm_id: FIRM_ID,
    lead_conveyancer_id: CONVEYANCER_ID,
    support_staff_ids: [],
    case_type: 'transfer',
    priority: 'normal',
    status: 'open',
    opened_at: new Date(),
    target_registration_date: null,
    actual_registration_date: null,
    country: 'ZA',
    notes: null,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    total_count: '1',
  };

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ConveyancingService,
        { provide: ConveyancingAuditService, useValue: mockAudit },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConveyancingService>(ConveyancingService);
    jest.clearAllMocks();
  });

  afterAll(() => module.close());

  // ── createCase ────────────────────────────────────────────────────────────

  describe('createCase()', () => {
    const createDto = {
      saleId: SALE_ID,
      firmId: FIRM_ID,
      leadConveyancerId: CONVEYANCER_ID,
      caseType: 'transfer',
    };

    it('should create a case successfully', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: SALE_ID }])   // sale exists
        .mockResolvedValueOnce([])                   // no existing case
        .mockResolvedValueOnce([baseCase]);           // INSERT RETURNING
      mockPrisma.$executeRaw.mockResolvedValue(1);   // seed tasks

      const result = await service.createCase(ACTOR_ID, 'conveyancer', createDto);

      expect(result.sale_id).toBe(SALE_ID);
      expect(result.firm_id).toBe(FIRM_ID);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'case.created' }),
      );
    });

    it('should throw NotFoundException when sale does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // sale missing

      await expect(
        service.createCase(ACTOR_ID, 'conveyancer', createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when case already exists for sale', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: SALE_ID }])     // sale exists
        .mockResolvedValueOnce([{ id: CASE_ID }]);     // duplicate case

      await expect(
        service.createCase(ACTOR_ID, 'conveyancer', createDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── getCase ───────────────────────────────────────────────────────────────

  describe('getCase()', () => {
    it('should return the case for matching firmId', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([baseCase]);

      const result = await service.getCase(['conveyancer'], CASE_ID, FIRM_ID);

      expect(result.id).toBe(CASE_ID);
    });

    it('should throw NotFoundException for unknown caseId', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await expect(service.getCase(['conveyancer'], 'nonexistent', FIRM_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when firmId does not match', async () => {
      const differentFirmCase = { ...baseCase, firm_id: 'other-firm-uuid' };
      mockPrisma.$queryRaw.mockResolvedValue([differentFirmCase]);

      await expect(service.getCase(['conveyancer'], CASE_ID, FIRM_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow admin to access any firm case', async () => {
      const otherFirmCase = { ...baseCase, firm_id: 'another-firm' };
      mockPrisma.$queryRaw.mockResolvedValue([otherFirmCase]);

      // admin has no firmId restriction
      const result = await service.getCase(['admin'], CASE_ID, undefined);
      expect(result.id).toBe(CASE_ID);
    });
  });

  // ── updateCase ────────────────────────────────────────────────────────────

  describe('updateCase()', () => {
    it('should update case status', async () => {
      const updatedCase = { ...baseCase, status: 'lodged' };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseCase])    // getCase
        .mockResolvedValueOnce([updatedCase]); // UPDATE RETURNING

      const result = await service.updateCase(
        ACTOR_ID, 'conveyancer', CASE_ID, FIRM_ID, { status: 'lodged' },
      );

      expect(result.status).toBe('lodged');
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'case.updated' }));
    });

    it('should throw ConflictException for invalid status', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseCase]);

      await expect(
        service.updateCase(ACTOR_ID, 'conveyancer', CASE_ID, FIRM_ID, { status: 'INVALID_STATUS' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
