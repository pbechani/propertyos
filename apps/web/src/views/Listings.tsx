'use client';

import { useState, useMemo, useEffect, useRef } from "react";
import { MapPin, Filter, Grid3x3, List, Shield, Search, Map as MapIcon, X, Mic, MicOff, Sparkles, Volume2, Maximize, ChevronDown, ChevronUp, TrendingUp, Users, Newspaper, Plus, RefreshCw, BarChart3, Bell, Home, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ListingCardOptA from "@/components/property/ListingCardOptA";
import MultiListingDialog from "@/components/property/MultiListingDialog";
import type { MultiListingItem } from "@/components/property/MultiListingDialog";
import { Link, useNavigate } from "@/lib/router-compat";
import { getAccessToken, getStoredUser, getActiveCompanyIdFromToken } from "@/lib/auth-session";
import { ApiError, propertiesApi, salesApi, type AgentProfileResponse, type FeaturedAgentCard, type PropertyListing, type Sale } from "@/lib/api-client";
import { buildMapViewport, buildViewportMapSource } from "@/lib/map-utils";
import LeafletMapDynamic from "@/components/LeafletMapDynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMyOfferPropertyIds } from "@/hooks/useMyOfferPropertyIds";

const getDefaultFilters = () => ({
  verifiedOnly: false,
  propertyTypes: {
    house: false,
    apartment: false,
    townhouse: false,
    land: false,
    farm: false,
    commercial: false,
    industrial: false,
  },
  locations: [] as string[],
  minPrice: "",
  maxPrice: "",
  minBedrooms: 0,
  minBathrooms: 0,
  minGarage: 0,
  minFloorSize: "",
  minErfSize: "",
  features: {
    pool: false,
    garden: false,
    petFriendly: false,
    flatlet: false,
    security: false,
  },
  other: {
    retirement: false,
    onShow: false,
    repossessed: false,
    auction: false,
  },
});

type ListingsFilters = ReturnType<typeof getDefaultFilters>;

type ListingsViewState = {
  viewMode: "grid" | "list" | "map";
  showDesktopFilters: boolean;
  sortBy: "relevance" | "price-low-high" | "price-high-low" | "newest";
  pendingFilters: ListingsFilters;
  appliedFilters: ListingsFilters;
};

const LISTINGS_VIEW_STATE_KEY = 'pribec.listings.view_state.v4';

const LOCATION_SUGGESTIONS = [
  'Cape Town',
  'Johannesburg',
  'Durban',
  'Gaborone',
  'Francistown',
  'Harare',
  'Lusaka',
];

const PROPERTY_TYPE_OPTIONS = [
  { key: 'house', label: 'House' },
  { key: 'apartment', label: 'Apartment / Flat' },
  { key: 'townhouse', label: 'Townhouse' },
  { key: 'land', label: 'Vacant Land / Plot' },
  { key: 'farm', label: 'Farm' },
  { key: 'commercial', label: 'Commercial Property' },
  { key: 'industrial', label: 'Industrial Property' },
] as const;

const LISTING_CATEGORY_OPTIONS = [
  'For Sale',
  'To Rent',
  'Sold Prices',
  'Developments',
  'Estate Agencies',
  'Attorney',
  'Trends',
  'News',
] as const;

const PRICE_PRESET_OPTIONS = [
  100000,
  150000,
  200000,
  250000,
  300000,
  350000,
  400000,
  500000,
  1000000,
  2000000,
  5000000,
  10000000,
  25000000,
] as const;

const SIZE_PRESET_OPTIONS = [
  80,
  120,
  180,
  250,
  400,
  500,
  800,
  1200,
  2000,
] as const;

function formatRandValue(value: number): string {
  return `R ${value.toLocaleString('en-ZA').replace(/,/g, ' ')}`;
}

function formatSquareMeters(value: number): string {
  return `${value.toLocaleString('en-ZA').replace(/,/g, ' ')} m²`;
}

export type ListingCard = {
  id: string;
  title: string;
  location: string;
  addressLine1: string | null;
  addressCity: string | null;
  price: string;
  currency: string;
  rawPrice: number;
  beds: number;
  baths: number;
  garage: number;
  garages: number;
  carports: number;
  sqm: number;
  erfSizeSqm: number | null;
  pricePerSqm: number | null;
  monthlyLevy: number | null;
  monthlyRates: number | null;
  monthlyUtilities: number | null;
  titleType: string | null;
  viewCount: number;
  mediaCount: number;
  verifiedAt: string | null;
  propertyType: string;
  listingType: 'for_sale' | 'to_rent' | 'development' | null;
  status: 'draft' | 'active' | 'under_offer' | 'sold' | 'withdrawn';
  features: string[];
  verified: boolean;
  fraudFlagged: boolean;
  agent: string;
  agentId: string | null;
  /** Company UUID the listing was created under — used to gate owner-only controls */
  companyId: string | null;
  agentCompany: string;
  agentAvatarUrl: string | null;
  agentCompanyLogoUrl: string | null;
  agentCompanyBrandColor: string | null;
  isPrivateListing: boolean;
  image: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  nextOpenHouseAt?: string | null;
};

type MapPoint = {
  id: string;
  title: string;
  price: string;
  latitude: number;
  longitude: number;
};

type VoiceParseResult = {
  filters: ListingsFilters;
  suggestions: string[];
};

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionAlternativeLike = {
  0: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionAlternativeLike[];
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  }
}

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=400&fit=crop";
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const MAP_PIN_LEFT_CLASSES = [
  'left-[4%]',
  'left-[14%]',
  'left-[24%]',
  'left-[34%]',
  'left-[44%]',
  'left-[54%]',
  'left-[64%]',
  'left-[74%]',
  'left-[84%]',
  'left-[96%]',
] as const;
const MAP_PIN_TOP_CLASSES = [
  'top-[6%]',
  'top-[16%]',
  'top-[26%]',
  'top-[36%]',
  'top-[46%]',
  'top-[56%]',
  'top-[66%]',
  'top-[76%]',
  'top-[86%]',
  'top-[94%]',
] as const;

function percentToPositionClass(percent: number, classes: readonly string[]): string {
  const ratio = Math.max(0, Math.min(1, percent / 100));
  const index = Math.round(ratio * (classes.length - 1));
  return classes[index] ?? classes[0];
}

