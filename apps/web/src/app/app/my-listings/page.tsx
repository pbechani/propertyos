'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Eye,
  MessageSquare,
  Search,
  Plus,
  Bed,
  Bath,
  Maximize,
  Clock,
  Share2,
  MapPin,
  Loader2,
  LayoutGrid,
  List,
  ChevronDown,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/my-listings/ImageWithFallback';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { propertiesApi, type PropertyListing, type AgentDashboardResponse, type AgentListingPerformanceRow } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { formatMoney } from '@/lib/formatters';

// ── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  forest:      '#1A3C28',
  forestLight: '#4A7C5A',
  parchment:   '#F2E8D5',
  amber:       '#B89040',
  terracotta:  '#C4562A',
  egreen:      '#00E87A',
  muted:       '#E8F0EC',
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

function getStatusColor(status: string) {
  switch (status) {
    case 'active':         return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending':        return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'under-contract': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'sold':           return 'bg-gray-100 text-gray-600 border-gray-200';
    default:               return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function getListingTypeConfig(listingType: string): { label: string; bg: string } {
  switch (listingType) {
    case 'for-sale':    return { label: 'FOR SALE',    bg: C.forest };
    case 'rent':        return { label: 'FOR RENT',    bg: C.amber };
    case 'development': return { label: 'DEVELOPMENT', bg: C.terracotta };
    default:            return { label: 'FOR SALE',    bg: C.forest };
  }
}

/** Returns Tailwind ring class based on days on market */
function domAlertClass(dom: number): string {
  if (dom >= 45) return 'ring-2 ring-red-400';
  if (dom >= 21) return 'ring-1 ring-amber-300';
  return '';
}

/** 0–100 health score from views, enquiries, and freshness */
function healthScore(card: ListingCard, enquiries: number): number {
  const viewScore = Math.min(40, (card.viewCount / 200) * 40);
  const engScore  = Math.min(30, (enquiries / 10) * 30);
  const domPenalty = card.daysOnMarket > 60 ? 30 : card.daysOnMarket > 30 ? 15 : 0;
  return Math.max(0, Math.round(viewScore + engScore + 30 - domPenalty));
}

function HealthBadge({ score }: { score: number }) {
  let label: string;
  let cls: string;
  if (score >= 70)      { label = 'Hot';  cls = 'bg-emerald-50 text-emerald-700 border border-emerald-200'; }
  else if (score >= 40) { label = 'Warm'; cls = 'bg-amber-50 text-amber-700 border border-amber-200'; }
  else                  { label = 'Cold'; cls = 'bg-red-50 text-red-600 border border-red-200'; }
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'dom' | 'views';

const SORT_LABELS: Record<SortOption, string> = {
  newest:     'Newest',
  price_asc:  'Price ↑',
  price_desc: 'Price ↓',
  dom:        'Longest Listed',
  views:      'Most Views',
};

export default function MyListingsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode]         = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy]             = useState<SortOption>('newest');
  const [allListings, setAllListings]   = useState<ListingCard[]>([]);
  const [dashboard, setDashboard]       = useState<AgentDashboardResponse | null>(null);
  const [performance, setPerformance]   = useState<AgentListingPerformanceRow[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState('');

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

  // Aggregate totals
  const totalViews     = performance.reduce((s, r) => s + (r.views ?? 0), 0);
  const totalEnquiries = performance.reduce((s, r) => s + (r.inquiries ?? 0), 0);
  const activeCount    = allListings.filter((l) => l.status === 'active').length;

  // Status tab definitions
  const statusTabs = [
    { key: 'all',         label: 'All',         count: allListings.length },
    { key: 'active',      label: 'Active',       count: allListings.filter((l) => l.status === 'active').length },
    { key: 'under_offer', label: 'Under Offer',  count: allListings.filter((l) => l.status === 'under-contract').length },
    { key: 'pending',     label: 'Pending',      count: allListings.filter((l) => l.status === 'pending').length },
    { key: 'sold',        label: 'Sold',         count: allListings.filter((l) => l.status === 'sold').length },
  ];

  // Filter
  const filtered = allListings
    .filter((l) => {
      if (statusFilter === 'all')        return true;
      if (statusFilter === 'active')     return l.status === 'active';
      if (statusFilter === 'under_offer') return l.status === 'under-contract';
      return l.status === statusFilter;
    })
    .filter(
      (l) =>
        l.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.city.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  // Sort
  const filteredListings = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':  return Number(a.price) - Number(b.price);
      case 'price_desc': return Number(b.price) - Number(a.price);
      case 'dom':        return b.daysOnMarket - a.daysOnMarket;
      case 'views':      return b.viewCount - a.viewCount;
      default:           return 0;
    }
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 px-6 py-4">

      {/* ── Compact header bar ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: C.forest }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <h1
            className="text-xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            My Listings
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(255,255,255,0.15)', color: C.parchment }}
            >
              {allListings.length} total
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(0,232,122,0.2)', color: C.egreen }}
            >
              {activeCount} active
            </span>
            {performance.length > 0 && (
              <>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <Eye className="w-3 h-3" /> {totalViews.toLocaleString()} views
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <MessageSquare className="w-3 h-3" /> {totalEnquiries} enquiries
                </span>
              </>
            )}
            {dashboard && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {(dashboard.inquiryResponseRatePct ?? 0).toFixed(0)}% response rate
              </span>
            )}
          </div>
        </div>
        <button
          className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: C.egreen, color: C.forest }}
          onClick={() => router.push('/app/my-listings/new')}
        >
          <Plus className="w-4 h-4" /> New Listing
        </button>
      </div>

      {/* ── Toolbar: status tabs + search + sort + view toggle ─────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
              style={
                statusFilter === tab.key
                  ? { background: C.forest, color: C.parchment }
                  : { color: '#6B7280' }
              }
            >
              {tab.label}
              <span
                className="text-[11px] px-1.5 py-0.5 rounded-full"
                style={
                  statusFilter === tab.key
                    ? { background: 'rgba(255,255,255,0.2)', color: 'inherit' }
                    : { background: '#F3F4F6', color: '#9CA3AF' }
                }
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-100 hidden sm:block" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A3C28] w-40"
          />
        </div>

        {/* Sort dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-gray-600">
              {SORT_LABELS[sortBy]}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[170px] bg-white rounded-xl shadow-lg border border-gray-100 p-1 z-50"
              sideOffset={5}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <DropdownMenu.Item
                  key={key}
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer outline-none"
                  onClick={() => setSortBy(key)}
                >
                  {SORT_LABELS[key]}
                  {sortBy === key && <span style={{ color: C.forest }}>✓</span>}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Grid / List toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className="p-1.5 rounded-md transition-all"
            style={viewMode === 'grid' ? { background: C.forest, color: '#fff' } : { color: '#9CA3AF' }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="p-1.5 rounded-md transition-all"
            style={viewMode === 'list' ? { background: C.forest, color: '#fff' } : { color: '#9CA3AF' }}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.forest }} />
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* ── Grid view ───────────────────────────────────────────────────────── */}
      {!isLoading && !error && filteredListings.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing) => {
            const typeConfig = getListingTypeConfig(listing.listingType);
            const enquiries  = enquiriesMap[listing.id] ?? 0;
            const score      = healthScore(listing, enquiries);
            const ringCls    = domAlertClass(listing.daysOnMarket);
            return (
              <div
                key={listing.id}
                className={`bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group relative ${ringCls}`}
                onClick={() => router.push(`/app/my-listings/${listing.id}`)}
              >
                {/* ── Image zone ────────────────────────────────────────────── */}
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={listing.imageUrl}
                    alt={listing.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Status badge — top left */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(listing.status)}`}>
                      {listing.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Health badge — top right */}
                  <div className="absolute top-3 right-3">
                    <HealthBadge score={score} />
                  </div>

                  {/* Listing type banner — bottom */}
                  <div
                    className="absolute bottom-0 left-0 right-0 py-1.5 px-4 text-center"
                    style={{ background: typeConfig.bg }}
                  >
                    <span className="text-[11px] font-bold tracking-widest text-white">
                      {typeConfig.label}
                    </span>
                  </div>

                  {/* Hover quick-action overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2"
                    style={{ background: 'rgba(26,60,40,0.65)', backdropFilter: 'blur(2px)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                      style={{ background: C.egreen, color: C.forest }}
                      onClick={(e) => { e.stopPropagation(); router.push(`/app/my-listings/${listing.id}`); }}
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                      style={{ background: 'rgba(255,255,255,0.92)', color: C.forest }}
                      onClick={(e) => { e.stopPropagation(); router.push(`/app/my-listings/${listing.id}/edit`); }}
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                      style={{ background: 'rgba(255,255,255,0.92)', color: C.forest }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(`${window.location.origin}/listings/${listing.id}`);
                        }
                      }}
                    >
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                  </div>
                </div>

                {/* ── Card body ─────────────────────────────────────────────── */}
                <div className="p-4">
                  {/* Price */}
                  <div
                    className="text-xl font-bold mb-1"
                    style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}
                  >
                    {formatMoney(listing.price, listing.currency)}
                  </div>

                  {/* Metric strip */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3 pb-2.5 border-b border-gray-100">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {listing.viewCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {enquiries}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className={
                        listing.daysOnMarket >= 45 ? 'text-red-500 font-semibold' :
                        listing.daysOnMarket >= 21 ? 'text-amber-600 font-medium' : ''
                      }>
                        {listing.daysOnMarket}d
                      </span>
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5 text-gray-700 mb-3">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <div>
                      <div
                        className="text-sm font-semibold leading-tight"
                        style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}
                      >{listing.address}</div>
                      {listing.city && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {[listing.city, listing.region].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property specs */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {listing.beds}</span>
                    <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {listing.baths}</span>
                    <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {listing.sqm.toLocaleString()} m²</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List view ───────────────────────────────────────────────────────── */}
      {!isLoading && !error && filteredListings.length > 0 && viewMode === 'list' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[52px,1fr,110px,110px,100px,64px,64px,72px] items-center px-4 py-2.5 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span />
            <span>Property</span>
            <span>Type</span>
            <span>Status</span>
            <span className="text-right">Price</span>
            <span className="text-right">DOM</span>
            <span className="text-right">Views</span>
            <span className="text-right">Health</span>
          </div>

          {filteredListings.map((listing, idx) => {
            const typeConfig = getListingTypeConfig(listing.listingType);
            const enquiries  = enquiriesMap[listing.id] ?? 0;
            const score      = healthScore(listing, enquiries);
            return (
              <div
                key={listing.id}
                className={`grid grid-cols-[52px,1fr,110px,110px,100px,64px,64px,72px] items-center px-4 py-3 gap-2 hover:bg-gray-50 cursor-pointer transition-colors ${idx < filteredListings.length - 1 ? 'border-b border-gray-50' : ''}`}
                onClick={() => router.push(`/app/my-listings/${listing.id}`)}
              >
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={listing.imageUrl}
                    alt={listing.address}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Address */}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{listing.address}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {[listing.city, listing.region].filter(Boolean).join(', ')}
                  </div>
                </div>

                {/* Type pill */}
                <div>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: typeConfig.bg }}
                  >
                    {typeConfig.label}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(listing.status)}`}>
                    {listing.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Price */}
                <div className="text-sm font-semibold text-gray-900 text-right">
                  {formatMoney(listing.price, listing.currency)}
                </div>

                {/* DOM */}
                <div className={`text-sm text-right font-medium ${listing.daysOnMarket >= 45 ? 'text-red-500' : listing.daysOnMarket >= 21 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {listing.daysOnMarket}d
                </div>

                {/* Views */}
                <div className="text-sm text-gray-500 text-right">{listing.viewCount.toLocaleString()}</div>

                {/* Health */}
                <div className="text-right">
                  <HealthBadge score={score} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!isLoading && !error && filteredListings.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: C.muted }}
          >
            <Home className="w-8 h-8" style={{ color: C.forestLight }} />
          </div>
          <h3
            className="text-lg font-bold mb-2"
            style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}
          >
            {allListings.length > 0 ? 'No listings match your filters' : 'No listings yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {allListings.length > 0
              ? 'Try adjusting your search or filter criteria.'
              : "You don't have any listings yet. Add your first property listing!"}
          </p>
          {allListings.length > 0 ? (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: C.muted, color: C.forest }}
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={() => router.push('/app/my-listings/new')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: C.forest }}
            >
              Add First Listing
            </button>
          )}
        </div>
      )}
    </div>
  );
}
