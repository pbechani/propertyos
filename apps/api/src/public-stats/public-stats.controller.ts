import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicStatsService, PlatformStats } from './public-stats.service';

@Controller('public')
export class PublicStatsController {
  constructor(private readonly statsService: PublicStatsService) {}

  /**
   * Returns aggregate platform metrics for display on the public homepage.
   * No authentication required. No PII is returned.
   * Rate limited to 30 requests/minute per IP (overrides global 100/min default).
   */
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('stats')
  async getStats(): Promise<Omit<PlatformStats, 'cachedAt'>> {
    return this.statsService.getStats();
  }
}
