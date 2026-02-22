import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return true when database is connected', async () => {
      // Mock the $queryRaw method
      jest
        .spyOn(service, '$queryRaw')
        .mockResolvedValueOnce([{ '?column?': 1 }]);

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(service.$queryRaw).toHaveBeenCalled();
    });

    it('should return false when database query fails', async () => {
      jest
        .spyOn(service, '$queryRaw')
        .mockRejectedValueOnce(new Error('Connection error'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('cleanDatabase', () => {
    it('should throw error in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await expect(service.cleanDatabase()).rejects.toThrow(
        'Cannot clean database in production',
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should execute in non-production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      await expect(service.cleanDatabase()).resolves.not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('lifecycle methods', () => {
    it('should connect on module init', async () => {
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockResolvedValueOnce();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });

    it('should disconnect on module destroy', async () => {
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValueOnce();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should throw error when connection fails', async () => {
      jest
        .spyOn(service, '$connect')
        .mockRejectedValueOnce(new Error('Connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });
  });
});
