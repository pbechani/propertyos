import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../database';

describe('ReportsService', () => {
  let service: ReportsService;
  let module: TestingModule;

  const mockPrisma = { $queryRaw: jest.fn() };

  const FIRM_ID = 'firm-uuid-0001';

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.resetAllMocks();
  });

  afterAll(() => module.close());

  // ── getTurnaroundReport ────────────────────────────────────────────────────

  describe('getTurnaroundReport()', () => {
    const row = {
      case_reference: 'ZA-CV-001',
      case_type: 'transfer',
      status: 'registered',
      lifecycle_phase: 11,
      opened_at: new Date('2026-01-01'),
      target_registration_date: new Date('2026-03-01'),
      actual_registration_date: new Date('2026-03-05'),
      days_open: 63,
    };

    it('should return turnaround rows for the firm', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([row]);

      const result = await service.getTurnaroundReport(FIRM_ID);

      expect(result).toHaveLength(1);
      expect(result[0].case_reference).toBe('ZA-CV-001');
      expect(result[0].days_open).toBe(63);
    });

    it('should accept optional date filters without throwing', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getTurnaroundReport(FIRM_ID, '2026-01-01', '2026-03-31');

      expect(result).toEqual([]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  // ── getOutstandingTasksReport ──────────────────────────────────────────────

  describe('getOutstandingTasksReport()', () => {
    const row = {
      case_id: 'case-uuid-0001',
      case_reference: 'ZA-CV-002',
      task_id: 'task-uuid-0001',
      title: 'Obtain rates clearance',
      due_date: new Date('2026-03-01'),
      status: 'pending',
      is_blocker: true,
      days_overdue: 12,
    };

    it('should return overdue blocker tasks first', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([row]);

      const result = await service.getOutstandingTasksReport(FIRM_ID);

      expect(result).toHaveLength(1);
      expect(result[0].is_blocker).toBe(true);
      expect(result[0].days_overdue).toBe(12);
    });

    it('should return empty array when all tasks are complete', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getOutstandingTasksReport(FIRM_ID);

      expect(result).toEqual([]);
    });
  });

  // ── getFeeCollectionReport ─────────────────────────────────────────────────

  describe('getFeeCollectionReport()', () => {
    const row = {
      case_reference: 'ZA-CV-003',
      invoice_type: 'attorney_fees',
      total_amount: '35000',
      paid_amount: '35000',
      outstanding_amount: '0',
      invoice_status: 'paid',
    };

    it('should return fee collection summary rows', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([row]);

      const result = await service.getFeeCollectionReport(FIRM_ID);

      expect(result).toHaveLength(1);
      expect(result[0].outstanding_amount).toBe('0');
      expect(result[0].invoice_status).toBe('paid');
    });

    it('should support month-range filtering without error', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getFeeCollectionReport(FIRM_ID, '2026-01-01', '2026-01-31');

      expect(result).toEqual([]);
    });
  });

  // ── getCaseloadReport ──────────────────────────────────────────────────────

  describe('getCaseloadReport()', () => {
    const row = {
      conveyancer_id: 'conv-uuid-0001',
      total_cases: '15',
      open_cases: '8',
      lodged_cases: '3',
      registered_cases: '2',
      closed_cases: '2',
    };

    it('should return caseload grouped by conveyancer', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([row]);

      const result = await service.getCaseloadReport(FIRM_ID);

      expect(result).toHaveLength(1);
      expect(result[0].total_cases).toBe('15');
      expect(result[0].conveyancer_id).toBe('conv-uuid-0001');
    });

    it('should return empty array when firm has no cases', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getCaseloadReport(FIRM_ID);

      expect(result).toEqual([]);
    });
  });
});
