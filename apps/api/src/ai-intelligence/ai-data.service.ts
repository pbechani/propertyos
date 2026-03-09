import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';
import {
  AIRecommendation,
  BuyerMatch,
  DAY_MS,
  LeadRow,
  LeadScore,
  MarketAvgRow,
  PricingInsight,
  PropertyRow,
} from './ai-intelligence.types';

// ─────────────────────────────────────────────────────────────────────────────
// AiDataService
// Encapsulates all shared data-fetching and scoring logic used by both
// getDashboard() and the agent workforce (AnalyticsAgent, LeadAgent).
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AiDataService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Data fetchers ────────────────────────────────────────────────────────

  async fetchLeads(companyId: string): Promise<LeadRow[]> {
    return this.prisma.$queryRaw<LeadRow[]>`
      SELECT l.id, l.name, l.temperature, l.stage, l.prequalified,
             l.budget_min, l.budget_max, l.budget_currency,
             l.deal_value, l.preferences, l.last_contact_at, l.created_at
      FROM sales.leads l
      WHERE l.company_id = ${companyId}::uuid
        AND l.stage NOT IN ('closed', 'lost')
      ORDER BY l.created_at DESC
    `;
  }

  async fetchProperties(companyId: string): Promise<PropertyRow[]> {
    return this.prisma.$queryRaw<PropertyRow[]>`
      SELECT p.id, p.title, p.price::text, p.property_type, pl.city
      FROM property.properties p
      LEFT JOIN property.property_locations pl ON pl.property_id = p.id
      WHERE p.company_id = ${companyId}::uuid
        AND p.status = 'active'
      ORDER BY p.created_at DESC
    `;
  }

  async fetchMarketAverages(companyId: string): Promise<MarketAvgRow[]> {
    return this.prisma.$queryRaw<MarketAvgRow[]>`
      SELECT p.property_type, pl.city,
             AVG(p.price)::text AS avg_price,
             COUNT(*)::text AS count
      FROM property.properties p
      LEFT JOIN property.property_locations pl ON pl.property_id = p.id
      WHERE p.status = 'active'
        AND p.company_id != ${companyId}::uuid
      GROUP BY p.property_type, pl.city
    `;
  }

  // ── Lead scoring ─────────────────────────────────────────────────────────

  scoreLeads(leads: LeadRow[]): LeadScore[] {
    return leads.map((lead) => {
      let score = 0;
      const reasoning: string[] = [];

      const tempScore = ({ hot: 40, warm: 30, nurture: 20, cold: 10 })[lead.temperature] ?? 10;
      score += tempScore;
      reasoning.push(`Temperature (${lead.temperature}): +${tempScore}`);

      const stageScore = ({ new: 5, contacted: 15, qualified: 25, active: 35, under_contract: 45 })[lead.stage] ?? 0;
      score += stageScore;
      reasoning.push(`Stage (${lead.stage}): +${stageScore}`);

      if (lead.last_contact_at) {
        const days = Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / DAY_MS);
        if (days <= 7) { score += 20; reasoning.push('Contacted within 7 days: +20'); }
        else if (days <= 14) { score += 10; reasoning.push('Contacted within 14 days: +10'); }
        else if (days <= 30) { score += 5; reasoning.push('Contacted within 30 days: +5'); }
      }

      if (lead.prequalified) { score += 15; reasoning.push('Pre-qualified: +15'); }
      if (lead.budget_min || lead.budget_max) { score += 5; reasoning.push('Budget defined: +5'); }

      const finalScore = Math.min(100, score);
      const grade: LeadScore['grade'] = finalScore >= 80 ? 'A' : finalScore >= 60 ? 'B' : finalScore >= 40 ? 'C' : 'D';
      return { leadId: lead.id, leadName: lead.name, score: finalScore, grade, temperature: lead.temperature, stage: lead.stage, reasoning };
    });
  }

  // ── Pricing insights ─────────────────────────────────────────────────────

  buildPricingInsights(properties: PropertyRow[], marketAvgs: MarketAvgRow[]): PricingInsight[] {
    const avgMap = new Map<string, { avg: number; count: number }>();
    for (const row of marketAvgs) {
      avgMap.set(`${row.property_type}::${(row.city ?? '').toLowerCase()}`, {
        avg: parseFloat(row.avg_price),
        count: parseInt(row.count, 10),
      });
    }
    return properties
      .map((prop): PricingInsight | null => {
        const key = `${prop.property_type}::${(prop.city ?? '').toLowerCase()}`;
        const market = avgMap.get(key);
        if (!market || market.count < 2) return null;
        const currentPrice = parseFloat(prop.price);
        const diff = ((currentPrice - market.avg) / market.avg) * 100;
        const recommendation: PricingInsight['recommendation'] =
          diff > 15 ? 'overpriced' : diff < -15 ? 'underpriced' : 'competitive';
        return { listingId: prop.id, listingTitle: prop.title, currentPrice, avgMarketPrice: Math.round(market.avg), priceDiff: Math.round(diff * 10) / 10, recommendation, comparablesCount: market.count };
      })
      .filter((x): x is PricingInsight => x !== null);
  }

  // ── Buyer matching ───────────────────────────────────────────────────────

  buildBuyerMatches(leads: LeadRow[], properties: PropertyRow[]): BuyerMatch[] {
    const buyers = leads.filter((l) => l.budget_min !== null || l.budget_max !== null);
    const matches: BuyerMatch[] = [];
    for (const buyer of buyers) {
      const budgetMin = buyer.budget_min ? parseFloat(buyer.budget_min) : 0;
      const budgetMax = buyer.budget_max ? parseFloat(buyer.budget_max) : Number.MAX_SAFE_INTEGER;
      const prefs = (buyer.preferences ?? '').toLowerCase();
      for (const prop of properties) {
        const price = parseFloat(prop.price);
        const matchReasons: string[] = [];
        let matchScore = 0;
        if (price >= budgetMin && price <= budgetMax) { matchScore += 60; matchReasons.push('Price within budget range'); }
        else if (price <= budgetMax * 1.1 && price >= budgetMin * 0.9) { matchScore += 30; matchReasons.push('Price close to budget range'); }
        else continue;
        if (prefs.includes(prop.property_type)) { matchScore += 25; matchReasons.push(`Type preference match (${prop.property_type})`); }
        if (prop.city && prefs.includes(prop.city.toLowerCase())) { matchScore += 15; matchReasons.push(`Location match (${prop.city})`); }
        if (buyer.temperature === 'hot') { matchScore += 10; matchReasons.push('Hot buyer'); }
        if (matchScore >= 40) {
          matches.push({ leadId: buyer.id, leadName: buyer.name, listingId: prop.id, listingTitle: prop.title, matchScore: Math.min(100, matchScore), matchReasons });
        }
      }
    }
    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
  }

  // ── Recommendations ──────────────────────────────────────────────────────

  buildRecommendations(
    leadScores: LeadScore[],
    leads: LeadRow[],
    pricingInsights: PricingInsight[],
    buyerMatches: BuyerMatch[],
  ): AIRecommendation[] {
    const recs: AIRecommendation[] = [];
    const leadMap = new Map(leads.map((l) => [l.id, l]));

    for (const score of leadScores.filter((s) => s.grade === 'A')) {
      const lead = leadMap.get(score.leadId);
      if (!lead) continue;
      const days = lead.last_contact_at
        ? Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / DAY_MS)
        : 999;
      if (days >= 7) {
        recs.push({ id: randomUUID(), type: 'hot_lead', priority: days >= 14 ? 'urgent' : 'high',
          title: `Contact ${lead.name} — hot lead`,
          description: `Score ${score.score}/100. Last contacted ${days === 999 ? 'never' : `${days} days ago`}.`,
          entityId: lead.id, entityName: lead.name, actionUrl: `/app/leads/${lead.id}`, createdAt: new Date().toISOString() });
      }
    }

    for (const score of leadScores.filter((s) => s.grade === 'B')) {
      const lead = leadMap.get(score.leadId);
      if (!lead?.last_contact_at) continue;
      const days = Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / DAY_MS);
      if (days >= 14) {
        recs.push({ id: randomUUID(), type: 'lead_followup', priority: days >= 30 ? 'high' : 'medium',
          title: `Follow up with ${lead.name}`, description: `Good prospect (${days} days since last contact). Risk of going cold.`,
          entityId: lead.id, entityName: lead.name, actionUrl: `/app/leads/${lead.id}`, createdAt: new Date().toISOString() });
      }
    }

    for (const lead of leads.filter((l) => l.stage === 'under_contract')) {
      if (!lead.last_contact_at) continue;
      const days = Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / DAY_MS);
      if (days >= 14) {
        recs.push({ id: randomUUID(), type: 'deal_risk', priority: 'urgent',
          title: `Deal may fall through — ${lead.name}`, description: `Under contract with no activity for ${days} days.`,
          entityId: lead.id, entityName: lead.name, actionUrl: `/app/leads/${lead.id}`, createdAt: new Date().toISOString() });
      }
    }

    for (const insight of pricingInsights.filter((p) => p.recommendation !== 'competitive')) {
      const diff = Math.abs(insight.priceDiff);
      recs.push({ id: randomUUID(), type: 'pricing_alert', priority: diff >= 30 ? 'high' : 'medium',
        title: insight.recommendation === 'overpriced' ? `${insight.listingTitle} may be overpriced` : `${insight.listingTitle} priced below market`,
        description: insight.recommendation === 'overpriced'
          ? `Listed ${insight.priceDiff}% above market average.`
          : `Listed ${Math.abs(insight.priceDiff)}% below market average.`,
        entityId: insight.listingId, entityName: insight.listingTitle, actionUrl: `/app/properties/${insight.listingId}`, createdAt: new Date().toISOString() });
    }

    const seen = new Set<string>();
    for (const match of buyerMatches.filter((m) => m.matchScore >= 70)) {
      const key = `${match.leadId}::${match.listingId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      recs.push({ id: randomUUID(), type: 'buyer_match', priority: match.matchScore >= 90 ? 'high' : 'medium',
        title: `Strong buyer match: ${match.leadName}`, description: `${match.matchScore}% match for "${match.listingTitle}".`,
        entityId: match.leadId, entityName: match.leadName, actionUrl: `/app/leads/${match.leadId}`, createdAt: new Date().toISOString() });
    }

    const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return recs.sort((a, b) => (order[a.priority] ?? 99) - (order[b.priority] ?? 99));
  }
}
