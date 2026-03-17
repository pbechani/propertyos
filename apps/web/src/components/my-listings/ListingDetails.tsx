'use client';

import {
  FileText,
  Home,
  MapPin,
  DollarSign,
  Layers,
  Car,
  Ruler,
  Tag,
  CheckCircle2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '@/lib/formatters';
import type { PropertyListing } from '@/lib/api-client';

interface ListingDetailsProps {
  property: PropertyListing;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '' || value === '—') return null;
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-44">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
        <Icon className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export function ListingDetails({ property }: ListingDetailsProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = property.media?.filter((m) => m.media_type === 'image' || m.media_type.startsWith('image')) ?? [];

  const formatLabel = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const financialRows = [
    { label: 'Asking Price', value: formatMoney(property.price, property.currency) },
    { label: 'Monthly Levy', value: property.monthly_levy ? formatMoney(property.monthly_levy, property.currency) : null },
    { label: 'Monthly Rates', value: property.monthly_rates ? formatMoney(property.monthly_rates, property.currency) : null },
    { label: 'Monthly Utilities', value: property.monthly_utilities ? formatMoney(property.monthly_utilities, property.currency) : null },
    { label: 'Title Type', value: property.title_type ? formatLabel(property.title_type) : null },
    { label: 'Listing Reference', value: property.listing_reference },
  ];

  const propertyRows = [
    { label: 'Property Type', value: formatLabel(property.property_type) },
    { label: 'Property Subtype', value: property.property_subtype ? formatLabel(property.property_subtype) : null },
    { label: 'Listing Type', value: property.listing_type ? formatLabel(property.listing_type) : null },
    { label: 'Status', value: formatLabel(property.status) },
    { label: 'Bedrooms', value: property.bedrooms != null ? String(property.bedrooms) : null },
    { label: 'Bathrooms', value: property.bathrooms != null ? String(property.bathrooms) : null },
    { label: 'Parking Spaces', value: property.parking_spaces != null ? String(property.parking_spaces) : null },
    { label: 'Garages', value: property.garages != null ? String(property.garages) : null },
    { label: 'Carports', value: property.carports != null ? String(property.carports) : null },
    { label: 'Floor Area', value: property.floor_area_sqm ? `${Number(property.floor_area_sqm).toLocaleString()} m²` : null },
    { label: 'Erf Size', value: property.erf_size_sqm ? `${Number(property.erf_size_sqm).toLocaleString()} m²` : null },
    { label: 'Total Area', value: property.area_sqm ? `${Number(property.area_sqm).toLocaleString()} m²` : null },
  ];

  const locationRows = [
    { label: 'Address', value: property.location?.address_line1 },
    { label: 'City', value: property.location?.city },
    { label: 'Region / Province', value: property.location?.region },
    { label: 'Postal Code', value: property.location?.postal_code },
    { label: 'Country', value: property.location?.country },
    {
      label: 'Coordinates',
      value:
        property.location?.latitude && property.location?.longitude
          ? `${property.location.latitude}, ${property.location.longitude}`
          : null,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Photo Gallery */}
      {photos.length > 0 && (
        <Section title="Photos" icon={ImageIcon}>
          <div className="py-4">
            <div className="relative rounded-lg overflow-hidden bg-gray-100 h-64 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[photoIndex]?.url}
                alt={`Photo ${photoIndex + 1}`}
                className="w-full h-full object-cover"
              />
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
          </div>
        </Section>
      )}

      {/* Description */}
      {property.description && (
        <Section title="Description" icon={FileText}>
          <p className="text-sm text-gray-700 leading-relaxed py-4 whitespace-pre-wrap">
            {property.description}
          </p>
        </Section>
      )}

      {/* Property Details */}
      <Section title="Property Details" icon={Home}>
        <div>
          {propertyRows.map(({ label, value }) =>
            value ? <DetailRow key={label} label={label} value={value} /> : null,
          )}
        </div>
      </Section>

      {/* Financial Details */}
      <Section title="Financial Details" icon={DollarSign}>
        <div>
          {financialRows.map(({ label, value }) =>
            value ? <DetailRow key={label} label={label} value={value} /> : null,
          )}
        </div>
      </Section>

      {/* Location */}
      <Section title="Location" icon={MapPin}>
        <div>
          {locationRows.map(({ label, value }) =>
            value ? <DetailRow key={label} label={label} value={value} /> : null,
          )}
        </div>
      </Section>

      {/* Amenities / Features */}
      {property.features && property.features.length > 0 && (
        <Section title="Amenities & Features" icon={Layers}>
          <div className="py-4 flex flex-wrap gap-2">
            {property.features.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {feature}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Parking */}
      {(property.parking_spaces || property.garages || property.carports) && (
        <Section title="Parking" icon={Car}>
          <div>
            <DetailRow label="Parking Spaces" value={property.parking_spaces != null ? String(property.parking_spaces) : null} />
            <DetailRow label="Garages" value={property.garages != null ? String(property.garages) : null} />
            <DetailRow label="Carports" value={property.carports != null ? String(property.carports) : null} />
          </div>
        </Section>
      )}

      {/* Sizes */}
      {(property.area_sqm || property.floor_area_sqm || property.erf_size_sqm) && (
        <Section title="Size Details" icon={Ruler}>
          <div>
            <DetailRow label="Total Area" value={property.area_sqm ? `${Number(property.area_sqm).toLocaleString()} m²` : null} />
            <DetailRow label="Floor Area" value={property.floor_area_sqm ? `${Number(property.floor_area_sqm).toLocaleString()} m²` : null} />
            <DetailRow label="Erf Size" value={property.erf_size_sqm ? `${Number(property.erf_size_sqm).toLocaleString()} m²` : null} />
          </div>
        </Section>
      )}

      {/* Verification */}
      <Section title="Listing Status" icon={Tag}>
        <div>
          <DetailRow label="Verification Status" value={formatLabel(property.verification_status)} />
          <DetailRow
            label="Verified On"
            value={
              property.verified_at
                ? new Date(property.verified_at).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : null
            }
          />
          <DetailRow
            label="Listed On"
            value={new Date(property.created_at).toLocaleDateString('en-ZA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
          <DetailRow
            label="Last Updated"
            value={new Date(property.updated_at).toLocaleDateString('en-ZA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
        </div>
      </Section>
    </div>
  );
}
