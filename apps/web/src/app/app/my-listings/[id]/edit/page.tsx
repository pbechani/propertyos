'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  X,
  Plus,
  Home,
  DollarSign,
  MapPin,
  FileText,
  Image as ImageIcon,
  Settings,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Building2,
  Trash2,
  Upload,
  Star,
  Video,
  ArrowLeft,
} from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import { propertiesApi, type PropertyListing, type PropertyStatus } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ─── Types ─────────────────────────────────────────────────────────────────

type Section = 'core' | 'location' | 'pricing' | 'details' | 'description' | 'media' | 'features' | 'settings';

interface FormState {
  // Core
  property_type: PropertyListing['property_type'];
  property_subtype: string;
  listing_type: 'for_sale' | 'to_rent' | 'development' | '';
  listing_reference: string;
  title_type: string;
  status: PropertyStatus;
  // Location
  address_line1: string;
  suburb: string;
  city: string;
  region: string;
  country: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  // Pricing
  price: string;
  currency: string;
  monthly_levy: string;
  monthly_rates: string;
  monthly_utilities: string;
  // Details
  bedrooms: string;
  bathrooms: string;
  garages: string;
  carports: string;
  parking_spaces: string;
  floor_area_sqm: string;
  erf_size_sqm: string;
  area_sqm: string;
  year_built: string;
  // Description
  description: string;
  // Features
  features: string[];
  // Settings
  is_published: boolean;
  is_featured: boolean;
}

function toForm(p: PropertyListing): FormState {
  return {
    property_type: p.property_type,
    property_subtype: p.property_subtype ?? '',
    listing_type: (p.listing_type ?? '') as FormState['listing_type'],
    listing_reference: p.listing_reference ?? '',
    title_type: p.title_type ?? '',
    status: p.status,
    address_line1: p.location?.address_line1 ?? '',
    suburb: '',
    city: p.location?.city ?? '',
    region: p.location?.region ?? '',
    country: p.location?.country ?? 'South Africa',
    postal_code: p.location?.postal_code ?? '',
    latitude: p.location?.latitude ?? '',
    longitude: p.location?.longitude ?? '',
    price: p.price ?? '',
    currency: p.currency ?? 'ZAR',
    monthly_levy: p.monthly_levy ?? '',
    monthly_rates: p.monthly_rates ?? '',
    monthly_utilities: p.monthly_utilities ?? '',
    bedrooms: p.bedrooms != null ? String(p.bedrooms) : '',
    bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
    garages: p.garages != null ? String(p.garages) : '',
    carports: p.carports != null ? String(p.carports) : '',
    parking_spaces: p.parking_spaces != null ? String(p.parking_spaces) : '',
    floor_area_sqm: p.floor_area_sqm ?? '',
    erf_size_sqm: p.erf_size_sqm ?? '',
    area_sqm: p.area_sqm ?? '',
    year_built: '',
    description: p.description ?? '',
    features: p.features ?? [],
    is_published: p.status === 'active',
    is_featured: false,
  };
}

function toPayload(f: FormState): Record<string, unknown> {
  return {
    property_type: f.property_type,
    property_subtype: f.property_subtype || undefined,
    listing_type: f.listing_type || undefined,
    listing_reference: f.listing_reference || undefined,
    title_type: f.title_type || undefined,
    status: f.status,
    price: f.price ? Number(f.price) : undefined,
    currency: f.currency,
    monthly_levy: f.monthly_levy || null,
    monthly_rates: f.monthly_rates || null,
    monthly_utilities: f.monthly_utilities || null,
    bedrooms: f.bedrooms ? Number(f.bedrooms) : null,
    bathrooms: f.bathrooms ? Number(f.bathrooms) : null,
    garages: f.garages ? Number(f.garages) : null,
    carports: f.carports ? Number(f.carports) : null,
    parking_spaces: f.parking_spaces ? Number(f.parking_spaces) : null,
    floor_area_sqm: f.floor_area_sqm || null,
    erf_size_sqm: f.erf_size_sqm || null,
    area_sqm: f.area_sqm || null,
    description: f.description || null,
    features: f.features,
    location: {
      address_line1: f.address_line1 || null,
      city: f.city || null,
      region: f.region || null,
      country: f.country || 'South Africa',
      postal_code: f.postal_code || null,
      latitude: f.latitude || null,
      longitude: f.longitude || null,
    },
  };
}

// ─── Shared field primitives ────────────────────────────────────────────────

