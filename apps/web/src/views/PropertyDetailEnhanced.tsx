'use client';

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/router-compat";
import { usePathname, useSearchParams } from "next/navigation";
import {
  MapPin, Bed, Bath, Car, Maximize, Share2, Phone, MessageSquare,
  ChevronLeft, CheckCircle2, Shield, AlertTriangle,
  Calendar, Clock, History, Flag, ChevronRight, X, ZoomIn,
  Heart, Video, Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatarContent } from "@/components/UserAvatarContent";
import { getAccessToken, getStoredUser } from "@/lib/auth-session";
import { propertiesApi, usersApi, viewingsApi, neighbourhoodApi, mandateApi, type AgentProfileResponse, type AuthUser, type PropertyListing, type NeighbourhoodStats, type ComparableSale, type MandateRecord, type CreateMandatePayload } from "@/lib/api-client";
import { buildSinglePointMapSource } from "@/lib/map-utils";


const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=400&fit=crop";
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const SHOW_SIMILARITY_SCORE = process.env.NODE_ENV === 'development';

type SimilarProperty = {
  id: string;
  image: string;
  title: string;
  location: string;
  price: string;
  similarityScore?: number;
};

function getListingStatusBadge(status: string) {
  switch (status.toLowerCase()) {
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

function getVerificationBadge(status: string) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === 'FLAGGED') {
    return { label: 'FLAGGED', className: 'bg-red-600 text-white' };
  }

  if (normalizedStatus === 'VERIFIED') {
    return { label: 'VERIFIED', className: 'bg-green-500 text-white' };
  }

  return { label: normalizedStatus || 'UNVERIFIED', className: 'bg-yellow-600 text-white' };
}

