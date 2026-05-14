import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../database';
import { DEFAULT_CURRENCY, FX_CACHE_KEY_PREFIX, FX_CACHE_TTL_SECONDS } from './financial.constants';

interface RateMap {
  [currency: string]: number;
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /** Returns exchange rate from `from` to `to`. Falls back to 1 if FX is unavailable. */
  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    const cacheKey = `${FX_CACHE_KEY_PREFIX}:${from}:${to}`;
    const cached = await this.redis.getJson<{ rate: number }>(cacheKey);
    if (cached) return cached.rate;

    const rate = await this.fetchRate(from, to);
    await this.redis.setJson(cacheKey, { rate }, FX_CACHE_TTL_SECONDS);
    await this.persistSnapshot(from, to, rate);
    return rate;
  }

  /** Converts `amount` from `fromCurrency` to `toCurrency`. */
  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const rate = await this.getRate(fromCurrency, toCurrency);
    return parseFloat((amount * rate).toFixed(8));
  }

  private async fetchRate(from: string, to: string): Promise<number> {
    const appId = this.config.get<string>('OPEN_EXCHANGE_RATES_APP_ID') ?? '';
    if (!appId) {
      this.logger.warn('OPEN_EXCHANGE_RATES_APP_ID not set — using rate 1.0 as fallback');
      return 1;
    }

    try {
      // OER base is always USD on free plan; convert through USD if needed
      const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=${DEFAULT_CURRENCY}`;
      const res = await fetch(url);
      if (!res.ok) {
        this.logger.error(`OER fetch failed: ${res.status} ${res.statusText}`);
        return 1;
      }
      const data = (await res.json()) as { rates: RateMap };
      const fromRate = from === DEFAULT_CURRENCY ? 1 : (data.rates[from] ?? 1);
      const toRate = to === DEFAULT_CURRENCY ? 1 : (data.rates[to] ?? 1);
      return toRate / fromRate;
    } catch (err) {
      this.logger.error(`OER fetch error: ${(err as Error).message}`);
      return 1;
    }
  }

  private async persistSnapshot(from: string, to: string, rate: number): Promise<void> {
    try {
      await this.prisma.exchangeRateSnapshot.create({
        data: { base: from, target: to, rate, source: 'open_exchange_rates' },
      });
    } catch (err) {
      this.logger.warn(`Could not persist FX snapshot: ${(err as Error).message}`);
    }
  }
}
