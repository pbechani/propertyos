'use client';

import { useState, useMemo, useEffect } from "react";
import { MapPin, Filter, Grid3x3, List, Bookmark, Shield, Search, Map, X, Mic, MicOff, Sparkles, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "@/lib/router-compat";
import { getAccessToken } from "@/lib/auth-session";
import { ApiError, propertiesApi, type PropertyListing } from "@/lib/api-client";
import { usePathname, useSearchParams } from "next/navigation";

const getDefaultFilters = () => ({
  verifiedOnly: false,
  propertyTypes: {
    house: false,
    apartment: false,
    land: false,
    commercial: false,
  },
  locations: [] as string[],
  minPrice: "",
  maxPrice: "",
  minBedrooms: 0,
  minBathrooms: 0,
  features: {
    pool: false,
    garden: false,
    petFriendly: false,
    security: false,
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

const LISTINGS_VIEW_STATE_KEY = 'pribec.listings.view_state.v3';

const LOCATION_SUGGESTIONS = [
  'Cape Town',
  'Johannesburg',
  'Durban',
  'Gaborone',
  'Francistown',
  'Harare',
  'Lusaka',
];

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
  image: string;
  createdAt: string;
};

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=400&fit=crop";

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

function mapPropertyToListingCard(property: PropertyListing): ListingCard {
  const numericPrice = Number(property.price);
  const city = property.location?.city ?? "";
  const region = property.location?.region ?? "";
  const location = [city, region].filter(Boolean).join(", ") || "Location unavailable";
  const primaryImage = property.media?.find((media) => media.is_primary)?.url;
  const features = Array.isArray(property.features)
    ? property.features.filter((feature): feature is string => typeof feature === "string")
    : [];

  const propertyTypeMap: Record<PropertyListing['property_type'], string> = {
    residential: "house",
    off_plan: "apartment",
    land: "land",
    commercial: "commercial",
  };

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
    agent: "Verified Agent",
    agentCompany: "PRIBEC Agent Network",
    image: primaryImage || DEFAULT_PROPERTY_IMAGE,
    createdAt: property.created_at,
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

export default function Listings() {
  const navigate = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);
  const [sortBy, setSortBy] = useState<"relevance" | "price-low-high" | "price-high-low" | "newest">("relevance");
  const [isListening, setIsListening] = useState(false);
  const [voiceSearchText, setVoiceSearchText] = useState("");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [pendingFilters, setPendingFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  const [properties, setProperties] = useState<ListingCard[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");

  // Pre-computed stable heights for the voice-search waveform visualisation.
  // Using useMemo (no deps) so the values are identical on server and client.
  const waveHeights = useMemo(
    () => [32, 44, 20, 40, 28, 52, 36, 24, 48, 32, 44, 28],
    []
  );

  const handleVoiceSearch = () => {
    setShowVoiceModal(true);
    setIsListening(true);
    
    // Simulate voice recognition
    setTimeout(() => {
      const mockQuery = "Show me 3 bedroom houses in Cape Town with a pool under 10 million rand";
      setVoiceSearchText(mockQuery);
      setIsListening(false);
      
      // Simulate AI processing and suggestions
      setTimeout(() => {
        setAiSuggestions([
          "3+ bedrooms",
          "Cape Town location",
          "Pool included",
          "Price: Under R 10M",
          "Verified properties only"
        ]);
      }, 500);
    }, 3000);
  };

  const handleApplyVoiceSearch = () => {
    setShowVoiceModal(false);
    // Apply the search filters based on voice input
  };

  const handleApplyFilters = () => {
    setAppliedFilters(pendingFilters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const defaults = getDefaultFilters();
    setLocationInput("");
    setPendingFilters(defaults);
    setAppliedFilters(defaults);
  };

  const addPendingLocation = () => {
    const normalized = locationInput.trim();
    if (!normalized) {
      return;
    }

    setPendingFilters((prev) => {
      const exists = prev.locations.some(
        (location) => location.toLowerCase() === normalized.toLowerCase(),
      );

      if (exists) {
        return prev;
      }

      return {
        ...prev,
        locations: [...prev.locations, normalized],
      };
    });

    setLocationInput("");
  };

  const removePendingLocation = (locationToRemove: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      locations: prev.locations.filter((location) => location !== locationToRemove),
    }));
  };

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
        const mappedListings = rawListings
          .map((listing) => {
            try {
              return mapPropertyToListingCard(listing);
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

  const filteredProperties = useMemo(() => {
    const minPrice = parsePriceInput(appliedFilters.minPrice);
    const maxPrice = parsePriceInput(appliedFilters.maxPrice);

    const selectedPropertyTypes = Object.entries(appliedFilters.propertyTypes)
      .filter(([, selected]) => selected)
      .map(([type]) => type);

    const selectedLocations = appliedFilters.locations
      .map((location) => location.trim().toLowerCase())
      .filter(Boolean);

    const selectedFeatures = Object.entries(appliedFilters.features)
      .filter(([, selected]) => selected)
      .map(([feature]) => feature);

    return properties.filter((property) => {
      const propertyPrice = parsePrice(property.price);
      const locationLower = property.location.toLowerCase();

      if (appliedFilters.verifiedOnly && !property.verified) {
        return false;
      }

      if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes(property.propertyType)) {
        return false;
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

      if (selectedFeatures.length > 0 && !selectedFeatures.every((feature) => property.features.includes(feature))) {
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

  const fraudFlaggedCount = useMemo(
    () => properties.filter((property) => property.fraudFlagged).length,
    [properties],
  );

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];

    if (appliedFilters.propertyTypes.house) badges.push('House');
    if (appliedFilters.propertyTypes.apartment) badges.push('Apartment');
    if (appliedFilters.propertyTypes.land) badges.push('Land');
    if (appliedFilters.propertyTypes.commercial) badges.push('Commercial');

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

    return badges;
  }, [appliedFilters]);

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-x-hidden">
      {/* Mobile Filter Button */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <Button 
          onClick={() => setShowFilters(!showFilters)} 
          variant="outline" 
          className="w-full"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filters Sidebar */}
      <div className={`
        ${showFilters ? 'block' : 'hidden'}
        ${showDesktopFilters ? 'lg:block' : 'lg:hidden'}
        w-full lg:w-80 shrink-0 max-w-full
        bg-white border-r border-gray-200 
        p-4 md:p-6 
        overflow-y-auto overflow-x-hidden
        ${showFilters ? 'fixed inset-0 z-50 lg:relative' : ''}
      `}>
        <div className="flex items-center justify-between gap-2 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <div className="flex items-center gap-2">
            <button className="text-blue-500 text-sm hover:underline" onClick={handleResetFilters}>Reset All</button>
            <button 
              onClick={() => setShowFilters(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
              aria-label="Close filters"
              title="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verified Toggle */}
        <div className="mb-6 pb-6 border-b border-gray-200">
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

        {/* Property Type */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-medium mb-3">PROPERTY TYPE</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pendingFilters.propertyTypes.house}
                onChange={(event) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    propertyTypes: { ...prev.propertyTypes, house: event.target.checked },
                  }))
                }
              />
              <span className="text-sm">House</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pendingFilters.propertyTypes.apartment}
                onChange={(event) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    propertyTypes: { ...prev.propertyTypes, apartment: event.target.checked },
                  }))
                }
              />
              <span className="text-sm">Apartment</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pendingFilters.propertyTypes.land}
                onChange={(event) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    propertyTypes: { ...prev.propertyTypes, land: event.target.checked },
                  }))
                }
              />
              <span className="text-sm">Land</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pendingFilters.propertyTypes.commercial}
                onChange={(event) =>
                  setPendingFilters((prev) => ({
                    ...prev,
                    propertyTypes: { ...prev.propertyTypes, commercial: event.target.checked },
                  }))
                }
              />
              <span className="text-sm">Commercial</span>
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-medium mb-3">LOCATION</h3>
          <div className="flex gap-2">
            <input
              type="text"
              list="location-suggestions"
              placeholder="Type location and press Enter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault();
                  addPendingLocation();
                }
              }}
            />
            <button
              type="button"
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              onClick={addPendingLocation}
            >
              Add
            </button>
          </div>
          <datalist id="location-suggestions">
            {LOCATION_SUGGESTIONS.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingFilters.locations.length > 0 ? (
              pendingFilters.locations.map((location) => (
                <Badge key={location} variant="secondary" className="gap-1">
                  {location}
                  <button
                    type="button"
                    aria-label={`Remove ${location}`}
                    onClick={() => removePendingLocation(location)}
                    className="ml-1 text-gray-500 hover:text-gray-800"
                  >
                    ×
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-xs text-gray-500">No locations selected</span>
            )}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-medium mb-3">PRICE RANGE</h3>
          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              placeholder="R 1,000,000"
              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={pendingFilters.minPrice}
              onChange={(event) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  minPrice: event.target.value,
                }))
              }
            />
            <input
              type="text"
              placeholder="R 25,000,000"
              className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={pendingFilters.maxPrice}
              onChange={(event) =>
                setPendingFilters((prev) => ({
                  ...prev,
                  maxPrice: event.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-medium mb-3">ROOMS</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Bedrooms</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setPendingFilters((prev) => ({
                      ...prev,
                      minBedrooms: Math.max(0, prev.minBedrooms - 1),
                    }));
                  }}
                >
                  -
                </button>
                <span className="w-12 text-center">{pendingFilters.minBedrooms}+</span>
                <button
                  type="button"
                  className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setPendingFilters((prev) => ({
                      ...prev,
                      minBedrooms: prev.minBedrooms + 1,
                    }));
                  }}
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Bathrooms</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
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
                  className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
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
        <div className="mb-6">
          <h3 className="font-medium mb-3">FEATURES</h3>
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

        <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={handleApplyFilters}>
          <Search className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>

        {/* Voice Search Button */}
        <Button 
          onClick={handleVoiceSearch}
          className="w-full mt-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Mic className="w-4 h-4 mr-2" />
          AI Voice Search
          <Sparkles className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-gray-500 text-center mt-2">
          Try: "Show me 3 bedroom houses in Cape Town with a pool"
        </p>
      </div>

      {/* Voice Search Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white">
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Voice Search</h2>
                    <p className="text-sm text-gray-600">Powered by natural language understanding</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVoiceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close AI voice search"
                  title="Close AI voice search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Voice Input Visualization */}
              <div className="mb-6">
                <div className="relative bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px]">
                  {isListening ? (
                    <>
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                          <Mic className="w-12 h-12 text-white" />
                        </div>
                        {/* Animated circles */}
                        <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping animation-delay-200"></div>
                      </div>
                      <p className="mt-6 text-lg font-semibold text-gray-900">Listening...</p>
                      <p className="text-sm text-gray-600">Speak naturally about what you're looking for</p>
                      
                      {/* Audio waveform visualization */}
                      <div className="flex items-center gap-1 mt-4">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-purple-600 to-blue-600 rounded-full animate-wave"
                            style={{
                              height: `${waveHeights[i]}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
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
                      <div className="bg-white rounded-lg p-4 w-full max-w-lg border-2 border-purple-200">
                        <p className="text-gray-700 italic text-center">"{voiceSearchText}"</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <MicOff className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">Ready to listen</p>
                      <p className="text-sm text-gray-600">Click the button below to start</p>
                    </>
                  )}
                </div>
              </div>

              {/* AI-Interpreted Filters */}
              {aiSuggestions.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
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
                  <p className="text-sm font-medium text-gray-700 mb-3">Try saying:</p>
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
                            setAiSuggestions([
                              "3+ bedrooms",
                              "Cape Town location",
                              "Pool included",
                              "Price: Under R 10M",
                              "Verified properties only"
                            ]);
                          }, 500);
                        }}
                        className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
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
                  onClick={() => setShowVoiceModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                {voiceSearchText && aiSuggestions.length > 0 && (
                  <Button
                    onClick={handleApplyVoiceSearch}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-1">
                <span className="text-green-600 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {sortedProperties.length} {appliedFilters.verifiedOnly ? 'Verified ' : ''}Propert{sortedProperties.length === 1 ? 'y' : 'ies'} Found
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs md:text-sm flex-wrap">
                <span className="text-gray-600">APPLIED:</span>
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
              <Button
                variant="outline"
                className="hidden lg:inline-flex"
                onClick={() => setShowDesktopFilters((prev) => !prev)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showDesktopFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as "relevance" | "price-low-high" | "price-high-low" | "newest")
                }
                className="flex-1 sm:flex-none px-3 md:px-4 py-2 border border-gray-300 rounded-lg text-xs md:text-sm"
                aria-label="Sort properties"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
              <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  aria-label="List view"
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-2 rounded ${
                    viewMode === "map" ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  aria-label="Map view"
                  title="Map View"
                >
                  <Map className="w-4 h-4" />
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
          <div className="mx-4 md:mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {propertiesError}
          </div>
        )}

        {/* Map View */}
        {viewMode === "map" && (
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="relative bg-gray-100 rounded-lg h-full min-h-[500px] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&h=800&fit=crop"
                alt="Map view"
                className="w-full h-full object-cover opacity-70"
              />
              {/* Property pins on map */}
              {sortedProperties.slice(0, 4).map((property, idx) => (
                <Link
                  key={property.id}
                  to={`/app/property/${property.id}`}
                >
                  <div
                    className="absolute bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    style={{
                      top: `${30 + idx * 15}%`,
                      left: `${25 + idx * 20}%`
                    }}
                    title={property.title}
                  >
                    <div className="font-bold text-sm whitespace-nowrap">{property.price}</div>
                  </div>
                </Link>
              ))}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm hidden md:block">
                <div className="text-sm font-semibold mb-2">Map View</div>
                <div className="text-xs text-gray-600">Click on price markers to view property details</div>
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
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" : "flex flex-col gap-4 md:gap-6"}>
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

                  return (
                <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${viewMode === "list" ? "flex flex-col md:flex-row" : ""}`}>
                  <div className={`relative ${viewMode === "list" ? "md:w-80 flex-shrink-0" : ""}`}>
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
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{property.location}</span>
                        </p>
                      </div>
                      <div className="text-lg md:text-xl font-bold text-blue-600 whitespace-nowrap">{property.price}</div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 mb-4 flex-wrap">
                      <span>{property.beds} BEDS</span>
                      <span>{property.baths} BATHS</span>
                      <span>{property.garage} GARAGE</span>
                      <span>{property.sqm} M²</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{property.agent}</div>
                          <div className="text-xs text-gray-500 truncate">{property.agentCompany}</div>
                        </div>
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
    </div>
  );
}