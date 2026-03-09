'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
  Zap,
  Target,
  BarChart3,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAccessToken } from '@/lib/auth-session';
import {
  aiIntelligenceApi,
  type AIIntelligenceDashboard,
  type AIRecommendation,
  type LeadScore,
  type PricingInsight,
  type BuyerMatch,
  type AssistantResponse,
  type AssistantListItem,
} from '@/lib/api-client';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function priorityBadge(priority: AIRecommendation['priority']) {
  const map: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return map[priority] ?? map.low;
}

function typeIcon(type: AIRecommendation['type']) {
  switch (type) {
    case 'hot_lead':
      return <Zap className="w-4 h-4 text-orange-500" />;
    case 'lead_followup':
      return <Users className="w-4 h-4 text-blue-500" />;
    case 'pricing_alert':
      return <BarChart3 className="w-4 h-4 text-purple-500" />;
    case 'buyer_match':
      return <Target className="w-4 h-4 text-green-500" />;
    case 'deal_risk':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
  }
}

function gradeColor(grade: LeadScore['grade']) {
  return (
    { A: 'text-green-600 bg-green-50', B: 'text-blue-600 bg-blue-50', C: 'text-yellow-600 bg-yellow-50', D: 'text-red-600 bg-red-50' }[grade] ??
    'text-gray-600 bg-gray-50'
  );
}

function temperatureColor(temp: string) {
  return (
    { hot: 'text-red-600 bg-red-50', warm: 'text-orange-500 bg-orange-50', nurture: 'text-blue-500 bg-blue-50', cold: 'text-gray-400 bg-gray-50' }[temp] ??
    'text-gray-500 bg-gray-50'
  );
}

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: AIIntelligenceDashboard['summary'] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card className="p-4 bg-red-50 border-red-100">
        <div className="text-2xl font-bold text-red-700">{summary.urgentCount}</div>
        <div className="text-xs text-red-600 mt-1">Urgent Actions</div>
      </Card>
      <Card className="p-4 bg-orange-50 border-orange-100">
        <div className="text-2xl font-bold text-orange-700">{summary.totalRecommendations}</div>
        <div className="text-xs text-orange-600 mt-1">Total Insights</div>
      </Card>
      <Card className="p-4 bg-blue-50 border-blue-100">
        <div className="text-2xl font-bold text-blue-700">{summary.leadsScored}</div>
        <div className="text-xs text-blue-600 mt-1">Leads Scored</div>
      </Card>
      <Card className="p-4 bg-green-50 border-green-100">
        <div className="text-2xl font-bold text-green-700">{summary.avgLeadScore}</div>
        <div className="text-xs text-green-600 mt-1">Avg Lead Score</div>
      </Card>
      <Card className="p-4 bg-purple-50 border-purple-100">
        <div className="text-2xl font-bold text-purple-700">{summary.listingsAnalyzed}</div>
        <div className="text-xs text-purple-600 mt-1">Listings Analysed</div>
      </Card>
      <Card className="p-4 bg-teal-50 border-teal-100">
        <div className="text-2xl font-bold text-teal-700">{summary.buyerMatchesFound}</div>
        <div className="text-xs text-teal-600 mt-1">Buyer Matches</div>
      </Card>
    </div>
  );
}

