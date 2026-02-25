import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

const mockRedisClient = {
  ping: jest.fn().mockResolvedValue('PONG'),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  quit: jest.fn().mockResolvedValue('OK'),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisClient);
});

describe('RedisService', () => {
  let service: RedisService;

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'REDIS_URL') return 'redis://localhost:6379';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    it('should return true when Redis responds with PONG', async () => {
      mockRedisClient.ping.mockResolvedValueOnce('PONG');

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should return false when Redis ping fails', async () => {
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Connection error'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should retrieve value from Redis', async () => {
      mockRedisClient.get.mockResolvedValueOnce('test-value');

      const result = await service.get('test-key');

      expect(result).toBe('test-value');
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      mockRedisClient.set.mockResolvedValueOnce('OK');

      await service.set('test-key', 'test-value');

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
      );
    });

    it('should set value with TTL', async () => {
      mockRedisClient.set.mockResolvedValueOnce('OK');

      await service.set('test-key', 'test-value', 3600);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
        'EX',
        3600,
      );
    });
  });

  describe('del', () => {
    it('should delete key from Redis', async () => {
      mockRedisClient.del.mockResolvedValueOnce(1);

      await service.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedisClient.exists.mockResolvedValueOnce(1);

      const result = await service.exists('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key');
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValueOnce(0);

      const result = await service.exists('non-existent-key');

      expect(result).toBe(false);
    });
  });

  describe('JSON operations', () => {
    it('should set JSON value', async () => {
      mockRedisClient.set.mockResolvedValueOnce('OK');
      const testObject = { name: 'John', age: 30 };

      await service.setJson('user:1', testObject);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify(testObject),
      );
    });

    it('should set JSON value with TTL', async () => {
      mockRedisClient.set.mockResolvedValueOnce('OK');
      const testObject = { name: 'Jane', age: 25 };

      await service.setJson('user:2', testObject, 1800);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'user:2',
        JSON.stringify(testObject),
        'EX',
        1800,
      );
    });

    it('should get JSON value', async () => {
      const testObject = { name: 'John', age: 30 };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(testObject));

      const result = await service.getJson('user:1');

      expect(result).toEqual(testObject);
    });

    it('should return null when JSON key does not exist', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await service.getJson('user:999');

      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', async () => {
      mockRedisClient.get.mockResolvedValueOnce('invalid-json{');

      const result = await service.getJson('invalid-key');

      expect(result).toBeNull();
    });
  });

  describe('lifecycle methods', () => {
    it('should ping Redis on module init', async () => {
      mockRedisClient.ping.mockResolvedValueOnce('PONG');

      await service.onModuleInit();

      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should quit Redis connection on module destroy', async () => {
      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });

  describe('getClient', () => {
    it('should return Redis client instance', () => {
      const client = service.getClient();

      expect(client).toBeDefined();
      expect(client).toBe(mockRedisClient);
    });
  });
});
