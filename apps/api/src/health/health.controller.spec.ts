import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            check: jest.fn().mockResolvedValue({
              status: 'ok',
              timestamp: new Date().toISOString(),
              version: '0.1.0',
              uptime: 100,
              checks: {
                api: { status: 'ok' },
                database: { status: 'ok', message: 'Connected' },
              },
            }),
            checkReadiness: jest.fn().mockResolvedValue({
              status: 'ok',
              timestamp: new Date().toISOString(),
              version: '0.1.0',
              uptime: 100,
              checks: {
                api: { status: 'ok' },
                database: { status: 'ok', message: 'Connected' },
              },
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status', async () => {
      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result.checks.database.status).toBe('ok');
      expect(service.check).toHaveBeenCalled();
    });
  });

  describe('ready', () => {
    it('should return readiness status', async () => {
      const result = await controller.ready();
      expect(result.status).toBe('ok');
      expect(service.checkReadiness).toHaveBeenCalled();
    });
  });

  describe('live', () => {
    it('should return liveness status', async () => {
      const result = await controller.live();
      expect(result.status).toBe('ok');
    });
  });
});
