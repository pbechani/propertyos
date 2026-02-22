import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VaultService } from './vault.service';

describe('VaultService', () => {
  let service: VaultService;
  let module: TestingModule;

  const createMockConfigService = (overrides: Record<string, any> = {}) => ({
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        VAULT_ENABLED: false,
        VAULT_ADDR: 'http://localhost:8200',
        VAULT_TOKEN: 'test-token',
        ...overrides,
      };
      return config[key] ?? defaultValue;
    }),
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        VaultService,
        {
          provide: ConfigService,
          useValue: createMockConfigService(),
        },
      ],
    }).compile();

    service = module.get<VaultService>(VaultService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should initialize with provided options', () => {
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(false);
    });

    it('should handle disabled Vault', async () => {
      const result = await service.getSecret('test/path');
      expect(result).toBeNull();
    });
  });

  describe('with enabled Vault', () => {
    let enabledService: VaultService;
    let enabledModule: TestingModule;

    beforeEach(async () => {
      enabledModule = await Test.createTestingModule({
        providers: [
          VaultService,
          {
            provide: ConfigService,
            useValue: createMockConfigService({ VAULT_ENABLED: true }),
          },
        ],
      }).compile();

      enabledService = enabledModule.get<VaultService>(VaultService);
    });

    afterAll(async () => {
      if (enabledModule) {
        await enabledModule.close();
      }
    });

    it('should be defined when enabled', () => {
      expect(enabledService).toBeDefined();
    });

    it('should report enabled status', () => {
      expect(enabledService.isEnabled()).toBe(true);
    });
  });

  describe('cache operations', () => {
    it('should clear cache', () => {
      expect(() => service.clearCache()).not.toThrow();
    });
  });
});
