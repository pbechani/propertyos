'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, MapPin, Check, Home, Building2, Leaf, HardHat, Tag, Key, Layers } from 'lucide-react';
import { API_BASE_URL, propertiesApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ─────────────────────────── Brand ───────────────────────────

const C = {
  forest: '#1A3C28',
  forestLight: '#4A7C5A',
  parchment: '#F2E8D5',
  amber: '#B89040',
  terracotta: '#C4562A',
  egreen: '#00E87A',
  muted: '#E8F0EC',
};

// ─────────────────────────── Types ───────────────────────────

interface MediaFile {
  id: string;
  file: File;
  preview: string;
}

// ─────────────────────────── Constants ───────────────────────────

const STEPS = [
  { id: 1, label: 'Type' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Media' },
  { id: 4, label: 'Location' },
  { id: 5, label: 'Publish' },
] as const;

const STEP_TITLES: Record<number, string> = {
  1: 'Listing Type',
  2: 'Property Details',
  3: 'Photos & Media',
  4: 'Location',
  5: 'Settings & Publish',
};

const STEP_SUBTITLES: Record<number, string> = {
  1: 'What kind of property are you listing?',
  2: 'Describe the property',
  3: 'Add photos to attract buyers',
  4: 'Where is the property?',
  5: 'Configure options and go live',
};

const AMENITIES = [
  { key: 'swimming_pool', label: 'Swimming Pool' },
  { key: 'garage', label: 'Garage' },
  { key: 'garden', label: 'Garden' },
  { key: 'security_24h', label: '24-Hour Security' },
  { key: 'gym', label: 'Gym / Fitness Centre' },
  { key: 'backup_power', label: 'Backup Power / Generator' },
  { key: 'borehole', label: 'Borehole / Water Tank' },
  { key: 'air_conditioning', label: 'Air Conditioning' },
  { key: 'solar_panels', label: 'Solar Panels' },
  { key: 'smart_home', label: 'Smart Home' },
  { key: 'fibre_internet', label: 'Fibre Internet' },
  { key: 'laundry', label: 'Laundry Room' },
  { key: 'balcony', label: 'Balcony / Patio' },
  { key: 'ensuite', label: 'En-suite Bathrooms' },
  { key: 'staff_quarters', label: 'Staff Quarters' },
  { key: 'pet_friendly', label: 'Pet Friendly' },
  { key: 'gated_estate', label: 'Gated Estate' },
  { key: 'communal_facilities', label: 'Communal Facilities' },
  { key: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
  { key: 'ev_charging', label: 'EV Charging' },
  { key: 'storage_room', label: 'Storage Room' },
];

const PROPERTY_TYPES = [
  { key: 'residential', label: 'Residential', Icon: Home },
  { key: 'commercial', label: 'Commercial', Icon: Building2 },
  { key: 'land', label: 'Land', Icon: Leaf },
  { key: 'off_plan', label: 'Off-Plan', Icon: HardHat },
];

const LISTING_TYPES = [
  { key: 'for_sale', label: 'For Sale', Icon: Tag },
  { key: 'to_rent', label: 'To Rent', Icon: Key },
  { key: 'development', label: 'Development', Icon: Layers },
];

const CURRENCIES = ['ZAR', 'USD', 'EUR', 'GBP', 'KES', 'NGN', 'GHS'];

// ─────────────────────────── Shared Input Style ───────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1.5px solid #D1D5DB',
  fontSize: 14,
  outline: 'none',
  background: '#fff',
  color: '#111',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

// ─────────────────────────── Component ───────────────────────────

export function NewListingWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 1 ──
  const [propertyType, setPropertyType] = useState('residential');
  const [listingType, setListingType] = useState('for_sale');
  const [listingStatus, setListingStatus] = useState('draft');

  // ── Step 2 ──
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [mlsNumber, setMlsNumber] = useState('');
  const [description, setDescription] = useState('');

  // ── Step 3 ──
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // ── Step 4 ──
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('ZA');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // ── Step 5 ──
  const [isFeatured, setIsFeatured] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);

  // ── Submission ──
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────── Helpers ───────────────────

  function canProceed(): boolean {
    if (step === 2) {
      const numericPrice = Number(price.replace(/,/g, ''));
      return title.trim().length > 0 && numericPrice > 0;
    }
    return true;
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next: MediaFile[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setMediaFiles((prev) => [...prev, ...next]);
    e.target.value = '';
  }

  function removeMedia(id: string) {
    setMediaFiles((prev) => {
      const removed = prev.find((m) => m.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((m) => m.id !== id);
    });
  }

  function toggleFeature(key: string) {
    setFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function goNext() {
    setError(null);
    if (!canProceed()) {
      setError('Please fill in the required fields before continuing.');
      return;
    }
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    if (step > 1) setStep((s) => s - 1);
    else router.push('/app/my-listings');
  }

  // ─────────────────── Finish / Submit ───────────────────

  async function handleFinish(publish: boolean) {
    setError(null);
    const numericPrice = Number(price.replace(/,/g, ''));
    if (!title.trim()) { setError('Listing title is required.'); return; }
    if (!numericPrice || numericPrice <= 0) { setError('A valid price is required.'); return; }

    const token = getAccessToken();
    if (!token) { setError('You must be signed in.'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        propertyType,
        listingType,
        price: numericPrice,
        currency,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        areaSqm: areaSqm ? Number(areaSqm) : undefined,
        parkingSpaces: parkingSpaces ? Number(parkingSpaces) : undefined,
        features: features.length > 0 ? features : undefined,
        location: {
          addressLine1: addressLine1.trim() || undefined,
          city: city.trim() || undefined,
          region: region.trim() || undefined,
          country: country || 'ZA',
          postalCode: postalCode.trim() || undefined,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
        },
      };

      const created = await propertiesApi.create(token, payload);

      if (mediaFiles.length > 0) {
        const form = new FormData();
        mediaFiles.forEach((m) => form.append('files', m.file));
        const mediaRes = await fetch(`${API_BASE_URL}/properties/${created.id}/media`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!mediaRes.ok) {
          console.warn('Media upload failed:', await mediaRes.text());
        }
      }

      if (publish) {
        await propertiesApi.update(token, created.id, { status: 'active' });
      }

      router.push('/app/my-listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─────────────────── Render ───────────────────

  return (
    <div style={{ minHeight: '100vh', background: C.parchment, display: 'flex', flexDirection: 'column' }}>
      {/* ── Nav Bar ── */}
      <div
        style={{
          background: C.forest,
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {/* Left: logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: C.forestLight,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 15, fontWeight: 700, color: C.egreen }}>B</span>
          </div>
          <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color: C.parchment, letterSpacing: '-0.2px' }}>
            BuildTrust
          </span>
        </div>

        {/* Right: back link */}
        <button
          onClick={() => router.push('/app/my-listings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,.1)',
            border: 'none',
            borderRadius: 8,
            padding: '7px 14px',
            color: C.parchment,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} />
          My Listings
        </button>
      </div>

      {/* ── Progress Strip ── */}
      <div style={{ background: C.forest, paddingBottom: 20, paddingTop: 4 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
          {/* Label row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            {STEPS.map((s) => (
              <span
                key={s.id}
                style={{
                  fontSize: 11,
                  fontWeight: step >= s.id ? 700 : 400,
                  color: step === s.id ? C.egreen : step > s.id ? 'rgba(242,232,213,.9)' : 'rgba(242,232,213,.4)',
                  width: `${100 / STEPS.length}%`,
                  textAlign: 'center',
                }}
              >
                {s.label}
              </span>
            ))}
          </div>
          {/* Bar row */}
          <div style={{ display: 'flex', gap: 4 }}>
            {STEPS.map((s) => (
              <div
                key={s.id}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: step > s.id ? C.egreen : step === s.id ? 'rgba(0,232,122,.5)' : 'rgba(255,255,255,.15)',
                  transition: 'background .2s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Card ── */}
      <div style={{ flex: 1, maxWidth: 700, width: '100%', margin: '0 auto', padding: '24px 24px 120px' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 2px 20px rgba(0,0,0,.07)',
          }}
        >
          {/* Step header */}
          <div style={{ background: C.forest, padding: '22px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  background: C.egreen,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.forest,
                  flexShrink: 0,
                }}
              >
                {step}
              </span>
              <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: C.parchment, margin: 0 }}>
                {STEP_TITLES[step]}
              </h2>
            </div>
            <p style={{ color: 'rgba(242,232,213,.65)', fontSize: 13, margin: 0, paddingLeft: 34 }}>
              {STEP_SUBTITLES[step]}
            </p>
          </div>

          {/* Step body */}
          <div style={{ padding: '28px 28px 24px' }}>
            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 20,
                  fontSize: 14,
                  color: '#991B1B',
                }}
              >
                {error}
              </div>
            )}

            {step === 1 && (
              <StepType
                propertyType={propertyType}
                setPropertyType={setPropertyType}
                listingType={listingType}
                setListingType={setListingType}
                listingStatus={listingStatus}
                setListingStatus={setListingStatus}
              />
            )}

            {step === 2 && (
              <StepDetails
                title={title} setTitle={setTitle}
                price={price} setPrice={setPrice}
                currency={currency} setCurrency={setCurrency}
                bedrooms={bedrooms} setBedrooms={setBedrooms}
                bathrooms={bathrooms} setBathrooms={setBathrooms}
                areaSqm={areaSqm} setAreaSqm={setAreaSqm}
                parkingSpaces={parkingSpaces} setParkingSpaces={setParkingSpaces}
                yearBuilt={yearBuilt} setYearBuilt={setYearBuilt}
                mlsNumber={mlsNumber} setMlsNumber={setMlsNumber}
                description={description} setDescription={setDescription}
              />
            )}

            {step === 3 && (
              <StepMedia
                fileInputRef={fileInputRef}
                mediaFiles={mediaFiles}
                onFilesSelected={handleFilesSelected}
                onRemove={removeMedia}
              />
            )}

            {step === 4 && (
              <StepLocation
                addressLine1={addressLine1} setAddressLine1={setAddressLine1}
                city={city} setCity={setCity}
                region={region} setRegion={setRegion}
                country={country} setCountry={setCountry}
                postalCode={postalCode} setPostalCode={setPostalCode}
                latitude={latitude} setLatitude={setLatitude}
                longitude={longitude} setLongitude={setLongitude}
              />
            )}

            {step === 5 && (
              <StepPublish
                isFeatured={isFeatured} setIsFeatured={setIsFeatured}
                features={features} toggleFeature={toggleFeature}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Fixed Footer ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #E5E7EB',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
          boxShadow: '0 -2px 12px rgba(0,0,0,.06)',
        }}
      >
        <button
          onClick={goBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: '1.5px solid #D1D5DB',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} />
          Back
        </button>

        {step < 5 ? (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: canProceed() ? C.forest : '#9CA3AF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: canProceed() ? 'pointer' : 'not-allowed',
              transition: 'background .15s',
            }}
          >
            Next: {STEPS[step].label}
            <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => void handleFinish(false)}
              disabled={isSubmitting}
              style={{
                background: 'transparent',
                border: `1.5px solid ${C.forest}`,
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: C.forest,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              Save as Draft
            </button>
            <button
              onClick={() => void handleFinish(true)}
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? '#9CA3AF' : C.forest,
                border: 'none',
                borderRadius: 8,
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background .15s',
              }}
            >
              {isSubmitting ? (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(255,255,255,.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              ) : (
                <Check size={15} />
              )}
              Publish Listing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Step 1 — Listing Type
// ═══════════════════════════════════════════

interface StepTypeProps {
  propertyType: string; setPropertyType: (v: string) => void;
  listingType: string; setListingType: (v: string) => void;
  listingStatus: string; setListingStatus: (v: string) => void;
}

function StepType({ propertyType, setPropertyType, listingType, setListingType, listingStatus, setListingStatus }: StepTypeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Property Type — tile grid */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Property Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PROPERTY_TYPES.map(({ key, label, Icon }) => {
            const active = propertyType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPropertyType(key)}
                style={{
                  padding: '18px 16px',
                  borderRadius: 10,
                  border: `2px solid ${active ? C.forest : '#E5E7EB'}`,
                  background: active ? C.muted : '#FAFAFA',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all .15s',
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: active ? C.forest : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background .15s',
                  }}
                >
                  <Icon size={18} color={active ? C.egreen : '#6B7280'} />
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: active ? C.forest : '#374151' }}>{label}</div>
                </div>
                {active && (
                  <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: C.egreen, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color={C.forest} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Listing Type — 3 button row */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Listing Purpose</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {LISTING_TYPES.map(({ key, label, Icon }) => {
            const active = listingType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setListingType(key)}
                style={{
                  padding: '14px 10px',
                  borderRadius: 10,
                  border: `2px solid ${active ? C.forest : '#E5E7EB'}`,
                  background: active ? C.muted : '#FAFAFA',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all .15s',
                }}
              >
                <Icon size={20} color={active ? C.forest : '#9CA3AF'} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.forest : '#6B7280' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Listing Status */}
      <div>
        <label style={labelStyle}>Initial Status</label>
        <select value={listingStatus} onChange={(e) => setListingStatus(e.target.value)} style={selectStyle}>
          <option value="draft">Draft — hidden from marketplace</option>
          <option value="active">Active — live on marketplace</option>
          <option value="pending">Pending — awaiting review</option>
        </select>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Step 2 — Property Details
// ═══════════════════════════════════════════

interface StepDetailsProps {
  title: string; setTitle: (v: string) => void;
  price: string; setPrice: (v: string) => void;
  currency: string; setCurrency: (v: string) => void;
  bedrooms: string; setBedrooms: (v: string) => void;
  bathrooms: string; setBathrooms: (v: string) => void;
  areaSqm: string; setAreaSqm: (v: string) => void;
  parkingSpaces: string; setParkingSpaces: (v: string) => void;
  yearBuilt: string; setYearBuilt: (v: string) => void;
  mlsNumber: string; setMlsNumber: (v: string) => void;
  description: string; setDescription: (v: string) => void;
}

function StepDetails({
  title, setTitle,
  price, setPrice,
  currency, setCurrency,
  bedrooms, setBedrooms,
  bathrooms, setBathrooms,
  areaSqm, setAreaSqm,
  parkingSpaces, setParkingSpaces,
  yearBuilt, setYearBuilt,
  mlsNumber, setMlsNumber,
  description, setDescription,
}: StepDetailsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title — full width */}
      <div>
        <label style={labelStyle}>
          Listing Title <span style={{ color: C.terracotta }}>*</span>
        </label>
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g. Spacious 3-bed family home in Sandton"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Price + Currency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
        <div>
          <label style={labelStyle}>
            Asking Price <span style={{ color: C.terracotta }}>*</span>
          </label>
          <input
            style={inputStyle}
            type="text"
            placeholder="2,500,000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 90 }}>
          <label style={labelStyle}>Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...selectStyle, minWidth: 90 }}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Bedrooms / Bathrooms / Area / Parking — 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>Bedrooms</label>
          <input style={inputStyle} type="number" min={0} placeholder="3" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Bathrooms</label>
          <input style={inputStyle} type="number" min={0} step={0.5} placeholder="2" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Floor Area (m²)</label>
          <input style={inputStyle} type="number" min={0} placeholder="180" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Parking Spaces</label>
          <input style={inputStyle} type="number" min={0} placeholder="2" value={parkingSpaces} onChange={(e) => setParkingSpaces(e.target.value)} />
        </div>
      </div>

      {/* Year Built / MLS — 2 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>Year Built</label>
          <input style={inputStyle} type="number" min={1800} max={new Date().getFullYear()} placeholder="2018" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>MLS / Reference No.</label>
          <input style={inputStyle} type="text" placeholder="MLS-00123" value={mlsNumber} onChange={(e) => setMlsNumber(e.target.value)} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
          placeholder="Describe the property — features, condition, unique selling points…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Step 3 — Media
// ═══════════════════════════════════════════

interface StepMediaProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  mediaFiles: MediaFile[];
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
}

function StepMedia({ fileInputRef, mediaFiles, onFilesSelected, onRemove }: StepMediaProps) {
  return (
    <div>
      {/* Hidden input */}
      <input
        ref={fileInputRef}
        id="wizard-media-input"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
        style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0 }}
        tabIndex={-1}
        onChange={onFilesSelected}
      />

      {/* Drop / trigger area */}
      <label
        htmlFor="wizard-media-input"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          border: `2px dashed #D1D5DB`,
          borderRadius: 12,
          padding: '36px 24px',
          cursor: 'pointer',
          background: '#FAFAFA',
          marginBottom: mediaFiles.length > 0 ? 20 : 0,
          transition: 'border-color .15s, background .15s',
        }}
        onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLLabelElement).style.borderColor = C.forest; }}
        onDragLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = '#D1D5DB'; }}
        onDrop={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLLabelElement).style.borderColor = '#D1D5DB';
          const dt = e.dataTransfer;
          if (dt && fileInputRef.current) {
            const event = { target: { files: dt.files, value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>;
            onFilesSelected(event);
          }
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: C.muted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Upload size={24} color={C.forest} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.forest, marginBottom: 4 }}>
            Click to upload photos
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>or drag and drop</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
            JPEG, PNG, WEBP, HEIC, MP4 · Max 20 MB each
          </div>
        </div>
      </label>

      {/* Preview grid */}
      {mediaFiles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {mediaFiles.map((m) => (
            <div
              key={m.id}
              style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#F3F4F6' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,.55)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={12} color="#fff" />
              </button>
            </div>
          ))}
        </div>
      )}

      {mediaFiles.length > 0 && (
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
          {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Step 4 — Location
// ═══════════════════════════════════════════

interface StepLocationProps {
  addressLine1: string; setAddressLine1: (v: string) => void;
  city: string; setCity: (v: string) => void;
  region: string; setRegion: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  postalCode: string; setPostalCode: (v: string) => void;
  latitude: string; setLatitude: (v: string) => void;
  longitude: string; setLongitude: (v: string) => void;
}

function StepLocation({ addressLine1, setAddressLine1, city, setCity, region, setRegion, country, setCountry, postalCode, setPostalCode, latitude, setLatitude, longitude, setLongitude }: StepLocationProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Street address */}
      <div>
        <label style={labelStyle}>
          <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Street Address
        </label>
        <input style={inputStyle} type="text" placeholder="12 Acacia Avenue" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
      </div>

      {/* City / Region */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>City</label>
          <input style={inputStyle} type="text" placeholder="Johannesburg" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Province / Region</label>
          <input style={inputStyle} type="text" placeholder="Gauteng" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
      </div>

      {/* Country / Postal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={selectStyle}>
            <option value="ZA">South Africa</option>
            <option value="KE">Kenya</option>
            <option value="NG">Nigeria</option>
            <option value="GH">Ghana</option>
            <option value="ZW">Zimbabwe</option>
            <option value="ZM">Zambia</option>
            <option value="MZ">Mozambique</option>
            <option value="UG">Uganda</option>
            <option value="TZ">Tanzania</option>
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
            <option value="AU">Australia</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Postal Code</label>
          <input style={inputStyle} type="text" placeholder="2196" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </div>
      </div>

      {/* Coordinates — optional */}
      <div>
        <label style={labelStyle}>GPS Coordinates <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <input style={inputStyle} type="number" step="any" placeholder="Latitude e.g. -26.2041" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          <input style={inputStyle} type="number" step="any" placeholder="Longitude e.g. 28.0473" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Step 5 — Publish
// ═══════════════════════════════════════════

interface StepPublishProps {
  isFeatured: boolean; setIsFeatured: (v: boolean) => void;
  features: string[]; toggleFeature: (key: string) => void;
}

function StepPublish({ isFeatured, setIsFeatured, features, toggleFeature }: StepPublishProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Toggles */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Listing Options</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
          <ToggleRow
            label="Featured Listing"
            description="Promoted placement in search results"
            value={isFeatured}
            onChange={setIsFeatured}
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Amenities</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {AMENITIES.map(({ key, label }) => {
            const active = features.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleFeature(key)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: `1.5px solid ${active ? C.forest : '#E5E7EB'}`,
                  background: active ? C.muted : '#FAFAFA',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  transition: 'all .12s',
                  textAlign: 'left',
                }}
              >
                {active ? (
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: C.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={10} color={C.egreen} strokeWidth={3} />
                  </span>
                ) : (
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid #D1D5DB', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? C.forest : '#6B7280', lineHeight: 1.3 }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {features.length > 0 && (
          <p style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF' }}>
            {features.length} amenit{features.length !== 1 ? 'ies' : 'y'} selected
          </p>
        )}
      </div>

      {/* Publish notice */}
      <div
        style={{
          background: C.muted,
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <Check size={16} color={C.forest} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.forest, marginBottom: 2 }}>Ready to go</div>
          <div style={{ fontSize: 12, color: C.forestLight, lineHeight: 1.5 }}>
            Click <strong>Publish Listing</strong> to make it live, or <strong>Save as Draft</strong> to come back later.
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Toggle Row (no Radix dependency)
// ═══════════════════════════════════════════

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: '#fff',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          background: value ? C.forest : '#D1D5DB',
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
          transition: 'background .15s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: value ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: value ? C.egreen : '#fff',
            transition: 'left .15s, background .15s',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          }}
        />
      </button>
    </div>
  );
}
