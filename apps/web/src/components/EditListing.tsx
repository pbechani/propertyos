'use client';

import { useRef, useState } from 'react';
import { Info, Image as ImageIcon, MapPin, Star, Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { API_BASE_URL, propertiesApi, type PropertyListing } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ─── Amenity definitions ──────────────────────────────────────────────────────

const AMENITIES = [
  { key: 'swimming_pool',         label: 'Swimming Pool' },
  { key: 'garage',                label: 'Garage' },
  { key: 'garden',                label: 'Garden' },
  { key: 'security_24h',          label: '24-Hour Security' },
  { key: 'gym',                   label: 'Gym / Fitness Centre' },
  { key: 'backup_power',          label: 'Backup Power / Generator' },
  { key: 'borehole',              label: 'Borehole / Water Tank' },
  { key: 'air_conditioning',      label: 'Air Conditioning' },
  { key: 'solar_panels',          label: 'Solar Panels' },
  { key: 'smart_home',            label: 'Smart Home' },
  { key: 'fibre_internet',        label: 'Fibre Internet' },
  { key: 'laundry',               label: 'Laundry Room' },
  { key: 'balcony',               label: 'Balcony / Patio' },
  { key: 'ensuite',               label: 'En-suite Bathrooms' },
  { key: 'staff_quarters',        label: 'Staff Quarters' },
  { key: 'pet_friendly',          label: 'Pet Friendly' },
  { key: 'gated_estate',          label: 'Gated Estate' },
  { key: 'communal_facilities',   label: 'Communal Facilities' },
  { key: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
  { key: 'ev_charging',           label: 'EV Charging' },
  { key: 'storage_room',          label: 'Storage Room' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaFile {
  file: File;
  previewUrl: string;
}

interface EditListingProps {
  listing: PropertyListing;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EditListing({ listing, onClose, onSuccess }: EditListingProps) {
  // ── Basic Info — pre-filled from existing listing ──────────────────────────
  const [title,         setTitle]         = useState(listing.title);
  const [propertyType,  setPropertyType]  = useState(listing.property_type ?? 'residential');
  const [listingType,   setListingType]   = useState(listing.listing_type ?? 'for_sale');
  const [price,         setPrice]         = useState(listing.price ?? '');
  const [currency,      setCurrency]      = useState(listing.currency ?? 'ZAR');
  const [description,   setDescription]   = useState(listing.description ?? '');
  const [bedrooms,      setBedrooms]      = useState(String(listing.bedrooms ?? ''));
  const [bathrooms,     setBathrooms]     = useState(String(listing.bathrooms ?? ''));
  const [areaSqm,       setAreaSqm]       = useState(listing.area_sqm ? String(listing.area_sqm) : '');
  const [parkingSpaces, setParkingSpaces] = useState(String(listing.parking_spaces ?? ''));
  const [status,        setStatus]        = useState(listing.status);

  // ── Media ───────────────────────────────────────────────────────────────────
  const [newMediaFiles, setNewMediaFiles] = useState<MediaFile[]>([]);

  // ── Location ────────────────────────────────────────────────────────────────
  const [addressLine1, setAddressLine1] = useState(listing.location?.address_line1 ?? '');
  const [city,         setCity]         = useState(listing.location?.city ?? '');
  const [region,       setRegion]       = useState(listing.location?.region ?? '');
  const [country,      setCountry]      = useState(listing.location?.country ?? 'ZA');
  const [postalCode,   setPostalCode]   = useState(listing.location?.postal_code ?? '');
  const [latitude,     setLatitude]     = useState(listing.location?.latitude ?? '');
  const [longitude,    setLongitude]    = useState(listing.location?.longitude ?? '');

  // ── Amenities ───────────────────────────────────────────────────────────────
  const [features, setFeatures] = useState<string[]>(listing.features ?? []);

  // ── Submission ───────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newItems: MediaFile[] = files.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setNewMediaFiles((prev) => [...prev, ...newItems]);
    e.target.value = '';
  }

  function removeNewMedia(idx: number) {
    setNewMediaFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].previewUrl);
      next.splice(idx, 1);
      return next;
    });
  }

  function toggleFeature(key: string) {
    setFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  }

  async function handleSave(publish = false) {
    setError(null);

    if (!title.trim()) {
      setError('Listing title is required.');
      return;
    }
    const numericPrice = Number(String(price).replace(/,/g, ''));
    if (!price || isNaN(numericPrice) || numericPrice <= 0) {
      setError('A valid listing price is required.');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError('You must be signed in to edit a listing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title:        title.trim(),
        description:  description.trim() || undefined,
        propertyType,
        listingType,
        price:        numericPrice,
        currency,
        status:       publish ? 'active' : status,
        bedrooms:      bedrooms      ? Number(bedrooms)      : undefined,
        bathrooms:     bathrooms     ? Number(bathrooms)     : undefined,
        areaSqm:       areaSqm       ? Number(areaSqm)       : undefined,
        parkingSpaces: parkingSpaces ? Number(parkingSpaces) : undefined,
        features:      features.length > 0 ? features : [],
        location: {
          addressLine1: addressLine1.trim() || undefined,
          city:         city.trim()         || undefined,
          region:       region.trim()       || undefined,
          country:      country             || 'ZA',
          postalCode:   postalCode.trim()   || undefined,
          latitude:     latitude  ? Number(latitude)  : undefined,
          longitude:    longitude ? Number(longitude) : undefined,
        },
      };

      await propertiesApi.update(token, listing.id, payload);

      // Upload any new media files added during editing
      if (newMediaFiles.length > 0) {
        const form = new FormData();
        newMediaFiles.forEach((m) => form.append('files', m.file));
        const mediaRes = await fetch(`${API_BASE_URL}/properties/${listing.id}/media`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body:    form,
        });
        if (!mediaRes.ok) {
          console.warn('Media upload failed:', await mediaRes.text());
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
      <Card className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold">Edit Listing</h2>
            <p className="text-sm text-gray-600 truncate max-w-lg">{listing.title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close edit modal"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <Tabs defaultValue="basic" className="p-6">
          <TabsList className="mb-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Info className="w-4 h-4" /> Basic Info
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Media
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location
            </TabsTrigger>
            <TabsTrigger value="amenities" className="flex items-center gap-2">
              <Star className="w-4 h-4" /> Amenities
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════════════ BASIC INFO ════════════════════════════ */}
          <TabsContent value="basic">
            {/* Listing Type — full-width, above the two-column grid */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LISTING TYPE <span className="text-red-500">*</span>
              </label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as 'for_sale' | 'to_rent' | 'development')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="for_sale">For Sale</option>
                <option value="to_rent">To Rent / Lease</option>
                <option value="development">Development</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-8">

              {/* Left column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">PROPERTY DETAILS</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LISTING TITLE <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Modern Villa with Sea View"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PROPERTY TYPE</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as 'residential' | 'commercial' | 'land' | 'off_plan')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="land">Land</option>
                      <option value="off_plan">Off-Plan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CURRENCY</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="ZAR">ZAR</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="NGN">NGN</option>
                      <option value="KES">KES</option>
                      <option value="GHS">GHS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LISTING PRICE <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="850000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DESCRIPTION</label>
                  <textarea
                    placeholder="Describe the property's unique selling points..."
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">SIZE & STATUS</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BEDROOMS</label>
                    <input
                      type="number" min="0" placeholder="3"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BATHROOMS</label>
                    <input
                      type="number" min="0" placeholder="2"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AREA (SQM)</label>
                    <input
                      type="number" min="0" placeholder="250"
                      value={areaSqm}
                      onChange={(e) => setAreaSqm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PARKING SPACES</label>
                    <input
                      type="number" min="0" placeholder="2"
                      value={parkingSpaces}
                      onChange={(e) => setParkingSpaces(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LISTING STATUS</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="under_offer">Under Offer</option>
                    <option value="sold">Sold</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════ MEDIA ════════════════════════════════ */}
          <TabsContent value="media">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">EXISTING MEDIA</h3>
              </div>

              {/* Existing images */}
              {listing.media && listing.media.length > 0 ? (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {listing.media.map((m) => (
                    <div key={m.id} className="relative rounded-lg overflow-hidden border border-border h-40">
                      {m.media_type === 'video' ? (
                        <video src={m.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img
                          src={m.url}
                          alt="Existing media"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            el.style.display = 'none';
                            const placeholder = el.parentElement;
                            if (placeholder && !placeholder.querySelector('.broken-img-placeholder')) {
                              const p = document.createElement('div');
                              p.className = 'broken-img-placeholder w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs';
                              p.textContent = 'Image unavailable';
                              placeholder.appendChild(p);
                            }
                          }}
                        />
                      )}
                      {m.is_primary && (
                        <span className="absolute top-2 left-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-6">No existing media uploaded.</p>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">ADD NEW MEDIA</h3>
                <span className="text-sm text-gray-500">Max 20 files · 50 MB each</span>
              </div>

              {/* htmlFor + id is the most reliable native browser pattern — no JS .click() needed */}
              <input
                ref={fileInputRef}
                id="edit-listing-media-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
                style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
                tabIndex={-1}
                onChange={handleFilesSelected}
              />

              <div className="grid grid-cols-4 gap-4">
                <label
                  htmlFor="edit-listing-media-input"
                  className="border-2 border-dashed border-blue-300 rounded-lg p-6 flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer h-40 select-none"
                >
                  <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Drop photos or videos</p>
                  <p className="text-xs text-gray-500">OR CLICK TO BROWSE</p>
                </label>

                {newMediaFiles.map((item, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border-2 border-border h-40">
                    {item.file.type.startsWith('video/') ? (
                      <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.previewUrl} alt={`New media ${idx + 1}`} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        aria-label={`Remove file ${idx + 1}`}
                        onClick={() => removeNewMedia(idx)}
                        className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {newMediaFiles.length > 0 && (
                <p className="mt-3 text-sm text-gray-500">
                  {newMediaFiles.length} new file(s) will be uploaded on save.
                </p>
              )}
            </div>
          </TabsContent>

          {/* ════════════════════════════ LOCATION ════════════════════════════ */}
          <TabsContent value="location">
            <div className="space-y-5">
              <h3 className="font-semibold text-gray-700">LOCATION DETAILS</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ADDRESS LINE 1</label>
                <input
                  type="text" placeholder="123 Main Street"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CITY</label>
                  <input
                    type="text" placeholder="Cape Town"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">REGION / PROVINCE</label>
                  <input
                    type="text" placeholder="Western Cape"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">COUNTRY</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ZA">South Africa</option>
                    <option value="NG">Nigeria</option>
                    <option value="KE">Kenya</option>
                    <option value="GH">Ghana</option>
                    <option value="ZW">Zimbabwe</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POSTAL CODE</label>
                  <input
                    type="text" placeholder="8001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t pt-5">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  GPS COORDINATES <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LATITUDE</label>
                    <input
                      type="number" step="any" placeholder="-33.9249"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LONGITUDE</label>
                    <input
                      type="number" step="any" placeholder="18.4241"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════ AMENITIES ═══════════════════════════ */}
          <TabsContent value="amenities">
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">PROPERTY FEATURES & AMENITIES</h3>
              <p className="text-sm text-gray-500 mb-5">Select all features that apply to this property.</p>
              <div className="grid grid-cols-3 gap-3">
                {AMENITIES.map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors select-none ${
                      features.includes(key)
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={features.includes(key)}
                      onChange={() => toggleFeature(key)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
              {features.length > 0 && (
                <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    {features.length} feature{features.length > 1 ? 's' : ''} selected:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {features.map((f) => (
                      <span key={f} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {AMENITIES.find((a) => a.key === f)?.label ?? f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => void handleSave(false)}
            >
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isSubmitting}
              onClick={() => void handleSave(true)}
            >
              {isSubmitting ? 'Publishing…' : 'Publish Listing'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
