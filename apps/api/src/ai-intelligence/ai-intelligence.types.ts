// ─────────────────────────────────────────────────────────────────────────────
// Shared types for the AI Intelligence module
// Imported by agents, planner, data service, and the main service.
// ─────────────────────────────────────────────────────────────────────────────

// ── Dashboard types ───────────────────────────────────────────────────────────

export type RecommendationType =
  | 'lead_followup'
  | 'pricing_alert'
  | 'buyer_match'
  | 'deal_risk'
  | 'hot_lead';

export type RecommendationPriority = 'urgent' | 'high' | 'medium' | 'low';

export type AIRecommendation = {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  entityId?: string;
  entityName?: string;
  actionUrl?: string;
  createdAt: string;
};

export type LeadScore = {
  leadId: string;
  leadName: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  temperature: string;
  stage: string;
  reasoning: string[];
};

export type PricingInsight = {
  listingId: string;
  listingTitle: string;
  currentPrice: number;
  avgMarketPrice: number;
  priceDiff: number;
  recommendation: 'overpriced' | 'underpriced' | 'competitive';
  comparablesCount: number;
};

export type BuyerMatch = {
  leadId: string;
  leadName: string;
  listingId: string;
  listingTitle: string;
  matchScore: number;
  matchReasons: string[];
};

export type AIIntelligenceDashboard = {
  recommendations: AIRecommendation[];
  leadScores: LeadScore[];
  pricingInsights: PricingInsight[];
  buyerMatches: BuyerMatch[];
  summary: {
    totalRecommendations: number;
    urgentCount: number;
    leadsScored: number;
    avgLeadScore: number;
    listingsAnalyzed: number;
    buyerMatchesFound: number;
  };
};

// ── Assistant response types ──────────────────────────────────────────────────

export type AssistantListItem = {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: 'green' | 'orange' | 'red' | 'blue' | 'gray' | 'purple';
  href?: string;
};

export type AssistantChartBar = {
  label: string;
  value: number;
  color?: string;
};

export type AssistantSummaryCard = {
  label: string;
  value: string | number;
  color?: string;
};

export type AssistantResponse = {
  responseType: 'list' | 'chart' | 'summary' | 'text' | 'error';
  title?: string;
  text?: string;
  items?: AssistantListItem[];
  chart?: { title: string; bars: AssistantChartBar[] };
  summaryCards?: AssistantSummaryCard[];
  totalCount?: number;
};

// ── Raw database row shapes (shared across agents + data service) ─────────────

export type LeadRow = {
  id: string;
  name: string;
  temperature: string;
  stage: string;
  prequalified: boolean;
  budget_min: string | null;
  budget_max: string | null;
  budget_currency: string;
  deal_value: string | null;
  preferences: string | null;
  last_contact_at: Date | null;
  created_at: Date;
};

export type PropertyRow = {
  id: string;
  title: string;
  price: string;
  property_type: string;
  city: string | null;
};

export type MarketAvgRow = {
  property_type: string;
  city: string | null;
  avg_price: string;
  count: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

export const DAY_MS = 24 * 60 * 60 * 1000;
