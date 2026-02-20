import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: {
            getMetrics: jest.fn().mockResolvedValue('# HELP test_metric Test metric\n# TYPE test_metric gauge\ntest_metric 1'),
          },
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      const result = await controller.getMetrics();

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(service.getMetrics).toHaveBeenCalled();
    });

    it('should return metrics with proper format', async () => {
      const metrics = await controller.getMetrics();

      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
    });
  });
});