function formatPrice(amount: number, currency: string): string {
  const safeCurrency = /^[A-Z]{3}$/.test(currency || "") ? currency : "ZAR";

  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

function pickFirstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

function mapPropertyToListingCard(
  property: PropertyListing,
  agentProfile?: AgentProfileResponse,
): ListingCard {
  const numericPrice = Number(property.price);
  const city = property.location?.city ?? "";
  const region = property.location?.region ?? "";
  const location = [city, region].filter(Boolean).join(", ") || "Location unavailable";
  const primaryImage = property.media?.find((media) => media.is_primary)?.url;
  const latitude = property.location?.latitude ? Number(property.location.latitude) : null;
  const longitude = property.location?.longitude ? Number(property.location.longitude) : null;
  const features = Array.isArray(property.features)
    ? property.features.filter((feature): feature is string => typeof feature === "string")
    : [];

  const propertyTypeMap: Record<PropertyListing['property_type'], string> = {
    residential: "house",
    off_plan: "apartment",
    land: "land",
    commercial: "commercial",
  };

  const looseProperty = property as PropertyListing & {
    agent?: {
      companyName?: string | null;
      company_name?: string | null;
      companyLogoUrl?: string | null;
      company_logo_url?: string | null;
      avatarUrl?: string | null;
      avatar_url?: string | null;
    } | null;
    company_name?: string | null;
    company_logo_url?: string | null;
    agent_company_logo_url?: string | null;
    agent_avatar_url?: string | null;
  };

  const profileAgentName = agentProfile
    ? `${agentProfile.firstName} ${agentProfile.lastName}`.trim()
    : '';

  const agentAvatarUrl = pickFirstString(
    agentProfile?.avatarUrl,
    looseProperty.agent?.avatarUrl,
    looseProperty.agent?.avatar_url,
    looseProperty.agent_avatar_url,
  );

  const agentCompanyLogoUrl = pickFirstString(
    looseProperty.company_logo_url,
    looseProperty.agent?.companyLogoUrl,
    looseProperty.agent?.company_logo_url,
    looseProperty.agent_company_logo_url,
  );

  const agentCompany = pickFirstString(
    looseProperty.company_name,
    looseProperty.agent?.companyName,
    looseProperty.agent?.company_name,
  ) ?? "PRIBEC Agent Network";

  const sqm = property.area_sqm ? Number(property.area_sqm) : 0;
  const erfSizeSqm = property.erf_size_sqm ? Number(property.erf_size_sqm) : null;
  const pricePerSqm = sqm > 0 && Number.isFinite(numericPrice) && numericPrice > 0
    ? Math.round(numericPrice / sqm)
    : null;

  return {
    id: property.id,
    title: property.title,
    location,
    addressLine1: property.location?.address_line1 ?? null,
    addressCity: property.location?.city ?? null,
    price: Number.isFinite(numericPrice) ? formatPrice(numericPrice, property.currency) : formatPrice(0, property.currency),
    currency: property.currency,
    rawPrice: Number.isFinite(numericPrice) ? numericPrice : 0,
    beds: property.bedrooms ?? 0,
    baths: property.bathrooms ?? 0,
    garage: property.parking_spaces ?? 0,
    garages: property.garages ?? 0,
    carports: property.carports ?? 0,
    sqm,
    erfSizeSqm,
    pricePerSqm,
    monthlyLevy: property.monthly_levy ? Number(property.monthly_levy) : null,
    monthlyRates: property.monthly_rates ? Number(property.monthly_rates) : null,
    monthlyUtilities: property.monthly_utilities ? Number(property.monthly_utilities) : null,
    titleType: property.title_type ?? null,
    viewCount: property.view_count ?? 0,
    mediaCount: property.media?.length ?? 0,
    verifiedAt: property.verified_at ?? null,
    propertyType: propertyTypeMap[property.property_type] ?? "house",
    listingType: property.listing_type ?? null,
    status: property.status,
    features,
    verified: property.verification_status === "verified",
    fraudFlagged: property.verification_status === "flagged",
    agent: profileAgentName || "Verified Agent",
    agentId: property.agent_id ?? null,
    companyId: property.company_id ?? null,
    agentCompany,
    agentAvatarUrl,
    agentCompanyLogoUrl,
    agentCompanyBrandColor: property.company_brand_color ?? null,
    // company_is_system=true  → created under the Self system company (private individual)
    // company_is_system=null  → legacy record with no company_id (also private — see PropertyRecord comment)
    isPrivateListing: property.company_is_system !== false,
    image: primaryImage || DEFAULT_PROPERTY_IMAGE,
    createdAt: property.created_at,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    nextOpenHouseAt: (property as PropertyListing & { next_open_house_at?: string | null }).next_open_house_at ?? null,
  };
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

function parseVoicePrice(rawValue: string, unit?: string): number | null {
  const numeric = Number(rawValue.replace(/,/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  const normalizedUnit = (unit ?? '').toLowerCase();
  if (normalizedUnit.startsWith('m') || normalizedUnit.includes('million')) {
    return Math.round(numeric * 1_000_000);
  }

  if (normalizedUnit.startsWith('k') || normalizedUnit.includes('thousand')) {
    return Math.round(numeric * 1_000);
  }

  return Math.round(numeric);
}

function buildVoiceSearchResult(query: string): VoiceParseResult {
  const filters = getDefaultFilters();
  const suggestions: string[] = [];
  const lower = query.toLowerCase();

  if (/\bverified\b|\btrusted\b/.test(lower)) {
    filters.verifiedOnly = true;
    suggestions.push('Verified properties only');
  }

  if (/\bhouse\b|\bhouses\b|\bhome\b|\bhomes\b|\bresidential\b/.test(lower)) {
    filters.propertyTypes.house = true;
    suggestions.push('Property type: House');
  }

  if (/\bapartment\b|\bapartments\b|\bflat\b|\bflats\b|\bcondo\b/.test(lower)) {
    filters.propertyTypes.apartment = true;
    suggestions.push('Property type: Apartment');
  }

  if (/\bland\b|\bplot\b|\bstand\b/.test(lower)) {
    filters.propertyTypes.land = true;
    suggestions.push('Property type: Land');
  }

  if (/\bcommercial\b|\boffice\b|\bretail\b|\bwarehouse\b/.test(lower)) {
    filters.propertyTypes.commercial = true;
    suggestions.push('Property type: Commercial');
  }

  const bedroomsMatch = lower.match(/(\d+)\s*(?:\+\s*)?(?:bed|beds|bedroom|bedrooms)\b/);
  if (bedroomsMatch) {
    const bedrooms = Number(bedroomsMatch[1]);
    if (Number.isFinite(bedrooms) && bedrooms >= 0) {
      filters.minBedrooms = bedrooms;
      suggestions.push(`${bedrooms}+ bedrooms`);
    }
  }

  const bathroomsMatch = lower.match(/(\d+)\s*(?:\+\s*)?(?:bath|baths|bathroom|bathrooms)\b/);
  if (bathroomsMatch) {
    const bathrooms = Number(bathroomsMatch[1]);
    if (Number.isFinite(bathrooms) && bathrooms >= 0) {
      filters.minBathrooms = bathrooms;
      suggestions.push(`${bathrooms}+ bathrooms`);
    }
  }

  if (/\bpool\b/.test(lower)) {
    filters.features.pool = true;
    suggestions.push('Feature: Pool');
  }

  if (/\bgarden\b/.test(lower)) {
    filters.features.garden = true;
    suggestions.push('Feature: Garden');
  }

  if (/\bpet friendly\b|\bpets\b|\bpet-friendly\b/.test(lower)) {
    filters.features.petFriendly = true;
    suggestions.push('Feature: Pet Friendly');
  }

  if (/\bsecurity\b|\bgated\b|\bsecure\b/.test(lower)) {
    filters.features.security = true;
    suggestions.push('Feature: Security');
  }

  const maxPriceMatch = lower.match(/(?:under|below|less than|max(?:imum)?)\s*(?:r|zar|rand)?\s*([\d,.]+)\s*(million|m|thousand|k)?/);
  if (maxPriceMatch) {
    const maxPrice = parseVoicePrice(maxPriceMatch[1], maxPriceMatch[2]);
    if (maxPrice !== null) {
      filters.maxPrice = String(maxPrice);
      suggestions.push(`Max price: ${formatRandAmount(maxPrice)}`);
    }
  }

  const minPriceMatch = lower.match(/(?:over|above|more than|min(?:imum)?)\s*(?:r|zar|rand)?\s*([\d,.]+)\s*(million|m|thousand|k)?/);
  if (minPriceMatch) {
    const minPrice = parseVoicePrice(minPriceMatch[1], minPriceMatch[2]);
    if (minPrice !== null) {
      filters.minPrice = String(minPrice);
      suggestions.push(`Min price: ${formatRandAmount(minPrice)}`);
    }
  }

  const matchedLocations = LOCATION_SUGGESTIONS.filter((location) =>
    lower.includes(location.toLowerCase()),
  );
  if (matchedLocations.length > 0) {
    filters.locations = matchedLocations;
    matchedLocations.forEach((location) => suggestions.push(`Location: ${location}`));
  }

  return { filters, suggestions };
}

function filtersToSearchParams(
  filters: ListingsFilters,
  sortBy: string,
  listingCategory: string,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('searched', '1');
  if (sortBy !== 'relevance') params.set('sort', sortBy);
  if (listingCategory !== 'For Sale') params.set('category', listingCategory);

  filters.locations.forEach((loc) => params.append('location', loc));
  Object.entries(filters.propertyTypes).forEach(([type, selected]) => {
    if (selected) params.append('type', type);
  });

  if (filters.verifiedOnly) params.set('verified', '1');
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.minBedrooms > 0) params.set('minBeds', String(filters.minBedrooms));
  if (filters.minBathrooms > 0) params.set('minBaths', String(filters.minBathrooms));
  if (filters.minGarage > 0) params.set('minGarage', String(filters.minGarage));
  if (filters.minFloorSize) params.set('minFloor', filters.minFloorSize);
  if (filters.minErfSize) params.set('minErf', filters.minErfSize);

  Object.entries(filters.features).forEach(([feat, selected]) => {
    if (selected) params.append('feat', feat);
  });
  Object.entries(filters.other).forEach(([other, selected]) => {
    if (selected) params.append('other', other);
  });

  return params;
}

function filtersFromSearchParams(
  searchParams: Pick<URLSearchParams, 'has' | 'get' | 'getAll'>,
): {
  filters: ListingsFilters;
  sortBy: 'relevance' | 'price-low-high' | 'price-high-low' | 'newest';
  listingCategory: (typeof LISTING_CATEGORY_OPTIONS)[number];
} | null {
  if (!searchParams.has('searched')) return null;

  const filters = getDefaultFilters();

  const locations = searchParams.getAll('location');
  if (locations.length > 0) filters.locations = locations;

  const types = searchParams.getAll('type');
  types.forEach((type) => {
    if (type in filters.propertyTypes) {
      filters.propertyTypes[type as keyof typeof filters.propertyTypes] = true;
    }
  });

  if (searchParams.get('verified') === '1') filters.verifiedOnly = true;

  const minPrice = searchParams.get('minPrice');
  if (minPrice) filters.minPrice = minPrice;
  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice) filters.maxPrice = maxPrice;

  const minBeds = searchParams.get('minBeds');
  if (minBeds) filters.minBedrooms = Math.max(0, Number(minBeds));
  const minBaths = searchParams.get('minBaths');
  if (minBaths) filters.minBathrooms = Math.max(0, Number(minBaths));
  const minGarage = searchParams.get('minGarage');
  if (minGarage) filters.minGarage = Math.max(0, Number(minGarage));

  const minFloor = searchParams.get('minFloor');
  if (minFloor) filters.minFloorSize = minFloor;
  const minErf = searchParams.get('minErf');
  if (minErf) filters.minErfSize = minErf;

  const feats = searchParams.getAll('feat');
  feats.forEach((feat) => {
    if (feat in filters.features) {
      filters.features[feat as keyof typeof filters.features] = true;
    }
  });
  const others = searchParams.getAll('other');
  others.forEach((other) => {
    if (other in filters.other) {
      filters.other[other as keyof typeof filters.other] = true;
    }
  });

  const validSorts = ['relevance', 'price-low-high', 'price-high-low', 'newest'] as const;
  const sortParam = searchParams.get('sort') ?? 'relevance';
  const sortBy = (validSorts as readonly string[]).includes(sortParam)
    ? (sortParam as (typeof validSorts)[number])
    : 'relevance';

  const categoryParam = searchParams.get('category');
  const listingCategory = (LISTING_CATEGORY_OPTIONS as readonly string[]).includes(categoryParam ?? '')
    ? (categoryParam as (typeof LISTING_CATEGORY_OPTIONS)[number])
    : 'For Sale';

  return { filters, sortBy, listingCategory };
}

export default function Listings() {
  const navigate = useNavigate();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [geocodedLocationCache, setGeocodedLocationCache] = useState<Record<string, { lat: number; lng: number } | null>>({});
  const [isGeocodingMap, setIsGeocodingMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [showTopMoreFilters, setShowTopMoreFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "price-low-high" | "price-high-low" | "newest">("relevance");
  const [isListening, setIsListening] = useState(false);
  const [voiceSearchText, setVoiceSearchText] = useState("");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false);
  const [showListingCategoryDropdown, setShowListingCategoryDropdown] = useState(false);
  const [listingCategory, setListingCategory] = useState<(typeof LISTING_CATEGORY_OPTIONS)[number]>('For Sale');
  const [showMinPriceDropdown, setShowMinPriceDropdown] = useState(false);
  const [showMaxPriceDropdown, setShowMaxPriceDropdown] = useState(false);
  const [showBedroomsDropdown, setShowBedroomsDropdown] = useState(false);
  const [showBathroomsDropdown, setShowBathroomsDropdown] = useState(false);
  const [showParkingDropdown, setShowParkingDropdown] = useState(false);
  const [showFloorSizeDropdown, setShowFloorSizeDropdown] = useState(false);
  const [showErfSizeDropdown, setShowErfSizeDropdown] = useState(false);
  const [showCustomMinPrice, setShowCustomMinPrice] = useState(false);
  const [showCustomMaxPrice, setShowCustomMaxPrice] = useState(false);
  const [showCustomFloorSize, setShowCustomFloorSize] = useState(false);
  const [showCustomErfSize, setShowCustomErfSize] = useState(false);
  const [customMinPriceInput, setCustomMinPriceInput] = useState('');
  const [customMaxPriceInput, setCustomMaxPriceInput] = useState('');
  const [customFloorSizeInput, setCustomFloorSizeInput] = useState('');
  const [customErfSizeInput, setCustomErfSizeInput] = useState('');

  const [pendingFilters, setPendingFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  const [properties, setProperties] = useState<ListingCard[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<string>>(new Set());
  const [savingPropertyIds, setSavingPropertyIds] = useState<Set<string>>(new Set());
  const [featuredAgents, setFeaturedAgents] = useState<FeaturedAgentCard[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const offerPropertyIds = useMyOfferPropertyIds();

  // ── Current user (for "Initiate Sale" button on own listings) ────────────
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  // SR-001: wider padding for anonymous visitors; defaults to true (SSR-safe)
  const [isAnonymous, setIsAnonymous] = useState(true);
  // Map of propertyId → active Sale (populated for own listings once user loads)
  const [propertySaleMap, setPropertySaleMap] = useState<Record<string, Sale>>({});
  const [initiateCardProp, setInitiateCardProp] = useState<{ id: string; title: string; price: number; currency: string } | null>(null);
  const [initCardAgreedPrice, setInitCardAgreedPrice] = useState('');
  const [initCardCurrency, setInitCardCurrency] = useState('ZAR');
  const [initCardBuyerId, setInitCardBuyerId] = useState('');
  const [initCardDeposit, setInitCardDeposit] = useState('');
  const [submittingInitCard, setSubmittingInitCard] = useState(false);
  const [initCardError, setInitCardError] = useState<string | null>(null);
  const [agentsError, setAgentsError] = useState("");
  // ── Multi-agent listing dialog ───────────────────────────────────────────
  const [multiListingDialogOpen, setMultiListingDialogOpen] = useState(false);
  const [selectedMultiListings, setSelectedMultiListings] = useState<MultiListingItem[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Pre-computed stable heights for the voice-search waveform visualisation.
  // Using useMemo (no deps) so the values are identical on server and client.
  const waveBarHeights = useMemo(
    () => ['h-8', 'h-11', 'h-5', 'h-10', 'h-7', 'h-13', 'h-9', 'h-6', 'h-12', 'h-8', 'h-11', 'h-7'],
    []
  );

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startVoiceRecognition = () => {
    setVoiceStatusMessage("");

    const isSecureOrigin =
      window.isSecureContext
      || window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1';

    if (!isSecureOrigin) {
      setIsListening(false);
      setVoiceStatusMessage('Voice search requires HTTPS (or localhost). Open this app on a secure origin and try again.');
      return;
    }

    const SpeechRecognitionImpl =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setIsListening(false);
      setVoiceStatusMessage('Voice recognition is not available in this browser. Try recent Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-ZA";

    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex]?.[0]?.transcript?.trim() ?? "";
      if (!transcript) {
        return;
      }

      setVoiceSearchText(transcript);
      const parsed = buildVoiceSearchResult(transcript);
      setAiSuggestions(parsed.suggestions);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceStatusMessage('Microphone access was blocked. Enable mic permission for this site and retry.');
        return;
      }

      if (event.error === 'no-speech') {
        setVoiceStatusMessage('No speech detected. Try speaking clearly and a bit closer to the microphone.');
        return;
      }

      if (event.error === 'audio-capture') {
        setVoiceStatusMessage('No microphone was detected. Connect a mic and try again.');
        return;
      }

      setVoiceStatusMessage('Could not capture voice input. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleVoiceSearch = () => {
    setVoiceSearchText("");
    setAiSuggestions([]);
    setVoiceStatusMessage("");
    setShowVoiceModal(true);
    startVoiceRecognition();
  };

  const handleApplyVoiceSearch = () => {
    const normalizedQuery = voiceSearchText.trim();
    if (!normalizedQuery) {
      setShowVoiceModal(false);
      return;
    }

    const parsed = buildVoiceSearchResult(normalizedQuery);
    setPendingFilters(parsed.filters);
    setAppliedFilters(parsed.filters);
    setLocationInput("");
    setAiSuggestions(parsed.suggestions);
    setShowVoiceModal(false);
    stopVoiceRecognition();
  };

  useEffect(() => () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters(pendingFilters);
    setShowFilters(false);
  };

  const applyInsightsPropertyTypeFilter = (type: keyof ListingsFilters['propertyTypes']) => {
    const nextPropertyTypes = {
      ...getDefaultFilters().propertyTypes,
      [type]: true,
    };

    setPendingFilters((prev) => ({
      ...prev,
      propertyTypes: nextPropertyTypes,
    }));

    setAppliedFilters((prev) => ({
      ...prev,
      propertyTypes: nextPropertyTypes,
    }));

    setShowFilters(false);
  };

  const selectedPropertyTypeCount = useMemo(
    () => Object.values(pendingFilters.propertyTypes).filter(Boolean).length,
    [pendingFilters.propertyTypes],
  );

  const minPriceLabel = useMemo(() => {
    const value = Number(pendingFilters.minPrice);
    if (!Number.isFinite(value) || value <= 0) {
      return 'Min Price';
    }
    return formatRandValue(value);
  }, [pendingFilters.minPrice]);

  const maxPriceLabel = useMemo(() => {
    const value = Number(pendingFilters.maxPrice);
    if (!Number.isFinite(value) || value <= 0) {
      return 'Max Price';
    }
    return formatRandValue(value);
  }, [pendingFilters.maxPrice]);

  const bedroomsLabel = useMemo(() => {
    if (pendingFilters.minBedrooms <= 0) {
      return 'Bedrooms';
    }
    return `${pendingFilters.minBedrooms}+`;
  }, [pendingFilters.minBedrooms]);

  const bathroomsLabel = useMemo(() => {
    if (pendingFilters.minBathrooms <= 0) {
      return 'Bathrooms';
    }
    return `${pendingFilters.minBathrooms}+`;
  }, [pendingFilters.minBathrooms]);

  const parkingLabel = useMemo(() => {
    if (pendingFilters.minGarage <= 0) {
      return 'Parking / Garage';
    }
    return `${pendingFilters.minGarage}+`;
  }, [pendingFilters.minGarage]);

  const floorSizeLabel = useMemo(() => {
    const value = Number(pendingFilters.minFloorSize);
    if (!Number.isFinite(value) || value <= 0) {
      return 'Floor Size (m²)';
    }
    return formatSquareMeters(value);
  }, [pendingFilters.minFloorSize]);

  const erfSizeLabel = useMemo(() => {
    const value = Number(pendingFilters.minErfSize);
    if (!Number.isFinite(value) || value <= 0) {
      return 'Erf Size (m²)';
    }
    return formatSquareMeters(value);
  }, [pendingFilters.minErfSize]);

  const handleTopSearch = () => {
    const normalizedLocation = locationInput.trim();

    // Require at least something in the search bar (typed text or already-added location tags)
    if (!normalizedLocation && pendingFilters.locations.length === 0) {
      setSearchError("Please enter a location or area to search.");
      return;
    }

    setSearchError("");
    let nextFilters = pendingFilters;

    if (normalizedLocation.length > 0) {
      const matchedSuggestion = LOCATION_SUGGESTIONS.find(
        (location) => location.toLowerCase() === normalizedLocation.toLowerCase(),
      );
      const nextLocation = matchedSuggestion ?? normalizedLocation;

      const exists = pendingFilters.locations.some(
        (location) => location.toLowerCase() === nextLocation.toLowerCase(),
      );

      if (!exists) {
        nextFilters = {
          ...pendingFilters,
          locations: [...pendingFilters.locations, nextLocation],
        };
      }

      setLocationInput('');
      setShowLocationSuggestions(false);
    }

    if (nextFilters !== pendingFilters) {
      setPendingFilters(nextFilters);
    }

    setAppliedFilters(nextFilters);
    setShowFilters(false);
    setHasSearched(true);
  };

  const openMinPriceDropdown = () => {
    setShowCustomMinPrice(false);
    setShowMinPriceDropdown((prev) => !prev);
    setShowMaxPriceDropdown(false);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowFloorSizeDropdown(false);
    setShowErfSizeDropdown(false);
  };

  const openMaxPriceDropdown = () => {
    setShowCustomMaxPrice(false);
    setShowMaxPriceDropdown((prev) => !prev);
    setShowMinPriceDropdown(false);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowFloorSizeDropdown(false);
    setShowErfSizeDropdown(false);
  };

  const openBedroomsDropdown = () => {
    setShowBedroomsDropdown((prev) => !prev);
    setShowBathroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowFloorSizeDropdown(false);
    setShowErfSizeDropdown(false);
    setShowMinPriceDropdown(false);
    setShowMaxPriceDropdown(false);
  };

  const openBathroomsDropdown = () => {
    setShowBathroomsDropdown((prev) => !prev);
    setShowBedroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowFloorSizeDropdown(false);
    setShowErfSizeDropdown(false);
    setShowMinPriceDropdown(false);
    setShowMaxPriceDropdown(false);
  };

  const openParkingDropdown = () => {
    setShowParkingDropdown((prev) => !prev);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowFloorSizeDropdown(false);
    setShowErfSizeDropdown(false);
    setShowMinPriceDropdown(false);
    setShowMaxPriceDropdown(false);
  };

  const openFloorSizeDropdown = () => {
    setShowCustomFloorSize(false);
    setShowFloorSizeDropdown((prev) => !prev);
    setShowErfSizeDropdown(false);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowMinPriceDropdown(false);
    setShowMaxPriceDropdown(false);
  };

  const openErfSizeDropdown = () => {
    setShowCustomErfSize(false);
    setShowErfSizeDropdown((prev) => !prev);
    setShowFloorSizeDropdown(false);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowMinPriceDropdown(false);
    setShowMaxPriceDropdown(false);
  };

  const selectFloorSize = (value: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      minFloorSize: value,
    }));
    setShowFloorSizeDropdown(false);
  };

  const selectErfSize = (value: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      minErfSize: value,
    }));
    setShowErfSizeDropdown(false);
  };



  const handleResetFilters = () => {
    const defaults = getDefaultFilters();
    setLocationInput("");
    setPendingFilters(defaults);
    setAppliedFilters(defaults);
    setShowCustomMinPrice(false);
    setShowCustomMaxPrice(false);
    setShowCustomFloorSize(false);
    setShowCustomErfSize(false);
    setCustomMinPriceInput('');
    setCustomMaxPriceInput('');
    setCustomFloorSizeInput('');
    setCustomErfSizeInput('');
  };

  const addPendingLocation = (locationValue?: string) => {
    const normalized = (locationValue ?? locationInput).trim();
    if (!normalized) {
      return;
    }

    const matchedSuggestion = LOCATION_SUGGESTIONS.find(
      (location) => location.toLowerCase() === normalized.toLowerCase(),
    );
    const nextLocation = matchedSuggestion ?? normalized;

    setPendingFilters((prev) => {
      const exists = prev.locations.some(
        (location) => location.toLowerCase() === nextLocation.toLowerCase(),
      );

      if (exists) {
        return prev;
      }

      return {
        ...prev,
        locations: [...prev.locations, nextLocation],
      };
    });

    setLocationInput("");
    setShowLocationSuggestions(false);
  };

  const removePendingLocation = (locationToRemove: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      locations: prev.locations.filter((location) => location !== locationToRemove),
    }));
  };

  const locationSuggestions = useMemo(() => {
    const normalizedInput = locationInput.trim().toLowerCase();
    const selectedLocations = new Set(
      pendingFilters.locations.map((location) => location.toLowerCase()),
    );

    return LOCATION_SUGGESTIONS.filter((location) => {
      const lower = location.toLowerCase();
      if (selectedLocations.has(lower)) {
        return false;
      }

      if (!normalizedInput) {
        return true;
      }

      return lower.includes(normalizedInput);
    }).slice(0, 6);
  }, [locationInput, pendingFilters.locations]);

  // Load current user ID once, then non-blockingly load any existing sales
  useEffect(() => {
    const user = getStoredUser();
    setCurrentUserId(user?.id ?? null);
    setCurrentCompanyId(getActiveCompanyIdFromToken());
    const token = getAccessToken();
    setIsAnonymous(!token);
    if (!token) return;
    salesApi.getMySales(token).then((sales) => {
      const map: Record<string, Sale> = {};
      for (const sale of sales) {
        if (sale.status !== 'cancelled') {
          map[sale.propertyId] = sale;
        }
      }
      setPropertySaleMap(map);
    }).catch(() => { /* non-critical */ });
  }, []);

  const handleInitCardSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initiateCardProp) return;
    const token = getAccessToken();
    if (!token) { setInitCardError('Please log in to continue.'); return; }
    const user = getStoredUser();
    if (!user?.id) { setInitCardError('Session expired — please log in again.'); return; }
    setSubmittingInitCard(true);
    setInitCardError(null);
    try {
      const sale = await salesApi.create(token, {
        propertyId: initiateCardProp.id,
        sellerId: user.id,
        buyerId: initCardBuyerId.trim() || undefined,
        agreedPrice: Number(initCardAgreedPrice),
        currency: initCardCurrency,
        ...(initCardDeposit ? { depositAmount: Number(initCardDeposit) } : {}),
      });
      setInitiateCardProp(null);
      navigate(`/workspace/${sale.id}`);
    } catch (err) {
      setInitCardError(err instanceof Error ? err.message : 'Failed to initiate sale.');
    } finally {
      setSubmittingInitCard(false);
    }
  };

  const handleAddToFavourites = async (propertyId: string) => {
    const token = getAccessToken();
    if (!token) {
      const query = searchParams.toString();
      const currentPath = `${pathname}${query ? `?${query}` : ''}`;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (savingPropertyIds.has(propertyId)) {
      return; // Already in-flight
    }

    setSavingPropertyIds((prev) => new Set(prev).add(propertyId));

    try {
      const isSaved = savedPropertyIds.has(propertyId);
      if (isSaved) {
        await propertiesApi.unsave(token, propertyId);
        setSavedPropertyIds((prev) => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      } else {
        await propertiesApi.save(token, propertyId);
        setSavedPropertyIds((prev) => new Set(prev).add(propertyId));
      }
    } catch {
      // Non-critical — silently ignore
    } finally {
      setSavingPropertyIds((prev) => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });
    }
  };

  useEffect(() => {
    const loadProperties = async () => {
      setIsLoadingProperties(true);
      setPropertiesError("");

      try {
        let response;

        try {
          response = await propertiesApi.search({
            sort: "newest",
            limit: 100,
          });
        } catch (error) {
          if (
            error instanceof ApiError
            && error.status !== 400
            && error.status !== 422
          ) {
            throw error;
          }

          response = await propertiesApi.search({
            limit: 100,
          });
        }

        const rawListings = Array.isArray(response.data) ? response.data : [];
        const uniqueAgentIds = Array.from(
          new Set(
            rawListings
              .map((listing) => listing.agent_id)
              .filter((agentId): agentId is string => typeof agentId === 'string' && agentId.length > 0),
          ),
        );

        const agentProfilesById = new Map<string, AgentProfileResponse>();

        if (uniqueAgentIds.length > 0) {
          const profileResults = await Promise.all(
            uniqueAgentIds.map(async (agentId) => {
              try {
                const profile = await propertiesApi.getAgentProfile(agentId);
                return [agentId, profile] as const;
              } catch {
                return null;
              }
            }),
          );

          profileResults.forEach((entry) => {
            if (entry) {
              agentProfilesById.set(entry[0], entry[1]);
            }
          });
        }

        const mappedListings = rawListings
          .map((listing) => {
            try {
              const agentProfile = listing.agent_id ? agentProfilesById.get(listing.agent_id) : undefined;
              return mapPropertyToListingCard(listing, agentProfile);
            } catch {
              return null;
            }
          })
          .filter((listing): listing is ListingCard => listing !== null);

        setProperties(mappedListings);

        if (rawListings.length > 0 && mappedListings.length === 0) {
          setPropertiesError("Unable to render listings due to unexpected listing data.");
        }
      } catch {
        setProperties([]);
        setPropertiesError("Unable to load listings from database right now.");
      } finally {
        setIsLoadingProperties(false);
      }
    };

    void loadProperties();
  }, []);

  // Load saved property IDs for the currently-logged-in user (non-blocking)
  useEffect(() => {
    const loadSavedProperties = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const result = await propertiesApi.getSavedProperties(token);
        const ids = new Set<string>(result.data.map((p) => p.id));
        setSavedPropertyIds(ids);
      } catch {
        // Non-critical — user may not be logged in
      }
    };

    void loadSavedProperties();
  }, []);

  // Load featured agents whenever Estate Agencies category is selected
  useEffect(() => {
    if (listingCategory !== 'Estate Agencies' || !hasSearched) return;

    const loadAgents = async () => {
      setIsLoadingAgents(true);
      setAgentsError("");
      try {
        const data = await propertiesApi.getFeaturedAgents(40);
        setFeaturedAgents(data);
      } catch {
        setAgentsError("Unable to load estate agents right now.");
      } finally {
        setIsLoadingAgents(false);
      }
    };

    void loadAgents();
  }, [listingCategory, hasSearched]);

  // Initialise filters: URL params take priority (enables shareable URLs and back-navigation filter preservation);
  // falls back to sessionStorage on direct visits without params.
  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    if (fromUrl) {
      setAppliedFilters(fromUrl.filters);
      setPendingFilters(fromUrl.filters);
      setSortBy(fromUrl.sortBy);
      setListingCategory(fromUrl.listingCategory);
      setHasSearched(true);
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(LISTINGS_VIEW_STATE_KEY);
      if (!raw) {
        return;
      }

      const restored = JSON.parse(raw) as Partial<ListingsViewState>;
      if (restored.viewMode) setViewMode(restored.viewMode);
      if (typeof restored.showDesktopFilters === 'boolean') setShowDesktopFilters(restored.showDesktopFilters);
      if (restored.sortBy) setSortBy(restored.sortBy);
      if (restored.pendingFilters) setPendingFilters(restored.pendingFilters as ListingsFilters);
      if (restored.appliedFilters) setAppliedFilters(restored.appliedFilters as ListingsFilters);
    } catch {
      // Ignore malformed persisted state.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const state: ListingsViewState = {
      viewMode,
      showDesktopFilters,
      sortBy,
      pendingFilters,
      appliedFilters,
    };

    window.sessionStorage.setItem(LISTINGS_VIEW_STATE_KEY, JSON.stringify(state));
  }, [viewMode, showDesktopFilters, sortBy, pendingFilters, appliedFilters]);

  // Keep the URL in sync with applied filters so links to property details carry the full filter state back.
  useEffect(() => {
    if (!hasSearched) return;
    const params = filtersToSearchParams(appliedFilters, sortBy, listingCategory);
    const paramsString = params.toString();
    const newUrl = `${pathname}${paramsString ? `?${paramsString}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [appliedFilters, hasSearched, sortBy, listingCategory, pathname, router]);

  const parsePrice = (price: string) =>
    Number(price.replace(/[^\d]/g, ''));

  const parsePriceInput = (value: string) => {
    const normalized = Number(value.replace(/[^\d]/g, ''));
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return null;
    }
    return normalized;
  };

  const parseNumberInput = (value: string) => {
    const normalized = Number(value.replace(/[^\d]/g, ''));
    if (!Number.isFinite(normalized) || normalized < 0) {
      return null;
    }
    return normalized;
  };

  const filteredProperties = useMemo(() => {
    const minPrice = parsePriceInput(appliedFilters.minPrice);
    const maxPrice = parsePriceInput(appliedFilters.maxPrice);
    const minFloorSize = parseNumberInput(appliedFilters.minFloorSize);
    const minErfSize = parseNumberInput(appliedFilters.minErfSize);

    const selectedPropertyTypes = Object.entries(appliedFilters.propertyTypes)
      .filter(([, selected]) => selected)
      .map(([type]) => type as keyof ListingsFilters['propertyTypes']);

    const selectedLocations = appliedFilters.locations
      .map((location) => location.trim().toLowerCase())
      .filter(Boolean);

    const selectedFeatures = Object.entries(appliedFilters.features)
      .filter(([, selected]) => selected)
      .map(([feature]) => feature);

    const selectedOther = Object.entries(appliedFilters.other)
      .filter(([, selected]) => selected)
      .map(([filterName]) => filterName);

    return properties.filter((property) => {
      const propertyPrice = parsePrice(property.price);
      const locationLower = property.location.toLowerCase();
      const titleLower = property.title.toLowerCase();
      const propertyFeaturesLower = property.features.map((feature) => feature.toLowerCase());
      const isTownhouse = titleLower.includes('townhouse') || propertyFeaturesLower.includes('townhouse');
      const isFarm = titleLower.includes('farm') || propertyFeaturesLower.includes('farm');
      const isIndustrial = titleLower.includes('industrial') || propertyFeaturesLower.includes('industrial');

      // Filter by listing category (For Sale vs To Rent)
      if (listingCategory === 'To Rent' && property.listingType !== 'to_rent') {
        return false;
      }
      if (listingCategory === 'For Sale' && property.listingType === 'to_rent') {
        return false;
      }

      if (appliedFilters.verifiedOnly && !property.verified) {
        return false;
      }

      if (selectedPropertyTypes.length > 0) {
        const matchesHouse = property.propertyType === 'house' && !isTownhouse && selectedPropertyTypes.includes('house');
        const matchesTownhouse = property.propertyType === 'house' && isTownhouse && selectedPropertyTypes.includes('townhouse');
        const matchesApartment = property.propertyType === 'apartment' && selectedPropertyTypes.includes('apartment');
        const matchesLand = property.propertyType === 'land' && !isFarm && selectedPropertyTypes.includes('land');
        const matchesFarm = property.propertyType === 'land' && isFarm && selectedPropertyTypes.includes('farm');
        const matchesCommercial = property.propertyType === 'commercial' && !isIndustrial && selectedPropertyTypes.includes('commercial');
        const matchesIndustrial = property.propertyType === 'commercial' && isIndustrial && selectedPropertyTypes.includes('industrial');
        const matchesPropertyType =
          matchesHouse
          || matchesTownhouse
          || matchesApartment
          || matchesLand
          || matchesFarm
          || matchesCommercial
          || matchesIndustrial;

        if (!matchesPropertyType) {
          return false;
        }
      }

      if (selectedLocations.length > 0) {
        const matchesLocation = selectedLocations.some((location) =>
          locationLower.includes(location),
        );

        if (!matchesLocation) {
          return false;
        }
      }

      if (minPrice !== null && propertyPrice < minPrice) {
        return false;
      }

      if (maxPrice !== null && propertyPrice > maxPrice) {
        return false;
      }

      if (property.beds < appliedFilters.minBedrooms) {
        return false;
      }

      if (property.baths < appliedFilters.minBathrooms) {
        return false;
      }

      if (property.garage < appliedFilters.minGarage) {
        return false;
      }

      if (minFloorSize !== null && property.sqm < minFloorSize) {
        return false;
      }

      if (minErfSize !== null && property.sqm < minErfSize) {
        return false;
      }

      if (selectedOther.includes('onShow') && property.status !== 'active') {
        return false;
      }

      if (selectedOther.includes('retirement') && !propertyFeaturesLower.includes('retirement')) {
        return false;
      }

      if (selectedOther.includes('repossessed') && !propertyFeaturesLower.includes('repossessed')) {
        return false;
      }

      if (selectedOther.includes('auction') && !propertyFeaturesLower.includes('auction')) {
        return false;
      }

      if (
        selectedFeatures.length > 0
        && !selectedFeatures.every((feature) => {
          if (feature === 'security') {
            return propertyFeaturesLower.some((value) =>
              value.includes('security') || value.includes('gated') || value.includes('cluster'),
            );
          }

          return propertyFeaturesLower.includes(feature.toLowerCase());
        })
      ) {
        return false;
      }

      return true;
    });
  }, [appliedFilters, properties, listingCategory]);

  const sortedProperties = useMemo(() => {
    if (sortBy === 'relevance') {
      return filteredProperties;
    }

    const list = [...filteredProperties];

    if (sortBy === 'price-low-high') {
      return list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    }

    if (sortBy === 'price-high-low') {
      return list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [sortBy, filteredProperties]);

  // Category-aware view: 'To Rent' applies a keyword filter; all others show the full sorted list
  const displayedProperties = useMemo(() => {
    if (listingCategory === 'To Rent') {
      const filtered = sortedProperties.filter(
        (p) =>
          p.title.toLowerCase().includes('rent') ||
          p.features.some((f) => f.toLowerCase().includes('rent')),
      );
      return filtered;
    }
    return sortedProperties;
  }, [listingCategory, sortedProperties]);

  // ── Group listings by address to detect multi-agent listings ─────────────
  const multiListingGroups = useMemo(() => {
    const groups = new Map<string, ListingCard[]>();
    for (const p of displayedProperties) {
      if (!p.addressLine1) continue;
      const key = `${p.addressLine1.trim().toLowerCase()}|${(p.addressCity ?? '').trim().toLowerCase()}`;
      const group = groups.get(key);
      if (group) {
        group.push(p);
      } else {
        groups.set(key, [p]);
      }
    }
    // Only keep groups with 2+ listings (multi-agent)
    const result = new Map<string, ListingCard[]>();
    for (const [key, group] of groups) {
      if (group.length >= 2) result.set(key, group);
    }
    return result;
  }, [displayedProperties]);

  // Quick lookup: propertyId → number of agencies for this address
  const multiListingCountById = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const group of multiListingGroups.values()) {
      for (const p of group) {
        countMap.set(p.id, group.length);
      }
    }
    return countMap;
  }, [multiListingGroups]);

  // Deduplicated display list: for multi-agent groups, show only the first listing
  const deduplicatedProperties = useMemo(() => {
    const shownAddressKeys = new Set<string>();
    return displayedProperties.filter((p) => {
      if (!p.addressLine1) return true;
      const key = `${p.addressLine1.trim().toLowerCase()}|${(p.addressCity ?? '').trim().toLowerCase()}`;
      if (!multiListingGroups.has(key)) return true;
      if (shownAddressKeys.has(key)) return false;
      shownAddressKeys.add(key);
      return true;
    });
  }, [displayedProperties, multiListingGroups]);

  // ── Handlers for multi-listing dialog ────────────────────────────────────
  function openMultiListingDialog(property: ListingCard) {
    const key = `${(property.addressLine1 ?? '').trim().toLowerCase()}|${(property.addressCity ?? '').trim().toLowerCase()}`;
    const group = multiListingGroups.get(key) ?? [property];
    setSelectedMultiListings(group.map((p) => ({
      id: p.id,
      title: p.title,
      location: p.location,
      addressLine1: p.addressLine1,
      price: p.price,
      beds: p.beds,
      baths: p.baths,
      garage: p.garage,
      garages: p.garages,
      carports: p.carports,
      sqm: p.sqm,
      propertyType: p.propertyType,
      image: p.image,
      agent: p.agent,
      agentCompany: p.agentCompany,
      agentAvatarUrl: p.agentAvatarUrl,
      agentCompanyLogoUrl: p.agentCompanyLogoUrl,
      agentCompanyBrandColor: p.agentCompanyBrandColor,
      isPrivateListing: p.isPrivateListing,
    })));
    setMultiListingDialogOpen(true);
  }

  function handleMultiListingSelect(id: string) {
    setMultiListingDialogOpen(false);
    navigate(`/app/property/${id}?back=${encodeURIComponent(listingsBackUrl)}`);
  }

  // Geocode unique location strings for properties that lack stored coordinates
  useEffect(() => {
    const propertiesWithoutCoords = displayedProperties.filter(
      (p) => p.latitude === null || p.longitude === null,
    );
    const uniqueLocations = [...new Set(
      propertiesWithoutCoords
        .map((p) => p.location)
        .filter((loc) => loc && loc !== 'Location unavailable'),
    )];
    const uncached = uniqueLocations.filter((loc) => !(loc in geocodedLocationCache));
    if (uncached.length === 0) return;

    let cancelled = false;
    setIsGeocodingMap(true);

    const nominatimSearch = async (query: string): Promise<Array<{ lat: string; lon: string }>> => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'pribec-property-platform/1.0' } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Array<{ lat: string; lon: string }>>;
    };

    void (async () => {
      const results: Record<string, { lat: number; lng: number } | null> = {};
      for (const loc of uncached) {
        if (cancelled) break;
        try {
          // Deduplicate consecutive parts e.g. "Harare, Harare, ZW" → "Harare, ZW"
          const deduped = loc.split(', ').filter((p, i, a) => p !== a[i - 1]).join(', ');
          let data = await nominatimSearch(deduped);
          if (data.length === 0) {
            const parts = deduped.split(', ');
            const shortQuery = parts.slice(-2).join(', ');
            if (shortQuery !== deduped) data = await nominatimSearch(shortQuery);
          }
          const first = data[0];
          results[loc] = first ? { lat: parseFloat(first.lat), lng: parseFloat(first.lon) } : null;
        } catch {
          results[loc] = null;
        }
      }
      if (!cancelled) {
        setGeocodedLocationCache((prev) => ({ ...prev, ...results }));
        setIsGeocodingMap(false);
      }
    })();
    return () => { cancelled = true; setIsGeocodingMap(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedProperties]);

  const mapPoints = useMemo<MapPoint[]>(() => {
    return displayedProperties
      .map((property) => {
        const lat = property.latitude ?? geocodedLocationCache[property.location]?.lat ?? null;
        const lng = property.longitude ?? geocodedLocationCache[property.location]?.lng ?? null;
        if (lat === null || lng === null) return null;
        return {
          id: property.id,
          title: property.title,
          price: property.price,
          latitude: lat,
          longitude: lng,
        };
      })
      .filter((p): p is MapPoint => p !== null);
  }, [displayedProperties, geocodedLocationCache]);

  const mapViewport = useMemo(() => {
    return buildMapViewport(mapPoints);
  }, [mapPoints]);

  const mapSource = useMemo(() => {
    return buildViewportMapSource({
      points: mapPoints,
      viewport: mapViewport,
      mapboxToken: MAPBOX_TOKEN,
    });
  }, [mapPoints, mapViewport]);

  const mapPins = useMemo(() => {
    if (!mapViewport) {
      return [];
    }

    const latRange = mapViewport.maxLatitude - mapViewport.minLatitude || 1;
    const lonRange = mapViewport.maxLongitude - mapViewport.minLongitude || 1;

    return mapPoints.map((point) => {
      const left = ((point.longitude - mapViewport.minLongitude) / lonRange) * 100;
      const top = ((mapViewport.maxLatitude - point.latitude) / latRange) * 100;
      const boundedLeft = Math.max(4, Math.min(96, left));
      const boundedTop = Math.max(6, Math.min(94, top));

      return {
        ...point,
        positionClass: `${percentToPositionClass(boundedLeft, MAP_PIN_LEFT_CLASSES)} ${percentToPositionClass(boundedTop, MAP_PIN_TOP_CLASSES)}`,
      };
    });
  }, [mapPoints, mapViewport]);

  const fraudFlaggedCount = useMemo(
    () => properties.filter((property) => property.fraudFlagged).length,
    [properties],
  );

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];

    if (appliedFilters.propertyTypes.house) badges.push('House');
    if (appliedFilters.propertyTypes.apartment) badges.push('Apartment / Flat');
    if (appliedFilters.propertyTypes.townhouse) badges.push('Townhouse');
    if (appliedFilters.propertyTypes.land) badges.push('Vacant Land / Plot');
    if (appliedFilters.propertyTypes.farm) badges.push('Farm');
    if (appliedFilters.propertyTypes.commercial) badges.push('Commercial Property');
    if (appliedFilters.propertyTypes.industrial) badges.push('Industrial Property');

    appliedFilters.locations.forEach((location) => badges.push(location));

    if (appliedFilters.verifiedOnly) badges.push('Verified Only');

    const minPrice = parsePriceInput(appliedFilters.minPrice);
    const maxPrice = parsePriceInput(appliedFilters.maxPrice);
    if (minPrice !== null || maxPrice !== null) {
      const minLabel = minPrice !== null ? formatRandValue(minPrice) : 'Any';
      const maxLabel = maxPrice !== null ? formatRandValue(maxPrice) : 'Any';
      badges.push(`${minLabel} – ${maxLabel}`);
    }

    if (appliedFilters.minBedrooms > 0) badges.push(`${appliedFilters.minBedrooms}+ Beds`);
    if (appliedFilters.minBathrooms > 0) badges.push(`${appliedFilters.minBathrooms}+ Baths`);
    if (appliedFilters.minGarage > 0) badges.push(`${appliedFilters.minGarage}+ Garage`);

    const minFloorSize = parseNumberInput(appliedFilters.minFloorSize);
    if (minFloorSize !== null && minFloorSize > 0) badges.push(`${minFloorSize}+ m² Floor`);

    const minErfSize = parseNumberInput(appliedFilters.minErfSize);
    if (minErfSize !== null && minErfSize > 0) badges.push(`${minErfSize}+ m² Erf`);

    if (appliedFilters.features.flatlet) badges.push('Flatlet');
    if (appliedFilters.other.retirement) badges.push('Retirement');
    if (appliedFilters.other.onShow) badges.push('On Show');
    if (appliedFilters.other.repossessed) badges.push('Repossessed');
    if (appliedFilters.other.auction) badges.push('Auction');

    return badges;
  }, [appliedFilters]);

  const insightsSingleLocation = useMemo(() => {
    const selectedLocations = appliedFilters.locations.filter((location) => location.trim().length > 0);

    if (selectedLocations.length === 1) {
      return selectedLocations[0];
    }

    if (selectedLocations.length > 1) {
      return null;
    }

    const visibleLocations = new Set<string>();
    sortedProperties.forEach((property) => {
      const primaryLocation = property.location.split(',')[0]?.trim();
      if (primaryLocation) {
        visibleLocations.add(primaryLocation);
      }
    });

    if (visibleLocations.size === 1) {
      return Array.from(visibleLocations)[0];
    }

    return null;
  }, [appliedFilters.locations, sortedProperties]);

  const insightsTrendsHeading = useMemo(() => {
    return insightsSingleLocation ? `${insightsSingleLocation} Trends` : 'Trends';
  }, [insightsSingleLocation]);

  const insightsPropertyForSaleHeading = useMemo(() => {
    return insightsSingleLocation ? `${insightsSingleLocation} Property for Sale` : 'Property for Sale';
  }, [insightsSingleLocation]);

  const insightsLocationSuffix = insightsSingleLocation ? ` in ${insightsSingleLocation}` : '';

  const insightsTypeCounts = useMemo(() => {
    const counts = {
      house: 0,
      apartment: 0,
      townhouse: 0,
      land: 0,
      farm: 0,
      commercial: 0,
      industrial: 0,
    };

    sortedProperties.forEach((property) => {
      const titleLower = property.title.toLowerCase();
      const featuresLower = property.features.map((feature) => feature.toLowerCase());

      const isTownhouse = titleLower.includes('townhouse') || featuresLower.includes('townhouse');
      const isFarm = titleLower.includes('farm') || featuresLower.includes('farm');
      const isIndustrial = titleLower.includes('industrial') || featuresLower.includes('industrial');

      if (property.propertyType === 'house') {
        if (isTownhouse) {
          counts.townhouse += 1;
        } else {
          counts.house += 1;
        }
        return;
      }

      if (property.propertyType === 'apartment') {
        counts.apartment += 1;
        return;
      }

      if (property.propertyType === 'land') {
        if (isFarm) {
          counts.farm += 1;
        } else {
          counts.land += 1;
        }
        return;
      }

      if (property.propertyType === 'commercial') {
        if (isIndustrial) {
          counts.industrial += 1;
        } else {
          counts.commercial += 1;
        }
      }
    });

    return counts;
  }, [sortedProperties]);

  const insightsAveragePrice = useMemo(() => {
    if (sortedProperties.length === 0) {
      return 0;
    }

    const total = sortedProperties.reduce((sum, property) => sum + parsePrice(property.price), 0);
    return total / sortedProperties.length;
  }, [sortedProperties]);

  const insightsTrend = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, idx) => currentYear - 4 + idx);

    const byYear = new Map<number, number[]>();
    sortedProperties.forEach((property) => {
      const year = new Date(property.createdAt).getFullYear();
      if (!byYear.has(year)) {
        byYear.set(year, []);
      }
      byYear.get(year)?.push(parsePrice(property.price));
    });

    const fallbackBase = insightsAveragePrice > 0 ? insightsAveragePrice : 1_500_000;

    const values = years.map((year, idx) => {
      const prices = byYear.get(year) ?? [];
      if (prices.length > 0) {
        return prices.reduce((sum, value) => sum + value, 0) / prices.length;
      }
      return fallbackBase * (0.88 + idx * 0.04);
    });

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);

    const points = values.map((value, idx) => {
      const x = (idx / Math.max(1, values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return { x, y, value, year: years[idx] };
    });

    return {
      years,
      points,
      latestValue: values[values.length - 1] ?? fallbackBase,
    };
  }, [sortedProperties, insightsAveragePrice]);

  const insightsAvgPricePerSqm = useMemo(() => {
    const withSqm = sortedProperties.filter((p) => p.sqm > 0 && p.rawPrice > 0);
    if (withSqm.length === 0) return 0;
    const total = withSqm.reduce((sum, p) => sum + p.rawPrice / p.sqm, 0);
    return Math.round(total / withSqm.length);
  }, [sortedProperties]);

  const insightsPriceHistogram = useMemo(() => {
    if (sortedProperties.length < 3) return null;
    const prices = sortedProperties.map((p) => p.rawPrice).filter((p) => p > 0).sort((a, b) => a - b);
    if (prices.length < 3) return null;
    const min = prices[0]!;
    const max = prices[prices.length - 1]!;
    if (max === min) return null;
    const bucketCount = Math.min(8, Math.max(4, Math.ceil(prices.length / 3)));
    const step = (max - min) / bucketCount;
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      rangeStart: min + i * step,
      rangeEnd: min + (i + 1) * step,
      count: 0,
    }));
    prices.forEach((price) => {
      const idx = Math.min(bucketCount - 1, Math.floor((price - min) / step));
      buckets[idx]!.count += 1;
    });
    const maxCount = Math.max(...buckets.map((b) => b.count));
    return { buckets, maxCount, total: prices.length };
  }, [sortedProperties]);

  // Recently Sold properties — up to 5 most recent sold listings
  const insightsRecentlySold = useMemo(() => {
    return sortedProperties
      .filter((p) => p.status === 'sold' && p.rawPrice > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [sortedProperties]);

  // Neighbourhood quick stats — aggregate from visible listings
  const insightsNeighbourhoodStats = useMemo(() => {
    if (sortedProperties.length < 3) return null;
    const active = sortedProperties.filter((p) => p.status === 'active');
    const underOffer = sortedProperties.filter((p) => p.status === 'under_offer');
    const sold = sortedProperties.filter((p) => p.status === 'sold');
    const withPrice = sortedProperties.filter((p) => p.rawPrice > 0);
    const medianPrice = withPrice.length > 0
      ? [...withPrice].sort((a, b) => a.rawPrice - b.rawPrice)[Math.floor(withPrice.length / 2)]!.rawPrice
      : 0;
    const avgDaysOnMarket = sortedProperties.length > 0
      ? Math.round(sortedProperties.reduce((sum, p) => sum + Math.max(0, Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86_400_000)), 0) / sortedProperties.length)
      : 0;
    return { active: active.length, underOffer: underOffer.length, sold: sold.length, medianPrice, avgDaysOnMarket };
  }, [sortedProperties]);

  // URL to return to from the property detail page — includes current filter state so it survives navigation.
  const listingsBackUrl = useMemo(() => {
    if (!hasSearched) return '/app/listings';
    const params = filtersToSearchParams(appliedFilters, sortBy, listingCategory);
    const paramsString = params.toString();
    return `/app/listings${paramsString ? `?${paramsString}` : ''}`;
  }, [appliedFilters, hasSearched, sortBy, listingCategory]);

  return (
    <div className="bg-[#F2E8D5] min-h-screen">
      <div>
        {/* ── Forest Command Zone ─────────────────────────────────────────── */}
        <div
          data-testid="forest-command-zone"
          className=""
          style={{ background: '#1A3C28', position: 'relative', overflow: 'visible' }}
        >
          {/* ── Page Header ── */}
          <div className={`relative pt-8 pb-5 overflow-hidden ${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'}`} style={{ borderBottom: '1px solid rgba(242,232,213,0.1)' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(196,86,42,0.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(0,232,122,0.04)', pointerEvents: 'none' }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.18em', color: '#C4562A', textTransform: 'uppercase' }}>Marketplace · Property Search</span>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: '#F2E8D5', lineHeight: 1.1, margin: '6px 0 4px' }}>Browse Properties</h1>
            <p style={{ color: 'rgba(242,232,213,0.5)', fontSize: 14 }}>Verified listings across Southern Africa</p>
          </div>
          {/* ── Row 1: category · location · map · AI · Search ── */}
          <div className={`flex flex-col lg:flex-row gap-1.5 ${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'} py-2`}>

            {/* Listing Category */}
            <div className="relative shrink-0">
              <button
                type="button"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#F2E8D5', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, height: 44, minWidth: 130, padding: '0 14px', fontSize: 14, fontWeight: 500 }}
                className="flex items-center justify-between gap-2 w-full lg:w-auto"
                onClick={() => setShowListingCategoryDropdown((prev) => !prev)}
                onBlur={() => setTimeout(() => setShowListingCategoryDropdown(false), 120)}
                aria-label="Listing category"
              >
                <span>{listingCategory}</span>
                {showListingCategoryDropdown ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
              </button>
              {showListingCategoryDropdown && (
                <div
                  style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 10, zIndex: 60, minWidth: 160 }}
                  className="absolute left-0 top-[calc(100%+6px)] shadow-2xl p-1"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {LISTING_CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => { setListingCategory(option); setShowListingCategoryDropdown(false); }}
                      style={{ color: option === listingCategory ? '#00E87A' : '#F2E8D5', background: option === listingCategory ? 'rgba(0,232,122,0.08)' : 'transparent', borderRadius: 6 }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location token input */}
            <div className="relative flex-1 min-w-0">
              <div
                style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, background: 'rgba(255,255,255,0.04)', minHeight: 44 }}
                className="px-3 flex items-center gap-2 flex-wrap"
              >
                <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(242,232,213,0.5)' }} />
                {pendingFilters.locations.map((location) => (
                  <span
                    key={location}
                    style={{ background: 'rgba(242,232,213,0.12)', border: '1px solid rgba(242,232,213,0.3)', color: '#F2E8D5', borderRadius: 6, padding: '3px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    {location}
                    <button
                      type="button"
                      aria-label={`Remove ${location}`}
                      onClick={() => removePendingLocation(location)}
                      style={{ color: 'rgba(242,232,213,0.6)', lineHeight: 1 }}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={locationInput}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 120)}
                  onChange={(e) => { setLocationInput(e.target.value); setShowLocationSuggestions(true); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                      e.preventDefault();
                      if (locationSuggestions.length > 0) { addPendingLocation(locationSuggestions[0]); return; }
                      addPendingLocation();
                    }
                    if (e.key === 'Backspace' && locationInput === '' && pendingFilters.locations.length > 0) {
                      removePendingLocation(pendingFilters.locations[pendingFilters.locations.length - 1]);
                    }
                    if (e.key === 'Escape') setShowLocationSuggestions(false);
                  }}
                  placeholder={pendingFilters.locations.length > 0 ? 'Add more...' : 'Search location, suburb or city'}
                  style={{ background: 'transparent', outline: 'none', color: '#F2E8D5', fontSize: 14, minWidth: 180, flex: 1 }}
                  className="placeholder:text-white/30 py-2.5"
                />
                {locationInput.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setLocationInput(''); setShowLocationSuggestions(false); }}
                    aria-label="Clear location"
                    style={{ color: 'rgba(242,232,213,0.5)' }}
                    className="shrink-0 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div
                  style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 10, zIndex: 60 }}
                  className="absolute left-0 right-0 top-[calc(100%+6px)] shadow-2xl overflow-hidden"
                >
                  {locationSuggestions.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); addPendingLocation(loc); }}
                      style={{ color: '#F2E8D5' }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#00E87A' }} />
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map toggle */}
            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'map' ? 'grid' : 'map'))}
              style={{
                background: viewMode === 'map' ? 'rgba(0,232,122,0.15)' : 'rgba(255,255,255,0.06)',
                border: viewMode === 'map' ? '1px solid rgba(0,232,122,0.4)' : '1px solid rgba(255,255,255,0.12)',
                color: viewMode === 'map' ? '#00E87A' : '#F2E8D5',
                borderRadius: 8, height: 44, padding: '0 18px', fontSize: 14, fontWeight: 500,
              }}
              className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
            >
              <MapIcon className="w-4 h-4" />
              Map
            </button>

            {/* AI Search */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              style={{ background: 'rgba(242,232,213,0.08)', border: '1px solid rgba(242,232,213,0.2)', color: 'rgba(242,232,213,0.85)', borderRadius: 8, height: 44, padding: '0 18px', fontSize: 14, fontWeight: 600 }}
              className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
            >
              <Mic className="w-4 h-4" />
              AI Search
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Search */}
            <button
              type="button"
              onClick={handleTopSearch}
              style={{ background: '#C4562A', color: 'white', borderRadius: 8, height: 44, padding: '0 28px', fontSize: 15, fontWeight: 700, border: 'none' }}
              className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>

          {searchError && (
            <div className={`${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'} pb-2 flex items-center gap-1.5 text-sm font-medium text-red-400`} role="alert">
              <span aria-hidden="true">⚠</span> {searchError}
            </div>
          )}

          {/* ── Row 2: Property Type · Min Price · Max Price · Bedrooms · More Filters ── */}
          <div style={{ borderTop: '1px solid rgba(242,232,213,0.1)' }} className={`flex flex-wrap items-stretch ${isAnonymous ? 'container mx-auto px-4 md:px-8' : ''}`}>

            {/* Property Type */}
            <div className="relative">
              <button
                type="button"
                style={{ color: selectedPropertyTypeCount > 0 ? '#00E87A' : 'rgba(242,232,213,0.75)', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'transparent', height: 44, padding: '0 18px', fontSize: 13, fontWeight: 500 }}
                className="flex items-center gap-2 hover:bg-white/5 transition-colors"
                onClick={() => {
                  setShowPropertyTypeDropdown((p) => !p);
                  setShowMinPriceDropdown(false); setShowMaxPriceDropdown(false);
                  setShowBedroomsDropdown(false); setShowBathroomsDropdown(false);
                  setShowParkingDropdown(false); setShowFloorSizeDropdown(false); setShowErfSizeDropdown(false);
                }}
                onBlur={() => setTimeout(() => setShowPropertyTypeDropdown(false), 120)}
              >
                {selectedPropertyTypeCount > 0 ? `Property Type (${selectedPropertyTypeCount})` : 'Property Type'}
                {showPropertyTypeDropdown ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
              </button>
              {showPropertyTypeDropdown && (
                <div
                  style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 10, zIndex: 60, minWidth: 200 }}
                  className="absolute left-0 top-[calc(100%+4px)] shadow-2xl p-2"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {PROPERTY_TYPE_OPTIONS.map(({ key, label }) => (
                    <label
                      key={key}
                      style={{ color: '#F2E8D5', borderRadius: 6 }}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <input
                        type="checkbox"
                        style={{ accentColor: '#00E87A', width: 15, height: 15 }}
                        checked={(pendingFilters.propertyTypes as Record<string, boolean>)[key] ?? false}
                        onChange={(e) => setPendingFilters((prev) => ({ ...prev, propertyTypes: { ...prev.propertyTypes, [key]: e.target.checked } }))}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Min Price */}
            <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setTimeout(() => setShowMinPriceDropdown(false), 120); }}>
              <button
                type="button"
                style={{ color: pendingFilters.minPrice ? '#00E87A' : 'rgba(242,232,213,0.75)', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'transparent', height: 44, padding: '0 18px', fontSize: 13, fontWeight: 500 }}
                className="flex items-center gap-2 hover:bg-white/5 transition-colors"
                onClick={openMinPriceDropdown}
              >
                {minPriceLabel}
                {showMinPriceDropdown ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
              </button>
              {showMinPriceDropdown && (
                <div
                  style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 10, zIndex: 60, minWidth: 200 }}
                  className="absolute left-0 top-[calc(100%+4px)] shadow-2xl"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {showCustomMinPrice ? (
                    <div className="p-4">
                      <button
                        type="button"
                        onClick={() => setShowCustomMinPrice(false)}
                        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(242,232,213,0.4)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}
                        className="hover:text-[#F2E8D5] transition-colors"
                      >← LIST VIEW</button>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(242,232,213,0.35)', marginBottom: 10 }}>CUSTOM MIN PRICE</p>
                      <div className="flex items-center gap-2 rounded-lg" style={{ border: '1px solid rgba(0,232,122,0.35)', background: 'rgba(0,232,122,0.05)', padding: '8px 12px', marginBottom: 10 }}>
                        <span style={{ color: 'rgba(242,232,213,0.5)', fontSize: 13, fontWeight: 600 }}>R</span>
                        <input
                          autoFocus
                          type="number"
                          value={customMinPriceInput}
                          onChange={(e) => setCustomMinPriceInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && customMinPriceInput) { setPendingFilters((p) => ({ ...p, minPrice: customMinPriceInput })); setShowMinPriceDropdown(false); setShowCustomMinPrice(false); } }}
                          placeholder="Enter amount"
                          style={{ background: 'transparent', border: 'none', outline: 'none', color: '#F2E8D5', fontSize: 15, width: '100%', minWidth: 0, fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (customMinPriceInput) { setPendingFilters((p) => ({ ...p, minPrice: customMinPriceInput })); setShowMinPriceDropdown(false); setShowCustomMinPrice(false); } }}
                        style={{ width: '100%', background: customMinPriceInput ? '#00E87A' : 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.4)', borderRadius: 7, color: customMinPriceInput ? '#0C0D10' : '#00E87A', fontSize: 11, padding: '8px 0', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em', fontWeight: 600 }}
                      >APPLY</button>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 300, overflowY: 'auto' }} className="p-1">
                      <button type="button" onClick={() => { setPendingFilters((p) => ({ ...p, minPrice: '' })); setShowMinPriceDropdown(false); }} style={{ color: !pendingFilters.minPrice ? '#00E87A' : '#F2E8D5', background: !pendingFilters.minPrice ? 'rgba(0,232,122,0.08)' : 'transparent', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">No Min</button>
                      {PRICE_PRESET_OPTIONS.map((value) => (
                        <button key={value} type="button" onClick={() => { setPendingFilters((p) => ({ ...p, minPrice: String(value) })); setShowMinPriceDropdown(false); }} style={{ color: String(value) === pendingFilters.minPrice ? '#00E87A' : '#F2E8D5', background: String(value) === pendingFilters.minPrice ? 'rgba(0,232,122,0.08)' : 'transparent', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">{formatRandValue(value)}</button>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4, paddingTop: 4 }}>
                        <button type="button" onClick={() => setShowCustomMinPrice(true)} style={{ color: 'rgba(242,232,213,0.5)', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">Custom amount...</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Max Price */}
            <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setTimeout(() => setShowMaxPriceDropdown(false), 120); }}>
              <button
                type="button"
                style={{ color: pendingFilters.maxPrice ? '#00E87A' : 'rgba(242,232,213,0.75)', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'transparent', height: 44, padding: '0 18px', fontSize: 13, fontWeight: 500 }}
                className="flex items-center gap-2 hover:bg-white/5 transition-colors"
                onClick={openMaxPriceDropdown}
              >
                {maxPriceLabel}
                {showMaxPriceDropdown ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
              </button>
              {showMaxPriceDropdown && (
                <div
                  style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 10, zIndex: 60, minWidth: 200 }}
                  className="absolute left-0 top-[calc(100%+4px)] shadow-2xl"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {showCustomMaxPrice ? (
                    <div className="p-4">
                      <button
                        type="button"
                        onClick={() => setShowCustomMaxPrice(false)}
                        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(242,232,213,0.4)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}
                        className="hover:text-[#F2E8D5] transition-colors"
                      >← LIST VIEW</button>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(242,232,213,0.35)', marginBottom: 10 }}>CUSTOM MAX PRICE</p>
                      <div className="flex items-center gap-2 rounded-lg" style={{ border: '1px solid rgba(0,232,122,0.35)', background: 'rgba(0,232,122,0.05)', padding: '8px 12px', marginBottom: 10 }}>
                        <span style={{ color: 'rgba(242,232,213,0.5)', fontSize: 13, fontWeight: 600 }}>R</span>
                        <input
                          autoFocus
                          type="number"
                          value={customMaxPriceInput}
                          onChange={(e) => setCustomMaxPriceInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && customMaxPriceInput) { setPendingFilters((p) => ({ ...p, maxPrice: customMaxPriceInput })); setShowMaxPriceDropdown(false); setShowCustomMaxPrice(false); } }}
                          placeholder="Enter amount"
                          style={{ background: 'transparent', border: 'none', outline: 'none', color: '#F2E8D5', fontSize: 15, width: '100%', minWidth: 0, fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (customMaxPriceInput) { setPendingFilters((p) => ({ ...p, maxPrice: customMaxPriceInput })); setShowMaxPriceDropdown(false); setShowCustomMaxPrice(false); } }}
                        style={{ width: '100%', background: customMaxPriceInput ? '#00E87A' : 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.4)', borderRadius: 7, color: customMaxPriceInput ? '#0C0D10' : '#00E87A', fontSize: 11, padding: '8px 0', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em', fontWeight: 600 }}
                      >APPLY</button>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 300, overflowY: 'auto' }} className="p-1">
                      <button type="button" onClick={() => { setPendingFilters((p) => ({ ...p, maxPrice: '' })); setShowMaxPriceDropdown(false); }} style={{ color: !pendingFilters.maxPrice ? '#00E87A' : '#F2E8D5', background: !pendingFilters.maxPrice ? 'rgba(0,232,122,0.08)' : 'transparent', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">No Max</button>
                      {PRICE_PRESET_OPTIONS.map((value) => (
                        <button key={value} type="button" onClick={() => { setPendingFilters((p) => ({ ...p, maxPrice: String(value) })); setShowMaxPriceDropdown(false); }} style={{ color: String(value) === pendingFilters.maxPrice ? '#00E87A' : '#F2E8D5', background: String(value) === pendingFilters.maxPrice ? 'rgba(0,232,122,0.08)' : 'transparent', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">{formatRandValue(value)}</button>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4, paddingTop: 4 }}>
                        <button type="button" onClick={() => setShowCustomMaxPrice(true)} style={{ color: 'rgba(242,232,213,0.5)', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">Custom amount...</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bedrooms */}
            <div className="relative">
              <button
                type="button"
                style={{ color: 'rgba(242,232,213,0.75)', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'transparent', height: 44, padding: '0 18px', fontSize: 13, fontWeight: 500 }}
                className="flex items-center gap-2 hover:bg-white/5 transition-colors"
                onClick={openBedroomsDropdown}
                onBlur={() => setTimeout(() => setShowBedroomsDropdown(false), 120)}
              >
                Bedrooms
                {pendingFilters.minBedrooms > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.45)', color: '#00E87A', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, letterSpacing: '0.02em' }}>
                    {bedroomsLabel}
                  </span>
                )}
                {showBedroomsDropdown ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
              </button>
              {showBedroomsDropdown && (
                <div
                  style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 12, zIndex: 60, minWidth: 224 }}
                  className="absolute left-0 top-[calc(100%+4px)] shadow-2xl p-4"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.12em', color: 'rgba(242,232,213,0.35)', marginBottom: 12 }} className="uppercase">Min Bedrooms</p>
                  <div className="flex items-center justify-center gap-5 mb-4">
                    <button
                      type="button"
                      onClick={() => setPendingFilters((p) => ({ ...p, minBedrooms: Math.max(0, p.minBedrooms - 1) }))}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${pendingFilters.minBedrooms > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, color: pendingFilters.minBedrooms > 0 ? 'rgba(242,232,213,0.8)' : 'rgba(242,232,213,0.25)', background: 'transparent', fontSize: 20, lineHeight: 1 }}
                      className="flex items-center justify-center hover:border-[#00E87A] hover:text-[#00E87A] transition-colors"
                    >−</button>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: '#F2E8D5', minWidth: 52, textAlign: 'center', fontWeight: 500 }}>
                      {pendingFilters.minBedrooms <= 0 ? 'Any' : `${pendingFilters.minBedrooms}+`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPendingFilters((p) => ({ ...p, minBedrooms: Math.min(10, p.minBedrooms + 1) }))}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(242,232,213,0.8)', background: 'transparent', fontSize: 20, lineHeight: 1 }}
                      className="flex items-center justify-center hover:border-[#00E87A] hover:text-[#00E87A] transition-colors"
                    >+</button>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => { setPendingFilters((p) => ({ ...p, minBedrooms: n })); setShowBedroomsDropdown(false); }}
                        style={{
                          background: pendingFilters.minBedrooms === n ? 'rgba(0,232,122,0.12)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${pendingFilters.minBedrooms === n ? '#00E87A' : 'rgba(255,255,255,0.1)'}`,
                          color: pendingFilters.minBedrooms === n ? '#00E87A' : 'rgba(242,232,213,0.65)',
                          borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500,
                        }}
                        className="hover:border-[#00E87A]/50 transition-colors"
                      >{n === 0 ? 'Any' : `${n}+`}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* More / Less Filters */}
            <button
              type="button"
              onClick={() => setShowTopMoreFilters((p) => !p)}
              style={{
                color: showTopMoreFilters ? '#00E87A' : 'rgba(242,232,213,0.75)',
                background: showTopMoreFilters ? 'rgba(0,232,122,0.06)' : 'transparent',
                borderLeft: 'none', height: 44, padding: '0 18px', fontSize: 13, fontWeight: 500,
                marginLeft: 'auto',
              }}
              className="flex items-center gap-2 hover:bg-white/5 transition-colors"
            >
              {showTopMoreFilters ? 'Less Filters —' : 'More Filters +'}
            </button>
          </div>

          {/* ── Row 3 (expanded): Bathrooms · Parking · Floor Size · Erf Size ── */}
          {showTopMoreFilters && (
            <>
              <div style={{ borderTop: '1px solid rgba(242,232,213,0.1)' }} className={`flex flex-wrap items-stretch ${isAnonymous ? 'container mx-auto px-4 md:px-8' : ''}`}>

                {/* Bathrooms */}
                <div className="relative">
                  <button
                    type="button"
                    style={{ color: 'rgba(242,232,213,0.75)', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'transparent', height: 44, padding: '0 18px', fontSize: 13, fontWeight: 500 }}
                    className="flex items-center gap-2 hover:bg-white/5 transition-colors"
                    onClick={openBathroomsDropdown}
                    onBlur={() => setTimeout(() => setShowBathroomsDropdown(false), 120)}
                  >
                    Bathrooms
                    {pendingFilters.minBathrooms > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.45)', color: '#00E87A', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, letterSpacing: '0.02em' }}>
                        {bathroomsLabel}
                      </span>
                    )}
                    {showBathroomsDropdown ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                  </button>
                  {showBathroomsDropdown && (
                    <div
                      style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 12, zIndex: 60, minWidth: 224 }}
                      className="absolute left-0 top-[calc(100%+4px)] shadow-2xl p-4"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.12em', color: 'rgba(242,232,213,0.35)', marginBottom: 12 }} className="uppercase">Min Bathrooms</p>
                      <div className="flex items-center justify-center gap-5 mb-4">
                        <button
                          type="button"
                          onClick={() => setPendingFilters((p) => ({ ...p, minBathrooms: Math.max(0, p.minBathrooms - 1) }))}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${pendingFilters.minBathrooms > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, color: pendingFilters.minBathrooms > 0 ? 'rgba(242,232,213,0.8)' : 'rgba(242,232,213,0.25)', background: 'transparent', fontSize: 20, lineHeight: 1 }}
                          className="flex items-center justify-center hover:border-[#00E87A] hover:text-[#00E87A] transition-colors"
                        >−</button>
                        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: '#F2E8D5', minWidth: 52, textAlign: 'center', fontWeight: 500 }}>
                          {pendingFilters.minBathrooms <= 0 ? 'Any' : `${pendingFilters.minBathrooms}+`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingFilters((p) => ({ ...p, minBathrooms: Math.min(10, p.minBathrooms + 1) }))}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(242,232,213,0.8)', background: 'transparent', fontSize: 20, lineHeight: 1 }}
                          className="flex items-center justify-center hover:border-[#00E87A] hover:text-[#00E87A] transition-colors"
                        >+</button>
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => { setPendingFilters((p) => ({ ...p, minBathrooms: n })); setShowBathroomsDropdown(false); }}
                            style={{
                              background: pendingFilters.minBathrooms === n ? 'rgba(0,232,122,0.12)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${pendingFilters.minBathrooms === n ? '#00E87A' : 'rgba(255,255,255,0.1)'}`,
                              color: pendingFilters.minBathrooms === n ? '#00E87A' : 'rgba(242,232,213,0.65)',
                              borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500,
                            }}
                            className="hover:border-[#00E87A]/50 transition-colors"
                          >{n === 0 ? 'Any' : `${n}+`}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Parking / Garage */}
                <div className="relative">
                  <button
                    type="button"
                    style={{ color: 'rgba(242,232,213,0.75)', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'transparent', height: 44, padding: '0 18px', fontSize: 13, fontWeight: 500 }}
                    className="flex items-center gap-2 hover:bg-white/5 transition-colors"
                    onClick={openParkingDropdown}
                    onBlur={() => setTimeout(() => setShowParkingDropdown(false), 120)}
                  >
                    Parking / Garage
                    {pendingFilters.minGarage > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.45)', color: '#00E87A', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, letterSpacing: '0.02em' }}>
                        {parkingLabel}
                      </span>
                    )}
                    {showParkingDropdown ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                  </button>
                  {showParkingDropdown && (
                    <div
                      style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 12, zIndex: 60, minWidth: 224 }}
                      className="absolute left-0 top-[calc(100%+4px)] shadow-2xl p-4"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.12em', color: 'rgba(242,232,213,0.35)', marginBottom: 12 }} className="uppercase">Min Parking</p>
                      <div className="flex items-center justify-center gap-5 mb-4">
                        <button
                          type="button"
                          onClick={() => setPendingFilters((p) => ({ ...p, minGarage: Math.max(0, p.minGarage - 1) }))}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${pendingFilters.minGarage > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, color: pendingFilters.minGarage > 0 ? 'rgba(242,232,213,0.8)' : 'rgba(242,232,213,0.25)', background: 'transparent', fontSize: 20, lineHeight: 1 }}
                          className="flex items-center justify-center hover:border-[#00E87A] hover:text-[#00E87A] transition-colors"
                        >−</button>
                        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: '#F2E8D5', minWidth: 52, textAlign: 'center', fontWeight: 500 }}>
                          {pendingFilters.minGarage <= 0 ? 'Any' : `${pendingFilters.minGarage}+`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingFilters((p) => ({ ...p, minGarage: Math.min(6, p.minGarage + 1) }))}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(242,232,213,0.8)', background: 'transparent', fontSize: 20, lineHeight: 1 }}
                          className="flex items-center justify-center hover:border-[#00E87A] hover:text-[#00E87A] transition-colors"
                        >+</button>
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3, 4].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => { setPendingFilters((p) => ({ ...p, minGarage: n })); setShowParkingDropdown(false); }}
                            style={{
                              background: pendingFilters.minGarage === n ? 'rgba(0,232,122,0.12)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${pendingFilters.minGarage === n ? '#00E87A' : 'rgba(255,255,255,0.1)'}`,
                              color: pendingFilters.minGarage === n ? '#00E87A' : 'rgba(242,232,213,0.65)',
                              borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500,
                            }}
                            className="hover:border-[#00E87A]/50 transition-colors"
                          >{n === 0 ? 'Any' : `${n}+`}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Floor Size */}
                <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setTimeout(() => setShowFloorSizeDropdown(false), 120); }}>
                  <button
                    type="button"
                    style={{ color: 'rgba(242,232,213,0.75)', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'transparent', height: 44, padding: '0 18px', fontSize: 13, fontWeight: 500 }}
                    className="flex items-center gap-2 hover:bg-white/5 transition-colors"
                    onClick={openFloorSizeDropdown}
                  >
                    Floor Size (m²)
                    {!!pendingFilters.minFloorSize && Number(pendingFilters.minFloorSize) > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.45)', color: '#00E87A', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, letterSpacing: '0.02em' }}>
                        {floorSizeLabel}
                      </span>
                    )}
                    {showFloorSizeDropdown ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                  </button>
                  {showFloorSizeDropdown && (
                    <div
                      style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 10, zIndex: 60, minWidth: 200 }}
                      className="absolute left-0 top-[calc(100%+4px)] shadow-2xl"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {showCustomFloorSize ? (
                        <div className="p-4">
                          <button
                            type="button"
                            onClick={() => setShowCustomFloorSize(false)}
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(242,232,213,0.4)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}
                            className="hover:text-[#F2E8D5] transition-colors"
                          >← LIST VIEW</button>
                          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(242,232,213,0.35)', marginBottom: 10 }}>CUSTOM FLOOR SIZE</p>
                          <div className="flex items-center gap-2 rounded-lg" style={{ border: '1px solid rgba(0,232,122,0.35)', background: 'rgba(0,232,122,0.05)', padding: '8px 12px', marginBottom: 10 }}>
                            <input
                              autoFocus
                              type="number"
                              value={customFloorSizeInput}
                              onChange={(e) => setCustomFloorSizeInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && customFloorSizeInput) { selectFloorSize(customFloorSizeInput); setShowFloorSizeDropdown(false); setShowCustomFloorSize(false); } }}
                              placeholder="Enter size"
                              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#F2E8D5', fontSize: 15, width: '100%', minWidth: 0, fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                            />
                            <span style={{ color: 'rgba(242,232,213,0.4)', fontSize: 12, whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono', monospace" }}>m²</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { if (customFloorSizeInput) { selectFloorSize(customFloorSizeInput); setShowFloorSizeDropdown(false); setShowCustomFloorSize(false); } }}
                            style={{ width: '100%', background: customFloorSizeInput ? '#00E87A' : 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.4)', borderRadius: 7, color: customFloorSizeInput ? '#0C0D10' : '#00E87A', fontSize: 11, padding: '8px 0', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em', fontWeight: 600 }}
                          >APPLY</button>
                        </div>
                      ) : (
                          <div style={{ maxHeight: 300, overflowY: 'auto' }} className="p-1">
                            <button type="button" onClick={() => { selectFloorSize(''); setShowCustomFloorSize(false); }} style={{ color: !pendingFilters.minFloorSize ? '#00E87A' : '#F2E8D5', background: !pendingFilters.minFloorSize ? 'rgba(0,232,122,0.08)' : 'transparent', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">Any Size</button>
                            {SIZE_PRESET_OPTIONS.map((value) => (
                              <button key={value} type="button" onClick={() => { selectFloorSize(String(value)); setShowCustomFloorSize(false); }} style={{ color: String(value) === pendingFilters.minFloorSize ? '#00E87A' : '#F2E8D5', background: String(value) === pendingFilters.minFloorSize ? 'rgba(0,232,122,0.08)' : 'transparent', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">{formatSquareMeters(value)}</button>
                            ))}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4, paddingTop: 4 }}>
                              <button type="button" onClick={() => setShowCustomFloorSize(true)} style={{ color: 'rgba(242,232,213,0.5)', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">Custom size...</button>
                            </div>
                          </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Erf Size */}
                <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setTimeout(() => setShowErfSizeDropdown(false), 120); }}>
                  <button
                    type="button"
                    style={{ color: 'rgba(242,232,213,0.75)', borderRight: '1px solid rgba(255,255,255,0.07)', background: 'transparent', height: 44, padding: '0 18px', fontSize: 13, fontWeight: 500 }}
                    className="flex items-center gap-2 hover:bg-white/5 transition-colors"
                    onClick={openErfSizeDropdown}
                  >
                    Erf Size (m²)
                    {!!pendingFilters.minErfSize && Number(pendingFilters.minErfSize) > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.45)', color: '#00E87A', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6, letterSpacing: '0.02em' }}>
                        {erfSizeLabel}
                      </span>
                    )}
                    {showErfSizeDropdown ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                  </button>
                  {showErfSizeDropdown && (
                    <div
                      style={{ background: '#0F2318', border: '1px solid rgba(242,232,213,0.15)', borderRadius: 10, zIndex: 60, minWidth: 200 }}
                      className="absolute left-0 top-[calc(100%+4px)] shadow-2xl"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {showCustomErfSize ? (
                        <div className="p-4">
                          <button
                            type="button"
                            onClick={() => setShowCustomErfSize(false)}
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(242,232,213,0.4)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}
                            className="hover:text-[#F2E8D5] transition-colors"
                          >← LIST VIEW</button>
                          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(242,232,213,0.35)', marginBottom: 10 }}>CUSTOM ERF SIZE</p>
                          <div className="flex items-center gap-2 rounded-lg" style={{ border: '1px solid rgba(0,232,122,0.35)', background: 'rgba(0,232,122,0.05)', padding: '8px 12px', marginBottom: 10 }}>
                            <input
                              autoFocus
                              type="number"
                              value={customErfSizeInput}
                              onChange={(e) => setCustomErfSizeInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && customErfSizeInput) { selectErfSize(customErfSizeInput); setShowErfSizeDropdown(false); setShowCustomErfSize(false); } }}
                              placeholder="Enter size"
                              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#F2E8D5', fontSize: 15, width: '100%', minWidth: 0, fontFamily: "'Fraunces', serif", fontWeight: 300 }}
                            />
                            <span style={{ color: 'rgba(242,232,213,0.4)', fontSize: 12, whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono', monospace" }}>m²</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { if (customErfSizeInput) { selectErfSize(customErfSizeInput); setShowErfSizeDropdown(false); setShowCustomErfSize(false); } }}
                            style={{ width: '100%', background: customErfSizeInput ? '#00E87A' : 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.4)', borderRadius: 7, color: customErfSizeInput ? '#0C0D10' : '#00E87A', fontSize: 11, padding: '8px 0', cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em', fontWeight: 600 }}
                          >APPLY</button>
                        </div>
                      ) : (
                          <div style={{ maxHeight: 300, overflowY: 'auto' }} className="p-1">
                            <button type="button" onClick={() => { selectErfSize(''); setShowCustomErfSize(false); }} style={{ color: !pendingFilters.minErfSize ? '#00E87A' : '#F2E8D5', background: !pendingFilters.minErfSize ? 'rgba(0,232,122,0.08)' : 'transparent', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">Any Size</button>
                            {SIZE_PRESET_OPTIONS.map((value) => (
                              <button key={value} type="button" onClick={() => { selectErfSize(String(value)); setShowCustomErfSize(false); }} style={{ color: String(value) === pendingFilters.minErfSize ? '#00E87A' : '#F2E8D5', background: String(value) === pendingFilters.minErfSize ? 'rgba(0,232,122,0.08)' : 'transparent', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">{formatSquareMeters(value)}</button>
                            ))}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4, paddingTop: 4 }}>
                              <button type="button" onClick={() => setShowCustomErfSize(true)} style={{ color: 'rgba(242,232,213,0.5)', borderRadius: 6 }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors">Custom size...</button>
                            </div>
                          </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Row 4: Feature + Other checkboxes ── */}
              <div style={{ borderTop: '1px solid rgba(242,232,213,0.1)' }} className={`${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'} py-3`}>
                <div className="flex flex-wrap gap-x-7 gap-y-2.5">
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.14em', color: 'rgba(242,232,213,0.35)' }} className="uppercase w-full mb-0.5">Features &amp; Other</p>
                  {[
                    { section: 'features', key: 'petFriendly', label: 'Pet Friendly' },
                    { section: 'features', key: 'garden', label: 'Garden' },
                    { section: 'features', key: 'pool', label: 'Pool' },
                    { section: 'features', key: 'flatlet', label: 'Flatlet' },
                    { section: 'features', key: 'security', label: 'Security Estate / Cluster' },
                    { section: 'other', key: 'retirement', label: 'Retirement' },
                    { section: 'other', key: 'onShow', label: 'On Show' },
                    { section: 'other', key: 'repossessed', label: 'Repossessed' },
                    { section: 'other', key: 'auction', label: 'Auction' },
                  ].map(({ section, key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        style={{ accentColor: '#00E87A', width: 14, height: 14 }}
                        checked={(pendingFilters[section as 'features' | 'other'] as Record<string, boolean>)[key] ?? false}
                        onChange={(e) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            [section]: { ...(prev[section as 'features' | 'other'] as Record<string, boolean>), [key]: e.target.checked },
                          }))
                        }
                      />
                      <span style={{ color: 'rgba(242,232,213,0.7)', fontSize: 13 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Footer strip: count + clear ── */}
          <div
            style={{ borderTop: '1px solid rgba(242,232,213,0.1)', background: 'rgba(0,0,0,0.12)' }}
            className={`${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'} py-2.5 flex items-center justify-between gap-4`}
          >
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(242,232,213,0.45)' }}>
              {hasSearched
                ? <>Click search to browse <strong style={{ color: '#F2E8D5' }}>{properties.length.toLocaleString('en-ZA')}</strong> {properties.length === 1 ? 'property' : 'properties'}</>
                : 'Enter a location and click Search to explore verified properties'}
            </span>
            {activeFilterBadges.length > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#C4562A', letterSpacing: '0.1em' }}
                className="hover:opacity-80 transition-opacity uppercase shrink-0"
              >
                · Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className={`lg:flex lg:items-start lg:gap-6 ${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-4 md:px-8'} py-6`}>
        <div className="bg-card border border-border rounded-lg overflow-hidden h-full flex flex-col lg:flex-row overflow-x-hidden flex-1">
      {/* Filters Sidebar — forest-green slide-in overlay */}
      {(showFilters || showDesktopFilters) && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => { setShowFilters(false); setShowDesktopFilters(false); }}
          aria-hidden="true"
        />
      )}
      <div
        className={`
          fixed top-0 left-0 bottom-0 z-50
          w-80 max-w-full
          overflow-y-auto overflow-x-hidden
          transition-transform duration-300 ease-out
          ${showFilters || showDesktopFilters ? 'translate-x-0' : '-translate-x-full'}
          p-5
        `}
        style={{ backgroundColor: '#1A3C28' }}
      >
        <div className="flex items-center justify-between gap-2 mb-5">
          <div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em' }} className="uppercase mb-1">BUILDTRUST</p>
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: '#00E87A' }} />
              Filters
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              style={{ color: '#00E87A' }}
              className="text-sm font-medium hover:opacity-80 transition-opacity"
              onClick={handleResetFilters}
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => { setShowFilters(false); setShowDesktopFilters(false); }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close filters"
              title="Close filters"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Verified Toggle */}
        <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: '#00E87A' }} />
              <span className="text-white text-sm font-medium">Verified Only</span>
            </div>
            <input
              type="checkbox"
              className="toggle"
              style={{ accentColor: '#00E87A' }}
              checked={pendingFilters.verifiedOnly}
              onChange={(event) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  verifiedOnly: event.target.checked,
                }))
              }
            />
          </label>
        </div>

        {/* More Filters */}
        <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em' }} className="uppercase mb-2">BATHROOMS</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Min Bathrooms</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                  style={{ border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setPendingFilters((prev) => ({
                      ...prev,
                      minBathrooms: Math.max(0, prev.minBathrooms - 1),
                    }));
                  }}
                >
                  −
                </button>
                <span className="w-12 text-center text-white text-sm font-semibold">{pendingFilters.minBathrooms}+</span>
                <button
                  type="button"
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                  style={{ border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setPendingFilters((prev) => ({
                      ...prev,
                      minBathrooms: prev.minBathrooms + 1,
                    }));
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-5">
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em' }} className="uppercase mb-2">FEATURES</p>
          <div className="space-y-2.5">
            {[
              { key: 'pool', label: 'Pool' },
              { key: 'garden', label: 'Garden' },
              { key: 'petFriendly', label: 'Pet Friendly' },
              { key: 'security', label: 'Security Estate' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  style={{ accentColor: '#00E87A', width: 16, height: 16 }}
                  checked={(pendingFilters.features as Record<string, boolean>)[key] ?? false}
                  onChange={(event) =>
                    setPendingFilters((prev) => ({
                      ...prev,
                      features: { ...prev.features, [key]: event.target.checked },
                    }))
                  }
                />
                <span className="text-white/80 text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Drawer footer: apply + voice */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            style={{ backgroundColor: '#00E87A', color: '#0C0D10' }}
            className="w-full h-11 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            onClick={() => {
              handleApplyFilters();
              setShowFilters(false);
              setShowDesktopFilters(false);
            }}
          >
            <Search className="w-4 h-4" />
            Apply Filters
          </button>
          <button
            type="button"
            style={{ backgroundColor: '#C4562A' }}
            className="w-full h-11 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            onClick={handleVoiceSearch}
          >
            <Mic className="w-4 h-4" />
            AI Voice Search
            <Sparkles className="w-4 h-4" />
          </button>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.35)' }} className="text-center">
            Try: &ldquo;3 bed house in Cape Town with pool&rdquo;
          </p>
        </div>
      </div>

      {/* Voice Search Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-card">
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Voice Search</h2>
                    <p className="text-sm text-muted-foreground">Powered by natural language understanding</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    stopVoiceRecognition();
                    setShowVoiceModal(false);
                  }}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  aria-label="Close AI voice search"
                  title="Close AI voice search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Voice Input Visualization */}
              <div className="mb-6">
                <div className="relative bg-linear-to-br from-purple-50 to-blue-50 rounded-2xl p-8 flex flex-col items-center justify-center min-h-50">
                  {isListening ? (
                    <>
                      <div className="relative">
                        <div className="w-24 h-24 bg-linear-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                          <Mic className="w-12 h-12 text-white" />
                        </div>
                        {/* Animated circles */}
                        <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping animation-delay-200"></div>
                      </div>
                      <p className="mt-6 text-lg font-semibold text-gray-900">Listening...</p>
                      <p className="text-sm text-muted-foreground">Speak naturally about what you're looking for</p>
                      
                      {/* Audio waveform visualization */}
                      <div className="flex items-center gap-1 mt-4">
                        {waveBarHeights.map((heightClass, i) => (
                          <div
                            key={i}
                            className={`w-1 ${heightClass} bg-linear-to-t from-purple-600 to-blue-600 rounded-full animate-wave`}
                          ></div>
                        ))}
                      </div>
                    </>
                  ) : voiceSearchText ? (
                    <>
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Volume2 className="w-10 h-10 text-green-600" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">Captured your voice</p>
                      <div className="bg-card rounded-lg p-4 w-full max-w-lg border-2 border-border">
                        <p className="text-foreground italic text-center">"{voiceSearchText}"</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                        <MicOff className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">Ready to listen</p>
                      <p className="text-sm text-muted-foreground">Click the button below to start</p>
                    </>
                  )}
                </div>
                {voiceStatusMessage && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {voiceStatusMessage}
                  </div>
                )}
              </div>

              {/* AI-Interpreted Filters */}
              {aiSuggestions.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">AI Understood Your Search</h3>
                      <p className="text-sm text-blue-700">We've automatically detected these filters:</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map((suggestion, idx) => (
                      <Badge key={idx} className="bg-blue-600 text-white">
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {!voiceSearchText && !isListening && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-foreground mb-3">Try saying:</p>
                  <div className="space-y-2">
                    {[
                      "Show me 3 bedroom houses in Cape Town with a pool under 10 million rand",
                      "Find apartments near the beach with 2 bathrooms",
                      "I want a luxury property in Clifton with ocean views",
                      "Looking for family homes with a garden in Constantia"
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setVoiceSearchText(example);
                          setIsListening(false);
                          setTimeout(() => {
                            const parsed = buildVoiceSearchResult(example);
                            setAiSuggestions(parsed.suggestions);
                          }, 500);
                        }}
                        className="w-full text-left px-4 py-2 bg-muted hover:bg-accent rounded-lg text-sm text-foreground transition-colors"
                      >
                        💬 "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    stopVoiceRecognition();
                    setShowVoiceModal(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                {!isListening && (
                  <Button
                    onClick={startVoiceRecognition}
                    variant="outline"
                    className="flex-1"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Listening
                  </Button>
                )}
                {voiceSearchText && aiSuggestions.length > 0 && (
                  <Button
                    onClick={handleApplyVoiceSearch}
                    className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Apply AI Search
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Landing Panel — shown before any search is submitted */}
        {!hasSearched && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12" style={{ background: '#F2E8D5', position: 'relative', overflow: 'hidden' }}>
            {/* Grid overlay */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(26,60,40,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,60,40,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

            <div className="max-w-2xl w-full text-center" style={{ position: 'relative', zIndex: 1 }}>
              {/* Shield icon */}
              <div style={{ width: 58, height: 58, background: 'rgba(26,60,40,0.07)', border: '1px solid rgba(26,60,40,0.18)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
                <Shield style={{ width: 26, height: 26, color: '#1A3C28' }} />
              </div>

              {/* Eyebrow */}
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.22em', color: '#C4562A', marginBottom: 12 }}>
                PROPERTY MARKETPLACE — VERIFIED LISTINGS
              </div>

              {/* Title */}
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300, color: '#1A3C28', lineHeight: 1.25, marginBottom: 12 }}>
                Your <span style={{ color: '#C4562A' }}>Trusted</span><br />Property Platform
              </h2>

              {/* Body */}
              <p style={{ fontSize: 13, color: 'rgba(26,60,40,0.6)', lineHeight: 1.65, maxWidth: 320, margin: '0 auto 28px' }}>
                BuildTrust combines financial-grade transparency with real estate intelligence — protecting buyers, sellers, and diaspora investors from fraud.
              </p>

              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-5">
                {/* Fraud Protection */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,60,40,0.1)', borderTop: '2.5px solid #1A3C28', borderRadius: 10, padding: '14px 14px' }}>
                  <div style={{ width: 28, height: 28, background: 'rgba(26,60,40,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
                    <Shield style={{ width: 14, height: 14, color: '#1A3C28' }} />
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.18em', color: '#1A3C28', marginBottom: 4 }}>PROTECTION</div>
                  <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: '0.83rem', fontWeight: 400, color: '#1A3C28', marginBottom: 5 }}>Fraud Protection</h4>
                  <p style={{ fontSize: 10, color: 'rgba(26,60,40,0.55)', lineHeight: 1.5 }}>Verified against title deeds with immutable audit trails that prevent double-selling.</p>
                </div>

                {/* Diaspora Ready */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,60,40,0.1)', borderTop: '2.5px solid #B89040', borderRadius: 10, padding: '14px 14px' }}>
                  <div style={{ width: 28, height: 28, background: 'rgba(184,144,64,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
                    <MapPin style={{ width: 14, height: 14, color: '#B89040' }} />
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.18em', color: '#B89040', marginBottom: 4 }}>DIASPORA</div>
                  <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: '0.83rem', fontWeight: 400, color: '#1A3C28', marginBottom: 5 }}>Diaspora Ready</h4>
                  <p style={{ fontSize: 10, color: 'rgba(26,60,40,0.55)', lineHeight: 1.5 }}>Geo-tagged photos, escrow protection, and remote oversight tools built for international buyers.</p>
                </div>

                {/* 14-Stage Pipeline */}
                <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,60,40,0.1)', borderTop: '2.5px solid #C4562A', borderRadius: 10, padding: '14px 14px' }}>
                  <div style={{ width: 28, height: 28, background: 'rgba(196,86,42,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
                    <TrendingUp style={{ width: 14, height: 14, color: '#C4562A' }} />
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.18em', color: '#C4562A', marginBottom: 4 }}>PIPELINE</div>
                  <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: '0.83rem', fontWeight: 400, color: '#1A3C28', marginBottom: 5 }}>14-Stage Pipeline</h4>
                  <p style={{ fontSize: 10, color: 'rgba(26,60,40,0.55)', lineHeight: 1.5 }}>Full document visibility at every legal stage with milestone escrow releases.</p>
                </div>
              </div>

              {/* Search hint bar */}
              <div style={{ border: '1px solid rgba(26,60,40,0.12)', borderRadius: 10, background: 'rgba(26,60,40,0.04)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(26,60,40,0.5)', justifyContent: 'center' }}>
                <Search style={{ width: 14, height: 14, flexShrink: 0 }} />
                Enter a location above and click&nbsp;<strong style={{ color: '#1A3C28', fontWeight: 600 }}>Search</strong>&nbsp;to explore verified {listingCategory === 'Estate Agencies' ? 'estate agents' : listingCategory === 'News' ? 'news & updates' : 'properties'}
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        {hasSearched && (listingCategory === 'For Sale' || listingCategory === 'To Rent') && (
        <div className={`bg-card border-b border-border ${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'} py-4`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-1">
                <span className="text-green-600 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {displayedProperties.length} {appliedFilters.verifiedOnly ? 'Verified ' : ''}{listingCategory === 'To Rent' ? (displayedProperties.length === 1 ? 'Rental Property' : 'Rental Properties') : `Propert${displayedProperties.length === 1 ? 'y' : 'ies'}`} Found
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs md:text-sm flex-wrap">
                <span className="text-muted-foreground">APPLIED:</span>
                {activeFilterBadges.length > 0 ? (
                  activeFilterBadges.map((badge) => (
                    <Badge key={badge} variant="secondary">{badge}</Badge>
                  ))
                ) : (
                  <Badge variant="secondary">No Filters</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as "relevance" | "price-low-high" | "price-high-low" | "newest")
                }
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 border border-input bg-input-background rounded-lg text-xs md:text-sm"
                aria-label="Sort properties"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
              <div className="flex gap-1 border border-input rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid" ? "bg-muted" : "hover:bg-accent"
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list" ? "bg-muted" : "hover:bg-accent"
                  }`}
                  aria-label="List view"
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-2 rounded ${
                    viewMode === "map" ? "bg-muted" : "hover:bg-accent"
                  }`}
                  aria-label="Map view"
                  title="Map View"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Alert Banner */}
        {hasSearched && (listingCategory === 'For Sale' || listingCategory === 'To Rent') && fraudFlaggedCount > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 md:mx-6 my-4 md:my-6">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600">⚠️</div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1 text-sm md:text-base">
                  Fraud Alert: {fraudFlaggedCount} Listing{fraudFlaggedCount === 1 ? '' : 's'} Flagged
                </h3>
                <p className="text-xs md:text-sm text-yellow-700">
                  We identified {fraudFlaggedCount} listing{fraudFlaggedCount === 1 ? '' : 's'} as potentially fraudulent.
                  Always ensure the green verified shield is present before proceeding.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasSearched && (listingCategory === 'For Sale' || listingCategory === 'To Rent') && isLoadingProperties && (
          <div className="mx-4 md:mx-6 mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Loading listings from database...
          </div>
        )}

        {hasSearched && (listingCategory === 'For Sale' || listingCategory === 'To Rent') && !isLoadingProperties && propertiesError && (
          <div className="mx-4 md:mx-6 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {propertiesError}
          </div>
        )}

        {/* Map View */}
        {hasSearched && (listingCategory === 'For Sale' || listingCategory === 'To Rent') && viewMode === "map" && (
          <div className={`flex-1 overflow-auto ${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'} py-4 md:py-6`}>
            <div className="relative bg-gray-100 rounded-lg h-full min-h-125 overflow-hidden">
              {mapSource ? (
                mapSource.type === 'image' ? (
                  <img
                    src={mapSource.url}
                    alt="Map view"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <LeafletMapDynamic
                    center={mapSource.center}
                    zoom={mapSource.zoom}
                    markers={mapSource.markers}
                  />
                )
              ) : isGeocodingMap ? (
                <div className="w-full h-full flex items-center justify-center gap-2 text-sm text-gray-500">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Locating properties on map…
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-600 px-6 text-center">
                  Map unavailable — no recognisable location data for the displayed listings.
                </div>
              )}
              {/* Property pins on map */}
              {mapSource && mapSource.type === 'image' && mapPins.map((property) => (
                <Link
                  key={property.id}
                  to={`/app/property/${property.id}?back=${encodeURIComponent(listingsBackUrl)}`}
                >
                  <div
                    className={`absolute ${property.positionClass} -translate-x-1/2 -translate-y-full bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-blue-700 transition-colors`}
                    title={property.title}
                  >
                    <div className="font-bold text-sm whitespace-nowrap">{property.price}</div>
                  </div>
                </Link>
              ))}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm hidden md:block">
                <div className="text-sm font-semibold mb-2">Map View</div>
                <div className="text-xs text-gray-600">
                  Click on price markers to view property details.
                  {!MAPBOX_TOKEN && " Set NEXT_PUBLIC_MAPBOX_TOKEN to enable Mapbox map tiles."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        {hasSearched && (listingCategory === 'For Sale' || listingCategory === 'To Rent') && viewMode !== "map" && (
          <div className={`flex-1 overflow-auto ${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'} py-4 md:py-6`}>
                {!isLoadingProperties && displayedProperties.length === 0 && !propertiesError && (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
                    {listingCategory === 'To Rent'
                      ? 'No rental properties found. Try a different location or adjust your filters.'
                      : 'No properties found in the database for the selected filters.'}
                  </div>
                )}
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-4 md:gap-6"}>
                {deduplicatedProperties.map((property) => {
                  const multiAgentCount = multiListingCountById.get(property.id);
                  const isMultiAgent = multiAgentCount !== undefined && multiAgentCount >= 2;

                  const cardContent = (
                    <>
                      <ListingCardOptA
                        property={property}
                        onSave={(id) => { void handleAddToFavourites(id); }}
                        isSaved={savedPropertyIds.has(property.id)}
                        isSaving={savingPropertyIds.has(property.id)}
                        offerMade={offerPropertyIds.has(property.id)}
                      />
                      {property.agentId && property.agentId === currentUserId && property.companyId === currentCompanyId && (() => {
                        const activeSale = propertySaleMap[property.id];
                        if (activeSale) {
                          return (
                            <div className="mt-1 space-y-1.5">
                              <div className="w-full text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center justify-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 shrink-0" />
                                Sale in Progress · Stage {activeSale.currentStage}
                              </div>
                              <Link
                                to={`/workspace/${activeSale.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-2 transition-colors flex items-center justify-center gap-1.5"
                              >
                                View Workspace →
                              </Link>
                            </div>
                          );
                        }
                        return (
                          <button
                            type="button"
                            className="mt-1 w-full text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-2 transition-colors flex items-center justify-center gap-1.5"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setInitiateCardProp({ id: property.id, title: property.title, price: property.rawPrice, currency: property.currency });
                              setInitCardAgreedPrice(String(property.rawPrice));
                              setInitCardCurrency(property.currency);
                              setInitCardBuyerId('');
                              setInitCardDeposit('');
                              setInitCardError(null);
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Initiate Sale
                          </button>
                        );
                      })()}
                    </>
                  );

                  return isMultiAgent ? (
                    <div
                      key={property.id}
                      className="group cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => openMultiListingDialog(property)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMultiListingDialog(property); } }}
                    >
                      {/* Multi-agent badge */}
                      <div className="bg-amber-50 border border-amber-200 rounded-t-xl px-3 py-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-xs font-semibold text-amber-700">
                          Listed by {multiAgentCount} Estate {multiAgentCount === 1 ? 'Agency' : 'Agencies'}
                        </span>
                      </div>
                      {cardContent}
                    </div>
                  ) : (
                    <Link
                      key={property.id}
                      to={`/app/property/${property.id}?back=${encodeURIComponent(listingsBackUrl)}`}
                      className="group"
                    >
                      {cardContent}
                    </Link>
                  );
                })}
                </div>
              </div>
        )}

        {/* Estate Agencies view */}
        {hasSearched && listingCategory === 'Estate Agencies' && (
          <div className={`flex-1 overflow-auto ${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'} py-4 md:py-6`}>
            <div className="mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">
                {isLoadingAgents
                  ? 'Loading agents...'
                  : `${featuredAgents.length} Estate ${featuredAgents.length === 1 ? 'Agency' : 'Agencies'} Found`}
              </h3>
            </div>
            {agentsError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-4">
                {agentsError}
              </div>
            )}
            {!isLoadingAgents && featuredAgents.length === 0 && !agentsError && (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
                No estate agents found for the selected area.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredAgents.map((agent) => (
                <Card key={agent.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {agent.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{agent.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />{agent.location}
                      </p>
                    </div>
                    <Badge className={
                      agent.tier === 'gold' ? 'bg-amber-500 text-white' :
                      agent.tier === 'silver' ? 'bg-gray-400 text-white' :
                      'bg-orange-700 text-white'
                    }>
                      {agent.tier.charAt(0).toUpperCase() + agent.tier.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{agent.deals} active deal{agent.deals !== 1 ? 's' : ''}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* News view */}
        {hasSearched && listingCategory === 'News' && (
          <div className={`flex-1 overflow-auto ${isAnonymous ? 'container mx-auto px-4 md:px-8' : 'px-8'} py-4 md:py-6`}>
            <div className="mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Property News &amp; Updates</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {([
                { title: 'Southern Africa Property Market Shows Resilience in 2026', date: 'Feb 24, 2026', category: 'Market', summary: 'Despite global headwinds, the residential property sector in Botswana and Zimbabwe continues to attract both local and diaspora investment.' },
                { title: 'New Anti-Fraud Regulations Strengthen Land Title Protections', date: 'Feb 20, 2026', category: 'Regulation', summary: 'Government amendments to the Land Registry Act introduce mandatory digital verification of title deeds before any transfer can proceed.' },
                { title: 'Diaspora Investment in Real Estate Grows 18% Year-on-Year', date: 'Feb 15, 2026', category: 'Investment', summary: 'New data shows a significant uptick in cross-border property purchases, driven by improved verification tools and escrow services.' },
                { title: 'Construction Costs: How to Protect Your Project Budget', date: 'Feb 10, 2026', category: 'Construction', summary: 'Experts share strategies for managing material price volatility and contractor reliability in the current market environment.' },
              ] as Array<{ title: string; date: string; category: string; summary: string }>).map((item, idx) => (
                <Card key={idx} className="p-4 md:p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Newspaper className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.summary}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other categories placeholder */}
        {hasSearched && !(['For Sale', 'To Rent', 'Estate Agencies', 'News'] as string[]).includes(listingCategory) && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{listingCategory}</h3>
              <p className="text-sm text-muted-foreground">This section is coming soon. We&apos;re building comprehensive data and tools for this category.</p>
            </div>
          </div>
        )}

        </div>

        {viewMode !== "map" && hasSearched && listingCategory === 'For Sale' && (
          <aside className="hidden lg:block w-70 shrink-0 pt-4 pb-4 lg:pl-4 lg:pr-4 lg:border-l lg:border-border/60" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <div className="sticky top-4 space-y-4">
              <Card className="border border-border bg-foreground text-background p-4">
                <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-fraunces)' }}>{insightsTrendsHeading}</h3>
                <p className="text-sm text-background/70 mb-4" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em' }}>AVERAGE PROPERTY PRICE</p>

                <div className="relative h-48 rounded-lg bg-background/5 border border-background/10 p-3">
                  <svg viewBox="0 0 100 100" className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)]" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-400"
                      points={insightsTrend.points.map((point) => `${point.x},${point.y}`).join(' ')}
                    />
                  </svg>
                  <div className="absolute right-3 top-3 rounded-xl bg-sky-500 px-3 py-1 text-xs font-semibold text-white" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatRandAmount(Math.round(insightsTrend.latestValue))}
                  </div>
                  <div className="absolute left-3 bottom-2 right-3 flex items-center justify-between text-[10px] text-background/65" style={{ fontFamily: 'var(--font-mono)' }}>
                    {insightsTrend.years.map((year) => (
                      <span key={year}>{year}</span>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                  onClick={() => navigate('/app/risk-analytics')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  More Trends and Statistics
                </Button>
              </Card>

              {/* Average Price per m² */}
              {insightsAvgPricePerSqm > 0 && (
                <Card className="border border-border bg-foreground text-background p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    <Maximize className="w-4 h-4" />
                    Avg Price per m²
                  </h3>
                  <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'var(--font-fraunces)' }}>{formatRandAmount(insightsAvgPricePerSqm)}/m²</div>
                  <p className="text-xs text-background/60 mt-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Based on {sortedProperties.filter((p) => p.sqm > 0).length} listings with floor area data</p>
                </Card>
              )}

              {/* Price Distribution Histogram */}
              {insightsPriceHistogram && (
                <Card className="border border-border bg-foreground text-background p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    <BarChart3 className="w-4 h-4" />
                    Price Distribution
                  </h3>
                  <div className="space-y-1.5">
                    {insightsPriceHistogram.buckets.map((bucket, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px]">
                        <span className="w-16 text-right text-background/60 shrink-0" style={{ fontFamily: 'var(--font-mono)' }}>{formatRandAmount(Math.round(bucket.rangeStart))}</span>
                        <div className="flex-1 h-4 bg-background/10 rounded overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded transition-all"
                            style={{ width: `${insightsPriceHistogram.maxCount > 0 ? (bucket.count / insightsPriceHistogram.maxCount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="w-6 text-background/60" style={{ fontFamily: 'var(--font-mono)' }}>{bucket.count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-background/50 mt-2" style={{ fontFamily: 'var(--font-mono)' }}>{insightsPriceHistogram.total} properties</p>
                </Card>
              )}

              {/* Neighbourhood Quick Stats */}
              {insightsNeighbourhoodStats && (
                <Card className="border border-border bg-foreground text-background p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    <Home className="w-4 h-4" />
                    Area Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background/10 rounded p-2 text-center">
                      <div className="text-lg font-bold text-green-400" style={{ fontFamily: 'var(--font-fraunces)' }}>{insightsNeighbourhoodStats.active}</div>
                      <div className="text-background/60" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em' }}>ACTIVE</div>
                    </div>
                    <div className="bg-background/10 rounded p-2 text-center">
                      <div className="text-lg font-bold text-amber-400" style={{ fontFamily: 'var(--font-fraunces)' }}>{insightsNeighbourhoodStats.underOffer}</div>
                      <div className="text-background/60" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em' }}>UNDER OFFER</div>
                    </div>
                    <div className="bg-background/10 rounded p-2 text-center">
                      <div className="text-lg font-bold text-red-400" style={{ fontFamily: 'var(--font-fraunces)' }}>{insightsNeighbourhoodStats.sold}</div>
                      <div className="text-background/60" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em' }}>SOLD</div>
                    </div>
                    <div className="bg-background/10 rounded p-2 text-center">
                      <div className="text-lg font-bold text-blue-400" style={{ fontFamily: 'var(--font-fraunces)' }}>{insightsNeighbourhoodStats.avgDaysOnMarket}d</div>
                      <div className="text-background/60" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em' }}>AVG DOM</div>
                    </div>
                  </div>
                  {insightsNeighbourhoodStats.medianPrice > 0 && (
                    <div className="mt-2 text-[11px] text-background/60 text-center" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      Median Price: <span className="text-background/90 font-medium" style={{ fontFamily: 'var(--font-mono)' }}>{formatRandAmount(insightsNeighbourhoodStats.medianPrice)}</span>
                    </div>
                  )}
                </Card>
              )}

              {/* Recently Sold */}
              {insightsRecentlySold.length > 0 && (
                <Card className="border border-border bg-foreground text-background p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    <Tag className="w-4 h-4" />
                    Recently Sold ({insightsRecentlySold.length})
                  </h3>
                  <div className="space-y-2">
                    {insightsRecentlySold.map((property) => (
                      <Link
                        key={property.id}
                        to={`/app/listings/${property.id}`}
                        className="block rounded bg-background/10 p-2 hover:bg-background/20 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <img
                            src={property.image}
                            alt=""
                            className="w-10 h-10 rounded object-cover shrink-0"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_PROPERTY_IMAGE; }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>{property.title}</p>
                            <p className="text-[10px] text-background/60 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>{property.location}</p>
                            <p className="text-[11px] font-bold text-red-400" style={{ fontFamily: 'var(--font-mono)' }}>{property.price}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Save Search Alert */}
              <Card className="border border-border bg-foreground text-background p-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  <Bell className="w-4 h-4" />
                  Search Alerts
                </h3>
                <p className="text-[11px] text-background/60 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>Get notified when new properties match your current search criteria.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-background/20 text-background hover:bg-background/10 text-xs"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                  onClick={() => {
                    // TODO: Wire to saved search API when available
                    alert('Save Search feature coming soon! You will receive email alerts when new properties match your filters.');
                  }}
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  Save This Search
                </Button>
              </Card>

              <Card className="border border-border bg-foreground text-background p-4">
                <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-fraunces)' }}>{insightsPropertyForSaleHeading}</h3>
                <div className="space-y-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  <button type="button" onClick={() => applyInsightsPropertyTypeFilter('house')} className="w-full text-left text-[11px] border-b border-background/15 pb-2 hover:underline focus:outline-none focus:underline">Houses for Sale{insightsLocationSuffix} ({insightsTypeCounts.house})</button>
                  <button type="button" onClick={() => applyInsightsPropertyTypeFilter('apartment')} className="w-full text-left text-[11px] border-b border-background/15 pb-2 hover:underline focus:outline-none focus:underline">Apartments / Flats for Sale{insightsLocationSuffix} ({insightsTypeCounts.apartment})</button>
                  <button type="button" onClick={() => applyInsightsPropertyTypeFilter('townhouse')} className="w-full text-left text-[11px] border-b border-background/15 pb-2 hover:underline focus:outline-none focus:underline">Townhouses for Sale{insightsLocationSuffix} ({insightsTypeCounts.townhouse})</button>
                  <button type="button" onClick={() => applyInsightsPropertyTypeFilter('land')} className="w-full text-left text-[11px] border-b border-background/15 pb-2 hover:underline focus:outline-none focus:underline">Vacant Land / Plots for Sale{insightsLocationSuffix} ({insightsTypeCounts.land})</button>
                  <button type="button" onClick={() => applyInsightsPropertyTypeFilter('farm')} className="w-full text-left text-[11px] border-b border-background/15 pb-2 hover:underline focus:outline-none focus:underline">Farms for Sale{insightsLocationSuffix} ({insightsTypeCounts.farm})</button>
                  <button type="button" onClick={() => applyInsightsPropertyTypeFilter('commercial')} className="w-full text-left text-[11px] border-b border-background/15 pb-2 hover:underline focus:outline-none focus:underline">Commercial Property for Sale{insightsLocationSuffix} ({insightsTypeCounts.commercial})</button>
                  <button type="button" onClick={() => applyInsightsPropertyTypeFilter('industrial')} className="w-full text-left text-[11px] border-b border-background/15 pb-1 hover:underline focus:outline-none focus:underline">Industrial Property for Sale{insightsLocationSuffix} ({insightsTypeCounts.industrial})</button>
                </div>
              </Card>
            </div>
          </aside>
        )}
        </div>
      </div>
    </div>

    {/* Initiate Sale Modal (own listing cards) */}
    {initiateCardProp && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b">
            <div>
              <h2 className="text-lg font-bold">Initiate Sale</h2>
              <p className="text-sm text-gray-500 truncate max-w-xs">{initiateCardProp.title}</p>
            </div>
            <button onClick={() => setInitiateCardProp(null)} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleInitCardSaleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Price *</label>
                <input type="number" min="1" step="0.01" value={initCardAgreedPrice} onChange={e => setInitCardAgreedPrice(e.target.value)} required placeholder="e.g. 1500000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                <select value={initCardCurrency} onChange={e => setInitCardCurrency(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="ZAR">ZAR</option>
                  <option value="USD">USD</option>
                  <option value="ZWL">ZWL</option>
                  <option value="BWP">BWP</option>
                  <option value="KES">KES</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount <span className="text-gray-400">(optional)</span></label>
              <input type="number" min="0" step="0.01" value={initCardDeposit} onChange={e => setInitCardDeposit(e.target.value)} placeholder="e.g. 150000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer ID <span className="text-gray-400">(optional)</span></label>
              <input type="text" value={initCardBuyerId} onChange={e => setInitCardBuyerId(e.target.value)} placeholder="Buyer's user UUID" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            {initCardError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{initCardError}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setInitiateCardProp(null)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600" disabled={submittingInitCard}>
                {submittingInitCard ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {submittingInitCard ? 'Creating…' : 'Initiate Sale'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Multi-agent listing selection dialog */}
    <MultiListingDialog
      open={multiListingDialogOpen}
      onOpenChange={setMultiListingDialogOpen}
      listings={selectedMultiListings}
      onSelectListing={handleMultiListingSelect}
    />
    </div>
  );
}