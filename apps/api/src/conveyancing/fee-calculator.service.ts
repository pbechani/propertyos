import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';

export interface FeeBand {
  from: number;
  to: number | null;
  base_fee: number;
  pct_over_from: number;
}

export interface FeeCalculation {
  purchasePrice: number;
  baseFee: number;
  percentageSurcharge: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;
  feeType: string;
  scheduleId: string;
  scheduleName: string;
}

@Injectable()
export class FeeCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(
    purchasePrice: number,
    feeType: string,
    country: string = 'ZA',
  ): Promise<FeeCalculation> {
    const schedules = await (this.prisma as any).feeSchedule.findMany({
      where: { country, feeType, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
      take: 1,
    });

    if (!schedules.length) {
      throw new NotFoundException(`No active fee schedule for country=${country} feeType=${feeType}`);
    }

    const schedule = schedules[0];
    const bands = schedule.bands as FeeBand[];
    const vatRate = Number(schedule.vatRate);

    const band = this.findBand(bands, purchasePrice);
    if (!band) {
      throw new NotFoundException('Purchase price does not match any fee band');
    }

    const percentageSurcharge =
      band.to === null
        ? (purchasePrice - band.from) * band.pct_over_from
        : 0;

    const subtotal = Math.round((band.base_fee + percentageSurcharge) * 100) / 100;
    const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;

    return {
      purchasePrice,
      baseFee: band.base_fee,
      percentageSurcharge: Math.round(percentageSurcharge * 100) / 100,
      subtotal,
      vatRate,
      vatAmount,
      total,
      currency: schedule.currency,
      feeType,
      scheduleId: schedule.id,
      scheduleName: schedule.scheduleName,
    };
  }

  private findBand(bands: FeeBand[], price: number): FeeBand | undefined {
    return bands.find(
      (b) =>
        price >= b.from && (b.to === null || price <= b.to),
    );
  }
}
