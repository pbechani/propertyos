import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/property/Navbar';
import PipelineTracker, { PURCHASE_STAGES } from '@/components/property/PipelineTracker';
import { PropertyActions } from '@/components/property/PropertyActions';

const PROPERTY = {
  id: '1',
  title: '4-Bed Executive Home, Sandton Ridge',
  price: 4800000,
  currency: 'ZAR',
  pricePerSqm: 17143,
  location: 'Sandton Ridge, Johannesburg, Gauteng',
  bedrooms: 4,
  bathrooms: 3,
  sqm: 280,
  landSize: 650,
  propertyType: 'Residential',
  yearBuilt: 2019,
  zoning: 'Residential R1',
  verified: true,
  escrowReady: true,
  titleDeedNumber: 'T***/***/2019',
  lastVerified: '14 Feb 2026',
  description: `This exceptional executive home is nestled in the prestigious Sandton Ridge estate, offering unparalleled finishes and sweeping views of the Johannesburg skyline. With 4 spacious bedrooms, 3 en-suite bathrooms, and a state-of-the-art open-plan kitchen, this property epitomizes modern luxury living. The home features underfloor heating, triple-car garage, solar backup power, and a sparkling pool — all within a guarded, access-controlled complex.

Perfect for families and diaspora investors seeking a blue-chip asset in Africa's financial capital.`,
};

const DOCUMENTS = [
  { name: 'Title Deed', status: 'verified', note: 'Verified by PRIBEC' },
  { name: 'Survey Plan', status: 'verified', note: 'Verified by PRIBEC' },
  { name: 'Building Plans', status: 'verified', note: 'Verified by PRIBEC' },
  { name: 'Building Permit', status: 'pending', note: 'Awaiting municipal confirmation' },
  { name: 'No Encumbrance Certificate', status: 'missing', note: 'Not yet submitted' },
  { name: 'Rates Clearance Certificate', status: 'missing', note: 'Required at Stage 9' },
];

const SIMILAR = [
  { id: '2', title: '3-Bed Home, Morningside', price: 3200000, bedrooms: 3, sqm: 220, verified: true },
  { id: '3', title: '5-Bed Mansion, Hyde Park', price: 9500000, bedrooms: 5, sqm: 520, verified: true },
  { id: '4', title: '4-Bed Home, Bryanston', price: 5100000, bedrooms: 4, sqm: 310, verified: true },
];

const DOC_STATUS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  verified: { label: 'Verified', icon: '✓', color: 'text-[#22C55E]', bg: 'bg-[#DCFCE7]' },
  pending: { label: 'Pending', icon: '⏳', color: 'text-[#F59E0B]', bg: 'bg-[#FEF3C7]' },
  missing: { label: 'Not Submitted', icon: '✗', color: 'text-[#EF4444]', bg: 'bg-[#FEE2E2]' },
};

function formatPrice(price: number, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

type ApiPropertyDetail = {
  id: string;
  title: string;
  description?: string | null;
  property_type: string;
  price: string;
  currency: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqm?: string | null;
  verification_status: string;
  location?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
  } | null;
};

async function fetchPropertyById(id: string): Promise<ApiPropertyDetail | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ApiPropertyDetail;
  } catch {
    return null;
  }
}

function mapApiPropertyToDisplayProperty(
  property: ApiPropertyDetail | null,
): typeof PROPERTY {
  if (!property) {
    return PROPERTY;
  }

  const city = property.location?.city ?? '';
  const region = property.location?.region ?? '';
  const country = property.location?.country ?? '';
  const location = [city, region, country].filter(Boolean).join(', ');
  const areaSqm = property.area_sqm ? Number(property.area_sqm) : null;
  const price = Number(property.price);
  const pricePerSqm = areaSqm && areaSqm > 0 ? Math.round(price / areaSqm) : PROPERTY.pricePerSqm;

  return {
    ...PROPERTY,
    id: property.id,
    title: property.title,
    price,
    currency: property.currency,
    pricePerSqm,
    location: location || PROPERTY.location,
    bedrooms: property.bedrooms ?? PROPERTY.bedrooms,
    bathrooms: property.bathrooms ?? PROPERTY.bathrooms,
    sqm: areaSqm ?? PROPERTY.sqm,
    propertyType: property.property_type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase()),
    verified: property.verification_status === 'verified',
    description: property.description || PROPERTY.description,
  };
}

type PropertyPageProps = {
  params: {
    id: string;
  };
};

function getListingSeoDescription(description: string): string {
  const normalized = description.replace(/\s+/g, ' ').trim();
  return normalized.slice(0, 160);
}

