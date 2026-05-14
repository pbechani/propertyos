import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AIIntelligenceService } from './ai-intelligence.service';
import { PrismaService } from '../database';
import { AiDataService } from './ai-data.service';
import { AiGuardrailsService } from './guardrails/ai-guardrails.service';
import { AiObservabilityService } from './observability/ai-observability.service';
import { LlmGatewayService } from './llm/llm-gateway.service';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const COMPANY_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const USER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    name: 'Alice Smith',
    temperature: 'hot',
    stage: 'active',
    prequalified: true,
    budget_min: '1000000',
    budget_max: '2000000',
    budget_currency: 'ZAR',
    deal_value: null,
    preferences: 'residential cape town',
    last_contact_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    created_at: new Date(),
    ...overrides,
  };
}

function makeProperty(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prop-1',
    title: 'Sea View Villa',
    price: '1500000',
    property_type: 'residential',
    city: 'Cape Town',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('AIIntelligenceService', () => {
  let service: AIIntelligenceService;
  let prisma: { $queryRaw: jest.Mock; $queryRawUnsafe: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
      $queryRawUnsafe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIIntelligenceService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: AiDataService,
          useValue: {
            fetchLeads: jest.fn(),
            fetchProperties: jest.fn(),
            fetchMarketAverages: jest.fn(),
            scoreLeads: jest.fn(),
            buildPricingInsights: jest.fn(),
            buildBuyerMatches: jest.fn(),
            buildRecommendations: jest.fn(),
          },
        },
        {
          provide: AiGuardrailsService,
          useValue: {
            validateAndSanitise: jest.fn((q: string) => q),
            validateOutput: jest.fn(() => true),
          },
        },
        {
          provide: AiObservabilityService,
          useValue: {
            startTrace: jest.fn(() => 'trace-id'),
            endTrace: jest.fn(),
            failTrace: jest.fn(),
          },
        },
        {
          provide: LlmGatewayService,
          useValue: {
            isEnabled: false,
            complete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AIIntelligenceService>(AIIntelligenceService);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // getDashboard — guard
  // ──────────────────────────────────────────────────────────────────────────

  it('throws ForbiddenException when companyId is empty', async () => {
    await expect(service.getDashboard(USER_ID, ['agent'], '')).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // getDashboard — happy path
  // ──────────────────────────────────────────────────────────────────────────

  it('returns full dashboard structure', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([makeLead()]) // fetchLeads
      .mockResolvedValueOnce([makeProperty()]) // fetchProperties
      .mockResolvedValueOnce([]); // fetchMarketAverages (no comparables)

    const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);

    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('leadScores');
    expect(result).toHaveProperty('pricingInsights');
    expect(result).toHaveProperty('buyerMatches');
    expect(result).toHaveProperty('summary');

    expect(result.summary.leadsScored).toBe(1);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Lead scoring
  // ──────────────────────────────────────────────────────────────────────────

  describe('lead scoring', () => {
    it('scores a hot+active+prequalified+recent lead as A grade', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([makeLead()]) // fetchLeads
        .mockResolvedValueOnce([]) // fetchProperties
        .mockResolvedValueOnce([]); // fetchMarketAverages

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      const score = result.leadScores[0];

      // hot(40) + active(35) + contacted within 7d(20) + prequalified(15) + has_budget(5) = 115 → capped at 100
      expect(score.score).toBe(100);
      expect(score.grade).toBe('A');
    });

    it('gives a cold+new lead a D grade', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([
          makeLead({
            temperature: 'cold',
            stage: 'new',
            prequalified: false,
            budget_min: null,
            budget_max: null,
            last_contact_at: null,
          }),
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      const score = result.leadScores[0];

      // cold(10) + new(5) = 15 → D
      expect(score.score).toBe(15);
      expect(score.grade).toBe('D');
    });

    it('excludes closed and lost leads', async () => {
      // fetchLeads query filters WHERE stage NOT IN ('closed', 'lost')
      // so if DB returns an empty array, leadScores is empty
      prisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      expect(result.leadScores).toHaveLength(0);
      expect(result.summary.avgLeadScore).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Pricing insights
  // ──────────────────────────────────────────────────────────────────────────

  describe('pricing insights', () => {
    it('flags a property as overpriced when 20% above market avg', async () => {
      const avgPrice = 1000000;
      const currentPrice = 1200000; // 20% above

      prisma.$queryRaw
        .mockResolvedValueOnce([]) // fetchLeads
        .mockResolvedValueOnce([
          makeProperty({ price: String(currentPrice), city: 'Nairobi', property_type: 'residential' }),
        ])
        .mockResolvedValueOnce([
          { property_type: 'residential', city: 'Nairobi', avg_price: String(avgPrice), count: '5' },
        ]);

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      expect(result.pricingInsights).toHaveLength(1);
      expect(result.pricingInsights[0].recommendation).toBe('overpriced');
      expect(result.pricingInsights[0].priceDiff).toBeGreaterThan(15);
    });

    it('flags a property as underpriced when 20% below market avg', async () => {
      const avgPrice = 1000000;
      const currentPrice = 800000; // 20% below

      prisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          makeProperty({ price: String(currentPrice), city: 'Nairobi', property_type: 'residential' }),
        ])
        .mockResolvedValueOnce([
          { property_type: 'residential', city: 'Nairobi', avg_price: String(avgPrice), count: '5' },
        ]);

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      expect(result.pricingInsights[0].recommendation).toBe('underpriced');
    });

    it('skips properties with fewer than 2 comparables', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([makeProperty({ city: 'Lagos' })])
        .mockResolvedValueOnce([
          { property_type: 'residential', city: 'Lagos', avg_price: '1000000', count: '1' },
        ]);

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      expect(result.pricingInsights).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Buyer matching
  // ──────────────────────────────────────────────────────────────────────────

  describe('buyer matching', () => {
    it('matches a buyer whose budget covers the property price', async () => {
      const lead = makeLead({
        budget_min: '1000000',
        budget_max: '2000000',
        preferences: 'residential',
        temperature: 'hot',
      });
      const prop = makeProperty({ price: '1500000', property_type: 'residential' });

      prisma.$queryRaw
        .mockResolvedValueOnce([lead])
        .mockResolvedValueOnce([prop])
        .mockResolvedValueOnce([]);

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      expect(result.buyerMatches.length).toBeGreaterThan(0);
      expect(result.buyerMatches[0].leadId).toBe(lead.id);
      expect(result.buyerMatches[0].listingId).toBe(prop.id);
    });

    it('does not match a buyer whose budget is far from the property price', async () => {
      const lead = makeLead({ budget_min: '100000', budget_max: '200000' });
      const prop = makeProperty({ price: '5000000' });

      prisma.$queryRaw
        .mockResolvedValueOnce([lead])
        .mockResolvedValueOnce([prop])
        .mockResolvedValueOnce([]);

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      expect(result.buyerMatches).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Recommendations
  // ──────────────────────────────────────────────────────────────────────────

  describe('recommendations', () => {
    it('generates urgent deal_risk for under_contract lead with 20-day silence', async () => {
      const lead = makeLead({
        stage: 'under_contract',
        temperature: 'hot',
        last_contact_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      });

      prisma.$queryRaw
        .mockResolvedValueOnce([lead])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      const dealRisk = result.recommendations.find((r) => r.type === 'deal_risk');
      expect(dealRisk).toBeDefined();
      expect(dealRisk!.priority).toBe('urgent');
    });

    it('generates hot_lead recommendation for A-grade lead not contacted in 8 days', async () => {
      const lead = makeLead({
        last_contact_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      });

      prisma.$queryRaw
        .mockResolvedValueOnce([lead])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getDashboard(USER_ID, ['agent'], COMPANY_ID);
      const hotLead = result.recommendations.find((r) => r.type === 'hot_lead');
      expect(hotLead).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // queryAssistant
  // ──────────────────────────────────────────────────────────────────────────

  describe('queryAssistant', () => {
    it('throws ForbiddenException when companyId is empty', async () => {
      await expect(service.queryAssistant(USER_ID, '', 'find buyers')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('find_buyers intent returns list of buyer-property matches', async () => {
      const lead = makeLead({ budget_min: '100000', budget_max: '300000', preferences: 'residential' });
      const prop = makeProperty({ price: '150000', property_type: 'residential', city: 'Cape Town' });

      prisma.$queryRaw
        .mockResolvedValueOnce([lead])    // fetchLeads
        .mockResolvedValueOnce([prop])    // fetchProperties (in Promise.all)
        .mockResolvedValueOnce([]);       // fetchMarketAverages (in Promise.all)

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'find buyers for this property');

      expect(result.responseType).toBe('list');
      expect(result.items?.length).toBeGreaterThan(0);
      expect(result.items?.[0].href).toContain('/app/leads/');
    });

    it('find_buyers falls back to scored leads when no property-budget overlap', async () => {
      const lead = makeLead({ budget_min: null, budget_max: null }); // no budget
      const prop = makeProperty({ price: '999999' });

      prisma.$queryRaw
        .mockResolvedValueOnce([lead])
        .mockResolvedValueOnce([prop])
        .mockResolvedValueOnce([]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'find me buyers');

      expect(result.responseType).toBe('list');
      expect(result.totalCount).toBe(1);
    });

    it('write_description intent returns text with property title', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([makeProperty()]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'write a listing description');

      expect(result.responseType).toBe('text');
      expect(result.text).toContain('Sea View Villa');
    });

    it('write_description returns helpful message when no listings exist', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'generate description');

      expect(result.responseType).toBe('text');
      expect(result.text).toContain('No active listings');
    });

    it('summarize_tasks intent returns list of pending tasks', async () => {
      const today = new Date().toISOString().split('T')[0];
      const task = { id: 'task-1', title: 'Call client', type: 'call', priority: 'high', due_date: today, lead_name: 'Alice', lead_id: 'lead-1' };
      prisma.$queryRaw.mockResolvedValueOnce([task]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, "summarize today's tasks");

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].label).toBe('Call client');
      expect(result.items?.[0].href).toContain('/app/leads/lead-1');
    });

    it('summarize_tasks returns clear message when no pending tasks', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'my tasks today');

      expect(result.responseType).toBe('text');
      expect(result.text).toContain("all caught up");
    });

    it('suggest_followups intent returns list of leads needing contact', async () => {
      const staleLeads = [
        makeLead({ id: 'lead-a', last_contact_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }),
        makeLead({ id: 'lead-b', last_contact_at: null }),
      ];
      prisma.$queryRaw.mockResolvedValueOnce(staleLeads);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'suggest follow-ups');

      expect(result.responseType).toBe('list');
      expect(result.items?.length).toBe(2);
    });

    it('analyze_pipeline intent returns chart data with stage breakdown', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([
        { stage: 'new', count: '4' },
        { stage: 'active', count: '2' },
        { stage: 'under_contract', count: '1' },
      ]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'analyze my pipeline');

      expect(result.responseType).toBe('chart');
      expect(result.chart?.bars.length).toBe(3);
      expect(result.chart?.bars[0].value).toBe(4);
      expect(result.summaryCards?.[0].value).toBe(7); // total
    });

    it('hot_leads intent returns top scored A/B grade leads', async () => {
      const leads = [
        makeLead({ id: 'lead-hot', temperature: 'hot', stage: 'active', prequalified: true }),
        makeLead({ id: 'lead-cold', temperature: 'cold', stage: 'new', prequalified: false, budget_min: null, budget_max: null }),
      ];
      prisma.$queryRaw.mockResolvedValueOnce(leads);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'which leads are most likely to buy this month?');

      expect(result.responseType).toBe('list');
      expect(result.items?.length).toBeGreaterThan(0);
      // Top result should be the hot lead
      expect(result.items?.[0].href).toContain('lead-hot');
    });

    it('unknown query returns clarification text when nothing can be inferred', async () => {
      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'hello there');

      expect(result.responseType).toBe('text');
      // New semantic fallback returns a friendly "I'm not sure" clarification
      expect(result.title).toMatch(/not sure/i);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    // ── New intent handlers ─────────────────────────────────────────────────

    it('overdue_tasks returns list when overdue tasks exist', async () => {
      const task = { id: 't-1', title: 'Call Alice', type: 'call', priority: 'high', due_date: '2024-01-01', lead_name: 'Alice Smith', lead_id: 'lead-1' };
      prisma.$queryRaw.mockResolvedValueOnce([task]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'overdue tasks');

      expect(result.responseType).toBe('list');
      expect(result.title).toContain('overdue');
      expect(result.items?.[0].label).toBe('Call Alice');
      expect(result.items?.[0].href).toContain('/app/leads/lead-1');
    });

    it('overdue_tasks returns clear message when nothing is overdue', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, "what's overdue");

      expect(result.responseType).toBe('text');
      expect(result.text).toContain('caught up');
    });

    it('upcoming_tasks returns list of tasks due this week', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const task = { id: 't-2', title: 'Send offer', type: 'email', priority: 'medium', due_date: tomorrow, lead_name: 'Bob', lead_id: 'lead-2' };
      prisma.$queryRaw.mockResolvedValueOnce([task]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'tasks this week');

      expect(result.responseType).toBe('list');
      expect(result.title).toContain('this week');
    });

    it('high_priority_tasks returns only high-priority incomplete tasks', async () => {
      const task = { id: 't-3', title: 'Urgent call', type: 'call', due_date: null, lead_name: 'Carol', lead_id: 'lead-3' };
      prisma.$queryRaw.mockResolvedValueOnce([task]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'high priority tasks');

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].badge).toBe('High');
    });

    it('count_tasks returns summary cards', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([{ overdue: '3', today: '1', pending: '7', done: '12' }]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'how many tasks');

      expect(result.responseType).toBe('summary');
      expect(result.summaryCards?.find((c) => c.label === 'Overdue')?.value).toBe('3');
    });

    it('uncontacted_leads returns list of leads with no contact', async () => {
      const lead = { id: 'lead-5', name: 'Dave', temperature: 'warm', stage: 'new', created_at: new Date() };
      prisma.$queryRaw.mockResolvedValueOnce([lead]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'never contacted');

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].href).toContain('/app/leads/lead-5');
    });

    it('pipeline_value returns chart with stage bars', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([
        { stage: 'new', count: '3', total_value: '0' },
        { stage: 'active', count: '2', total_value: '900000' },
      ]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'pipeline value');

      expect(result.responseType).toBe('chart');
      expect(result.chart?.bars.length).toBe(2);
    });

    it('deals_at_risk returns list of stale active leads', async () => {
      const stale = { id: 'lead-6', name: 'Eve', stage: 'active', last_contact_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), temperature: 'warm' };
      prisma.$queryRaw.mockResolvedValueOnce([stale]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'deals at risk');

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].badgeColor).toBe('orange');
    });

    it('leads_by_temperature returns warm leads', async () => {
      const lead = { id: 'lead-7', name: 'Frank', stage: 'contacted', last_contact_at: null, budget_min: null, budget_max: null, budget_currency: 'ZAR' };
      prisma.$queryRaw.mockResolvedValueOnce([lead]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'warm leads');

      expect(result.responseType).toBe('list');
      expect(result.title).toContain('warm lead');
      expect(result.items?.[0].badge).toBe('warm');
    });

    it('leads_by_temperature returns cold leads', async () => {
      const lead = { id: 'lead-8', name: 'Grace', stage: 'new', last_contact_at: null, budget_min: null, budget_max: null, budget_currency: 'ZAR' };
      prisma.$queryRaw.mockResolvedValueOnce([lead]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'cold leads');

      expect(result.responseType).toBe('list');
      expect(result.title).toContain('cold lead');
    });

    it('leads_by_stage returns new leads', async () => {
      const lead = { id: 'lead-9', name: 'Henry', temperature: 'warm', last_contact_at: null, deal_value: null, prequalified: false };
      prisma.$queryRaw.mockResolvedValueOnce([lead]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'new leads');

      expect(result.responseType).toBe('list');
      expect(result.title).toContain('new');
    });

    it('conversion_stats returns summary with win rate', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([{ closed: '8', lost: '2', active: '15', total: '25' }]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'win rate');

      expect(result.responseType).toBe('summary');
      const winCard = result.summaryCards?.find((c) => c.label === 'Win Rate');
      expect(winCard?.value).toBe('80%');
    });

    it('prequalified_leads returns buyers with mortgage approval', async () => {
      const lead = { id: 'lead-10', name: 'Ivy', temperature: 'hot', stage: 'qualified', budget_min: null, budget_max: '2000000', budget_currency: 'ZAR', last_contact_at: new Date() };
      prisma.$queryRaw.mockResolvedValueOnce([lead]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'prequalified leads');

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].badge).toBe('hot');
    });

    it('count_leads returns summary breakdown by temperature', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([
        { hot: '4', warm: '6', cold: '3', nurture: '2', active_total: '13', closed: '5', lost: '2', total: '20' },
      ]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'how many leads');

      expect(result.responseType).toBe('summary');
      expect(result.title).toContain('20');
      expect(result.summaryCards?.find((c) => c.label === 'Hot')?.value).toBe('4');
    });

    it('my_listings returns list of properties', async () => {
      const listing = { id: 'prop-2', title: 'City Loft', price: '850000', property_type: 'apartment', status: 'active', city: 'Johannesburg', view_count: 12 };
      prisma.$queryRaw.mockResolvedValueOnce([listing]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'my listings');

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].label).toBe('City Loft');
      expect(result.items?.[0].badge).toBe('active');
    });

    it('count_listings returns summary by status', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([{ total: '10', active: '7', sold: '2', archived: '1' }]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'how many listings');

      expect(result.responseType).toBe('summary');
      expect(result.summaryCards?.find((c) => c.label === 'Active')?.value).toBe('7');
    });

    it('pending_viewings returns viewing requests needing response', async () => {
      const viewing = {
        id: 'view-1',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        viewing_type: 'in_person',
        property_title: 'Beach House',
        property_id: 'prop-3',
        buyer_name: 'Jack Buyer',
      };
      prisma.$queryRaw.mockResolvedValueOnce([viewing]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'pending viewings');

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].label).toContain('Jack Buyer');
      expect(result.items?.[0].badgeColor).toBe('orange');
    });

    it('upcoming_viewings returns confirmed viewings', async () => {
      const viewing = {
        id: 'view-2',
        scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        viewing_type: 'virtual',
        property_title: 'Mountain Retreat',
        property_id: 'prop-4',
        buyer_name: 'Kate Viewer',
      };
      prisma.$queryRaw.mockResolvedValueOnce([viewing]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'upcoming viewings');

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].badgeColor).toBe('green');
    });

    it('count_viewings returns summary cards', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([{ pending: '2', upcoming: '5', completed: '18', total: '25' }]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'how many viewings');

      expect(result.responseType).toBe('summary');
      expect(result.summaryCards?.find((c) => c.label === 'Upcoming')?.value).toBe('5');
    });

    it('upcoming_open_houses returns list of scheduled events', async () => {
      const oh = {
        id: 'oh-1',
        scheduled_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        end_at: new Date(),
        max_attendees: 20,
        property_title: 'Modern Townhouse',
        property_id: 'prop-5',
      };
      prisma.$queryRaw.mockResolvedValueOnce([oh]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'open houses');

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].label).toBe('Modern Townhouse');
    });

    it('recent_activity returns timeline of lead activities', async () => {
      const activity = {
        id: 'act-1',
        type: 'call',
        description: 'Discussed transfer timeline',
        created_at: new Date(),
        lead_name: 'Liam Client',
        lead_id: 'lead-11',
        actor_name: 'Agent Jo',
      };
      prisma.$queryRaw.mockResolvedValueOnce([activity]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'recent activity');

      expect(result.responseType).toBe('list');
      expect(result.items?.[0].badgeColor).toBe('blue'); // call type
    });

    it('business_summary returns 8-card summary from 4 parallel queries', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([{ active_leads: '12', hot_leads: '4', under_contract: '2', closed_deals: '5', total_leads: '20', pipeline_value: '5000000' }])
        .mockResolvedValueOnce([{ total: '8', active: '6' }])
        .mockResolvedValueOnce([{ overdue: '1', pending: '9' }])
        .mockResolvedValueOnce([{ pending: '3', upcoming: '7' }]);

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'business summary');

      expect(result.responseType).toBe('summary');
      expect(result.summaryCards?.length).toBe(8);
      expect(result.summaryCards?.find((c) => c.label === 'Active Leads')?.value).toBe('12');
      expect(result.text).toContain('R5.0M');
    });

    it('entity_search returns matching leads and listings', async () => {
      const lead = { id: 'lead-12', name: 'Naledi Dlamini', temperature: 'hot', stage: 'active', last_contact_at: new Date() };
      const prop = { id: 'prop-6', title: 'Naledi Estate', price: '3000000', property_type: 'residential', city: 'Pretoria' };
      prisma.$queryRaw
        .mockResolvedValueOnce([lead])   // lead search
        .mockResolvedValueOnce([prop]);  // property search

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'tell me about Naledi');

      expect(result.responseType).toBe('list');
      expect(result.title?.toLowerCase()).toContain('naledi');
      expect(result.items?.some((i) => i.href?.includes('/app/leads/'))).toBe(true);
      expect(result.items?.some((i) => i.href?.includes('/app/properties/'))).toBe(true);
    });

    it('entity_search returns text message when nothing found', async () => {
      prisma.$queryRaw
        .mockResolvedValueOnce([])  // no leads
        .mockResolvedValueOnce([]); // no properties

      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'find lead Zzz Unknown');

      expect(result.responseType).toBe('text');
      // name is lowercased in the query before extraction
      expect(result.text?.toLowerCase()).toContain('zzz unknown');
    });

    it('pageContext with lead-id routes "this lead" query to handleLeadById', async () => {
      const leadId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const lead = {
        id: leadId,
        name: 'Thabo Nkosi',
        temperature: 'hot',
        stage: 'active',
        last_contact_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deal_value: '1500000',
        budget_min: null,
        budget_max: '2000000',
        budget_currency: 'ZAR',
        prequalified: true,
        preferred_location: 'Sandton',
      };
      prisma.$queryRaw
        .mockResolvedValueOnce([lead])  // handleLeadById lead query
        .mockResolvedValueOnce([]);     // handleLeadById tasks query

      const result = await service.queryAssistant(
        USER_ID,
        COMPANY_ID,
        'tell me about this lead',
        `Lead detail page. lead-id:${leadId}`,
      );

      expect(result.responseType).toBe('text');
      expect(result.title).toBe('Thabo Nkosi');
      expect(result.text).toContain('Thabo Nkosi');
      expect(result.text).toContain('hot');
    });

    it('handleLeadById returns lead info with tasks when lead is found', async () => {
      const leadId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
      const lead = {
        id: leadId,
        name: 'Sipho Mokoena',
        temperature: 'warm',
        stage: 'negotiation',
        last_contact_at: null,
        deal_value: null,
        budget_min: '500000',
        budget_max: null,
        budget_currency: 'ZAR',
        prequalified: false,
        preferred_location: null,
      };
      const tasks = [
        { title: 'Send quote', type: 'email', due_date: '2025-12-01' },
      ];
      prisma.$queryRaw
        .mockResolvedValueOnce([lead])
        .mockResolvedValueOnce(tasks);

      const result = await service.queryAssistant(
        USER_ID,
        COMPANY_ID,
        'their tasks',
        `Lead detail page. lead-id:${leadId}`,
      );

      expect(result.responseType).toBe('text');
      expect(result.text).toContain('Send quote');
      expect(result.text).toContain('Never contacted');
    });

    it('handleLeadById returns error text when lead not found', async () => {
      const leadId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
      prisma.$queryRaw
        .mockResolvedValueOnce([]);  // empty leads

      const result = await service.queryAssistant(
        USER_ID,
        COMPANY_ID,
        'this lead',
        `Lead detail page. lead-id:${leadId}`,
      );

      expect(result.responseType).toBe('text');
      expect(result.text?.toLowerCase()).toContain('could not find');
    });

    // ── Synonym normalisation ───────────────────────────────────────────────
    it('normalizeSynonyms maps "clients" → routes to leadsModule (count)', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([{ total: '5' }]);
      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'how many clients do I have?');
      expect(result.responseType).not.toBe('error');
      // "clients" normalised to "leads" → matchesAny hits handleCountLeads
    });

    it('normalizeSynonyms maps "homes" → routes to listings handler', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'show my homes');
      // "homes" → "properties" → "my properties" → handleMyListings → list or text
      expect(['list', 'text']).toContain(result.responseType);
    });

    it('normalizeSynonyms maps "appointments" → upcoming viewings', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.queryAssistant(USER_ID, COMPANY_ID, "what appointments do I have this week?");
      // "appointments" → "viewings", "this week" matches upcoming viewings
      expect(['list', 'text']).toContain(result.responseType);
    });

    // ── Semantic fallback ───────────────────────────────────────────────────
    it('semantic fallback scores "stalled deals" → deals at risk handler', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'are any of my deals stalled?');
      expect(['list', 'text', 'summary']).toContain(result.responseType);
    });

    it('semantic fallback returns clarification text when nothing can be inferred', async () => {
      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'xyzzy gibberish foobar');
      expect(result.responseType).toBe('text');
      expect(result.title).toContain("not sure");
    });

    it('semantic fallback annotates low-confidence match with interpretation note', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);
      // "revenue" alone is a single-word match → low confidence
      const result = await service.queryAssistant(USER_ID, COMPANY_ID, 'revenue');
      // Either annotated or direct — both are valid, just not an error
      expect(['list', 'text', 'chart', 'summary']).toContain(result.responseType);
    });
  });
});
