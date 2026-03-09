'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/lib/router-compat";
import {
  TrendingUp, Eye,
  MessageSquare, Plus,
  Home, DollarSign, Users,
  Heart, Building2, HardHat, ShoppingBag,
  MapPin, Bed, Bath, ArrowRight,
  Package, AlertTriangle, Copy,
  Calendar, CheckCircle, Clock, ChevronDown, ChevronUp, UserCircle, Bell, X, Loader2, AlertCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAccessToken, getIsAdminFromToken, getActiveCompanyContext } from "@/lib/auth-session";
import { propertiesApi, auditApi, usersApi, sellerApi, viewingsApi, notificationsApi, type PropertyListing, type AuditLogEntry, type AuthUser, type SellerProperty, type SellerPropertyViewing, type ViewingResponse, type CancelViewingPayload, type UserNotification } from "@/lib/api-client";
import { CreateListing } from "@/components/CreateListing";
import { EditListing } from "@/components/EditListing";

type DashboardListing = {
  id: string;
  title: string;
  listingType: 'for_sale' | 'to_rent' | 'development' | null;
  image: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqm: number;
  views: number;
  inquiries: number;
  offers: number;
  status: string;
  daysOnMarket: number;
};

const DEFAULT_LISTING_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop";

function formatMoney(price: string, currency: string): string {
  const value = Number(price);
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency || "ZAR",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function mapPropertyToDashboardListing(property: PropertyListing): DashboardListing {
  const city = property.location?.city ?? "";
  const region = property.location?.region ?? "";
  const address = [city, region].filter(Boolean).join(", ") || "Address unavailable";
  const primaryImage = property.media?.find((media) => media.is_primary)?.url;
  const createdAt = new Date(property.created_at).getTime();
  const daysOnMarket = Math.max(0, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));

  return {
    id: property.id,
    title: property.title,
    listingType: property.listing_type ?? null,
    image: primaryImage || DEFAULT_LISTING_IMAGE,
    price: formatMoney(property.price, property.currency),
    address,
    beds: property.bedrooms ?? 0,
    baths: property.bathrooms ?? 0,
    sqm: property.area_sqm ? Number(property.area_sqm) : 0,
    views: 0,
    inquiries: 0,
    offers: 0,
    status: property.status,
    daysOnMarket,
  };
}