const LABEL_CLS =
  'block text-[10px] font-bold tracking-[0.8px] uppercase text-[#6B8F7A] mb-1.5';
const INPUT_CLS =
  'w-full px-3 py-2 border-[1.5px] border-[#E4DDD0] rounded-lg text-[13px] text-[#1A3C28] bg-white ' +
  'focus:outline-none focus:border-[#1A3C28] transition-colors placeholder:text-[#B8C8BE]';
const SELECT_CLS = INPUT_CLS + ' appearance-none';

function Field({
  label, children, full,
}: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-full' : ''}>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

function PrefixInput({
  prefix, value, onChange, placeholder,
}: { prefix: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#6B8F7A]">{prefix}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLS + ' pl-7'}
      />
    </div>
  );
}

// ─── Section completion heuristic ──────────────────────────────────────────

function sectionComplete(s: Section, f: FormState): boolean {
  switch (s) {
    case 'core':        return !!f.property_type && !!f.listing_type;
    case 'location':    return !!f.address_line1 && !!f.city && !!f.country;
    case 'pricing':     return !!f.price;
    case 'details':     return !!f.bedrooms || !!f.floor_area_sqm;
    case 'description': return f.description.length > 20;
    case 'media':       return true;
    case 'features':    return f.features.length > 0;
    case 'settings':    return true;
    default:            return false;
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Section>('core');
  const [openSection, setOpenSection] = useState<Section | null>('core');

  const defaultForm: FormState = {
    property_type: 'residential',
    property_subtype: '',
    listing_type: '',
    listing_reference: '',
    title_type: '',
    status: 'draft',
    address_line1: '',
    suburb: '',
    city: '',
    region: '',
    country: 'South Africa',
    postal_code: '',
    latitude: '',
    longitude: '',
    price: '',
    currency: 'ZAR',
    monthly_levy: '',
    monthly_rates: '',
    monthly_utilities: '',
    bedrooms: '',
    bathrooms: '',
    garages: '',
    carports: '',
    parking_spaces: '',
    floor_area_sqm: '',
    erf_size_sqm: '',
    area_sqm: '',
    year_built: '',
    description: '',
    features: [],
    is_published: false,
    is_featured: false,
  };

  const [form, setForm] = useState<FormState>(defaultForm);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  // ─── Media local state ───────────────────────────────────────────────────
  type MediaItem = NonNullable<PropertyListing['media']>[number];
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !listingId) { setLoading(false); return; }
    propertiesApi.getById(listingId, token)
      .then((p) => {
        setProperty(p);
        setForm(toForm(p));
        setMediaItems(p.media ?? []);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [listingId]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async () => {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      await propertiesApi.update(token, listingId, toPayload(form));
      setHasUnsavedChanges(false);
      router.push(`/app/my-listings/${listingId}`);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.push(`/app/my-listings/${listingId}`);
  };

  const hasVideo = mediaItems.some((m) => m.media_type === 'video');

  const handleUploadMedia = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const token = getAccessToken();
    if (!token) return;
    setMediaUploading(true);
    setMediaError(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      await propertiesApi.addMedia(token, listingId, fd);
      // Reload media from API
      const updated = await propertiesApi.getById(listingId, token);
      setMediaItems(updated.media ?? []);
    } catch {
      setMediaError('Upload failed. Please try again.');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleUploadVideo = async (file: File) => {
    const token = getAccessToken();
    if (!token) return;
    setMediaUploading(true);
    setMediaError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await propertiesApi.addMedia(token, listingId, fd);
      const updated = await propertiesApi.getById(listingId, token);
      setMediaItems(updated.media ?? []);
    } catch {
      setMediaError('Video upload failed. Please try again.');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const token = getAccessToken();
    if (!token) return;
    // Optimistic remove
    setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
    try {
      await propertiesApi.deleteMedia(token, listingId, mediaId);
    } catch {
      setMediaError('Delete failed. Please refresh.');
      // Re-fetch to restore
      const updated = await propertiesApi.getById(listingId, token);
      setMediaItems(updated.media ?? []);
    }
  };

  const handleSetPrimary = async (mediaId: string) => {
    const token = getAccessToken();
    if (!token) return;
    // Optimistic update
    setMediaItems((prev) =>
      prev.map((m) => ({ ...m, is_primary: m.id === mediaId }))
    );
    try {
      await propertiesApi.setPrimaryMedia(token, listingId, mediaId);
    } catch {
      setMediaError('Could not set primary. Please refresh.');
      const updated = await propertiesApi.getById(listingId, token);
      setMediaItems(updated.media ?? []);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setField('features', [...form.features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleDeleteFeature = (index: number) => {
    setField('features', form.features.filter((_, i) => i !== index));
  };

  // ─── Section metadata ─────────────────────────────────────────────────────

  const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'core',        label: 'Core Info',   icon: <Home className="w-4 h-4" /> },
    { id: 'location',    label: 'Location',    icon: <MapPin className="w-4 h-4" /> },
    { id: 'pricing',     label: 'Pricing',     icon: <DollarSign className="w-4 h-4" /> },
    { id: 'details',     label: 'Details',     icon: <Building2 className="w-4 h-4" /> },
    { id: 'description', label: 'Description', icon: <FileText className="w-4 h-4" /> },
    { id: 'media',       label: 'Media',       icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'features',    label: 'Features',    icon: <Sparkles className="w-4 h-4" /> },
    { id: 'settings',    label: 'Settings',    icon: <Settings className="w-4 h-4" /> },
  ];

  const completedCount = SECTIONS.filter((s) => sectionComplete(s.id, form)).length;

  // ─── Section panels ───────────────────────────────────────────────────────

  function renderSection(s: Section): React.ReactNode {
    switch (s) {
      case 'core':
        return (
          <div>
            <h3 className="font-[family-name:var(--font-fraunces)] text-[#1A3C28] font-bold text-lg mb-5">Core Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Property Type">
                <select value={form.property_type} onChange={(e) => setField('property_type', e.target.value as FormState['property_type'])} className={SELECT_CLS}>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="land">Land</option>
                  <option value="industrial">Industrial</option>
                </select>
              </Field>
              <Field label="Sub Type">
                <input type="text" value={form.property_subtype} onChange={(e) => setField('property_subtype', e.target.value)} className={INPUT_CLS} placeholder="e.g. House, Apartment" />
              </Field>
              <Field label="Listing Type">
                <select value={form.listing_type} onChange={(e) => setField('listing_type', e.target.value as FormState['listing_type'])} className={SELECT_CLS}>
                  <option value="">Select…</option>
                  <option value="for_sale">For Sale</option>
                  <option value="to_rent">To Rent</option>
                  <option value="development">Development</option>
                </select>
              </Field>
              <Field label="Listing Reference">
                <input type="text" value={form.listing_reference} onChange={(e) => setField('listing_reference', e.target.value)} className={INPUT_CLS} placeholder="REF-001" />
              </Field>
              <Field label="Title Type">
                <input type="text" value={form.title_type} onChange={(e) => setField('title_type', e.target.value)} className={INPUT_CLS} placeholder="e.g. Freehold, Sectional Title" />
              </Field>
            </div>
          </div>
        );

      case 'location':
        return (
          <div>
            <h3 className="font-[family-name:var(--font-fraunces)] text-[#1A3C28] font-bold text-lg mb-5">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Street Address" full>
                <input type="text" value={form.address_line1} onChange={(e) => setField('address_line1', e.target.value)} className={INPUT_CLS} placeholder="123 Main Street" />
              </Field>
              <Field label="Suburb">
                <input type="text" value={form.suburb} onChange={(e) => setField('suburb', e.target.value)} className={INPUT_CLS} placeholder="Suburb" />
              </Field>
              <Field label="City">
                <input type="text" value={form.city} onChange={(e) => setField('city', e.target.value)} className={INPUT_CLS} placeholder="Cape Town" />
              </Field>
              <Field label="Region / Province">
                <input type="text" value={form.region} onChange={(e) => setField('region', e.target.value)} className={INPUT_CLS} placeholder="Western Cape" />
              </Field>
              <Field label="Country">
                <input type="text" value={form.country} onChange={(e) => setField('country', e.target.value)} className={INPUT_CLS} placeholder="South Africa" />
              </Field>
              <Field label="Postal Code">
                <input type="text" value={form.postal_code} onChange={(e) => setField('postal_code', e.target.value)} className={INPUT_CLS} placeholder="8001" />
              </Field>
              <Field label="Latitude">
                <input type="text" value={form.latitude} onChange={(e) => setField('latitude', e.target.value)} className={INPUT_CLS} placeholder="-33.925" />
              </Field>
              <Field label="Longitude">
                <input type="text" value={form.longitude} onChange={(e) => setField('longitude', e.target.value)} className={INPUT_CLS} placeholder="18.424" />
              </Field>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div>
            <h3 className="font-[family-name:var(--font-fraunces)] text-[#1A3C28] font-bold text-lg mb-5">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price">
                <PrefixInput prefix="R" value={form.price} onChange={(v) => setField('price', v)} placeholder="1 500 000" />
              </Field>
              <Field label="Currency">
                <select value={form.currency} onChange={(e) => setField('currency', e.target.value)} className={SELECT_CLS}>
                  <option value="ZAR">ZAR — Rand</option>
                  <option value="USD">USD — Dollar</option>
                  <option value="GBP">GBP — Pound</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </Field>
              <Field label="Monthly Levy">
                <PrefixInput prefix="R" value={form.monthly_levy} onChange={(v) => setField('monthly_levy', v)} placeholder="0" />
              </Field>
              <Field label="Monthly Rates">
                <PrefixInput prefix="R" value={form.monthly_rates} onChange={(v) => setField('monthly_rates', v)} placeholder="0" />
              </Field>
              <Field label="Monthly Utilities">
                <PrefixInput prefix="R" value={form.monthly_utilities} onChange={(v) => setField('monthly_utilities', v)} placeholder="0" />
              </Field>
            </div>
          </div>
        );

      case 'details':
        return (
          <div>
            <h3 className="font-[family-name:var(--font-fraunces)] text-[#1A3C28] font-bold text-lg mb-5">Property Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Bedrooms">
                <input type="number" min="0" value={form.bedrooms} onChange={(e) => setField('bedrooms', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Bathrooms">
                <input type="number" min="0" step="0.5" value={form.bathrooms} onChange={(e) => setField('bathrooms', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Garages">
                <input type="number" min="0" value={form.garages} onChange={(e) => setField('garages', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Carports">
                <input type="number" min="0" value={form.carports} onChange={(e) => setField('carports', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Parking Spaces">
                <input type="number" min="0" value={form.parking_spaces} onChange={(e) => setField('parking_spaces', e.target.value)} className={INPUT_CLS} />
              </Field>
              <Field label="Floor Area (m²)">
                <input type="text" value={form.floor_area_sqm} onChange={(e) => setField('floor_area_sqm', e.target.value)} className={INPUT_CLS} placeholder="0" />
              </Field>
              <Field label="Erf Size (m²)">
                <input type="text" value={form.erf_size_sqm} onChange={(e) => setField('erf_size_sqm', e.target.value)} className={INPUT_CLS} placeholder="0" />
              </Field>
              <Field label="Total Area (m²)">
                <input type="text" value={form.area_sqm} onChange={(e) => setField('area_sqm', e.target.value)} className={INPUT_CLS} placeholder="0" />
              </Field>
              <Field label="Year Built">
                <input type="text" maxLength={4} value={form.year_built} onChange={(e) => setField('year_built', e.target.value.replace(/\D/g, ''))} className={INPUT_CLS} placeholder="2010" />
              </Field>
            </div>
          </div>
        );

      case 'description':
        return (
          <div>
            <h3 className="font-[family-name:var(--font-fraunces)] text-[#1A3C28] font-bold text-lg mb-2">Description</h3>
            <p className="text-[12px] text-[#6B8F7A] mb-5">Write a compelling description of the property.</p>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={12}
              className={INPUT_CLS + ' resize-none leading-relaxed'}
              placeholder="Describe the property, its unique features, location benefits, and what makes it special…"
            />
            <div className="flex justify-between mt-2 text-[11px] text-[#6B8F7A]">
              <span>{form.description.length} characters</span>
              <span>{form.description.split(' ').filter((w) => w.length > 0).length} words</span>
            </div>
          </div>
        );

      case 'media': {
        const photos = mediaItems.filter((m) => m.media_type !== 'video');
        const video = mediaItems.find((m) => m.media_type === 'video');
        return (
          <div>
            <h3 className="font-[family-name:var(--font-fraunces)] text-[#1A3C28] font-bold text-lg mb-1">Media</h3>
            <p className="text-[12px] text-[#6B8F7A] mb-5">Manage photos and the property video.</p>

            {mediaError && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />{mediaError}
              </div>
            )}

            {/* ── Photos ── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-[#6B8F7A]">
                  Photos ({photos.length})
                </span>
                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                  mediaUploading
                    ? 'bg-[#E4DDD0] text-[#6B8F7A] cursor-not-allowed'
                    : 'bg-[#1A3C28] text-white hover:bg-[#0f2418]'
                }`}>
                  <Upload className="w-3.5 h-3.5" />
                  {mediaUploading ? 'Uploading…' : 'Add Photos'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={mediaUploading}
                    className="sr-only"
                    onChange={(e) => handleUploadMedia(e.target.files)}
                  />
                </label>
              </div>

              {photos.length === 0 ? (
                <label className="border-2 border-dashed border-[#E4DDD0] rounded-xl flex flex-col items-center justify-center py-12 text-center cursor-pointer hover:border-[#1A3C28]/40 transition-colors">
                  <ImageIcon className="w-8 h-8 text-[#B8C8BE] mb-2" />
                  <p className="text-sm text-[#6B8F7A] font-medium">No photos yet</p>
                  <p className="text-[11px] text-[#B8C8BE] mt-1">Click to upload photos</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={mediaUploading}
                    className="sr-only"
                    onChange={(e) => handleUploadMedia(e.target.files)}
                  />
                </label>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((m) => (
                    <div key={m.id} className="relative aspect-video rounded-xl overflow-hidden border-2 border-[#E4DDD0] group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.thumbnail_url ?? m.url} alt="" className="w-full h-full object-cover" />

                      {/* Primary badge */}
                      {m.is_primary && (
                        <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold bg-[#1A3C28] text-white px-2 py-0.5 rounded-full">
                          <Star className="w-2.5 h-2.5 fill-[#00E87A] text-[#00E87A]" /> Primary
                        </span>
                      )}

                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-[#1A3C28]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!m.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(m.id)}
                            title="Set as primary"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00E87A] text-[#1A3C28] text-[11px] font-bold rounded-lg hover:brightness-110 transition-all"
                          >
                            <Star className="w-3 h-3" /> Primary
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMedia(m.id)}
                          title="Delete photo"
                          className="p-1.5 bg-white/90 text-[#C4562A] rounded-lg hover:bg-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Video ── */}
            <div className="border-t border-[#E4DDD0] pt-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-[#6B8F7A]">Video</span>
                  <span className="ml-2 text-[10px] text-[#B8C8BE]">1 video maximum</span>
                </div>
                {!hasVideo && (
                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                    mediaUploading
                      ? 'bg-[#E4DDD0] text-[#6B8F7A] cursor-not-allowed'
                      : 'bg-[#F2E8D5] text-[#1A3C28] hover:bg-[#e8dac7]'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    {mediaUploading ? 'Uploading…' : 'Upload Video'}
                    <input
                      type="file"
                      accept="video/*"
                      disabled={mediaUploading}
                      className="sr-only"
                      onChange={(e) => { if (e.target.files?.[0]) handleUploadVideo(e.target.files[0]); }}
                    />
                  </label>
                )}
              </div>

              {video ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-[#E4DDD0] bg-[#1A3C28]/5 group">
                  <video
                    src={video.url}
                    controls
                    className="w-full max-h-48 object-contain"
                  />
                  <button
                    onClick={() => handleDeleteMedia(video.id)}
                    title="Remove video"
                    className="absolute top-2 right-2 p-1.5 bg-white/90 text-[#C4562A] rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#E4DDD0] rounded-xl flex flex-col items-center justify-center py-10 text-center cursor-pointer hover:border-[#1A3C28]/40 transition-colors">
                  <Video className="w-8 h-8 text-[#B8C8BE] mb-2" />
                  <p className="text-sm text-[#6B8F7A] font-medium">No video uploaded</p>
                  <p className="text-[11px] text-[#B8C8BE] mt-1">Click to upload one video</p>
                  <input
                    type="file"
                    accept="video/*"
                    disabled={mediaUploading}
                    className="sr-only"
                    onChange={(e) => { if (e.target.files?.[0]) handleUploadVideo(e.target.files[0]); }}
                  />
                </label>
              )}
            </div>
          </div>
        );
      }

      case 'features':
        return (
          <div>
            <h3 className="font-[family-name:var(--font-fraunces)] text-[#1A3C28] font-bold text-lg mb-2">Features &amp; Amenities</h3>
            <p className="text-[12px] text-[#6B8F7A] mb-5">Add tags for what makes this property stand out.</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                className={INPUT_CLS + ' flex-1'}
                placeholder="e.g. Pool, Solar, Double Garage…"
              />
              <button
                onClick={handleAddFeature}
                className="px-4 py-2 bg-[#1A3C28] text-white text-sm font-semibold rounded-lg hover:bg-[#0f2418] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.features.length === 0 && (
                <p className="text-[12px] text-[#B8C8BE] italic">No features added yet.</p>
              )}
              {form.features.map((feat, i) => (
                <span key={i} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-[#F2E8D5] text-[#1A3C28] text-[12px] font-medium rounded-full group">
                  {feat}
                  <button onClick={() => handleDeleteFeature(i)} className="rounded-full p-0.5 hover:bg-[#C4562A]/20 transition-colors">
                    <X className="w-3 h-3 text-[#6B8F7A] group-hover:text-[#C4562A] transition-colors" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div>
            <h3 className="font-[family-name:var(--font-fraunces)] text-[#1A3C28] font-bold text-lg mb-5">Settings</h3>
            <div className="mb-6">
              <label className={LABEL_CLS}>Listing Status</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['draft', 'active', 'under_offer', 'sold', 'withdrawn'] as PropertyStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setField('status', st)}
                    className={`py-2 px-3 rounded-xl text-[12px] font-semibold border transition-colors ${
                      form.status === st
                        ? 'bg-[#1A3C28] text-white border-[#1A3C28]'
                        : 'bg-white text-[#1A3C28] border-[#E4DDD0] hover:border-[#1A3C28]'
                    }`}
                  >
                    {st === 'under_offer' ? 'Under Offer' : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4 border-t border-[#E4DDD0] pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#1A3C28]">Published</div>
                  <div className="text-[11px] text-[#6B8F7A] mt-0.5">Visible to the public</div>
                </div>
                <Switch.Root
                  checked={form.is_published}
                  onCheckedChange={(checked) => setField('is_published', checked)}
                  className="w-11 h-6 bg-[#E4DDD0] rounded-full relative data-[state=checked]:bg-[#00E87A] transition-colors"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#1A3C28]">Featured Listing</div>
                  <div className="text-[11px] text-[#6B8F7A] mt-0.5">Highlighted on the homepage</div>
                </div>
                <Switch.Root
                  checked={form.is_featured}
                  onCheckedChange={(checked) => setField('is_featured', checked)}
                  className="w-11 h-6 bg-[#E4DDD0] rounded-full relative data-[state=checked]:bg-[#00E87A] transition-colors"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-sm" />
                </Switch.Root>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // ─── Sidebar (desktop sticky panel) ──────────────────────────────────────

  function renderSidebar(): React.ReactNode {
    return (
      <div className="bg-white rounded-2xl border border-[#E4DDD0] shadow-sm p-5 space-y-5">
        <div>
          <label className={LABEL_CLS}>Status</label>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {(['draft', 'active', 'under_offer', 'sold', 'withdrawn'] as PropertyStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => setField('status', st)}
                className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                  form.status === st
                    ? 'bg-[#1A3C28] text-white border-[#1A3C28]'
                    : 'bg-white text-[#1A3C28] border-[#E4DDD0] hover:border-[#1A3C28]'
                }`}
              >
                {st === 'under_offer' ? 'Under Offer' : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#E4DDD0] pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#1A3C28]">Published</div>
              <div className="text-[10px] text-[#6B8F7A]">Visible to public</div>
            </div>
            <Switch.Root
              checked={form.is_published}
              onCheckedChange={(checked) => setField('is_published', checked)}
              className="w-10 h-5 bg-[#E4DDD0] rounded-full relative data-[state=checked]:bg-[#00E87A] transition-colors"
            >
              <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px] shadow-sm" />
            </Switch.Root>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#1A3C28]">Featured</div>
              <div className="text-[10px] text-[#6B8F7A]">Highlighted on homepage</div>
            </div>
            <Switch.Root
              checked={form.is_featured}
              onCheckedChange={(checked) => setField('is_featured', checked)}
              className="w-10 h-5 bg-[#E4DDD0] rounded-full relative data-[state=checked]:bg-[#00E87A] transition-colors"
            >
              <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px] shadow-sm" />
            </Switch.Root>
          </div>
        </div>

        <div className="border-t border-[#E4DDD0] pt-4 text-[11px] text-[#6B8F7A]">
          <div className="flex justify-between">
            <span>Listing ID</span>
            <span className="font-[family-name:var(--font-mono)] text-[#1A3C28] text-[10px]">{listingId.slice(0, 8)}…</span>
          </div>
        </div>

        {mediaItems.length > 0 && (
          <div className="border-t border-[#E4DDD0] pt-4">
            <label className={LABEL_CLS}>Photos ({mediaItems.filter((m) => m.media_type !== 'video').length})</label>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {mediaItems.filter((m) => m.media_type !== 'video').slice(0, 6).map((m) => (
                <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#E4DDD0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumbnail_url ?? m.url} alt="" className="w-full h-full object-cover" />
                  {m.is_primary && (
                    <span className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-[#00E87A] ring-1 ring-white" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F2EC] flex items-center justify-center">
        <p className="font-[family-name:var(--font-fraunces)] text-[#1A3C28] text-lg">Loading listing…</p>
      </div>
    );
  }

  const address = property?.location?.address_line1 ?? property?.title ?? 'Edit Listing';
  const cityRegion = [property?.location?.city, property?.location?.region].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-[#F2E8D5]">
      {/* Forest dark header */}
      <div className="relative overflow-hidden" style={{ background: '#1A3C28' }}>
        {/* Decorative circles */}
        <div className="absolute pointer-events-none" style={{ top: -60, right: -60, width: 220, height: 220, background: '#C4562A', opacity: 0.08, borderRadius: '50%' }} />
        <div className="absolute pointer-events-none" style={{ bottom: 10, left: '40%', width: 160, height: 160, background: '#00E87A', opacity: 0.04, borderRadius: '50%' }} />

        <div className="relative px-8 pt-6 pb-0" style={{ zIndex: 1 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mb-4" style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C4562A' }}>
            <Link href="/app/my-listings" className="flex items-center gap-1 transition-opacity hover:opacity-100" style={{ opacity: 0.75, color: 'inherit' }}>
              <ArrowLeft className="w-3 h-3" />
              My Listings
            </Link>
            <span style={{ opacity: 0.5, margin: '0 4px' }}>›</span>
            <Link href={`/app/my-listings/${listingId}`} style={{ color: 'rgba(242,232,213,0.7)', fontWeight: 600 }}>{address}</Link>
            <span style={{ opacity: 0.5, margin: '0 4px' }}>›</span>
            <span style={{ color: 'rgba(242,232,213,0.5)', fontWeight: 600 }}>Edit</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 5, background: '#C4562A', color: '#fff' }}>
                  Editing
                </span>
                {hasUnsavedChanges && (
                  <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 5, background: 'rgba(245,200,122,0.15)', color: '#F5C87A', border: '1px solid rgba(245,200,122,0.3)' }}>
                    Unsaved Changes
                  </span>
                )}
              </div>
              <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 700, color: '#F2E8D5', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                {property?.title ?? address}
              </h1>
              <div className="flex items-center gap-2 mt-1" style={{ fontSize: 13, color: 'rgba(242,232,213,0.55)', fontWeight: 400 }}>
                {cityRegion && <span>{cityRegion}</span>}
                {cityRegion && (property?.bedrooms != null || property?.area_sqm) && <span style={{ width: 3, height: 3, background: 'rgba(242,232,213,0.3)', borderRadius: '50%', display: 'inline-block' }} />}
                {(property?.bedrooms != null || property?.bathrooms != null) && (
                  <span>
                    {[
                      property?.bedrooms != null ? `${property.bedrooms} bed` : null,
                      property?.bathrooms != null ? `${property.bathrooms} bath` : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                )}
                {property?.status && (
                  <>
                    <span style={{ width: 3, height: 3, background: 'rgba(242,232,213,0.3)', borderRadius: '50%', display: 'inline-block' }} />
                    <span style={{ color: '#00E87A', fontWeight: 600 }}>{property.status.replace(/_/g, ' ')}</span>
                  </>
                )}
              </div>
            </div>

            {/* Save / Cancel actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCancel}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(242,232,213,0.08)', color: 'rgba(242,232,213,0.8)', border: '1px solid rgba(242,232,213,0.14)' }}
                className="transition-all hover:opacity-90"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: '#C4562A', color: '#fff', border: 'none', opacity: saving ? 0.6 : 1 }}
                className="transition-all hover:opacity-90"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Section progress strip */}
          <div className="grid grid-cols-4 gap-2.5 pb-5">
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 5 }}>Progress</div>
              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: completedCount === 8 ? '#00E87A' : '#F5C87A', lineHeight: 1 }}>{completedCount} / 8</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(242,232,213,0.45)', marginTop: 3 }}>sections complete</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 5 }}>Active Section</div>
              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 14, fontWeight: 700, color: '#F2E8D5', lineHeight: 1.2 }}>{SECTIONS.find((s) => s.id === activeTab)?.label ?? '—'}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#00E87A', marginTop: 3 }}>currently editing</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 5 }}>Media</div>
              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: '#F2E8D5', lineHeight: 1 }}>{mediaItems.length}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(242,232,213,0.45)', marginTop: 3 }}>{mediaItems.length === 1 ? 'file uploaded' : 'files uploaded'}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 5 }}>Status</div>
              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 14, fontWeight: 700, color: form.status === 'active' ? '#00E87A' : '#F5C87A', lineHeight: 1.2, textTransform: 'capitalize' }}>{form.status.replace(/_/g, ' ')}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(242,232,213,0.45)', marginTop: 3 }}>listing status</div>
            </div>
          </div>
        </div>
      </div>

      {saveError && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#FEF2F0] border border-[#C4562A]/30 text-[#C4562A] rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {saveError}
          </div>
        </div>
      )}

      {/* ── DESKTOP (md+) — Tabbed sections ── */}
      <div className="hidden md:block">
        {/* Sticky section tab bar */}
        <div className="sticky top-0 z-40 bg-[#1A3C28] px-4 shadow-md">
          <div className="max-w-7xl mx-auto flex overflow-x-auto">
            {SECTIONS.map((s) => {
              const active = activeTab === s.id;
              const done = sectionComplete(s.id, form);
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-[12px] font-semibold tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? 'border-[#00E87A] text-white'
                      : 'border-transparent text-[#F2E8D5]/60 hover:text-[#F2E8D5]/80'
                  }`}
                >
                  <span className={active ? 'text-[#00E87A]' : 'text-[#F2E8D5]/40'}>{s.icon}</span>
                  {s.label}
                  {done && !active && <CheckCircle2 className="w-3 h-3 text-[#00E87A]/70" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress strip */}
        <div className="h-0.5 bg-[#E4DDD0]">
          <div
            className="h-full bg-gradient-to-r from-[#1A3C28] to-[#00E87A] transition-all duration-500"
            style={{ width: `${(completedCount / 8) * 100}%` }}
          />
        </div>

        {/* Body grid: section panel + sticky sidebar */}
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-[1fr_280px] gap-6 items-start">
          <div className="bg-white rounded-2xl border border-[#E4DDD0] shadow-sm p-6">
            {renderSection(activeTab)}
          </div>
          <div className="sticky top-[52px]">
            {renderSidebar()}
          </div>
        </div>
      </div>

      {/* ── MOBILE (< md) — Option C: Accordion sections ── */}
      <div className="md:hidden pb-24">
        {/* Progress dot strip */}
        <div className="bg-[#1A3C28] px-4 py-3">
          <div className="flex items-center gap-1">
            {SECTIONS.map((s) => {
              const done = sectionComplete(s.id, form);
              const active = openSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setOpenSection(active ? null : s.id)}
                  title={s.label}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    done ? 'bg-[#00E87A]' : active ? 'bg-[#F2E8D5]' : 'bg-[#F2E8D5]/30'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-[#F2E8D5]/60 text-[11px] mt-2 text-center">
            {completedCount} / 8 sections complete
          </p>
        </div>

        {/* Accordion sections */}
        <div className="divide-y divide-[#E4DDD0]">
          {SECTIONS.map((s) => {
            const open = openSection === s.id;
            const done = sectionComplete(s.id, form);
            return (
              <div key={s.id} className="bg-white">
                <button
                  onClick={() => setOpenSection(open ? null : s.id)}
                  className="w-full flex items-center justify-between px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#1A3C28]">{s.icon}</span>
                    <span className="font-[family-name:var(--font-jakarta)] font-semibold text-sm text-[#1A3C28]">
                      {s.label}
                    </span>
                    {done && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#00A855] bg-[#E8FFF4] px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                  {open
                    ? <ChevronUp className="w-4 h-4 text-[#6B8F7A] shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-[#6B8F7A] shrink-0" />
                  }
                </button>
                {open && (
                  <div className="px-4 pb-6">
                    {renderSection(s.id)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile sticky save bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E4DDD0] px-4 py-3 flex gap-3 z-30">
        <button
          onClick={handleCancel}
          className="flex-1 py-2.5 rounded-xl border border-[#E4DDD0] text-sm font-semibold text-[#1A3C28]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-[#1A3C28] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
