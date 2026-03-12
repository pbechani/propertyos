'use client';

import { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/property/Navbar';
import PropertyCard, { PropertyCardData } from '@/components/property/PropertyCard';
import { propertiesApi, type PropertyListing } from '@/lib/api-client';

const PROPERTY_TYPES = ['Residential', 'Land', 'Commercial', 'Off-Plan', 'Agricultural', 'New Build'];
const AGENT_TIERS = ['Gold', 'Silver', 'Bronze'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'price_asc', label: 'Price: Low–High' },
  { value: 'price_desc', label: 'Price: High–Low' },
  { value: 'relevance', label: 'Most Relevant' },
] as const;

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toCardData(property: PropertyListing): PropertyCardData {
  const city = property.location?.city ?? '';
  const region = property.location?.region ?? '';
  const location = [city, region].filter(Boolean).join(', ') || 'Location unavailable';
  const primaryImage = property.media?.find((item) => item.is_primary)?.url;

  return {
    id: property.id,
    title: property.title,
    price: Number(property.price),
    currency: property.currency,
    location,
    bedrooms: property.bedrooms ?? undefined,
    bathrooms: property.bathrooms ?? undefined,
    sqm: property.area_sqm ? Number(property.area_sqm) : undefined,
    propertyType: toTitleCase(property.property_type),
    verified: property.verification_status === 'verified',
    fraudAlert: property.verification_status === 'flagged',
    underInvestigation: property.company_status === 'under_investigation',
    imageUrl: primaryImage,
  };
}

function PropertySearchResultsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(
    searchParams.get('verified') !== 'false',
  );
  const [escrowReady, setEscrowReady] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cityInput, setCityInput] = useState(searchParams.get('city') ?? '');
  const [results, setResults] = useState<PropertyListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sort = searchParams.get('sort') ?? 'newest';

  const cardResults = useMemo(
    () => results.map((property) => toCardData(property)),
    [results],
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const unverifiedCount = results.filter(
    (property) => property.verification_status !== 'verified',
  ).length;

  useEffect(() => {
    setCityInput(searchParams.get('city') ?? '');
    setPage(Number(searchParams.get('page') ?? '1'));
    setVerifiedOnly(searchParams.get('verified') !== 'false');
  }, [searchParams]);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError('');

      try {
        const city = searchParams.get('city') ?? undefined;
        const verified = searchParams.get('verified') !== 'false';
        const currentPage = Number(searchParams.get('page') ?? '1');
        const currentSort =
          (searchParams.get('sort') as
            | 'newest'
            | 'price_asc'
            | 'price_desc'
            | 'relevance'
            | null) ?? 'newest';

        const response = await propertiesApi.search({
          city,
          page: currentPage,
          limit,
          sort: currentSort,
          verification_status: verified ? 'verified' : undefined,
        });

        setResults(response.data);
        setTotal(response.total);
      } catch (fetchError) {
        setResults([]);
        setTotal(0);
        setError('Unable to load properties right now. Please try again.');
        console.error(fetchError);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProperties();
  }, [searchParams, limit]);

  const updateQuery = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  const applySearch = () => {
    updateQuery({
      city: cityInput.trim() || null,
      page: '1',
    });
  };

  const toggleVerifiedOnly = () => {
    const nextValue = !verifiedOnly;
    updateQuery({
      verified: nextValue ? null : 'false',
      page: '1',
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-manrope">
      <Navbar />

      {/* ── SEARCH BAR HEADER ── */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
          {/* Search input */}
          <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#F5A623] focus-within:ring-1 focus-within:ring-[#F5A623] transition bg-white">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  applySearch();
                }
              }}
              placeholder="Search location..."
            />
          </div>
          {/* Save search */}
          <button
            onClick={applySearch}
            title="Save search"
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-[#F5A623] hover:text-[#0A1628] transition bg-white whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save Search
          </button>
          {/* User avatar */}
          <div className="w-9 h-9 rounded-full bg-[#0A1628] flex items-center justify-center text-white text-sm font-bold shrink-0">
            J
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* ── LEFT SIDEBAR FILTERS ── */}
          <aside className={`${sidebarOpen ? 'w-64 shrink-0' : 'hidden'} transition-all`}>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-36 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#0A1628]">Filters</h3>
                <button className="text-xs text-[#F5A623] font-semibold hover:underline" title="Clear all filters">Clear all</button>
              </div>

              {/* Verified Only */}
              <div className="pb-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0A1628]">Verified Only</p>
                    <p className="text-xs text-gray-400">Show title-deed verified listings</p>
                  </div>
                  <button
                    onClick={toggleVerifiedOnly}
                    title="Toggle verified only"
                    aria-label="Toggle verified only"
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${verifiedOnly ? 'bg-[#22C55E]' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${verifiedOnly ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Escrow Ready */}
              <div className="pb-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0A1628]">Escrow Ready</p>
                    <p className="text-xs text-gray-400">Escrow infrastructure active</p>
                  </div>
                  <button
                    onClick={() => setEscrowReady(!escrowReady)}
                    title="Toggle escrow ready"
                    aria-label="Toggle escrow ready"
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${escrowReady ? 'bg-[#F5A623]' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${escrowReady ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Property Type */}
              <div className="pb-5 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#0A1628] mb-3">Property Type</p>
                <div className="space-y-2">
                  {PROPERTY_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 accent-[#F5A623]" defaultChecked={type === 'Residential'} />
                      <span className="text-sm text-gray-600">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="pb-5 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#0A1628] mb-3">Price Range</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Min"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#F5A623]"
                  />
                  <input
                    type="text"
                    placeholder="Max"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#F5A623]"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div className="pb-5 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#0A1628] mb-3">Bedrooms</p>
                <div className="flex gap-2 flex-wrap">
                  {['Any', '1+', '2+', '3+', '4+', '5+'].map((b) => (
                    <button
                      key={b}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors
                        ${b === '3+' ? 'bg-[#0A1628] text-white border-[#0A1628]' : 'border-gray-200 text-gray-600 hover:border-[#0A1628]'}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Tier */}
              <div>
                <p className="text-sm font-semibold text-[#0A1628] mb-3">Agent Tier</p>
                <div className="space-y-2">
                  {AGENT_TIERS.map((tier) => (
                    <label key={tier} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 accent-[#F5A623]" defaultChecked={tier === 'Gold'} />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                        ${tier === 'Gold' ? 'bg-[#F5A623] text-[#0A1628]' :
                          tier === 'Silver' ? 'bg-gray-200 text-gray-700' :
                          'bg-amber-700 text-white'}`}
                      >
                        {tier}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ── MAIN RESULTS ── */}
          <div className="flex-1 min-w-0">

            {/* Sort bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  title="Toggle filters"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0A1628] transition-colors border border-gray-200 rounded-lg px-3 py-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filters
                </button>
                <p className="text-sm font-semibold text-[#0A1628]">
                  <span className="text-[#22C55E]">{total}</span>{' '}
                  {verifiedOnly ? 'Verified Properties Found' : 'Properties Found'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(event) =>
                    updateQuery({
                      sort: event.target.value,
                      page: '1',
                    })
                  }
                  title="Sort results"
                  aria-label="Sort results"
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#F5A623] text-gray-600 bg-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {/* View mode */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    aria-label="Grid view"
                    className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-[#0A1628] text-white' : 'text-gray-500 hover:text-[#0A1628]'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    title="List view"
                    aria-label="List view"
                    className={`px-3 py-2 transition-colors border-l border-gray-200 ${viewMode === 'list' ? 'bg-[#0A1628] text-white' : 'text-gray-500 hover:text-[#0A1628]'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[verifiedOnly ? 'Verified Only' : null, cityInput.trim() || null]
                .filter((item): item is string => Boolean(item))
                .map((f) => (
                <span key={f} className="flex items-center gap-1.5 bg-[#0A1628] text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  {f}
                  <button
                    onClick={() => {
                      if (f === 'Verified Only') {
                        updateQuery({ verified: 'false', page: '1' });
                        return;
                      }
                      setCityInput('');
                      updateQuery({ city: null, page: '1' });
                    }}
                    title={`Remove ${f}`}
                    aria-label={`Remove ${f}`}
                    className="hover:text-[#F5A623] transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>

            {/* Fraud alert banner (for unverified results) */}
            {unverifiedCount > 0 && (
              <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
                <svg className="w-5 h-5 text-[#F59E0B] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-[#92400E] font-medium">
                  <strong>{unverifiedCount} unverified listing{unverifiedCount > 1 ? 's' : ''}</strong> are included in these results. Unverified listings have not had their title deeds independently checked. Proceed with caution.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
                {error}
              </div>
            )}

            {/* Results Grid */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-4'}>
              {isLoading && (
                <div className="col-span-full bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
                  Loading properties...
                </div>
              )}
              {!isLoading && cardResults.length === 0 && (
                <div className="col-span-full bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
                  No properties match your current filters.
                </div>
              )}
              {cardResults.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  refParam={'/properties/search' + (searchParams.toString() ? '?' + searchParams.toString() : '')}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                disabled={page <= 1}
                onClick={() => updateQuery({ page: String(Math.max(1, page - 1)) })}
                title="Previous page"
                aria-label="Previous page"
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#0A1628] hover:text-[#0A1628] transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-4 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => updateQuery({ page: String(Math.min(totalPages, page + 1)) })}
                title="Next page"
                aria-label="Next page"
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#0A1628] hover:text-[#0A1628] transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── MAP PANEL ── */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-36 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-[#0A1628] px-4 py-3 flex items-center justify-between">
                <span className="text-white text-sm font-semibold">Map View</span>
                <button className="text-white/60 hover:text-white text-xs" title="Expand map">Expand</button>
              </div>
              {/* Placeholder map */}
              <div className="h-96 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-green-50" />
                {/* Mock property pins */}
                {[
                  { positionClass: 'left-[40%] top-[30%]', price: 'R4.8M', active: true },
                  { positionClass: 'left-[65%] top-[50%]', price: 'R2.1M', active: false },
                  { positionClass: 'left-[25%] top-[65%]', price: 'R1.75M', active: false },
                  { positionClass: 'left-[75%] top-[25%]', price: 'R8.5M', active: false },
                  { positionClass: 'left-[50%] top-[75%]', price: '$620K', active: false },
                ].map((pin, i) => (
                  <div
                    key={i}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${pin.positionClass}`}
                  >
                    <div className={`px-2 py-1 rounded-full text-xs font-bold shadow-lg cursor-pointer
                      ${pin.active
                        ? 'bg-[#F5A623] text-[#0A1628] ring-4 ring-[#F5A623]/30 scale-110'
                        : 'bg-[#0A1628] text-white hover:bg-[#F5A623] hover:text-[#0A1628]'}
                      transition-all`}
                    >
                      {pin.price}
                    </div>
                  </div>
                ))}
                <p className="relative z-10 text-gray-400 text-xs">Interactive map</p>
              </div>

              {/* Map legend */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0A1628] inline-block" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#F5A623] inline-block" />
                    Selected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#22C55E] inline-block" />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertySearchResultsPage() {
  return (
    <Suspense fallback={null}>
      <PropertySearchResultsContent />
    </Suspense>
  );
}
