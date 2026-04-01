'use client';

import {
  FileText,
  Home,
  MapPin,
  Layers,
  Tag,
  CheckCircle2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Bed,
  Bath,
  Car,
  Maximize,
  Building2,
  LayoutGrid,
  DollarSign,
  Receipt,
  Zap,
  Shield,
  Hash,
  CalendarCheck,
  RefreshCw,
  XCircle,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '@/lib/formatters';
import type { PropertyListing } from '@/lib/api-client';

interface ListingDetailsProps {
  property: PropertyListing;
}

// ─── Tiny reusable building blocks ───────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string | number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-600 shrink-0" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
        </div>
        {badge !== undefined && (
          <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** A compact icon + value + label tile for grids */
function SpecTile({ icon: Icon, value, label, color = 'text-gray-400' }: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-1 text-center">
      <Icon className={`w-5 h-5 shrink-0 ${color}`} />
      <span className="text-base font-bold text-gray-900 leading-none">{value}</span>
      <span className="text-[11px] text-gray-500 leading-tight">{label}</span>
    </div>
  );
}

/** Simple two-column label/value row for sparse metadata */
function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '' || value === '—') return null;
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right ml-4">{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ListingDetails({ property }: ListingDetailsProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = property.media?.filter((m) => m.media_type === 'image' || m.media_type.startsWith('image')) ?? [];

  const fmt = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Key spec tiles (suggestion 1 + 4) ──────────────────────────────────────
  const specTiles: { icon: React.ElementType; value: string | number; label: string; color: string }[] = [
    property.bedrooms != null     && { icon: Bed,       value: property.bedrooms,                                                   label: 'Beds',       color: 'text-blue-500' },
    property.bathrooms != null    && { icon: Bath,      value: property.bathrooms,                                                  label: 'Baths',      color: 'text-cyan-500' },
    property.area_sqm             && { icon: Maximize,  value: `${Number(property.area_sqm).toLocaleString()}`,                     label: 'Total m²',   color: 'text-violet-500' },
    property.floor_area_sqm       && { icon: LayoutGrid,value: `${Number(property.floor_area_sqm).toLocaleString()}`,               label: 'Floor m²',   color: 'text-indigo-400' },
    property.erf_size_sqm         && { icon: Maximize,  value: `${Number(property.erf_size_sqm).toLocaleString()}`,                 label: 'Erf m²',     color: 'text-purple-400' },
    property.parking_spaces != null && { icon: Car,     value: property.parking_spaces,                                             label: 'Parking',    color: 'text-amber-500' },
    property.garages != null      && { icon: Building2, value: property.garages,                                                    label: 'Garages',    color: 'text-orange-400' },
    property.carports != null     && { icon: Car,       value: property.carports,                                                   label: 'Carports',   color: 'text-yellow-500' },
  ].filter(Boolean) as { icon: React.ElementType; value: string | number; label: string; color: string }[];

  // ── Property meta rows ──────────────────────────────────────────────────────
  const propertyMeta = [
    { label: 'Property Type',    value: fmt(property.property_type) },
    { label: 'Subtype',          value: property.property_subtype ? fmt(property.property_subtype) : null },
    { label: 'Listing Type',     value: property.listing_type ? fmt(property.listing_type) : null },
    { label: 'Status',           value: fmt(property.status) },
  ];

  // ── Monthly cost tiles ──────────────────────────────────────────────────────
  const monthlyCosts = [
    { icon: Receipt, label: 'Levy',      value: property.monthly_levy      ? formatMoney(property.monthly_levy,      property.currency) : null, color: 'text-blue-500' },
    { icon: Home,    label: 'Rates',     value: property.monthly_rates     ? formatMoney(property.monthly_rates,     property.currency) : null, color: 'text-green-500' },
    { icon: Zap,     label: 'Utilities', value: property.monthly_utilities ? formatMoney(property.monthly_utilities, property.currency) : null, color: 'text-amber-500' },
  ].filter((c) => c.value !== null) as { icon: React.ElementType; label: string; value: string; color: string }[];

  // ── Listing status config ───────────────────────────────────────────────────
  const verStatus = property.verification_status ?? 'unverified';
  const verConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    verified:   { icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50  border-green-200',  label: 'Verified' },
    pending:    { icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-200',  label: 'Pending Verification' },
    rejected:   { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    label: 'Rejected' },
    unverified: { icon: Shield,       color: 'text-gray-500',   bg: 'bg-gray-50   border-gray-200',   label: 'Unverified' },
  };
  const ver = verConfig[verStatus] ?? verConfig.unverified;
  const VerIcon = ver.icon;

  return (
    <div className="space-y-4">

      {/* ── 1. Photo gallery ──────────────────────────────────────────────── */}
      {photos.length > 0 && (
        <SectionCard title="Photos" icon={ImageIcon} badge={photos.length}>
          <div className="relative rounded-xl overflow-hidden bg-gray-100 h-64 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[photoIndex]?.url} alt={`Photo ${photoIndex + 1}`} className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 right-3 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
                  {photoIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setPhotoIndex(idx)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === photoIndex ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.thumbnail_url ?? photo.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── 2. Description ────────────────────────────────────────────────── */}
      {property.description && (
        <SectionCard title="Description" icon={FileText}>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{property.description}</p>
        </SectionCard>
      )}

      {/* ── 3. Key specs grid (suggestion 1 + 4) ─────────────────────────── */}
      {specTiles.length > 0 && (
        <SectionCard title="Property Details" icon={Home}>
          {/* Icon tile grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {specTiles.map((tile) => (
              <SpecTile key={tile.label} icon={tile.icon} value={tile.value} label={tile.label} color={tile.color} />
            ))}
          </div>
          {/* Type/status meta rows */}
          <div className="border-t border-gray-100 pt-3">
            {propertyMeta.map(({ label, value }) =>
              value ? <MetaRow key={label} label={label} value={value} /> : null,
            )}
          </div>
        </SectionCard>
      )}

      {/* ── 4. Financial highlights (suggestion 2) ───────────────────────── */}
      <SectionCard title="Financial Details" icon={DollarSign}>
        {/* Asking price hero */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl px-5 py-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">Asking Price</div>
            <div className="text-2xl font-bold text-white">{formatMoney(property.price, property.currency)}</div>
          </div>
          <DollarSign className="w-8 h-8 text-white/30" />
        </div>
        {/* Monthly cost tiles */}
        {monthlyCosts.length > 0 && (
          <div className={`grid gap-2 mb-4 grid-cols-${Math.min(monthlyCosts.length, 3)}`}>
            {monthlyCosts.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                <div className="text-sm font-bold text-gray-900 leading-none">{value}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{label}/mo</div>
              </div>
            ))}
          </div>
        )}
        {/* Sparse meta */}
        {property.title_type && <MetaRow label="Title Type" value={fmt(property.title_type)} />}
        {property.listing_reference && <MetaRow label="Listing Ref" value={property.listing_reference} />}
      </SectionCard>

      {/* ── 5. Location (suggestion 3) ───────────────────────────────────── */}
      <SectionCard title="Location" icon={MapPin}>
        {/* Full address headline */}
        {property.location?.address_line1 && (
          <p className="text-sm font-semibold text-gray-900 mb-3">{property.location.address_line1}</p>
        )}
        {/* City / Region / Postal mini-grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'City',     value: property.location?.city },
            { label: 'Region',   value: property.location?.region },
            { label: 'Postcode', value: property.location?.postal_code },
          ].map(({ label, value }) =>
            value ? (
              <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                <div className="text-sm font-semibold text-gray-800 truncate">{value}</div>
              </div>
            ) : null,
          )}
        </div>
        {/* Map placeholder */}
        <div className="relative h-36 bg-gray-100 rounded-xl overflow-hidden flex flex-col items-center justify-center gap-2 border border-gray-200">
          <MapPin className="w-6 h-6 text-gray-300" />
          <span className="text-xs text-gray-400">Map preview</span>
          {property.location?.latitude && property.location?.longitude && (
            <a
              href={`https://www.google.com/maps?q=${property.location.latitude},${property.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 text-[11px] text-blue-600 font-medium hover:underline"
            >
              View on map →
            </a>
          )}
        </div>
        {property.location?.country && (
          <div className="mt-3">
            <MetaRow label="Country" value={property.location.country} />
          </div>
        )}
      </SectionCard>

      {/* ── 6. Amenities (suggestion 5) ──────────────────────────────────── */}
      {property.features && property.features.length > 0 && (
        <SectionCard title="Amenities & Features" icon={Layers} badge={property.features.length}>
          <div className="grid grid-cols-3 gap-2">
            {property.features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-l-2 border-blue-500 rounded-r-lg"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-xs font-medium text-blue-800 leading-tight truncate" title={feature}>{feature}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── 7. Listing status (suggestion 6) ─────────────────────────────── */}
      <SectionCard title="Listing Status" icon={Tag}>
        {/* Status badge banner */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border mb-4 ${ver.bg}`}>
          <VerIcon className={`w-7 h-7 ${ver.color} shrink-0`} />
          <div>
            <div className={`text-sm font-bold ${ver.color}`}>{ver.label}</div>
            {property.verified_at && (
              <div className="text-xs text-gray-500 mt-0.5">
                Verified {new Date(property.verified_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
          {property.listing_reference && (
            <span className="ml-auto text-[11px] font-semibold bg-white/80 text-gray-600 px-2 py-1 rounded-lg border border-gray-200">
              <Hash className="w-3 h-3 inline mr-0.5" />{property.listing_reference}
            </span>
          )}
        </div>
        {/* Date micro-grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 flex items-start gap-2">
            <CalendarCheck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Listed On</div>
              <div className="text-sm font-semibold text-gray-800">
                {new Date(property.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Last Updated</div>
              <div className="text-sm font-semibold text-gray-800">
                {new Date(property.updated_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

    </div>
  );
}
