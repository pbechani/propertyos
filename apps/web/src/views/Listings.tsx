'use client';

import { useState, useMemo, useEffect, useRef } from "react";
import { MapPin, Filter, Grid3x3, List, Bookmark, Shield, Search, Map as MapIcon, X, Mic, MicOff, Sparkles, Volume2, BedDouble, Bath, CarFront, Maximize, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "@/lib/router-compat";
import { getAccessToken } from "@/lib/auth-session";
import { ApiError, propertiesApi, type AgentProfileResponse, type PropertyListing } from "@/lib/api-client";
import { usePathname, useSearchParams } from "next/navigation";

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

function normalizeCurrencyDigits(value: string): string {
  return value.replace(/[^\d]/g, '');
}

function formatSquareMeters(value: number): string {
  return `${value.toLocaleString('en-ZA').replace(/,/g, ' ')} m²`;
}

type ListingCard = {
  id: string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  garage: number;
  sqm: number;
  propertyType: string;
  status: 'draft' | 'active' | 'under_offer' | 'sold' | 'withdrawn';
  features: string[];
  verified: boolean;
  fraudFlagged: boolean;
  agent: string;
  agentCompany: string;
  agentAvatarUrl: string | null;
  agentCompanyLogoUrl: string | null;
  image: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
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
    looseProperty.agent?.companyLogoUrl,
    looseProperty.agent?.company_logo_url,
    looseProperty.agent_company_logo_url,
    looseProperty.company_logo_url,
  );

  const agentCompany = pickFirstString(
    looseProperty.agent?.companyName,
    looseProperty.agent?.company_name,
    looseProperty.company_name,
  ) ?? "PRIBEC Agent Network";

  return {
    id: property.id,
    title: property.title,
    location,
    price: Number.isFinite(numericPrice) ? formatPrice(numericPrice, property.currency) : formatPrice(0, property.currency),
    beds: property.bedrooms ?? 0,
    baths: property.bathrooms ?? 0,
    garage: property.parking_spaces ?? 0,
    sqm: property.area_sqm ? Number(property.area_sqm) : 0,
    propertyType: propertyTypeMap[property.property_type] ?? "house",
    status: property.status,
    features,
    verified: property.verification_status === "verified",
    fraudFlagged: property.verification_status === "flagged",
    agent: profileAgentName || "Verified Agent",
    agentCompany,
    agentAvatarUrl,
    agentCompanyLogoUrl,
    image: primaryImage || DEFAULT_PROPERTY_IMAGE,
    createdAt: property.created_at,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

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

function getInitials(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A';
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

export default function Listings() {
  const navigate = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
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
  const [showMinPriceCustomInput, setShowMinPriceCustomInput] = useState(false);
  const [showMaxPriceCustomInput, setShowMaxPriceCustomInput] = useState(false);
  const [showFloorSizeCustomInput, setShowFloorSizeCustomInput] = useState(false);
  const [showErfSizeCustomInput, setShowErfSizeCustomInput] = useState(false);
  const [minPriceCustomInput, setMinPriceCustomInput] = useState("");
  const [maxPriceCustomInput, setMaxPriceCustomInput] = useState("");
  const [floorSizeCustomInput, setFloorSizeCustomInput] = useState("");
  const [erfSizeCustomInput, setErfSizeCustomInput] = useState("");
  const [pendingFilters, setPendingFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  const [properties, setProperties] = useState<ListingCard[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");
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
  };

  const openMinPriceDropdown = () => {
    setShowMinPriceDropdown((prev) => !prev);
    setShowMaxPriceDropdown(false);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowFloorSizeDropdown(false);
    setShowErfSizeDropdown(false);
    setShowMinPriceCustomInput(false);
  };

  const openMaxPriceDropdown = () => {
    setShowMaxPriceDropdown((prev) => !prev);
    setShowMinPriceDropdown(false);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowFloorSizeDropdown(false);
    setShowErfSizeDropdown(false);
    setShowMaxPriceCustomInput(false);
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
    setShowFloorSizeDropdown((prev) => !prev);
    setShowErfSizeDropdown(false);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowMinPriceDropdown(false);
    setShowMaxPriceDropdown(false);
    setShowFloorSizeCustomInput(false);
  };

  const openErfSizeDropdown = () => {
    setShowErfSizeDropdown((prev) => !prev);
    setShowFloorSizeDropdown(false);
    setShowBedroomsDropdown(false);
    setShowBathroomsDropdown(false);
    setShowParkingDropdown(false);
    setShowMinPriceDropdown(false);
    setShowMaxPriceDropdown(false);
    setShowErfSizeCustomInput(false);
  };

  const selectBedrooms = (value: number) => {
    setPendingFilters((prev) => ({
      ...prev,
      minBedrooms: value,
    }));
    setShowBedroomsDropdown(false);
  };

  const selectBathrooms = (value: number) => {
    setPendingFilters((prev) => ({
      ...prev,
      minBathrooms: value,
    }));
    setShowBathroomsDropdown(false);
  };

  const selectParking = (value: number) => {
    setPendingFilters((prev) => ({
      ...prev,
      minGarage: value,
    }));
    setShowParkingDropdown(false);
  };

  const selectFloorSize = (value: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      minFloorSize: value,
    }));
    setShowFloorSizeDropdown(false);
    setShowFloorSizeCustomInput(false);
  };

  const selectErfSize = (value: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      minErfSize: value,
    }));
    setShowErfSizeDropdown(false);
    setShowErfSizeCustomInput(false);
  };

  const applyCustomFloorSize = () => {
    const normalized = normalizeCurrencyDigits(floorSizeCustomInput);
    const parsed = Number(normalized);

    setPendingFilters((prev) => ({
      ...prev,
      minFloorSize: Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '',
    }));

    setShowFloorSizeDropdown(false);
    setShowFloorSizeCustomInput(false);
  };

  const applyCustomErfSize = () => {
    const normalized = normalizeCurrencyDigits(erfSizeCustomInput);
    const parsed = Number(normalized);

    setPendingFilters((prev) => ({
      ...prev,
      minErfSize: Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '',
    }));

    setShowErfSizeDropdown(false);
    setShowErfSizeCustomInput(false);
  };

  const handleSelectMinPrice = (value: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      minPrice: value,
    }));
    setShowMinPriceDropdown(false);
    setShowMinPriceCustomInput(false);
  };

  const handleSelectMaxPrice = (value: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      maxPrice: value,
    }));
    setShowMaxPriceDropdown(false);
    setShowMaxPriceCustomInput(false);
  };

  const applyCustomMinPrice = () => {
    const normalized = normalizeCurrencyDigits(minPriceCustomInput);
    const parsed = Number(normalized);

    setPendingFilters((prev) => ({
      ...prev,
      minPrice: Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '',
    }));

    setShowMinPriceDropdown(false);
    setShowMinPriceCustomInput(false);
  };

  const applyCustomMaxPrice = () => {
    const normalized = normalizeCurrencyDigits(maxPriceCustomInput);
    const parsed = Number(normalized);

    setPendingFilters((prev) => ({
      ...prev,
      maxPrice: Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '',
    }));

    setShowMaxPriceDropdown(false);
    setShowMaxPriceCustomInput(false);
  };

  const handleResetFilters = () => {
    const defaults = getDefaultFilters();
    setLocationInput("");
    setPendingFilters(defaults);
    setAppliedFilters(defaults);
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

  const handleAddToFavourites = () => {
    const token = getAccessToken();
    if (!token) {
      const query = searchParams.toString();
      const currentPath = `${pathname}${query ? `?${query}` : ''}`;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }

    // TODO: Persist saved property when favorites backend endpoint is available.
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

  useEffect(() => {
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

      if (appliedFilters.verifiedOnly && !property.verified) {
        return false;
      }

      if (selectedPropertyTypes.length > 0) {
        const matchesPropertyType =
          (property.propertyType === 'house' && (selectedPropertyTypes.includes('house') || selectedPropertyTypes.includes('townhouse')))
          || (property.propertyType === 'apartment' && selectedPropertyTypes.includes('apartment'))
          || (property.propertyType === 'land' && (selectedPropertyTypes.includes('land') || selectedPropertyTypes.includes('farm')))
          || (property.propertyType === 'commercial' && (selectedPropertyTypes.includes('commercial') || selectedPropertyTypes.includes('industrial')));

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

      const propertyFeaturesLower = property.features.map((feature) => feature.toLowerCase());

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
  }, [appliedFilters, properties]);

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

  const mapPoints = useMemo<MapPoint[]>(() => {
    return sortedProperties
      .filter(
        (property) =>
          property.latitude !== null
          && property.longitude !== null,
      )
      .map((property) => ({
        id: property.id,
        title: property.title,
        price: property.price,
        latitude: property.latitude as number,
        longitude: property.longitude as number,
      }));
  }, [sortedProperties]);

  const mapViewport = useMemo(() => {
    if (mapPoints.length === 0) {
      return null;
    }

    const latitudes = mapPoints.map((point) => point.latitude);
    const longitudes = mapPoints.map((point) => point.longitude);

    const minLatitude = Math.min(...latitudes);
    const maxLatitude = Math.max(...latitudes);
    const minLongitude = Math.min(...longitudes);
    const maxLongitude = Math.max(...longitudes);

    const latPadding = Math.max(0.03, (maxLatitude - minLatitude) * 0.25 || 0.03);
    const lonPadding = Math.max(0.03, (maxLongitude - minLongitude) * 0.25 || 0.03);

    return {
      minLatitude: minLatitude - latPadding,
      maxLatitude: maxLatitude + latPadding,
      minLongitude: minLongitude - lonPadding,
      maxLongitude: maxLongitude + lonPadding,
      centerLatitude: (minLatitude + maxLatitude) / 2,
      centerLongitude: (minLongitude + maxLongitude) / 2,
    };
  }, [mapPoints]);

  const mapImageUrl = useMemo(() => {
    if (!mapViewport) {
      return null;
    }

    if (MAPBOX_TOKEN) {
      const markers = mapPoints
        .slice(0, 20)
        .map((point) => `pin-s+2563eb(${point.longitude},${point.latitude})`)
        .join(',');

      const markerPrefix = markers.length > 0 ? `${markers}/` : '';
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markerPrefix}${mapViewport.centerLongitude},${mapViewport.centerLatitude},9/1200x800?access_token=${MAPBOX_TOKEN}`;
    }

    const bbox = [
      mapViewport.minLongitude,
      mapViewport.minLatitude,
      mapViewport.maxLongitude,
      mapViewport.maxLatitude,
    ].join(',');

    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`;
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
      const minLabel = minPrice !== null ? `R ${(minPrice / 1_000_000).toFixed(0)}M` : 'Any';
      const maxLabel = maxPrice !== null ? `R ${(maxPrice / 1_000_000).toFixed(0)}M` : 'Any';
      badges.push(`${minLabel} - ${maxLabel}`);
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

  const insightsLocation = useMemo(() => {
    if (appliedFilters.locations.length > 0) {
      return appliedFilters.locations[0];
    }

    const locationCounts = new Map<string, number>();
    sortedProperties.forEach((property) => {
      const primary = property.location.split(',')[0]?.trim();
      if (!primary) {
        return;
      }
      locationCounts.set(primary, (locationCounts.get(primary) ?? 0) + 1);
    });

    const ranked = Array.from(locationCounts.entries()).sort((a, b) => b[1] - a[1]);
    return ranked[0]?.[0] ?? 'Selected Area';
  }, [appliedFilters.locations, sortedProperties]);

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

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-primary rounded-lg p-3 md:p-4 mb-4">
          <div className="bg-card border border-border rounded-lg p-2 md:p-3">
          <div className="flex flex-col lg:flex-row gap-1.5 bg-foreground text-background rounded-xl border border-border/40 shadow-md p-1.5">
            <div className="relative w-full lg:w-44">
              <button
                type="button"
                className="w-full h-11 px-3 border-0 lg:border-r lg:border-background/20 bg-transparent rounded-lg text-sm font-medium text-background flex items-center justify-between"
                onClick={() => setShowListingCategoryDropdown((prev) => !prev)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowListingCategoryDropdown(false);
                  }, 120);
                }}
                aria-label="Listing category"
              >
                <span>{listingCategory}</span>
                {showListingCategoryDropdown ? <ChevronUp className="w-4 h-4 text-background/70" /> : <ChevronDown className="w-4 h-4 text-background/70" />}
              </button>

              {showListingCategoryDropdown && (
                <div
                  className="absolute left-0 top-[calc(100%+6px)] z-40 w-full min-w-44 rounded-lg border border-background/20 bg-[#101518] p-1 shadow-xl"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {LISTING_CATEGORY_OPTIONS.map((option) => {
                    const isActive = option === listingCategory;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setListingCategory(option);
                          setShowListingCategoryDropdown(false);
                        }}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-[#1f5cab] text-white'
                            : 'text-background/85 hover:bg-background/10 hover:text-background'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative flex-1 min-w-0">
              <div className="rounded-lg border border-background/20 bg-transparent px-3 min-h-11 flex items-center gap-2 overflow-x-auto">
                <Search className="w-4 h-4 text-background/60 shrink-0" />
                {pendingFilters.locations.map((location) => (
                  <Badge key={location} className="shrink-0 h-8 px-2.5 text-xs font-medium rounded-md gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    {location}
                    <button
                      type="button"
                      aria-label={`Remove ${location}`}
                      onClick={() => removePendingLocation(location)}
                      className="text-primary-foreground/80 hover:text-primary-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  value={locationInput}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowLocationSuggestions(false);
                    }, 120);
                  }}
                  onChange={(event) => {
                    setLocationInput(event.target.value);
                    setShowLocationSuggestions(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
                      event.preventDefault();
                      if (locationSuggestions.length > 0) {
                        addPendingLocation(locationSuggestions[0]);
                        return;
                      }

                      addPendingLocation();
                    }

                    if (event.key === 'Escape') {
                      setShowLocationSuggestions(false);
                    }
                  }}
                  placeholder={pendingFilters.locations.length > 0 ? '...add more' : 'Search location'}
                  className="w-full min-w-28 bg-transparent text-sm text-background placeholder:text-background/55 outline-hidden"
                />

                {locationInput.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationInput('');
                      setShowLocationSuggestions(false);
                    }}
                    className="shrink-0 text-background/60 hover:text-background"
                    aria-label="Clear location input"
                    title="Clear location input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-lg border border-input bg-card shadow-lg overflow-hidden">
                  {locationSuggestions.map((location) => (
                    <button
                      key={location}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        addPendingLocation(location);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      {location}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode((prev) => (prev === 'map' ? 'grid' : 'map'))}
              className="w-full lg:w-auto h-11 px-5 rounded-lg border-background/30 bg-transparent text-background hover:bg-background/10"
            >
              Map
              <MapIcon className="w-4 h-4 ml-2" />
            </Button>

            <Button onClick={handleTopSearch} className="w-full lg:w-auto h-11 px-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
              Search
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
            <div className="relative">
              <button
                type="button"
                className="w-full h-11 px-3 border border-input bg-input-background rounded-lg text-sm flex items-center justify-between"
                onClick={() => setShowPropertyTypeDropdown((prev) => !prev)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowPropertyTypeDropdown(false);
                  }, 120);
                }}
                aria-label="Property type"
              >
                <span>
                  {selectedPropertyTypeCount > 0 ? `Property Type (${selectedPropertyTypeCount})` : 'Property Type'}
                </span>
                {showPropertyTypeDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showPropertyTypeDropdown && (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-lg border border-input bg-card shadow-lg p-2"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <label key={option.key} className="flex items-center gap-2 text-sm px-1 py-1.5">
                        <input
                          type="checkbox"
                          checked={pendingFilters.propertyTypes[option.key]}
                          onChange={(event) =>
                            setPendingFilters((prev) => ({
                              ...prev,
                              propertyTypes: {
                                ...prev.propertyTypes,
                                [option.key]: event.target.checked,
                              },
                            }))
                          }
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <Button
                    type="button"
                    className="w-full mt-2"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setShowPropertyTypeDropdown(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="w-full h-11 px-3 border border-input bg-input-background rounded-lg text-sm flex items-center justify-between"
                onClick={openMinPriceDropdown}
                onBlur={() => {
                  setTimeout(() => {
                    setShowMinPriceDropdown(false);
                    setShowMinPriceCustomInput(false);
                  }, 120);
                }}
                aria-label="Minimum price"
              >
                <span>{minPriceLabel}</span>
                {showMinPriceDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showMinPriceDropdown && (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-background/20 bg-foreground text-background shadow-2xl p-2"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {!showMinPriceCustomInput ? (
                    <>
                      <div className="max-h-64 overflow-y-auto pr-1">
                        <button
                          type="button"
                          onClick={() => handleSelectMinPrice('')}
                          className={`w-full px-3 py-2 text-left text-sm rounded-md ${pendingFilters.minPrice ? 'hover:bg-background/10' : 'bg-primary text-primary-foreground'}`}
                        >
                          Any
                        </button>
                        {PRICE_PRESET_OPTIONS.map((price) => (
                          <button
                            key={price}
                            type="button"
                            onClick={() => handleSelectMinPrice(String(price))}
                            className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-background/10 ${pendingFilters.minPrice === String(price) ? 'bg-primary text-primary-foreground' : ''}`}
                          >
                            {formatRandValue(price)}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-background/20">
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-background/10 rounded-md"
                          onClick={() => {
                            setMinPriceCustomInput(pendingFilters.minPrice ? formatRandValue(Number(pendingFilters.minPrice)) : 'R 0');
                            setShowMinPriceCustomInput(true);
                          }}
                        >
                          Custom Price
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={minPriceCustomInput}
                        onChange={(event) => setMinPriceCustomInput(event.target.value)}
                        className="w-full h-10 px-3 border border-background/30 bg-background/20 rounded-md text-sm"
                        placeholder="R 0"
                      />
                      <Button type="button" className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={applyCustomMinPrice}>
                        Done
                      </Button>
                      <button
                        type="button"
                        className="w-full mt-2 text-sm text-background/70 hover:text-background"
                        onClick={() => setShowMinPriceCustomInput(false)}
                      >
                        Switch to List View
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="w-full h-11 px-3 border border-input bg-input-background rounded-lg text-sm flex items-center justify-between"
                onClick={openMaxPriceDropdown}
                onBlur={() => {
                  setTimeout(() => {
                    setShowMaxPriceDropdown(false);
                    setShowMaxPriceCustomInput(false);
                  }, 120);
                }}
                aria-label="Maximum price"
              >
                <span>{maxPriceLabel}</span>
                {showMaxPriceDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showMaxPriceDropdown && (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-background/20 bg-foreground text-background shadow-2xl p-2"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {!showMaxPriceCustomInput ? (
                    <>
                      <div className="max-h-64 overflow-y-auto pr-1">
                        <button
                          type="button"
                          onClick={() => handleSelectMaxPrice('')}
                          className={`w-full px-3 py-2 text-left text-sm rounded-md ${pendingFilters.maxPrice ? 'hover:bg-background/10' : 'bg-primary text-primary-foreground'}`}
                        >
                          Any
                        </button>
                        {PRICE_PRESET_OPTIONS.map((price) => (
                          <button
                            key={price}
                            type="button"
                            onClick={() => handleSelectMaxPrice(String(price))}
                            className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-background/10 ${pendingFilters.maxPrice === String(price) ? 'bg-primary text-primary-foreground' : ''}`}
                          >
                            {formatRandValue(price)}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-background/20">
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-background/10 rounded-md"
                          onClick={() => {
                            setMaxPriceCustomInput(pendingFilters.maxPrice ? formatRandValue(Number(pendingFilters.maxPrice)) : 'R 0');
                            setShowMaxPriceCustomInput(true);
                          }}
                        >
                          Custom Price
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={maxPriceCustomInput}
                        onChange={(event) => setMaxPriceCustomInput(event.target.value)}
                        className="w-full h-10 px-3 border border-background/30 bg-background/20 rounded-md text-sm"
                        placeholder="R 0"
                      />
                      <Button type="button" className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={applyCustomMaxPrice}>
                        Done
                      </Button>
                      <button
                        type="button"
                        className="w-full mt-2 text-sm text-background/70 hover:text-background"
                        onClick={() => setShowMaxPriceCustomInput(false)}
                      >
                        Switch to List View
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="w-full h-11 px-3 border border-input bg-input-background rounded-lg text-sm flex items-center justify-between"
                onClick={openBedroomsDropdown}
                onBlur={() => {
                  setTimeout(() => {
                    setShowBedroomsDropdown(false);
                  }, 120);
                }}
                aria-label="Minimum bedrooms"
              >
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-xs">Bedrooms</span>
                  {pendingFilters.minBedrooms > 0 && <span className="text-sm font-medium">{bedroomsLabel}</span>}
                </span>
                {showBedroomsDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showBedroomsDropdown && (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-background/20 bg-foreground text-background shadow-2xl p-2"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => selectBedrooms(0)}
                      className={`w-full px-3 py-2 text-left text-sm rounded-md ${pendingFilters.minBedrooms > 0 ? 'hover:bg-background/10' : 'bg-primary text-primary-foreground'}`}
                    >
                      Any
                    </button>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => selectBedrooms(value)}
                        className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-background/10 ${pendingFilters.minBedrooms === value ? 'bg-primary text-primary-foreground' : ''}`}
                      >
                        {value}+
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowTopMoreFilters((prev) => !prev)}
              className="w-full h-11"
            >
              {showTopMoreFilters ? 'Less Filters −' : 'More Filters +'}
            </Button>

            <Button
              variant="outline"
              onClick={handleVoiceSearch}
              className="w-full h-11"
            >
              <Mic className="w-4 h-4 mr-2" />
              AI Search
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {showTopMoreFilters && (
            <>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="relative">
                  <button
                    type="button"
                    className="w-full h-11 px-3 border border-input bg-input-background rounded-lg text-sm flex items-center justify-between"
                    onClick={openBathroomsDropdown}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowBathroomsDropdown(false);
                      }, 120);
                    }}
                    aria-label="Minimum bathrooms"
                  >
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-xs">Bathrooms</span>
                      {pendingFilters.minBathrooms > 0 && <span className="text-sm font-medium">{bathroomsLabel}</span>}
                    </span>
                    {showBathroomsDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showBathroomsDropdown && (
                    <div
                      className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-background/20 bg-foreground text-background shadow-2xl p-2"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <div className="max-h-64 overflow-y-auto pr-1">
                        <button
                          type="button"
                          onClick={() => selectBathrooms(0)}
                          className={`w-full px-3 py-2 text-left text-sm rounded-md ${pendingFilters.minBathrooms > 0 ? 'hover:bg-background/10' : 'bg-primary text-primary-foreground'}`}
                        >
                          Any
                        </button>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => selectBathrooms(value)}
                            className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-background/10 ${pendingFilters.minBathrooms === value ? 'bg-primary text-primary-foreground' : ''}`}
                          >
                            {value}+
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="w-full h-11 px-3 border border-input bg-input-background rounded-lg text-sm flex items-center justify-between"
                    onClick={openParkingDropdown}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowParkingDropdown(false);
                      }, 120);
                    }}
                    aria-label="Minimum parking or garage"
                  >
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-xs">Parking / Garage</span>
                      {pendingFilters.minGarage > 0 && <span className="text-sm font-medium">{parkingLabel}</span>}
                    </span>
                    {showParkingDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showParkingDropdown && (
                    <div
                      className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-background/20 bg-foreground text-background shadow-2xl p-2"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <div className="max-h-64 overflow-y-auto pr-1">
                        <button
                          type="button"
                          onClick={() => selectParking(0)}
                          className={`w-full px-3 py-2 text-left text-sm rounded-md ${pendingFilters.minGarage > 0 ? 'hover:bg-background/10' : 'bg-primary text-primary-foreground'}`}
                        >
                          Any
                        </button>
                        {[1, 2, 3, 4].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => selectParking(value)}
                            className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-background/10 ${pendingFilters.minGarage === value ? 'bg-primary text-primary-foreground' : ''}`}
                          >
                            {value}+
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="w-full h-11 px-3 border border-input bg-input-background rounded-lg text-sm flex items-center justify-between"
                    onClick={openFloorSizeDropdown}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowFloorSizeDropdown(false);
                        setShowFloorSizeCustomInput(false);
                      }, 120);
                    }}
                    aria-label="Minimum floor size"
                  >
                    <span>{floorSizeLabel}</span>
                    {showFloorSizeDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showFloorSizeDropdown && (
                    <div
                      className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-background/20 bg-foreground text-background shadow-2xl p-2"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      {!showFloorSizeCustomInput ? (
                        <>
                          <div className="max-h-64 overflow-y-auto pr-1">
                            <button
                              type="button"
                              onClick={() => selectFloorSize('')}
                              className={`w-full px-3 py-2 text-left text-sm rounded-md ${pendingFilters.minFloorSize ? 'hover:bg-background/10' : 'bg-primary text-primary-foreground'}`}
                            >
                              Any
                            </button>
                            {SIZE_PRESET_OPTIONS.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => selectFloorSize(String(size))}
                                className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-background/10 ${pendingFilters.minFloorSize === String(size) ? 'bg-primary text-primary-foreground' : ''}`}
                              >
                                {formatSquareMeters(size)}
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-background/20">
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-background/10 rounded-md"
                              onClick={() => {
                                setFloorSizeCustomInput(pendingFilters.minFloorSize ? formatSquareMeters(Number(pendingFilters.minFloorSize)) : '0');
                                setShowFloorSizeCustomInput(true);
                              }}
                            >
                              Custom Size
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={floorSizeCustomInput}
                            onChange={(event) => setFloorSizeCustomInput(event.target.value)}
                            className="w-full h-10 px-3 border border-background/30 bg-background/20 rounded-md text-sm"
                            placeholder="0"
                          />
                          <Button type="button" className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={applyCustomFloorSize}>
                            Done
                          </Button>
                          <button
                            type="button"
                            className="w-full mt-2 text-sm text-background/70 hover:text-background"
                            onClick={() => setShowFloorSizeCustomInput(false)}
                          >
                            Switch to List View
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="w-full h-11 px-3 border border-input bg-input-background rounded-lg text-sm flex items-center justify-between"
                    onClick={openErfSizeDropdown}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowErfSizeDropdown(false);
                        setShowErfSizeCustomInput(false);
                      }, 120);
                    }}
                    aria-label="Minimum erf size"
                  >
                    <span>{erfSizeLabel}</span>
                    {showErfSizeDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showErfSizeDropdown && (
                    <div
                      className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-background/20 bg-foreground text-background shadow-2xl p-2"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      {!showErfSizeCustomInput ? (
                        <>
                          <div className="max-h-64 overflow-y-auto pr-1">
                            <button
                              type="button"
                              onClick={() => selectErfSize('')}
                              className={`w-full px-3 py-2 text-left text-sm rounded-md ${pendingFilters.minErfSize ? 'hover:bg-background/10' : 'bg-primary text-primary-foreground'}`}
                            >
                              Any
                            </button>
                            {SIZE_PRESET_OPTIONS.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => selectErfSize(String(size))}
                                className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-background/10 ${pendingFilters.minErfSize === String(size) ? 'bg-primary text-primary-foreground' : ''}`}
                              >
                                {formatSquareMeters(size)}
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-background/20">
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-background/10 rounded-md"
                              onClick={() => {
                                setErfSizeCustomInput(pendingFilters.minErfSize ? formatSquareMeters(Number(pendingFilters.minErfSize)) : '0');
                                setShowErfSizeCustomInput(true);
                              }}
                            >
                              Custom Size
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={erfSizeCustomInput}
                            onChange={(event) => setErfSizeCustomInput(event.target.value)}
                            className="w-full h-10 px-3 border border-background/30 bg-background/20 rounded-md text-sm"
                            placeholder="0"
                          />
                          <Button type="button" className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={applyCustomErfSize}>
                            Done
                          </Button>
                          <button
                            type="button"
                            className="w-full mt-2 text-sm text-background/70 hover:text-background"
                            onClick={() => setShowErfSizeCustomInput(false)}
                          >
                            Switch to List View
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Features</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pendingFilters.features.petFriendly}
                        onChange={(event) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            features: { ...prev.features, petFriendly: event.target.checked },
                          }))
                        }
                      />
                      <span>Pet Friendly</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pendingFilters.features.garden}
                        onChange={(event) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            features: { ...prev.features, garden: event.target.checked },
                          }))
                        }
                      />
                      <span>Garden</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pendingFilters.features.pool}
                        onChange={(event) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            features: { ...prev.features, pool: event.target.checked },
                          }))
                        }
                      />
                      <span>Pool</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pendingFilters.features.flatlet}
                        onChange={(event) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            features: { ...prev.features, flatlet: event.target.checked },
                          }))
                        }
                      />
                      <span>Flatlet</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Other</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pendingFilters.other.retirement}
                        onChange={(event) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            other: { ...prev.other, retirement: event.target.checked },
                          }))
                        }
                      />
                      <span>Retirement</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pendingFilters.other.repossessed}
                        onChange={(event) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            other: { ...prev.other, repossessed: event.target.checked },
                          }))
                        }
                      />
                      <span>Repossessed</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pendingFilters.other.onShow}
                        onChange={(event) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            other: { ...prev.other, onShow: event.target.checked },
                          }))
                        }
                      />
                      <span>On Show</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pendingFilters.features.security}
                        onChange={(event) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            features: { ...prev.features, security: event.target.checked },
                          }))
                        }
                      />
                      <span>Security Estate / Cluster</span>
                    </label>
                    <label className="flex items-center gap-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={pendingFilters.other.auction}
                        onChange={(event) =>
                          setPendingFilters((prev) => ({
                            ...prev,
                            other: { ...prev.other, auction: event.target.checked },
                          }))
                        }
                      />
                      <span>Auction</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Click search to browse <span className="font-semibold text-foreground">{properties.length.toLocaleString('en-ZA')}</span> properties
                </span>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-primary hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            </>
          )}


          </div>
        </div>

        <div className="lg:flex lg:items-start lg:gap-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden h-full flex flex-col lg:flex-row overflow-x-hidden flex-1">
      {/* Filters Sidebar */}
      <div className={`
        ${showFilters ? 'block' : 'hidden'}
        ${showDesktopFilters ? 'lg:block' : 'lg:hidden'}
        w-full lg:w-80 shrink-0 max-w-full
        bg-card border-r border-border 
        p-4 md:p-6 
        overflow-y-auto overflow-x-hidden
        ${showFilters ? 'fixed inset-0 z-50 lg:relative' : ''}
      `}>
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <div className="flex items-center gap-2">
            <button className="text-primary text-sm hover:underline" onClick={handleResetFilters}>Reset All</button>
            <button 
              onClick={() => setShowFilters(false)}
              className="lg:hidden p-2 hover:bg-accent rounded"
              aria-label="Close filters"
              title="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verified Toggle */}
        <div className="mb-4 pb-4 border-b border-border">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-medium">Verified Only</span>
            </div>
            <input
              type="checkbox"
              className="toggle"
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
        <div className="mb-4 pb-4 border-b border-border">
          <h3 className="font-medium mb-2">Bathrooms</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Min Bathrooms</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 border border-input rounded flex items-center justify-center"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setPendingFilters((prev) => ({
                      ...prev,
                      minBathrooms: Math.max(0, prev.minBathrooms - 1),
                    }));
                  }}
                >
                  -
                </button>
                <span className="w-12 text-center">{pendingFilters.minBathrooms}+</span>
                <button
                  type="button"
                  className="w-8 h-8 border border-input rounded flex items-center justify-center"
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
        <div className="mb-4">
          <h3 className="font-medium mb-2">Features</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pendingFilters.features.pool}
                onChange={(event) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    features: { ...prev.features, pool: event.target.checked },
                  }))
                }
              />
              <span className="text-sm">Pool</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pendingFilters.features.garden}
                onChange={(event) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    features: { ...prev.features, garden: event.target.checked },
                  }))
                }
              />
              <span className="text-sm">Garden</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pendingFilters.features.petFriendly}
                onChange={(event) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    features: { ...prev.features, petFriendly: event.target.checked },
                  }))
                }
              />
              <span className="text-sm">Pet Friendly</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pendingFilters.features.security}
                onChange={(event) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    features: { ...prev.features, security: event.target.checked },
                  }))
                }
              />
              <span className="text-sm">Security</span>
            </label>
          </div>
        </div>

        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleApplyFilters}>
          <Search className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>

        {/* Voice Search Button */}
        <Button 
          onClick={handleVoiceSearch}
          className="w-full mt-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Mic className="w-4 h-4 mr-2" />
          AI Voice Search
          <Sparkles className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Try: "Show me 3 bedroom houses in Cape Town with a pool"
        </p>
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
        {/* Results Header */}
        <div className="bg-card border-b border-border px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-1">
                <span className="text-green-600 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {sortedProperties.length} {appliedFilters.verifiedOnly ? 'Verified ' : ''}Propert{sortedProperties.length === 1 ? 'y' : 'ies'} Found
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

        {/* Alert Banner */}
        {fraudFlaggedCount > 0 && (
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

        {isLoadingProperties && (
          <div className="mx-4 md:mx-6 mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Loading listings from database...
          </div>
        )}

        {!isLoadingProperties && propertiesError && (
          <div className="mx-4 md:mx-6 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {propertiesError}
          </div>
        )}

        {/* Map View */}
        {viewMode === "map" && (
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="relative bg-gray-100 rounded-lg h-full min-h-125 overflow-hidden">
              {mapImageUrl ? (
                MAPBOX_TOKEN ? (
                  <img
                    src={mapImageUrl}
                    alt="Map view"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <iframe
                    title="Property map"
                    src={mapImageUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-600 px-6 text-center">
                  Map view is available for listings with location coordinates.
                </div>
              )}
              {/* Property pins on map */}
              {mapPins.map((property) => (
                <Link
                  key={property.id}
                  to={`/app/property/${property.id}`}
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
        {viewMode !== "map" && (
          <div className="flex-1 overflow-auto p-4 md:p-6">
                {!isLoadingProperties && sortedProperties.length === 0 && !propertiesError && (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
                    No properties found in the database for the selected filters.
                  </div>
                )}
                <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 md:gap-6" : "flex flex-col gap-4 md:gap-6"}>
                {sortedProperties.map((property) => (
                  <Link
                    key={property.id}
                    to={`/app/property/${property.id}`}
                    className="group"
                  >
                    {(() => {
                      const statusBadge = getListingStatusBadge(property.status);
                      const verificationBadge = property.fraudFlagged
                        ? { label: 'FLAGGED', className: 'bg-red-600 text-white' }
                        : property.verified
                          ? { label: 'VERIFIED', className: 'bg-green-500 text-white' }
                          : { label: 'UNVERIFIED', className: 'bg-yellow-600 text-white' };
                      const companyInitials = getInitials(property.agentCompany);
                      const agentInitials = getInitials(property.agent);

                      return (
                    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${viewMode === "list" ? "flex flex-col md:flex-row" : ""}`}>
                      <div className={`relative ${viewMode === "list" ? "md:w-80 shrink-0" : ""}`}>
                        <img
                          src={property.image}
                          alt={property.title}
                          className={`w-full object-cover ${viewMode === "list" ? "h-48 md:h-full" : "h-48 md:h-64"}`}
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <Badge className={verificationBadge.className}>
                            {verificationBadge.label === 'VERIFIED' && <Shield className="w-3 h-3 mr-1" />}
                            {verificationBadge.label}
                          </Badge>
                          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                        </div>
                        <button
                          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                          aria-label="Save property"
                          title="Save property"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleAddToFavourites();
                          }}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4 md:p-5 flex-1">
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1 group-hover:text-blue-600 transition-colors truncate">
                              {property.title}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{property.location}</span>
                            </p>
                          </div>
                          <div className="text-lg md:text-xl font-bold text-blue-600 whitespace-nowrap">{property.price}</div>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 mb-4 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <BedDouble className="w-3.5 h-3.5" />
                            <span>{property.beds}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5" />
                            <span>{property.baths}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CarFront className="w-3.5 h-3.5" />
                            <span>{property.garage}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Maximize className="w-3.5 h-3.5" />
                            <span>{property.sqm} M²</span>
                          </span>
                        </div>
                        <div className="pt-4 border-t border-gray-200 flex items-start justify-between gap-3">
                          {property.agentCompanyLogoUrl ? (
                            <img
                              src={property.agentCompanyLogoUrl}
                              alt={property.agentCompany}
                              className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0" title={property.agentCompany}>
                              {companyInitials}
                            </div>
                          )}
                          <div className="ml-auto flex flex-col items-center text-center shrink-0">
                            {property.agentAvatarUrl ? (
                              <img
                                src={property.agentAvatarUrl}
                                alt={property.agent}
                                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                {agentInitials}
                              </div>
                            )}
                            <div className="text-xs font-medium text-gray-700 mt-1 max-w-24 truncate" title={property.agent}>{property.agent}</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                      );
                    })()}
                  </Link>
                ))}
                </div>
              </div>
        )}
        </div>

        {viewMode !== "map" && (
          <aside className="hidden lg:block w-70 shrink-0 pt-4 pb-4 lg:pl-4 lg:pr-4 lg:border-l lg:border-border/60">
            <div className="sticky top-4 space-y-4">
              <Card className="border border-border bg-foreground text-background p-4">
                <h3 className="text-xl font-semibold">{insightsLocation} Trends</h3>
                <p className="text-sm text-background/70 mb-4">Average Property Price</p>

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
                  <div className="absolute right-3 top-3 rounded-xl bg-sky-500 px-3 py-1 text-xs font-semibold text-white">
                    {formatRandAmount(Math.round(insightsTrend.latestValue))}
                  </div>
                  <div className="absolute left-3 bottom-2 right-3 flex items-center justify-between text-[10px] text-background/65">
                    {insightsTrend.years.map((year) => (
                      <span key={year}>{year}</span>
                    ))}
                  </div>
                </div>

                <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                  More Trends and Statistics
                </Button>
              </Card>

              <Card className="border border-border bg-foreground text-background p-4">
                <h3 className="text-xl font-semibold mb-3">{insightsLocation} Property for Sale</h3>
                <div className="space-y-2 text-sm">
                  <div className="border-b border-background/15 pb-2">Houses for Sale in {insightsLocation} ({insightsTypeCounts.house})</div>
                  <div className="border-b border-background/15 pb-2">Apartments / Flats for Sale in {insightsLocation} ({insightsTypeCounts.apartment})</div>
                  <div className="border-b border-background/15 pb-2">Townhouses for Sale in {insightsLocation} ({insightsTypeCounts.townhouse})</div>
                  <div className="border-b border-background/15 pb-2">Vacant Land / Plots for Sale in {insightsLocation} ({insightsTypeCounts.land})</div>
                  <div className="border-b border-background/15 pb-2">Farms for Sale in {insightsLocation} ({insightsTypeCounts.farm})</div>
                  <div className="border-b border-background/15 pb-2">Commercial Property for Sale in {insightsLocation} ({insightsTypeCounts.commercial})</div>
                  <div className="border-b border-background/15 pb-1">Industrial Property for Sale in {insightsLocation} ({insightsTypeCounts.industrial})</div>
                </div>
              </Card>
            </div>
          </aside>
        )}
        </div>
      </div>
    </div>
    </div>
  );
}