'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageWithFallback } from '@/components/my-listings/ImageWithFallback';
import { propertiesApi, type PropertyListing, type AgentDashboardResponse, type AgentListingPerformanceRow } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { formatMoney, formatCompactCurrency } from '@/lib/formatters';

// ── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  forest:      '#1A3C28',
  forestLight: '#4A7C5A',
  parchment:   '#F2E8D5',
  amber:       '#B89040',
  terracotta:  '#C4562A',
  egreen:      '#00E87A',
  muted:       '#E8F0EC',
  border:      'rgba(26,60,40,0.12)',
  textMuted:   '#6B8F7A',
};

interface ListingCard {
  id: string;
  address: string;
  city: string;
  region: string;
  price: string;
  currency: string;
  beds: number;
  baths: number;
  sqm: number;
  status: 'active' | 'pending' | 'under-contract' | 'sold';
  listingType: 'for-sale' | 'rent' | 'development';
  imageUrl: string;
  daysOnMarket: number;
  viewCount: number;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1706808849802-8f876ade0d1f?w=800';

function mapApiStatus(status: string): ListingCard['status'] {
  switch (status) {
    case 'active': return 'active';
    case 'under_offer': return 'under-contract';
    case 'sold': return 'sold';
    default: return 'pending';
  }
}

function mapListingType(t: string | null | undefined): ListingCard['listingType'] {
  switch (t) {
    case 'for_sale': return 'for-sale';
    case 'to_rent': return 'rent';
    case 'development': return 'development';
    default: return 'for-sale';
  }
}

function mapToCard(p: PropertyListing): ListingCard {
  const primaryImage = p.media?.find((m) => m.is_primary)?.url ?? p.media?.[0]?.url ?? DEFAULT_IMAGE;
  const daysOnMarket = Math.max(0, Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86_400_000));
  return {
    id: p.id,
    address: p.location?.address_line1 ?? p.title,
    city: p.location?.city ?? '',
    region: p.location?.region ?? '',
    price: p.price,
    currency: p.currency,
    beds: p.bedrooms ?? 0,
    baths: p.bathrooms ?? 0,
    sqm: p.area_sqm ? Number(p.area_sqm) : 0,
    status: mapApiStatus(p.status),
    listingType: mapListingType(p.listing_type),
    imageUrl: primaryImage,
    daysOnMarket,
    viewCount: p.view_count ?? 0,
  };
}

/** 0–100 health score from views, enquiries, and freshness */
function healthScore(card: ListingCard, enquiries: number): number {
  const viewScore  = Math.min(40, (card.viewCount / 200) * 40);
  const engScore   = Math.min(30, (enquiries / 10) * 30);
  const domPenalty = card.daysOnMarket > 60 ? 30 : card.daysOnMarket > 30 ? 15 : 0;
  return Math.max(0, Math.round(viewScore + engScore + 30 - domPenalty));
}

function listingHeat(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

function listingCategory(listing: ListingCard): string {
  if (listing.status === 'sold') return 'sold';
  if (listing.status === 'under-contract') return 'under_offer';
  if (listing.status === 'pending') return 'draft';
  if (listing.daysOnMarket >= 30) return 'stale';
  return 'active';
}

function getListingTypeBadge(listingType: string): { label: string; bg: string; color: string } {
  switch (listingType) {
    case 'for-sale':    return { label: 'For Sale',    bg: C.forest,      color: C.parchment };
    case 'rent':        return { label: 'To Rent',     bg: '#B45309',     color: '#fff' };
    case 'development': return { label: 'Development', bg: C.terracotta,  color: '#fff' };
    default:            return { label: 'For Sale',    bg: C.forest,      color: C.parchment };
  }
}

function HealthRing({ score }: { score: number }) {
  const radius    = 11;
  const circ      = 2 * Math.PI * radius;
  const filled    = (score / 100) * circ;
  const color     = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r={radius} fill="white" stroke="rgba(26,60,40,0.12)" strokeWidth="4" />
      <circle
        cx="16" cy="16" r={radius} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${filled} ${circ}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" transform="rotate(-90 16 16)"
      />
      <text x="16" y="20" textAnchor="middle"
        fontFamily="var(--font-fraunces)" fontSize="8" fontWeight="700" fill={C.forest}>
        {score}
      </text>
    </svg>
  );
}

