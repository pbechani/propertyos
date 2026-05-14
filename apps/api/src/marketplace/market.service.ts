import { Injectable } from '@nestjs/common';
import { PrismaService as DatabaseService } from '../database';
import { MaterialPricesQueryDto, PriceTrendQueryDto } from './marketplace.dto';

@Injectable()
export class MarketService {
  constructor(private readonly prisma: DatabaseService) {}

  async getMaterialPrices(query: MaterialPricesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.category) where['materialCategory'] = { contains: query.category, mode: 'insensitive' };
    if (query.country) where['country'] = query.country.toUpperCase();
    if (query.priceTier) where['priceTier'] = query.priceTier;
    if (query.search) {
      where['OR'] = [
        { materialName: { contains: query.search, mode: 'insensitive' } },
        { materialCategory: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.materialPrice.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ materialCategory: 'asc' }, { recordedAt: 'desc' }],
      }),
      this.prisma.materialPrice.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getPriceTrends(query: PriceTrendQueryDto) {
    const days = query.days ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      materialName: { contains: query.materialName, mode: 'insensitive' },
      recordedAt: { gte: since },
    };
    if (query.country) where['country'] = query.country.toUpperCase();

    const records = await this.prisma.materialPrice.findMany({
      where,
      orderBy: { recordedAt: 'asc' },
      select: {
        priceTier: true,
        price: true,
        currency: true,
        recordedAt: true,
        region: true,
      },
    });

    // Group by priceTier for chart-ready output
    const trends: Record<string, { date: string; price: number; currency: string }[]> = {};
    for (const r of records) {
      if (!trends[r.priceTier]) trends[r.priceTier] = [];
      trends[r.priceTier].push({
        date: r.recordedAt.toISOString(),
        price: Number(r.price),
        currency: r.currency,
      });
    }

    return { materialName: query.materialName, country: query.country, days, trends };
  }
}
