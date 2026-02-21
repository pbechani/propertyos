import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database';
import { RedisService } from '../cache';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'ok' | 'error';
      message?: string;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const dbHealthy = await this.prisma.healthCheck();
    const redisHealthy = await this.redis.healthCheck();

    const dbStatus: 'ok' | 'error' = dbHealthy ? 'ok' : 'error';
    const redisStatus: 'ok' | 'error' = redisHealthy ? 'ok' : 'error';

    const checks = {
      api: { status: 'ok' as const },
      database: {
        status: dbStatus,
        message: dbHealthy ? 'Connected' : 'Disconnected',
      },
      redis: {
        status: redisStatus,
        message: redisHealthy ? 'Connected' : 'Disconnected',
      },
    };

    const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

    return {
      status: allHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }

  async checkReadiness(): Promise<HealthCheckResult> {
    return this.check();
  }
}