function HeatBadge({ heat }: { heat: 'hot' | 'warm' | 'cold' }) {
  if (heat === 'hot')  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:'var(--font-ibm-plex-mono)', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'#FEE2E2', color:'#DC2626', textTransform:'uppercase', letterSpacing:'0.04em' }}>🔥 High</span>;
  if (heat === 'warm') return <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:'var(--font-ibm-plex-mono)', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'#FEF3C7', color:'#D97706', textTransform:'uppercase', letterSpacing:'0.04em' }}>⚡ Warm</span>;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:'var(--font-ibm-plex-mono)', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'#DBEAFE', color:'#2563EB', textTransform:'uppercase', letterSpacing:'0.04em' }}>❄ Slow</span>;
}

export default function MyListingsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery]         = useState('');
  const [listingsFilter, setListingsFilter]   = useState<string>('all');
  const [listingTypeFilter, setListingTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode]               = useState<'grid' | 'list'>('grid');
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [allListings, setAllListings]         = useState<ListingCard[]>([]);
  const [, setDashboard]                      = useState<AgentDashboardResponse | null>(null);
  const [performance, setPerformance]         = useState<AgentListingPerformanceRow[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [error, setError]                     = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true);
    setError('');
    Promise.all([
      propertiesApi.getMyListings(token),
      propertiesApi.getAgentDashboard(token),
      propertiesApi.getAgentListingsPerformance(token),
    ])
      .then(([listingsRes, dashboardRes, perfRes]) => {
        setAllListings(listingsRes.data.map(mapToCard));
        setDashboard(dashboardRes);
        setPerformance(Array.isArray(perfRes) ? perfRes : []);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load listings'))
      .finally(() => setIsLoading(false));
  }, []);

  // Per-listing enquiries map keyed by performance row id (= listing id)
  const enquiriesMap = performance.reduce<Record<string, number>>((acc, r) => {
    acc[r.id] = (acc[r.id] ?? 0) + (r.inquiries ?? 0);
    return acc;
  }, {});

  // Score map
  const scoreMap = allListings.reduce<Record<string, number>>((acc, l) => {
    acc[l.id] = healthScore(l, enquiriesMap[l.id] ?? 0);
    return acc;
  }, {});

  // KPI aggregates
  const activeListings   = allListings.filter((l) => l.status === 'active');
  const portfolioValue   = allListings.reduce((s, l) => s + Number(l.price ?? 0), 0);
  const avgDOM           = Math.round(activeListings.reduce((s, l) => s + l.daysOnMarket, 0) / Math.max(1, activeListings.length));
  const totalEnquiries   = performance.reduce((s, r) => s + (r.inquiries ?? 0), 0);

  // Derived filters
  const hotListings   = allListings.filter((l) => listingHeat(scoreMap[l.id] ?? 0) === 'hot');
  const staleListings = allListings.filter((l) => l.status === 'active' && l.daysOnMarket >= 30);

  // Status tabs
  const statusTabs = [
    { key: 'all',         label: 'All Listings', count: allListings.length,                                                     icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
    { key: 'hot',         label: '🔥 Hot',       count: hotListings.length,                                                      icon: null },
    { key: 'active',      label: 'Active',        count: activeListings.filter((l) => listingCategory(l) === 'active').length,  icon: <><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></> },
    { key: 'under_offer', label: 'Under Offer',   count: allListings.filter((l) => listingCategory(l) === 'under_offer').length, icon: <><path d="M9 11l3 3L22 4"/></> },
    { key: 'stale',       label: 'Stale 30d+',    count: staleListings.length,                                                   icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
    { key: 'draft',       label: 'Draft',         count: allListings.filter((l) => listingCategory(l) === 'draft').length,      icon: null },
    { key: 'sold',        label: 'Sold',          count: allListings.filter((l) => listingCategory(l) === 'sold').length,       icon: null },
  ];

  // Filtered listings
  const filteredListings = allListings.filter((l) => {
    const score = scoreMap[l.id] ?? 0;
    const heat  = listingHeat(score);
    const cat   = listingCategory(l);
    const matchesSearch = !searchQuery ||
      l.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      listingTypeFilter === 'all' ||
      (listingTypeFilter === 'for-sale' && l.listingType === 'for-sale') ||
      (listingTypeFilter === 'rent' && l.listingType === 'rent') ||
      (listingTypeFilter === 'development' && l.listingType === 'development');
    const matchesFilter =
      listingsFilter === 'all' ||
      (listingsFilter === 'hot' && heat === 'hot') ||
      (listingsFilter === 'active' && cat === 'active') ||
      (listingsFilter === 'under_offer' && cat === 'under_offer') ||
      (listingsFilter === 'stale' && cat === 'stale') ||
      (listingsFilter === 'draft' && cat === 'draft') ||
      (listingsFilter === 'sold' && cat === 'sold');
    return matchesSearch && matchesType && matchesFilter;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Sub-page Header (dark forest) ────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: C.forest, borderRadius: '12px 12px 0 0' }}>
        {/* decorative circles */}
        <div className="absolute" style={{ top: -60, right: -60, width: 220, height: 220, background: C.terracotta, opacity: 0.08, borderRadius: '50%', pointerEvents: 'none' }} />
        <div className="absolute" style={{ bottom: 10, left: '40%', width: 160, height: 160, background: C.egreen, opacity: 0.04, borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="px-8 pt-8 pb-0 relative" style={{ zIndex: 1 }}>
          {/* eyebrow */}
          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.terracotta, marginBottom: 6 }}>
            Agent Cockpit › Portfolio Headquarters
          </div>

          {/* title + actions */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 700, color: C.parchment, letterSpacing: '-0.5px', lineHeight: 1.15 }}>My Listings</h1>
              <p style={{ fontSize: 13, color: 'rgba(242,232,213,0.55)', marginTop: 4, fontWeight: 400 }}>
                {activeListings.length} active properties · {formatCompactCurrency(portfolioValue)} portfolio · {avgDOM} avg. days on market
              </p>
            </div>
            <div className="flex items-center gap-2.5" style={{ flexShrink: 0 }}>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ padding: '9px 16px', background: 'rgba(242,232,213,0.08)', color: 'rgba(242,232,213,0.8)', border: '1px solid rgba(242,232,213,0.14)' }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                Sync All Portals
              </button>
              <button
                onClick={() => router.push('/app/my-listings/new')}
                className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ padding: '9px 16px', background: C.terracotta, color: '#fff' }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Listing
              </button>
            </div>
          </div>

          {/* 6-cell KPI strip */}
          <div className="grid grid-cols-3 md:grid-cols-6 pb-6" style={{ gap: 12 }}>
            {([
              { label: 'Active Listings',   value: activeListings.length.toString(),                valueColor: C.egreen,   delta: `${allListings.length} total`,           down: false },
              { label: 'Portfolio Value',   value: formatCompactCurrency(portfolioValue),            valueColor: C.parchment, delta: 'combined value',                       down: false },
              { label: 'Avg. Days on Mkt',  value: avgDOM.toString(),                               valueColor: '#F5C87A',   delta: 'days on market',                       down: avgDOM > 30 },
              { label: 'Inquiries',         value: totalEnquiries.toString(),                       valueColor: '#E8A080',   delta: 'this month',                           down: false },
              { label: 'Active Offers',     value: allListings.filter((l) => l.status === 'under-contract').length.toString(), valueColor: C.egreen, delta: 'in pipeline',  down: false },
              { label: 'Hot Listings',      value: hotListings.length.toString(),                   valueColor: C.parchment, delta: `${staleListings.length} stale`,        down: staleListings.length > 0 },
            ] as { label: string; value: string; valueColor: string; delta: string; down: boolean }[]).map((kpi, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 6 }}>
                  {kpi.label}
                </div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 700, color: kpi.valueColor, lineHeight: 1 }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: kpi.down ? '#F87171' : C.egreen, marginTop: 4 }}>
                  {kpi.delta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Tabs Bar ───────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto px-8" style={{ background: C.forest, borderTop: '1px solid rgba(242,232,213,0.08)', borderRadius: '0 0 12px 12px', marginBottom: 0 }}>
        {statusTabs.map((tab) => {
          const isActive = listingsFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setListingsFilter(tab.key)}
              className="flex items-center gap-2 whitespace-nowrap transition-all"
              style={{
                padding: '14px 22px',
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? C.parchment : 'rgba(242,232,213,0.5)',
                borderBottom: `2px solid ${isActive ? C.terracotta : 'transparent'}`,
                background: 'transparent',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {tab.icon && (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ opacity: isActive ? 1 : 0.7 }}>
                  {tab.icon}
                </svg>
              )}
              {tab.label}
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: isActive ? C.terracotta : 'rgba(196,86,42,0.25)',
                color: isActive ? '#fff' : C.terracotta,
                padding: '1px 6px', borderRadius: 8,
                fontFamily: 'var(--font-ibm-plex-mono)',
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 32px 0' }}>

        {/* ── Loading / Error states ─────────────────────────────────────── */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8" style={{ color: C.forest }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
        )}

        {!isLoading && !error && (
          <>
            {/* ── Smart Alerts Bar ─────────────────────────────────────── */}
            {!alertsDismissed && (hotListings.length > 0 || staleListings.length > 0) && (
              <div className="flex items-center gap-3 mb-5 flex-wrap" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, paddingRight: 12, borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Smart Alerts
                </div>
                {hotListings.length > 0 && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA', whiteSpace:'nowrap' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#DC2626', display:'inline-block' }} />
                    🔥 {hotListings.length} hot {hotListings.length === 1 ? 'listing' : 'listings'} — high demand
                  </span>
                )}
                {staleListings.length > 0 && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'#FFFBEB', color:'#B45309', border:'1px solid #FDE68A', whiteSpace:'nowrap' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#B45309', display:'inline-block' }} />
                    ⚠ {staleListings.length} stale {staleListings.length === 1 ? 'listing' : 'listings'} — consider a price drop
                  </span>
                )}
                <button
                  onClick={() => setAlertsDismissed(true)}
                  style={{ marginLeft: 'auto', fontSize: 11, color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none' }}
                >
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Dismiss
                </button>
              </div>
            )}

            {/* ── Toolbar ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 mb-5 flex-wrap">
              {/* search */}
              <div className="flex items-center gap-2" style={{ flex: 1, maxWidth: 280, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}>
                <svg width="14" height="14" fill="none" stroke={C.textMuted} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  placeholder="Search listings by title or address…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: C.forest, fontFamily: 'inherit' }}
                />
              </div>
              {/* type filters */}
              {[
                { key: 'all',         label: 'All Types' },
                { key: 'for-sale',    label: 'For Sale' },
                { key: 'rent',        label: 'To Rent' },
                { key: 'development', label: 'Dev' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setListingTypeFilter(t.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 7,
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                    fontFamily: 'var(--font-ibm-plex-mono)', textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: listingTypeFilter === t.key ? C.forest : 'rgba(26,60,40,0.07)',
                    color: listingTypeFilter === t.key ? C.parchment : C.textMuted,
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
              {/* view toggle */}
              <div style={{ marginLeft: 'auto', display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                {[
                  { key: 'grid' as const, label: 'Cards', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
                  { key: 'list' as const, label: 'Table', icon: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></> },
                ].map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setViewMode(v.key)}
                    style={{
                      padding: '7px 12px', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 12, fontWeight: 600,
                      background: viewMode === v.key ? C.forest : '#fff',
                      color: viewMode === v.key ? C.parchment : C.textMuted,
                      transition: 'all 0.15s',
                    }}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{v.icon}</svg>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Cards View ───────────────────────────────────────────── */}
            {viewMode === 'grid' && filteredListings.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14, marginBottom: 28 }}>
                {filteredListings.map((listing) => {
                  const enquiries = enquiriesMap[listing.id] ?? 0;
                  const score     = scoreMap[listing.id] ?? 0;
                  const heat      = listingHeat(score);
                  const typeBadge = getListingTypeBadge(listing.listingType);
                  const isStale   = listing.daysOnMarket >= 30;
                  const borderColor =
                    heat === 'hot' ? 'rgba(220,38,38,0.28)' :
                    heat === 'warm' ? 'rgba(217,119,6,0.28)' :
                    listing.status === 'under-contract' ? 'rgba(5,150,105,0.25)' :
                    C.border;
                  return (
                    <div
                      key={listing.id}
                      style={{ background: '#fff', border: `1px solid ${borderColor}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s, transform 0.1s' }}
                      className="hover:shadow-lg hover:-translate-y-px cursor-pointer"
                      onClick={() => router.push(`/app/my-listings/${listing.id}`)}
                    >
                      {/* card header: thumb + info */}
                      <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        {/* thumbnail + health ring */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 86, height: 64, borderRadius: 8, overflow: 'hidden' }}>
                            <ImageWithFallback src={listing.imageUrl} alt={listing.address} className="w-full h-full object-cover" />
                          </div>
                          <div style={{ position: 'absolute', bottom: -7, right: -7 }}>
                            <HealthRing score={score} />
                          </div>
                        </div>
                        {/* info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4, background: typeBadge.bg, color: typeBadge.color }}>
                              {typeBadge.label}
                            </span>
                            <HeatBadge heat={heat} />
                          </div>
                          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 14, fontWeight: 700, color: C.forest, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {listing.address}{listing.city ? `, ${listing.city}` : ''}
                          </div>
                          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                            {listing.beds}b · {listing.baths}ba · {listing.sqm.toLocaleString()}m²
                          </div>
                          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: C.forest, marginTop: 5, lineHeight: 1 }}>
                            {formatMoney(listing.price, listing.currency)}
                          </div>
                          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, marginTop: 3, color: listing.daysOnMarket >= 30 ? '#DC2626' : '#059669', fontWeight: 600 }}>
                            ⏱ {listing.daysOnMarket} days on market{listing.daysOnMarket >= 30 ? ' ⚠' : ''}
                          </div>
                        </div>
                      </div>

                      {/* 4-cell metrics strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `1px solid ${C.border}`, background: 'rgba(26,60,40,0.02)' }}>
                        {[
                          { val: listing.viewCount.toLocaleString(), lbl: 'Views' },
                          { val: enquiries.toString(),               lbl: 'Inquiries' },
                          { val: listing.status === 'under-contract' ? '2' : '0', lbl: 'Offers', highlight: listing.status === 'under-contract' },
                          { val: listing.daysOnMarket.toString(),   lbl: 'DOM' },
                        ].map((m, i) => (
                          <div key={i} style={{ padding: '8px 0', textAlign: 'center', borderRight: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                            <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, fontWeight: 700, color: m.highlight ? C.terracotta : C.forest, lineHeight: 1 }}>{m.val}</div>
                            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.textMuted, marginTop: 2 }}>{m.lbl}</div>
                          </div>
                        ))}
                      </div>

                      {/* card body */}
                      <div style={{ padding: '12px 16px', flex: 1 }}>
                        {isStale && (
                          <div style={{ background: 'rgba(196,86,42,0.06)', border: '1px solid rgba(196,86,42,0.18)', borderRadius: 6, padding: '6px 10px', marginBottom: 10, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 600, color: C.terracotta }}>
                            ✦ {listing.daysOnMarket} days stale — consider a price reduction
                          </div>
                        )}
                        {/* mandate progress bar — use DOM as proxy */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, color: C.textMuted, marginBottom: 4 }}>
                            <span>Listing age</span>
                            <span style={{ color: listing.daysOnMarket >= 60 ? '#DC2626' : listing.daysOnMarket >= 30 ? '#B45309' : '#059669', fontWeight: 600 }}>
                              {listing.daysOnMarket}d on market
                            </span>
                          </div>
                          <div style={{ height: 3, background: 'rgba(26,60,40,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 2,
                              width: `${Math.min(100, (listing.daysOnMarket / 90) * 100)}%`,
                              background: listing.daysOnMarket >= 60 ? '#DC2626' : listing.daysOnMarket >= 30 ? '#F59E0B' : '#22C55E',
                            }} />
                          </div>
                        </div>
                      </div>

                      {/* card actions */}
                      <div style={{ display: 'flex', gap: 6, padding: '10px 14px 14px', borderTop: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/app/my-listings/${listing.id}`)}
                          style={{ flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: C.forest, color: C.parchment, fontFamily: 'inherit', transition: 'opacity 0.15s' }}
                          className="hover:opacity-87"
                        >View</button>
                        <button
                          onClick={() => router.push(`/app/my-listings/${listing.id}/edit`)}
                          style={{ flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: C.forest, border: `1px solid ${C.border}`, fontFamily: 'inherit' }}
                        >Edit</button>
                        <button
                          onClick={() => router.push(`/app/my-listings/new?duplicate=${listing.id}`)}
                          style={{ flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: C.forest, border: `1px solid ${C.border}`, fontFamily: 'inherit' }}
                        >Dupe</button>
                        <button
                          style={{ flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: C.forest, border: `1px solid ${C.border}`, fontFamily: 'inherit' }}
                        >Sync</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Table View ───────────────────────────────────────────── */}
            {viewMode === 'list' && filteredListings.length > 0 && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(26,60,40,0.03)', borderBottom: `1px solid ${C.border}` }}>
                      {['Property', 'Heat', 'Price', 'Specs', 'Performance', 'Health', 'Actions'].map((h) => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map((listing, idx) => {
                      const enquiries = enquiriesMap[listing.id] ?? 0;
                      const score     = scoreMap[listing.id] ?? 0;
                      const heat      = listingHeat(score);
                      return (
                        <tr
                          key={listing.id}
                          style={{ borderBottom: idx < filteredListings.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}
                          className="hover:bg-[rgba(26,60,40,0.02)] transition-colors"
                          onClick={() => router.push(`/app/my-listings/${listing.id}`)}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 48, height: 36, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
                                <ImageWithFallback src={listing.imageUrl} alt={listing.address} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: listing.daysOnMarket >= 45 ? '#DC2626' : C.forest }}>{listing.address}</div>
                                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: listing.daysOnMarket >= 45 ? '#DC2626' : C.textMuted, marginTop: 1 }}>{listing.daysOnMarket}d on market{listing.daysOnMarket >= 45 ? ' ⚠' : ''}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}><HeatBadge heat={heat} /></td>
                          <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 13, fontWeight: 700, color: C.forest }}>{formatMoney(listing.price, listing.currency)}</span></td>
                          <td style={{ padding: '12px 16px', fontSize: 11, color: C.textMuted }}>{listing.beds}b · {listing.baths}ba · {listing.sqm.toLocaleString()}m²</td>
                          <td style={{ padding: '12px 16px', fontSize: 11, color: C.textMuted }}>{listing.viewCount} views · {enquiries} inq</td>
                          <td style={{ padding: '12px 16px' }}>
                            <HealthRing score={score} />
                          </td>
                          <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button onClick={() => router.push(`/app/my-listings/${listing.id}`)} style={{ padding: '4px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: C.forest, color: C.parchment, border: 'none', cursor: 'pointer' }}>View</button>
                              <button onClick={() => router.push(`/app/my-listings/${listing.id}/edit`)} style={{ padding: '4px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'transparent', color: C.forest, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Edit</button>
                              <button style={{ padding: '4px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'transparent', color: C.forest, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Sync</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Empty state ───────────────────────────────────────────── */}
            {filteredListings.length === 0 && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 48, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="28" height="28" fill="none" stroke={C.forestLight} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
                </div>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color: C.forest, marginBottom: 8 }}>
                  {allListings.length > 0 ? 'No listings match your filters' : 'No listings yet'}
                </h3>
                <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
                  {allListings.length > 0
                    ? 'Try adjusting your search or filter criteria.'
                    : "You don't have any listings yet. Add your first property listing!"}
                </p>
                {allListings.length > 0 ? (
                  <button
                    onClick={() => { setSearchQuery(''); setListingsFilter('all'); setListingTypeFilter('all'); }}
                    style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: C.muted, color: C.forest, border: 'none', cursor: 'pointer' }}
                  >Clear filters</button>
                ) : (
                  <button
                    onClick={() => router.push('/app/my-listings/new')}
                    style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: C.forest, color: '#fff', border: 'none', cursor: 'pointer' }}
                  >Add First Listing</button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