export default function MyDashboard() {
  const router = useRouter();

  // Company admins and company agents should not land on this personal dashboard.
  useEffect(() => {
    const activeCompany = getActiveCompanyContext();
    const isAdmin =
      getIsAdminFromToken() ||
      (activeCompany?.slug !== 'self' && (activeCompany?.is_admin ?? false));
    if (isAdmin) {
      router.replace('/company/dashboard');
      return;
    }
    const isCompanyAgent =
      activeCompany?.slug !== 'self' &&
      activeCompany != null &&
      activeCompany.role?.toLowerCase() === 'agent';
    if (isCompanyAgent) {
      router.replace('/app/agent');
    }
  }, [router]);
  const [selectedTab, setSelectedTab] = useState<"overview" | "analytics" | "listings" | "favourites" | "my-properties" | "my-projects" | "my-orders" | "my-viewings">("overview");
  const [activeListings, setActiveListings] = useState<DashboardListing[]>([]);
  const [rawListings, setRawListings] = useState<PropertyListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingError, setListingError] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState<"all" | "draft" | "active" | "under_offer" | "sold" | "withdrawn">("all");
  const [showAddListing, setShowAddListing] = useState(false);
  const [editingListing, setEditingListing] = useState<PropertyListing | null>(null);
  const [duplicatingIds, setDuplicatingIds] = useState<Set<string>>(new Set());
  const [duplicateError, setDuplicateError] = useState("");

  // Favourites state
  const [savedProperties, setSavedProperties] = useState<PropertyListing[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedError, setSavedError] = useState("");
  const [removingSavedIds, setRemovingSavedIds] = useState<Set<string>>(new Set());
  // Total listing count returned by the API (unfiltered, all statuses)
  const [totalListings, setTotalListings] = useState(0);

  // Saved/favourite properties count (overview card)
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Seller / my-properties state
  const [sellerProperties, setSellerProperties] = useState<SellerProperty[]>([]);
  const [isLoadingSellerProperties, setIsLoadingSellerProperties] = useState(false);
  const [sellerPropertiesError, setSellerPropertiesError] = useState("");
  const [expandedSellerPropertyId, setExpandedSellerPropertyId] = useState<string | null>(null);
  const [sellerPropertyViewings, setSellerPropertyViewings] = useState<Record<string, SellerPropertyViewing[]>>({});
  const [isLoadingViewingsFor, setIsLoadingViewingsFor] = useState<string | null>(null);

  // Buyer viewings state
  const [myViewings, setMyViewings] = useState<ViewingResponse[]>([]);
  const [isLoadingMyViewings, setIsLoadingMyViewings] = useState(false);
  const [myViewingsError, setMyViewingsError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingViewingId, setCancellingViewingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Status counts derived from the full (unfiltered) listing set
  const listingsByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    activeListings.forEach((l) => {
      counts[l.status] = (counts[l.status] ?? 0) + 1;
    });
    return counts;
  }, [activeListings]);

  // User profile
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Recent activity
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  // Listing status breakdown — real data derived from owner listings
  const listingStatusData = useMemo(() => [
    { status: "Active", count: listingsByStatus["active"] ?? 0 },
    { status: "Draft", count: listingsByStatus["draft"] ?? 0 },
    { status: "Under Offer", count: listingsByStatus["under_offer"] ?? 0 },
    { status: "Sold", count: listingsByStatus["sold"] ?? 0 },
    { status: "Withdrawn", count: listingsByStatus["withdrawn"] ?? 0 },
  ].filter(d => d.count > 0), [listingsByStatus]);

  // Listing value per property (top 5) — real portfolio data
  const listingValueData = useMemo(() =>
    activeListings.slice(0, 5).map((l) => ({
      name: l.address.length > 14 ? `${l.address.slice(0, 14)}…` : l.address,
      value: Number(l.price.replace(/[^\d]/g, "")),
      status: l.status,
    })),
    [activeListings],
  );

  const handleDuplicateListing = async (listingId: string) => {
    const token = getAccessToken();
    if (!token || duplicatingIds.has(listingId)) return;

    const raw = rawListings.find((r) => r.id === listingId);
    if (!raw) return;

    setDuplicatingIds((prev) => new Set(prev).add(listingId));
    setDuplicateError("");
    try {
      const loc = raw.location;
      const created = await propertiesApi.create(token, {
        title: `${raw.title} (Duplicate)`,
        description: raw.description ?? undefined,
        property_type: raw.property_type,
        listingType: raw.listing_type ?? undefined,
        price: Number(raw.price),
        currency: raw.currency,
        bedrooms: raw.bedrooms ?? undefined,
        bathrooms: raw.bathrooms ?? undefined,
        parking_spaces: raw.parking_spaces ?? undefined,
        area_sqm: raw.area_sqm != null ? Number(raw.area_sqm) : undefined,
        features: raw.features ?? undefined,
        ...(loc ? {
          location: {
            address_line1: loc.address_line1 ?? undefined,
            city: loc.city ?? undefined,
            region: loc.region ?? undefined,
            country: loc.country,
            postal_code: loc.postal_code ?? undefined,
            latitude: loc.latitude != null ? Number(loc.latitude) : undefined,
            longitude: loc.longitude != null ? Number(loc.longitude) : undefined,
          },
        } : {}),
      });

      // Copy media — fetch each file as a blob and re-upload
      if (raw.media && raw.media.length > 0) {
        for (const mediaItem of raw.media) {
          try {
            const res = await fetch(mediaItem.url);
            const blob = await res.blob();
            const ext = mediaItem.url.split('.').pop()?.split('?')[0] ?? 'jpg';
            const file = new File([blob], `media.${ext}`, { type: blob.type || 'image/jpeg' });
            const formData = new FormData();
            formData.append('file', file);
            await propertiesApi.addMedia(token, created.id, formData);
          } catch {
            // skip individual media failures
          }
        }
      }

      await loadMyListings(listingStatusFilter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate listing";
      setDuplicateError(msg);
    } finally {
      setDuplicatingIds((prev) => { const next = new Set(prev); next.delete(listingId); return next; });
    }
  };

  const loadMyListings = async (statusFilter = "all") => {
    const token = getAccessToken();
    if (!token) {
      setActiveListings([]);
      setListingError("Please log in to view your listings.");
      setIsLoadingListings(false);
      return;
    }

    setIsLoadingListings(true);
    setListingError("");

    try {
      const result = await propertiesApi.getOwnerListings(token, statusFilter);
      setRawListings(result.data);
      setActiveListings(result.data.map(mapPropertyToDashboardListing));
      setTotalListings(result.total);
    } catch {
      setActiveListings([]);
      setRawListings([]);
      setTotalListings(0);
      setListingError("Unable to load your listings.");
    } finally {
      setIsLoadingListings(false);
    }
  };

  useEffect(() => {
    void loadUserProfile();
    void loadRecentActivity();
    void loadSavedCount();
    // Load notifications
    const token = getAccessToken();
    if (token) notificationsApi.getAll(token).then(setNotifications).catch(() => undefined);
  }, []);

  useEffect(() => {
    void loadMyListings(listingStatusFilter);
  }, [listingStatusFilter]);

  const loadSavedProperties = async () => {
    const token = getAccessToken();
    if (!token) {
      setSavedError("Please log in to view your saved properties.");
      return;
    }
    setIsLoadingSaved(true);
    setSavedError("");
    try {
      const result = await propertiesApi.getSavedProperties(token);
      setSavedProperties(result.data);
      setSavedCount(result.total);
    } catch {
      setSavedError("Unable to load saved properties.");
    } finally {
      setIsLoadingSaved(false);
    }
  };

  /** Lightweight count-only fetch for the overview stats card. */
  const loadSavedCount = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const result = await propertiesApi.getSavedProperties(token);
      setSavedCount(result.total);
    } catch {
      // silently ignore — card shows placeholder
    }
  };

  const handleRemoveFavourite = async (propertyId: string) => {
    const token = getAccessToken();
    if (!token || removingSavedIds.has(propertyId)) return;
    setRemovingSavedIds((prev) => new Set(prev).add(propertyId));
    try {
      await propertiesApi.unsave(token, propertyId);
      setSavedProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch {
      // silently ignore
    } finally {
      setRemovingSavedIds((prev) => { const next = new Set(prev); next.delete(propertyId); return next; });
    }
  };

  const loadUserProfile = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const user = await usersApi.me(token);
      setCurrentUser(user);
    } catch {
      // silently ignore — header will just show generic greeting
    }
  };

  const loadRecentActivity = async () => {
    const token = getAccessToken();
    if (!token) {
      setIsLoadingActivity(false);
      return;
    }
    setIsLoadingActivity(true);
    try {
      const logs = await auditApi.getMyLogs(token, 8);
      setRecentActivity(logs.filter((l) => l.action?.toLowerCase() !== 'refresh_token'));
    } catch {
      setRecentActivity([]);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (selectedTab === "favourites") {
      void loadSavedProperties();
    }
    if (selectedTab === "my-properties") {
      void loadSellerProperties();
    }
    if (selectedTab === "my-viewings") {
      void loadMyViewings();
    }
  }, [selectedTab]);

  const loadMyViewings = async () => {
    const token = getAccessToken();
    if (!token) return;
    setIsLoadingMyViewings(true);
    setMyViewingsError("");
    try {
      const data = await viewingsApi.getMyViewings(token);
      setMyViewings(data);
    } catch {
      setMyViewingsError("Unable to load your viewings.");
    } finally {
      setIsLoadingMyViewings(false);
    }
  };

  const handleCancelMyViewing = async () => {
    const token = getAccessToken();
    if (!token || !cancellingViewingId || cancelReason.trim().length < 5) return;
    setIsCancelling(true);
    setCancelError("");
    try {
      await viewingsApi.cancel(token, cancellingViewingId, { reason: cancelReason } as CancelViewingPayload);
      setMyViewings((prev) =>
        prev.map((v) => v.id === cancellingViewingId ? { ...v, status: 'cancelled', cancel_reason: cancelReason, cancelled_by: 'buyer' } : v)
      );
      setShowCancelModal(false);
      setCancellingViewingId(null);
      setCancelReason("");
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel viewing.");
    } finally {
      setIsCancelling(false);
    }
  };

  const loadSellerProperties = async () => {
    const token = getAccessToken();
    if (!token) {
      setSellerPropertiesError("Please log in to view your properties.");
      return;
    }
    setIsLoadingSellerProperties(true);
    setSellerPropertiesError("");
    try {
      const data = await sellerApi.getMyProperties(token);
      setSellerProperties(data);
    } catch {
      setSellerPropertiesError("Unable to load your properties.");
    } finally {
      setIsLoadingSellerProperties(false);
    }
  };

  const toggleSellerPropertyViewings = async (propertyId: string) => {
    if (expandedSellerPropertyId === propertyId) {
      setExpandedSellerPropertyId(null);
      return;
    }
    setExpandedSellerPropertyId(propertyId);
    if (sellerPropertyViewings[propertyId]) return; // already loaded
    const token = getAccessToken();
    if (!token) return;
    setIsLoadingViewingsFor(propertyId);
    try {
      const viewings = await sellerApi.getPropertyViewings(token, propertyId);
      setSellerPropertyViewings((prev) => ({ ...prev, [propertyId]: viewings }));
    } catch {
      setSellerPropertyViewings((prev) => ({ ...prev, [propertyId]: [] }));
    } finally {
      setIsLoadingViewingsFor(null);
    }
  };

  const totalPortfolioValue = useMemo(
    () => activeListings.reduce((sum, listing) => sum + Number(listing.price.replace(/[^\d]/g, "")), 0),
    [activeListings],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">My Dashboard</h1>
            <p className="text-gray-600">Welcome back{currentUser ? `, ${currentUser.firstName}` : ""}</p>
          </div>
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications((p) => !p);
                if (!showNotifications && unreadCount > 0) {
                  const token = getAccessToken();
                  if (token) notificationsApi.markAllRead(token).then(() => setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))).catch(() => undefined);
                }
              }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-sm">Notifications</p>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div key={n.id} className={`px-4 py-3 text-sm ${n.read_at ? "text-gray-500" : "text-gray-800 bg-blue-50/40"}`}>
                        <p className="font-medium">{n.title}</p>
                        <p className="text-xs mt-0.5 text-gray-500">{n.body}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto">
          <button
            onClick={() => setSelectedTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "overview"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab("listings")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "listings"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => setSelectedTab("favourites")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "favourites"
                ? "bg-red-100 text-red-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Favourite Properties
          </button>
          <button
            onClick={() => setSelectedTab("my-properties")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "my-properties"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            My Properties
          </button>
          <button
            onClick={() => setSelectedTab("my-projects")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "my-projects"
                ? "bg-amber-100 text-amber-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            My Projects
          </button>
          <button
            onClick={() => setSelectedTab("my-orders")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "my-orders"
                ? "bg-purple-100 text-purple-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setSelectedTab("my-viewings")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "my-viewings"
                ? "bg-green-100 text-green-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            My Viewings
          </button>
          <button
            onClick={() => setSelectedTab("analytics")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "analytics"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Listings</div>
                    <div className="text-3xl font-bold">{activeListings.length}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      Live from database
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Saved Properties</div>
                    <div className="text-3xl font-bold">{savedCount ?? (isLoadingListings ? "…" : 0)}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      Properties you've favourited
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Under Offer</div>
                    <div className="text-3xl font-bold">{listingsByStatus["under_offer"] ?? 0}</div>
                    <div className="text-xs text-yellow-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      Listings under offer
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Value</div>
                    <div className="text-3xl font-bold">{formatMoney(String(totalPortfolioValue), 'ZAR')}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      Portfolio from database
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Listings by Status — real data */}
            <Card className="p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4">My Listings by Status</h3>
              {listingStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={listingStatusData} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Listings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <Home className="w-10 h-10 mb-2 opacity-25" />
                  <p className="text-sm">{isLoadingListings ? "Loading listings…" : "No listings yet — create your first listing to see data here"}</p>
                </div>
              )}
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
              {isLoadingActivity && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!isLoadingActivity && recentActivity.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No recent activity yet.</p>
                </div>
              )}
              {!isLoadingActivity && recentActivity.length > 0 && (
                <div className="space-y-4">
                  {recentActivity.map((entry) => {
                    const rt = entry.resourceType?.toLowerCase() ?? "";
                    const act = entry.action?.toLowerCase() ?? "";
                    let IconComp = Eye;
                    let color = "gray";
                    let label = entry.action;
                    if (rt === "property" && act.includes("create")) { IconComp = Building2; color = "blue"; label = "Created a new property listing"; }
                    else if (rt === "property" && act.includes("update")) { IconComp = Building2; color = "blue"; label = "Updated a property listing"; }
                    else if (rt === "property" && act.includes("save")) { IconComp = Heart; color = "red"; label = "Saved a property to favourites"; }
                    else if (rt === "property" && act.includes("unsave")) { IconComp = Heart; color = "gray"; label = "Removed a property from favourites"; }
                    else if (rt === "inquiry") { IconComp = MessageSquare; color = "purple"; label = "Inquiry submitted on a property"; }
                    else if (rt === "user" || act.includes("login")) { IconComp = Users; color = "green"; label = act.includes("login") ? "Signed in to your account" : "Profile updated"; }
                    else if (rt === "project" || rt === "construction") { IconComp = HardHat; color = "amber"; label = act.includes("create") ? "Created a construction project" : "Construction project updated"; }
                    else if (rt === "order" || act.includes("order")) { IconComp = ShoppingBag; color = "purple"; label = act.includes("create") ? "Order placed" : "Order updated"; }
                    else if (rt === "fraud_report" || rt === "fraud") { IconComp = AlertTriangle; color = "red"; label = "Fraud report submitted"; }
                    else if (rt === "rfq" || rt === "quote") { IconComp = Package; color = "green"; label = "RFQ submitted to supplier"; }
                    else if (rt === "sales" || rt === "purchase" || rt === "purchase_stage") { IconComp = Home; color = "blue"; label = act.includes("create") ? "Purchase case opened" : "Purchase stage updated"; }
                    else if (rt === "service_provider" || rt === "bookmark") { IconComp = Users; color = "indigo"; label = "Service provider bookmarked"; }
                    const relDate = new Date(entry.createdAt);
                    const diffMs = Date.now() - relDate.getTime();
                    const diffMin = Math.floor(diffMs / 60000);
                    const diffHr = Math.floor(diffMin / 60);
                    const diffDay = Math.floor(diffHr / 24);
                    const timeAgo = diffDay > 0 ? `${diffDay}d ago` : diffHr > 0 ? `${diffHr}h ago` : diffMin > 1 ? `${diffMin}m ago` : "just now";
                    return (
                      <div key={entry.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0">
                        <div className={`w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center shrink-0`}>
                          <IconComp className={`w-5 h-5 text-${color}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{label}</div>
                          <div className="text-xs text-gray-500">{timeAgo}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Analytics Tab */}
        {selectedTab === "analytics" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Listings by Status */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Listings by Status</h3>
                {listingStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={listingStatusData} barCategoryGap="40%">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Listings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-72 flex flex-col items-center justify-center text-gray-400">
                    <Home className="w-10 h-10 mb-2 opacity-25" />
                    <p className="text-sm">{isLoadingListings ? "Loading…" : "No listings yet"}</p>
                  </div>
                )}
              </Card>

              {/* Listing Value Breakdown */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Top Listing Values (ZAR)</h3>
                {listingValueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={listingValueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v: number) => `R${(v / 1_000_000).toFixed(1)}M`} />
                      <Tooltip formatter={(v: number) => [`R${v.toLocaleString()}`, "Value"]} />
                      <Bar dataKey="value" name="Value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-72 flex flex-col items-center justify-center text-gray-400">
                    <DollarSign className="w-10 h-10 mb-2 opacity-25" />
                    <p className="text-sm">{isLoadingListings ? "Loading…" : "No listings yet"}</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Portfolio Summary */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Portfolio Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{activeListings.length}</div>
                  <div className="text-sm text-gray-600">Total Listings</div>
                  <div className="text-xs text-green-600 mt-1">Live from database</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">{listingsByStatus["active"] ?? 0}</div>
                  <div className="text-sm text-gray-600">Active Listings</div>
                  <div className="text-xs text-green-600 mt-1">Live from database</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-500 mb-1">{savedCount ?? 0}</div>
                  <div className="text-sm text-gray-600">Saved Properties</div>
                  <div className="text-xs text-green-600 mt-1">Live from database</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1 truncate">{formatMoney(String(totalPortfolioValue), 'ZAR')}</div>
                  <div className="text-sm text-gray-600">Total Portfolio Value</div>
                  <div className="text-xs text-green-600 mt-1">Derived from listings</div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Listings Tab */}
        {selectedTab === "listings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">My Listings</h2>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
                onClick={() => setShowAddListing(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> New Listing
              </Button>
            </div>

            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2">
              {(["all", "active", "draft", "under_offer", "sold", "withdrawn"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setListingStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    listingStatusFilter === s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "all" ? "All" : s === "under_offer" ? "Under Offer" : s.charAt(0).toUpperCase() + s.slice(1)}
                  {s !== "all" && listingsByStatus[s] ? (
                    <span className="ml-1.5 text-xs opacity-75">
                      ({listingsByStatus[s]})
                    </span>
                  ) : null}
                  {s === "all" && (
                    <span className="ml-1.5 text-xs opacity-75">
                      ({totalListings || activeListings.length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isLoadingListings && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Loading listings from database...
              </div>
            )}

            {!isLoadingListings && listingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {listingError}
              </div>
            )}

            {duplicateError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
                <span>Duplicate failed: {duplicateError}</span>
                <button onClick={() => setDuplicateError("")} className="ml-4 text-red-500 hover:text-red-700 font-bold">✕</button>
              </div>
            )}

            <Card className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Property</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Performance</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!isLoadingListings && activeListings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-400 mb-3">
                          <Home className="w-10 h-10 mx-auto opacity-25 mb-2" />
                          <p className="text-sm font-medium text-gray-500">
                            {listingStatusFilter === "all"
                              ? "No listings yet"
                              : `No ${listingStatusFilter === "under_offer" ? "under offer" : listingStatusFilter} listings`}
                          </p>
                          <p className="text-xs text-gray-400 mb-4">
                            {listingStatusFilter === "draft"
                              ? "Drafts you save will appear here"
                              : listingStatusFilter === "all"
                              ? "Create your first listing to start attracting buyers"
                              : "Nothing in this status yet"}
                          </p>
                        </div>
                        {listingStatusFilter === "all" && (
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setShowAddListing(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Create First Listing
                          </Button>
                        )}
                      </td>
                    </tr>
                  )}
                  {activeListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0 w-16 h-12">
                            <img 
                              src={listing.image} 
                              alt={listing.title}
                              className="w-full h-full object-cover rounded"
                            />
                            {listing.listingType && (
                              <span className={`absolute bottom-0 left-0 right-0 text-center text-[9px] font-semibold px-1 py-0.5 rounded-b leading-tight ${
                                listing.listingType === 'for_sale' ? 'bg-blue-600 text-white' :
                                listing.listingType === 'to_rent' ? 'bg-purple-600 text-white' :
                                'bg-amber-500 text-white'
                              }`}>
                                {listing.listingType === 'for_sale' ? 'For Sale' :
                                 listing.listingType === 'to_rent' ? 'To Rent' : 'Development'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{listing.title}</div>
                            <div className="text-xs text-gray-400 truncate mt-0.5">{listing.address}</div>
                            <div className="text-xs text-gray-400">{listing.daysOnMarket} days on market</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600">{listing.price}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {listing.beds} bed • {listing.baths} bath • {listing.sqm} m²
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3 h-3 text-gray-400" />
                            <span>{listing.views} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3 h-3 text-gray-400" />
                            <span>{listing.inquiries} inquiries</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            <span>{listing.offers} offers</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={
                          listing.status === "active" ? "bg-green-100 text-green-700" :
                          listing.status === "draft" ? "bg-gray-100 text-gray-600" :
                          listing.status === "under_offer" ? "bg-yellow-100 text-yellow-700" :
                          listing.status === "sold" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-600"
                        }>
                          {listing.status === "under_offer" ? "Under Offer" : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/app/property/${listing.id}`}>View</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const raw = rawListings.find((r) => r.id === listing.id);
                              if (raw) setEditingListing(raw);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={duplicatingIds.has(listing.id)}
                            onClick={() => { void handleDuplicateListing(listing.id); }}
                            title="Duplicate as draft"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            {duplicatingIds.has(listing.id) ? "Copying…" : "Duplicate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>

      {/* Favourite Properties Tab */}
      {selectedTab === "favourites" && (
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Favourite Properties</h2>
            <Link to="/app/listings" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Browse Properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingSaved && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Loading your saved properties...
            </div>
          )}

          {!isLoadingSaved && savedError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {savedError}
            </div>
          )}

          {!isLoadingSaved && !savedError && savedProperties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((property) => {
                const primaryImage = property.media?.find((m) => m.is_primary)?.url ?? property.media?.[0]?.url ?? DEFAULT_LISTING_IMAGE;
                const city = property.location?.city ?? "";
                const region = property.location?.region ?? "";
                const address = [city, region].filter(Boolean).join(", ") || "Address unavailable";
                const price = formatMoney(property.price, property.currency);
                const typeLabel = property.property_type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
                const isRemoving = removingSavedIds.has(property.id);
                return (
                  <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img src={primaryImage} alt={address} className="w-full h-48 object-cover" />
                      <button
                        onClick={() => { void handleRemoveFavourite(property.id); }}
                        disabled={isRemoving}
                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Remove from favourites"
                      >
                        <Heart className={`w-4 h-4 ${isRemoving ? "text-gray-300" : "text-red-500 fill-red-500"}`} />
                      </button>
                      <Badge className="absolute top-3 left-3 bg-white text-gray-700 text-xs">{typeLabel}</Badge>
                    </div>
                    <div className="p-4">
                      <div className="font-bold text-blue-600 text-lg mb-1">{price}</div>
                      <div className="font-medium text-sm mb-1 truncate">{property.title}</div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{address}</span>
                      </div>
                      {((property.bedrooms ?? 0) > 0) && (
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {property.bedrooms} bed</span>
                          <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.bathrooms} bath</span>
                          {property.area_sqm && <span>{Number(property.area_sqm)} m²</span>}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/app/property/${property.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoadingSaved && !savedError && savedProperties.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="font-medium text-gray-500 mb-1">No saved properties yet</p>
              <p className="text-sm mb-4">Save properties you like by clicking the heart icon on listings</p>
              <Button asChild variant="outline">
                <Link to="/app/listings">Browse Properties</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* My Properties Tab — Seller view */}
      {selectedTab === "my-properties" && (
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Properties</h2>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" size="sm" onClick={() => setShowAddListing(true)}>
              <Plus className="w-4 h-4 mr-2" /> List a Property
            </Button>
          </div>

          {isLoadingSellerProperties && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Loading your properties…
            </div>
          )}

          {!isLoadingSellerProperties && sellerPropertiesError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {sellerPropertiesError}
            </div>
          )}

          {!isLoadingSellerProperties && !sellerPropertiesError && sellerProperties.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="font-medium text-gray-500 mb-1">No listed properties yet</p>
              <p className="text-sm mb-4">Properties you list for sale or rent will appear here with full activity tracking</p>
              <Button variant="outline" onClick={() => setShowAddListing(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Your First Listing
              </Button>
            </div>
          )}

          {!isLoadingSellerProperties && sellerProperties.map((prop) => {
            const isExpanded = expandedSellerPropertyId === prop.id;
            const viewings = sellerPropertyViewings[prop.id] ?? [];
            const isLoadingV = isLoadingViewingsFor === prop.id;
            const agentName = prop.agent_first_name
              ? `${prop.agent_first_name} ${prop.agent_last_name ?? ""}`.trim()
              : null;

            return (
              <Card key={prop.id} className="overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-20 h-16 rounded overflow-hidden bg-gray-100">
                      <img
                        src={prop.media_url ?? "/placeholder-property.jpg"}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{prop.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {[prop.suburb, prop.city].filter(Boolean).join(", ") || "Location unavailable"}
                          </div>
                          {prop.listing_reference && (
                            <div className="text-xs text-gray-400 mt-0.5">Ref: {prop.listing_reference}</div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-bold text-blue-600 text-sm">
                            {new Intl.NumberFormat("en-ZA", { style: "currency", currency: prop.currency ?? "ZAR", maximumFractionDigits: 0 }).format(Number(prop.price))}
                          </div>
                          <Badge className={`mt-1 text-xs ${
                            prop.status === "active" ? "bg-green-100 text-green-700" :
                            prop.status === "draft" ? "bg-gray-100 text-gray-600" :
                            prop.status === "under_offer" ? "bg-yellow-100 text-yellow-700" :
                            prop.status === "sold" ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-600"
                          }`}>
                            {prop.status === "under_offer" ? "Under Offer" : (prop.status.charAt(0).toUpperCase() + prop.status.slice(1))}
                          </Badge>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <span>{prop.completed_viewings} completed viewings</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>{prop.upcoming_viewings} upcoming viewings</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                          <span>{prop.total_inquiries} inquiries</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Heart className="w-3.5 h-3.5 text-pink-400" />
                          <span>{prop.save_count} saves</span>
                        </div>
                      </div>

                      {/* Mandate + agent info */}
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {prop.mandate_type && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            prop.mandate_status === "active" ? "bg-green-50 text-green-700 border border-green-200" :
                            "bg-gray-50 text-gray-600 border border-gray-200"
                          }`}>
                            {prop.mandate_type === "sole" ? "Sole Mandate" : "Open Mandate"}
                            {prop.mandate_expiry && (
                              <span className="text-gray-400 font-normal"> · expires {new Date(prop.mandate_expiry).toLocaleDateString()}</span>
                            )}
                          </span>
                        )}
                        {agentName && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <UserCircle className="w-3.5 h-3.5" /> Agent: {agentName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/app/property/${prop.id}`}>View Listing</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { void toggleSellerPropertyViewings(prop.id); }}
                        className="flex items-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Viewings
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded viewings panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Viewing Schedule
                    </h4>
                    {isLoadingV && (
                      <p className="text-sm text-gray-500">Loading viewings…</p>
                    )}
                    {!isLoadingV && viewings.length === 0 && (
                      <p className="text-sm text-gray-400">No viewings booked for this property yet.</p>
                    )}
                    {!isLoadingV && viewings.length > 0 && (
                      <div className="space-y-2">
                        {viewings.map((v) => {
                          const buyerName = v.buyer_first_name
                            ? `${v.buyer_first_name} ${v.buyer_last_name ?? ""}`.trim()
                            : "Unknown buyer";
                          const agentNameV = v.agent_first_name
                            ? `${v.agent_first_name} ${v.agent_last_name ?? ""}`.trim()
                            : null;
                          return (
                            <div key={v.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-gray-100 shadow-sm">
                              <div>
                                <div className="text-sm font-medium">{buyerName}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(v.scheduled_at).toLocaleString()} ·{" "}
                                  {v.viewing_type === "in_person" ? "In-Person" : "Virtual"}
                                  {agentNameV && <span> · Agent: {agentNameV}</span>}
                                </div>
                              </div>
                              <Badge className={`text-xs ${
                                v.status === "completed" ? "bg-green-100 text-green-700" :
                                v.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                                v.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* My Projects Tab */}
      {selectedTab === "my-projects" && (
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Projects</h2>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" size="sm" asChild>
              <Link to="/app/construction">
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Link>
            </Button>
          </div>
          {/* Sprint 6: construction project list endpoint not yet connected */}
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span className="font-medium">Coming in Sprint 6 —</span> Your construction projects will be listed here once the project management API is connected.
          </div>
          <Card className="text-center py-16 text-gray-400">
            <HardHat className="w-12 h-12 mx-auto mb-3 opacity-25" />
            <p className="font-medium text-gray-500 mb-1">No projects yet</p>
            <p className="text-sm mb-4">Create your first construction project to track progress, milestones and budgets</p>
            <Button asChild variant="outline">
              <Link to="/app/construction">Open Construction Manager</Link>
            </Button>
          </Card>
        </div>
      )}

      {/* My Orders Tab */}
      {selectedTab === "my-orders" && (
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Orders</h2>
            <Button className="bg-purple-500 hover:bg-purple-600 text-white" size="sm" asChild>
              <Link to="/app/contractor-supplier-marketplace">
                <ShoppingBag className="w-4 h-4 mr-2" /> Browse Suppliers
              </Link>
            </Button>
          </div>
          {/* Sprint 7: supplier order API not yet available */}
          <div className="rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-700">
            <span className="font-medium">Coming in Sprint 7 —</span> Your supplier orders will appear here once the marketplace order API is available.
          </div>
          <Card className="text-center py-16 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-25" />
            <p className="font-medium text-gray-500 mb-1">No orders yet</p>
            <p className="text-sm mb-4">Orders placed through the supplier marketplace will be tracked here</p>
            <Button asChild variant="outline">
              <Link to="/app/contractor-supplier-marketplace">Browse Suppliers</Link>
            </Button>
          </Card>
        </div>
      )}

      {/* My Viewings Tab */}
      {selectedTab === "my-viewings" && (
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">My Viewings</h2>
          </div>

          {myViewingsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{myViewingsError}
            </div>
          )}

          {isLoadingMyViewings ? (
            <Card className="py-12 text-center text-gray-400">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
              <p className="text-sm">Loading your viewings…</p>
            </Card>
          ) : myViewings.length === 0 ? (
            <Card className="text-center py-16 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="font-medium text-gray-500 mb-1">No viewings scheduled</p>
              <p className="text-sm">Property viewings you book will appear here</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {myViewings.map((v) => {
                const isPast = new Date(v.scheduled_at) < new Date();
                return (
                  <Card key={v.id} className={`p-4 flex items-start gap-4 ${isPast ? "opacity-70" : ""}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPast ? "bg-gray-100" : "bg-green-100"}`}>
                      <Calendar className={`w-5 h-5 ${isPast ? "text-gray-500" : "text-green-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{v.property_title ?? "Property"}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(v.scheduled_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                        <span className="capitalize">{v.viewing_type?.replace("_", " ") ?? "in person"}</span>
                      </div>
                      {v.cancel_reason && (
                        <p className="text-xs text-red-500 mt-1">Cancellation reason: {v.cancel_reason}</p>
                      )}
                      {(v.status === 'requested' || v.status === 'confirmed') && !isPast && (
                        <div className="mt-2">
                          <button
                            className="text-xs text-red-500 hover:text-red-700 underline"
                            onClick={() => { setCancellingViewingId(v.id); setCancelReason(""); setCancelError(""); setShowCancelModal(true); }}
                          >
                            Cancel this viewing
                          </button>
                        </div>
                      )}
                    </div>
                    <Badge className={
                      v.status === "confirmed" ? "bg-green-100 text-green-700" :
                      v.status === "completed" ? "bg-blue-100 text-blue-700" :
                      v.status === "cancelled" ? "bg-red-100 text-red-700" :
                      v.status === "declined" ? "bg-orange-100 text-orange-700" :
                      "bg-yellow-100 text-yellow-700"
                    }>
                      {v.status}
                    </Badge>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cancel Viewing Modal (buyer) */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-700">Cancel Viewing</h3>
              <button onClick={() => setShowCancelModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {cancelError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{cancelError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">Reason for cancellation * <span className="text-gray-400 font-normal">(min 5 chars)</span></label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason for cancelling this viewing…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>Back</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isCancelling || cancelReason.trim().length < 5}
                onClick={() => void handleCancelMyViewing()}
              >
                {isCancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Cancellation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Listing Modal */}
      {showAddListing && (
        <CreateListing
          onClose={() => {
            setShowAddListing(false);
            void loadMyListings(listingStatusFilter);
          }}
        />
      )}

      {editingListing && (
        <EditListing
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSuccess={() => {
            setEditingListing(null);
            void loadMyListings(listingStatusFilter);
          }}
        />
      )}

    </div>
  );
}
