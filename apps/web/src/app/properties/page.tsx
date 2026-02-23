import Link from 'next/link';
import Navbar from '@/components/property/Navbar';
import PropertyCard, { PropertyCardData } from '@/components/property/PropertyCard';

const FALLBACK_LISTINGS: PropertyCardData[] = [
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
    title: 'Prime Commercial Land, Accra',
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

const TRUST_FEATURES = [
  {
    icon: '🛡',
    title: 'Fraud Protection',
    desc: 'Every listing undergoes document verification. Title deeds, survey plans, and ownership history are independently validated.',
  },
  {
    icon: '🔒',
    title: 'Escrow Security',
    desc: 'Funds are held in a regulated escrow account and only released when legal transfer conditions are met.',
  },
  {
    icon: '👁',
    title: 'Full Transparency',
    desc: 'Track every stage of your purchase through our 14-Stage Pipeline. No surprises, no hidden steps.',
  },
  {
    icon: '🌍',
    title: 'Diaspora Ready',
    desc: 'Built for remote buyers. Geo-tagged progress photos, independent inspections, and multi-currency support.',
  },
];

const AGENTS = [
  { name: 'Sarah Mokoena', location: 'Johannesburg', tier: 'gold', deals: 142, rating: 4.9 },
  { name: 'Kwame Asante', location: 'Accra, Ghana', tier: 'gold', deals: 98, rating: 4.8 },
  { name: 'Fatima Al-Hassan', location: 'Lagos, Nigeria', tier: 'gold', deals: 76, rating: 4.9 },
  { name: 'Thabo Dlamini', location: 'Durban', tier: 'silver', deals: 54, rating: 4.7 },
];

const TIER_COLORS: Record<string, string> = {
  gold: 'bg-[#F5A623] text-[#0A1628]',
  silver: 'bg-gray-300 text-gray-800',
  bronze: 'bg-amber-700 text-white',
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

type ApiPropertyListing = {
  id: string;
  title: string;
  price: string;
  currency: string;
  property_type: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqm?: string | null;
  verification_status: string;
  location?: {
    city?: string | null;
    region?: string | null;
  } | null;
  media?: Array<{
    url: string;
    is_primary: boolean;
  }>;
};

type ApiSearchResponse = {
  data: ApiPropertyListing[];
};

async function fetchFeaturedListings(): Promise<PropertyCardData[]> {
  try {
    const params = new URLSearchParams({
      page: '1',
      limit: '6',
      sort: 'newest',
      verification_status: 'verified',
    });

    const response = await fetch(`${API_BASE_URL}/properties?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return FALLBACK_LISTINGS;
    }

    const payload = (await response.json()) as ApiSearchResponse;

    if (!payload.data || payload.data.length === 0) {
      return FALLBACK_LISTINGS;
    }

    return payload.data.map((item) => {
      const city = item.location?.city ?? '';
      const region = item.location?.region ?? '';
      const location = [city, region].filter(Boolean).join(', ') || 'Location unavailable';
      const imageUrl = item.media?.find((media) => media.is_primary)?.url;
      const parsedPrice = Number(item.price);

      return {
        id: item.id,
        title: item.title,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        currency: item.currency,
        location,
        bedrooms: item.bedrooms ?? undefined,
        bathrooms: item.bathrooms ?? undefined,
        sqm: item.area_sqm ? Number(item.area_sqm) : undefined,
        propertyType: item.property_type.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
        verified: item.verification_status === 'verified',
        fraudAlert: item.verification_status === 'flagged',
        imageUrl,
      };
    });
  } catch {
    return FALLBACK_LISTINGS;
  }
}

export default async function PropertyMarketplace() {
  const featuredListings = await fetchFeaturedListings();

  return (
    <div className="min-h-screen bg-white font-manrope">
      <Navbar />

      {/* ── TRUST BADGE STRIP ── */}
      <div className="bg-[#F5A623]">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-center gap-8 text-[#0A1628] text-xs font-bold overflow-x-auto whitespace-nowrap">
          <span className="flex items-center gap-1.5">✓ Verified Listings</span>
          <span className="text-[#0A1628]/30">|</span>
          <span className="flex items-center gap-1.5">🔒 Escrow Protected</span>
          <span className="text-[#0A1628]/30">|</span>
          <span className="flex items-center gap-1.5">📋 14-Stage Pipeline</span>
          <span className="text-[#0A1628]/30">|</span>
          <span className="flex items-center gap-1.5">📍 Geo-Verified Progress</span>
          <span className="text-[#0A1628]/30">|</span>
          <span className="flex items-center gap-1.5">🌍 47 Countries</span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="bg-[#0A1628] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 border border-[#F5A623]/30 rounded-full px-4 py-1.5 text-[#F5A623] text-sm font-semibold mb-6">
              🏆 Africa&apos;s #1 Trusted Property Platform
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight tracking-tight">
              Buy, Sell & Build<br />
              <span className="text-[#F5A623]">with Confidence</span>
            </h1>
            <p className="mt-6 text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              The fraud-free property platform built for diaspora buyers and local investors.
              Every listing verified. Every transaction protected by escrow.
            </p>

            {/* Search Bar */}
            <div className="mt-10 bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {['All', 'Land', 'Residential', 'Commercial', 'Off-Plan', 'New Build'].map((tab, idx) => (
                  <button
                    key={tab}
                    className={`flex-none px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2
                      ${idx === 0
                        ? 'border-[#F5A623] text-[#0A1628]'
                        : 'border-transparent text-gray-500 hover:text-[#0A1628]'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#F5A623] focus-within:ring-1 focus-within:ring-[#F5A623] transition">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent" placeholder="City, area or neighbourhood" />
                </div>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 min-w-[160px] focus-within:border-[#F5A623] transition">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <select className="flex-1 outline-none text-sm text-gray-700 bg-transparent">
                    <option>Any Price</option>
                    <option>Under R1M</option>
                    <option>R1M – R3M</option>
                    <option>R3M – R6M</option>
                    <option>R6M+</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer select-none">
                  <span className="text-sm text-gray-600 whitespace-nowrap font-medium">Verified Only</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-[#22C55E] transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
                <Link
                  href="/properties/search"
                  className="bg-[#0A1628] text-white px-7 py-3 rounded-xl font-bold text-sm hover:bg-[#0F2040] transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Properties
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="bg-[#0F2040] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { value: '2,400+', label: 'Verified Properties' },
            { value: '$120M+', label: 'Escrowed to Date' },
            { value: '98%', label: 'Dispute-Free Rate' },
            { value: '47', label: 'Countries Served' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-[#F5A623]">{stat.value}</p>
              <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY PRIBEC ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0A1628]">Why PRIBEC?</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            We built the trust infrastructure that emerging property markets need — so every buyer, seller, and investor can transact with confidence.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_FEATURES.map((f) => (
            <div key={f.title} className="bg-[#F8F9FA] rounded-2xl p-6 hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-[#0A1628] rounded-xl flex items-center justify-center text-2xl mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-[#0A1628] text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED LISTINGS ── */}
      <section className="bg-[#F8F9FA] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-[#0A1628]">Featured Listings</h2>
              <p className="text-gray-500 mt-1">Hand-curated verified properties across emerging markets</p>
            </div>
            <Link href="/properties/search" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#0A1628] hover:text-[#F5A623] transition-colors">
              View all listings →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <PropertyCard key={listing.id} property={listing} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/properties/search"
              className="inline-flex items-center gap-2 bg-[#0A1628] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#0F2040] transition-colors"
            >
              Browse All Verified Properties
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED AGENTS ── */}
      <section className="bg-[#0A1628] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white">Verified Agents</h2>
              <p className="text-white/60 mt-1">Independently verified professionals with proven track records</p>
            </div>
            <Link href="/agent" className="text-sm font-semibold text-[#F5A623] hover:underline hidden sm:block">
              All Agents →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AGENTS.map((agent) => (
              <div key={agent.name} className="bg-[#0F2040] border border-white/10 rounded-2xl p-5 hover:border-[#F5A623]/40 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#F5A623] flex items-center justify-center text-[#0A1628] text-lg font-bold">
                    {agent.name.charAt(0)}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIER_COLORS[agent.tier]}`}>
                    {agent.tier.charAt(0).toUpperCase() + agent.tier.slice(1)}
                  </span>
                </div>
                <h3 className="text-white font-bold">{agent.name}</h3>
                <p className="text-white/50 text-xs mt-0.5">{agent.location}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-white/60">
                  <span>⭐ {agent.rating}</span>
                  <span>|</span>
                  <span>{agent.deals} deals</span>
                </div>
                <Link
                  href={`/agent`}
                  className="mt-4 block text-center text-xs font-semibold text-[#F5A623] border border-[#F5A623]/30 rounded-lg py-2 hover:bg-[#F5A623]/10 transition-colors"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-[#F5A623] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#0A1628]">Ready to buy with confidence?</h2>
          <p className="mt-3 text-[#0A1628]/70">
            Join 12,000+ buyers and investors using PRIBEC to make fraud-free property transactions.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="bg-[#0A1628] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#0F2040] transition-colors">
              Create Free Account
            </Link>
            <Link href="/properties/search" className="bg-white text-[#0A1628] font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors">
              Browse Properties
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0A1628] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-3">Platform</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><Link href="/properties" className="hover:text-white transition-colors">Property Marketplace</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Construction</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Escrow</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3">For Buyers</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">14-Stage Pipeline</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Diaspora Guide</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3">For Agents</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">List Property</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Verification</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3">Legal</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Trust & Safety</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#F5A623] rounded-lg flex items-center justify-center">
                <span className="text-[#0A1628] font-bold text-xs">P</span>
              </div>
              <span className="text-white font-bold">PRIBEC</span>
            </div>
            <p className="text-white/40 text-sm">© 2026 PRIBEC. All rights reserved. Built for trust.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
