'use client';

import { BedDouble, Bath, CarFront, Maximize, Heart, Camera, Eye, MapPin, Shield, Flame, Warehouse, DollarSign, Clock, Home, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import PropertyCardHeader from '@/components/property/PropertyCardHeader';

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80';

import type { ListingCard } from '@/views/Listings';

function getListingStatusBadge(status: ListingCard['status']) {
  switch (status) {
    case 'active':
      return { label: 'ON SHOW', className: 'bg-blue-600 text-white' };
    case 'under_offer':
      return { label: 'OFFER SUBMITTED', className: 'bg-amber-600 text-white' };
    case 'sold':
      return { label: 'SOLD', className: 'bg-emerald-600 text-white' };
    case 'withdrawn':
      return { label: 'WITHDRAWN', className: 'bg-gray-600 text-white' };
    default:
      return { label: 'DRAFT', className: 'bg-gray-500 text-white' };
  }
}

function formatRandAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `R ${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (amount >= 1_000) {
    return `R ${(amount / 1_000).toFixed(0)}K`;
  }
  return `R ${amount.toLocaleString('en-ZA')}`;
}

interface Props {
  property: ListingCard;
  onSave: (id: string) => void;
  isSaved: boolean;
  isSaving: boolean;
}

export default function ListingCardOptA({ property, onSave, isSaved, isSaving }: Props) {
  const statusBadge = getListingStatusBadge(property.status);
  const verificationBadge = property.fraudFlagged
    ? { label: 'FLAGGED', style: { background: '#ef4444', color: '#fff' } }
    : property.verified
      ? { label: 'VERIFIED', style: { background: '#00E87A', color: '#0C0D10' }, icon: true }
      : { label: 'UNVERIFIED', style: { background: '#ca8a04', color: '#fff' } };

  const daysListed = Math.max(0, Math.floor((Date.now() - new Date(property.createdAt).getTime()) / 86_400_000));
  const daysListedLabel = daysListed === 0 ? 'Listed today' : daysListed === 1 ? '1 day ago' : `${daysListed} days ago`;

  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-shadow duration-200 gap-0"
      style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 12 }}
    >
      {/* Company / Owner header banner */}
      <PropertyCardHeader
        isPrivateListing={property.isPrivateListing}
        companyLogoUrl={property.agentCompanyLogoUrl}
        companyName={property.agentCompany}
        companyBrandColor={property.agentCompanyBrandColor}
        personName={property.agent}
        personAvatarUrl={property.agentAvatarUrl}
      />

      {/* Image block */}
      <div className="relative">
        <img
          src={property.image}
          alt={property.title}
          className="w-full object-cover h-52"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PROPERTY_IMAGE; }}
        />

        {/* Top-left badge stack */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded px-2 py-0.5"
            style={{
              ...verificationBadge.style,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            {'icon' in verificationBadge && verificationBadge.icon && <Shield className="w-3 h-3" />}
            {verificationBadge.label}
          </span>
          <Badge className={statusBadge.className} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>
            {statusBadge.label}
          </Badge>
          {property.nextOpenHouseAt && (
            <Badge className="bg-purple-600 text-white" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>
              🏡 OPEN HOUSE · {new Date(property.nextOpenHouseAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Badge>
          )}
          {property.viewCount >= 20 && (
            <Badge className="bg-orange-500 text-white" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>
              <Flame className="w-3 h-3 mr-1" />Hot
            </Badge>
          )}
        </div>

        {/* Heart button top-right */}
        <button
          type="button"
          aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          title={isSaved ? 'Remove from saved' : 'Save property'}
          disabled={isSaving}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors ${isSaved ? 'bg-red-50 hover:bg-red-100' : 'bg-white hover:bg-red-50'}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(property.id); }}
        >
          {isSaved
            ? <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            : <Heart className="w-4 h-4 text-gray-400" />}
        </button>

        {/* Photo count bottom-left */}
        {property.mediaCount > 1 && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold rounded px-1.5 py-0.5 flex items-center gap-1">
            <Camera className="w-3 h-3" />{property.mediaCount}
          </div>
        )}

        {/* View count bottom-right */}
        {property.viewCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-semibold rounded px-1.5 py-0.5 flex items-center gap-1">
            <Eye className="w-3 h-3" />{property.viewCount}
          </div>
        )}
      </div>

      {/* White body */}
      <div className="px-4 py-4 flex-1 bg-white">
        {/* Title + price row */}
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="mb-1 truncate font-semibold group-hover:text-[#C4562A] transition-colors"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, color: '#1A3C28', lineHeight: 1.25 }}
            >
              {property.title}
            </h3>
            <p className="text-sm flex items-center gap-1" style={{ color: 'rgba(26,60,40,0.55)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{property.location}</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <div
              className="whitespace-nowrap"
              style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#1A3C28', fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}
            >
              {property.price}
            </div>
            {property.pricePerSqm !== null && (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#B89040', fontSize: 10, fontWeight: 500 }}>
                {formatRandAmount(property.pricePerSqm)}/m²
              </div>
            )}
          </div>
        </div>

        {/* Meta row — days, type, title type, verified stamp */}
        <div className="flex items-center gap-2.5 text-[11px] text-gray-400 mb-3 flex-wrap" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysListedLabel}
          </span>
          <span className="inline-flex items-center gap-1 capitalize">
            <Home className="w-3 h-3" />
            {property.propertyType}
          </span>
          {property.titleType && (
            <span className="inline-flex items-center gap-1">
              <Landmark className="w-3 h-3" />
              {property.titleType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          )}
          {property.verified && property.verifiedAt && (
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{ background: '#00E87A', color: '#0C0D10', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' }}
            >
              <Shield className="w-3 h-3" />
              VERIFIED {(() => {
                const d = Math.max(0, Math.floor((Date.now() - new Date(property.verifiedAt!).getTime()) / 86_400_000));
                return d === 0 ? 'TODAY' : d === 1 ? '1D AGO' : `${d}D AGO`;
              })()}
            </span>
          )}
          {property.fraudFlagged && (
            <span
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{ background: '#C4562A', color: '#fff', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.04em' }}
            >
              ⚠ UNDER REVIEW
            </span>
          )}
        </div>

        {/* Stats divider + row */}
        <div style={{ borderTop: '1px solid rgba(26,60,40,0.08)', paddingTop: 10, marginBottom: 8 }}>
          <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
            <span className="inline-flex items-center gap-1" title="Bedrooms">
              <BedDouble className="w-3.5 h-3.5" />
              <span>{property.beds}</span>
            </span>
            <span className="inline-flex items-center gap-1" title="Bathrooms">
              <Bath className="w-3.5 h-3.5" />
              <span>{property.baths}</span>
            </span>
            <span
              className="inline-flex items-center gap-1"
              title={property.garages || property.carports
                ? `${property.garages} garage${property.garages !== 1 ? 's' : ''}, ${property.carports} carport${property.carports !== 1 ? 's' : ''}`
                : 'Parking'}
            >
              <CarFront className="w-3.5 h-3.5" />
              <span>{property.garages > 0 || property.carports > 0 ? `${property.garages}G ${property.carports}C` : property.garage}</span>
            </span>
            <span className="inline-flex items-center gap-1" title="Floor area">
              <Maximize className="w-3.5 h-3.5" />
              <span>{property.sqm} m²</span>
            </span>
            {property.erfSizeSqm !== null && property.erfSizeSqm > 0 && (
              <span className="inline-flex items-center gap-1" title="Erf / land size">
                <Warehouse className="w-3.5 h-3.5" />
                <span>{property.erfSizeSqm.toLocaleString('en-ZA')} m²</span>
              </span>
            )}
          </div>
        </div>

        {/* Monthly costs */}
        {(property.monthlyLevy !== null || property.monthlyRates !== null) && (
          <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2 flex-wrap">
            <DollarSign className="w-3 h-3 shrink-0" />
            {property.monthlyLevy !== null && <span>Levy R{property.monthlyLevy!.toLocaleString('en-ZA')}</span>}
            {property.monthlyRates !== null && <span>Rates R{property.monthlyRates!.toLocaleString('en-ZA')}</span>}
            {property.monthlyUtilities !== null && <span>Utils R{property.monthlyUtilities!.toLocaleString('en-ZA')}</span>}
            <span className="font-medium text-gray-500">
              = R{((property.monthlyLevy ?? 0) + (property.monthlyRates ?? 0) + (property.monthlyUtilities ?? 0)).toLocaleString('en-ZA')}/mo
            </span>
          </div>
        )}
      </div>

      {/* Parchment footer */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: '#F2E8D5', borderTop: '1px solid rgba(26,60,40,0.1)' }}
      >
        <span
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(26,60,40,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          Listed {daysListedLabel}
        </span>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: '#1A3C28',
            cursor: 'pointer',
          }}
        >
          View Listing →
        </span>
      </div>
    </Card>
  );
}
