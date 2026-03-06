'use client';

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  TrendingUp, Eye,
  MessageSquare, Plus,
  Home, DollarSign, Copy,
  Calendar, Clock, Loader2, CheckCircle2, XCircle, X, Activity, Users,
  ChevronLeft, ChevronRight, List as ListIcon, FileText, PenLine, BarChart3, AlertCircle
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateListing } from "@/components/CreateListing";
import { getAccessToken, getSessionClaims, getStoredUser } from "@/lib/auth-session";
import { propertiesApi, agentApi, viewingActionsApi, type AgentDashboardResponse, type PropertyListing, type ViewingResponse, type CreateOpenHousePayload, type OpenHouseRecord, type CommissionPipelineItem, type ActivityFeedItem, type MandateRecord } from "@/lib/api-client";
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

export default function AgentDashboardEnhanced() {
  const [showAddListing, setShowAddListing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"overview" | "analytics" | "listings" | "viewings" | "mandates">("overview");
  const [activeListings, setActiveListings] = useState<DashboardListing[]>([]);
  const [rawListings, setRawListings] = useState<PropertyListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingError, setListingError] = useState("");
  const [agentViewings, setAgentViewings] = useState<ViewingResponse[]>([]);
  const [isLoadingViewings, setIsLoadingViewings] = useState(false);
  const [viewingsError, setViewingsError] = useState("");
  const [showOpenHouseModal, setShowOpenHouseModal] = useState(false);
  const [openHousePropertyId, setOpenHousePropertyId] = useState("");
  const [openHouseForm, setOpenHouseForm] = useState<CreateOpenHousePayload & { scheduledAt: string; endAt: string }>({
    scheduledAt: "",
    endAt: "",
    maxAttendees: undefined,
    description: "",
  });
  const [isSchedulingOpenHouse, setIsSchedulingOpenHouse] = useState(false);
  const [openHouseError, setOpenHouseError] = useState("");
  const [openHouseSuccess, setOpenHouseSuccess] = useState(false);
  const [agentOpenHouses, setAgentOpenHouses] = useState<OpenHouseRecord[]>([]);
  const [duplicatingIds, setDuplicatingIds] = useState<Set<string>>(new Set());
  const [duplicateError, setDuplicateError] = useState("");
  const [editingListing, setEditingListing] = useState<PropertyListing | null>(null);

  // Mandates
  const [agentMandates, setAgentMandates] = useState<MandateRecord[]>([]);
  const [isLoadingMandates, setIsLoadingMandates] = useState(false);
  const [mandatesError, setMandatesError] = useState("");
  const [commissionPipeline, setCommissionPipeline] = useState<CommissionPipelineItem[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [viewingActionError, setViewingActionError] = useState("");
  const [viewingsView, setViewingsView] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedCalDay, setSelectedCalDay] = useState<string | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<AgentDashboardResponse>({
    totalListings: 0,
    byStatus: {},
    newInquiries7d: 0,
    verificationSummary: {},
    listingViewsLast7d: 0,
    listingViewsPrevious7d: 0,
    listingViewsTrendPct: 0,
    inquiryResponseRatePct: 0,
  });

  // Agent name from stored session user
  const agentName = useMemo(() => {
    const user = getStoredUser();
    if (!user) return 'Agent';
    return `${user.firstName} ${user.lastName}`.trim() || 'Agent';
  }, []);

  // Views comparison built from API metrics (previous 7d vs last 7d)
  const viewsData = useMemo(() => [
    { period: 'Previous 7d', views: dashboardMetrics.listingViewsPrevious7d, inquiries: 0 },
    { period: 'Last 7d', views: dashboardMetrics.listingViewsLast7d, inquiries: dashboardMetrics.newInquiries7d },
  ], [dashboardMetrics]);

  // Top listings for performance chart, derived from real listing data
  const listingPerformance = useMemo(() =>
    activeListings.slice(0, 5).map((l) => ({
      name: l.address.split(',')[0]?.trim().substring(0, 16) || 'Listing',
      views: l.views,
      inquiries: l.inquiries,
    })),
  [activeListings]);

  const loadOverviewData = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const [pipeline, feed] = await Promise.all([
        agentApi.getCommissionPipeline(token),
        agentApi.getActivityFeed(token),
      ]);
      setCommissionPipeline(pipeline);
      setActivityFeed(feed);
    } catch {
      // non-critical — dashboard still usable without these
    }
  };

  const loadAgentListings = async () => {
    const claims = getSessionClaims();
    const agentId = claims?.sub;

    if (!agentId) {
      setActiveListings([]);
      setListingError("Please log in as an agent to view your listings.");
      setIsLoadingListings(false);
      return;
    }

    setIsLoadingListings(true);
    setListingError("");

    try {
      const token = getAccessToken();
      const [response, metrics] = await Promise.all([
        propertiesApi.search({
        agent_id: agentId,
        sort: "newest",
        limit: 100,
        }),
        token ? propertiesApi.getAgentDashboard(token) : Promise.resolve(dashboardMetrics),
      ]);

      setRawListings(response.data);
      setActiveListings(response.data.map(mapPropertyToDashboardListing));
      setDashboardMetrics(metrics);
    } catch {
      setActiveListings([]);
      setRawListings([]);
      setListingError("Unable to load agent listings from database.");
    } finally {
      setIsLoadingListings(false);
    }
  };

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

      await loadAgentListings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate listing";
      setDuplicateError(msg);
    } finally {
      setDuplicatingIds((prev) => { const next = new Set(prev); next.delete(listingId); return next; });
    }
  };

  useEffect(() => {
    void loadAgentListings();
    void loadOverviewData();
  }, []);

  useEffect(() => {
    if (selectedTab !== "mandates") return;
    const token = getAccessToken();
    if (!token) return;
    setIsLoadingMandates(true);
    setMandatesError("");
    agentApi.getMandates(token)
      .then(setAgentMandates)
      .catch(() => setMandatesError("Unable to load mandates."))
      .finally(() => setIsLoadingMandates(false));
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab !== "viewings") return;
    const token = getAccessToken();
    if (!token) return;
    setIsLoadingViewings(true);
    setViewingsError("");
    Promise.all([
      agentApi.getViewings(token),
      agentApi.getOpenHouses(token),
    ])
      .then(([viewings, openHouses]) => {
        setAgentViewings(viewings);
        setAgentOpenHouses(openHouses);
      })
      .catch(() => setViewingsError("Unable to load viewings."))
      .finally(() => setIsLoadingViewings(false));
  }, [selectedTab]);

  const handleConfirmViewing = async (viewingId: string) => {
    const token = getAccessToken();
    if (!token || confirmingId) return;
    setConfirmingId(viewingId);
    setViewingActionError("");
    try {
      await viewingActionsApi.confirm(token, viewingId);
      setAgentViewings((prev) =>
        prev.map((v) => v.id === viewingId ? { ...v, status: 'confirmed' } : v)
      );
    } catch (err) {
      setViewingActionError(err instanceof Error ? err.message : "Failed to confirm viewing.");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCompleteViewing = async (viewingId: string) => {
    const token = getAccessToken();
    if (!token || completingId) return;
    setCompletingId(viewingId);
    setViewingActionError("");
    try {
      await viewingActionsApi.complete(token, viewingId);
      setAgentViewings((prev) =>
        prev.map((v) => v.id === viewingId ? { ...v, status: 'completed' } : v)
      );
    } catch (err) {
      setViewingActionError(err instanceof Error ? err.message : "Failed to complete viewing.");
    } finally {
      setCompletingId(null);
    }
  };

  const handleScheduleOpenHouse = async () => {
    const token = getAccessToken();
    if (!token || !openHousePropertyId || !openHouseForm.scheduledAt || !openHouseForm.endAt) return;
    setIsSchedulingOpenHouse(true);
    setOpenHouseError("");
    setOpenHouseSuccess(false);
    try {
      await agentApi.createOpenHouse(token, openHousePropertyId, {
        scheduledAt: new Date(openHouseForm.scheduledAt).toISOString(),
        endAt: new Date(openHouseForm.endAt).toISOString(),
        maxAttendees: openHouseForm.maxAttendees,
        description: openHouseForm.description || undefined,
      });
      setOpenHouseSuccess(true);
      // Refresh open houses list in background
      agentApi.getOpenHouses(token).then(setAgentOpenHouses).catch(() => undefined);
      setTimeout(() => {
        setShowOpenHouseModal(false);
        setOpenHouseSuccess(false);
        setOpenHouseForm({ scheduledAt: "", endAt: "", maxAttendees: undefined, description: "" });
        setOpenHousePropertyId("");
      }, 1500);
    } catch (err) {
      setOpenHouseError(err instanceof Error ? err.message : "Failed to schedule open house.");
    } finally {
      setIsSchedulingOpenHouse(false);
    }
  };

  const upcomingViewings = agentViewings.filter((v) => new Date(v.scheduled_at) >= new Date());
  const pastViewings = agentViewings.filter((v) => new Date(v.scheduled_at) < new Date());

  // Group all viewings by calendar date key (YYYY-MM-DD)
  const viewingsByDate = useMemo(() => {
    const map = new Map<string, ViewingResponse[]>();
    agentViewings.forEach((v) => {
      const key = v.scheduled_at.slice(0, 10);
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, v]);
    });
    return map;
  }, [agentViewings]);

  const openHousesByDate = useMemo(() => {
    const map = new Map<string, OpenHouseRecord[]>();
    agentOpenHouses.forEach((oh) => {
      const key = oh.scheduled_at.slice(0, 10);
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, oh]);
    });
    return map;
  }, [agentOpenHouses]);

  // Build a 6-week (42-cell) grid for the current calendar month
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); // 0 = Sunday
    const days: Array<{ date: Date; dateStr: string; inMonth: boolean }> = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, dateStr, inMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date, dateStr, inMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, dateStr, inMonth: false });
    }
    return days;
  }, [calendarMonth]);

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
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Agent Dashboard</h1>
            <p className="text-gray-600">Welcome back, {agentName}</p>
          </div>
          <Button 
            onClick={() => setShowAddListing(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Listing
          </Button>
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
            onClick={() => setSelectedTab("analytics")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "analytics"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Analytics
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
            onClick={() => setSelectedTab("viewings")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "viewings"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Viewings
          </button>
          <button
            onClick={() => setSelectedTab("mandates")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "mandates"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Mandates
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
                    <div className="text-sm text-gray-600 mb-1">Total Views</div>
                    <div className="text-3xl font-bold">{dashboardMetrics.listingViewsLast7d}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      {dashboardMetrics.listingViewsTrendPct >= 0 ? '+' : ''}{dashboardMetrics.listingViewsTrendPct}% vs previous 7 days
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Inquiries</div>
                    <div className="text-3xl font-bold">{dashboardMetrics.newInquiries7d}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      {dashboardMetrics.inquiryResponseRatePct}% response rate
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-green-600" />
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

            {/* Quick Chart Preview */}
            <Card className="p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4">Performance Overview</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#93c5fd" name="Views" />
                  <Area type="monotone" dataKey="inquiries" stroke="#10b981" fill="#6ee7b7" name="Inquiries" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Listing Status Breakdown */}
            {Object.keys(dashboardMetrics.byStatus).length > 0 && (
              <Card className="p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Listings by Status</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(dashboardMetrics.byStatus).map(([status, count]) => {
                    const colours: Record<string, string> = {
                      active: 'bg-green-50 border-green-200 text-green-700',
                      draft: 'bg-gray-50 border-gray-200 text-gray-600',
                      under_offer: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                      sold: 'bg-blue-50 border-blue-200 text-blue-700',
                      withdrawn: 'bg-red-50 border-red-200 text-red-600',
                      back_to_market: 'bg-purple-50 border-purple-200 text-purple-700',
                    };
                    const colourClass = colours[status] ?? 'bg-gray-50 border-gray-200 text-gray-600';
                    return (
                      <div key={status} className={`border rounded-xl p-4 text-center ${colourClass}`}>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs mt-1 capitalize">{status.replace(/_/g, ' ')}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Verification Summary */}
            {Object.keys(dashboardMetrics.verificationSummary).length > 0 && (
              <Card className="p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Verification Summary</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(dashboardMetrics.verificationSummary).map(([level, count]) => {
                    const colours: Record<string, string> = {
                      verified: 'bg-green-50 border-green-200 text-green-700',
                      partial: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                      unverified: 'bg-red-50 border-red-200 text-red-600',
                      pending: 'bg-blue-50 border-blue-200 text-blue-700',
                    };
                    const colourClass = colours[level] ?? 'bg-gray-50 border-gray-200 text-gray-600';
                    return (
                      <div key={level} className={`border rounded-xl p-4 text-center ${colourClass}`}>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs mt-1 capitalize">{level}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Commission Pipeline */}
            {commissionPipeline.length > 0 && (
              <Card className="p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4">Commission Pipeline</h3>
                <div className="space-y-3">
                  {commissionPipeline.slice(0, 5).map((item) => (
                    <div key={item.mandate_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.property_title}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.mandate_type?.replace('_', ' ')} · {item.listing_status}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold text-green-700">
                          {formatMoney(String(item.estimated_commission ?? 0), 'ZAR')}
                        </p>
                        <p className="text-xs text-gray-400">{item.commission_rate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {activityFeed.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity. Add your first listing to get started.</p>
                ) : (
                  activityFeed.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.property_title ?? item.entity_type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.action.replace(/_/g, ' ')}
                          {' · '}
                          {new Date(item.created_at).toLocaleDateString('en-ZA', { dateStyle: 'medium' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        )}

        {/* Analytics Tab */}
        {selectedTab === "analytics" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Views & Inquiries Over Time */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Views & Inquiries Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Page Views" />
                    <Line type="monotone" dataKey="inquiries" stroke="#10b981" strokeWidth={2} name="Inquiries" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Listing Performance */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Top Performing Listings</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={listingPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#3b82f6" name="Views" />
                    <Bar dataKey="inquiries" fill="#10b981" name="Inquiries" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Conversion Metrics */}
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">Conversion Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{dashboardMetrics.listingViewsTrendPct >= 0 ? '+' : ''}{dashboardMetrics.listingViewsTrendPct}%</div>
                  <div className="text-sm text-gray-600">Views Trend (7d)</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">{dashboardMetrics.inquiryResponseRatePct}%</div>
                  <div className="text-sm text-gray-600">Inquiry Response Rate</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">{dashboardMetrics.byStatus['under_offer'] ?? 0}</div>
                  <div className="text-sm text-gray-600">Under Offer</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{dashboardMetrics.byStatus['sold'] ?? 0}</div>
                  <div className="text-sm text-gray-600">Sold</div>
                </div>
              </div>
            </Card>

            {/* Listing Status Breakdown */}
            {Object.keys(dashboardMetrics.byStatus).length > 0 && (
              <Card className="p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Portfolio by Status</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(dashboardMetrics.byStatus).map(([status, count]) => {
                    const total = activeListings.length || 1;
                    const pct = Math.round((count / total) * 100);
                    const barColours: Record<string, string> = {
                      active: 'bg-green-500',
                      draft: 'bg-gray-400',
                      under_offer: 'bg-yellow-500',
                      sold: 'bg-blue-500',
                      withdrawn: 'bg-red-400',
                      back_to_market: 'bg-purple-500',
                    };
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-gray-600 capitalize shrink-0">{status.replace(/_/g, ' ')}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${barColours[status] ?? 'bg-gray-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-xs font-semibold w-10 text-right">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Verification Breakdown */}
            {Object.keys(dashboardMetrics.verificationSummary).length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Verification Breakdown</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(dashboardMetrics.verificationSummary).map(([level, count]) => {
                    const colours: Record<string, string> = {
                      verified: 'bg-green-50 border-green-200 text-green-700',
                      partial: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                      unverified: 'bg-red-50 border-red-200 text-red-600',
                      pending: 'bg-blue-50 border-blue-200 text-blue-700',
                    };
                    return (
                      <div key={level} className={`border rounded-xl p-4 text-center ${colours[level] ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs mt-1 capitalize">{level}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Listings Tab */}
        {selectedTab === "listings" && (
          <div className="space-y-6">
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
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                        No listings found for this agent in the database.
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
                        <Badge className="bg-green-100 text-green-700">{listing.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/app/property/${listing.id}`}>View</Link>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { const raw = rawListings.find((r) => r.id === listing.id); if (raw) setEditingListing(raw); }}>
                            <PenLine className="w-3 h-3 mr-1" />
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

        {/* Mandates Tab */}
        {selectedTab === "mandates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Mandate Portfolio</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                {agentMandates.length} mandate{agentMandates.length !== 1 ? 's' : ''}
              </div>
            </div>

            {mandatesError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{mandatesError}
              </div>
            )}

            {isLoadingMandates ? (
              <Card className="py-12 text-center text-gray-400">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
                <p className="text-sm">Loading mandates…</p>
              </Card>
            ) : agentMandates.length === 0 ? (
              <Card className="py-12 text-center text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No mandates found. Mandates are created from individual property listings.</p>
              </Card>
            ) : (
              <>
                {/* Summary grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['pending_signature', 'active', 'expired', 'cancelled'] as const).map((s) => {
                    const count = agentMandates.filter((m) => m.status === s).length;
                    const colours: Record<string, string> = {
                      pending_signature: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                      active: 'bg-green-50 border-green-200 text-green-700',
                      expired: 'bg-gray-50 border-gray-200 text-gray-500',
                      cancelled: 'bg-red-50 border-red-200 text-red-600',
                    };
                    return (
                      <div key={s} className={`border rounded-xl p-4 text-center ${colours[s]}`}>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs mt-1 capitalize">{s.replace(/_/g, ' ')}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Mandate table */}
                <Card className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Property</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Commission</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Period</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Signatures</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {agentMandates.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <Link to={`/app/property/${m.property_id}`} className="text-sm font-medium text-blue-600 hover:underline">
                              {m.property_id.slice(0, 8)}…
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm capitalize">{m.mandate_type.replace('_', ' ')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-green-700">{m.commission_rate}%</span>
                            {m.commission_vat_inclusive && <span className="text-xs text-gray-400 ml-1">incl. VAT</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-600">
                              <div>{new Date(m.start_date).toLocaleDateString('en-ZA')}</div>
                              <div className="text-gray-400">↓ {new Date(m.end_date).toLocaleDateString('en-ZA')}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-xs">
                              <div className={m.agent_signed_at ? 'text-green-600' : 'text-gray-400'}>
                                {m.agent_signed_at ? '✓ Agent' : '○ Agent unsigned'}
                              </div>
                              <div className={m.seller_signed_at ? 'text-green-600' : 'text-gray-400'}>
                                {m.seller_signed_at ? '✓ Seller' : '○ Seller unsigned'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={
                              m.status === 'active' ? 'bg-green-100 text-green-700' :
                              m.status === 'pending_signature' ? 'bg-yellow-100 text-yellow-700' :
                              m.status === 'expired' ? 'bg-gray-100 text-gray-500' :
                              'bg-red-100 text-red-600'
                            }>
                              {m.status.replace('_', ' ')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Viewings Tab */}
        {selectedTab === "viewings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Viewings & Open Houses</h2>
              <div className="flex items-center gap-2">
                {/* List / Calendar toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewingsView("list")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewingsView === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <ListIcon className="w-4 h-4" />
                    List
                  </button>
                  <button
                    onClick={() => setViewingsView("calendar")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewingsView === "calendar" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </button>
                </div>
                <Button
                  onClick={() => setShowOpenHouseModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={activeListings.length === 0}
                  title={activeListings.length === 0 ? "You need at least one active property listing to schedule an open house" : undefined}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Open House
                </Button>
              </div>
            </div>

            {viewingsError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{viewingsError}</div>
            )}

            {viewingActionError && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">{viewingActionError}</div>
            )}

            {isLoadingViewings ? (
              <Card className="py-12 text-center text-gray-400">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
                <p className="text-sm">Loading viewings…</p>
              </Card>
            ) : viewingsView === "calendar" ? (
              /* ── Calendar View ── */
              <Card className="p-4 md:p-6">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-800">
                      {calendarMonth.toLocaleString("en-ZA", { month: "long", year: "numeric" })}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{agentViewings.length} total viewings</p>
                  </div>
                  <button
                    onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 border-l border-t border-gray-200">
                  {calendarDays.map(({ date, dateStr, inMonth }) => {
                    const dayViewings = viewingsByDate.get(dateStr) ?? [];
                    const dayOpenHouses = openHousesByDate.get(dateStr) ?? [];
                    const totalItems = dayViewings.length + dayOpenHouses.length;
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedCalDay;
                    // Combined chips: viewings first (up to 2 total), then open houses
                    const viewingChips = dayViewings.slice(0, Math.min(2, dayViewings.length));
                    const openHouseChips = dayOpenHouses.slice(0, Math.max(0, 2 - viewingChips.length));
                    const hiddenCount = totalItems - viewingChips.length - openHouseChips.length;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedCalDay((prev) => (prev === dateStr ? null : dateStr))}
                        className={`border-r border-b border-gray-200 min-h-18 p-1.5 text-left transition-colors ${
                          !inMonth ? "bg-gray-50" : "bg-white hover:bg-blue-50"
                        } ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}`}
                      >
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? "bg-blue-600 text-white" : inMonth ? "text-gray-700" : "text-gray-300"
                        }`}>
                          {date.getDate()}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {viewingChips.map((v) => (
                            <div
                              key={v.id}
                              className={`text-[10px] px-1 py-0.5 rounded truncate leading-tight ${
                                v.status === "confirmed"
                                  ? "bg-green-100 text-green-700"
                                  : v.status === "completed"
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {new Date(v.scheduled_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          ))}
                          {openHouseChips.map((oh) => (
                            <div
                              key={oh.id}
                              className="text-[10px] px-1 py-0.5 rounded truncate leading-tight bg-purple-100 text-purple-700"
                            >
                              OH {new Date(oh.scheduled_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          ))}
                          {hiddenCount > 0 && (
                            <div className="text-[10px] text-gray-400 pl-1">+{hiddenCount} more</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 inline-block" />Pending</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 inline-block" />Confirmed</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 inline-block" />Completed</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-100 inline-block" />Open House</span>
                </div>

                {/* Selected day detail panel */}
                {selectedCalDay && ((viewingsByDate.get(selectedCalDay)?.length ?? 0) + (openHousesByDate.get(selectedCalDay)?.length ?? 0)) > 0 && (() => {
                  const dayViewingsDetail = viewingsByDate.get(selectedCalDay) ?? [];
                  const dayOpenHousesDetail = openHousesByDate.get(selectedCalDay) ?? [];
                  const totalCount = dayViewingsDetail.length + dayOpenHousesDetail.length;
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-sm text-gray-700 mb-3">
                        {new Date(selectedCalDay + "T12:00:00").toLocaleDateString("en-ZA", {
                          weekday: "long", day: "numeric", month: "long",
                        })}
                        <span className="ml-2 font-normal text-gray-400">
                          — {totalCount} event{totalCount > 1 ? "s" : ""}
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {dayViewingsDetail
                          .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                          .map((v) => (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="text-xs font-mono text-gray-500 w-12 shrink-0">
                                {new Date(v.scheduled_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{v.property_title ?? "Property"}</p>
                                <p className="text-xs text-gray-500 capitalize">{v.viewing_type?.replace("_", " ") ?? "in person"}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {v.status !== "confirmed" && v.status !== "completed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2"
                                    disabled={confirmingId === v.id}
                                    onClick={() => void handleConfirmViewing(v.id)}
                                  >
                                    {confirmingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                                  </Button>
                                )}
                                {v.status !== "completed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2"
                                    disabled={completingId === v.id}
                                    onClick={() => void handleCompleteViewing(v.id)}
                                  >
                                    {completingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Complete"}
                                  </Button>
                                )}
                                <Badge className={
                                  v.status === "confirmed" ? "bg-green-100 text-green-700" :
                                  v.status === "completed" ? "bg-blue-100 text-blue-700" :
                                  "bg-yellow-100 text-yellow-700"
                                }>
                                  {v.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        {dayOpenHousesDetail
                          .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                          .map((oh) => (
                            <div key={oh.id} className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                              <div className="text-xs font-mono text-purple-500 w-12 shrink-0">
                                {new Date(oh.scheduled_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{oh.property_title}</p>
                                <p className="text-xs text-purple-500">
                                  Open House
                                  {oh.max_attendees != null ? ` · max ${oh.max_attendees}` : ""}
                                  {" → "}{new Date(oh.end_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                              <Badge className={
                                oh.status === "completed" ? "bg-green-100 text-green-700" :
                                oh.status === "cancelled" ? "bg-red-100 text-red-700" :
                                "bg-purple-100 text-purple-700"
                              }>
                                {oh.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })()}

                {selectedCalDay && ((viewingsByDate.get(selectedCalDay)?.length ?? 0) + (openHousesByDate.get(selectedCalDay)?.length ?? 0)) === 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-400">
                    No events on {new Date(selectedCalDay + "T12:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
                  </div>
                )}
              </Card>
            ) : (
              /* ── List View ── */
              <>
                {/* Upcoming */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Upcoming ({upcomingViewings.length})
                  </h3>
                  {upcomingViewings.length === 0 ? (
                    <Card className="py-8 text-center text-gray-400">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No upcoming viewings</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {upcomingViewings.map((v) => (
                        <Card key={v.id} className="p-4 flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{v.property_title ?? "Property"}</p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              Viewing
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(v.scheduled_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                              <Badge className="text-xs capitalize">{v.viewing_type?.replace("_", " ") ?? "in person"}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {v.status !== 'confirmed' && v.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2"
                                  disabled={confirmingId === v.id}
                                  onClick={() => void handleConfirmViewing(v.id)}
                                >
                                  {confirmingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                                  Confirm
                                </Button>
                              )}
                              {v.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2"
                                  disabled={completingId === v.id}
                                  onClick={() => void handleCompleteViewing(v.id)}
                                >
                                  {completingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />}
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                          <Badge className={v.status === "confirmed" ? "bg-green-100 text-green-700" : v.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}>
                            {v.status}
                          </Badge>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past */}
                {pastViewings.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Past ({pastViewings.length})</h3>
                    <div className="space-y-3">
                      {pastViewings.slice(0, 10).map((v) => (
                        <Card key={v.id} className="p-4 flex items-start gap-4 opacity-70">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{v.property_title ?? "Property"}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{v.status}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(v.scheduled_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                          </div>
                          <Badge className={v.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                            {v.status}
                          </Badge>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open Houses */}
                {agentOpenHouses.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      Open Houses ({agentOpenHouses.length})
                    </h3>
                    <div className="space-y-3">
                      {agentOpenHouses.map((oh) => (
                        <Card key={oh.id} className="p-4 flex items-start gap-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{oh.property_title}</p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {new Date(oh.scheduled_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                              {" → "}
                              {new Date(oh.end_at).toLocaleTimeString("en-ZA", { timeStyle: "short" })}
                            </p>
                            {oh.max_attendees != null && (
                              <p className="text-xs text-gray-400 mt-0.5">Max {oh.max_attendees} attendees</p>
                            )}
                            {oh.description && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{oh.description}</p>
                            )}
                          </div>
                          <Badge className={
                            oh.status === "completed" ? "bg-green-100 text-green-700" :
                            oh.status === "cancelled" ? "bg-red-100 text-red-700" :
                            "bg-purple-100 text-purple-700"
                          }>
                            {oh.status}
                          </Badge>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Open House Modal */}
      {showOpenHouseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Schedule Open House</h3>
              <button onClick={() => setShowOpenHouseModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Property *</label>
              <select
                value={openHousePropertyId}
                onChange={(e) => setOpenHousePropertyId(e.target.value)}
                title="Select a property"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a listing…</option>
                {activeListings.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Start *</label>
                <input
                  type="datetime-local"
                  value={openHouseForm.scheduledAt}
                  onChange={(e) => setOpenHouseForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  title="Open house start date and time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">End *</label>
                <input
                  type="datetime-local"
                  value={openHouseForm.endAt}
                  onChange={(e) => setOpenHouseForm((f) => ({ ...f, endAt: e.target.value }))}
                  title="Open house end date and time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Max Attendees</label>
              <input
                type="number"
                min={1}
                value={openHouseForm.maxAttendees ?? ""}
                onChange={(e) => setOpenHouseForm((f) => ({ ...f, maxAttendees: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Unlimited"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Description</label>
              <textarea
                value={openHouseForm.description ?? ""}
                onChange={(e) => setOpenHouseForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Optional details for attendees…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>

            {openHouseError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="w-4 h-4" /> {openHouseError}
              </div>
            )}
            {openHouseSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" /> Open house scheduled!
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowOpenHouseModal(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => { void handleScheduleOpenHouse(); }}
                disabled={isSchedulingOpenHouse || !openHousePropertyId || !openHouseForm.scheduledAt || !openHouseForm.endAt}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSchedulingOpenHouse ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showAddListing && (
        <CreateListing
          onClose={() => setShowAddListing(false)}
          onSuccess={() => {
            setShowAddListing(false);
            void loadAgentListings();
          }}
        />
      )}

      {editingListing && (
        <EditListing
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSuccess={() => {
            setEditingListing(null);
            void loadAgentListings();
          }}
        />
      )}
    </div>
  );
}
