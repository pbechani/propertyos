'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { leadsApi, type LeadAnalyticsResponse } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ── Brand tokens ─────────────────────────────────────────────────────────────
const F  = '#1A3C28';
const TC = '#C4562A';
const BD = '#E5E7EB';
const TM = '#9CA3AF';
const TD = '#1F2937';


// ── Source color map ──────────────────────────────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  referral:       F,
  online:         TC,
  'online portal': TC,
  'open house':   '#2D5A40',
  'social media': '#7C3AED',
  'cold outreach': '#9CA3AF',
};

function sourceColor(source: string) {
  return SOURCE_COLORS[source.toLowerCase()] ?? F;
}

function formatAvgDeal(value: number): string {
  if (value >= 1_000_000) return `R ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R ${Math.round(value / 1_000)}K`;
  return `R ${Math.round(value).toLocaleString()}`;
}

// ── Static monthly bars (Oct–Apr, 7 bars, last = highlight) ──────────────────
const STATIC_MONTHS = [
  { label: 'Oct', pct: 40 },
  { label: 'Nov', pct: 55 },
  { label: 'Dec', pct: 35 },
  { label: 'Jan', pct: 65 },
  { label: 'Feb', pct: 50 },
  { label: 'Mar', pct: 80 },
  { label: 'Apr', pct: 100, highlight: true },
];

// ── Card styles ───────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = { background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden' };
const cardHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BD}` };
const cardTitleStyle: React.CSSProperties = { fontFamily: "var(--font-jakarta)", fontWeight: 700, fontSize: 13, color: TD };

export default function LeadAnalytics({ isEmbedded: _isEmbedded = false }: { isEmbedded?: boolean }) {
  const [data, setData] = useState<LeadAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    leadsApi.getAnalytics(token)
      .then(setData)
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 192 }}>
        <Loader2 style={{ width: 24, height: 24, color: TM }} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p style={{ textAlign: 'center', color: '#DC2626', fontSize: 13, padding: '32px 0' }}>{error}</p>;
  }

  // Build dynamic KPIs from API data
  const kpis = [
    { val: data ? `${data.conversionRate}%` : '—', lbl: 'Conversion Rate' },
    { val: data?.avgTimeToClose ? `${data.avgTimeToClose}d` : '—', lbl: 'Avg Time to Close' },
    { val: data?.avgDealValue ? formatAvgDeal(data.avgDealValue) : '—', lbl: 'Avg Deal Value' },
    { val: data ? `${data.responseRate}%` : '—', lbl: 'Response Rate' },
  ];

  // Build source rows from API or static fallback
  const sourcesRaw = data?.bySource ?? [];
  const totalSources = sourcesRaw.reduce((s, r) => s + r.count, 0) || 1;
  const sourceRows = sourcesRaw.length > 0
    ? sourcesRaw.map((s) => ({ label: s.source, pct: Math.round((s.count / totalSources) * 100), count: s.count, color: sourceColor(s.source) }))
    : [
        { label: 'Referral',       pct: 38, count: 47, color: F },
        { label: 'Online Portal',  pct: 27, count: 33, color: TC },
        { label: 'Open House',     pct: 18, count: 22, color: '#2D5A40' },
        { label: 'Social Media',   pct: 12, count: 15, color: '#7C3AED' },
        { label: 'Cold Outreach',  pct: 5,  count: 7,  color: '#9CA3AF' },
      ];

  // Build monthly chart bars from API or static fallback
  const trendRaw = data?.monthlyTrend ?? [];
  const maxLeads = Math.max(...trendRaw.map((m) => m.leads), 1);
  const chartBars = trendRaw.length >= 3
    ? trendRaw.slice(-7).map((m, i, arr) => ({ label: m.month, pct: Math.round((m.leads / maxLeads) * 100), highlight: i === arr.length - 1, val: m.leads }))
    : STATIC_MONTHS.map((m) => ({ ...m, val: m.highlight ? 124 : 0 }));

  const lastBar = chartBars[chartBars.length - 1];
  const latestLeads = lastBar?.val || 0;
  const latestMonth = lastBar?.label || '';

  // Compute month-over-month trend from real data
  const trendPct = (() => {
    if (trendRaw.length < 2) return null;
    const prev = trendRaw[trendRaw.length - 2].leads;
    const curr = trendRaw[trendRaw.length - 1].leads;
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  })();

  return (
    <div>
      {/* Analytics KPI grid — 4 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {kpis.map(({ val, lbl }) => (
          <div key={lbl} style={{ background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, fontSize: 24, color: TD }}>{val}</div>
            <div style={{ fontSize: 11, color: TM, marginTop: 4 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* grid-2: Leads by Source + Monthly Lead Volume */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Leads by Source */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Leads by Source</span>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sourceRows.map((row) => (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: TD, marginBottom: 4, fontFamily: "var(--font-jakarta)" }}>
                    <span>{row.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{row.pct}%</span>
                  </div>
                  <div style={{ background: 'rgba(26,60,40,0.08)', borderRadius: 4, height: 8 }}>
                    <div style={{ background: row.color, width: `${row.pct}%`, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Lead Volume */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Monthly Lead Volume</span>
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            {/* Mini bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
              {chartBars.map((bar, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${bar.pct}%`,
                    background: TC,
                    opacity: bar.highlight ? 0.9 : 0.25,
                    borderRadius: '3px 3px 0 0',
                    minHeight: 4,
                  }}
                />
              ))}
            </div>
            {/* Month labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: TM, fontFamily: "var(--font-mono)" }}>
              {chartBars.map((bar, idx) => (
                <span key={idx}>{bar.label}</span>
              ))}
            </div>
            {/* Summary line */}
            <div style={{ marginTop: 14, fontSize: 12, color: TM }}>
              {latestLeads > 0 && (
                <><strong style={{ color: TD, fontFamily: "var(--font-fraunces)", fontSize: 20 }}>{latestLeads}</strong>
                {latestMonth ? ` leads in ${latestMonth}` : ' leads'}{' — '}</>
              )}
              {trendPct !== null ? (
                <span style={{ color: trendPct >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                  {trendPct >= 0 ? '↑' : '↓'} {Math.abs(trendPct)}%
                </span>
              ) : null}
              {trendPct !== null ? ' vs last month' : (latestLeads === 0 ? 'No data yet' : '')}
            </div>
            {/* Type breakdown pills */}
            {data?.byType && data.byType.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {data.byType.map((t) => (
                  <span key={t.type} style={{ fontSize: 10, fontWeight: 600, background: '#F3F4F6', color: TD, padding: '2px 8px', borderRadius: 20, fontFamily: "var(--font-mono)" }}>
                    {t.type.toUpperCase()} {t.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

