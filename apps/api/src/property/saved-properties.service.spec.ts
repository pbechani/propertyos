import { Test, TestingModule } from '@nestjs/testing';
import { SavedPropertiesService } from './saved-properties.service';
import { PrismaService } from '../database';

describe('SavedPropertiesService', () => {
  let service: SavedPropertiesService;

  const mockPrisma = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        SavedPropertiesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SavedPropertiesService>(SavedPropertiesService);
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

  describe('save', () => {
    it('should execute raw SQL to insert a saved property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'prop-uuid-0001' }]);
      mockPrisma.$executeRaw.mockResolvedValueOnce(1);

      await service.save('user-uuid-0001', 'prop-uuid-0001');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      const callArgs = mockPrisma.$executeRaw.mock.calls[0][0];
      expect(callArgs[0]).toContain('INSERT INTO property.saved_properties');
    });
  });

  describe('unsave', () => {
    it('should execute raw SQL to delete a saved property', async () => {
      mockPrisma.$executeRaw.mockResolvedValueOnce(1);

      await service.unsave('user-uuid-0001', 'prop-uuid-0001');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      const callArgs = mockPrisma.$executeRaw.mock.calls[0][0];
      expect(callArgs[0]).toContain('DELETE FROM property.saved_properties');
    });
  });

  describe('findSavedByUser', () => {
    it('should execute raw SQL to select saved properties', async () => {
      const mockProperties = [{ id: 'prop-uuid-0001', title: 'Test Property' }];
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockProperties);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ total: '1' }]);

      const result = await service.findSavedByUser('user-uuid-0001', {});

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      const callArgs = mockPrisma.$queryRaw.mock.calls[0][0];
      expect(callArgs[0]).toContain('SELECT p.*');
      expect(callArgs[0]).toContain('FROM property.saved_properties sp');
      expect(callArgs[0]).toContain('JOIN property.properties p');
      expect(result.data).toEqual(mockProperties);
      expect(result.total).toEqual(1);
    });
  });
});