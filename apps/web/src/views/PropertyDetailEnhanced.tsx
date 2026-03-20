'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/router-compat";
import { usePathname, useSearchParams } from "next/navigation";
import {
  MapPin, Bed, Bath, Car, Maximize, Phone, MessageSquare,
  ChevronLeft, CheckCircle2, Shield, AlertTriangle,
  Calendar, Clock, History, Flag, ChevronRight, X, ZoomIn,
  Heart, Video, Info,
  Eye, TrendingUp, Users, MessageCircle, BarChart2, Home, Loader2, AlertCircle, RefreshCw, Plus,
  Box, GraduationCap, Zap,
  ClipboardCheck, Star, FileText, DollarSign, Handshake, CheckSquare
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatarContent } from "@/components/UserAvatarContent";
import { getAccessToken, getStoredUser, getActiveCompanyIdFromToken } from "@/lib/auth-session";
import { propertiesApi, usersApi, viewingsApi, neighbourhoodApi, mandateApi, viewingActionsApi, agentApi, inquiriesApi, salesApi, type AgentProfileResponse, type AuthUser, type PropertyListing, type NeighbourhoodStats, type ComparableSale, type AiValuationEstimate, type ValuationRecord, type MandateRecord, type CreateMandatePayload, type OpenHouseRecord, type OpenHouseAttendee, type PropertyStats, type ListingViewingRecord, type PropertyInquiryRecord, type CreateOpenHousePayload, type CancelOpenHousePayload, type RescheduleOpenHousePayload, type AgentDeclineViewingPayload, type RescheduleViewingPayload, type Sale, type OwnershipHistoryRecord, type PriceHistoryRecord, type FloorPlanRecord } from "@/lib/api-client";
import { buildSinglePointMapSource } from "@/lib/map-utils";
import LeafletMapDynamic from "@/components/LeafletMapDynamic";
import { formatMoney } from "@/lib/formatters";
import PropertyMonthlyCosts from "@/components/property/PropertyMonthlyCosts";
import PropertyDaysOnMarket from "@/components/property/PropertyDaysOnMarket";
import PropertyShareButton from "@/components/property/PropertyShareButton";
import PropertyVerificationChecklist from "@/components/property/PropertyVerificationChecklist";
import PropertyOwnershipHistory from "@/components/property/PropertyOwnershipHistory";
import StickyCtaBar from "@/components/property/StickyCtaBar";
import BondCalculator from "@/components/property/BondCalculator";
import PropertyBreadcrumb from "@/components/property/PropertyBreadcrumb";
import FloorPlanViewer from "@/components/property/FloorPlanViewer";
import PriceHistoryChart from "@/components/property/PriceHistoryChart";
import PrintButton from "@/components/property/PrintButton";
import ContactPreferences from "@/components/property/ContactPreferences";
import FutureFeaturesCard from "@/components/property/FutureFeaturesCard";
import "@/styles/print.css";


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
  id: string;
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
  verifiedAt: string | null;
  propertyType: string;
  listingStatus: string;
  isPrivateListing: boolean;
  createdAt: string;
  updatedAt: string;
  monthlyLevy: number | null;
  monthlyRates: number | null;
  monthlyUtilities: number | null;
  erfSize: number | null;
  currency: string;
  rawPrice: number;
  city: string | null;
  region: string | null;
  /** Company UUID the listing was created under — used to gate owner-only controls */
  companyId: string | null;
};

function getEmptyPropertyDetail(): PropertyDetailState {
  return {
    id: "",
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
    verifiedAt: null,
    propertyType: "",
    listingStatus: "",
    isPrivateListing: false,
    createdAt: "",
    updatedAt: "",
    monthlyLevy: null,
    monthlyRates: null,
    monthlyUtilities: null,
    erfSize: null,
    currency: "ZAR",
    rawPrice: 0,
    city: null,
    region: null,
    companyId: null,
  };
}

