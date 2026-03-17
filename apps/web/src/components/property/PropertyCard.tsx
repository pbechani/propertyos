import Link from 'next/link';
import PropertyCardHeader from '@/components/property/PropertyCardHeader';

export interface PropertyCardData {
  id: string;
  title: string;
  price: number;
  currency?: string;
  location: string;
  /** Raw address line for multi-agent listing grouping */
  addressLine1?: string | null;
  /** Raw city for multi-agent listing grouping */
  addressCity?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  sqm?: number;
  propertyType: string;
  verified: boolean;
  escrowReady?: boolean;
  pipelineStage?: number;
  agentName?: string;
  agentTier?: 'gold' | 'silver' | 'bronze';
  imageUrl?: string;
  fraudAlert?: boolean;
  underInvestigation?: boolean;
  /** Whether the listing was created under the Self (private) company. */
  isPrivateListing?: boolean;
  /** Company logo URL for the card header. */
  companyLogoUrl?: string | null;
  /** Company name for the card header. */
  companyName?: string | null;
  /** Company brand color hex for the card header background. */
  companyBrandColor?: string | null;
  /** Agent or seller avatar URL for the card header. */
  personAvatarUrl?: string | null;
}

const TIER_STYLES = {
  gold: 'bg-[#F5A623] text-[#0A1628]',
  silver: 'bg-gray-300 text-gray-800',
  bronze: 'bg-amber-700 text-white',
};

const TIER_LABELS = { gold: 'Gold Agent', silver: 'Silver Agent', bronze: 'Bronze Agent' };

function formatPrice(price: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
}

export default function PropertyCard({
  property,
  refParam,
}: {
  property: PropertyCardData;
  refParam?: string;
}) {
  const detailHref = refParam
    ? `/properties/${property.id}?ref=${encodeURIComponent(refParam)}`
    : `/properties/${property.id}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Company / Owner header */}
      {property.agentName && (
        <PropertyCardHeader
          isPrivateListing={property.isPrivateListing ?? true}
          companyLogoUrl={property.companyLogoUrl}
          companyName={property.companyName}
          companyBrandColor={property.companyBrandColor}
          personName={property.agentName}
          personAvatarUrl={property.personAvatarUrl}
        />
      )}

      {/* Body: image (3/4) + description (1/4) */}
      <div className="flex flex-1 min-h-0">
        {/* Image — 3/4 width */}
        <div className="relative w-3/4 bg-gray-100 overflow-hidden" style={{ minHeight: '13rem' }}>
          {property.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-[#0A1628] to-[#1A3050] flex items-center justify-center">
              <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              </svg>
            </div>
          )}

          {/* Badges overlay — top-left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {property.verified && (
              <span className="flex items-center gap-1 bg-[#22C55E] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1l2.39 4.84 5.35.78-3.87 3.77.91 5.31L10 13.27 5.22 15.7l.91-5.31L2.26 6.62l5.35-.78L10 1z" clipRule="evenodd" />
                </svg>
                VERIFIED
              </span>
            )}
            {property.escrowReady && (
              <span className="flex items-center gap-1 bg-[#F5A623] text-[#0A1628] text-xs font-bold px-2.5 py-1 rounded-full shadow">
                🔒 Escrow
              </span>
            )}
            {property.fraudAlert && (
              <span className="flex items-center gap-1 bg-[#F59E0B] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                ⚠ Unverified
              </span>
            )}
            {property.underInvestigation && (
              <span className="flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                ⚠ Caution: Under Investigation
              </span>
            )}
          </div>

          {/* Favourite button — top-right corner of the image */}
          <button
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow transition-colors"
            aria-label="Save property"
            title="Save property"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-[#0A1628]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Link href={detailHref} className="bg-[#F5A623] text-[#0A1628] font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#FBBF47] transition-colors">
              View Progress →
            </Link>
          </div>
        </div>

        {/* Description — 1/4 width */}
        <div className="w-1/4 p-3 flex flex-col gap-2 border-l border-gray-100 min-w-0">
          {/* Price */}
          <div>
            <p className="text-base font-bold text-[#0A1628] leading-tight">{formatPrice(property.price, property.currency)}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{property.title}</p>
          </div>

          {/* Specs */}
          <div className="flex flex-col gap-1 text-xs text-gray-600">
            {property.bedrooms !== undefined && (
              <span className="flex items-center gap-1">🛏 {property.bedrooms} bed</span>
            )}
            {property.bathrooms !== undefined && (
              <span className="flex items-center gap-1">🚿 {property.bathrooms} bath</span>
            )}
            {property.sqm && (
              <span className="flex items-center gap-1">📐 {property.sqm}m²</span>
            )}
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded w-fit">{property.propertyType}</span>
          </div>

          {/* Location */}
          <p className="text-xs text-gray-500 flex items-start gap-1 line-clamp-2">
            <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {property.location}
          </p>

          {/* Pipeline stage */}
          {property.pipelineStage !== undefined && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-[#0A1628]" style={{ fontSize: '0.6rem' }}>Pipeline</span>
                <span className="text-gray-500" style={{ fontSize: '0.6rem' }}>{property.pipelineStage ?? 0}/14</span>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: 14 }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full ${index < (property.pipelineStage ?? 0) ? 'bg-[#F5A623]' : 'bg-gray-100'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Agent tier */}
          {property.agentTier && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${TIER_STYLES[property.agentTier]}`}>
              {TIER_LABELS[property.agentTier]}
            </span>
          )}

          {/* CTA */}
          <div className="mt-auto pt-1">
            <Link
              href={detailHref}
              className="block w-full bg-[#0A1628] text-white text-xs font-semibold py-2 rounded-lg text-center hover:bg-[#0F2040] transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