function getListingCity(location: string): string {
  const parts = location.split(',').map((part) => part.trim());
  return parts[1] ?? parts[0] ?? 'Unknown City';
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const city = getListingCity(PROPERTY.location);
  const propertyType = PROPERTY.propertyType.toLowerCase();
  const title = `${PROPERTY.bedrooms}BR ${propertyType} in ${city} | PRIBEC`;
  const description = getListingSeoDescription(PROPERTY.description);
  const canonicalPath = `/properties/${params.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalPath,
      siteName: 'PRIBEC',
    },
  };
}

export default async function PropertyDetail({ params }: PropertyPageProps) {
  const liveProperty = await fetchPropertyById(params.id);
  const PROPERTY = mapApiPropertyToDisplayProperty(liveProperty);
  const deposit = PROPERTY.price * 0.1;
  const transferDuty = PROPERTY.price * 0.05;
  const legalFees = 45000;
  const total = PROPERTY.price + transferDuty + legalFees;
  const listingUrl = `https://www.pribec.com/properties/${params.id}`;
  const listingDescription = getListingSeoDescription(PROPERTY.description);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: PROPERTY.title,
    description: listingDescription,
    url: listingUrl,
    datePosted: new Date().toISOString(),
    offers: {
      '@type': 'Offer',
      price: PROPERTY.price,
      priceCurrency: PROPERTY.currency,
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: getListingCity(PROPERTY.location),
      addressCountry: 'ZA',
      streetAddress: PROPERTY.location,
    },
    numberOfRooms: PROPERTY.bedrooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: PROPERTY.sqm,
      unitCode: 'MTK',
    },
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-manrope">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />

      {/* ── BREADCRUMB ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#0A1628] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/properties" className="hover:text-[#0A1628] transition-colors">Marketplace</Link>
          <span>/</span>
          <Link href="/properties/search" className="hover:text-[#0A1628] transition-colors">Search</Link>
          <span>/</span>
          <span className="text-[#0A1628] font-medium truncate max-w-xs">{PROPERTY.title}</span>
        </div>
      </div>

      {/* ── HERO GALLERY ── */}
      <div className="relative bg-[#0A1628] h-80 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Placeholder gradient gallery */}
          <div className="w-full h-full bg-gradient-to-br from-[#0A1628] via-[#1A3050] to-[#0F2040] flex items-center justify-center">
            <p className="text-white/30 text-sm">Property Gallery · 12 Photos</p>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 bg-[#22C55E] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1l2.39 4.84 5.35.78-3.87 3.77.91 5.31L10 13.27 5.22 15.7l.91-5.31L2.26 6.62l5.35-.78L10 1z" clipRule="evenodd" />
            </svg>
            VERIFIED
          </span>
          <span className="flex items-center gap-1.5 bg-[#F5A623] text-[#0A1628] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            🔒 Escrow Protected
          </span>
          <span className="flex items-center gap-1.5 bg-[#0A1628]/80 text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
            📋 14-Stage Pipeline Active
          </span>
        </div>

        {/* Thumbnail strip */}
        <div className="absolute bottom-4 left-5 right-5 flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-16 h-11 flex-shrink-0 rounded-lg border-2 cursor-pointer
              ${i === 1 ? 'border-[#F5A623]' : 'border-white/30 hover:border-white/70'} 
              bg-white/10 transition-colors`}
            />
          ))}
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Title + Price */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold text-[#0A1628]">{formatPrice(PROPERTY.price, PROPERTY.currency)}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{formatPrice(PROPERTY.pricePerSqm, PROPERTY.currency)}/m²</p>
                  <h1 className="text-xl font-bold text-[#0A1628] mt-2">{PROPERTY.title}</h1>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {PROPERTY.location}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 hover:border-[#0A1628] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  <button className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 hover:border-red-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Save
                  </button>
                </div>
              </div>

              {/* Specs grid */}
              <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { icon: '🛏', label: 'Bedrooms', value: PROPERTY.bedrooms },
                  { icon: '🚿', label: 'Bathrooms', value: PROPERTY.bathrooms },
                  { icon: '📐', label: 'Floor Area', value: `${PROPERTY.sqm}m²` },
                  { icon: '🌿', label: 'Land Size', value: `${PROPERTY.landSize}m²` },
                  { icon: '📅', label: 'Year Built', value: PROPERTY.yearBuilt },
                  { icon: '🏙', label: 'Zoning', value: PROPERTY.zoning },
                ].map((s) => (
                  <div key={s.label} className="bg-[#F8F9FA] rounded-xl p-3 text-center">
                    <span className="text-lg">{s.icon}</span>
                    <p className="text-xs font-bold text-[#0A1628] mt-1">{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#0A1628] text-lg">Verification Status</h2>
                <span className="flex items-center gap-1.5 bg-[#DCFCE7] text-[#22C55E] text-xs font-bold px-3 py-1.5 rounded-full">
                  ✓ Fully Verified
                </span>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#22C55E] text-xl flex-shrink-0">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0A1628]">Title Deed: {PROPERTY.titleDeedNumber}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Last independently verified: {PROPERTY.lastVerified}</p>
                  <p className="text-xs text-gray-400 mt-1">Ownership history, encumbrances, and lien status confirmed</p>
                  <button className="mt-3 text-sm font-semibold text-[#F5A623] hover:underline">
                    View Full Verification Report →
                  </button>
                </div>
              </div>
            </div>

            {/* 14-Stage Pipeline */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-[#0A1628] text-lg">14-Stage Purchase Pipeline</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Currently at Stage 3 — Sale Agreement</p>
                </div>
                <span className="text-xs font-bold text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/30 px-3 py-1.5 rounded-full">
                  Stage 3 of 14
                </span>
              </div>
              <PipelineTracker stages={PURCHASE_STAGES} />
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-[#0A1628] text-lg mb-4">Property Description</h2>
              <div className="text-sm text-gray-600 leading-relaxed space-y-3">
                {PROPERTY.description.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Document Checklist */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-[#0A1628] text-lg mb-4">Document Checklist</h2>
              <div className="space-y-3">
                {DOCUMENTS.map((doc) => {
                  const s = DOC_STATUS[doc.status];
                  return (
                    <div key={doc.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full ${s.bg} ${s.color} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                          {s.icon}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#0A1628]">{doc.name}</p>
                          <p className="text-xs text-gray-400">{doc.note}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Similar Properties */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-[#0A1628] text-lg mb-4">Similar Properties</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SIMILAR.map((p) => (
                  <Link
                    key={p.id}
                    href={`/properties/${p.id}`}
                    className="block bg-[#F8F9FA] rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="h-24 bg-gradient-to-br from-[#0A1628] to-[#1A3050] rounded-lg mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                      </svg>
                    </div>
                    {p.verified && (
                      <span className="text-xs font-bold text-[#22C55E] mb-1 block">✓ VERIFIED</span>
                    )}
                    <p className="text-sm font-bold text-[#0A1628]">{formatPrice(p.price, 'ZAR')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-1">🛏 {p.bedrooms} · 📐 {p.sqm}m²</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT STICKY SIDEBAR ── */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-4">

              {/* Agent Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#F5A623] flex items-center justify-center text-[#0A1628] text-xl font-bold flex-shrink-0">
                    S
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#0A1628] truncate">Sarah Mokoena</p>
                      <span className="flex-shrink-0 text-xs font-bold bg-[#F5A623] text-[#0A1628] px-2 py-0.5 rounded-full">Gold</span>
                    </div>
                    <p className="text-xs text-gray-500">Verified Agent since 2019</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 text-center text-xs mb-4 gap-2">
                  <div className="bg-[#F8F9FA] rounded-lg p-2">
                    <p className="font-bold text-[#0A1628]">142</p>
                    <p className="text-gray-400">Deals</p>
                  </div>
                  <div className="bg-[#F8F9FA] rounded-lg p-2">
                    <p className="font-bold text-[#0A1628]">⭐ 4.9</p>
                    <p className="text-gray-400">Rating</p>
                  </div>
                  <div className="bg-[#F8F9FA] rounded-lg p-2">
                    <p className="font-bold text-[#0A1628]">&lt;2h</p>
                    <p className="text-gray-400">Response</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-[#0A1628] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#0F2040] transition-colors">
                    📞 Call
                  </button>
                  <button className="flex-1 border border-[#0A1628] text-[#0A1628] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#F8F9FA] transition-colors">
                    💬 Message
                  </button>
                </div>
              </div>

              {/* Escrow CTA */}
              <div className="bg-[#0A1628] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#F5A623] text-lg">🔒</span>
                  <h3 className="text-white font-bold">Secure This Property</h3>
                </div>
                <p className="text-white/60 text-xs mb-4">Pay your deposit into a regulated, protected escrow account. Funds only release on successful legal transfer.</p>

                <div className="bg-white/10 rounded-xl p-3 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Listing Price</span>
                    <span className="text-white font-semibold">{formatPrice(PROPERTY.price, PROPERTY.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Deposit (10%)</span>
                    <span className="text-[#F5A623] font-semibold">{formatPrice(deposit, PROPERTY.currency)}</span>
                  </div>
                </div>

                <button className="w-full bg-[#F5A623] text-[#0A1628] font-bold py-3.5 rounded-xl hover:bg-[#FBBF47] transition-colors text-sm">
                  Pay Deposit to Escrow
                </button>

                <details className="mt-3">
                  <summary className="text-white/60 text-xs cursor-pointer hover:text-white transition-colors">
                    How does Escrow work? →
                  </summary>
                  <p className="text-white/50 text-xs mt-2 leading-relaxed">
                    Your deposit is held by a regulated PRIBEC escrow account. Funds are only released when all 14 pipeline stages are complete and legal transfer is confirmed by your conveyancer.
                  </p>
                </details>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-[#0A1628] mb-4">Financial Summary</h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: 'Asking Price', value: formatPrice(PROPERTY.price, PROPERTY.currency), bold: false },
                    { label: '10% Deposit', value: formatPrice(deposit, PROPERTY.currency), bold: false },
                    { label: 'Transfer Duty (est.)', value: formatPrice(transferDuty, PROPERTY.currency), bold: false },
                    { label: 'Legal Fees (est.)', value: formatPrice(legalFees, PROPERTY.currency), bold: false },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-gray-600">
                      <span>{row.label}</span>
                      <span className={row.bold ? 'font-bold text-[#0A1628]' : ''}>{row.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-[#0A1628]">
                    <span>Total Estimated Cost</span>
                    <span>{formatPrice(total, PROPERTY.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Report */}
              <div className="text-center">
                <PropertyActions propertyId={PROPERTY.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