export default function PropertyDetailEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const propertyId = typeof id === "string" ? id : "";
  const heroRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [ownershipHistory, setOwnershipHistory] = useState<OwnershipHistoryRecord[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlanRecord[]>([]);
  const [inquiryContactMethod, setInquiryContactMethod] = useState("");
  const [inquiryContactTime, setInquiryContactTime] = useState("");
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
  const [rawListingCurrency, setRawListingCurrency] = useState('ZAR');
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
  const [propertyValuations, setPropertyValuations] = useState<ValuationRecord[]>([]);
  const [isLoadingValuations, setIsLoadingValuations] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<AiValuationEstimate | null>(null);
  const [isLoadingAiEstimate, setIsLoadingAiEstimate] = useState(false);
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
    sellerIsPlatformUser: true,
  });
  const [isSubmittingMandate, setIsSubmittingMandate] = useState(false);
  const [mandateError, setMandateError] = useState("");
  const [mandateSuccess, setMandateSuccess] = useState("");
  const [cancellingMandateId, setCancellingMandateId] = useState<string | null>(null);
  const [signingMandateId, setSigningMandateId] = useState<string | null>(null);
  const [offlineSignMandateId, setOfflineSignMandateId] = useState<string | null>(null);
  const [offlineSignFile, setOfflineSignFile] = useState<File | null>(null);
  const [isSubmittingOfflineSign, setIsSubmittingOfflineSign] = useState(false);

  // ── Initiate Sale (owner/agent only) ─────────────────────────────────────
  const [showInitiateSaleModal, setShowInitiateSaleModal] = useState(false);
  const [initiateSaleAgreedPrice, setInitiateSaleAgreedPrice] = useState('');
  const [initiateSaleCurrency, setInitiateSaleCurrency] = useState('ZAR');
  const [initiateSaleSellerId, setInitiateSaleSellerId] = useState('');
  const [initiateSaleBuyerId, setInitiateSaleBuyerId] = useState('');
  const [initiateSaleDeposit, setInitiateSaleDeposit] = useState('');
  const [submittingInitiateSale, setSubmittingInitiateSale] = useState(false);
  const [initiateSaleError, setInitiateSaleError] = useState<string | null>(null);
  // Existing active sale for this property (if any)
  const [existingSale, setExistingSale] = useState<Sale | null>(null);

  const [propertyOpenHouses, setPropertyOpenHouses] = useState<OpenHouseRecord[]>([]);
  // Full list (including past) used only in the owner management tab
  const [allPropertyOpenHouses, setAllPropertyOpenHouses] = useState<OpenHouseRecord[]>([]);
  const [registeringOpenHouseId, setRegisteringOpenHouseId] = useState<string | null>(null);
  const [openHouseRegisterSuccess, setOpenHouseRegisterSuccess] = useState<string | null>(null);

  // ── Listing-owner management panel ──────────────────────────────────────────
  const [listingStats, setListingStats] = useState<PropertyStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [listingViewings, setListingViewings] = useState<ListingViewingRecord[]>([]);
  const [isLoadingViewings, setIsLoadingViewings] = useState(false);
  const [listingInquiries, setListingInquiries] = useState<PropertyInquiryRecord[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [ownerTab, setOwnerTab] = useState<'viewings' | 'inquiries' | 'open_houses' | 'property_condition' | 'selling_points' | 'notes' | 'showings' | 'leads' | 'offers' | 'sale_details' | 'post_sale'>('viewings');

  // ── Viewing action state ──────────────────────────────────────────────────
  const [showDeclineViewingModal, setShowDeclineViewingModal] = useState(false);
  const [decliningViewingId, setDecliningViewingId] = useState<string | null>(null);
  const [declineViewingForm, setDeclineViewingForm] = useState<AgentDeclineViewingPayload>({ reason: '', alternativeDates: [], message: '' });
  const [isDecliningViewing, setIsDecliningViewing] = useState(false);
  const [declineViewingError, setDeclineViewingError] = useState('');
  const [altDeclineDateInput, setAltDeclineDateInput] = useState('');
  const [isSubmittingViewingAction, setIsSubmittingViewingAction] = useState<string | null>(null);
  const [completingViewingId, setCompletingViewingId] = useState<string | null>(null);
  // Cancel viewing modal
  const [showCancelViewingModal, setShowCancelViewingModal] = useState(false);
  const [cancellingViewingId, setCancellingViewingId] = useState<string | null>(null);
  const [cancelViewingReason, setCancelViewingReason] = useState('');
  const [isCancellingViewing, setIsCancellingViewing] = useState(false);
  const [cancelViewingError, setCancelViewingError] = useState('');
  // Reschedule viewing modal
  const [showRescheduleViewingModal, setShowRescheduleViewingModal] = useState(false);
  const [reschedulingViewingId, setReschedulingViewingId] = useState<string | null>(null);
  const [rescheduleViewingForm, setRescheduleViewingForm] = useState<RescheduleViewingPayload>({ scheduledAt: '', reason: '' });
  const [isReschedulingViewing, setIsReschedulingViewing] = useState(false);
  const [rescheduleViewingError, setRescheduleViewingError] = useState('');

  // ── Enquiry reply state ────────────────────────────────────────────────────
  const [replyingInquiryId, setReplyingInquiryId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // ── Open house schedule form state ────────────────────────────────────────
  const [showCreateOpenHouseForm, setShowCreateOpenHouseForm] = useState(false);
  const [openHouseForm, setOpenHouseForm] = useState<CreateOpenHousePayload>({ scheduledAt: '', endAt: '', maxAttendees: undefined, description: '' });
  const [isSubmittingOpenHouse, setIsSubmittingOpenHouse] = useState(false);
  const [openHouseFormError, setOpenHouseFormError] = useState('');

  // ── Cancel open house modal state ─────────────────────────────────────────
  const [showCancelOpenHouseModal, setShowCancelOpenHouseModal] = useState(false);
  const [cancellingOpenHouseId, setCancellingOpenHouseId] = useState<string | null>(null);
  const [cancelOpenHouseForm, setCancelOpenHouseForm] = useState<CancelOpenHousePayload>({ reason: '' });
  const [isCancellingOpenHouse, setIsCancellingOpenHouse] = useState(false);
  const [cancelOpenHouseError, setCancelOpenHouseError] = useState('');

  // ── Reschedule open house modal state ─────────────────────────────────────
  const [showRescheduleOpenHouseModal, setShowRescheduleOpenHouseModal] = useState(false);
  const [reschedulingOpenHouseId, setReschedulingOpenHouseId] = useState<string | null>(null);
  const [rescheduleOpenHouseForm, setRescheduleOpenHouseForm] = useState<RescheduleOpenHousePayload>({ scheduledAt: '', endAt: '', reason: '' });
  const [isReschedulingOpenHouse, setIsReschedulingOpenHouse] = useState(false);
  const [rescheduleOpenHouseError, setRescheduleOpenHouseError] = useState('');

  // ── Open house attendees (owner management tab) ───────────────────────────
  const [expandedOpenHouseId, setExpandedOpenHouseId] = useState<string | null>(null);
  const [openHouseAttendees, setOpenHouseAttendees] = useState<Record<string, OpenHouseAttendee[]>>({});
  const [loadingAttendeesId, setLoadingAttendeesId] = useState<string | null>(null);

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

  const handleInitiateSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) { setInitiateSaleError('Please log in to continue.'); return; }
    const user = getStoredUser();
    if (!user?.id) { setInitiateSaleError('Session expired — please log in again.'); return; }
    if (!property.id || !initiateSaleAgreedPrice) {
      setInitiateSaleError('Please enter an agreed price.');
      return;
    }
    if (!initiateSaleSellerId.trim()) {
      setInitiateSaleError('Please enter the seller\'s user ID.');
      return;
    }
    setSubmittingInitiateSale(true);
    setInitiateSaleError(null);
    try {
      const sale = await salesApi.create(token, {
        propertyId: property.id,
        sellerId: initiateSaleSellerId.trim(),
        buyerId: initiateSaleBuyerId.trim() || undefined,
        agreedPrice: Number(initiateSaleAgreedPrice),
        currency: initiateSaleCurrency,
        ...(initiateSaleDeposit ? { depositAmount: Number(initiateSaleDeposit) } : {}),
      });
      setShowInitiateSaleModal(false);
      navigate(`/workspace/${sale.id}`);
    } catch (err) {
      setInitiateSaleError(err instanceof Error ? err.message : 'Failed to initiate sale.');
    } finally {
      setSubmittingInitiateSale(false);
    }
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
        ...(inquiryContactMethod ? { preferredContactMethod: inquiryContactMethod as 'phone' | 'email' | 'whatsapp' } : {}),
        ...(inquiryContactTime ? { bestContactTime: inquiryContactTime as 'morning' | 'afternoon' | 'evening' | 'anytime' } : {}),
      });
      setInquirySuccess("Inquiry sent successfully.");
      setInquiryMessage("");
      setInquiryContactMethod("");
      setInquiryContactTime("");
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
        viewingType: viewingType === 'inPerson' ? 'physical' : 'virtual',
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
  // A listing is "own" only when both the user AND the active company context match.
  // This prevents agent controls leaking across company contexts (e.g. Self vs Bechani Enterprises).
  const activeCompanyId = getActiveCompanyIdFromToken();
  const isOwnListing =
    !!currentUser &&
    !!property.agent.id &&
    currentUser.id === property.agent.id &&
    property.companyId === activeCompanyId;
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

  // Non-blockingly check if an active sale already exists for this property
  useEffect(() => {
    if (!propertyId) return;
    const token = getAccessToken();
    if (!token) return;
    salesApi.getMySales(token).then((sales) => {
      const found = sales.find((s) => s.propertyId === propertyId && s.status !== 'cancelled');
      setExistingSale(found ?? null);
    }).catch(() => { /* non-critical */ });
  }, [propertyId]);

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
        const authToken = getAccessToken();
        const listing = await propertiesApi.getById(propertyId, authToken ?? undefined);
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
          id: listing.id,
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
          verifiedAt: listing.verified_at ?? null,
          propertyType: listing.property_type,
          listingStatus: listing.status,
          isPrivateListing,
          createdAt: listing.created_at,
          updatedAt: listing.updated_at,
          monthlyLevy: listing.monthly_levy ? Number(listing.monthly_levy) : null,
          monthlyRates: listing.monthly_rates ? Number(listing.monthly_rates) : null,
          monthlyUtilities: listing.monthly_utilities ? Number(listing.monthly_utilities) : null,
          erfSize: listing.erf_size_sqm ? Number(listing.erf_size_sqm) : null,
          currency: listing.currency || 'ZAR',
          rawPrice: listing.price ? Number(listing.price) : 0,
          city: city || null,
          region: region || null,
          companyId: listing.company_id ?? null,
        }));
        setRawListingCurrency(listing.currency || 'ZAR');
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

        // Load ownership history (non-blocking)
        try {
          const history = await propertiesApi.getOwnershipHistory(propertyId);
          setOwnershipHistory(history);
        } catch {
          // silently ignore — ownership section simply won't render
        }

        // Load price history (non-blocking)
        try {
          const ph = await propertiesApi.getPriceHistory(propertyId);
          setPriceHistory(ph);
        } catch {
          // silently ignore — price history section simply won't render
        }

        // Load floor plans (non-blocking)
        try {
          const fp = await propertiesApi.getFloorPlans(propertyId);
          setFloorPlans(fp);
        } catch {
          // silently ignore — floor plan section simply won't render
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

  // Load valuation history for eligible users
  useEffect(() => {
    if (!propertyId || !currentUser) return;
    const userRoles = currentUser.roles ?? (currentUser.role ? [currentUser.role] : []);
    if (!userRoles.some((r) => ['agent', 'admin', 'valuer', 'buyer_seller'].includes(r))) return;
    const token = getAccessToken();
    if (!token) return;
    setIsLoadingValuations(true);
    propertiesApi.getPropertyValuations(token, propertyId)
      .then(setPropertyValuations)
      .catch(() => { /* non-critical */ })
      .finally(() => setIsLoadingValuations(false));
  }, [propertyId, currentUser]);

  // Load AI estimate for agents, valuers, admins
  useEffect(() => {
    if (!propertyId || !currentUser) return;
    const userRoles = currentUser.roles ?? (currentUser.role ? [currentUser.role] : []);
    if (!userRoles.some((r) => ['agent', 'admin', 'valuer'].includes(r))) return;
    const token = getAccessToken();
    if (!token) return;
    setIsLoadingAiEstimate(true);
    propertiesApi.getAiEstimate(token, propertyId)
      .then(setAiEstimate)
      .catch(() => { /* non-critical */ })
      .finally(() => setIsLoadingAiEstimate(false));
  }, [propertyId, currentUser]);

  // Load upcoming open houses for this property (public, no auth)
  useEffect(() => {
    if (!propertyId) return;
    propertiesApi.getPropertyOpenHouses(propertyId)
      .then((houses) => {
        // All houses stored for owner management tab
        setAllPropertyOpenHouses(houses);
        // Filter out past open houses (end time has passed) for the public sidebar
        const now = new Date();
        setPropertyOpenHouses(houses.filter((oh) => new Date(oh.end_at) > now));
      })
      .catch(() => { /* non-critical */ });
  }, [propertyId]);

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

  // Load per-property management data for the listing creator
  useEffect(() => {
    if (!propertyId || !currentUser?.id || !property.agent.id) return;
    if (currentUser.id !== property.agent.id) return;
    const token = getAccessToken();
    if (!token) return;

    setIsLoadingStats(true);
    propertiesApi.getPropertyStats(token, propertyId)
      .then(setListingStats)
      .catch(() => { /* non-critical */ })
      .finally(() => setIsLoadingStats(false));

    setIsLoadingViewings(true);
    propertiesApi.getPropertyViewings(token, propertyId)
      .then(setListingViewings)
      .catch(() => { /* non-critical */ })
      .finally(() => setIsLoadingViewings(false));

    setIsLoadingInquiries(true);
    propertiesApi.getPropertyInquiries(token, propertyId)
      .then((result) => setListingInquiries(result.data))
      .catch(() => { /* non-critical */ })
      .finally(() => setIsLoadingInquiries(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, currentUser?.id, property.agent.id]);

  const handleRegisterOpenHouse = async (openHouseId: string) => {
    const token = getAccessToken();
    if (!token) {
      const query = searchParams.toString();
      const currentPath = `${pathname}${query ? `?${query}` : ''}`;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    setRegisteringOpenHouseId(openHouseId);
    setOpenHouseRegisterSuccess(null);
    try {
      await viewingActionsApi.registerForOpenHouse(token, openHouseId);
      setOpenHouseRegisterSuccess(openHouseId);
    } catch {
      // non-critical — silently ignore duplicate registration errors
    } finally {
      setRegisteringOpenHouseId(null);
    }
  };

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

  const handleAcceptViewing = async (viewingId: string) => {
    const token = getAccessToken();
    if (!token) return;
    setIsSubmittingViewingAction(viewingId);
    try {
      const updated = await viewingsApi.confirm(token, viewingId);
      setListingViewings((prev) => prev.map((v) => v.id === viewingId ? { ...v, status: updated.status } : v));
    } catch {
      // silently ignore — status badge will not update
    } finally {
      setIsSubmittingViewingAction(null);
    }
  };

  const handleDeclineViewing = async () => {
    const token = getAccessToken();
    if (!token || !decliningViewingId || declineViewingForm.reason.trim().length < 10) return;
    setIsDecliningViewing(true);
    setDeclineViewingError('');
    try {
      const updated = await viewingsApi.decline(token, decliningViewingId, declineViewingForm);
      setListingViewings((prev) => prev.map((v) => v.id === decliningViewingId ? { ...v, status: updated.status, declined_at: new Date().toISOString() } : v));
      setShowDeclineViewingModal(false);
      setDecliningViewingId(null);
      setDeclineViewingForm({ reason: '', alternativeDates: [], message: '' });
    } catch (err) {
      setDeclineViewingError(err instanceof Error ? err.message : 'Failed to decline viewing.');
    } finally {
      setIsDecliningViewing(false);
    }
  };

  const handleCompleteViewing = async (viewingId: string) => {
    const token = getAccessToken();
    if (!token || completingViewingId) return;
    setCompletingViewingId(viewingId);
    try {
      await viewingActionsApi.complete(token, viewingId);
      setListingViewings((prev) => prev.map((v) => v.id === viewingId ? { ...v, status: 'completed' } : v));
    } catch {
      // silently ignore
    } finally {
      setCompletingViewingId(null);
    }
  };

  const handleCancelViewing = async () => {
    const token = getAccessToken();
    if (!token || !cancellingViewingId || cancelViewingReason.trim().length < 5) return;
    setIsCancellingViewing(true);
    setCancelViewingError('');
    try {
      const updated = await viewingsApi.cancel(token, cancellingViewingId, { reason: cancelViewingReason });
      setListingViewings((prev) => prev.map((v) => v.id === cancellingViewingId ? { ...v, status: updated.status, cancel_reason: cancelViewingReason, cancelled_by: 'agent' } : v));
      setShowCancelViewingModal(false);
      setCancellingViewingId(null);
      setCancelViewingReason('');
    } catch (err) {
      setCancelViewingError(err instanceof Error ? err.message : 'Failed to cancel viewing.');
    } finally {
      setIsCancellingViewing(false);
    }
  };

  const handleRescheduleViewing = async () => {
    const token = getAccessToken();
    if (!token || !reschedulingViewingId || !rescheduleViewingForm.scheduledAt) return;
    setIsReschedulingViewing(true);
    setRescheduleViewingError('');
    try {
      const updated = await viewingsApi.reschedule(token, reschedulingViewingId, {
        ...rescheduleViewingForm,
        scheduledAt: new Date(rescheduleViewingForm.scheduledAt).toISOString(),
      });
      setListingViewings((prev) =>
        prev.map((v) => v.id === reschedulingViewingId ? { ...v, scheduled_at: updated.scheduled_at, status: 'confirmed', rescheduled_at: updated.rescheduled_at } : v)
      );
      setShowRescheduleViewingModal(false);
      setReschedulingViewingId(null);
      setRescheduleViewingForm({ scheduledAt: '', reason: '' });
    } catch (err) {
      setRescheduleViewingError(err instanceof Error ? err.message : 'Failed to reschedule viewing.');
    } finally {
      setIsReschedulingViewing(false);
    }
  };

  const handleReplyInquiry = async (inquiryId: string) => {
    const token = getAccessToken();
    if (!token || !replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await inquiriesApi.respond(token, inquiryId, { response: replyText });
      setListingInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, response: replyText, status: 'responded' } : inq
        )
      );
      setReplyingInquiryId(null);
      setReplyText('');
    } catch {
      // silently ignore
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleCreateOpenHouse = async () => {
    const token = getAccessToken();
    if (!token || !propertyId) return;
    if (!openHouseForm.scheduledAt || !openHouseForm.endAt) {
      setOpenHouseFormError('Start time and end time are required.');
      return;
    }
    setIsSubmittingOpenHouse(true);
    setOpenHouseFormError('');
    try {
      const payload: CreateOpenHousePayload = {
        scheduledAt: openHouseForm.scheduledAt,
        endAt: openHouseForm.endAt,
        ...(openHouseForm.maxAttendees ? { maxAttendees: Number(openHouseForm.maxAttendees) } : {}),
        ...(openHouseForm.description?.trim() ? { description: openHouseForm.description } : {}),
      };
      const created = await agentApi.createOpenHouse(token, propertyId, payload);
      const newRecord: OpenHouseRecord = {
        id: created.id,
        property_id: propertyId,
        property_title: '',
        agent_id: currentUser?.id ?? '',
        scheduled_at: openHouseForm.scheduledAt,
        end_at: openHouseForm.endAt,
        max_attendees: openHouseForm.maxAttendees ? Number(openHouseForm.maxAttendees) : null,
        description: openHouseForm.description?.trim() || null,
        status: 'scheduled',
        cancel_reason: null,
        rescheduled_at: null,
        rescheduled_reason: null,
        preparation_checklist: null,
        marketing_options: null,
        created_at: new Date().toISOString(),
      };
      setPropertyOpenHouses((prev) => [newRecord, ...prev]);
      setAllPropertyOpenHouses((prev) => [newRecord, ...prev]);
      setShowCreateOpenHouseForm(false);
      setOpenHouseForm({ scheduledAt: '', endAt: '', maxAttendees: undefined, description: '' });
    } catch (err) {
      setOpenHouseFormError(err instanceof Error ? err.message : 'Failed to schedule open house.');
    } finally {
      setIsSubmittingOpenHouse(false);
    }
  };

  const handleCancelOpenHouse = async () => {
    const token = getAccessToken();
    if (!token || !cancellingOpenHouseId) return;
    if (!cancelOpenHouseForm.reason.trim() || cancelOpenHouseForm.reason.trim().length < 5) {
      setCancelOpenHouseError('Please provide a reason (at least 5 characters).');
      return;
    }
    setIsCancellingOpenHouse(true);
    setCancelOpenHouseError('');
    try {
      const updated = await agentApi.cancelOpenHouse(token, cancellingOpenHouseId, { reason: cancelOpenHouseForm.reason.trim() });
      setPropertyOpenHouses((prev) => prev.map((oh) => oh.id === cancellingOpenHouseId ? { ...oh, status: updated.status, cancel_reason: updated.cancel_reason } : oh));
      setAllPropertyOpenHouses((prev) => prev.map((oh) => oh.id === cancellingOpenHouseId ? { ...oh, status: updated.status, cancel_reason: updated.cancel_reason } : oh));
      setShowCancelOpenHouseModal(false);
      setCancellingOpenHouseId(null);
      setCancelOpenHouseForm({ reason: '' });
    } catch (err) {
      setCancelOpenHouseError(err instanceof Error ? err.message : 'Failed to cancel open house.');
    } finally {
      setIsCancellingOpenHouse(false);
    }
  };

  const handleRescheduleOpenHouse = async () => {
    const token = getAccessToken();
    if (!token || !reschedulingOpenHouseId) return;
    if (!rescheduleOpenHouseForm.scheduledAt || !rescheduleOpenHouseForm.endAt) {
      setRescheduleOpenHouseError('New start time and end time are required.');
      return;
    }
    setIsReschedulingOpenHouse(true);
    setRescheduleOpenHouseError('');
    try {
      const updated = await agentApi.rescheduleOpenHouse(token, reschedulingOpenHouseId, rescheduleOpenHouseForm);
      setPropertyOpenHouses((prev) => prev.map((oh) => oh.id === reschedulingOpenHouseId ? { ...oh, scheduled_at: updated.scheduled_at, end_at: updated.end_at, rescheduled_at: updated.rescheduled_at, rescheduled_reason: updated.rescheduled_reason } : oh));
      setAllPropertyOpenHouses((prev) => prev.map((oh) => oh.id === reschedulingOpenHouseId ? { ...oh, scheduled_at: updated.scheduled_at, end_at: updated.end_at, rescheduled_at: updated.rescheduled_at, rescheduled_reason: updated.rescheduled_reason } : oh));
      setShowRescheduleOpenHouseModal(false);
      setReschedulingOpenHouseId(null);
      setRescheduleOpenHouseForm({ scheduledAt: '', endAt: '', reason: '' });
    } catch (err) {
      setRescheduleOpenHouseError(err instanceof Error ? err.message : 'Failed to reschedule open house.');
    } finally {
      setIsReschedulingOpenHouse(false);
    }
  };

  const handleToggleOpenHouseAttendees = async (openHouseId: string) => {
    if (expandedOpenHouseId === openHouseId) {
      setExpandedOpenHouseId(null);
      return;
    }
    setExpandedOpenHouseId(openHouseId);
    if (openHouseAttendees[openHouseId]) return; // already loaded
    const token = getAccessToken();
    if (!token) return;
    setLoadingAttendeesId(openHouseId);
    try {
      const attendees = await viewingActionsApi.getOpenHouseRegistrations(token, openHouseId);
      setOpenHouseAttendees((prev) => ({ ...prev, [openHouseId]: attendees }));
    } catch {
      setOpenHouseAttendees((prev) => ({ ...prev, [openHouseId]: [] }));
    } finally {
      setLoadingAttendeesId(null);
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

  const handleSellerOfflineSign = async (mandateId: string) => {
    const token = getAccessToken();
    if (!token || !propertyId) {
      setMandateError('Please sign in to record an offline signature.');
      return;
    }
    if (!offlineSignFile) {
      setMandateError('Please select a signed agreement file.');
      return;
    }
    setIsSubmittingOfflineSign(true);
    setMandateError("");
    try {
      const updated = await mandateApi.markSellerSignedOffline(token, propertyId, mandateId, offlineSignFile);
      setMandates((prev) => prev.map((m) => m.id === mandateId ? updated : m));
      setOfflineSignMandateId(null);
      setOfflineSignFile(null);
      setMandateSuccess('Seller offline signature recorded.');
    } catch (err) {
      setMandateError(err instanceof Error ? err.message : 'Failed to record offline signature.');
    } finally {
      setIsSubmittingOfflineSign(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb + Back */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
          <button onClick={() => window.history.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 shrink-0">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <PropertyBreadcrumb
            propertyType={property.propertyType}
            city={property.city}
            region={property.region}
            title={property.title || 'Property'}
          />
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

        {/* ── Listing Intelligence — visible only to the listing creator ─────── */}
        {isOwnListing && (
          <Card className="mb-6 overflow-hidden border-0 shadow-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart2 className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-bold text-white">Listing Intelligence</h2>
                  </div>
                  <p className="text-slate-400 text-sm">Your listing — performance & management overview</p>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
                {/* Views */}
                <div className="bg-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Views</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {isLoadingStats ? <span className="text-slate-500">…</span> : (listingStats?.views ?? 0)}
                  </div>
                </div>

                {/* Saves */}
                <div className="bg-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Saves</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {isLoadingStats ? <span className="text-slate-500">…</span> : (listingStats?.saves ?? 0)}
                  </div>
                </div>

                {/* Enquiries */}
                <div className="bg-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Enquiries</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {isLoadingStats ? <span className="text-slate-500">…</span> : (listingStats?.inquiries ?? 0)}
                  </div>
                </div>

                {/* Viewings */}
                <div className="bg-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Viewings</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {isLoadingStats ? <span className="text-slate-500">…</span> : (
                      (listingStats?.viewings_requested ?? 0) +
                      (listingStats?.viewings_confirmed ?? 0) +
                      (listingStats?.viewings_completed ?? 0)
                    )}
                  </div>
                  {listingStats && (
                    <div className="mt-1 flex gap-2 flex-wrap">
                      {listingStats.viewings_requested > 0 && <span className="text-xs text-amber-300">{listingStats.viewings_requested} pending</span>}
                      {listingStats.viewings_confirmed > 0 && <span className="text-xs text-blue-300">{listingStats.viewings_confirmed} confirmed</span>}
                      {listingStats.viewings_completed > 0 && <span className="text-xs text-emerald-300">{listingStats.viewings_completed} done</span>}
                    </div>
                  )}
                </div>

                {/* Days on market */}
                <div className="bg-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Days Listed</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {isLoadingStats ? <span className="text-slate-500">…</span> : (listingStats?.days_on_market ?? 0)}
                  </div>
                  {listingStats && listingStats.open_houses_scheduled > 0 && (
                    <div className="mt-1 text-xs text-purple-300">{listingStats.open_houses_scheduled} open house{listingStats.open_houses_scheduled !== 1 ? 's' : ''} scheduled</div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {/* Viewings tab */}
                <button
                  onClick={() => setOwnerTab('viewings')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    ownerTab === 'viewings'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <Calendar className={`w-4 h-4 ${ownerTab === 'viewings' ? 'text-blue-200' : 'text-blue-400'}`} />
                  <span>Scheduled Viewings</span>
                  {listingViewings.length > 0 && (
                    <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${ownerTab === 'viewings' ? 'bg-blue-500 text-blue-100' : 'bg-blue-100 text-blue-600'}`}>
                      {listingViewings.length}
                    </span>
                  )}
                </button>

                {/* Enquiries tab */}
                <button
                  onClick={() => setOwnerTab('inquiries')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    ownerTab === 'inquiries'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  <MessageCircle className={`w-4 h-4 ${ownerTab === 'inquiries' ? 'text-orange-200' : 'text-orange-400'}`} />
                  <span>Enquiries</span>
                  {listingInquiries.length > 0 && (
                    <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${ownerTab === 'inquiries' ? 'bg-orange-400 text-orange-100' : 'bg-orange-100 text-orange-600'}`}>
                      {listingInquiries.length}
                    </span>
                  )}
                </button>

                {/* Open Houses tab */}
                <button
                  onClick={() => setOwnerTab('open_houses')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    ownerTab === 'open_houses'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-purple-300 hover:text-purple-600'
                  }`}
                >
                  <Home className={`w-4 h-4 ${ownerTab === 'open_houses' ? 'text-purple-200' : 'text-purple-400'}`} />
                  <span>Open Houses</span>
                  {allPropertyOpenHouses.length > 0 && (
                    <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${ownerTab === 'open_houses' ? 'bg-purple-500 text-purple-100' : 'bg-purple-100 text-purple-600'}`}>
                      {allPropertyOpenHouses.length}
                    </span>
                  )}
                </button>

                {/* Property Condition tab */}
                <button
                  onClick={() => setOwnerTab('property_condition')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    ownerTab === 'property_condition'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-teal-300 hover:text-teal-600'
                  }`}
                >
                  <ClipboardCheck className={`w-4 h-4 ${ownerTab === 'property_condition' ? 'text-teal-200' : 'text-teal-400'}`} />
                  <span>Property Condition</span>
                </button>

                {/* Selling Points tab */}
                <button
                  onClick={() => setOwnerTab('selling_points')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    ownerTab === 'selling_points'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-300 hover:text-amber-600'
                  }`}
                >
                  <Star className={`w-4 h-4 ${ownerTab === 'selling_points' ? 'text-amber-200' : 'text-amber-400'}`} />
                  <span>Selling Points</span>
                </button>

                {/* Notes tab */}
                <button
                  onClick={() => setOwnerTab('notes')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    ownerTab === 'notes'
                      ? 'bg-slate-600 text-white shadow-md shadow-slate-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-slate-600'
                  }`}
                >
                  <FileText className={`w-4 h-4 ${ownerTab === 'notes' ? 'text-slate-300' : 'text-slate-400'}`} />
                  <span>Notes</span>
                </button>

                {/* Showings tab */}
                <button
                  onClick={() => setOwnerTab('showings')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    ownerTab === 'showings'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  <Eye className={`w-4 h-4 ${ownerTab === 'showings' ? 'text-indigo-200' : 'text-indigo-400'}`} />
                  <span>Showings</span>
                </button>

                {/* Leads tab */}
                <button
                  onClick={() => setOwnerTab('leads')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    ownerTab === 'leads'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-cyan-300 hover:text-cyan-600'
                  }`}
                >
                  <Users className={`w-4 h-4 ${ownerTab === 'leads' ? 'text-cyan-200' : 'text-cyan-400'}`} />
                  <span>Leads</span>
                </button>

                {/* Offers tab */}
                <button
                  onClick={() => setOwnerTab('offers')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    ownerTab === 'offers'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  <DollarSign className={`w-4 h-4 ${ownerTab === 'offers' ? 'text-emerald-200' : 'text-emerald-400'}`} />
                  <span>Offers</span>
                </button>

                {/* Sale Details tab */}
                <button
                  onClick={() => setOwnerTab('sale_details')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    ownerTab === 'sale_details'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-rose-300 hover:text-rose-600'
                  }`}
                >
                  <Handshake className={`w-4 h-4 ${ownerTab === 'sale_details' ? 'text-rose-200' : 'text-rose-400'}`} />
                  <span>Sale Details</span>
                </button>

                {/* Post-Sale Activities tab */}
                <button
                  onClick={() => setOwnerTab('post_sale')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    ownerTab === 'post_sale'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-violet-300 hover:text-violet-600'
                  }`}
                >
                  <CheckSquare className={`w-4 h-4 ${ownerTab === 'post_sale' ? 'text-violet-200' : 'text-violet-400'}`} />
                  <span>Post-Sale Activities</span>
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="bg-white px-6 py-4">

              {/* Viewings tab */}
              {ownerTab === 'viewings' && (
                <div>
                  {isLoadingViewings ? (
                    <p className="text-sm text-gray-400 py-4">Loading viewings…</p>
                  ) : listingViewings.length === 0 ? (
                    <div className="py-8 text-center">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No viewings booked yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                      {listingViewings.map((v) => {
                        const statusColors: Record<string, string> = {
                          requested: 'bg-amber-100 text-amber-700',
                          confirmed: 'bg-blue-100 text-blue-700',
                          completed: 'bg-emerald-100 text-emerald-700',
                          declined: 'bg-red-100 text-red-700',
                          cancelled: 'bg-gray-100 text-gray-600',
                        };
                        const buyerName = [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || 'Unknown Buyer';
                        const typeLabel = v.viewing_type === 'virtual' ? 'Virtual' : v.viewing_type === 'open_house' ? 'Open House' : 'In-Person';
                        const isActioning = isSubmittingViewingAction === v.id;
                        return (
                          <div key={v.id} className="py-3 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                  <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">{buyerName}</p>
                                  {v.buyer_email && <p className="text-xs text-gray-500 truncate">{v.buyer_email}</p>}
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(v.scheduled_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      {' '}
                                      {new Date(v.scheduled_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-xs text-gray-400">· {typeLabel}</span>
                                    {v.duration_minutes && <span className="text-xs text-gray-400">· {v.duration_minutes}min</span>}
                                  </div>
                                  {v.cancel_reason && <p className="text-xs text-red-500 mt-1">Reason: {v.cancel_reason}</p>}
                                  {v.buyer_feedback && <p className="text-xs text-gray-400 mt-1 italic">"{v.buyer_feedback}"</p>}
                                </div>
                              </div>
                              <Badge className={`shrink-0 text-xs ${statusColors[v.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {v.status}
                              </Badge>
                            </div>

                            {/* Action buttons */}
                            {v.status === 'requested' && (
                              <div className="ml-11 flex flex-wrap gap-2">
                                <button
                                  onClick={() => { void handleAcceptViewing(v.id); }}
                                  disabled={isActioning}
                                  className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                >
                                  {isActioning ? 'Confirming…' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => { setDecliningViewingId(v.id); setDeclineViewingForm({ reason: '', alternativeDates: [], message: '' }); setDeclineViewingError(''); setAltDeclineDateInput(''); setShowDeclineViewingModal(true); }}
                                  className="text-xs px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => { setCancellingViewingId(v.id); setCancelViewingReason(''); setCancelViewingError(''); setShowCancelViewingModal(true); }}
                                  className="text-xs px-3 py-1.5 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {v.status === 'confirmed' && (
                              <div className="ml-11 flex flex-wrap gap-2">
                                <button
                                  onClick={() => { void handleCompleteViewing(v.id); }}
                                  disabled={completingViewingId === v.id}
                                  className="text-xs px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                                >
                                  {completingViewingId === v.id ? 'Completing…' : 'Complete'}
                                </button>
                                <button
                                  onClick={() => { setReschedulingViewingId(v.id); setRescheduleViewingForm({ scheduledAt: '', reason: '' }); setRescheduleViewingError(''); setShowRescheduleViewingModal(true); }}
                                  className="text-xs px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => { setCancellingViewingId(v.id); setCancelViewingReason(''); setCancelViewingError(''); setShowCancelViewingModal(true); }}
                                  className="text-xs px-3 py-1.5 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Enquiries tab */}
              {ownerTab === 'inquiries' && (
                <div>
                  {isLoadingInquiries ? (
                    <p className="text-sm text-gray-400 py-4">Loading enquiries…</p>
                  ) : listingInquiries.length === 0 ? (
                    <div className="py-8 text-center">
                      <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No enquiries received yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                      {listingInquiries.map((inq) => {
                        const typeColors: Record<string, string> = {
                          viewing: 'bg-purple-100 text-purple-700',
                          offer: 'bg-green-100 text-green-700',
                          question: 'bg-blue-100 text-blue-700',
                        };
                        const statusColors: Record<string, string> = {
                          new: 'bg-amber-100 text-amber-700',
                          responded: 'bg-emerald-100 text-emerald-700',
                          closed: 'bg-gray-100 text-gray-600',
                        };
                        return (
                          <div key={inq.id} className="py-3">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                  <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">
                                    {inq.requester_name || 'Anonymous'}
                                  </p>
                                  {inq.requester_email && <p className="text-xs text-gray-500">{inq.requester_email}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge className={`text-xs ${typeColors[inq.inquiry_type] ?? 'bg-gray-100 text-gray-600'}`}>
                                  {inq.inquiry_type}
                                </Badge>
                                <Badge className={`text-xs ${statusColors[inq.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                  {inq.status}
                                </Badge>
                              </div>
                            </div>
                            {inq.message && (
                              <p className="text-sm text-gray-600 ml-9 line-clamp-2">{inq.message}</p>
                            )}
                            {inq.response && (
                              <div className="ml-9 mt-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                <p className="text-xs font-medium text-emerald-700 mb-0.5">Your response:</p>
                                <p className="text-xs text-emerald-800 line-clamp-2">{inq.response}</p>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 ml-9 mt-1">
                              {new Date(inq.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>

                            {/* Reply action */}
                            {inq.status === 'new' && (
                              <div className="ml-9 mt-2">
                                {replyingInquiryId !== inq.id ? (
                                  <button
                                    onClick={() => { setReplyingInquiryId(inq.id); setReplyText(''); }}
                                    className="text-xs px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                  >
                                    Reply
                                  </button>
                                ) : (
                                  <div className="space-y-2">
                                    <textarea
                                      rows={3}
                                      placeholder="Write your response…"
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => { void handleReplyInquiry(inq.id); }}
                                        disabled={isSubmittingReply || !replyText.trim()}
                                        className="text-xs px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                      >
                                        {isSubmittingReply ? 'Sending…' : 'Send Reply'}
                                      </button>
                                      <button
                                        onClick={() => setReplyingInquiryId(null)}
                                        className="text-xs px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Open Houses tab */}
              {ownerTab === 'open_houses' && (
                <div>
                  {/* Schedule button */}
                  <div className="mb-4">
                    {!showCreateOpenHouseForm ? (
                      <button
                        onClick={() => { setShowCreateOpenHouseForm(true); setOpenHouseFormError(''); }}
                        className="text-sm px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium"
                      >
                        + Schedule Open House
                      </button>
                    ) : (
                      <div className="border border-purple-100 rounded-xl bg-purple-50 p-4 space-y-3">
                        <p className="text-sm font-medium text-purple-900">Schedule Open House</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Start date &amp; time <span className="text-red-500">*</span></label>
                            <input
                              type="datetime-local"
                              value={openHouseForm.scheduledAt}
                              onChange={(e) => setOpenHouseForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                              className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End date &amp; time <span className="text-red-500">*</span></label>
                            <input
                              type="datetime-local"
                              value={openHouseForm.endAt}
                              onChange={(e) => setOpenHouseForm((f) => ({ ...f, endAt: e.target.value }))}
                              className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Max attendees (optional)</label>
                            <input
                              type="number"
                              min={1}
                              placeholder="e.g. 20"
                              value={openHouseForm.maxAttendees ?? ''}
                              onChange={(e) => setOpenHouseForm((f) => ({ ...f, maxAttendees: e.target.value ? Number(e.target.value) : undefined }))}
                              className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. Refreshments provided"
                              value={openHouseForm.description ?? ''}
                              onChange={(e) => setOpenHouseForm((f) => ({ ...f, description: e.target.value }))}
                              className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                            />
                          </div>
                        </div>
                        {openHouseFormError && (
                          <p className="text-xs text-red-600">{openHouseFormError}</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => { void handleCreateOpenHouse(); }}
                            disabled={isSubmittingOpenHouse}
                            className="text-xs px-4 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
                          >
                            {isSubmittingOpenHouse ? 'Scheduling…' : 'Schedule'}
                          </button>
                          <button
                            onClick={() => { setShowCreateOpenHouseForm(false); setOpenHouseFormError(''); }}
                            className="text-xs px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {allPropertyOpenHouses.length === 0 ? (
                    <div className="py-6 text-center">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No open houses scheduled</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                      {allPropertyOpenHouses.map((oh) => {
                        const statusColors: Record<string, string> = {
                          scheduled: 'bg-blue-100 text-blue-700',
                          active: 'bg-emerald-100 text-emerald-700',
                          completed: 'bg-gray-100 text-gray-600',
                          cancelled: 'bg-red-100 text-red-700',
                        };
                        return (
                          <div key={oh.id} className="py-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                                  <Calendar className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-900">
                                    {new Date(oh.scheduled_at).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(oh.scheduled_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                                    {' – '}
                                    {new Date(oh.end_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                                    {oh.max_attendees != null && ` · max ${oh.max_attendees} attendees`}
                                  </p>
                                  {oh.description && <p className="text-xs text-gray-400 mt-1 italic">{oh.description}</p>}
                                  {oh.rescheduled_at && (
                                    <p className="text-xs text-amber-600 mt-1">Rescheduled{oh.rescheduled_reason ? `: ${oh.rescheduled_reason}` : ''}</p>
                                  )}
                                  {oh.cancel_reason && (
                                    <p className="text-xs text-red-500 mt-1">Cancelled: {oh.cancel_reason}</p>
                                  )}
                                </div>
                              </div>
                              <Badge className={`shrink-0 text-xs ${statusColors[oh.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {oh.status}
                              </Badge>
                            </div>
                            {oh.status === 'scheduled' && (
                              <div className="ml-11 flex flex-wrap gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    setReschedulingOpenHouseId(oh.id);
                                    setRescheduleOpenHouseForm({ scheduledAt: '', endAt: '', reason: '' });
                                    setRescheduleOpenHouseError('');
                                    setShowRescheduleOpenHouseModal(true);
                                  }}
                                  className="text-xs px-3 py-1.5 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => {
                                    setCancellingOpenHouseId(oh.id);
                                    setCancelOpenHouseForm({ reason: '' });
                                    setCancelOpenHouseError('');
                                    setShowCancelOpenHouseModal(true);
                                  }}
                                  className="text-xs px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                            {/* Registrants section */}
                            <div className="ml-11 mt-3">
                              <button
                                onClick={() => void handleToggleOpenHouseAttendees(oh.id)}
                                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium"
                              >
                                <Users className="w-3.5 h-3.5" />
                                {expandedOpenHouseId === oh.id ? 'Hide' : 'View'} Registrants
                                {openHouseAttendees[oh.id] != null && (
                                  <span className="bg-purple-100 text-purple-700 rounded-full px-1.5 py-0.5 text-xs font-bold">
                                    {openHouseAttendees[oh.id].length}
                                  </span>
                                )}
                              </button>
                              {expandedOpenHouseId === oh.id && (
                                <div className="mt-2">
                                  {loadingAttendeesId === oh.id ? (
                                    <p className="text-xs text-gray-400 py-2">Loading registrants…</p>
                                  ) : !openHouseAttendees[oh.id]?.length ? (
                                    <p className="text-xs text-gray-400 py-2 italic">No registrations yet.</p>
                                  ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                      {openHouseAttendees[oh.id].map((att) => {
                                        const name = (att.guest_name ?? [att.first_name, att.last_name].filter(Boolean).join(' ')) || 'Unknown';
                                        const email = att.guest_email ?? att.email ?? '—';
                                        const phone = att.guest_phone ?? att.phone ?? null;
                                        const interestColors = { high: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-600' };
                                        return (
                                          <div key={att.id} className="flex items-start justify-between gap-2 bg-white border border-gray-100 rounded-md px-2.5 py-2 text-xs">
                                            <div className="min-w-0">
                                              <p className="font-medium text-gray-900 truncate">{name}</p>
                                              <p className="text-gray-500 truncate">{email}{phone ? ` · ${phone}` : ''}</p>
                                              <p className="text-gray-400 mt-0.5">
                                                Registered {new Date(att.registered_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                                              </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                              {att.attended && (
                                                <span className="bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-xs font-bold">✓ Attended</span>
                                              )}
                                              {att.interest_level && (
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${interestColors[att.interest_level] ?? ''}`}>
                                                  {att.interest_level} interest
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Property Condition tab */}
              {ownerTab === 'property_condition' && (
                <div className="py-8 text-center">
                  <ClipboardCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Property Condition</p>
                  <p className="text-xs text-gray-400">Record overall condition, defects, recent renovations, and maintenance notes.</p>
                </div>
              )}

              {/* Selling Points tab */}
              {ownerTab === 'selling_points' && (
                <div className="py-8 text-center">
                  <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Selling Points</p>
                  <p className="text-xs text-gray-400">Highlight key features, unique attributes, and competitive advantages of this property.</p>
                </div>
              )}

              {/* Notes tab */}
              {ownerTab === 'notes' && (
                <div className="py-8 text-center">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                  <p className="text-xs text-gray-400">Add internal notes, reminders, and observations about this listing.</p>
                </div>
              )}

              {/* Showings tab */}
              {ownerTab === 'showings' && (
                <div className="py-8 text-center">
                  <Eye className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Showings</p>
                  <p className="text-xs text-gray-400">Track property showings, attendee feedback, and follow-up actions.</p>
                </div>
              )}

              {/* Leads tab */}
              {ownerTab === 'leads' && (
                <div className="py-8 text-center">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Leads</p>
                  <p className="text-xs text-gray-400">View and manage interested buyers and their engagement history.</p>
                </div>
              )}

              {/* Offers tab */}
              {ownerTab === 'offers' && (
                <div className="py-8 text-center">
                  <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Offers</p>
                  <p className="text-xs text-gray-400">Review, compare, and respond to purchase offers on this property.</p>
                </div>
              )}

              {/* Sale Details tab */}
              {ownerTab === 'sale_details' && (
                <div className="py-8 text-center">
                  <Handshake className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Sale Details</p>
                  <p className="text-xs text-gray-400">View accepted offer terms, sale price, conditions, and closing timeline.</p>
                </div>
              )}

              {/* Post-Sale Activities tab */}
              {ownerTab === 'post_sale' && (
                <div className="py-8 text-center">
                  <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 mb-1">Post-Sale Activities</p>
                  <p className="text-xs text-gray-400">Track handover tasks, key transfers, and post-completion follow-ups.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div ref={heroRef} className="bg-white rounded-lg overflow-hidden">
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
                  <PropertyShareButton title={property.title} />
                  <PrintButton />
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

            {/* Floor Plans */}
            {floorPlans.length > 0 && (
              <FloorPlanViewer floorPlans={floorPlans} />
            )}

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

            {/* Monthly Costs */}
            <PropertyMonthlyCosts
              monthlyLevy={property.monthlyLevy}
              monthlyRates={property.monthlyRates}
              monthlyUtilities={property.monthlyUtilities}
              currency={property.currency}
            />

            {/* Listing Timeline & Status */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Listing Timeline & Status</h3>
              </div>
              <PropertyDaysOnMarket createdAt={property.createdAt} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-3">
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
                    <LeafletMapDynamic
                      center={locationMapSource.center}
                      zoom={locationMapSource.zoom}
                      markers={locationMapSource.markers}
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

            {/* Ownership History */}
            <PropertyOwnershipHistory transfers={ownershipHistory} />

            {/* Price History */}
            {priceHistory.length > 0 && (
              <PriceHistoryChart
                entries={priceHistory}
                currentPrice={property.rawPrice}
                currency={property.currency}
              />
            )}

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
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <Home className="w-8 h-8 mb-3 text-blue-500" />
                <h3 className="font-bold text-xl mb-1 text-blue-800">Your Listing</h3>
                {existingSale ? (
                  <>
                    <p className="text-blue-600 text-sm mb-3">
                      A sale is already in progress for this property.
                    </p>
                    <div className="mb-4 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      Stage {existingSale.currentStage} · {existingSale.status.charAt(0).toUpperCase() + existingSale.status.slice(1)}
                    </div>
                    <Button
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => navigate(`/workspace/${existingSale.id}`)}
                    >
                      View Sale Workspace →
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-blue-600 text-sm mb-4">
                      Initiate a sale to begin the 14-stage purchase pipeline for this property.
                    </p>
                    <Button
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => {
                        setInitiateSaleAgreedPrice('');
                        setInitiateSaleCurrency(rawListingCurrency);
                        setInitiateSaleBuyerId('');
                        setInitiateSaleDeposit('');
                        setInitiateSaleError(null);
                        setShowInitiateSaleModal(true);
                      }}
                      disabled={isSoldListing}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {isSoldListing ? 'Property Sold' : 'Initiate Sale'}
                    </Button>
                  </>
                )}
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
                      if (currentUser) {
                        setViewerName(`${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim());
                        setViewerEmail(currentUser.email ?? '');
                        setViewerPhone(currentUser.phone ?? '');
                      }
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

            {/* Upcoming Open Houses */}
            {propertyOpenHouses.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Open Houses</h3>
                    <p className="text-xs text-gray-500">Open to the public — no appointment needed</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {propertyOpenHouses.map((oh) => {
                    const isRegistered = openHouseRegisterSuccess === oh.id;
                    const isRegistering = registeringOpenHouseId === oh.id;
                    return (
                      <div key={oh.id} className="border border-purple-100 bg-purple-50 rounded-lg p-3">
                        <p className="font-medium text-sm text-gray-900">
                          {new Date(oh.scheduled_at).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {new Date(oh.scheduled_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                          {' — '}
                          {new Date(oh.end_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                          {oh.max_attendees != null && ` · max ${oh.max_attendees} attendees`}
                        </p>
                        {oh.description && (
                          <p className="text-xs text-gray-500 mt-1 italic">{oh.description}</p>
                        )}
                        <Button
                          size="sm"
                          className={`mt-2 w-full text-xs h-8 ${isRegistered ? 'bg-green-500 hover:bg-green-500 text-white' : isOwnListing ? 'opacity-50 cursor-not-allowed bg-purple-300 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                          disabled={isRegistered || isRegistering || isOwnListing}
                          title={isOwnListing ? 'You cannot register for your own listing' : undefined}
                          onClick={() => void handleRegisterOpenHouse(oh.id)}
                        >
                          {isRegistered ? '✓ Registered' : isRegistering ? 'Registering…' : 'Register Attendance'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
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
                          <span>{m.signed_by_agent_at ? '✓ Agent signed' : '○ Agent unsigned'}</span>
                          <span>{m.signed_by_seller_at ? '✓ Seller signed' : '○ Seller unsigned'}</span>
                        </div>
                        {m.seller_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            Seller: {m.seller_name}{m.seller_email ? ` · ${m.seller_email}` : ''}{m.seller_phone ? ` · ${m.seller_phone}` : ''}
                          </p>
                        )}
                        {(m.status === 'pending_signature' || m.status === 'active') && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {!m.signed_by_agent_at && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                disabled={signingMandateId === m.id}
                                onClick={() => void handleSignMandate(m.id, 'agent')}
                              >
                                Sign as Agent
                              </Button>
                            )}
                            {!m.signed_by_seller_at && !m.seller_is_platform_user && (
                              offlineSignMandateId === m.id ? (
                                <div className="w-full mt-1 p-2 bg-green-50 border border-green-200 rounded-lg space-y-2">
                                  <p className="text-xs font-medium text-green-800">Upload signed agreement proof</p>
                                  <label className="flex items-center gap-2 w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white cursor-pointer hover:border-green-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <span className="truncate text-gray-600">
                                      {offlineSignFile ? offlineSignFile.name : 'Choose PDF, JPG, or PNG…'}
                                    </span>
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.heic,application/pdf,image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        setOfflineSignFile(f);
                                      }}
                                    />
                                  </label>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white"
                                      disabled={isSubmittingOfflineSign || !offlineSignFile}
                                      onClick={() => void handleSellerOfflineSign(m.id)}
                                    >
                                      {isSubmittingOfflineSign ? 'Uploading…' : 'Confirm'}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() => { setOfflineSignMandateId(null); setOfflineSignFile(null); }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 text-green-700 border-green-300 hover:bg-green-50"
                                  onClick={() => setOfflineSignMandateId(m.id)}
                                >
                                  Mark Seller Signed (Offline)
                                </Button>
                              )
                            )}
                            <Button
                              type="button"
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
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={mandateForm.sellerIsPlatformUser !== false}
                          onChange={(e) => setMandateForm((f) => ({ ...f, sellerIsPlatformUser: e.target.checked }))}
                          className="rounded"
                        />
                        Seller is registered on the platform
                      </label>
                    </div>
                    {mandateForm.sellerIsPlatformUser === false && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Seller Full Name</label>
                          <input
                            type="text"
                            placeholder="e.g. John Smith"
                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                            value={mandateForm.sellerName ?? ''}
                            onChange={(e) => setMandateForm((f) => ({ ...f, sellerName: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Seller Email</label>
                            <input
                              type="email"
                              placeholder="seller@example.com"
                              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                              value={mandateForm.sellerEmail ?? ''}
                              onChange={(e) => setMandateForm((f) => ({ ...f, sellerEmail: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Seller Phone</label>
                            <input
                              type="tel"
                              placeholder="+27 ..."
                              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                              value={mandateForm.sellerPhone ?? ''}
                              onChange={(e) => setMandateForm((f) => ({ ...f, sellerPhone: e.target.value }))}
                            />
                          </div>
                        </div>
                      </>
                    )}
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

            {/* Property Valuation — AI estimate + history + request */}
            {currentUser && (() => {
              const userRoles = currentUser.roles ?? (currentUser.role ? [currentUser.role] : []);
              const canViewAiEstimate = userRoles.some((r) => ['agent', 'admin', 'valuer'].includes(r));
              const canRequestValuation = userRoles.some((r) => ['agent', 'admin', 'valuer', 'buyer_seller'].includes(r));
              if (!canRequestValuation) return null;

              const confidenceColor = aiEstimate?.confidence === 'high'
                ? 'text-green-700 bg-green-50 border-green-200'
                : aiEstimate?.confidence === 'medium'
                ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                : 'text-orange-700 bg-orange-50 border-orange-200';

              return (
                <Card className="p-5 space-y-4">
                  <h3 className="font-semibold">Property Valuation</h3>

                  {/* AI Estimate — agents/valuers/admins only */}
                  {canViewAiEstimate && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <p className="text-xs font-medium text-blue-600 mb-1.5 flex items-center gap-1">
                        <span>AI Estimate</span>
                        {aiEstimate && (
                          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full border font-medium ${confidenceColor}`}>
                            {aiEstimate.confidence} confidence
                          </span>
                        )}
                      </p>
                      {isLoadingAiEstimate ? (
                        <div className="flex items-center gap-2 text-sm text-blue-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Calculating…</span>
                        </div>
                      ) : aiEstimate && aiEstimate.estimate > 0 ? (
                        <>
                          <p className="text-xl font-bold text-blue-900">
                            {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: aiEstimate.currency, maximumFractionDigits: 0 }).format(aiEstimate.estimate)}
                          </p>
                          <p className="text-xs text-blue-600 mt-0.5">
                            Range: {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: aiEstimate.currency, maximumFractionDigits: 0 }).format(aiEstimate.low)} – {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: aiEstimate.currency, maximumFractionDigits: 0 }).format(aiEstimate.high)}
                          </p>
                          <p className="text-xs text-blue-500 mt-1 italic">{aiEstimate.methodology}</p>
                          <p className="text-xs text-blue-400 mt-0.5">Based on {aiEstimate.comparables_count} comparable sale{aiEstimate.comparables_count !== 1 ? 's' : ''}</p>
                        </>
                      ) : (
                        <p className="text-sm text-blue-500">Insufficient data for estimate.</p>
                      )}
                    </div>
                  )}

                  {/* Valuation history */}
                  {isLoadingValuations ? (
                    <p className="text-xs text-gray-400">Loading valuations…</p>
                  ) : propertyValuations.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Valuation History</p>
                      <div className="space-y-2">
                        {propertyValuations.map((v) => (
                          <div key={v.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${v.valuation_type === 'formal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {v.valuation_type === 'cma' ? 'CMA' : 'Formal'}
                              </span>
                              <span className="text-gray-500">{new Date(v.valuation_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <p className="font-semibold text-gray-900 mt-1">
                              {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: v.currency, maximumFractionDigits: 0 }).format(Number(v.estimated_value))}
                            </p>
                            {v.market_low && v.market_high && (
                              <p className="text-gray-500 mt-0.5">
                                Range: {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: v.currency, maximumFractionDigits: 0 }).format(Number(v.market_low))} – {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: v.currency, maximumFractionDigits: 0 }).format(Number(v.market_high))}
                              </p>
                            )}
                            {v.requesting_purpose && (
                              <p className="text-gray-400 mt-0.5 capitalize">{v.requesting_purpose.replace('_', ' ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No valuations recorded yet.</p>
                  )}

                  <Button
                    variant="outline"
                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => setShowValuationModal(true)}
                  >
                    Request Valuation
                  </Button>
                </Card>
              );
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
                              <p className="font-medium truncate">{cs.address}</p>
                              {cs.city && <p className="text-gray-400 truncate">{cs.city}</p>}
                              <div className="flex items-center justify-between mt-0.5 text-gray-500">
                                <span>{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: cs.currency || 'ZAR', maximumFractionDigits: 0 }).format(Number(cs.sale_price))}</span>
                                {cs.property_type && <span className="capitalize text-gray-400">{cs.property_type}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-gray-400">
                                {cs.bedrooms != null && <span>{cs.bedrooms} bd</span>}
                                {cs.floor_area_sqm != null && <span>{cs.floor_area_sqm} m²</span>}
                                {cs.sale_date && <span>sold {new Date(cs.sale_date).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}</span>}
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
                <ContactPreferences
                  preferredContactMethod={inquiryContactMethod}
                  bestContactTime={inquiryContactTime}
                  onContactMethodChange={setInquiryContactMethod}
                  onContactTimeChange={setInquiryContactTime}
                  disabled={isSoldListing}
                />
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

            {/* Verification Checklist */}
            <PropertyVerificationChecklist
              overallStatus={property.verificationStatus}
              verifiedAt={property.verifiedAt}
              propertyType={property.propertyType}
            />

            {/* Bond Calculator */}
            {property.rawPrice > 0 && (
              <BondCalculator price={property.rawPrice} currency={property.currency} />
            )}

            {/* Tier 4 — Future Features */}
            <FutureFeaturesCard
              title="3D Virtual Walkthrough"
              description="Immersive Matterport-powered 3D tours so you can explore every room remotely."
              icon={<Box className="w-5 h-5" />}
            />
            <FutureFeaturesCard
              title="School Catchment Mapping"
              description="See nearby schools, catchment zones, and ratings overlaid on an interactive map."
              icon={<GraduationCap className="w-5 h-5" />}
            />
            <FutureFeaturesCard
              title="Energy Efficiency Rating"
              description="Detailed energy performance certificate with estimated monthly utility costs."
              icon={<Zap className="w-5 h-5" />}
            />

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

      {/* Sticky CTA Bar */}
      {!isOwnListing && (
        <StickyCtaBar
          heroRef={heroRef}
          propertyTitle={property.title}
          price={property.price}
          isSaved={isSaved}
          onContactAgent={() => { void handleCallAgent(); }}
          onScheduleViewing={() => setShowScheduleModal(true)}
          onToggleSave={() => { void handleAddToFavourites(); }}
          disabled={isSoldListing}
        />
      )}

      {/* Decline Viewing Modal */}
      {showDeclineViewingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-700">Decline Viewing</h3>
              <button onClick={() => setShowDeclineViewingModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {declineViewingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{declineViewingError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Reason for declining * <span className="text-gray-400 font-normal">(min 10 chars)</span></label>
                <textarea
                  value={declineViewingForm.reason}
                  onChange={(e) => setDeclineViewingForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  placeholder="Explain why you are declining this viewing request…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Suggest alternative dates <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={altDeclineDateInput}
                    onChange={(e) => setAltDeclineDateInput(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    title="Alternative date"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (altDeclineDateInput) {
                        setDeclineViewingForm((f) => ({ ...f, alternativeDates: [...(f.alternativeDates ?? []), new Date(altDeclineDateInput).toISOString()] }));
                        setAltDeclineDateInput('');
                      }
                    }}
                  >Add</Button>
                </div>
                {(declineViewingForm.alternativeDates ?? []).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {(declineViewingForm.alternativeDates ?? []).map((d, i) => (
                      <li key={i} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded">
                        {new Date(d).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                        <button
                          onClick={() => setDeclineViewingForm((f) => ({ ...f, alternativeDates: (f.alternativeDates ?? []).filter((_, j) => j !== i) }))}
                          className="text-red-400 hover:text-red-600 ml-2"
                          aria-label="Remove date"
                        ><X className="w-3 h-3" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Additional message to buyer <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={declineViewingForm.message ?? ''}
                  onChange={(e) => setDeclineViewingForm((f) => ({ ...f, message: e.target.value }))}
                  rows={2}
                  placeholder="Any extra information for the buyer…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDeclineViewingModal(false)}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isDecliningViewing || declineViewingForm.reason.trim().length < 10}
                onClick={() => void handleDeclineViewing()}
              >
                {isDecliningViewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Decline Viewing
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel Viewing Modal */}
      {showCancelViewingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-orange-700">Cancel Viewing</h3>
              <button onClick={() => setShowCancelViewingModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {cancelViewingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{cancelViewingError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">Reason for cancellation * <span className="text-gray-400 font-normal">(min 5 chars)</span></label>
              <textarea
                value={cancelViewingReason}
                onChange={(e) => setCancelViewingReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason for cancelling this viewing…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCancelViewingModal(false)}>Back</Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isCancellingViewing || cancelViewingReason.trim().length < 5}
                onClick={() => void handleCancelViewing()}
              >
                {isCancellingViewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Cancellation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reschedule Viewing Modal */}
      {showRescheduleViewingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-blue-700">Reschedule Viewing</h3>
              <button onClick={() => setShowRescheduleViewingModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {rescheduleViewingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{rescheduleViewingError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">New date &amp; time *</label>
                <input
                  type="datetime-local"
                  value={rescheduleViewingForm.scheduledAt}
                  onChange={(e) => setRescheduleViewingForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  title="New viewing date and time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Reason for rescheduling <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={rescheduleViewingForm.reason ?? ''}
                  onChange={(e) => setRescheduleViewingForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={2}
                  placeholder="Let the buyer know why you need to reschedule…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowRescheduleViewingModal(false)}>Cancel</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isReschedulingViewing || !rescheduleViewingForm.scheduledAt}
                onClick={() => void handleRescheduleViewing()}
              >
                {isReschedulingViewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Reschedule
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel Open House Modal */}
      {showCancelOpenHouseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-700">Cancel Open House</h3>
              <button onClick={() => setShowCancelOpenHouseModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {cancelOpenHouseError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{cancelOpenHouseError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">Reason for cancellation * <span className="text-gray-400 font-normal">(min 5 chars)</span></label>
              <textarea
                value={cancelOpenHouseForm.reason}
                onChange={(e) => setCancelOpenHouseForm({ reason: e.target.value })}
                rows={3}
                placeholder="Provide a reason — registered attendees will be notified by email…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCancelOpenHouseModal(false)}>Back</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isCancellingOpenHouse || cancelOpenHouseForm.reason.trim().length < 5}
                onClick={() => void handleCancelOpenHouse()}
              >
                {isCancellingOpenHouse ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Cancellation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reschedule Open House Modal */}
      {showRescheduleOpenHouseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-700">Reschedule Open House</h3>
              <button onClick={() => setShowRescheduleOpenHouseModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {rescheduleOpenHouseError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{rescheduleOpenHouseError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">New start date &amp; time *</label>
                <input
                  type="datetime-local"
                  value={rescheduleOpenHouseForm.scheduledAt}
                  onChange={(e) => setRescheduleOpenHouseForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  title="New open house start date and time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">New end date &amp; time *</label>
                <input
                  type="datetime-local"
                  value={rescheduleOpenHouseForm.endAt}
                  onChange={(e) => setRescheduleOpenHouseForm((f) => ({ ...f, endAt: e.target.value }))}
                  title="New open house end date and time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={rescheduleOpenHouseForm.reason ?? ''}
                  onChange={(e) => setRescheduleOpenHouseForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={2}
                  placeholder="Registered attendees will be notified with the new time…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowRescheduleOpenHouseModal(false)}>Cancel</Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isReschedulingOpenHouse || !rescheduleOpenHouseForm.scheduledAt || !rescheduleOpenHouseForm.endAt}
                onClick={() => void handleRescheduleOpenHouse()}
              >
                {isReschedulingOpenHouse ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Reschedule
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Initiate Sale Modal (own listing only) */}
      {showInitiateSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold">Initiate Sale</h2>
                <p className="text-sm text-gray-500 truncate max-w-xs">{property.title}</p>
              </div>
              <button onClick={() => setShowInitiateSaleModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleInitiateSaleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Price *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={initiateSaleAgreedPrice}
                    onChange={e => setInitiateSaleAgreedPrice(e.target.value)}
                    required
                    placeholder="e.g. 1500000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                  <select
                    value={initiateSaleCurrency}
                    onChange={e => setInitiateSaleCurrency(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
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
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={initiateSaleDeposit}
                  onChange={e => setInitiateSaleDeposit(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seller ID *</label>
                <input
                  type="text"
                  value={initiateSaleSellerId}
                  onChange={e => setInitiateSaleSellerId(e.target.value)}
                  required
                  placeholder="Seller's user UUID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer ID <span className="text-gray-400">(optional — add later)</span></label>
                <input
                  type="text"
                  value={initiateSaleBuyerId}
                  onChange={e => setInitiateSaleBuyerId(e.target.value)}
                  placeholder="Buyer's user UUID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {initiateSaleError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{initiateSaleError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowInitiateSaleModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600" disabled={submittingInitiateSale}>
                  {submittingInitiateSale ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submittingInitiateSale ? 'Creating…' : 'Initiate Sale'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  {currentUser && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      Pre-filled from your profile — edit if needed.
                    </div>
                  )}
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