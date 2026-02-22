import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../database';
import { RedisService } from '../cache';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: PrismaService;
  let redis: RedisService;

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            healthCheck: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: RedisService,
          useValue: {
            healthCheck: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when all services are connected', async () => {
      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.checks.database.status).toBe('ok');
      expect(result.checks.database.message).toBe('Connected');
      expect(result.checks.redis.status).toBe('ok');
      expect(result.checks.redis.message).toBe('Connected');
      expect(result.checks.api.status).toBe('ok');
      expect(prisma.healthCheck).toHaveBeenCalled();
      expect(redis.healthCheck).toHaveBeenCalled();
    });

    it('should return error status when database is disconnected', async () => {
      jest.spyOn(prisma, 'healthCheck').mockResolvedValueOnce(false);

      const result = await service.check();

      expect(result.status).toBe('error');
      expect(result.checks.database.status).toBe('error');
      expect(result.checks.database.message).toBe('Disconnected');
    });

    it('should return error status when redis is disconnected', async () => {
      jest.spyOn(redis, 'healthCheck').mockResolvedValueOnce(false);

      const result = await service.check();

      expect(result.status).toBe('error');
      expect(result.checks.redis.status).toBe('error');
      expect(result.checks.redis.message).toBe('Disconnected');
    });

    it('should include timestamp and version', async () => {
      const result = await service.check();

      expect(result.timestamp).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkReadiness', () => {
    it('should return ready when all services are healthy', async () => {
      const result = await service.checkReadiness();

      expect(result.status).toBe('ok');
      expect(result.checks.database.status).toBe('ok');
      expect(result.checks.redis.status).toBe('ok');
    });

    it('should return not ready when database is unhealthy', async () => {
      jest.spyOn(prisma, 'healthCheck').mockResolvedValueOnce(false);

      const result = await service.checkReadiness();

      expect(result.status).toBe('error');
    });

    it('should return not ready when redis is unhealthy', async () => {
      jest.spyOn(redis, 'healthCheck').mockResolvedValueOnce(false);

      const result = await service.checkReadiness();

      expect(result.status).toBe('error');
    });
  });
});
