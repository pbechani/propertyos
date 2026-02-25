import Link from 'next/link';

export interface PropertyCardData {
  id: string;
  title: string;
  price: number;
  currency?: string;
  location: string;
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

export default function PropertyCard({ property }: { property: PropertyCardData }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Image */}
      <div className="relative h-52 bg-gray-100 overflow-hidden">
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

        {/* Badges overlay */}
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
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#0A1628]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Link href={`/properties/${property.id}`} className="bg-[#F5A623] text-[#0A1628] font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#FBBF47] transition-colors">
            View Progress →
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Price */}
        <div>
          <p className="text-2xl font-bold text-[#0A1628]">{formatPrice(property.price, property.currency)}</p>
          <p className="text-xs text-gray-500">{property.title}</p>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {property.bedrooms !== undefined && (
            <span className="flex items-center gap-1">🛏 {property.bedrooms}</span>
          )}
          {property.bathrooms !== undefined && (
            <span className="flex items-center gap-1">🚿 {property.bathrooms}</span>
          )}
          {property.sqm && (
            <span className="flex items-center gap-1">📐 {property.sqm}m²</span>
          )}
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{property.propertyType}</span>
        </div>

        {/* Location */}
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {property.location}
        </p>

        {/* Pipeline stage */}
        {property.pipelineStage !== undefined && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-[#0A1628]">14-Stage Pipeline</span>
              <span className="text-xs text-gray-500">Stage {property.pipelineStage} of 14</span>
            </div>
            <div className="grid grid-cols-14 gap-1">
              {Array.from({ length: 14 }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full ${index < property.pipelineStage ? 'bg-[#F5A623]' : 'bg-gray-100'}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Agent */}
        {property.agentName && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0A1628] flex items-center justify-center text-white text-xs font-bold">
                {property.agentName.charAt(0)}
              </div>
              <span className="text-xs text-gray-600">{property.agentName}</span>
            </div>
            {property.agentTier && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIER_STYLES[property.agentTier]}`}>
                {TIER_LABELS[property.agentTier]}
              </span>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/properties/${property.id}`}
            className="flex-1 bg-[#0A1628] text-white text-sm font-semibold py-2.5 rounded-lg text-center hover:bg-[#0F2040] transition-colors"
          >
            View Details
          </Link>
          <button
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
            aria-label="Save property"
            title="Save property"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
