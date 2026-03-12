import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FeeCalculatorService } from './fee-calculator.service';
import { PrismaService } from '../database';

describe('FeeCalculatorService', () => {
  let service: FeeCalculatorService;
  let module: TestingModule;

  const ZA_TRANSFER_SCHEDULE = {
    id: 'fee-sched-uuid-001',
    currency: 'ZAR',
    vatRate: '0.15',
    scheduleName: 'LSSA Transfer Fee Scale 2024',
    bands: [
      { from: 0, to: 100000, base_fee: 1053, pct_over_from: 0 },
      { from: 100001, to: 200000, base_fee: 1580, pct_over_from: 0 },
      { from: 200001, to: 300000, base_fee: 2213, pct_over_from: 0 },
      { from: 300001, to: 500000, base_fee: 2741, pct_over_from: 0 },
      { from: 500001, to: null, base_fee: 17149, pct_over_from: 0.003 },
    ],
  };

  const mockPrisma = {
    feeSchedule: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        FeeCalculatorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FeeCalculatorService>(FeeCalculatorService);
    jest.clearAllMocks();
  });

  afterAll(() => module.close());

  describe('calculate()', () => {
    it('should calculate transfer fee for a price within a band', async () => {
      mockPrisma.feeSchedule.findMany.mockResolvedValue([ZA_TRANSFER_SCHEDULE]);

      const result = await service.calculate(250000, 'transfer', 'ZA');

      expect(result.purchasePrice).toBe(250000);
      expect(result.baseFee).toBe(2213);
      expect(result.vatRate).toBe(0.15);
      expect(result.vatAmount).toBe(Math.round(2213 * 0.15 * 100) / 100);
      expect(result.total).toBe(result.subtotal + result.vatAmount);
      expect(result.currency).toBe('ZAR');
      expect(result.feeType).toBe('transfer');
    });

    it('should calculate surcharge for open-ended (last) band', async () => {
      mockPrisma.feeSchedule.findMany.mockResolvedValue([ZA_TRANSFER_SCHEDULE]);

      const result = await service.calculate(4000000, 'transfer', 'ZA');

      // base_fee = 17149, surcharge = (4000000 - 500001) * 0.003
      const expectedSurcharge = Math.round((4000000 - 500001) * 0.003 * 100) / 100;
      expect(result.baseFee).toBe(17149);
      expect(result.percentageSurcharge).toBe(expectedSurcharge);
      expect(result.subtotal).toBe(Math.round((17149 + expectedSurcharge) * 100) / 100);
    });

    it('should throw NotFoundException when no fee schedule found', async () => {
      mockPrisma.feeSchedule.findMany.mockResolvedValue([]);

      await expect(service.calculate(500000, 'transfer', 'NG')).rejects.toThrow(NotFoundException);
    });

    it('should default to ZA when country is not supplied', async () => {
      mockPrisma.feeSchedule.findMany.mockResolvedValue([ZA_TRANSFER_SCHEDULE]);

      await service.calculate(100000, 'transfer');

      expect(mockPrisma.feeSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ country: 'ZA' }) }),
      );
    });

    it('should correctly round vatAmount and total to 2 decimal places', async () => {
      mockPrisma.feeSchedule.findMany.mockResolvedValue([ZA_TRANSFER_SCHEDULE]);

      const result = await service.calculate(150000, 'transfer', 'ZA');

      // 1580 * 0.15 = 237.00 exactly
      expect(result.vatAmount).toBe(237);
      expect(result.total).toBe(1817);
    });
  });
});
