'use client';

import { useState } from 'react';
import Navbar from '@/components/property/Navbar';
import PropertyCard, { PropertyCardData } from '@/components/property/PropertyCard';

const MOCK_RESULTS: PropertyCardData[] = [
  {
    id: '1',
    title: '4-Bed Executive Home, Sandton',
    price: 4800000,
    currency: 'ZAR',
    location: 'Sandton, Johannesburg',
    bedrooms: 4,
    bathrooms: 3,
    sqm: 280,
    propertyType: 'Residential',
    verified: true,
    escrowReady: true,
    pipelineStage: 3,
    agentName: 'Sarah Mokoena',
    agentTier: 'gold',
  },
  {
    id: '2',
    title: 'Prime Commercial Land',
    price: 620000,
    currency: 'USD',
    location: 'East Legon, Accra',
    sqm: 1200,
    propertyType: 'Land',
    verified: true,
    escrowReady: true,
    pipelineStage: 1,
    agentName: 'Kwame Asante',
    agentTier: 'gold',
  },
  {
    id: '3',
    title: 'Off-Plan Luxury Apartment',
    price: 2100000,
    currency: 'ZAR',
    location: 'Umhlanga, Durban',
    bedrooms: 3,
    bathrooms: 2,
    sqm: 180,
    propertyType: 'Off-Plan',
    verified: true,
    pipelineStage: 5,
    agentName: 'Thabo Dlamini',
    agentTier: 'silver',
  },
  {
    id: '4',
    title: '3-Bed Family Home',
    price: 1750000,
    currency: 'ZAR',
    location: 'Midrand, Gauteng',
    bedrooms: 3,
    bathrooms: 2,
    sqm: 210,
    propertyType: 'Residential',
    verified: true,
    pipelineStage: 2,
    agentName: 'Linda Sithole',
    agentTier: 'silver',
  },
  {
    id: '5',
    title: 'Commercial Office Block',
    price: 8500000,
    currency: 'ZAR',
    location: 'Rosebank, Johannesburg',
    sqm: 950,
    propertyType: 'Commercial',
    verified: true,
    escrowReady: true,
    agentName: 'Bongani Ndlovu',
    agentTier: 'gold',
  },
  {
    id: '6',
    title: 'Agricultural Land, Limpopo',
    price: 980000,
    currency: 'ZAR',
    location: 'Tzaneen, Limpopo',
    sqm: 50000,
    propertyType: 'Agricultural',
    verified: false,
    fraudAlert: true,
    agentName: 'Sipho Mahlangu',
    agentTier: 'bronze',
  },
];

const PROPERTY_TYPES = ['Residential', 'Land', 'Commercial', 'Off-Plan', 'Agricultural', 'New Build'];
const AGENT_TIERS = ['Gold', 'Silver', 'Bronze'];

const ACTIVE_FILTERS = ['Verified Only', 'Johannesburg', 'R1M – R6M'];

export default function PropertySearchResults() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [escrowReady, setEscrowReady] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-manrope">
      <Navbar />

      {/* ── SEARCH BAR HEADER ── */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
          {/* Search input */}
          <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#F5A623] focus-within:ring-1 focus-within:ring-[#F5A623] transition bg-white">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              defaultValue="Johannesburg, South Africa"
              placeholder="Search location..."
            />
          </div>
          {/* Save search */}
          <button className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-[#F5A623] hover:text-[#0A1628] transition bg-white whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save Search
          </button>
          {/* User avatar */}
          <div className="w-9 h-9 rounded-full bg-[#0A1628] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            J
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* ── LEFT SIDEBAR FILTERS ── */}
          <aside className={`${sidebarOpen ? 'w-64 flex-shrink-0' : 'hidden'} transition-all`}>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-36 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#0A1628]">Filters</h3>
                <button className="text-xs text-[#F5A623] font-semibold hover:underline">Clear all</button>
              </div>

              {/* Verified Only */}
              <div className="pb-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0A1628]">Verified Only</p>
                    <p className="text-xs text-gray-400">Show title-deed verified listings</p>
                  </div>
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${verifiedOnly ? 'bg-[#22C55E]' : 'bg-gray-200'}`}
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
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${escrowReady ? 'bg-[#F5A623]' : 'bg-gray-200'}`}
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
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0A1628] transition-colors border border-gray-200 rounded-lg px-3 py-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filters
                </button>
                <p className="text-sm font-semibold text-[#0A1628]">
                  <span className="text-[#22C55E]">142</span> Verified Properties Found
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#F5A623] text-gray-600 bg-white">
                  <option>Sort: Newest</option>
                  <option>Price: Low–High</option>
                  <option>Price: High–Low</option>
                  <option>Most Verified</option>
                  <option>Pipeline Stage</option>
                </select>
                {/* View mode */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-[#0A1628] text-white' : 'text-gray-500 hover:text-[#0A1628]'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
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
              {ACTIVE_FILTERS.map((f) => (
                <span key={f} className="flex items-center gap-1.5 bg-[#0A1628] text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  {f}
                  <button className="hover:text-[#F5A623] transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>

            {/* Fraud alert banner (for unverified results) */}
            <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
              <svg className="w-5 h-5 text-[#F59E0B] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-[#92400E] font-medium">
                <strong>1 unverified listing</strong> is included in these results. Unverified listings have not had their title deeds independently checked. Proceed with caution.
              </p>
            </div>

            {/* Results Grid */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-4'}>
              {MOCK_RESULTS.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-10">
              <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#0A1628] hover:text-[#0A1628] transition-colors bg-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {[1, 2, 3, '...', 8, 9, 10].map((page, idx) => (
                <button
                  key={idx}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors
                    ${page === 1
                      ? 'bg-[#0A1628] text-white'
                      : page === '...'
                      ? 'text-gray-400 cursor-default'
                      : 'border border-gray-200 text-gray-600 hover:border-[#0A1628] hover:text-[#0A1628] bg-white'}`}
                >
                  {page}
                </button>
              ))}
              <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#0A1628] hover:text-[#0A1628] transition-colors bg-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── MAP PANEL ── */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-36 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-[#0A1628] px-4 py-3 flex items-center justify-between">
                <span className="text-white text-sm font-semibold">Map View</span>
                <button className="text-white/60 hover:text-white text-xs">Expand</button>
              </div>
              {/* Placeholder map */}
              <div className="h-96 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50" />
                {/* Mock property pins */}
                {[
                  { x: 40, y: 30, price: 'R4.8M', active: true },
                  { x: 65, y: 50, price: 'R2.1M', active: false },
                  { x: 25, y: 65, price: 'R1.75M', active: false },
                  { x: 75, y: 25, price: 'R8.5M', active: false },
                  { x: 50, y: 75, price: '$620K', active: false },
                ].map((pin, i) => (
                  <div
                    key={i}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
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
