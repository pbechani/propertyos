import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { MediaStorageService } from './media-storage.service';
import { PropertyAuditService } from './property-audit.service';
import { PrismaService } from '../database';

describe('PropertyService', () => {
  let service: PropertyService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };

  const mockMediaStorage = {
    uploadPropertyMedia: jest.fn(),
  };

  const mockAudit = {
    log: jest.fn(),
  };

  const agentId = 'agent-uuid-0001';
  const propertyId = 'prop-uuid-0001';

  const baseProperty = {
    id: propertyId,
    title: 'Beautiful 3BR Home',
    description: 'Spacious family home',
    property_type: 'residential',
    status: 'draft',
    price: '250000.00',
    currency: 'USD',
    area_sqm: '145.00',
    bedrooms: 3,
    bathrooms: 2,
    parking_spaces: 1,
    features: ['garden', 'pool'],
    agent_id: agentId,
    owner_id: null,
    verification_status: 'unverified',
    verified_at: null,
    created_at: new Date('2026-02-21'),
    updated_at: new Date('2026-02-21'),
  };

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        PropertyService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MediaStorageService, useValue: mockMediaStorage },
        { provide: PropertyAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(PropertyService);
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

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserts a property and returns the created record', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseProperty]); // INSERT
      // No location dto — no extra calls

      const result = await service.create(
        agentId,
        'agent',
        {
          title: 'Beautiful 3BR Home',
          propertyType: 'residential',
          price: 250000,
          currency: 'USD',
          bedrooms: 3,
          bathrooms: 2,
        },
        '127.0.0.1',
      );

      expect(result.id).toBe(propertyId);
      expect(result.property_type).toBe('residential');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.created' }),
      );
    });

    it('upserts location when location dto is provided', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseProperty]); // INSERT property
      mockPrisma.$executeRaw.mockResolvedValueOnce(1); // upsert location (no lat/lng)

      await service.create(
        agentId,
        'agent',
        {
          title: 'Land Plot',
          propertyType: 'land',
          price: 50000,
          currency: 'USD',
          location: { country: 'ZW', city: 'Harare' },
        },
      );

      // location upsert + audit
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('supports snake_case create payload aliases', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseProperty]);
      mockPrisma.$executeRaw.mockResolvedValueOnce(1);

      await service.create(
        agentId,
        'agent',
        {
          title: 'Snake Case Listing',
          property_type: 'residential',
          price: 190000,
          currency: 'USD',
          area_sqm: 120,
          parking_spaces: 2,
          location: {
            country: 'ZW',
            city: 'Harare',
            address_line1: '1 Snake Lane',
            postal_code: '00001',
          },
        } as any,
      );

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns property with location and media', async () => {
      const location = {
        id: 'loc-uuid-001',
        address_line1: '12 Oak St',
        city: 'Harare',
        region: 'Harare Province',
        country: 'ZW',
        postal_code: null,
        latitude: '-17.825200',
        longitude: '31.033500',
      };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseProperty]) // SELECT property
        .mockResolvedValueOnce([location])     // SELECT location
        .mockResolvedValueOnce([]);            // SELECT media

      const result = await service.findById(propertyId);
      expect(result.id).toBe(propertyId);
      expect(result.location?.city).toBe('Harare');
      expect(result.media).toEqual([]);
    });

    it('throws NotFoundException when property not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.findById('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates property and logs audit', async () => {
      const updatedProperty = { ...baseProperty, title: 'Updated Title', status: 'active' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseProperty]); // SELECT existing
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([updatedProperty]); // UPDATE

      const result = await service.update(
        propertyId,
        agentId,
        'agent',
        { title: 'Updated Title', status: 'active' },
      );

      expect(result.title).toBe('Updated Title');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.updated' }),
      );
    });

    it('throws ForbiddenException when agent tries to update another agent listing', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...baseProperty, agent_id: 'different-agent-uuid' },
      ]);

      await expect(
        service.update(propertyId, agentId, 'agent', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin can update any listing', async () => {
      const anotherAgentProperty = { ...baseProperty, agent_id: 'other-agent' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([anotherAgentProperty]);
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([anotherAgentProperty]);

      await expect(
        service.update(propertyId, 'admin-uuid', 'admin', { status: 'active' }),
      ).resolves.not.toThrow();
    });

    it('returns existing record with no changes when dto is empty', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseProperty]);
      const result = await service.update(propertyId, agentId, 'agent', {});
      expect(result).toEqual(baseProperty);
      expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('supports snake_case update payload aliases', async () => {
      const updatedProperty = { ...baseProperty, area_sqm: '180.00', parking_spaces: 3 };
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseProperty]);
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([updatedProperty]);
      mockPrisma.$executeRaw.mockResolvedValueOnce(1);

      const result = await service.update(
        propertyId,
        agentId,
        'agent',
        {
          area_sqm: 180,
          parking_spaces: 3,
          location: {
            country: 'ZW',
            postal_code: '11111',
            address_line1: 'Updated Address',
          },
        } as any,
      );

      expect(result.area_sqm).toBe('180.00');
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes own listing and logs audit', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseProperty]);
      mockPrisma.$executeRaw.mockResolvedValueOnce(1);

      await service.delete(propertyId, agentId, 'agent');

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.deleted' }),
      );
    });

    it('throws ForbiddenException when trying to delete another agent listing', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...baseProperty, agent_id: 'other-agent' },
      ]);

      await expect(
        service.delete(propertyId, agentId, 'agent'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.delete('no-such-uuid', agentId, 'agent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── search ───────────────────────────────────────────────────────────────

  describe('search', () => {
    it('returns paginated results with default sort', async () => {
      const countResult = [{ total: '5' }];
      const dataResult = [baseProperty, { ...baseProperty, id: 'prop-uuid-0002' }];
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(countResult)
        .mockResolvedValueOnce(dataResult);
      mockPrisma.$queryRaw
        .mockResolvedValue([]); // location + media per property

      const result = await service.search({ page: 1, limit: 10 });

      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.data).toHaveLength(2);
    });

    it('applies type filter when provided', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([baseProperty]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.search({ type: 'residential' });
      expect(result.data).toHaveLength(1);
    });

    it('supports snake_case query aliases', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([baseProperty]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.search({
        min_price: 100000,
        max_price: 300000,
        verification_status: 'verified',
        radius_km: 15,
      });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
    });

    it('prefers camelCase when both camelCase and snake_case are provided', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([baseProperty]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await service.search({
        minPrice: 200000,
        min_price: 100000,
      });

      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0];
      expect(countCall[1]).toBe(200000);
    });
  });

  // ─── addMedia ─────────────────────────────────────────────────────────────

  describe('addMedia', () => {
    const mockFile = {
      originalname: 'house.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 500,
      buffer: Buffer.from('image'),
    } as Express.Multer.File;

    it('adds media and returns url', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId }])  // assertAgentOwns
        .mockResolvedValueOnce([{ count: '0' }])          // count check
        .mockResolvedValueOnce([{ id: 'media-uuid-001', url: 'https://storage.pribec.local/test.jpg', media_type: 'image' }]);

      mockMediaStorage.uploadPropertyMedia.mockResolvedValueOnce({
        storagePath: 'property-media/prop/agent/uuid.jpg',
        signedUrl: 'https://storage.pribec.local/test.jpg',
        mediaType: 'image',
      });

      const result = await service.addMedia(
        propertyId,
        agentId,
        'agent',
        mockFile,
      );

      expect(result.mediaType).toBe('image');
      expect(result.url).toBeTruthy();
    });

    it('throws NotFoundException when property not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.addMedia(propertyId, agentId, 'agent', mockFile),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getAgentDashboard ────────────────────────────────────────────────────

  describe('getAgentDashboard', () => {
    it('returns dashboard stats correctly', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          { status: 'active', count: '5' },
          { status: 'draft', count: '2' },
        ])
        .mockResolvedValueOnce([{ count: '3' }])
        .mockResolvedValueOnce([{ verification_status: 'verified', count: '3' }]);

      const result = await service.getAgentDashboard(agentId);

      expect(result.totalListings).toBe(7);
      expect(result.byStatus.active).toBe(5);
      expect(result.newInquiries7d).toBe(3);
      expect(result.verificationSummary.verified).toBe(3);
    });
  });
});
