import { Test, TestingModule } from '@nestjs/testing';
import { PropertyAuditService } from './property-audit.service';
import { PrismaService } from '../database';

describe('PropertyAuditService', () => {
  let service: PropertyAuditService;

  const mockPrisma = {
    $executeRawUnsafe: jest.fn(),
  };

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        PropertyAuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertyAuditService>(PropertyAuditService);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should execute raw SQL to insert an audit log', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValueOnce(1);

      const logData = {
        propertyId: 'prop-uuid-0001',
        action: 'property.created',
        actorId: 'user-uuid-0001',
        actorRole: 'agent',
        changes: { title: 'New Title' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      await service.log(logData);

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
      const callArgs = mockPrisma.$executeRawUnsafe.mock.calls[0];
      expect(callArgs[0]).toContain('INSERT INTO property.audit_logs');
    });

    it('should handle missing optional fields', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValueOnce(1);

      const logData = {
        propertyId: 'prop-uuid-0001',
        action: 'property.deleted',
        actorId: 'user-uuid-0001',
        actorRole: 'admin',
      };

      await service.log(logData);

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
    });
  });
});