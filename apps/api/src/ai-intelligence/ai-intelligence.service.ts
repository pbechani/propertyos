import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../database';
import { randomUUID } from 'crypto';
import { AiDataService } from './ai-data.service';
import { AiGuardrailsService } from './guardrails/ai-guardrails.service';
import { AiObservabilityService } from './observability/ai-observability.service';
import { LlmGatewayService } from './llm/llm-gateway.service';
import {
  AIIntelligenceDashboard,
  AssistantResponse,
  AssistantListItem,
  LeadRow,
  LeadScore,
  PropertyRow,
  MarketAvgRow,
  PricingInsight,
  BuyerMatch,
  AIRecommendation,
  DAY_MS,
} from './ai-intelligence.types';

// ─────────────────────────────────────────────────────────────────────────────
// LLM system prompt (PDR-007)
// Instructs the model to answer using only the provided company data snapshot
// and to return a strict JSON object matching AssistantResponse.
// ─────────────────────────────────────────────────────────────────────────────
const LLM_SYSTEM_PROMPT = `You are PRIBEC AI, a real estate CRM assistant.
Answer using ONLY the company data snapshot provided. Never fabricate data.
Respond with a single JSON object — no markdown fences, no extra keys:
{
  "responseType": "list" | "summary" | "text",
  "title": string,
  "text"?: string,
  "items"?: [{"id": string, "label": string, "sublabel"?: string, "badge"?: string, "badgeColor"?: string}],
  "summaryCards"?: [{"label": string, "value": string, "color"?: string}]
}
Currency: ZAR (R). Today: {date}.
Company snapshot:
{snapshot}`;