function formatMoney(price: string, currency: string): string {
  const value = Number(price);
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency || "ZAR",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function toFeatureLabel(feature: string): string {
  return feature
    .replace(/_/g, " ")
    .replace(/\b\w/g, (part) => part.toUpperCase());
}

function pickFirstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function mapSimilarProperty(listing: PropertyListing, similarityScore?: number): SimilarProperty {
  const city = listing.location?.city ?? "";
  const region = listing.location?.region ?? "";
  const location = [city, region].filter(Boolean).join(", ") || "Location unavailable";
  const primaryImage = listing.media?.find((media) => media.is_primary)?.url;

  return {
    id: listing.id,
    image: primaryImage || DEFAULT_PROPERTY_IMAGE,
    title: listing.title,
    location,
    price: formatMoney(listing.price, listing.currency),
    similarityScore,
  };
}

function parseNumericValue(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeFeatureList(features: unknown): Set<string> {
  if (!Array.isArray(features)) {
    return new Set();
  }

  return new Set(
    features
      .filter((feature): feature is string => typeof feature === 'string')
      .map((feature) => feature.toLowerCase().trim())
      .filter((feature) => feature.length > 0),
  );
}

function computeFeatureOverlapScore(target: unknown, candidate: unknown): number {
  const targetSet = normalizeFeatureList(target);
  const candidateSet = normalizeFeatureList(candidate);

  if (targetSet.size === 0 || candidateSet.size === 0) {
    return 0.5;
  }

  let intersectionCount = 0;
  targetSet.forEach((feature) => {
    if (candidateSet.has(feature)) {
      intersectionCount += 1;
    }
  });

  const unionCount = new Set([...targetSet, ...candidateSet]).size;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
}

function haversineDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(toLatitude - fromLatitude);
  const dLon = toRadians(toLongitude - fromLongitude);
  const fromLatRad = toRadians(fromLatitude);
  const toLatRad = toRadians(toLatitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(fromLatRad) * Math.cos(toLatRad)
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function computeLocationSimilarity(target: PropertyListing, candidate: PropertyListing): number {
  const targetLatitude = parseNumericValue(target.location?.latitude);
  const targetLongitude = parseNumericValue(target.location?.longitude);
  const candidateLatitude = parseNumericValue(candidate.location?.latitude);
  const candidateLongitude = parseNumericValue(candidate.location?.longitude);

  if (
    targetLatitude != null
    && targetLongitude != null
    && candidateLatitude != null
    && candidateLongitude != null
  ) {
    const distanceKm = haversineDistanceKm(
      targetLatitude,
      targetLongitude,
      candidateLatitude,
      candidateLongitude,
    );

    if (distanceKm <= 3) return 1;
    if (distanceKm <= 10) return 0.9;
    if (distanceKm <= 25) return 0.75;
    if (distanceKm <= 50) return 0.6;
    if (distanceKm <= 100) return 0.4;
    return 0.2;
  }

  const targetCity = (target.location?.city ?? '').toLowerCase().trim();
  const targetRegion = (target.location?.region ?? '').toLowerCase().trim();
  const targetCountry = (target.location?.country ?? '').toLowerCase().trim();
  const candidateCity = (candidate.location?.city ?? '').toLowerCase().trim();
  const candidateRegion = (candidate.location?.region ?? '').toLowerCase().trim();
  const candidateCountry = (candidate.location?.country ?? '').toLowerCase().trim();

  if (targetCity && candidateCity && targetCity === candidateCity) {
    return 0.85;
  }

  if (targetRegion && candidateRegion && targetRegion === candidateRegion) {
    return 0.7;
  }

  if (targetCountry && candidateCountry && targetCountry === candidateCountry) {
    return 0.5;
  }

  return 0.3;
}

function computeNumericSimilarity(
  target: number | null,
  candidate: number | null,
  divisor: number,
): number {
  if (target == null || candidate == null) {
    return 0.5;
  }

  const delta = Math.abs(target - candidate);
  return Math.max(0, 1 - delta / divisor);
}

function computePriceSimilarity(target: PropertyListing, candidate: PropertyListing): number {
  const targetPrice = parseNumericValue(target.price);
  const candidatePrice = parseNumericValue(candidate.price);

  if (targetPrice == null || candidatePrice == null || targetPrice <= 0 || candidatePrice <= 0) {
    return 0.5;
  }

  const base = Math.max(targetPrice, candidatePrice);
  const deltaRatio = Math.abs(targetPrice - candidatePrice) / base;
  return Math.max(0, 1 - deltaRatio);
}

function computeVerificationScore(status: string): number {
  switch (status) {
    case 'verified':
      return 1;
    case 'pending':
      return 0.8;
    case 'unverified':
      return 0.6;
    case 'flagged':
      return 0.2;
    default:
      return 0.5;
  }
}

function computeSimilarityScore(target: PropertyListing, candidate: PropertyListing): number {
  const weights = {
    type: 0.22,
    location: 0.24,
    price: 0.2,
    beds: 0.1,
    baths: 0.08,
    area: 0.08,
    features: 0.05,
    verification: 0.03,
  };

  const typeScore = target.property_type === candidate.property_type ? 1 : 0.25;
  const locationScore = computeLocationSimilarity(target, candidate);
  const priceScore = computePriceSimilarity(target, candidate);
  const bedsScore = computeNumericSimilarity(target.bedrooms ?? null, candidate.bedrooms ?? null, 5);
  const bathsScore = computeNumericSimilarity(target.bathrooms ?? null, candidate.bathrooms ?? null, 4);
  const areaScore = computeNumericSimilarity(
    parseNumericValue(target.area_sqm),
    parseNumericValue(candidate.area_sqm),
    350,
  );
  const featureScore = computeFeatureOverlapScore(target.features, candidate.features);
  const verificationScore = computeVerificationScore(candidate.verification_status);

  return (
    weights.type * typeScore
    + weights.location * locationScore
    + weights.price * priceScore
    + weights.beds * bedsScore
    + weights.baths * bathsScore
    + weights.area * areaScore
    + weights.features * featureScore
    + weights.verification * verificationScore
  );
}

type PropertyDetailState = {
  title: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price: string;
  beds: number;
  baths: number;
  garage: number;
  floorArea: number;
  images: string[];
  description: string;
  features: Array<{ label: string; icon: boolean }>;
  agent: {
    id: string;
    name: string;
    title: string;
    verified: boolean;
    trustScore: number;
    image: string | null;
    companyName: string;
    companyLogoUrl: string | null;
  };
  verificationStatus: string;
  propertyType: string;
  listingStatus: string;
  isPrivateListing: boolean;
  createdAt: string;
  updatedAt: string;
};

function getEmptyPropertyDetail(): PropertyDetailState {
  return {
    title: "",
    address: "Address unavailable",
    latitude: null,
    longitude: null,
    price: formatMoney("0", "USD"),
    beds: 0,
    baths: 0,
    garage: 0,
    floorArea: 0,
    images: [DEFAULT_PROPERTY_IMAGE],
    description: "",
    features: [],
    agent: {
      id: "",
      name: "Agent information unavailable",
      title: "",
      verified: false,
      trustScore: 0,
      image: null,
      companyName: "PRIBEC Agent Network",
      companyLogoUrl: null,
    },
    verificationStatus: "UNVERIFIED",
    propertyType: "",
    listingStatus: "",
    isPrivateListing: false,
    createdAt: "",
    updatedAt: "",
  };
}

export default function PropertyDetailEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertyId = typeof id === "string" ? id : "";
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [agentPhone, setAgentPhone] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showFraudReport, setShowFraudReport] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleStep, setScheduleStep] = useState(1); // 1: Select type, 2: Select date/time, 3: Confirmation
  const [viewingType, setViewingType] = useState("inPerson");
  const [minViewingDate, setMinViewingDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [viewerName, setViewerName] = useState("");
  const [viewerEmail, setViewerEmail] = useState("");
  const [viewerPhone, setViewerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [propertyError, setPropertyError] = useState("");
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [fraudReportType, setFraudReportType] = useState<
    'double_sale' | 'fake_title' | 'non_existent' | 'misrepresentation' | 'other'
  >('misrepresentation');
  const [fraudDescription, setFraudDescription] = useState("");
  const [fraudError, setFraudError] = useState("");
  const [fraudSuccess, setFraudSuccess] = useState("");
  const [isSubmittingFraud, setIsSubmittingFraud] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<SimilarProperty[]>([]);
  const [neighbourhood, setNeighbourhood] = useState<NeighbourhoodStats | null>(null);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [valuationForm, setValuationForm] = useState({
    valuationType: "cma" as "formal" | "cma",
    estimatedValue: "",
    valuationDate: "",
    requestingPurpose: "" as "" | "listing" | "bond_application" | "insurance" | "legal",
    notes: "",
  });
  const [isSubmittingValuation, setIsSubmittingValuation] = useState(false);
  const [valuationError, setValuationError] = useState("");
  const [valuationSuccess, setValuationSuccess] = useState("");
  const [comparableSales, setComparableSales] = useState<ComparableSale[]>([]);
  const [isLoadingComparables, setIsLoadingComparables] = useState(false);
  const [showComparables, setShowComparables] = useState(false);
  const [mandates, setMandates] = useState<MandateRecord[]>([]);
  const [isLoadingMandates, setIsLoadingMandates] = useState(false);
  const [showCreateMandateForm, setShowCreateMandateForm] = useState(false);
  const [mandateForm, setMandateForm] = useState<CreateMandatePayload>({
    mandateType: 'sole',
    commissionRate: 5,
    startDate: '',
    endDate: '',
  });
  const [isSubmittingMandate, setIsSubmittingMandate] = useState(false);
  const [mandateError, setMandateError] = useState("");
  const [mandateSuccess, setMandateSuccess] = useState("");
  const [cancellingMandateId, setCancellingMandateId] = useState<string | null>(null);
  const [signingMandateId, setSigningMandateId] = useState<string | null>(null);

  const handleAddToFavourites = async () => {
    const token = getAccessToken();
    if (!token) {
      const query = searchParams.toString();
      const currentPath = `${pathname}${query ? `?${query}` : ''}`;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (isSavingProperty || !propertyId) {
      return;
    }

    setIsSavingProperty(true);
    try {
      if (isSaved) {
        await propertiesApi.unsave(token, propertyId);
        setIsSaved(false);
      } else {
        await propertiesApi.save(token, propertyId);
        setIsSaved(true);
      }
    } catch {
      // Non-critical — ignore silently
    } finally {
      setIsSavingProperty(false);
    }
  };

  const getActionToken = () => {
    const token = getAccessToken();
    if (!token) {
      const query = searchParams.toString();
      const currentPath = `${pathname}${query ? `?${query}` : ''}`;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return null;
    }

    return token;
  };

  const handleCallAgent = async () => {
    if (!agentPhone) return;
    const token = getAccessToken();
    if (token && property.agent.id) {
      try {
        await propertiesApi.contactAgent(property.agent.id, {
          message: `Phone call initiated from property listing: ${property.title}`,
          requesterName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : undefined,
          requesterEmail: currentUser?.email ?? undefined,
          requesterPhone: currentUser?.phone ?? undefined,
        }, token);
      } catch {
        // Log silently
      }
    }
    window.location.href = `tel:${agentPhone}`;
  };

  const handleWhatsAppAgent = async () => {
    if (!agentPhone) return;
    const token = getAccessToken();
    if (token && property.agent.id) {
      try {
        await propertiesApi.contactAgent(property.agent.id, {
          message: `WhatsApp contact initiated from property listing: ${property.title}`,
          requesterName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : undefined,
          requesterEmail: currentUser?.email ?? undefined,
          requesterPhone: currentUser?.phone ?? undefined,
        }, token);
      } catch {
        // Log silently
      }
    }
    const phone = agentPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hi, I'm interested in your property: ${property.title}`)}`, '_blank');
  };

  const handleSubmitInquiry = async () => {
    if (!propertyId) {
      setInquiryError("Unable to identify this listing.");
      return;
    }

    if (isSoldListing) {
      setInquiryError("This property is sold. Inquiries are disabled.");
      return;
    }

    if (!inquiryName.trim()) {
      setInquiryError("Please enter your full name.");
      return;
    }

    if (!inquiryEmail.trim() && !inquiryPhone.trim()) {
      setInquiryError("Please enter your email address or phone number.");
      return;
    }

    const token = getActionToken();
    if (!token) {
      return;
    }

    const payloadMessage = [
      inquiryMessage.trim() || "General inquiry",
      inquiryName.trim() ? `Name: ${inquiryName.trim()}` : "",
      inquiryEmail.trim() ? `Email: ${inquiryEmail.trim()}` : "",
      inquiryPhone.trim() ? `Phone: ${inquiryPhone.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setIsSubmittingInquiry(true);
    setInquiryError("");
    setInquirySuccess("");

    try {
      await propertiesApi.createInquiry(token, propertyId, {
        inquiryType: 'question',
        message: payloadMessage,
      });
      setInquirySuccess("Inquiry sent successfully.");
      setInquiryMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send inquiry right now.";
      setInquiryError(message);
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleSubmitValuation = async () => {
    if (!propertyId || !valuationForm.estimatedValue || !valuationForm.valuationDate) return;
    const token = getActionToken();
    if (!token) return;
    setIsSubmittingValuation(true);
    setValuationError("");
    setValuationSuccess("");
    try {
      await propertiesApi.requestValuation(token, propertyId, {
        valuationType: valuationForm.valuationType,
        estimatedValue: Number(valuationForm.estimatedValue),
        valuationDate: new Date(valuationForm.valuationDate).toISOString(),
        currency: "ZAR",
        requestingPurpose: valuationForm.requestingPurpose || undefined,
        notes: valuationForm.notes || undefined,
      });
      setValuationSuccess("Valuation request submitted successfully.");
      setTimeout(() => {
        setShowValuationModal(false);
        setValuationSuccess("");
        setValuationForm({ valuationType: "cma", estimatedValue: "", valuationDate: "", requestingPurpose: "", notes: "" });
      }, 1500);
    } catch (err) {
      setValuationError(err instanceof Error ? err.message : "Unable to submit valuation request.");
    } finally {
      setIsSubmittingValuation(false);
    }
  };

  const handleSubmitFraudReport = async () => {
    if (!propertyId) {
      setFraudError("Unable to identify this listing.");
      return;
    }

    if (!fraudDescription.trim()) {
      setFraudError("Please provide a description.");
      return;
    }

    const token = getActionToken();
    if (!token) {
      return;
    }

    setIsSubmittingFraud(true);
    setFraudError("");
    setFraudSuccess("");

    try {
      await propertiesApi.submitFraudReport(token, propertyId, {
        reportType: fraudReportType,
        description: fraudDescription.trim(),
      });
      setFraudSuccess("Fraud report submitted successfully.");
      setFraudDescription("");
      setTimeout(() => setShowFraudReport(false), 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit fraud report right now.";
      setFraudError(message);
    } finally {
      setIsSubmittingFraud(false);
    }
  };

  const handleConfirmViewing = async () => {
    if (!propertyId) {
      setScheduleError("Unable to identify this listing.");
      return;
    }

    if (isSoldListing) {
      setScheduleError("This property is sold. Viewing requests are disabled.");
      return;
    }

    if (!selectedDate || !selectedTime || !viewerName.trim() || !viewerEmail.trim() || !viewerPhone.trim()) {
      setScheduleError("Please complete date, time and contact details before confirming.");
      return;
    }

    const token = getActionToken();
    if (!token) {
      return;
    }

    setIsSubmittingSchedule(true);
    setScheduleError("");
    setScheduleSuccess("");

    try {
      await viewingsApi.request(token, propertyId, {
        viewingType: viewingType === 'inPerson' ? 'in_person' : 'virtual',
        scheduledAt: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        notes: [
          `Name: ${viewerName}`,
          `Email: ${viewerEmail}`,
          `Phone: ${viewerPhone}`,
          specialRequests.trim() ? `Special Requests: ${specialRequests.trim()}` : '',
        ]
          .filter(Boolean)
          .join("\n"),
      });

      setScheduleSuccess("Viewing request submitted successfully.");
      setTimeout(() => {
        setShowScheduleModal(false);
        setScheduleStep(1);
      }, 1200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit viewing request right now.";
      setScheduleError(message);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const [property, setProperty] = useState<PropertyDetailState>(getEmptyPropertyDetail);
  const [geocodedCoords, setGeocodedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const isSoldListing = property.listingStatus.toLowerCase() === 'sold';
  const isOwnListing = !!currentUser && !!property.agent.id && currentUser.id === property.agent.id;
  const statusBadge = getListingStatusBadge(property.listingStatus || 'draft');
  const verificationBadge = getVerificationBadge(property.verificationStatus);
  const hasLocationCoordinates = property.latitude != null && property.longitude != null;

  // Geocode the address via Nominatim when the listing has no stored coordinates
  useEffect(() => {
    if (hasLocationCoordinates) {
      setGeocodedCoords(null);
      return;
    }
    const address = property.address;
    if (!address || address === 'Address unavailable') return;

    // Deduplicate consecutive identical parts (e.g. "Harare, Harare, ZW" → "Harare, ZW")
    const deduped = address
      .split(', ')
      .filter((part, idx, arr) => part !== arr[idx - 1])
      .join(', ');

    let cancelled = false;
    setIsGeocodingAddress(true);

    const nominatimSearch = async (query: string) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'pribec-property-platform/1.0' } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Array<{ lat: string; lon: string }>>;
    };

    void (async () => {
      try {
        let data = await nominatimSearch(deduped);

        // Retry with a shorter query (last 2 parts: city + country) if no result
        if (data.length === 0) {
          const parts = deduped.split(', ');
          const shortQuery = parts.slice(-2).join(', ');
          if (shortQuery !== deduped) {
            console.warn('[geocode] No results for full address, retrying with:', shortQuery);
            data = await nominatimSearch(shortQuery);
          }
        }

        if (cancelled) return;
        const first = data[0];
        if (first) {
          setGeocodedCoords({ lat: parseFloat(first.lat), lng: parseFloat(first.lon) });
        } else {
          console.warn('[geocode] No results from Nominatim for:', deduped);
        }
      } catch (err) {
        console.warn('[geocode] Nominatim request failed:', err);
      } finally {
        if (!cancelled) setIsGeocodingAddress(false);
      }
    })();
    return () => { cancelled = true; setIsGeocodingAddress(false); };
  }, [hasLocationCoordinates, property.address]);

  const locationMapSource = useMemo(() => {
    const lat = hasLocationCoordinates ? (property.latitude as number) : geocodedCoords?.lat ?? null;
    const lng = hasLocationCoordinates ? (property.longitude as number) : geocodedCoords?.lng ?? null;
    if (lat != null && lng != null) {
      return buildSinglePointMapSource({ latitude: lat, longitude: lng, mapboxToken: MAPBOX_TOKEN });
    }
    return null;
  }, [hasLocationCoordinates, property.latitude, property.longitude, geocodedCoords]);
  const agentInitials = property.agent.name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

  useEffect(() => {
    setMinViewingDate(new Date().toISOString().split('T')[0] ?? "");
  }, []);

  // Pre-fill enquiry form and load current user when logged in
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
      setInquiryName(`${stored.firstName} ${stored.lastName}`.trim());
      setInquiryEmail(stored.email ?? '');
      setInquiryPhone(stored.phone ?? '');
    }

    // Also fetch fresh user data from API
    usersApi.me(token).then((user) => {
      setCurrentUser(user);
      setInquiryName((prev) => prev || `${user.firstName} ${user.lastName}`.trim());
      setInquiryEmail((prev) => prev || (user.email ?? ''));
      setInquiryPhone((prev) => prev || (user.phone ?? ''));
    }).catch(() => {
      // Use stored data as fallback
    });
  }, []);

  // Load saved status for current property
  useEffect(() => {
    if (!propertyId) return;
    const token = getAccessToken();
    if (!token) return;

    propertiesApi.getSavedProperties(token).then((result) => {
      setIsSaved(result.data.some((p) => p.id === propertyId));
    }).catch(() => {
      // Non-critical
    });
  }, [propertyId]);

  useEffect(() => {
    if (!propertyId) {
      return;
    }

    const loadProperty = async () => {
      setIsLoadingProperty(true);
      setPropertyError("");

      try {
        const listing = await propertiesApi.getById(propertyId);
        const looseListing = listing as PropertyListing & {
          agent?: {
            companyName?: string | null;
            company_name?: string | null;
            companyLogoUrl?: string | null;
            company_logo_url?: string | null;
          } | null;
          company_name?: string | null;
          company_logo_url?: string | null;
          agent_company_logo_url?: string | null;
        };

        let relatedListings: PropertyListing[] = [];
        try {
          const relatedResponse = await propertiesApi.search({
            sort: 'newest',
            limit: 60,
          });
          relatedListings = relatedResponse.data;
        } catch {
          relatedListings = [];
        }

        let mappedAgent = getEmptyPropertyDetail().agent;
        let isPrivateListing = false;
        if (listing.agent_id) {
          try {
            const profile = await propertiesApi.getAgentProfile(listing.agent_id);
            const looseProfile = profile as AgentProfileResponse & {
              companyName?: string | null;
              company_name?: string | null;
              companyLogoUrl?: string | null;
              company_logo_url?: string | null;
            };

            const trustScore =
              profile.totalListings > 0
                ? Math.min(
                    100,
                    Math.round((profile.verifiedListings / profile.totalListings) * 100),
                  )
                : 0;

            const companyName =
              pickFirstString(
                looseListing.company_name,
                looseListing.agent?.companyName,
                looseListing.agent?.company_name,
                profile.primaryCompanyName,
                looseProfile.companyName,
                looseProfile.company_name,
              ) ?? "PRIBEC Agent Network";

            const companyLogoUrl = pickFirstString(
              looseListing.company_logo_url,
              looseListing.agent?.companyLogoUrl,
              looseListing.agent?.company_logo_url,
              looseListing.agent_company_logo_url,
              profile.primaryCompanyLogoUrl,
              looseProfile.companyLogoUrl,
              looseProfile.company_logo_url,
            );

            mappedAgent = {
              id: profile.id,
              name: `${profile.firstName} ${profile.lastName}`.trim(),
              title: profile.primaryCity,
              verified: profile.status === "active",
              trustScore,
              image: profile.avatarUrl || null,
              companyName,
              companyLogoUrl,
            };
            isPrivateListing = listing.company_is_system !== false;
            setAgentPhone(profile.phone ?? null);
          } catch {
            const companyName =
              pickFirstString(
                looseListing.company_name,
                looseListing.agent?.companyName,
                looseListing.agent?.company_name,
              ) ?? "PRIBEC Agent Network";

            const companyLogoUrl = pickFirstString(
              looseListing.company_logo_url,
              looseListing.agent?.companyLogoUrl,
              looseListing.agent?.company_logo_url,
              looseListing.agent_company_logo_url,
            );

            mappedAgent = {
              ...getEmptyPropertyDetail().agent,
              id: listing.agent_id,
              companyName,
              companyLogoUrl,
            };
          }
        }

        const addressLine1 = listing.location?.address_line1 ?? "";
        const city = listing.location?.city ?? "";
        const region = listing.location?.region ?? "";
        const country = listing.location?.country ?? "";
        const address = [addressLine1, city, region, country].filter(Boolean).join(", ") || "Address unavailable";
        const parsedLatitude = listing.location?.latitude ? Number(listing.location.latitude) : null;
        const parsedLongitude = listing.location?.longitude ? Number(listing.location.longitude) : null;
        const latitude = parsedLatitude != null && Number.isFinite(parsedLatitude) ? parsedLatitude : null;
        const longitude = parsedLongitude != null && Number.isFinite(parsedLongitude) ? parsedLongitude : null;
        const images =
          listing.media?.map((media) => media.url).filter(Boolean) ?? [];
        const mappedFeatures = Array.isArray(listing.features)
          ? listing.features
              .filter((feature): feature is string => typeof feature === "string")
              .map((feature) => ({ label: toFeatureLabel(feature), icon: true }))
          : [];

        setProperty(() => ({
          title: listing.title,
          address,
          latitude,
          longitude,
          price: formatMoney(listing.price, listing.currency),
          beds: listing.bedrooms ?? 0,
          baths: listing.bathrooms ?? 0,
          garage: listing.parking_spaces ?? 0,
          floorArea: listing.area_sqm ? Number(listing.area_sqm) : 0,
          images: images.length > 0 ? images : [DEFAULT_PROPERTY_IMAGE],
          description: listing.description || "",
          features: mappedFeatures,
          agent: mappedAgent,
          verificationStatus: listing.verification_status.toUpperCase(),
          propertyType: listing.property_type,
          listingStatus: listing.status,
          isPrivateListing,
          createdAt: listing.created_at,
          updatedAt: listing.updated_at,
        }));
        // Normalize null listing_type to 'for_sale' — legacy records without an
        // explicit type default to for-sale and should be treated as equivalent.
        const normaliseListingType = (t: string | null | undefined) => t ?? 'for_sale';
        const similar = relatedListings
          .filter((item) => item.id !== listing.id)
          .filter((item) => item.status === 'active')
          .filter((item) => normaliseListingType(item.listing_type) === normaliseListingType(listing.listing_type))
          .map((item) => ({
            listing: item,
            score: computeSimilarityScore(listing, item),
          }))
          .sort((a, b) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }

            return new Date(b.listing.created_at).getTime() - new Date(a.listing.created_at).getTime();
          })
          .slice(0, 2)
          .map((entry) => mapSimilarProperty(entry.listing, entry.score));

        setSimilarProperties(similar);
        setSelectedImage(0);
        setCarouselOffset(0);

        // Load neighbourhood insights (non-blocking)
        try {
          const nbhd = await neighbourhoodApi.getByProperty(propertyId);
          setNeighbourhood(nbhd);
        } catch {
          // silently ignore — neighbourhood section simply won't render
        }
      } catch {
        setPropertyError("Unable to load property from database right now.");
        setSimilarProperties([]);
      } finally {
        setIsLoadingProperty(false);
      }
    };

    void loadProperty();
  }, [propertyId]);

  // Load comparable sales for agents/valuers/admins
  useEffect(() => {
    if (!propertyId || !currentUser) return;
    const userRoles = currentUser.roles ?? (currentUser.role ? [currentUser.role] : []);
    if (!userRoles.some((r) => ['agent', 'admin', 'valuer'].includes(r))) return;
    const token = getAccessToken();
    if (!token) return;
    setIsLoadingComparables(true);
    propertiesApi.getComparableSales(token, propertyId, 2)
      .then(setComparableSales)
      .catch(() => { /* non-critical */ })
      .finally(() => setIsLoadingComparables(false));
  }, [propertyId, currentUser]);

  // Load mandates for own listings
  useEffect(() => {
    if (!propertyId || !currentUser) return;
    const isAgent = (currentUser.roles ?? (currentUser.role ? [currentUser.role] : [])).includes('agent');
    if (!isAgent) return;
    const token = getAccessToken();
    if (!token) return;
    setIsLoadingMandates(true);
    mandateApi.getByProperty(token, propertyId)
      .then(setMandates)
      .catch(() => { /* non-critical */ })
      .finally(() => setIsLoadingMandates(false));
  }, [propertyId, currentUser]);

  const handleCreateMandate = async () => {
    const token = getAccessToken();
    if (!token || !propertyId) return;
    setIsSubmittingMandate(true);
    setMandateError("");
    setMandateSuccess("");
    try {
      const created = await mandateApi.create(token, propertyId, mandateForm);
      setMandates((prev) => [...prev, created]);
      setShowCreateMandateForm(false);
      setMandateSuccess("Mandate created successfully.");
    } catch (err) {
      setMandateError(err instanceof Error ? err.message : "Failed to create mandate.");
    } finally {
      setIsSubmittingMandate(false);
    }
  };

  const handleSignMandate = async (mandateId: string, party: 'seller' | 'agent') => {
    const token = getAccessToken();
    if (!token || !propertyId) return;
    setSigningMandateId(mandateId);
    setMandateError("");
    try {
      const updated = await mandateApi.sign(token, propertyId, mandateId, party);
      setMandates((prev) => prev.map((m) => m.id === mandateId ? updated : m));
      setMandateSuccess("Mandate signed.");
    } catch (err) {
      setMandateError(err instanceof Error ? err.message : "Failed to sign mandate.");
    } finally {
      setSigningMandateId(null);
    }
  };

  const handleCancelMandate = async (mandateId: string) => {
    const token = getAccessToken();
    if (!token || !propertyId) return;
    setCancellingMandateId(mandateId);
    setMandateError("");
    try {
      const updated = await mandateApi.cancel(token, propertyId, mandateId);
      setMandates((prev) => prev.map((m) => m.id === mandateId ? updated : m));
      setMandateSuccess("Mandate cancelled.");
    } catch (err) {
      setMandateError(err instanceof Error ? err.message : "Failed to cancel mandate.");
    } finally {
      setCancellingMandateId(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {isLoadingProperty && (
          <Card className="mb-6 p-4 text-sm text-blue-700 bg-blue-50 border-blue-200">
            Loading property details from database...
          </Card>
        )}

        {!isLoadingProperty && propertyError && (
          <Card className="mb-6 p-4 text-sm text-red-700 bg-red-50 border-red-200">
            {propertyError}
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="relative group">
                <img
                  src={property.images[selectedImage]}
                  alt="Main"
                  className="w-full h-64 md:h-125 object-cover cursor-pointer"
                  onClick={() => {
                    setLightboxImage(selectedImage);
                    setShowLightbox(true);
                  }}
                />
                {/* Zoom Icon */}
                <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <ZoomIn className="w-5 h-5 text-gray-700" />
                </div>
                {/* Verification Badge Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge className={`${verificationBadge.className} flex items-center gap-2 px-4 py-2`}>
                    <Shield className="w-4 h-4" />
                    {verificationBadge.label}
                  </Badge>
                  <Badge className={`${statusBadge.className} px-4 py-2`}>
                    {statusBadge.label}
                  </Badge>
                  {property.isPrivateListing && (
                    <Badge className="bg-purple-600 text-white px-4 py-2">🔒 Privately Listed</Badge>
                  )}
                </div>
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    className={`p-3 rounded-full shadow-md transition-colors ${
                      isSaved ? 'bg-red-50 hover:bg-red-100' : 'bg-white hover:bg-red-50'
                    }`}
                    onClick={() => { void handleAddToFavourites(); }}
                    disabled={isSavingProperty}
                    aria-label={isSaved ? 'Remove from saved' : 'Save property'}
                    title={isSaved ? 'Remove from saved' : 'Save property'}
                  >
                    {isSaved
                      ? <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      : <Heart className="w-5 h-5 text-gray-400" />}
                  </button>
                  <button
                    className="p-3 bg-white rounded-lg shadow-md hover:bg-gray-50"
                    aria-label="Share property"
                    title="Share property"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                  {selectedImage + 1} / {property.images.length}
                </div>
              </div>
              
              {/* Thumbnail Carousel */}
              <div className="p-4 bg-gray-50 relative">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCarouselOffset(Math.max(0, carouselOffset - 1))}
                    disabled={carouselOffset === 0}
                    aria-label="Previous thumbnails"
                    title="Previous thumbnails"
                    className={`shrink-0 p-2 rounded-lg transition-all ${
                      carouselOffset === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Thumbnails Container */}
                  <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-4 gap-2">
                      {property.images.slice(carouselOffset, carouselOffset + 4).map((image, idx) => {
                        const actualIdx = carouselOffset + idx;
                        return (
                        <div
                          key={`${image}-${actualIdx}`}
                          className="shrink-0"
                        >
                          <div className="relative group/thumb">
                            <img
                              src={image}
                              alt={`View ${actualIdx + 1}`}
                              className={`w-full h-16 md:h-20 object-cover rounded cursor-pointer border-2 transition-all ${
                                selectedImage === actualIdx 
                                  ? "border-blue-500 ring-2 ring-blue-300" 
                                  : "border-transparent hover:border-gray-300"
                              }`}
                              onClick={() => setSelectedImage(actualIdx)}
                            />
                            {/* Hover overlay with zoom icon */}
                            <div 
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center rounded cursor-pointer"
                              onClick={() => {
                                setLightboxImage(actualIdx);
                                setShowLightbox(true);
                              }}
                            >
                              <ZoomIn className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCarouselOffset(Math.min(property.images.length - 4, carouselOffset + 1))}
                    disabled={carouselOffset >= property.images.length - 4}
                    aria-label="Next thumbnails"
                    title="Next thumbnails"
                    className={`shrink-0 p-2 rounded-lg transition-all ${
                      carouselOffset >= property.images.length - 4
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <Card className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-semibold mb-2">{property.title}</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {property.address}
                  </p>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{property.price}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Bed className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">BEDROOMS</div>
                    <div className="font-semibold">{property.beds}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Bath className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">BATHROOMS</div>
                    <div className="font-semibold">{property.baths}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Car className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">PARKING</div>
                    <div className="font-semibold">{property.garage}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Maximize className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">FLOOR AREA</div>
                    <div className="font-semibold">{property.floorArea} m²</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Listing Timeline & Status */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Listing Timeline & Status</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Listing Status</span>
                  <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Verification</span>
                  <Badge className={verificationBadge.className}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {verificationBadge.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Property Type</span>
                  <span className="font-medium capitalize">{property.propertyType || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Listed</span>
                  <span className="font-medium">{property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">{property.updatedAt ? new Date(property.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                {property.isPrivateListing && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Listing Type</span>
                    <Badge className="bg-purple-600 text-white">🔒 Privately Listed</Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Property Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Property Description</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed text-sm md:text-base">
                {property.description || "No description available for this listing."}
              </div>
            </Card>

            {/* Features & Amenities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Features & Amenities</h2>
              {property.features.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                      <span className="text-sm">{feature.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">No feature data available.</div>
              )}
            </Card>

            {/* Location */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Location</h2>
                <span className="text-sm text-blue-500">{property.address}</span>
              </div>
              <div className="bg-gray-200 rounded-lg h-64 md:h-80 overflow-hidden border border-gray-200">
                {locationMapSource ? (
                  locationMapSource.type === 'image' ? (
                    <img
                      src={locationMapSource.url}
                      alt="Property location map"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <iframe
                      title="Property location map"
                      src={locationMapSource.url}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  )
                ) : isGeocodingAddress ? (
                  <div className="w-full h-full flex items-center justify-center gap-2 text-sm text-gray-500">
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Locating address on map…
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-600 px-6 text-center">
                    Map unavailable — no coordinates or recognisable address for this listing.
                  </div>
                )}
              </div>
            </Card>

            {/* Fraud Report Section */}
            <Card className="p-6 border-2 border-red-100">
              <div className="flex items-start gap-3">
                <Flag className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Report Suspicious Activity</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Help us maintain marketplace integrity. If you notice anything suspicious about this listing, please report it.
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowFraudReport(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Fraud or Issue
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule Viewing Button - Prominent */}
            {isOwnListing ? (
              <Card className="p-6 bg-linear-to-br from-gray-100 to-gray-200 border border-gray-300">
                <Calendar className="w-8 h-8 mb-3 text-gray-400" />
                <h3 className="font-bold text-xl mb-2 text-gray-700">Your Listing</h3>
                <p className="text-gray-500 text-sm">
                  You cannot schedule a viewing on a property you listed.
                </p>
              </Card>
            ) : (
              <Card className="p-6 bg-linear-to-br from-blue-500 to-purple-600 text-white">
                <Calendar className="w-8 h-8 mb-3" />
                <h3 className="font-bold text-xl mb-2">Schedule a Viewing</h3>
                <p className="text-blue-100 text-sm mb-4">
                  {isSoldListing
                    ? "Viewing is unavailable because this property is sold"
                    : "Book a time to see this property in person"}
                </p>
                <Button
                  className="w-full bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    if (!isSoldListing) {
                      setShowScheduleModal(true);
                    }
                  }}
                  disabled={isSoldListing}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {isSoldListing ? "Unavailable" : "Schedule Now"}
                </Button>
              </Card>
            )}

            {/* Mandate Panel — agents who own this listing */}
            {isOwnListing && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Mandate</h3>
                  {!isLoadingMandates && mandates.length === 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => setShowCreateMandateForm((v) => !v)}
                    >
                      {showCreateMandateForm ? "Cancel" : "+ Create"}
                    </Button>
                  )}
                </div>

                {mandateError && (
                  <p className="text-sm text-red-600 mb-2">{mandateError}</p>
                )}
                {mandateSuccess && (
                  <p className="text-sm text-green-600 mb-2">{mandateSuccess}</p>
                )}

                {isLoadingMandates ? (
                  <p className="text-sm text-gray-400">Loading mandates…</p>
                ) : mandates.length === 0 && !showCreateMandateForm ? (
                  <p className="text-sm text-gray-500">No mandate on record. Create one to formalise your listing agreement.</p>
                ) : mandates.length > 0 ? (
                  <div className="space-y-3">
                    {mandates.map((m) => (
                      <div key={m.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{m.mandate_type?.replace('_', ' ')} Mandate</span>
                          <Badge className={m.status === 'active' ? 'bg-green-100 text-green-700' : m.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                            {m.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{m.commission_rate}% commission</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(m.start_date).toLocaleDateString('en-ZA')} – {new Date(m.end_date).toLocaleDateString('en-ZA')}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{m.agent_signed_at ? '✓ Agent signed' : '○ Agent unsigned'}</span>
                          <span>{m.seller_signed_at ? '✓ Seller signed' : '○ Seller unsigned'}</span>
                        </div>
                        {m.status === 'active' && (
                          <div className="flex gap-2 mt-2">
                            {!m.agent_signed_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                disabled={signingMandateId === m.id}
                                onClick={() => void handleSignMandate(m.id, 'agent')}
                              >
                                Sign as Agent
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                              disabled={cancellingMandateId === m.id}
                              onClick={() => void handleCancelMandate(m.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}

                {showCreateMandateForm && mandates.length === 0 && (
                  <div className="space-y-3 mt-3 border-t border-gray-100 pt-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Mandate Type</label>
                      <select
                        title="Mandate Type"
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                        value={mandateForm.mandateType}
                        onChange={(e) => setMandateForm((f) => ({ ...f, mandateType: e.target.value as 'sole' | 'open' }))}
                      >
                        <option value="sole">Sole Mandate</option>
                        <option value="open">Open Mandate</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Commission Rate (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        title="Commission rate percentage"
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                        value={mandateForm.commissionRate}
                        onChange={(e) => setMandateForm((f) => ({ ...f, commissionRate: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Start Date</label>
                        <input
                          type="date"
                          title="Mandate start date"
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                          value={mandateForm.startDate}
                          onChange={(e) => setMandateForm((f) => ({ ...f, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">End Date</label>
                        <input
                          type="date"
                          title="Mandate end date"
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                          value={mandateForm.endDate}
                          onChange={(e) => setMandateForm((f) => ({ ...f, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      disabled={isSubmittingMandate || !mandateForm.startDate || !mandateForm.endDate}
                      onClick={() => void handleCreateMandate()}
                    >
                      {isSubmittingMandate ? "Creating…" : "Create Mandate"}
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Request Valuation — visible to agents, valuers, and property owners */}
            {currentUser && (() => {
              const userRoles = currentUser.roles ?? (currentUser.role ? [currentUser.role] : []);
              const canRequestValuation = userRoles.some((r) =>
                ["agent", "admin", "valuer", "buyer_seller"].includes(r),
              );
              return canRequestValuation ? (
                <Card className="p-5">
                  <h3 className="font-semibold mb-2">Property Valuation</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Request a formal or comparative market analysis for this property.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => setShowValuationModal(true)}
                  >
                    Request Valuation
                  </Button>
                </Card>
              ) : null;
            })()}

            {/* Comparable Sales — agents, valuers, admins */}
            {currentUser && (() => {
              const userRoles = currentUser.roles ?? (currentUser.role ? [currentUser.role] : []);
              if (!userRoles.some((r) => ['agent', 'admin', 'valuer'].includes(r))) return null;
              return (
                <Card className="p-5">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setShowComparables((v) => !v)}
                  >
                    <h3 className="font-semibold">Comparable Sales</h3>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showComparables ? 'rotate-90' : ''}`} />
                  </button>
                  {showComparables && (
                    <div className="mt-3">
                      {isLoadingComparables ? (
                        <p className="text-sm text-gray-400">Loading…</p>
                      ) : comparableSales.length === 0 ? (
                        <p className="text-sm text-gray-500">No comparable sales found within 2 km.</p>
                      ) : (
                        <div className="space-y-2 mt-1">
                          {comparableSales.slice(0, 5).map((cs) => (
                            <div key={cs.id} className="border border-gray-100 rounded-lg p-2 text-xs">
                              <p className="font-medium truncate">{cs.title}</p>
                              <div className="flex items-center justify-between mt-0.5 text-gray-500">
                                <span>{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: cs.currency || 'ZAR', maximumFractionDigits: 0 }).format(Number(cs.price))}</span>
                                <span>{cs.distance_km?.toFixed(1)} km away</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-gray-400">
                                {cs.bedrooms != null && <span>{cs.bedrooms} bd</span>}
                                {cs.area_sqm != null && <span>{cs.area_sqm} m²</span>}
                                {cs.sold_at && <span>sold {new Date(cs.sold_at).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })()}

            {!property.isPrivateListing && (
              <Card className="p-5 text-center">
                <div className="flex justify-center mb-2">
                  {property.agent.companyLogoUrl ? (
                    <img
                      src={property.agent.companyLogoUrl}
                      alt={`${property.agent.companyName} logo`}
                      className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white p-2"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xl font-semibold text-gray-500">
                      {property.agent.companyName.charAt(0).toUpperCase() || "C"}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800">{property.agent.companyName}</p>
              </Card>
            )}

            {/* Agent Card */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                  <UserAvatarContent
                    avatarUrl={property.agent.image}
                    initials={agentInitials}
                    alt={property.agent.name}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/agent-profile/${property.agent.id}?${property.isPrivateListing ? 'privateOwner=true&' : ''}back=${encodeURIComponent(`${pathname || '/app/listings'}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}`}
                      className="font-semibold hover:text-blue-600 transition-colors"
                    >
                      {property.agent.name}
                    </Link>
                    {property.agent.verified && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{property.agent.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Trust Score: {property.agent.trustScore}%</span>
                  </div>
                </div>
              </div>

              {isOwnListing ? (
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  You cannot send inquiries or contact yourself on a property you listed.
                </div>
              ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={inquiryName}
                    onChange={(event) => setInquiryName(event.target.value)}
                    disabled={isSoldListing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={inquiryEmail}
                    onChange={(event) => setInquiryEmail(event.target.value)}
                    disabled={isSoldListing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+27 00 000 0000"
                    value={inquiryPhone}
                    onChange={(event) => setInquiryPhone(event.target.value)}
                    disabled={isSoldListing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Message</label>
                  <textarea
                    placeholder="I am interested in this property..."
                    rows={3}
                    value={inquiryMessage}
                    onChange={(event) => setInquiryMessage(event.target.value)}
                    disabled={isSoldListing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                {isSoldListing && (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    This property is sold. New inquiries are disabled.
                  </div>
                )}
                {inquiryError && (
                  <div className="text-sm text-red-600">{inquiryError}</div>
                )}
                {inquirySuccess && (
                  <div className="text-sm text-green-600">{inquirySuccess}</div>
                )}
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleSubmitInquiry}
                  disabled={isSubmittingInquiry || isSoldListing}
                >
                  {isSubmittingInquiry ? "Sending..." : isSoldListing ? "Unavailable" : "Send Inquiry"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    disabled={isSoldListing || !agentPhone}
                    title={agentPhone ? `Call agent: ${agentPhone}` : 'Agent phone not available'}
                    onClick={() => { void handleCallAgent(); }}
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    disabled={isSoldListing || !agentPhone}
                    title={agentPhone ? `WhatsApp agent: ${agentPhone}` : 'Agent phone not available'}
                    onClick={() => { void handleWhatsAppAgent(); }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </div>
                {!agentPhone && (
                  <p className="text-xs text-gray-400 text-center">Agent contact number not available</p>
                )}
              </div>
              )}
            </Card>

            {/* Neighbourhood Insights */}
            {neighbourhood && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Neighbourhood Insights</h3>
                <div className="space-y-3">
                  {neighbourhood.crime_label != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Crime Level</span>
                      <span className={`font-medium ${
                        neighbourhood.crime_label === 'Low' ? 'text-green-600' :
                        neighbourhood.crime_label === 'Medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{neighbourhood.crime_label}</span>
                    </div>
                  )}
                  {neighbourhood.school_rating != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">School Rating</span>
                      <span className="font-medium">{neighbourhood.school_rating}/10</span>
                    </div>
                  )}
                  {neighbourhood.avg_price_per_sqm != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Avg Price/m²</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(neighbourhood.avg_price_per_sqm)}
                      </span>
                    </div>
                  )}
                  {neighbourhood.price_yoy_change_pct != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Price Change (YoY)</span>
                      <span className={`font-medium ${
                        neighbourhood.price_yoy_change_pct >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {neighbourhood.price_yoy_change_pct > 0 ? '+' : ''}{neighbourhood.price_yoy_change_pct.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {neighbourhood.demand_score != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Demand Score</span>
                      <span className="font-medium">{neighbourhood.demand_score}/100</span>
                    </div>
                  )}
                  {neighbourhood.walkability_score != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Walkability</span>
                      <span className="font-medium">{neighbourhood.walkability_score}/100</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Similar Properties */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Similar Properties</h3>
              <div className="space-y-4">
                {similarProperties.map((item) => (
                  <div key={`${item.title}-${item.location}`} className="flex gap-3 pb-4 border-b border-gray-200 last:border-0">
                    <img 
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-16 object-cover rounded"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_PROPERTY_IMAGE;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <Link to={`/app/property/${item.id}`} className="font-medium text-sm truncate block hover:text-blue-600 transition-colors">
                        {item.title}
                      </Link>
                      <div className="text-xs text-gray-600 truncate">{item.location}</div>
                      {SHOW_SIMILARITY_SCORE && typeof item.similarityScore === 'number' && Number.isFinite(item.similarityScore) && (
                        <div className="text-[11px] text-gray-500 mt-1">
                          Match {Math.round(item.similarityScore * 100)}%
                        </div>
                      )}
                      <div className="font-bold text-blue-600 text-sm mt-1">{item.price}</div>
                    </div>
                  </div>
                ))}
                {similarProperties.length === 0 && (
                  <div className="text-sm text-gray-600">No similar properties available right now.</div>
                )}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View More
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Fraud Report Modal */}
      {showFraudReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Report Suspicious Activity</h3>
              <button
                onClick={() => setShowFraudReport(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close fraud report"
                title="Close fraud report"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Issue Type</label>
                <select
                  aria-label="Issue type"
                  title="Issue type"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={fraudReportType}
                  onChange={(event) => setFraudReportType(event.target.value as typeof fraudReportType)}
                >
                  <option value="non_existent">Fake Listing</option>
                  <option value="misrepresentation">Price Manipulation / Misleading Information</option>
                  <option value="fake_title">Ownership or Title Issue</option>
                  <option value="double_sale">Double Sale</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  rows={4}
                  placeholder="Please provide details about the issue..."
                  value={fraudDescription}
                  onChange={(event) => setFraudDescription(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                />
              </div>
              {fraudError && <div className="text-sm text-red-600">{fraudError}</div>}
              {fraudSuccess && <div className="text-sm text-green-600">{fraudSuccess}</div>}
              <div className="flex gap-3">
                <Button onClick={() => setShowFraudReport(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleSubmitFraudReport}
                  disabled={isSubmittingFraud}
                >
                  {isSubmittingFraud ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Valuation Request Modal */}
      {showValuationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Request Property Valuation</h3>
              <button
                onClick={() => setShowValuationModal(false)}
                aria-label="Close valuation modal"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Valuation Type *</label>
              <div className="flex gap-4">
                {(["cma", "formal"] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="valuationType"
                      value={type}
                      checked={valuationForm.valuationType === type}
                      onChange={() => setValuationForm((f) => ({ ...f, valuationType: type }))}
                      className="accent-blue-500"
                    />
                    <span className="text-sm capitalize">
                      {type === "cma" ? "Comparative Market Analysis" : "Formal Valuation"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Estimated Value (ZAR) *</label>
                <input
                  type="number"
                  min={0}
                  value={valuationForm.estimatedValue}
                  onChange={(e) => setValuationForm((f) => ({ ...f, estimatedValue: e.target.value }))}
                  placeholder="e.g. 1200000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Valuation Date *</label>
                <input
                  type="date"
                  value={valuationForm.valuationDate}
                  title="Valuation date"
                  aria-label="Valuation date"
                  onChange={(e) => setValuationForm((f) => ({ ...f, valuationDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Purpose</label>
              <select
                value={valuationForm.requestingPurpose}
                title="Requesting purpose"
                aria-label="Requesting purpose"
                onChange={(e) => setValuationForm((f) => ({ ...f, requestingPurpose: e.target.value as typeof f.requestingPurpose }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select purpose (optional)</option>
                <option value="listing">Listing</option>
                <option value="bond_application">Bond Application</option>
                <option value="insurance">Insurance</option>
                <option value="legal">Legal</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Notes</label>
              <textarea
                value={valuationForm.notes}
                onChange={(e) => setValuationForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Any additional context for the valuer…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>

            {valuationError && (
              <div className="text-sm text-red-600">{valuationError}</div>
            )}
            {valuationSuccess && (
              <div className="text-sm text-green-600">{valuationSuccess}</div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={() => setShowValuationModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => { void handleSubmitValuation(); }}
                disabled={isSubmittingValuation || !valuationForm.estimatedValue || !valuationForm.valuationDate}
              >
                {isSubmittingValuation ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Viewing Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-xl">Schedule a Viewing</h3>
              </div>
              <button 
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleStep(1);
                }} 
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close schedule viewing"
                title="Close schedule viewing"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${scheduleStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <div className={`w-16 h-1 ${scheduleStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${scheduleStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
                <div className={`w-16 h-1 ${scheduleStep >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${scheduleStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  3
                </div>
                <div className={`w-16 h-1 ${scheduleStep >= 4 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${scheduleStep >= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  4
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {scheduleError && <div className="text-sm text-red-600">{scheduleError}</div>}
              {scheduleSuccess && <div className="text-sm text-green-600">{scheduleSuccess}</div>}
              {/* Step 1: Select Viewing Type */}
              {scheduleStep === 1 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Choose Viewing Type</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${viewingType === "inPerson" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      onClick={() => setViewingType("inPerson")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="viewingType"
                          value="inPerson"
                          title="In-person viewing"
                          className="w-5 h-5 mt-1"
                          checked={viewingType === "inPerson"}
                          onChange={() => setViewingType("inPerson")}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold">In-Person Viewing</span>
                          </div>
                          <p className="text-sm text-gray-600">Visit the property with the agent and explore every detail in person</p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Duration: ~45 minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${viewingType === "virtual" ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      onClick={() => setViewingType("virtual")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="viewingType"
                          value="virtual"
                          title="Virtual viewing"
                          className="w-5 h-5 mt-1"
                          checked={viewingType === "virtual"}
                          onChange={() => setViewingType("virtual")}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-5 h-5 text-purple-600" />
                            <span className="font-semibold">Virtual Tour</span>
                          </div>
                          <p className="text-sm text-gray-600">Join a live video call with the agent for a virtual walkthrough</p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Duration: ~30 minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Select Date & Time */}
              {scheduleStep === 2 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Select Date & Time</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Preferred Date</label>
                      <input
                        type="date"
                        title="Preferred date"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={minViewingDate || undefined}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Preferred Time</label>
                      <select
                        aria-label="Preferred time"
                        title="Preferred time"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      >
                        <option value="">Select time slot</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Available Time Slots</p>
                        <p className="text-blue-700">The agent typically responds within 2 hours to confirm your booking. You'll receive a confirmation email once approved.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Your Details */}
              {scheduleStep === 3 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Your Contact Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Full Name *</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={viewerName}
                        onChange={(e) => setViewerName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email Address *</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={viewerEmail}
                          onChange={(e) => setViewerEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="+27 00 000 0000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={viewerPhone}
                          onChange={(e) => setViewerPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Special Requests (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Any specific areas you'd like to focus on during the viewing?"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {scheduleStep === 4 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">Review Your Booking</h4>
                    <p className="text-gray-600 text-sm">Please review the details before confirming</p>
                  </div>

                  <div className="space-y-4">
                    {/* Property Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold mb-2">Property</h5>
                      <p className="text-sm">{property.title}</p>
                      <p className="text-sm text-gray-600">{property.address}</p>
                    </div>

                    {/* Viewing Details */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold mb-3">Viewing Details</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Type:</span>
                          <span className="text-sm font-medium flex items-center gap-1">
                            {viewingType === "inPerson" ? (
                              <><MapPin className="w-4 h-4" /> In-Person Viewing</>
                            ) : (
                              <><Video className="w-4 h-4" /> Virtual Tour</>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Date:</span>
                          <span className="text-sm font-medium">{selectedDate || "Not selected"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Time:</span>
                          <span className="text-sm font-medium">{selectedTime || "Not selected"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold mb-3">Your Details</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Name:</span>
                          <span className="text-sm font-medium">{viewerName || "Not provided"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-medium">{viewerEmail || "Not provided"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Phone:</span>
                          <span className="text-sm font-medium">{viewerPhone || "Not provided"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Agent Info */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
                          <UserAvatarContent
                            avatarUrl={property.agent.image}
                            initials={agentInitials}
                            alt={property.agent.name}
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{property.agent.name}</p>
                          <p className="text-sm text-gray-600">{property.agent.title}</p>
                        </div>
                      </div>
                      <p className="text-sm text-blue-900 mt-3">
                        <strong>{property.agent.name}</strong> will contact you within 2 hours to confirm the viewing appointment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {scheduleStep > 1 && scheduleStep < 4 && (
                  <Button 
                    onClick={() => setScheduleStep(scheduleStep - 1)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                {scheduleStep < 4 && (
                  <Button 
                    onClick={() => setScheduleStep(scheduleStep + 1)} 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {scheduleStep === 4 && (
                  <Button 
                    onClick={handleConfirmViewing}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    disabled={isSubmittingSchedule}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {isSubmittingSchedule ? "Submitting..." : "Confirm Booking"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Image Lightbox/Viewer Modal */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 z-60 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 opacity-70 hover:opacity-100 hover:bg-white/20 focus-visible:opacity-100 focus-visible:bg-white/25 rounded-full text-white transition-all z-10"
            aria-label="Close image viewer"
            title="Close image viewer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm z-10">
            {lightboxImage + 1} / {property.images.length}
          </div>

          {/* Previous Button */}
          <button
            onClick={() => setLightboxImage((lightboxImage - 1 + property.images.length) % property.images.length)}
            className="absolute top-[calc(50%-1rem)] -translate-y-1/2 left-4 md:left-8 p-3 bg-white/10 opacity-70 hover:opacity-100 hover:bg-white/20 focus-visible:opacity-100 focus-visible:bg-white/25 rounded-full text-white transition-all z-10"
            aria-label="Previous image"
            title="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next Button */}
          <button
            onClick={() => setLightboxImage((lightboxImage + 1) % property.images.length)}
            className="absolute top-[calc(50%-1rem)] -translate-y-1/2 right-4 md:right-8 p-3 bg-white/10 opacity-70 hover:opacity-100 hover:bg-white/20 focus-visible:opacity-100 focus-visible:bg-white/25 rounded-full text-white transition-all z-10"
            aria-label="Next image"
            title="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Main Image */}
          <div className="w-full h-full flex items-center justify-center p-4 pt-16 pb-24 md:p-16 md:pt-24 md:pb-32">
            <img
              src={property.images[lightboxImage].replace('w=400&h=300', 'w=1600&h=1200')}
              alt={`Property view ${lightboxImage + 1}`}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Thumbnail Strip */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 overflow-x-auto justify-center">
                {property.images.map((image, idx) => (
                  <img
                    key={idx}
                    src={image}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`w-16 h-12 md:w-20 md:h-16 object-cover rounded cursor-pointer shrink-0 transition-all ${
                      lightboxImage === idx
                        ? 'border-2 border-white ring-2 ring-white/50 opacity-100'
                        : 'border-2 border-transparent opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => setLightboxImage(idx)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Keyboard hint */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white/60 text-xs hidden md:block">
            Use ← → arrow keys to navigate • ESC to close
          </div>
        </div>
      )}
    </div>
  );
}