function RecommendationsPanel({ recommendations }: { recommendations: AIRecommendation[] }) {
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <CheckCircle2 className="w-10 h-10 mb-3 text-green-400" />
        <p className="text-sm">All clear — no immediate actions needed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className="flex items-start gap-3 p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="mt-0.5 flex-shrink-0">{typeIcon(rec.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-gray-900">{rec.title}</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded border ${priorityBadge(rec.priority)}`}
              >
                {rec.priority}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{rec.description}</p>
          </div>
          {rec.actionUrl && (
            <Link href={rec.actionUrl} className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                View <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const width = `${score}%`;
  const color =
    score >= 80
      ? 'bg-green-500'
      : score >= 60
        ? 'bg-blue-500'
        : score >= 40
          ? 'bg-yellow-400'
          : 'bg-red-400';

  return (
    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width }} />
    </div>
  );
}

function LeadScoresPanel({ leadScores }: { leadScores: LeadScore[] }) {
  if (leadScores.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">No active leads to score.</p>
    );
  }

  const sorted = [...leadScores].sort((a, b) => b.score - a.score);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b">
            <th className="pb-2 font-medium">Lead</th>
            <th className="pb-2 font-medium">Score</th>
            <th className="pb-2 font-medium">Grade</th>
            <th className="pb-2 font-medium">Temp</th>
            <th className="pb-2 font-medium">Stage</th>
            <th className="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((ls) => (
            <tr key={ls.leadId} className="hover:bg-gray-50">
              <td className="py-2.5 font-medium text-gray-900">{ls.leadName}</td>
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <ScoreBar score={ls.score} />
                  <span className="text-xs text-gray-600 w-6">{ls.score}</span>
                </div>
              </td>
              <td className="py-2.5">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${gradeColor(ls.grade)}`}
                >
                  {ls.grade}
                </span>
              </td>
              <td className="py-2.5">
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${temperatureColor(ls.temperature)}`}>
                  {ls.temperature}
                </span>
              </td>
              <td className="py-2.5 capitalize text-gray-500 text-xs">{ls.stage.replace('_', ' ')}</td>
              <td className="py-2.5">
                <Link href={`/app/leads/${ls.leadId}`}>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    View
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PricingInsightsPanel({ insights }: { insights: PricingInsight[] }) {
  if (insights.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        Not enough market data to generate pricing insights.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <div key={insight.listingId} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
          <div className="flex-shrink-0">
            {insight.recommendation === 'overpriced' ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : insight.recommendation === 'underpriced' ? (
              <TrendingDown className="w-5 h-5 text-blue-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{insight.listingTitle}</p>
            <p className="text-xs text-gray-500">
              Listed at {formatCurrency(insight.currentPrice)} · Market avg{' '}
              {formatCurrency(insight.avgMarketPrice)} ({insight.comparablesCount} comparables)
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span
              className={`text-xs font-semibold ${
                insight.recommendation === 'overpriced'
                  ? 'text-red-600'
                  : insight.recommendation === 'underpriced'
                    ? 'text-blue-600'
                    : 'text-green-600'
              }`}
            >
              {insight.priceDiff > 0 ? '+' : ''}
              {insight.priceDiff}%
            </span>
            <p className="text-xs text-gray-400 capitalize">{insight.recommendation}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BuyerMatchesPanel({ matches }: { matches: BuyerMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No strong buyer matches found. Add buyer budget &amp; preferences to leads to enable matching.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match, idx) => (
        <div key={`${match.leadId}-${match.listingId}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              match.matchScore >= 80
                ? 'bg-green-100 text-green-700'
                : match.matchScore >= 60
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {match.matchScore}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {match.leadName}{' '}
              <span className="text-gray-400 font-normal">→</span>{' '}
              <span className="text-gray-700">{match.listingTitle}</span>
            </p>
            <p className="text-xs text-gray-400 truncate">{match.matchReasons.join(' · ')}</p>
          </div>
          <Link href={`/app/leads/${match.leadId}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Contact
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Assistant Tab
// ─────────────────────────────────────────────────────────────────────────────

type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  response?: AssistantResponse;
};

const BADGE_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
};

const SUGGESTED_PROMPTS = [
  'Find buyers for this property',
  'Which leads are most likely to buy this month?',
  'Analyze my pipeline',
  'Summarize today\'s tasks',
  'Suggest follow-ups',
  'Write a listing description',
];

function renderText(text: string) {
  // Convert **bold** and newlines to JSX
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return (
      <span key={i} className="block">
        {parts.map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-semibold text-gray-900">
              {part}
            </strong>
          ) : (
            part
          ),
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
}

function AssistantListResponse({ items, title, totalCount }: {
  items: AssistantListItem[];
  title?: string;
  totalCount?: number;
}) {
  return (
    <div className="space-y-2">
      {title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {title}{totalCount && totalCount > items.length ? ` (showing ${items.length} of ${totalCount})` : ''}
        </p>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
            {item.sublabel && (
              <p className="text-xs text-gray-500 truncate">{item.sublabel}</p>
            )}
          </div>
          {item.badge && (
            <span
              className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                BADGE_COLORS[item.badgeColor ?? 'gray'] ?? BADGE_COLORS.gray
              }`}
            >
              {item.badge}
            </span>
          )}
          {item.href && (
            <Link href={item.href} className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function AssistantChartResponse({ response }: { response: AssistantResponse }) {
  if (!response.chart) return null;
  return (
    <div className="space-y-3">
      {response.title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {response.title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={response.chart.bars} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v: number) => [v, 'Leads']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {response.chart.bars.map((bar, i) => (
              <Cell key={i} fill={bar.color ?? '#6366f1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {response.summaryCards && response.summaryCards.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {response.summaryCards.map((card, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-50 border rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-500">{card.label}:</span>
              <span className="text-xs font-bold text-gray-900">{card.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssistantResponseRenderer({ response }: { response: AssistantResponse }) {
  if (response.responseType === 'list' && response.items) {
    return (
      <AssistantListResponse
        items={response.items}
        title={response.title}
        totalCount={response.totalCount}
      />
    );
  }
  if (response.responseType === 'chart') {
    return <AssistantChartResponse response={response} />;
  }
  if (response.responseType === 'summary' && response.summaryCards) {
    const colorClass: Record<string, string> = {
      red: 'text-red-600',
      orange: 'text-orange-500',
      green: 'text-green-600',
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      gray: 'text-gray-500',
    };
    return (
      <div className="space-y-3">
        {response.title && (
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {response.title}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {response.summaryCards.map((card, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className={`text-lg font-bold leading-none ${colorClass[card.color ?? ''] ?? 'text-gray-800'}`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
        {response.text && (
          <div className="text-sm text-gray-700 leading-relaxed pt-1">
            {renderText(response.text)}
          </div>
        )}
      </div>
    );
  }
  // text, error
  return (
    <div className="space-y-1">
      {response.title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {response.title}
        </p>
      )}
      {response.text && (
        <div className="text-sm text-gray-700 leading-relaxed">
          {renderText(response.text)}
        </div>
      )}
    </div>
  );
}

function getAIPageContext(pathname: string): string {
  let m = pathname.match(/^\/app\/leads\/([0-9a-f-]{36})(?:\/|$)/i);
  if (m) return `Lead detail page. lead-id:${m[1]}`;
  m = pathname.match(/^\/app\/properties\/([0-9a-f-]{36})(?:\/|$)/i);
  if (m) return `Property detail page. property-id:${m[1]}`;
  if (pathname === '/app/leads/pipeline') return 'Viewing the lead pipeline kanban board';
  if (pathname === '/app/leads/dashboard') return 'Viewing the lead management dashboard';
  if (pathname === '/app/leads/analytics') return 'Viewing lead analytics';
  if (pathname.startsWith('/app/leads')) return 'Viewing the leads list';
  if (pathname.startsWith('/app/properties')) return 'Viewing property listings';
  return `Page: ${pathname}`;
}

function AIAssistantTab() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (queryText: string) => {
    if (!queryText.trim() || loading) return;
    const userMsg: AssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: queryText.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const result = await aiIntelligenceApi.query(token, queryText.trim(), getAIPageContext(pathname));
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', response: result },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          response: { responseType: 'error', text: 'Something went wrong. Please try again.' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 480 }}>
      {/* Message history */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4" style={{ maxHeight: 480 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">AI Real Estate Assistant</h3>
            <p className="text-xs text-gray-500 max-w-xs">
              Ask me about your leads, listings, pipeline, tasks, and more. I'll surface insights from your CRM data instantly.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <div className="max-w-xs bg-blue-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-md shadow-sm">
                {msg.text}
              </div>
            ) : (
              <div className="max-w-xl w-full bg-white border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                {msg.response && <AssistantResponseRenderer response={msg.response} />}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void send(prompt)}
              className="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 border-t pt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask me anything about your leads, listings, or pipeline…"
          className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <Button
          size="sm"
          onClick={() => void send(input)}
          disabled={!input.trim() || loading}
          className="px-3 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function AIIntelligencePanel() {
  const [data, setData] = useState<AIIntelligenceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    'recommendations' | 'leads' | 'pricing' | 'matches' | 'assistant'
  >('recommendations');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const result = await aiIntelligenceApi.getDashboard(token);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI Intelligence data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const sections = [
    { id: 'recommendations' as const, label: 'Recommendations', count: data?.recommendations.length },
    { id: 'leads' as const, label: 'Lead Scores', count: data?.leadScores.length },
    { id: 'pricing' as const, label: 'Pricing Insights', count: data?.pricingInsights.length },
    { id: 'matches' as const, label: 'Buyer Matches', count: data?.buyerMatches.length },
    { id: 'assistant' as const, label: '✦ Assistant' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AI Intelligence</h1>
            <p className="text-xs text-gray-500">
              Continuously analyses your leads, listings, and market to surface actionable insights
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchDashboard()}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary cards (only when data is loaded) */}
      {loading && !data && activeSection !== 'assistant' && (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}
      {data && <SummaryCards summary={data.summary} />}

      {/* Section tabs — always visible so the assistant is accessible before data loads */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap border-b bg-gray-50">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeSection === s.id
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.label}
              {'count' in s && s.count !== undefined && s.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    activeSection === s.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeSection === 'assistant' && <AIAssistantTab />}

          {activeSection !== 'assistant' && loading && !data && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {activeSection !== 'assistant' && data && (
            <>
              {activeSection === 'recommendations' && (
                <RecommendationsPanel recommendations={data.recommendations} />
              )}
              {activeSection === 'leads' && (
                <LeadScoresPanel leadScores={data.leadScores} />
              )}
              {activeSection === 'pricing' && (
                <PricingInsightsPanel insights={data.pricingInsights} />
              )}
              {activeSection === 'matches' && (
                <BuyerMatchesPanel matches={data.buyerMatches} />
              )}
            </>
          )}
        </div>
      </Card>

      {/* AI disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        <Brain className="w-3 h-3 inline mr-1" />
        Insights are derived from your CRM data and market comparisons — no external data is
        processed or stored.
      </p>
    </div>
  );
}