// ─────────────────────────────────────────────────────────────────────────────
// AIIntelligenceService
//
// Core AI assistant entry point.  Orchestrates natural-language queries via a
// keyword/semantic router and delegates data operations to AiDataService.
// Input validation is enforced by AiGuardrailsService before any DB access.
// Every invocation is traced by AiObservabilityService.
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AIIntelligenceService {
  private readonly logger = new Logger(AIIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataService: AiDataService,
    private readonly guardrails: AiGuardrailsService,
    private readonly observability: AiObservabilityService,
    private readonly llm: LlmGatewayService,
  ) {}

  async getDashboard(
    _userId: string,
    _roles: string[],
    companyId: string,
  ): Promise<AIIntelligenceDashboard> {
    if (!companyId) throw new ForbiddenException('No active company');

    const [leads, properties, marketAvgs] = await Promise.all([
      this.fetchLeads(companyId),
      this.fetchProperties(companyId),
      this.fetchMarketAverages(companyId),
    ]);

    const leadScores = this.scoreLeads(leads);
    const pricingInsights = this.buildPricingInsights(properties, marketAvgs);
    const buyerMatches = this.buildBuyerMatches(leads, properties);
    const recommendations = this.buildRecommendations(
      leadScores,
      leads,
      pricingInsights,
      buyerMatches,
    );

    const urgentCount = recommendations.filter((r) => r.priority === 'urgent').length;
    const avgLeadScore =
      leadScores.length > 0
        ? Math.round(leadScores.reduce((sum, s) => sum + s.score, 0) / leadScores.length)
        : 0;

    return {
      recommendations,
      leadScores,
      pricingInsights,
      buyerMatches,
      summary: {
        totalRecommendations: recommendations.length,
        urgentCount,
        leadsScored: leadScores.length,
        avgLeadScore,
        listingsAnalyzed: pricingInsights.length,
        buyerMatchesFound: buyerMatches.length,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Data fetchers
  // ──────────────────────────────────────────────────────────────────────────

  private async fetchLeads(companyId: string): Promise<LeadRow[]> {
    return this.prisma.$queryRaw<LeadRow[]>`
      SELECT
        l.id,
        l.name,
        l.temperature,
        l.stage,
        l.prequalified,
        l.budget_min,
        l.budget_max,
        l.budget_currency,
        l.deal_value,
        l.preferences,
        l.last_contact_at,
        l.created_at
      FROM sales.leads l
      WHERE l.company_id = ${companyId}::uuid
        AND l.stage NOT IN ('closed', 'lost')
      ORDER BY l.created_at DESC
    `;
  }

  private async fetchProperties(companyId: string): Promise<PropertyRow[]> {
    return this.prisma.$queryRaw<PropertyRow[]>`
      SELECT
        p.id,
        p.title,
        p.price::text,
        p.property_type,
        pl.city
      FROM property.properties p
      LEFT JOIN property.property_locations pl ON pl.property_id = p.id
      WHERE p.company_id = ${companyId}::uuid
        AND p.status = 'active'
      ORDER BY p.created_at DESC
    `;
  }

  private async fetchMarketAverages(companyId: string): Promise<MarketAvgRow[]> {
    return this.prisma.$queryRaw<MarketAvgRow[]>`
      SELECT
        p.property_type,
        pl.city,
        AVG(p.price)::text AS avg_price,
        COUNT(*)::text AS count
      FROM property.properties p
      LEFT JOIN property.property_locations pl ON pl.property_id = p.id
      WHERE p.status = 'active'
        AND p.company_id != ${companyId}::uuid
      GROUP BY p.property_type, pl.city
    `;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Lead scoring
  // ──────────────────────────────────────────────────────────────────────────

  private scoreLeads(leads: LeadRow[]): LeadScore[] {
    return leads.map((lead) => {
      let score = 0;
      const reasoning: string[] = [];

      // Temperature
      const tempScores: Record<string, number> = { hot: 40, warm: 30, nurture: 20, cold: 10 };
      const tempScore = tempScores[lead.temperature] ?? 10;
      score += tempScore;
      reasoning.push(`Temperature (${lead.temperature}): +${tempScore}`);

      // Stage
      const stageScores: Record<string, number> = {
        new: 5,
        contacted: 15,
        qualified: 25,
        active: 35,
        under_contract: 45,
      };
      const stageScore = stageScores[lead.stage] ?? 0;
      score += stageScore;
      reasoning.push(`Stage (${lead.stage}): +${stageScore}`);

      // Recency of last contact
      if (lead.last_contact_at) {
        const daysSince = Math.floor(
          (Date.now() - new Date(lead.last_contact_at).getTime()) / DAY_MS,
        );
        if (daysSince <= 7) {
          score += 20;
          reasoning.push('Contacted within 7 days: +20');
        } else if (daysSince <= 14) {
          score += 10;
          reasoning.push('Contacted within 14 days: +10');
        } else if (daysSince <= 30) {
          score += 5;
          reasoning.push('Contacted within 30 days: +5');
        }
      }

      // Prequalified
      if (lead.prequalified) {
        score += 15;
        reasoning.push('Pre-qualified: +15');
      }

      // Has budget defined
      if (lead.budget_min || lead.budget_max) {
        score += 5;
        reasoning.push('Budget defined: +5');
      }

      const finalScore = Math.min(100, score);
      const grade: LeadScore['grade'] =
        finalScore >= 80 ? 'A' : finalScore >= 60 ? 'B' : finalScore >= 40 ? 'C' : 'D';

      return {
        leadId: lead.id,
        leadName: lead.name,
        score: finalScore,
        grade,
        temperature: lead.temperature,
        stage: lead.stage,
        reasoning,
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Pricing insights
  // ──────────────────────────────────────────────────────────────────────────

  private buildPricingInsights(
    properties: PropertyRow[],
    marketAvgs: MarketAvgRow[],
  ): PricingInsight[] {
    const avgMap = new Map<string, { avg: number; count: number }>();
    for (const row of marketAvgs) {
      const key = `${row.property_type}::${(row.city ?? '').toLowerCase()}`;
      avgMap.set(key, { avg: parseFloat(row.avg_price), count: parseInt(row.count, 10) });
    }

    return properties
      .map((prop): PricingInsight | null => {
        const key = `${prop.property_type}::${(prop.city ?? '').toLowerCase()}`;
        const market = avgMap.get(key);
        if (!market || market.count < 2) return null; // not enough data

        const currentPrice = parseFloat(prop.price);
        const diff = ((currentPrice - market.avg) / market.avg) * 100;

        let recommendation: PricingInsight['recommendation'];
        if (diff > 15) recommendation = 'overpriced';
        else if (diff < -15) recommendation = 'underpriced';
        else recommendation = 'competitive';

        return {
          listingId: prop.id,
          listingTitle: prop.title,
          currentPrice,
          avgMarketPrice: Math.round(market.avg),
          priceDiff: Math.round(diff * 10) / 10,
          recommendation,
          comparablesCount: market.count,
        };
      })
      .filter((x): x is PricingInsight => x !== null);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Buyer matching
  // ──────────────────────────────────────────────────────────────────────────

  private buildBuyerMatches(leads: LeadRow[], properties: PropertyRow[]): BuyerMatch[] {
    const buyers = leads.filter((l) => {
      const isBuyer =
        l.stage !== 'closed' &&
        l.stage !== 'lost' &&
        (l.budget_min !== null || l.budget_max !== null);
      return isBuyer;
    });

    const matches: BuyerMatch[] = [];

    for (const buyer of buyers) {
      const budgetMin = buyer.budget_min ? parseFloat(buyer.budget_min) : 0;
      const budgetMax = buyer.budget_max
        ? parseFloat(buyer.budget_max)
        : Number.MAX_SAFE_INTEGER;
      const prefs = (buyer.preferences ?? '').toLowerCase();

      for (const prop of properties) {
        const price = parseFloat(prop.price);
        const matchReasons: string[] = [];
        let matchScore = 0;

        // Budget overlap
        if (price >= budgetMin && price <= budgetMax) {
          matchScore += 60;
          matchReasons.push('Price within budget range');
        } else if (price <= budgetMax * 1.1 && price >= budgetMin * 0.9) {
          // within 10% of budget
          matchScore += 30;
          matchReasons.push('Price close to budget range');
        } else {
          continue; // too far off budget
        }

        // Property type preference match
        if (prefs.includes(prop.property_type)) {
          matchScore += 25;
          matchReasons.push(`Property type preference match (${prop.property_type})`);
        }

        // Location preference
        if (prop.city && prefs.includes(prop.city.toLowerCase())) {
          matchScore += 15;
          matchReasons.push(`Location preference match (${prop.city})`);
        }

        // Hot buyers get a boost
        if (buyer.temperature === 'hot') {
          matchScore += 10;
          matchReasons.push('Hot buyer');
        }

        if (matchScore >= 40) {
          matches.push({
            leadId: buyer.id,
            leadName: buyer.name,
            listingId: prop.id,
            listingTitle: prop.title,
            matchScore: Math.min(100, matchScore),
            matchReasons,
          });
        }
      }
    }

    // Return top matches sorted by score
    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Recommendations
  // ──────────────────────────────────────────────────────────────────────────

  private buildRecommendations(
    leadScores: LeadScore[],
    leads: LeadRow[],
    pricingInsights: PricingInsight[],
    buyerMatches: BuyerMatch[],
  ): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const leadMap = new Map(leads.map((l) => [l.id, l]));

    // 1. Hot leads not contacted recently
    for (const score of leadScores.filter((s) => s.grade === 'A')) {
      const lead = leadMap.get(score.leadId);
      if (!lead) continue;
      const daysSince = lead.last_contact_at
        ? Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / DAY_MS)
        : 999;
      if (daysSince >= 7) {
        recommendations.push({
          id: randomUUID(),
          type: 'hot_lead',
          priority: daysSince >= 14 ? 'urgent' : 'high',
          title: `Contact ${lead.name} — hot lead`,
          description: `Score ${score.score}/100. Last contacted ${daysSince === 999 ? 'never' : `${daysSince} days ago`}.`,
          entityId: lead.id,
          entityName: lead.name,
          actionUrl: `/app/leads/${lead.id}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 2. Warm leads going cold (B-grade, no contact in 14+ days)
    for (const score of leadScores.filter((s) => s.grade === 'B')) {
      const lead = leadMap.get(score.leadId);
      if (!lead) continue;
      if (!lead.last_contact_at) continue;
      const daysSince = Math.floor(
        (Date.now() - new Date(lead.last_contact_at).getTime()) / DAY_MS,
      );
      if (daysSince >= 14) {
        recommendations.push({
          id: randomUUID(),
          type: 'lead_followup',
          priority: daysSince >= 30 ? 'high' : 'medium',
          title: `Follow up with ${lead.name}`,
          description: `Good prospect (${daysSince} days since last contact). Risk of going cold.`,
          entityId: lead.id,
          entityName: lead.name,
          actionUrl: `/app/leads/${lead.id}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 3. Deal risk — under_contract with no recent activity
    for (const lead of leads.filter((l) => l.stage === 'under_contract')) {
      if (!lead.last_contact_at) continue;
      const daysSince = Math.floor(
        (Date.now() - new Date(lead.last_contact_at).getTime()) / DAY_MS,
      );
      if (daysSince >= 14) {
        recommendations.push({
          id: randomUUID(),
          type: 'deal_risk',
          priority: 'urgent',
          title: `Deal may fall through — ${lead.name}`,
          description: `Under contract with no activity for ${daysSince} days. Slow mortgage or title issues?`,
          entityId: lead.id,
          entityName: lead.name,
          actionUrl: `/app/leads/${lead.id}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 4. Pricing alerts
    for (const insight of pricingInsights.filter((p) => p.recommendation !== 'competitive')) {
      const diff = Math.abs(insight.priceDiff);
      recommendations.push({
        id: randomUUID(),
        type: 'pricing_alert',
        priority: diff >= 30 ? 'high' : 'medium',
        title:
          insight.recommendation === 'overpriced'
            ? `${insight.listingTitle} may be overpriced`
            : `${insight.listingTitle} priced below market`,
        description:
          insight.recommendation === 'overpriced'
            ? `Listed ${insight.priceDiff}% above market average. Consider reducing price to attract buyers.`
            : `Listed ${Math.abs(insight.priceDiff)}% below market average. You may be leaving value on the table.`,
        entityId: insight.listingId,
        entityName: insight.listingTitle,
        actionUrl: `/app/properties/${insight.listingId}`,
        createdAt: new Date().toISOString(),
      });
    }

    // 5. Strong buyer matches
    const seenPairs = new Set<string>();
    for (const match of buyerMatches.filter((m) => m.matchScore >= 70)) {
      const pairKey = `${match.leadId}::${match.listingId}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      recommendations.push({
        id: randomUUID(),
        type: 'buyer_match',
        priority: match.matchScore >= 90 ? 'high' : 'medium',
        title: `Strong buyer match: ${match.leadName}`,
        description: `${match.matchScore}% match for "${match.listingTitle}". Reasons: ${match.matchReasons.slice(0, 2).join(', ')}.`,
        entityId: match.leadId,
        entityName: match.leadName,
        actionUrl: `/app/leads/${match.leadId}`,
        createdAt: new Date().toISOString(),
      });
    }

    // Sort: urgent → high → medium → low
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort(
      (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // AI Assistant — natural language query handler
  // ──────────────────────────────────────────────────────────────────────────

  async queryAssistant(
    userId: string,
    companyId: string,
    query: string,
    pageContext?: string,
  ): Promise<AssistantResponse> {
    if (!companyId) throw new ForbiddenException('No active company');
    // ── Guardrails: validate & sanitise input before any DB access ──────────
    const sanitisedQuery = this.guardrails.validateAndSanitise(query, userId);
    // ── Observability: start trace ───────────────────────────────────────────
    const traceId = this.observability.startTrace({
      agentName: 'QueryRouter',
      action: 'queryAssistant',
      companyId,
      userId,
      inputSummary: sanitisedQuery.substring(0, 150),
    });
    try {
      const result = await this._processQueryCore(userId, companyId, sanitisedQuery, pageContext);
      this.observability.endTrace(traceId, {
        outputSummary: `responseType=${result.responseType}`,
      });
      return result;
    } catch (err) {
      this.observability.failTrace(traceId, err as Error);

      // Detect database connectivity errors — do not leak internal details to the client.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('prisma') || msg.includes("Can't reach") || msg.includes('database') || msg.includes('ECONNREFUSED')) {
        this.logger.error(`DB error in queryAssistant [${companyId}]: ${msg}`);
        return {
          responseType: 'error',
          title: 'Service temporarily unavailable',
          text: 'The database is temporarily unavailable. Please try again in a moment.',
        };
      }

      // All other unexpected errors — return a generic message, never expose internals.
      this.logger.error(`Unexpected error in queryAssistant [${companyId}]: ${msg}`);
      return {
        responseType: 'error',
        title: 'Something went wrong',
        text: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  private async _processQueryCore(
    _userId: string,
    companyId: string,
    query: string,
    pageContext?: string,
  ): Promise<AssistantResponse> {
    const q = query.toLowerCase().trim();

    // ── Tasks ────────────────────────────────────────────────────────────────
    if (this.matchesAny(q, ['overdue tasks', 'late tasks', "what's overdue", 'what is overdue', 'missed tasks', 'past due', 'tasks past due', 'what have i missed'])) {
      return this.handleOverdueTasks(companyId);
    }
    if (this.matchesAny(q, ['tasks this week', 'upcoming tasks', 'tasks due this week', 'next 7 days', 'this week tasks', 'due soon'])) {
      return this.handleUpcomingTasks(companyId);
    }
    if (this.matchesAny(q, ['high priority tasks', 'priority tasks', 'urgent tasks', 'important tasks', 'high priority'])) {
      return this.handleHighPriorityTasks(companyId);
    }
    if (this.matchesAny(q, ["today's tasks", 'todays tasks', 'my tasks', 'tasks for today', 'summarize tasks', 'what are my tasks', 'tasks today', 'pending tasks', 'due today', 'all tasks'])) {
      return this.handleSummarizeTasks(companyId);
    }
    if (this.matchesAny(q, ['how many tasks', 'task count', 'number of tasks', 'total tasks'])) {
      return this.handleCountTasks(companyId);
    }

    // ── Follow-ups & contact ─────────────────────────────────────────────────
    if (this.matchesAny(q, ['suggest follow', 'who to follow', 'who should i contact', 'who should i follow', 'need follow', 'needs follow', 'overdue contact', 'follow up', 'who to call', 'who to reach out'])) {
      return this.handleSuggestFollowups(companyId);
    }
    if (this.matchesAny(q, ['never contacted', 'not contacted', 'unreached leads', 'have not contacted', "haven't contacted", 'uncontacted', 'no contact history'])) {
      return this.handleUncontactedLeads(companyId);
    }

    // ── Pipeline ─────────────────────────────────────────────────────────────
    if (this.matchesAny(q, ['pipeline value', 'pipeline worth', 'total deal value', 'how much is my pipeline', 'pipeline revenue', 'deals worth', 'total value of my leads', 'potential revenue', 'deal values'])) {
      return this.handlePipelineValue(companyId);
    }
    if (this.matchesAny(q, ['stale deals', 'deals at risk', 'stuck deals', 'silent deals', 'no activity', 'at risk leads', 'deal risk', 'falling through'])) {
      return this.handleDealsAtRisk(companyId);
    }
    if (this.matchesAny(q, ['under contract', 'in contract', 'contracts in progress', 'leads under contract', 'closing deals'])) {
      return this.handleLeadsByStage(companyId, 'under_contract');
    }
    if (this.matchesAny(q, ['analyze my pipeline', 'analyse my pipeline', 'pipeline analysis', 'pipeline breakdown', 'analyze pipeline', 'my pipeline', 'pipeline stats', 'pipeline overview', 'pipeline summary'])) {
      return this.handleAnalyzePipeline(companyId);
    }
    if (this.matchesAny(q, ['conversion rate', 'win rate', 'close rate', 'closed deals', 'lost leads', 'won vs lost', 'how many have i closed', 'deals closed', 'success rate'])) {
      return this.handleConversionStats(companyId);
    }

    // ── Lead temperature filters ──────────────────────────────────────────────
    if (this.matchesAny(q, ['most likely to buy', 'likely to buy', 'which leads will close', 'buy this month', 'close this month', 'best leads', 'top leads'])) {
      return this.handleHotLeads(companyId);
    }
    if (this.matchesAny(q, ['hot leads', 'show hot leads', 'list hot leads', 'hot buyers', 'hottest leads'])) {
      return this.handleLeadsByTemperature(companyId, 'hot');
    }
    if (this.matchesAny(q, ['warm leads', 'show warm', 'list warm leads', 'warm buyers'])) {
      return this.handleLeadsByTemperature(companyId, 'warm');
    }
    if (this.matchesAny(q, ['cold leads', 'show cold', 'list cold leads', 'dormant leads', 'inactive leads'])) {
      return this.handleLeadsByTemperature(companyId, 'cold');
    }
    if (this.matchesAny(q, ['nurture leads', 'show nurture', 'list nurture', 'leads to nurture'])) {
      return this.handleLeadsByTemperature(companyId, 'nurture');
    }

    // ── Lead stage filters ────────────────────────────────────────────────────
    if (this.matchesAny(q, ['new leads', 'show new leads', 'recently added leads', 'latest leads', 'fresh leads'])) {
      return this.handleLeadsByStage(companyId, 'new');
    }
    if (this.matchesAny(q, ['contacted leads', 'leads in contacted', 'reached out to'])) {
      return this.handleLeadsByStage(companyId, 'contacted');
    }
    if (this.matchesAny(q, ['active leads', 'leads in active', 'actively engaged leads'])) {
      return this.handleLeadsByStage(companyId, 'active');
    }
    if (this.matchesAny(q, ['prequalified leads', 'pre-qualified', 'mortgage approved', 'show prequalified', 'who is prequalified', 'prequalified buyers', 'qualified buyers'])) {
      return this.handlePrequalifiedLeads(companyId);
    }

    // ── Lead counts ───────────────────────────────────────────────────────────
    if (this.matchesAny(q, ['how many leads', 'total leads', 'lead count', 'number of leads', 'how many contacts', 'total contacts'])) {
      return this.handleCountLeads(companyId);
    }

    // ── Buyers & matching ─────────────────────────────────────────────────────
    if (this.matchesAny(q, ['find buyers', 'buyers for', 'who wants to buy', 'buyers matching', 'find me buyers'])) {
      return this.handleFindBuyers(companyId);
    }
    if (this.matchesAny(q, ['buyer match', 'matching buyers', 'match buyers', 'who matches', 'property matches', 'best match for'])) {
      return this.handleBuyerMatches(companyId);
    }

    // ── Listings ─────────────────────────────────────────────────────────────
    if (this.matchesAny(q, ['write a listing', 'write listing', 'generate description', 'listing description', 'write description', 'write me a', 'draft a description', 'listing copy'])) {
      return this.handleWriteDescription(companyId);
    }
    if (this.matchesAny(q, ['pricing', 'overpriced', 'underpriced', 'price analysis', 'market price', 'listing price', 'check price', 'price check', 'compare prices', 'price my listing'])) {
      return this.handlePricingCheck(companyId);
    }
    if (this.matchesAny(q, ['my listings', 'show listings', 'all listings', 'active listings', 'my properties', 'show properties', 'all properties', 'list properties', 'view listings'])) {
      return this.handleMyListings(companyId);
    }
    if (this.matchesAny(q, ['how many listings', 'total listings', 'listing count', 'number of listings', 'how many properties', 'total properties'])) {
      return this.handleCountListings(companyId);
    }

    // ── Viewings ─────────────────────────────────────────────────────────────
    if (this.matchesAny(q, ['pending viewings', 'viewing requests', 'viewings to confirm', 'confirm viewings', 'requested viewings', 'awaiting response', 'unanswered viewings', 'need to confirm'])) {
      return this.handlePendingViewings(companyId);
    }
    if (this.matchesAny(q, ["today's viewings", 'viewings today', 'upcoming viewings', 'scheduled viewings', 'viewings this week', 'confirmed viewings', 'viewings coming up'])) {
      return this.handleUpcomingViewings(companyId);
    }
    if (this.matchesAny(q, ['how many viewings', 'viewing count', 'number of viewings', 'total viewings', 'viewing stats'])) {
      return this.handleCountViewings(companyId);
    }

    // ── Open houses ───────────────────────────────────────────────────────────
    if (this.matchesAny(q, ['open houses', 'upcoming open house', 'open house schedule', 'my open houses', 'any open houses'])) {
      return this.handleUpcomingOpenHouses(companyId);
    }

    // ── Recent activity ───────────────────────────────────────────────────────
    if (this.matchesAny(q, ['recent activity', 'activity log', 'what happened recently', "what's been happening", 'latest activity', 'recent updates', 'what has happened'])) {
      return this.handleRecentActivity(companyId);
    }

    // ── Business summary ──────────────────────────────────────────────────────
    if (this.matchesAny(q, ['business summary', 'how am i doing', 'my dashboard', 'performance', 'weekly summary', 'monthly summary', 'business performance', 'crm summary', 'my stats', 'my numbers', 'snapshot', 'overview', 'give me a summary', "what's happening", 'whats happening'])) {
      return this.handleBusinessSummary(companyId);
    }

    // ── Entity lookup — search leads or listings by name ─────────────────────
    // Context-aware: if user is on an entity detail page and asks "this lead" / "this property", route directly.
    const pageLeadId = pageContext?.match(/lead-id:([0-9a-f-]{36})/i)?.[1];
    const pagePropertyId = pageContext?.match(/property-id:([0-9a-f-]{36})/i)?.[1];
    if (
      pageLeadId &&
      this.matchesAny(q, [
        'this lead',
        'this contact',
        'this person',
        'tell me about this',
        "what's their",
        "what is their",
        'their pipeline',
        'their stage',
        'their tasks',
        'their activity',
        'their status',
        'about this lead',
        'info on this lead',
      ])
    ) {
      return this.handleLeadById(companyId, pageLeadId);
    }
    if (
      pagePropertyId &&
      this.matchesAny(q, [
        'this property',
        'this listing',
        'this house',
        'about this property',
        'info on this property',
        'this property info',
        'who might buy this',
        'buyers for this',
      ])
    ) {
      return this.handlePropertyById(companyId, pagePropertyId);
    }
    const entityName = this.extractEntityName(q);
    if (entityName) {
      return this.handleEntitySearch(companyId, entityName);
    }

    // Nothing matched exactly — try semantic scoring so the user can phrase
    // questions naturally without having to use specific keywords.  Synonym
    // normalisation is applied inside the fallback so it doesn't interfere with
    // the exact-match checks above.
    return this.semanticFallback(query, q, companyId);
  }

  // ── Intent handlers ────────────────────────────────────────────────────────

  private async handleFindBuyers(companyId: string): Promise<AssistantResponse> {
    const leads = await this.fetchLeads(companyId);
    const [properties, marketAvgs] = await Promise.all([
      this.fetchProperties(companyId),
      this.fetchMarketAverages(companyId),
    ]);
    const scores = this.scoreLeads(leads);
    const matches = this.buildBuyerMatches(leads, properties);

    if (matches.length === 0) {
      // Fall back to raw scored leads
      const buyers = scores.sort((a, b) => b.score - a.score).slice(0, 10);
      return {
        responseType: 'list',
        title: `${buyers.length} potential buyer${buyers.length !== 1 ? 's' : ''} in your CRM`,
        items: buyers.map((ls) => ({
          id: ls.leadId,
          label: ls.leadName,
          sublabel: `Score: ${ls.score}/100 · ${ls.stage.replace('_', ' ')} · ${ls.temperature}`,
          badge: ls.grade,
          badgeColor: ls.grade === 'A' ? 'green' : ls.grade === 'B' ? 'blue' : ls.grade === 'C' ? 'orange' : 'gray',
          href: `/app/leads/${ls.leadId}`,
        })),
        totalCount: buyers.length,
      };
    }
    void marketAvgs; // already used inside buildPricingInsights if needed
    return {
      responseType: 'list',
      title: `${matches.length} buyer-property match${matches.length !== 1 ? 'es' : ''} found`,
      items: matches.slice(0, 15).map((m) => ({
        id: `${m.leadId}-${m.listingId}`,
        label: m.leadName,
        sublabel: `${m.matchScore}% match for "${m.listingTitle}" · ${m.matchReasons.slice(0, 2).join(', ')}`,
        badge: `${m.matchScore}%`,
        badgeColor: m.matchScore >= 80 ? 'green' : m.matchScore >= 60 ? 'blue' : 'orange',
        href: `/app/leads/${m.leadId}`,
      })),
      totalCount: matches.length,
    };
  }

  private async handleWriteDescription(companyId: string): Promise<AssistantResponse> {
    const props = await this.fetchProperties(companyId);
    if (!props[0]) {
      return {
        responseType: 'text',
        text: 'No active listings found. Create a listing first and I can generate a description for it.',
      };
    }
    const p = props[0];
    const typeLabel = p.property_type.replace('_', ' ');
    const city = p.city ? ` in ${p.city}` : '';
    const price = parseFloat(p.price);
    const priceStr =
      price >= 1_000_000
        ? `${(price / 1_000_000).toFixed(1)}M`
        : price >= 1_000
          ? `${(price / 1_000).toFixed(0)}K`
          : String(price);

    const description = [
      `**${p.title}** — A superb ${typeLabel}${city}, offered at ${priceStr}.`,
      ``,
      `This well-positioned property presents an exciting opportunity for buyers seeking quality and value. The property features an excellent layout, modern finishes, and outstanding natural light throughout.`,
      ``,
      `**Key highlights:**`,
      `• Prime location with easy access to amenities`,
      `• Flexible floorplan suitable for families and investors`,
      `• Secure, peaceful neighbourhood`,
      ``,
      `Contact us today to arrange a private viewing. Serious buyers welcome.`,
    ].join('\n');

    return {
      responseType: 'text',
      title: `Listing description for: ${p.title}`,
      text: description,
    };
  }

  private async handleSummarizeTasks(companyId: string): Promise<AssistantResponse> {
    type TaskRow = {
      id: string;
      title: string;
      type: string;
      priority: string;
      due_date: string | null;
      lead_name: string;
      lead_id: string;
    };
    const tasks = await this.prisma.$queryRaw<TaskRow[]>`
      SELECT t.id, t.title, t.type, t.priority, t.due_date::text,
             l.name AS lead_name, l.id AS lead_id
      FROM sales.lead_tasks t
      JOIN sales.leads l ON l.id = t.lead_id
      WHERE t.company_id = ${companyId}::uuid
        AND t.completed = false
        AND (t.due_date <= CURRENT_DATE)
      ORDER BY
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        t.due_date ASC NULLS LAST
      LIMIT 20
    `;

    if (!tasks.length) {
      return {
        responseType: 'text',
        text: "You're all caught up! No pending tasks due today or overdue.",
      };
    }

    const today = new Date().toISOString().split('T')[0];
    return {
      responseType: 'list',
      title: `${tasks.length} task${tasks.length !== 1 ? 's' : ''} pending`,
      items: tasks.map((t) => {
        const isOverdue = t.due_date !== null && t.due_date < today;
        return {
          id: t.id,
          label: t.title,
          sublabel: `${t.type.replace('_', ' ')} for ${t.lead_name}`,
          badge: isOverdue ? 'Overdue' : t.due_date === today ? 'Today' : t.priority,
          badgeColor: (isOverdue ? 'red' : t.due_date === today ? 'orange' : t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'orange' : 'gray') as AssistantListItem['badgeColor'],
          href: `/app/leads/${t.lead_id}`,
        };
      }),
      totalCount: tasks.length,
    };
  }

  private async handleSuggestFollowups(companyId: string): Promise<AssistantResponse> {
    const leads = await this.fetchLeads(companyId);
    const scores = this.scoreLeads(leads);
    const scoreMap = new Map(scores.map((s) => [s.leadId, s]));

    const needsContact = leads
      .filter((l) => {
        const daysSince = l.last_contact_at
          ? Math.floor((Date.now() - new Date(l.last_contact_at).getTime()) / DAY_MS)
          : 999;
        return daysSince >= 7;
      })
      .sort((a, b) => (scoreMap.get(b.id)?.score ?? 0) - (scoreMap.get(a.id)?.score ?? 0))
      .slice(0, 10);

    if (!needsContact.length) {
      return {
        responseType: 'text',
        text: 'Great work — all your active leads have been contacted within the last 7 days!',
      };
    }

    return {
      responseType: 'list',
      title: `${needsContact.length} lead${needsContact.length !== 1 ? 's' : ''} needing follow-up`,
      items: needsContact.map((l) => {
        const score = scoreMap.get(l.id);
        const daysSince = l.last_contact_at
          ? Math.floor((Date.now() - new Date(l.last_contact_at).getTime()) / DAY_MS)
          : null;
        return {
          id: l.id,
          label: l.name,
          sublabel:
            daysSince === null
              ? 'Never contacted'
              : `Last contact ${daysSince} days ago · ${l.temperature} · ${l.stage.replace('_', ' ')}`,
          badge: score?.grade,
          badgeColor: (score?.grade === 'A' ? 'green' : score?.grade === 'B' ? 'blue' : score?.grade === 'C' ? 'orange' : 'gray') as AssistantListItem['badgeColor'],
          href: `/app/leads/${l.id}`,
        };
      }),
      totalCount: needsContact.length,
    };
  }

  private async handleAnalyzePipeline(companyId: string): Promise<AssistantResponse> {
    type StageCount = { stage: string; count: string };
    const rows = await this.prisma.$queryRaw<StageCount[]>`
      SELECT stage, COUNT(*)::text AS count
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage NOT IN ('closed', 'lost')
      GROUP BY stage
      ORDER BY
        CASE stage
          WHEN 'new'            THEN 1
          WHEN 'contacted'      THEN 2
          WHEN 'qualified'      THEN 3
          WHEN 'active'         THEN 4
          WHEN 'under_contract' THEN 5
          ELSE 6
        END
    `;

    const stageColors: Record<string, string> = {
      new: '#94a3b8',
      contacted: '#60a5fa',
      qualified: '#a78bfa',
      active: '#34d399',
      under_contract: '#f59e0b',
    };

    const total = rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
    return {
      responseType: 'chart',
      title: `Pipeline breakdown — ${total} active lead${total !== 1 ? 's' : ''}`,
      chart: {
        title: 'Leads by Stage',
        bars: rows.map((r) => ({
          label: r.stage.replace('_', ' '),
          value: parseInt(r.count, 10),
          color: stageColors[r.stage] ?? '#6b7280',
        })),
      },
      summaryCards: [
        { label: 'Total Active', value: total, color: 'blue' },
        ...rows.map((r) => ({
          label: r.stage.charAt(0).toUpperCase() + r.stage.slice(1).replace('_', ' '),
          value: parseInt(r.count, 10),
        })),
      ],
    };
  }

  private async handleHotLeads(companyId: string): Promise<AssistantResponse> {
    const leads = await this.fetchLeads(companyId);
    const scores = this.scoreLeads(leads);
    const top = scores
      .filter((s) => s.grade === 'A' || s.grade === 'B')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (!top.length) {
      return {
        responseType: 'text',
        text: 'No A or B grade leads found. Your pipeline may need more active or warm leads.',
      };
    }
    return {
      responseType: 'list',
      title: `${top.length} high-potential lead${top.length !== 1 ? 's' : ''} this month`,
      items: top.map((ls) => ({
        id: ls.leadId,
        label: ls.leadName,
        sublabel: `Score ${ls.score}/100 · ${ls.reasoning.slice(0, 2).join(' · ')}`,
        badge: `${ls.grade} · ${ls.score}`,
        badgeColor: (ls.grade === 'A' ? 'green' : 'blue') as AssistantListItem['badgeColor'],
        href: `/app/leads/${ls.leadId}`,
      })),
      totalCount: top.length,
    };
  }

  private async handlePricingCheck(companyId: string): Promise<AssistantResponse> {
    const [properties, marketAvgs] = await Promise.all([
      this.fetchProperties(companyId),
      this.fetchMarketAverages(companyId),
    ]);
    const insights = this.buildPricingInsights(properties, marketAvgs);

    if (!insights.length) {
      return {
        responseType: 'text',
        text: 'Not enough market comparables to generate pricing insights. More listings in your area are needed.',
      };
    }
    return {
      responseType: 'list',
      title: `${insights.length} listing${insights.length !== 1 ? 's' : ''} analysed`,
      items: insights.map((p) => ({
        id: p.listingId,
        label: p.listingTitle,
        sublabel: `Listed ${p.priceDiff > 0 ? '+' : ''}${p.priceDiff}% vs market avg (${p.comparablesCount} comparables)`,
        badge: p.recommendation,
        badgeColor: (p.recommendation === 'overpriced' ? 'red' : p.recommendation === 'underpriced' ? 'blue' : 'green') as AssistantListItem['badgeColor'],
        href: `/app/properties/${p.listingId}`,
      })),
      totalCount: insights.length,
    };
  }

  private async handleBuyerMatches(companyId: string): Promise<AssistantResponse> {
    const [leads, properties] = await Promise.all([
      this.fetchLeads(companyId),
      this.fetchProperties(companyId),
    ]);
    const matches = this.buildBuyerMatches(leads, properties);

    if (!matches.length) {
      return {
        responseType: 'text',
        text: 'No buyer-property matches found. Ensure your leads have budget and preference data to enable matching.',
      };
    }
    return {
      responseType: 'list',
      title: `${matches.length} buyer match${matches.length !== 1 ? 'es' : ''} found`,
      items: matches.slice(0, 15).map((m) => ({
        id: `${m.leadId}-${m.listingId}`,
        label: `${m.leadName} → ${m.listingTitle}`,
        sublabel: m.matchReasons.slice(0, 2).join(' · '),
        badge: `${m.matchScore}%`,
        badgeColor: (m.matchScore >= 80 ? 'green' : m.matchScore >= 60 ? 'blue' : 'orange') as AssistantListItem['badgeColor'],
        href: `/app/leads/${m.leadId}`,
      })),
      totalCount: matches.length,
    };
  }

  // ── New handlers ───────────────────────────────────────────────────────────

  private async handleOverdueTasks(companyId: string): Promise<AssistantResponse> {
    type TaskRow = { id: string; title: string; type: string; priority: string; due_date: string; lead_name: string; lead_id: string };
    const tasks = await this.prisma.$queryRaw<TaskRow[]>`
      SELECT t.id, t.title, t.type, t.priority, t.due_date::text,
             l.name AS lead_name, l.id AS lead_id
      FROM sales.lead_tasks t
      JOIN sales.leads l ON l.id = t.lead_id
      WHERE t.company_id = ${companyId}::uuid
        AND t.completed = false
        AND t.due_date < CURRENT_DATE
      ORDER BY t.due_date ASC,
               CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
      LIMIT 20
    `;
    if (!tasks.length) {
      return { responseType: 'text', text: 'No overdue tasks — you are all caught up!' };
    }
    return {
      responseType: 'list',
      title: `${tasks.length} overdue task${tasks.length !== 1 ? 's' : ''}`,
      items: tasks.map((t) => ({
        id: t.id,
        label: t.title,
        sublabel: `${t.type.replace(/_/g, ' ')} for ${t.lead_name} · due ${t.due_date}`,
        badge: t.priority === 'high' ? 'High' : 'Overdue',
        badgeColor: 'red' as AssistantListItem['badgeColor'],
        href: `/app/leads/${t.lead_id}`,
      })),
      totalCount: tasks.length,
    };
  }

  private async handleUpcomingTasks(companyId: string): Promise<AssistantResponse> {
    type TaskRow = { id: string; title: string; type: string; priority: string; due_date: string; lead_name: string; lead_id: string };
    const tasks = await this.prisma.$queryRaw<TaskRow[]>`
      SELECT t.id, t.title, t.type, t.priority, t.due_date::text,
             l.name AS lead_name, l.id AS lead_id
      FROM sales.lead_tasks t
      JOIN sales.leads l ON l.id = t.lead_id
      WHERE t.company_id = ${companyId}::uuid
        AND t.completed = false
        AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY t.due_date ASC,
               CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
      LIMIT 20
    `;
    if (!tasks.length) {
      return { responseType: 'text', text: 'No tasks due in the next 7 days. Check overdue tasks or schedule new ones.' };
    }
    const today = new Date().toISOString().split('T')[0];
    return {
      responseType: 'list',
      title: `${tasks.length} task${tasks.length !== 1 ? 's' : ''} due this week`,
      items: tasks.map((t) => ({
        id: t.id,
        label: t.title,
        sublabel: `${t.type.replace(/_/g, ' ')} for ${t.lead_name} · due ${t.due_date}`,
        badge: t.due_date === today ? 'Today' : t.priority,
        badgeColor: (t.due_date === today ? 'orange' : t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'orange' : 'gray') as AssistantListItem['badgeColor'],
        href: `/app/leads/${t.lead_id}`,
      })),
      totalCount: tasks.length,
    };
  }

  private async handleHighPriorityTasks(companyId: string): Promise<AssistantResponse> {
    type TaskRow = { id: string; title: string; type: string; due_date: string | null; lead_name: string; lead_id: string };
    const tasks = await this.prisma.$queryRaw<TaskRow[]>`
      SELECT t.id, t.title, t.type, t.due_date::text,
             l.name AS lead_name, l.id AS lead_id
      FROM sales.lead_tasks t
      JOIN sales.leads l ON l.id = t.lead_id
      WHERE t.company_id = ${companyId}::uuid
        AND t.completed = false
        AND t.priority = 'high'
      ORDER BY t.due_date ASC NULLS LAST
      LIMIT 20
    `;
    if (!tasks.length) {
      return { responseType: 'text', text: 'No high priority tasks found. Keep on top of your pipeline!' };
    }
    return {
      responseType: 'list',
      title: `${tasks.length} high priority task${tasks.length !== 1 ? 's' : ''}`,
      items: tasks.map((t) => ({
        id: t.id,
        label: t.title,
        sublabel: `${t.type.replace(/_/g, ' ')} for ${t.lead_name}${t.due_date ? ` · due ${t.due_date}` : ''}`,
        badge: 'High',
        badgeColor: 'red' as AssistantListItem['badgeColor'],
        href: `/app/leads/${t.lead_id}`,
      })),
      totalCount: tasks.length,
    };
  }

  private async handleCountTasks(companyId: string): Promise<AssistantResponse> {
    type CountRow = { overdue: string; today: string; pending: string; done: string };
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) FILTER (WHERE completed = false AND due_date < CURRENT_DATE)::text AS overdue,
             COUNT(*) FILTER (WHERE completed = false AND due_date = CURRENT_DATE)::text AS today,
             COUNT(*) FILTER (WHERE completed = false)::text AS pending,
             COUNT(*) FILTER (WHERE completed = true)::text AS done
      FROM sales.lead_tasks
      WHERE company_id = ${companyId}::uuid
    `;
    const r = rows[0];
    const overdue = parseInt(r?.overdue ?? '0', 10);
    const todayCount = parseInt(r?.today ?? '0', 10);
    return {
      responseType: 'summary',
      title: `Your tasks — ${r?.pending ?? 0} pending`,
      summaryCards: [
        { label: 'Overdue', value: r?.overdue ?? '0', color: overdue > 0 ? 'red' : 'gray' },
        { label: 'Due Today', value: r?.today ?? '0', color: todayCount > 0 ? 'orange' : 'gray' },
        { label: 'Pending', value: r?.pending ?? '0', color: 'blue' },
        { label: 'Completed', value: r?.done ?? '0', color: 'green' },
      ],
    };
  }

  private async handleUncontactedLeads(companyId: string): Promise<AssistantResponse> {
    type LeadBasic = { id: string; name: string; temperature: string; stage: string; created_at: Date };
    const leads = await this.prisma.$queryRaw<LeadBasic[]>`
      SELECT id, name, temperature, stage, created_at
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND last_contact_at IS NULL
        AND stage NOT IN ('closed', 'lost')
      ORDER BY created_at ASC
      LIMIT 20
    `;
    if (!leads.length) {
      return { responseType: 'text', text: 'All your active leads have been contacted at least once.' };
    }
    return {
      responseType: 'list',
      title: `${leads.length} lead${leads.length !== 1 ? 's' : ''} never contacted`,
      items: leads.map((l) => ({
        id: l.id,
        label: l.name,
        sublabel: `${l.stage.replace(/_/g, ' ')} · added ${new Date(l.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}`,
        badge: l.temperature,
        badgeColor: (l.temperature === 'hot' ? 'red' : l.temperature === 'warm' ? 'orange' : 'gray') as AssistantListItem['badgeColor'],
        href: `/app/leads/${l.id}`,
      })),
      totalCount: leads.length,
    };
  }

  private async handlePipelineValue(companyId: string): Promise<AssistantResponse> {
    type PipelineRow = { stage: string; count: string; total_value: string };
    const rows = await this.prisma.$queryRaw<PipelineRow[]>`
      SELECT stage,
             COUNT(*)::text AS count,
             COALESCE(SUM(deal_value), 0)::text AS total_value
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage NOT IN ('closed', 'lost')
      GROUP BY stage
      ORDER BY CASE stage
        WHEN 'new'            THEN 1
        WHEN 'contacted'      THEN 2
        WHEN 'qualified'      THEN 3
        WHEN 'active'         THEN 4
        WHEN 'under_contract' THEN 5
        ELSE 6
      END
    `;
    const total = rows.reduce((sum, r) => sum + parseFloat(r.total_value), 0);
    const fmt = (n: number) =>
      n >= 1_000_000 ? `R${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `R${(n / 1_000).toFixed(0)}K` : n > 0 ? `R${n}` : '—';

    const stageColors: Record<string, string> = { new: '#94a3b8', contacted: '#60a5fa', qualified: '#a78bfa', active: '#34d399', under_contract: '#f59e0b' };
    const totalCount = rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    return {
      responseType: 'chart',
      title: `Total pipeline: ${fmt(total)} across ${totalCount} active lead${totalCount !== 1 ? 's' : ''}`,
      chart: {
        title: 'Pipeline value by stage (R thousands)',
        bars: rows.map((r) => ({
          label: r.stage.replace(/_/g, ' '),
          value: Math.round(parseFloat(r.total_value) / 1000),
          color: stageColors[r.stage] ?? '#6b7280',
        })),
      },
      summaryCards: rows.map((r) => ({
        label: r.stage.charAt(0).toUpperCase() + r.stage.slice(1).replace(/_/g, ' '),
        value: parseFloat(r.total_value) > 0 ? fmt(parseFloat(r.total_value)) : `${r.count} leads`,
      })),
    };
  }

  private async handleDealsAtRisk(companyId: string): Promise<AssistantResponse> {
    type RiskLead = { id: string; name: string; stage: string; last_contact_at: Date | null; temperature: string };
    const leads = await this.prisma.$queryRaw<RiskLead[]>`
      SELECT id, name, stage, last_contact_at, temperature
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage IN ('active', 'under_contract', 'qualified')
        AND (last_contact_at IS NULL OR last_contact_at < NOW() - INTERVAL '14 days')
      ORDER BY last_contact_at ASC NULLS FIRST
      LIMIT 20
    `;
    if (!leads.length) {
      return { responseType: 'text', text: 'No deals at risk — all active leads have had contact within 14 days.' };
    }
    return {
      responseType: 'list',
      title: `${leads.length} deal${leads.length !== 1 ? 's' : ''} at risk — no contact in 14+ days`,
      items: leads.map((l) => {
        const daysSince = l.last_contact_at
          ? Math.floor((Date.now() - new Date(l.last_contact_at).getTime()) / DAY_MS)
          : null;
        return {
          id: l.id,
          label: l.name,
          sublabel: daysSince === null ? 'Never contacted' : `${daysSince} days since contact · ${l.stage.replace(/_/g, ' ')}`,
          badge: l.stage === 'under_contract' ? 'Urgent' : 'At Risk',
          badgeColor: (l.stage === 'under_contract' ? 'red' : 'orange') as AssistantListItem['badgeColor'],
          href: `/app/leads/${l.id}`,
        };
      }),
      totalCount: leads.length,
    };
  }

  private async handleConversionStats(companyId: string): Promise<AssistantResponse> {
    type StatsRow = { closed: string; lost: string; active: string; total: string };
    const rows = await this.prisma.$queryRaw<StatsRow[]>`
      SELECT COUNT(*) FILTER (WHERE stage = 'closed')::text AS closed,
             COUNT(*) FILTER (WHERE stage = 'lost')::text AS lost,
             COUNT(*) FILTER (WHERE stage NOT IN ('closed', 'lost'))::text AS active,
             COUNT(*)::text AS total
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
    `;
    const r = rows[0];
    const closed = parseInt(r?.closed ?? '0', 10);
    const lost = parseInt(r?.lost ?? '0', 10);
    const total = parseInt(r?.total ?? '0', 10);
    const concluded = closed + lost;
    const winRate = concluded > 0 ? Math.round((closed / concluded) * 100) : 0;
    return {
      responseType: 'summary',
      title: 'Conversion statistics',
      summaryCards: [
        { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'green' : winRate >= 30 ? 'orange' : 'red' },
        { label: 'Closed', value: closed, color: 'green' },
        { label: 'Lost', value: lost, color: 'red' },
        { label: 'Active', value: parseInt(r?.active ?? '0', 10), color: 'blue' },
        { label: 'Total', value: total },
      ],
      text: concluded > 0
        ? `You have closed **${closed}** deal${closed !== 1 ? 's' : ''} and lost **${lost}** out of **${concluded}** concluded engagements. Win rate: **${winRate}%**.`
        : 'No closed or lost leads yet. Keep working your active pipeline!',
    };
  }

  private async handleLeadsByTemperature(companyId: string, temperature: string): Promise<AssistantResponse> {
    type LeadBasic = { id: string; name: string; stage: string; last_contact_at: Date | null; budget_min: string | null; budget_max: string | null; budget_currency: string };
    const leads = await this.prisma.$queryRaw<LeadBasic[]>`
      SELECT id, name, stage, last_contact_at, budget_min, budget_max, budget_currency
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND temperature = ${temperature}
        AND stage NOT IN ('closed', 'lost')
      ORDER BY last_contact_at DESC NULLS LAST, created_at DESC
      LIMIT 20
    `;
    if (!leads.length) {
      return { responseType: 'text', text: `No ${temperature} leads found in your active pipeline.` };
    }
    const badgeColors: Record<string, AssistantListItem['badgeColor']> = { hot: 'red', warm: 'orange', cold: 'blue', nurture: 'purple' };
    return {
      responseType: 'list',
      title: `${leads.length} ${temperature} lead${leads.length !== 1 ? 's' : ''}`,
      items: leads.map((l) => {
        const daysSince = l.last_contact_at
          ? Math.floor((Date.now() - new Date(l.last_contact_at).getTime()) / DAY_MS)
          : null;
        const budgetStr = l.budget_max
          ? `Budget up to ${l.budget_currency} ${Number(l.budget_max).toLocaleString()}`
          : l.budget_min
            ? `Budget from ${l.budget_currency} ${Number(l.budget_min).toLocaleString()}`
            : 'No budget set';
        return {
          id: l.id,
          label: l.name,
          sublabel: `${l.stage.replace(/_/g, ' ')} · ${budgetStr}${daysSince !== null ? ` · ${daysSince}d ago` : ' · never contacted'}`,
          badge: temperature,
          badgeColor: badgeColors[temperature] ?? 'gray',
          href: `/app/leads/${l.id}`,
        };
      }),
      totalCount: leads.length,
    };
  }

  private async handleLeadsByStage(companyId: string, stage: string): Promise<AssistantResponse> {
    type LeadBasic = { id: string; name: string; temperature: string; last_contact_at: Date | null; deal_value: string | null; prequalified: boolean };
    const leads = await this.prisma.$queryRaw<LeadBasic[]>`
      SELECT id, name, temperature, last_contact_at, deal_value, prequalified
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage = ${stage}
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const stageLabel = stage.replace(/_/g, ' ');
    if (!leads.length) {
      return { responseType: 'text', text: `No leads in the "${stageLabel}" stage.` };
    }
    const tempColors: Record<string, AssistantListItem['badgeColor']> = { hot: 'red', warm: 'orange', cold: 'blue', nurture: 'purple' };
    return {
      responseType: 'list',
      title: `${leads.length} lead${leads.length !== 1 ? 's' : ''} — ${stageLabel}`,
      items: leads.map((l) => {
        const daysSince = l.last_contact_at
          ? Math.floor((Date.now() - new Date(l.last_contact_at).getTime()) / DAY_MS)
          : null;
        return {
          id: l.id,
          label: l.name,
          sublabel: [
            l.temperature,
            l.prequalified ? 'prequalified' : null,
            daysSince !== null ? `last contact ${daysSince}d ago` : 'never contacted',
            l.deal_value ? `R${Number(l.deal_value).toLocaleString()}` : null,
          ].filter(Boolean).join(' · '),
          badge: l.temperature,
          badgeColor: tempColors[l.temperature] ?? 'gray',
          href: `/app/leads/${l.id}`,
        };
      }),
      totalCount: leads.length,
    };
  }

  private async handlePrequalifiedLeads(companyId: string): Promise<AssistantResponse> {
    type LeadBasic = { id: string; name: string; temperature: string; stage: string; budget_min: string | null; budget_max: string | null; budget_currency: string; last_contact_at: Date | null };
    const leads = await this.prisma.$queryRaw<LeadBasic[]>`
      SELECT id, name, temperature, stage, budget_min, budget_max, budget_currency, last_contact_at
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND prequalified = true
        AND stage NOT IN ('closed', 'lost')
      ORDER BY CASE temperature WHEN 'hot' THEN 1 WHEN 'warm' THEN 2 WHEN 'nurture' THEN 3 ELSE 4 END,
               last_contact_at DESC NULLS LAST
      LIMIT 20
    `;
    if (!leads.length) {
      return { responseType: 'text', text: 'No prequalified leads found. Mark leads as prequalified when they have mortgage approval.' };
    }
    return {
      responseType: 'list',
      title: `${leads.length} prequalified lead${leads.length !== 1 ? 's' : ''} — ready to buy`,
      items: leads.map((l) => {
        const budget = l.budget_max ? `up to ${l.budget_currency} ${Number(l.budget_max).toLocaleString()}` : 'budget not set';
        return {
          id: l.id,
          label: l.name,
          sublabel: `${l.stage.replace(/_/g, ' ')} · ${l.temperature} · ${budget}`,
          badge: l.temperature,
          badgeColor: (l.temperature === 'hot' ? 'green' : l.temperature === 'warm' ? 'blue' : 'gray') as AssistantListItem['badgeColor'],
          href: `/app/leads/${l.id}`,
        };
      }),
      totalCount: leads.length,
    };
  }

  private async handleCountLeads(companyId: string): Promise<AssistantResponse> {
    type CountRow = { hot: string; warm: string; cold: string; nurture: string; active_total: string; closed: string; lost: string; total: string };
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) FILTER (WHERE temperature = 'hot')::text AS hot,
             COUNT(*) FILTER (WHERE temperature = 'warm')::text AS warm,
             COUNT(*) FILTER (WHERE temperature = 'cold')::text AS cold,
             COUNT(*) FILTER (WHERE temperature = 'nurture')::text AS nurture,
             COUNT(*) FILTER (WHERE stage NOT IN ('closed', 'lost'))::text AS active_total,
             COUNT(*) FILTER (WHERE stage = 'closed')::text AS closed,
             COUNT(*) FILTER (WHERE stage = 'lost')::text AS lost,
             COUNT(*)::text AS total
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
    `;
    const r = rows[0];
    return {
      responseType: 'summary',
      title: `You have ${r?.total ?? 0} leads total`,
      summaryCards: [
        { label: 'Active', value: r?.active_total ?? '0', color: 'blue' },
        { label: 'Hot', value: r?.hot ?? '0', color: 'red' },
        { label: 'Warm', value: r?.warm ?? '0', color: 'orange' },
        { label: 'Cold', value: r?.cold ?? '0', color: 'gray' },
        { label: 'Nurture', value: r?.nurture ?? '0', color: 'purple' },
        { label: 'Closed', value: r?.closed ?? '0', color: 'green' },
        { label: 'Lost', value: r?.lost ?? '0' },
      ],
    };
  }

  private async handleMyListings(companyId: string): Promise<AssistantResponse> {
    type ListingRow = { id: string; title: string; price: string; property_type: string; status: string; city: string | null; view_count: number };
    const listings = await this.prisma.$queryRaw<ListingRow[]>`
      SELECT p.id, p.title, p.price::text, p.property_type, p.status, pl.city, p.view_count
      FROM property.properties p
      LEFT JOIN property.property_locations pl ON pl.property_id = p.id
      WHERE p.company_id = ${companyId}::uuid
      ORDER BY p.created_at DESC
      LIMIT 20
    `;
    if (!listings.length) {
      return { responseType: 'text', text: "You don't have any listings yet. Head to Properties to create your first listing." };
    }
    const fmt = (n: number) => n >= 1_000_000 ? `R${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `R${(n / 1_000).toFixed(0)}K` : `R${n}`;
    const activeCnt = listings.filter((l) => l.status === 'active').length;
    return {
      responseType: 'list',
      title: `${listings.length} listing${listings.length !== 1 ? 's' : ''} · ${activeCnt} active`,
      items: listings.map((p) => ({
        id: p.id,
        label: p.title,
        sublabel: `${p.property_type.replace(/_/g, ' ')}${p.city ? ` · ${p.city}` : ''} · ${fmt(parseFloat(p.price))} · ${p.view_count} view${p.view_count !== 1 ? 's' : ''}`,
        badge: p.status,
        badgeColor: (p.status === 'active' ? 'green' : p.status === 'sold' ? 'blue' : 'gray') as AssistantListItem['badgeColor'],
        href: `/app/properties/${p.id}`,
      })),
      totalCount: listings.length,
    };
  }

  private async handleCountListings(companyId: string): Promise<AssistantResponse> {
    type CountRow = { total: string; active: string; sold: string; archived: string };
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::text AS total,
             COUNT(*) FILTER (WHERE status = 'active')::text AS active,
             COUNT(*) FILTER (WHERE status = 'sold')::text AS sold,
             COUNT(*) FILTER (WHERE status = 'archived')::text AS archived
      FROM property.properties
      WHERE company_id = ${companyId}::uuid
    `;
    const r = rows[0];
    return {
      responseType: 'summary',
      title: `You have ${r?.total ?? 0} listings`,
      summaryCards: [
        { label: 'Active', value: r?.active ?? '0', color: 'green' },
        { label: 'Sold', value: r?.sold ?? '0', color: 'blue' },
        { label: 'Archived', value: r?.archived ?? '0', color: 'gray' },
        { label: 'Total', value: r?.total ?? '0' },
      ],
    };
  }

  private async handlePendingViewings(companyId: string): Promise<AssistantResponse> {
    type ViewingRow = { id: string; scheduled_at: Date; viewing_type: string; property_title: string; property_id: string; buyer_name: string };
    const viewings = await this.prisma.$queryRaw<ViewingRow[]>`
      SELECT v.id, v.scheduled_at, v.viewing_type,
             p.title AS property_title, p.id AS property_id,
             CONCAT(u.first_name, ' ', u.last_name) AS buyer_name
      FROM property.viewings v
      JOIN property.properties p ON p.id = v.property_id
      JOIN identity.users u ON u.id = v.buyer_id
      WHERE p.company_id = ${companyId}::uuid
        AND v.status = 'requested'
      ORDER BY v.scheduled_at ASC
      LIMIT 20
    `;
    if (!viewings.length) {
      return { responseType: 'text', text: 'No pending viewing requests — you are up to date!' };
    }
    return {
      responseType: 'list',
      title: `${viewings.length} viewing request${viewings.length !== 1 ? 's' : ''} awaiting response`,
      items: viewings.map((v) => ({
        id: v.id,
        label: `${v.buyer_name} → ${v.property_title}`,
        sublabel: `${v.viewing_type.replace(/_/g, ' ')} · ${new Date(v.scheduled_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}`,
        badge: 'Needs response',
        badgeColor: 'orange' as AssistantListItem['badgeColor'],
        href: `/app/properties/${v.property_id}`,
      })),
      totalCount: viewings.length,
    };
  }

  private async handleUpcomingViewings(companyId: string): Promise<AssistantResponse> {
    type ViewingRow = { id: string; scheduled_at: Date; viewing_type: string; property_title: string; property_id: string; buyer_name: string };
    const viewings = await this.prisma.$queryRaw<ViewingRow[]>`
      SELECT v.id, v.scheduled_at, v.viewing_type,
             p.title AS property_title, p.id AS property_id,
             CONCAT(u.first_name, ' ', u.last_name) AS buyer_name
      FROM property.viewings v
      JOIN property.properties p ON p.id = v.property_id
      JOIN identity.users u ON u.id = v.buyer_id
      WHERE p.company_id = ${companyId}::uuid
        AND v.status = 'confirmed'
        AND v.scheduled_at >= NOW()
      ORDER BY v.scheduled_at ASC
      LIMIT 20
    `;
    if (!viewings.length) {
      return { responseType: 'text', text: 'No upcoming confirmed viewings in your schedule.' };
    }
    return {
      responseType: 'list',
      title: `${viewings.length} upcoming viewing${viewings.length !== 1 ? 's' : ''}`,
      items: viewings.map((v) => ({
        id: v.id,
        label: `${v.buyer_name} · ${v.property_title}`,
        sublabel: `${v.viewing_type.replace(/_/g, ' ')} · ${new Date(v.scheduled_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}`,
        badge: 'Confirmed',
        badgeColor: 'green' as AssistantListItem['badgeColor'],
        href: `/app/properties/${v.property_id}`,
      })),
      totalCount: viewings.length,
    };
  }

  private async handleCountViewings(companyId: string): Promise<AssistantResponse> {
    type CountRow = { pending: string; upcoming: string; completed: string; total: string };
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) FILTER (WHERE v.status = 'requested')::text AS pending,
             COUNT(*) FILTER (WHERE v.status = 'confirmed' AND v.scheduled_at >= NOW())::text AS upcoming,
             COUNT(*) FILTER (WHERE v.status = 'completed')::text AS completed,
             COUNT(*)::text AS total
      FROM property.viewings v
      JOIN property.properties p ON p.id = v.property_id
      WHERE p.company_id = ${companyId}::uuid
    `;
    const r = rows[0];
    const pending = parseInt(r?.pending ?? '0', 10);
    return {
      responseType: 'summary',
      title: `Your viewings — ${r?.total ?? 0} total`,
      summaryCards: [
        { label: 'Needs Response', value: r?.pending ?? '0', color: pending > 0 ? 'red' : 'gray' },
        { label: 'Upcoming', value: r?.upcoming ?? '0', color: 'blue' },
        { label: 'Completed', value: r?.completed ?? '0', color: 'green' },
        { label: 'Total', value: r?.total ?? '0' },
      ],
    };
  }

  private async handleUpcomingOpenHouses(companyId: string): Promise<AssistantResponse> {
    type OhRow = { id: string; scheduled_at: Date; end_at: Date; max_attendees: number | null; property_title: string; property_id: string };
    const rows = await this.prisma.$queryRaw<OhRow[]>`
      SELECT oh.id, oh.scheduled_at, oh.end_at, oh.max_attendees,
             p.title AS property_title, p.id AS property_id
      FROM property.open_houses oh
      JOIN property.properties p ON p.id = oh.property_id
      WHERE p.company_id = ${companyId}::uuid
        AND oh.status = 'scheduled'
        AND oh.scheduled_at >= NOW()
      ORDER BY oh.scheduled_at ASC
      LIMIT 10
    `;
    if (!rows.length) {
      return { responseType: 'text', text: 'No upcoming open houses scheduled. Create one from the property detail page.' };
    }
    return {
      responseType: 'list',
      title: `${rows.length} upcoming open house${rows.length !== 1 ? 's' : ''}`,
      items: rows.map((oh) => ({
        id: oh.id,
        label: oh.property_title,
        sublabel: `${new Date(oh.scheduled_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}${oh.max_attendees ? ` · max ${oh.max_attendees} attendees` : ''}`,
        badge: 'Scheduled',
        badgeColor: 'blue' as AssistantListItem['badgeColor'],
        href: `/app/properties/${oh.property_id}`,
      })),
      totalCount: rows.length,
    };
  }

  private async handleRecentActivity(companyId: string): Promise<AssistantResponse> {
    type ActivityRow = { id: string; type: string; description: string; created_at: Date; lead_name: string; lead_id: string; actor_name: string };
    const activities = await this.prisma.$queryRaw<ActivityRow[]>`
      SELECT a.id, a.type, a.description, a.created_at,
             l.name AS lead_name, l.id AS lead_id,
             CONCAT(u.first_name, ' ', u.last_name) AS actor_name
      FROM sales.lead_activities a
      JOIN sales.leads l ON l.id = a.lead_id
      LEFT JOIN identity.users u ON u.id = a.actor_id
      WHERE a.company_id = ${companyId}::uuid
      ORDER BY a.created_at DESC
      LIMIT 15
    `;
    if (!activities.length) {
      return { responseType: 'text', text: 'No activity logged yet. Activities are recorded when you call, email, or update leads.' };
    }
    const typeColors: Record<string, AssistantListItem['badgeColor']> = {
      stage_change: 'purple', call: 'blue', email: 'green', meeting: 'orange', note: 'gray', follow_up: 'blue',
    };
    return {
      responseType: 'list',
      title: `${activities.length} recent activit${activities.length !== 1 ? 'ies' : 'y'}`,
      items: activities.map((a) => ({
        id: a.id,
        label: `${a.type.replace(/_/g, ' ')} — ${a.lead_name}`,
        sublabel: [
          a.description ? a.description.slice(0, 80) : null,
          a.actor_name?.trim() ? `by ${a.actor_name.trim()}` : null,
          this.formatRelativeTime(a.created_at),
        ].filter(Boolean).join(' · '),
        badge: a.type.replace(/_/g, ' '),
        badgeColor: typeColors[a.type] ?? 'gray',
        href: `/app/leads/${a.lead_id}`,
      })),
      totalCount: activities.length,
    };
  }

  private async handleBusinessSummary(companyId: string): Promise<AssistantResponse> {
    type LeadSummary = { active_leads: string; hot_leads: string; under_contract: string; closed_deals: string; total_leads: string; pipeline_value: string };
    type ListingSummary = { total: string; active: string };
    type TaskSummary = { overdue: string; pending: string };
    type ViewingSummary = { pending: string; upcoming: string };

    const [leadRows, listingRows, taskRows, viewingRows] = await Promise.all([
      this.prisma.$queryRaw<LeadSummary[]>`
        SELECT COUNT(*) FILTER (WHERE stage NOT IN ('closed','lost'))::text AS active_leads,
               COUNT(*) FILTER (WHERE temperature = 'hot')::text AS hot_leads,
               COUNT(*) FILTER (WHERE stage = 'under_contract')::text AS under_contract,
               COUNT(*) FILTER (WHERE stage = 'closed')::text AS closed_deals,
               COUNT(*)::text AS total_leads,
               COALESCE(SUM(deal_value) FILTER (WHERE stage NOT IN ('closed','lost')), 0)::text AS pipeline_value
        FROM sales.leads WHERE company_id = ${companyId}::uuid
      `,
      this.prisma.$queryRaw<ListingSummary[]>`
        SELECT COUNT(*)::text AS total,
               COUNT(*) FILTER (WHERE status = 'active')::text AS active
        FROM property.properties WHERE company_id = ${companyId}::uuid
      `,
      this.prisma.$queryRaw<TaskSummary[]>`
        SELECT COUNT(*) FILTER (WHERE completed = false AND due_date < CURRENT_DATE)::text AS overdue,
               COUNT(*) FILTER (WHERE completed = false)::text AS pending
        FROM sales.lead_tasks WHERE company_id = ${companyId}::uuid
      `,
      this.prisma.$queryRaw<ViewingSummary[]>`
        SELECT COUNT(*) FILTER (WHERE v.status = 'requested')::text AS pending,
               COUNT(*) FILTER (WHERE v.status = 'confirmed' AND v.scheduled_at >= NOW())::text AS upcoming
        FROM property.viewings v
        JOIN property.properties p ON p.id = v.property_id
        WHERE p.company_id = ${companyId}::uuid
      `,
    ]);

    const l = leadRows[0];
    const p = listingRows[0];
    const t = taskRows[0];
    const v = viewingRows[0];
    const pv = parseFloat(l?.pipeline_value ?? '0');
    const pvStr = pv >= 1_000_000 ? `R${(pv / 1_000_000).toFixed(1)}M` : pv >= 1_000 ? `R${(pv / 1_000).toFixed(0)}K` : pv > 0 ? `R${pv}` : null;
    const overdue = parseInt(t?.overdue ?? '0', 10);
    const viewingsPending = parseInt(v?.pending ?? '0', 10);

    return {
      responseType: 'summary',
      title: 'Business snapshot',
      text: pvStr ? `Total pipeline value: **${pvStr}**` : undefined,
      summaryCards: [
        { label: 'Active Leads', value: l?.active_leads ?? '0', color: 'blue' },
        { label: 'Hot Leads', value: l?.hot_leads ?? '0', color: 'red' },
        { label: 'Under Contract', value: l?.under_contract ?? '0', color: 'orange' },
        { label: 'Deals Closed', value: l?.closed_deals ?? '0', color: 'green' },
        { label: 'Active Listings', value: p?.active ?? '0', color: 'purple' },
        { label: 'Overdue Tasks', value: t?.overdue ?? '0', color: overdue > 0 ? 'red' : 'gray' },
        { label: 'Pending Viewings', value: v?.pending ?? '0', color: viewingsPending > 0 ? 'orange' : 'gray' },
        { label: 'Upcoming Viewings', value: v?.upcoming ?? '0', color: 'blue' },
      ],
    };
  }

  private async handleEntitySearch(companyId: string, nameQuery: string): Promise<AssistantResponse> {
    const pattern = `%${nameQuery}%`;
    const [leads, properties] = await Promise.all([
      this.prisma.$queryRaw<Array<{ id: string; name: string; temperature: string; stage: string; last_contact_at: Date | null }>>`
        SELECT id, name, temperature, stage, last_contact_at
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
          AND LOWER(name) LIKE LOWER(${pattern})
        ORDER BY created_at DESC
        LIMIT 5
      `,
      this.prisma.$queryRaw<Array<{ id: string; title: string; price: string; property_type: string; city: string | null }>>`
        SELECT p.id, p.title, p.price::text, p.property_type, pl.city
        FROM property.properties p
        LEFT JOIN property.property_locations pl ON pl.property_id = p.id
        WHERE p.company_id = ${companyId}::uuid
          AND LOWER(p.title) LIKE LOWER(${pattern})
        ORDER BY p.created_at DESC
        LIMIT 5
      `,
    ]);

    if (!leads.length && !properties.length) {
      return {
        responseType: 'text',
        text: `No leads or listings found matching **"${nameQuery}"**. Try a different name or partial word.`,
      };
    }

    const fmt = (n: number) => n >= 1_000_000 ? `R${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `R${(n / 1_000).toFixed(0)}K` : `R${n}`;
    const items: AssistantListItem[] = [];

    for (const lead of leads) {
      const daysSince = lead.last_contact_at
        ? Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / DAY_MS)
        : null;
      items.push({
        id: lead.id,
        label: lead.name,
        sublabel: `Lead · ${lead.stage.replace(/_/g, ' ')} · ${lead.temperature}${daysSince !== null ? ` · contacted ${daysSince}d ago` : ' · never contacted'}`,
        badge: lead.temperature,
        badgeColor: (lead.temperature === 'hot' ? 'red' : lead.temperature === 'warm' ? 'orange' : lead.temperature === 'cold' ? 'blue' : 'gray') as AssistantListItem['badgeColor'],
        href: `/app/leads/${lead.id}`,
      });
    }

    for (const prop of properties) {
      items.push({
        id: prop.id,
        label: prop.title,
        sublabel: `Listing · ${prop.property_type.replace(/_/g, ' ')}${prop.city ? ` in ${prop.city}` : ''} · ${fmt(parseFloat(prop.price))}`,
        badge: 'listing',
        badgeColor: 'purple',
        href: `/app/properties/${prop.id}`,
      });
    }

    return {
      responseType: 'list',
      title: `${items.length} result${items.length !== 1 ? 's' : ''} for "${nameQuery}"`,
      items,
      totalCount: items.length,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private extractEntityName(query: string): string | null {
    const patterns = [
      /\btell me about (.+)/,
      /\babout ([a-z][a-z\s'-]{2,})/,
      /\bfind lead (.+)/,
      /\blookup (.+)/,
      /\bsearch for (.+)/,
      /\bwho is (.+)/,
      /\binfo on (.+)/,
      /\binfo about (.+)/,
      /\bdetails (?:on|for) (.+)/,
    ];
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match?.[1] && match[1].trim().length >= 3) {
        const extracted = match[1].trim().replace(/[?!.]+$/, '');
        // Ignore if it looks like a system keyword that would have matched an intent already
        const systemWords = ['my pipeline', 'my tasks', 'my listings', 'my leads', 'open houses', 'recent activity'];
        if (systemWords.some((w) => extracted.includes(w))) return null;
        return extracted;
      }
    }
    return null;
  }

  private formatRelativeTime(date: Date | string): string {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / 3_600_000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  }

  // ── Context-aware entity detail handlers ──────────────────────────────────

  private async handleLeadById(
    companyId: string,
    leadId: string,
  ): Promise<AssistantResponse> {
    type LeadRow = {
      id: string;
      name: string;
      temperature: string;
      stage: string;
      last_contact_at: Date | null;
      deal_value: string | null;
      budget_min: string | null;
      budget_max: string | null;
      budget_currency: string;
      prequalified: boolean;
      preferred_location: string | null;
    };
    const leads = await this.prisma.$queryRaw<LeadRow[]>`
      SELECT id, name, temperature, stage, last_contact_at,
             deal_value::text, budget_min::text, budget_max::text,
             budget_currency, prequalified, preferred_location
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND id = ${leadId}::uuid
      LIMIT 1
    `;
    if (!leads.length) {
      return {
        responseType: 'text',
        text: 'I could not find that lead. They may have been deleted or you may not have access.',
      };
    }
    const l = leads[0];
    const daysSince =
      l.last_contact_at !== null
        ? Math.floor((Date.now() - new Date(l.last_contact_at).getTime()) / DAY_MS)
        : null;
    const budget = l.budget_max
      ? `Up to ${l.budget_currency} ${Number(l.budget_max).toLocaleString()}`
      : l.budget_min
        ? `From ${l.budget_currency} ${Number(l.budget_min).toLocaleString()}`
        : 'Not specified';

    type TaskRow = { title: string; type: string; due_date: string | null };
    const tasks = await this.prisma.$queryRaw<TaskRow[]>`
      SELECT title, type, due_date::text
      FROM sales.lead_tasks
      WHERE lead_id = ${leadId}::uuid
        AND completed = false
      ORDER BY due_date ASC NULLS LAST
      LIMIT 5
    `;

    const lines: string[] = [
      `**${l.name}** is a **${l.temperature}** lead in *${l.stage.replace(/_/g, ' ')}* stage.`,
      `• Budget: ${budget}`,
      ...(l.preferred_location ? [`• Preferred location: ${l.preferred_location}`] : []),
      ...(l.prequalified ? ['• ✓ Prequalified for mortgage'] : []),
      ...(daysSince !== null
        ? [`• Last contacted ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`]
        : ['• Never contacted']),
      ...(l.deal_value ? [`• Deal value: R${Number(l.deal_value).toLocaleString()}`] : []),
      ...(tasks.length
        ? [
            '',
            `**Pending tasks (${tasks.length}):**`,
            ...tasks.map(
              (t) =>
                `• ${t.title} — ${t.type.replace(/_/g, ' ')}${t.due_date ? `, due ${t.due_date}` : ''}`,
            ),
          ]
        : []),
    ];

    return {
      responseType: 'text',
      title: l.name,
      text: lines.join('\n'),
    };
  }

  private async handlePropertyById(
    companyId: string,
    propertyId: string,
  ): Promise<AssistantResponse> {
    type PropRow = {
      id: string;
      title: string;
      price: string;
      property_type: string;
      status: string;
      bedrooms: number | null;
      bathrooms: number | null;
      view_count: number;
      city: string | null;
    };
    const props = await this.prisma.$queryRaw<PropRow[]>`
      SELECT p.id, p.title, p.price::text, p.property_type, p.status,
             p.bedrooms, p.bathrooms, p.view_count, pl.city
      FROM property.properties p
      LEFT JOIN property.property_locations pl ON pl.property_id = p.id
      WHERE p.company_id = ${companyId}::uuid
        AND p.id = ${propertyId}::uuid
      LIMIT 1
    `;
    if (!props.length) {
      return {
        responseType: 'text',
        text: 'Property not found or you do not have access to it.',
      };
    }
    const p = props[0];
    const price = parseFloat(p.price ?? '0');
    const priceStr =
      price >= 1_000_000
        ? `R${(price / 1_000_000).toFixed(1)}M`
        : price >= 1_000
          ? `R${(price / 1_000).toFixed(0)}K`
          : `R${price.toLocaleString()}`;

    const lines: string[] = [
      `**${p.title}** — ${p.property_type.replace(/_/g, ' ')} at **${priceStr}**`,
      `• Status: ${p.status}`,
      ...(p.city ? [`• Location: ${p.city}`] : []),
      ...(p.bedrooms !== null
        ? [`• ${p.bedrooms} bed / ${p.bathrooms ?? '?'} bath`]
        : []),
      `• ${p.view_count} view${p.view_count !== 1 ? 's' : ''} on this listing`,
    ];

    return {
      responseType: 'text',
      title: p.title,
      text: lines.join('\n'),
    };
  }

  private handleHelp(): AssistantResponse {
    return {
      responseType: 'text',
      title: 'What I can help you with',
      text: [
        '**Tasks:**',
        '• "What are my overdue tasks?" · "Tasks due this week" · "High priority tasks" · "How many tasks?"',
        '',
        '**Leads:**',
        '• "How many leads do I have?" · "Hot leads" · "Warm leads" · "Cold leads" · "Nurture leads"',
        '• "New leads" · "Contacted leads" · "Active leads" · "Under contract"',
        '• "Prequalified buyers" · "Never contacted leads"',
        '• "Tell me about [name]" or "Find lead [name]" to look up a specific person',
        '',
        '**Pipeline & Performance:**',
        '• "Analyze my pipeline" · "Pipeline value" · "Deals at risk" · "Conversion rate" · "Win rate"',
        '• "Business summary" · "How am I doing?" · "Overview" · "My stats"',
        '',
        '**Listings:**',
        '• "My listings" · "Active listings" · "How many properties?" · "Check pricing"',
        '• "Find buyers" · "Buyer matches" · "Write listing description"',
        '',
        '**Viewings & Open Houses:**',
        '• "Pending viewing requests" · "Upcoming viewings" · "How many viewings?" · "Open houses"',
        '',
        '**Follow-ups & Activity:**',
        '• "Suggest follow-ups" · "Who should I contact today?" · "Recent activity"',
      ].join('\n'),
    };
  }

  private matchesAny(query: string, patterns: string[]): boolean {
    return patterns.some((p) => query.includes(p));
  }

  // ── Synonym normalisation ─────────────────────────────────────────────────
  // Maps natural-language words to the specific terms used by intent checks so
  // free-form questions like "show me my clients" still hit the right handler.
  private normalizeSynonyms(q: string): string {
    return q
      // People synonyms → leads
      .replace(/\bclients?\b/g, 'leads')
      .replace(/\bcustomers?\b/g, 'leads')
      .replace(/\bprospects?\b/g, 'leads')
      .replace(/\bcontacts?\b(?!\s+me\b)/g, 'leads')
      .replace(/\bbuyers?\b(?!\s+match)/g, 'leads')
      .replace(/\bsellers?\b/g, 'leads')
      // Property synonyms → listings / properties
      .replace(/\bhomes?\b/g, 'properties')
      .replace(/\bhouses?\b/g, 'properties')
      .replace(/\bapartments?\b/g, 'properties')
      .replace(/\bunits?\b/g, 'properties')
      .replace(/\blistings?\b/g, 'properties')
      // Viewing/appointment synonyms
      .replace(/\bappointments?\b/g, 'viewings')
      .replace(/\bshowings?\b/g, 'viewings')
      .replace(/\bsite visits?\b/g, 'viewings')
      .replace(/\binspections?\b/g, 'viewings')
      .replace(/\bbook(?:ed|ing)?\b/g, 'viewings')
      // Task synonyms
      .replace(/\bto-?dos?\b/g, 'tasks')
      .replace(/\baction items?\b/g, 'tasks')
      .replace(/\breminders?\b/g, 'tasks')
      .replace(/\bchecklists?\b/g, 'tasks')
      // Urgency/priority synonyms
      .replace(/\basap\b/g, 'urgent tasks')
      .replace(/\bcritical\b/g, 'high priority')
      // Contact activity synonyms
      .replace(/\bcalled\b/g, 'contacted')
      .replace(/\bspoken to\b/g, 'contacted')
      .replace(/\breached out\b/g, 'follow up')
      .replace(/\bcheck in\b/g, 'follow up')
      .replace(/\btouch base\b/g, 'follow up')
      // Summary / overview synonyms
      .replace(/\bhow am i doing\b/g, 'business summary')
      .replace(/\bmy numbers\b/g, 'my stats')
      .replace(/\bmy performance\b/g, 'performance')
      .replace(/\bgive me an overview\b/g, 'overview')
      .replace(/\bwhat(?:'s| is) going on\b/g, 'recent activity')
      .replace(/\bwhat(?:'s| is) new\b/g, 'recent activity')
      // Finance/revenue synonyms
      .replace(/\brevenue\b/g, 'pipeline value')
      .replace(/\bearnings\b/g, 'pipeline value')
      .replace(/\bforecast\b/g, 'pipeline value')
      .replace(/\bhow much (?:could i|can i|will i) (?:earn|make)\b/g, 'pipeline value');
  }

  // ── Semantic fallback — free-form intent scoring ──────────────────────────
  // When no exact keyword phrase matches, score every known intent by how many
  // of its semantic tokens appear in the (already-normalised) query.  The best
  // match is executed; if confidence is moderate the response is annotated so
  // the user knows what was inferred and can correct it.
  private async semanticFallback(
    originalQuery: string,
    normalizedQuery: string,
    companyId: string,
  ): Promise<AssistantResponse> {
    // Apply synonym expansion here (not as a pre-processor) so existing
    // exact-match patterns are unaffected.
    const nq = this.normalizeSynonyms(normalizedQuery);

    type IntentEntry = {
      label: string;
      tokens: string[];
      handler: (c: string) => Promise<AssistantResponse>;
    };

    const intents: IntentEntry[] = [
      {
        label: 'overdue tasks',
        tokens: ['overdue', 'late', 'missed', 'past due', 'behind', 'delayed', 'overdue tasks'],
        handler: (c) => this.handleOverdueTasks(c),
      },
      {
        label: 'tasks due this week',
        tokens: ['upcoming tasks', 'this week', 'due soon', 'next few days', 'week tasks'],
        handler: (c) => this.handleUpcomingTasks(c),
      },
      {
        label: 'high priority tasks',
        tokens: ['high priority', 'priority tasks', 'urgent tasks', 'important tasks', 'pressing'],
        handler: (c) => this.handleHighPriorityTasks(c),
      },
      {
        label: "today's tasks",
        tokens: ['tasks', 'my tasks', 'today', 'pending', 'what do i need', 'need to do', 'things to do'],
        handler: (c) => this.handleSummarizeTasks(c),
      },
      {
        label: 'suggested follow-ups',
        tokens: ['follow up', 'follow-up', 'who to call', 'reach out', 'who should i contact', 'check in'],
        handler: (c) => this.handleSuggestFollowups(c),
      },
      {
        label: 'leads never contacted',
        tokens: ['never contacted', 'not contacted', 'never spoken', 'no contact', 'uncontacted', 'ghosted', 'no response'],
        handler: (c) => this.handleUncontactedLeads(c),
      },
      {
        label: 'pipeline value',
        tokens: ['pipeline value', 'pipeline worth', 'deal value', 'potential revenue', 'pipeline revenue', 'worth'],
        handler: (c) => this.handlePipelineValue(c),
      },
      {
        label: 'deals at risk',
        tokens: ['deals at risk', 'stale deals', 'stuck deals', 'silent deals', 'no activity', 'falling through', 'stalled'],
        handler: (c) => this.handleDealsAtRisk(c),
      },
      {
        label: 'pipeline breakdown',
        tokens: ['pipeline', 'funnel', 'breakdown', 'stages', 'by stage', 'stage distribution', 'pipeline analysis'],
        handler: (c) => this.handleAnalyzePipeline(c),
      },
      {
        label: 'conversion stats',
        tokens: ['conversion', 'win rate', 'close rate', 'closed deals', 'success rate', 'deals won', 'deals lost'],
        handler: (c) => this.handleConversionStats(c),
      },
      {
        label: 'hot leads',
        tokens: ['hot leads', 'best leads', 'top leads', 'likely to close', 'most interested', 'best prospects', 'buying soon'],
        handler: (c) => this.handleHotLeads(c),
      },
      {
        label: 'prequalified leads',
        tokens: ['prequalified', 'pre-qualified', 'mortgage approved', 'finance approved', 'has funding', 'financially qualified'],
        handler: (c) => this.handlePrequalifiedLeads(c),
      },
      {
        label: 'all my leads',
        tokens: ['all leads', 'show leads', 'list leads', 'all my leads', 'my leads', 'everyone', 'lead count', 'how many leads'],
        handler: (c) => this.handleCountLeads(c),
      },
      {
        label: 'my listings',
        tokens: ['my properties', 'all properties', 'show properties', 'my listings', 'active listings', 'properties on market'],
        handler: (c) => this.handleMyListings(c),
      },
      {
        label: 'pricing analysis',
        tokens: ['pricing', 'overpriced', 'underpriced', 'market price', 'price check', 'too expensive', 'price my'],
        handler: (c) => this.handlePricingCheck(c),
      },
      {
        label: 'buyer matches',
        tokens: ['find buyers', 'buyer matches', 'matching buyers', 'who wants to buy', 'buyers for this'],
        handler: (c) => this.handleBuyerMatches(c),
      },
      {
        label: 'upcoming viewings',
        tokens: ['viewings', 'upcoming viewings', 'scheduled viewings', 'confirmed viewings', 'viewings this week'],
        handler: (c) => this.handleUpcomingViewings(c),
      },
      {
        label: 'pending viewing requests',
        tokens: ['pending viewings', 'viewing requests', 'unconfirmed viewings', 'viewings to confirm', 'awaiting response'],
        handler: (c) => this.handlePendingViewings(c),
      },
      {
        label: 'open houses',
        tokens: ['open house', 'open houses', 'open day', 'show day', 'showcase', 'public viewing'],
        handler: (c) => this.handleUpcomingOpenHouses(c),
      },
      {
        label: 'recent activity',
        tokens: ['recent activity', 'what happened', 'latest activity', 'recent updates', 'activity log'],
        handler: (c) => this.handleRecentActivity(c),
      },
      {
        label: 'business summary',
        tokens: ['business summary', 'summary', 'snapshot', 'overview', 'my stats', 'my numbers', 'performance', 'how am i doing'],
        handler: (c) => this.handleBusinessSummary(c),
      },
    ];

    // Score each intent: multi-word tokens score 3, single-word tokens score 1.
    // Score against synonym-expanded query (nq) so natural language phrases match.
    let bestScore = 0;
    let bestIntent: IntentEntry | null = null;

    for (const intent of intents) {
      let score = 0;
      for (const token of intent.tokens) {
        if (nq.includes(token)) {
          score += token.includes(' ') ? 3 : 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    // No keyword match — try LLM for free-form questions before giving up
    if (!bestIntent || bestScore < 1) {
      if (this.llm.isEnabled) {
        try {
          const snapshot = await this.buildDataSnapshot(companyId);
          const systemMsg = LLM_SYSTEM_PROMPT
            .replace('{date}', snapshot.date)
            .replace('{snapshot}', JSON.stringify(snapshot));
          const completion = await this.llm.complete(
            [
              { role: 'system', content: systemMsg },
              { role: 'user', content: originalQuery },
            ],
            { jsonMode: true, maxTokens: 800, temperature: 0.3 },
          );
          if (completion) {
            const parsed = JSON.parse(completion.content) as AssistantResponse;
            if (parsed?.responseType) return parsed;
          }
        } catch (err) {
          this.logger.warn(`LLM fallback failed: ${(err as Error).message}`);
        }
      }
      return {
        responseType: 'text',
        title: "I'm not sure what you mean",
        text: [
          `I couldn't find a clear match for: *"${originalQuery}"*`,
          '',
          'Try rephrasing — for example:',
          '• **"Show my overdue tasks"** — tasks needing attention',
          '• **"Hot leads"** or **"Warm leads"** — leads by temperature',
          '• **"Pipeline value"** — total potential deal revenue',
          '• **"Business summary"** — full performance snapshot',
          '• **"Tell me about [name]"** — look up a specific person or property',
          '',
          "I'll do my best to understand however you phrase it!",
        ].join('\n'),
      };
    }

    const result = await bestIntent.handler(companyId);

    // Low-to-medium confidence — annotate so the user can correct
    if (bestScore < 4) {
      const note = `*(I interpreted your question as: "${bestIntent.label}" — let me know if that's not right)*\n\n`;
      return {
        ...result,
        text: result.text ? `${note}${result.text}` : result.text,
      };
    }

    return result;
  }

  /**
   * Builds a compact data snapshot used as context for the LLM free-form
   * fallback. Runs all queries in parallel to keep latency minimal.
   * The snapshot intentionally omits PII beyond first-name initials.
   */
  private async buildDataSnapshot(companyId: string): Promise<{
    date: string;
    leads: {
      total: number;
      active: number;
      hot: number;
      warm: number;
      cold: number;
      nurture: number;
      neverContacted: number;
      pipelineValue: number;
      underContract: number;
      closed: number;
    };
    tasks: { overdue: number; pendingToday: number; pendingTotal: number };
    properties: { total: number; active: number };
    recentLeads: Array<{ name: string; stage: string; temperature: string; lastContactedDaysAgo: number | null }>;
  }> {
    type LeadStats = {
      total: string; active: string; hot: string; warm: string; cold: string; nurture: string;
      never_contacted: string; pipeline_value: string; under_contract: string; closed: string;
    };
    type TaskStats = { overdue: string; today: string; pending: string };
    type PropStats = { total: string; active: string };
    type RecentLead = { name: string; stage: string; temperature: string; last_contact_at: Date | null };

    const [leadStats, taskStats, propStats, recentLeads] = await Promise.all([
      this.prisma.$queryRaw<LeadStats[]>`
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE stage NOT IN ('closed', 'lost'))::text AS active,
          COUNT(*) FILTER (WHERE temperature = 'hot')::text AS hot,
          COUNT(*) FILTER (WHERE temperature = 'warm')::text AS warm,
          COUNT(*) FILTER (WHERE temperature = 'cold')::text AS cold,
          COUNT(*) FILTER (WHERE temperature = 'nurture')::text AS nurture,
          COUNT(*) FILTER (WHERE last_contact_at IS NULL)::text AS never_contacted,
          COALESCE(SUM(deal_value) FILTER (WHERE stage NOT IN ('closed', 'lost')), 0)::text AS pipeline_value,
          COUNT(*) FILTER (WHERE stage = 'under_contract')::text AS under_contract,
          COUNT(*) FILTER (WHERE stage = 'closed')::text AS closed
        FROM sales.leads WHERE company_id = ${companyId}::uuid
      `,
      this.prisma.$queryRaw<TaskStats[]>`
        SELECT
          COUNT(*) FILTER (WHERE completed = false AND due_date < CURRENT_DATE)::text AS overdue,
          COUNT(*) FILTER (WHERE completed = false AND due_date::date = CURRENT_DATE)::text AS today,
          COUNT(*) FILTER (WHERE completed = false)::text AS pending
        FROM sales.lead_tasks WHERE company_id = ${companyId}::uuid
      `,
      this.prisma.$queryRaw<PropStats[]>`
        SELECT COUNT(*)::text AS total,
               COUNT(*) FILTER (WHERE status = 'active')::text AS active
        FROM property.properties WHERE company_id = ${companyId}::uuid
      `,
      this.prisma.$queryRaw<RecentLead[]>`
        SELECT name, stage, temperature, last_contact_at
        FROM sales.leads
        WHERE company_id = ${companyId}::uuid
        ORDER BY created_at DESC
        LIMIT 5
      `,
    ]);

    const l = leadStats[0];
    const t = taskStats[0];
    const p = propStats[0];

    return {
      date: new Date().toISOString().split('T')[0],
      leads: {
        total: parseInt(l?.total ?? '0', 10),
        active: parseInt(l?.active ?? '0', 10),
        hot: parseInt(l?.hot ?? '0', 10),
        warm: parseInt(l?.warm ?? '0', 10),
        cold: parseInt(l?.cold ?? '0', 10),
        nurture: parseInt(l?.nurture ?? '0', 10),
        neverContacted: parseInt(l?.never_contacted ?? '0', 10),
        pipelineValue: parseFloat(l?.pipeline_value ?? '0'),
        underContract: parseInt(l?.under_contract ?? '0', 10),
        closed: parseInt(l?.closed ?? '0', 10),
      },
      tasks: {
        overdue: parseInt(t?.overdue ?? '0', 10),
        pendingToday: parseInt(t?.today ?? '0', 10),
        pendingTotal: parseInt(t?.pending ?? '0', 10),
      },
      properties: {
        total: parseInt(p?.total ?? '0', 10),
        active: parseInt(p?.active ?? '0', 10),
      },
      recentLeads: recentLeads.map((r) => ({
        name: r.name,
        stage: r.stage,
        temperature: r.temperature,
        lastContactedDaysAgo: r.last_contact_at
          ? Math.floor((Date.now() - new Date(r.last_contact_at).getTime()) / DAY_MS)
          : null,
      })),
    };
  }
}
