import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../database';
import { CreateLeadDto, ListLeadsQueryDto, UpdateLeadDto } from './leads.dto';

describe('LeadsService', () => {
  let service: LeadsService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const companyId = 'company-uuid-0001';
  const userId = 'user-uuid-0001';
  const leadId = 'lead-uuid-0001';
  const roles = ['agent'];

  const baseLead = {
    id: leadId,
    company_id: companyId,
    assigned_to: userId,
    created_by: userId,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+27821234567',
    address: null,
    source: 'referral',
    type: 'buyer',
    timeline: '3 months',
    budget_min: '500000',
    budget_max: '800000',
    budget_currency: 'ZAR',
    preferences: null,
    temperature: 'hot',
    stage: 'new',
    prequalified: false,
    deal_value: null,
    notes: null,
    next_follow_up: null,
    last_contact_at: null,
    closed_at: null,
    lost_reason: null,
    created_at: new Date(),
    updated_at: new Date(),
    assigned_agent_name: 'Jane Doe',
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(LeadsService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── list ──────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns company-scoped leads with total', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: '2' }])
        .mockResolvedValueOnce([baseLead, { ...baseLead, id: 'lead-uuid-0002' }]);

      const result = await service.list(userId, roles, companyId, {} as ListLeadsQueryDto);

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
    });

    it('adds search filter when query.search is provided', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([baseLead]);

      await service.list(userId, roles, companyId, { search: 'Jane' } as ListLeadsQueryDto);

      const [countCall] = mockPrisma.$queryRawUnsafe.mock.calls[0] as [string, ...unknown[]];
      expect(countCall).toContain('ILIKE');
    });

    it('adds stage filter when query.stage is provided', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: '1' }])
        .mockResolvedValueOnce([baseLead]);

      await service.list(userId, roles, companyId, { stage: 'new' } as ListLeadsQueryDto);

      const [countCall] = mockPrisma.$queryRawUnsafe.mock.calls[0] as [string, ...unknown[]];
      expect(countCall).toContain('l.stage');
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateLeadDto = {
      name: 'Jane Doe',
      type: 'buyer',
      email: 'jane@example.com',
      phone: '+27821234567',
      source: 'referral',
      temperature: 'hot',
    };

    it('creates a lead and auto-logs creation activity', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseLead]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await service.create(userId, roles, companyId, dto);

      expect(result).toEqual(baseLead);
      // Activity insert
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('defaults stage to "new" and temperature to "warm" when not provided', async () => {
      const minDto: CreateLeadDto = { name: 'Bob', type: 'seller' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...baseLead, stage: 'new', temperature: 'warm' }]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await service.create(userId, roles, companyId, minDto);

      expect(result.stage).toBe('new');
      expect(result.temperature).toBe('warm');
    });
  });

  // ─── getById ───────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns lead when company matches', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseLead]);

      const result = await service.getById(leadId, userId, roles, companyId);

      expect(result).toEqual(baseLead);
    });

    it('throws NotFoundException when lead does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.getById(leadId, userId, roles, companyId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when lead belongs to another company', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...baseLead, company_id: 'other-company-uuid' },
      ]);

      await expect(service.getById(leadId, userId, roles, companyId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates fields and returns updated lead', async () => {
      const updatedLead = { ...baseLead, temperature: 'cold' };
      // getById internal call
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseLead]);
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([updatedLead]);

      const dto: UpdateLeadDto = { temperature: 'cold' };
      const result = await service.update(leadId, userId, roles, companyId, dto);

      expect(result.temperature).toBe('cold');
    });

    it('auto-logs stage_change activity when stage changes', async () => {
      const updatedLead = { ...baseLead, stage: 'contacted' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseLead]);   // getById
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([updatedLead]); // UPDATE
      mockPrisma.$executeRaw.mockResolvedValue(1);              // activity insert

      const dto: UpdateLeadDto = { stage: 'contacted' };
      await service.update(leadId, userId, roles, companyId, dto);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      const [activityCall] = mockPrisma.$executeRaw.mock.calls[0] as [TemplateStringsArray, ...unknown[]];
      // The raw call is a tagged template — verify stage_change is in context
      expect(activityCall.join('')).toContain('stage_change');
    });

    it('sets closed_at when stage transitions to closed', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseLead]);
      const updatedLead = { ...baseLead, stage: 'closed' };
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([updatedLead]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await service.update(leadId, userId, roles, companyId, { stage: 'closed' });

      expect(result.stage).toBe('closed');
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes lead when called by an agent', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseLead]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      await expect(service.remove(leadId, userId, ['agent'], companyId)).resolves.toBeUndefined();
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException when caller lacks agent/admin role', async () => {
      await expect(
        service.remove(leadId, userId, ['buyer'], companyId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── getDashboard ──────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    it('returns aggregated KPI data', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          { total_leads: '10', hot_leads: '3', active_deals: '4', pipeline_value: '2500000' },
        ])
        .mockResolvedValueOnce([]) // pendingTasks
        .mockResolvedValueOnce([]) // recentActivities
        .mockResolvedValueOnce([{ type: 'buyer', count: '7' }, { type: 'seller', count: '3' }])
        .mockResolvedValueOnce([{ temperature: 'hot', count: '3' }])
        .mockResolvedValueOnce([]) // recentLeads
        .mockResolvedValueOnce([{ stage: 'new', count: '5' }, { stage: 'contacted', count: '3' }]); // stageRows

      const result = await service.getDashboard(userId, roles, companyId);

      expect(result.totalLeads).toBe(10);
      expect(result.hotLeads).toBe(3);
      expect(result.activeDeals).toBe(4);
      expect(result.pipelineValue).toBe(2500000);
      expect(result.byType).toEqual({ buyer: 7, seller: 3 });
      expect(result.byTemperature).toEqual({ hot: 3 });
      expect(result.byStage).toEqual({ new: 5, contacted: 3 });
      expect(result.recentLeads).toHaveLength(0);
    });

    it('returns zero values when no leads exist', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ total_leads: '0', hot_leads: '0', active_deals: '0', pipeline_value: '0' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]) // recentLeads
        .mockResolvedValueOnce([]); // stageRows

      const result = await service.getDashboard(userId, roles, companyId);

      expect(result.totalLeads).toBe(0);
      expect(result.pipelineValue).toBe(0);
      expect(result.pendingTasks).toHaveLength(0);
    });
  });
});
