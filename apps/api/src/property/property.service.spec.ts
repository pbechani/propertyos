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
    view_count: 0,
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
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ company_id: 'self-co-uuid' }]); // self-company lookup
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
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ company_id: 'self-co-uuid' }]); // self-company lookup
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
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ company_id: 'self-co-uuid' }]); // self-company lookup
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

    it('increments view_count and logs property.viewed for an authenticated non-owner visitor', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseProperty])
        .mockResolvedValueOnce([])  // location
        .mockResolvedValueOnce([]); // media
      mockPrisma.$executeRaw.mockResolvedValueOnce(1); // UPDATE view_count
      await service.findById(propertyId, { actorId: 'visitor-uuid-9999', actorRole: 'buyer' });
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.viewed', actorId: 'visitor-uuid-9999' }),
      );
    });

    it('does NOT increment view_count or log property.viewed when actor is the listing agent', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseProperty])
        .mockResolvedValueOnce([])  // location
        .mockResolvedValueOnce([]); // media
      await service.findById(propertyId, { actorId: agentId, actorRole: 'agent' });
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
      expect(mockAudit.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.viewed' }),
      );
    });

    it('does NOT increment view_count when actor is the owner', async () => {
      const ownedProperty = { ...baseProperty, agent_id: null, owner_id: 'owner-uuid-7777' };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([ownedProperty])
        .mockResolvedValueOnce([])  // location
        .mockResolvedValueOnce([]); // media
      await service.findById(propertyId, { actorId: 'owner-uuid-7777', actorRole: 'buyer_seller' });
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
      expect(mockAudit.log).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.viewed' }),
      );
    });

    it('does NOT increment view_count for unauthenticated (SSR) requests', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseProperty])
        .mockResolvedValueOnce([])  // location
        .mockResolvedValueOnce([]); // media
      // No actorId — simulates the Next.js SSR call
      await service.findById(propertyId, { actorRole: 'public' });
      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
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

    it('filters by agent_id when provided', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([baseProperty]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await service.search({ agent_id: agentId });

      const countCall = mockPrisma.$queryRawUnsafe.mock.calls[0];
      expect(countCall[1]).toBe(agentId);
    });

    it('returns company_brand_color when company has one set', async () => {
      const propertyWithBrandColor = {
        ...baseProperty,
        company_id: 'company-uuid-001',
        company_is_system: false,
        company_name: 'SurdoProp',
        company_logo_url: '/storage/logos/surdoprop.png',
        company_brand_color: '#4A9E8E',
        company_status: 'active',
      };
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([propertyWithBrandColor]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.search({ page: 1, limit: 10 });

      expect(result.data[0]).toHaveProperty('company_brand_color', '#4A9E8E');
      expect(result.data[0]).toHaveProperty('company_name', 'SurdoProp');
    });

    it('returns null company_brand_color for private listings', async () => {
      const privateListing = {
        ...baseProperty,
        company_id: 'self-co-uuid',
        company_is_system: true,
        company_name: 'Self',
        company_logo_url: null,
        company_brand_color: null,
        company_status: 'active',
      };
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([privateListing]);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.search({ page: 1, limit: 10 });

      expect(result.data[0]).toHaveProperty('company_brand_color', null);
      expect(result.data[0]).toHaveProperty('company_is_system', true);
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
        .mockResolvedValueOnce([{ verification_status: 'verified', count: '3' }])
        .mockResolvedValueOnce([{ current_views: '12', previous_views: '8' }])
        .mockResolvedValueOnce([{ total_inquiries: '10', responded_inquiries: '7' }]);

      const result = await service.getAgentDashboard(agentId);

      expect(result.totalListings).toBe(7);
      expect(result.byStatus.active).toBe(5);
      expect(result.newInquiries7d).toBe(3);
      expect(result.verificationSummary.verified).toBe(3);
      expect(result.listingViewsLast7d).toBe(12);
      expect(result.listingViewsPrevious7d).toBe(8);
      expect(result.listingViewsTrendPct).toBe(50);
      expect(result.inquiryResponseRatePct).toBe(70);
    });
  });

  // ─── getFeaturedAgents ───────────────────────────────────────────────────

  describe('getFeaturedAgents', () => {
    it('returns aggregated featured agents with derived tiers', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([
        {
          id: 'agent-1',
          first_name: 'Alex',
          last_name: 'Moyo',
          city: 'Cape Town',
          active_listings: '12',
          verified_listings: '10',
        },
        {
          id: 'agent-2',
          first_name: 'Sam',
          last_name: 'Ndlovu',
          city: null,
          active_listings: '3',
          verified_listings: '2',
        },
      ]);

      const result = await service.getFeaturedAgents(4);

      expect(result).toEqual([
        {
          id: 'agent-1',
          fullName: 'Alex Moyo',
          location: 'Cape Town',
          tier: 'gold',
          deals: 12,
        },
        {
          id: 'agent-2',
          fullName: 'Sam Ndlovu',
          location: 'Location unavailable',
          tier: 'bronze',
          deals: 3,
        },
      ]);
    });
  });

  // ─── getAgentProfile ─────────────────────────────────────────────────────

  describe('getAgentProfile', () => {
    it('returns agent profile with listings', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([
          {
            id: agentId,
            first_name: 'Alex',
            last_name: 'Moyo',
            email: 'alex@example.com',
            phone: '+27110000000',
            avatar_url: null,
            status: 'active',
            total_listings: '3',
            active_listings: '2',
            verified_listings: '1',
            primary_city: 'Cape Town',
          },
        ])
        .mockResolvedValueOnce([
          {
            id: propertyId,
            title: 'Beautiful 3BR Home',
            city: 'Cape Town',
            region: 'Western Cape',
            price: '250000.00',
            currency: 'USD',
            bedrooms: 3,
            bathrooms: 2,
            area_sqm: '145.00',
            status: 'active',
            verification_status: 'verified',
            created_at: new Date('2026-02-21'),
            media_url: null,
          },
        ]);

      const result = await service.getAgentProfile(agentId);

      expect(result.id).toBe(agentId);
      expect(result.totalListings).toBe(3);
      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].location).toContain('Cape Town');
    });

    it('throws NotFoundException when agent does not exist', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([]);

      await expect(service.getAgentProfile(agentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getOwnershipHistory ──────────────────────────────────────────────────

  describe('getOwnershipHistory', () => {
    it('returns ownership history records ordered by transfer date', async () => {
      const mockHistory = [
        {
          id: 'oh-1',
          owner_name: 'Alice Moyo',
          transfer_date: '2024-03-15',
          transfer_price: '1500000.00',
          transfer_currency: 'ZAR',
          title_deed_url: 'https://example.com/deed-1.pdf',
          notes: 'Purchase',
          created_at: '2024-03-15T10:00:00Z',
        },
        {
          id: 'oh-2',
          owner_name: 'Bob Nkosi',
          transfer_date: '2020-08-01',
          transfer_price: '1200000.00',
          transfer_currency: 'ZAR',
          title_deed_url: null,
          notes: null,
          created_at: '2020-08-01T10:00:00Z',
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValueOnce(mockHistory);

      const result = await service.getOwnershipHistory(propertyId);
      expect(result).toHaveLength(2);
      expect(result[0].owner_name).toBe('Alice Moyo');
      expect(result[1].owner_name).toBe('Bob Nkosi');
    });

    it('returns empty array when no history exists', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.getOwnershipHistory(propertyId);
      expect(result).toEqual([]);
    });
  });

  // ─── getPriceHistory ──────────────────────────────────────────────────────

  describe('getPriceHistory', () => {
    it('returns price history records ordered by date ascending', async () => {
      const mockHistory = [
        {
          id: 'ph-1',
          old_price: null,
          new_price: '1000000.00',
          currency: 'ZAR',
          changed_by: agentId,
          change_note: 'Initial listing',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'ph-2',
          old_price: '1000000.00',
          new_price: '1200000.00',
          currency: 'ZAR',
          changed_by: agentId,
          change_note: 'Price increase',
          created_at: '2024-06-20T10:00:00Z',
        },
      ];

      mockPrisma.$queryRaw.mockResolvedValueOnce(mockHistory);

      const result = await service.getPriceHistory(propertyId);
      expect(result).toHaveLength(2);
      expect(result[0].new_price).toBe('1000000.00');
      expect(result[1].new_price).toBe('1200000.00');
    });

    it('returns empty array when no price history exists', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.getPriceHistory(propertyId);
      expect(result).toEqual([]);
    });
  });

  // ─── getFloorPlans ────────────────────────────────────────────────────────

  describe('getFloorPlans', () => {
    it('returns floor plan media ordered by display_order', async () => {
      const mockPlans = [
        { id: 'fm-1', url: '/floor1.png', thumbnail_url: '/floor1-thumb.png', display_order: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: 'fm-2', url: '/floor2.png', thumbnail_url: null, display_order: 2, created_at: '2024-01-02T00:00:00Z' },
      ];

      mockPrisma.$queryRaw.mockResolvedValueOnce(mockPlans);

      const result = await service.getFloorPlans(propertyId);
      expect(result).toHaveLength(2);
      expect(result[0].display_order).toBe(1);
      expect(result[1].thumbnail_url).toBeNull();
    });

    it('returns empty array when no floor plans exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.getFloorPlans(propertyId);
      expect(result).toEqual([]);
    });
  });

  // ─── update – price change logging ────────────────────────────────────────

  describe('update – price change logging', () => {
    it('inserts a price_history record when price changes', async () => {
      const existingProperty = { ...baseProperty, price: '250000.00', currency: 'USD' };
      const updatedProperty = { ...baseProperty, price: '300000.00', currency: 'USD' };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([existingProperty])  // SELECT existing
        .mockResolvedValueOnce(1);                   // INSERT price_history
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([updatedProperty]); // UPDATE

      await service.update(propertyId, agentId, 'agent', { price: 300000 });

      // $queryRaw called at least 2 times: SELECT existing + INSERT price_history
      expect(mockPrisma.$queryRaw.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('does not insert price_history when price stays the same', async () => {
      const existingProperty = { ...baseProperty, price: '250000.00' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([existingProperty]);
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([existingProperty]);

      await service.update(propertyId, agentId, 'agent', { title: 'New Title' });

      // $queryRaw called once for SELECT existing, no INSERT for price_history
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });
});
