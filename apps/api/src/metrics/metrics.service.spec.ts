import { Test, TestingModule } from '@nestjs/testing';
import { register } from 'prom-client';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    // Clear the registry before each test to avoid "already registered" errors
    register.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    // Initialize the metrics (this would normally be called by NestJS lifecycle)
    service.onModuleInit();
  });

  afterEach(() => {
    // Clear registry after each test
    register.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics string', async () => {
      const result = await service.getMetrics();

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should include process metrics', async () => {
      const metrics = await service.getMetrics();

      // Process metrics that should be present
      expect(metrics).toContain('process_cpu');
      expect(metrics).toContain('nodejs_heap');
    });

    it('should include Node.js version info', async () => {
      const metrics = await service.getMetrics();

      expect(metrics).toContain('nodejs_version_info');
    });

    it('should include custom HTTP metrics', async () => {
      const metrics = await service.getMetrics();

      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('active_connections');
    });
  });

  describe('recordHttpRequest', () => {
    it('should record HTTP request metrics', () => {
      expect(() => {
        service.recordHttpRequest('GET', '/api/v1/health', 200, 0.05);
      }).not.toThrow();
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        expect(() => {
          service.recordHttpRequest(method, '/api/v1/test', 200, 0.1);
        }).not.toThrow();
      });
    });

    it('should handle different status codes', () => {
      const statusCodes = [200, 201, 400, 401, 404, 500];

      statusCodes.forEach((code) => {
        expect(() => {
          service.recordHttpRequest('GET', '/api/v1/test', code, 0.1);
        }).not.toThrow();
      });
    });
  });

  describe('active connections tracking', () => {
    it('should increment active connections', () => {
      expect(() => {
        service.incrementActiveConnections();
      }).not.toThrow();
    });

    it('should decrement active connections', () => {
      expect(() => {
        service.decrementActiveConnections();
      }).not.toThrow();
    });

    it('should handle multiple connection changes', () => {
      expect(() => {
        service.incrementActiveConnections();
        service.incrementActiveConnections();
        service.decrementActiveConnections();
      }).not.toThrow();
    });
  });
});
