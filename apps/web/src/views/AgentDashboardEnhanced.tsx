'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/lib/router-compat";
import {
  TrendingUp, Eye,
  MessageSquare, Plus,
  Home, DollarSign, Copy,
  Calendar, Clock, Loader2, CheckCircle2, XCircle, X, Activity, Users,
  ChevronLeft, ChevronRight, List as ListIcon, FileText, PenLine, AlertCircle, Share2, Bell
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAccessToken, getSessionClaims, getStoredUser } from "@/lib/auth-session";
import { propertiesApi, agentApi, viewingActionsApi, leadsApi, viewingsApi, syndicationApi, notificationsApi, type AgentDashboardResponse, type PropertyListing, type ViewingResponse, type CreateOpenHousePayload, type OpenHouseRecord, type CommissionPipelineItem, type ActivityFeedItem, type MandateRecord, type LeadRow, type LeadActivityRow, type LeadDashboardResponse, type CreateLeadPayload, type SyndicationRecord, type AgentBookViewingPayload, type AgentDeclineViewingPayload, type RescheduleViewingPayload, type UserNotification, LEAD_STATUSES, ACTIVITY_TYPES, LEAD_SOURCES } from "@/lib/api-client";
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

import { formatMoney } from "@/lib/formatters";

const DEFAULT_LISTING_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop";

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

// ── Smart Alert Bar ──────────────────────────────────────────────────────────
function SmartAlertBar({ pendingViewings, expiringMandates, staleLeadsCount, onNavigate, dismissed, setDismissed }: {
  pendingViewings: number;
  expiringMandates: number;
  staleLeadsCount: number;
  onNavigate: (tab: "overview" | "listings" | "viewings" | "mandates" | "crm") => void;
  dismissed: boolean;
  setDismissed: (v: boolean) => void;
}) {
  const alerts: { label: string; color: string; tab: "viewings" | "mandates" | "crm" }[] = [];
  if (pendingViewings > 0) alerts.push({ label: `${pendingViewings} pending viewing${pendingViewings > 1 ? "s" : ""}`, color: "bg-amber-100 text-amber-800 border-amber-200", tab: "viewings" });
  if (expiringMandates > 0) alerts.push({ label: `${expiringMandates} mandate${expiringMandates > 1 ? "s" : ""} expiring soon`, color: "bg-[#C4562A]/10 text-[#C4562A] border-[#C4562A]/20", tab: "mandates" });
  if (staleLeadsCount > 0) alerts.push({ label: `${staleLeadsCount} stale lead${staleLeadsCount > 1 ? "s" : ""} need follow-up`, color: "bg-[#B89040]/10 text-[#B89040] border-[#B89040]/20", tab: "crm" });
  if (alerts.length === 0 || dismissed) return null;
  return (
    <div className="flex items-center gap-2 px-4 md:px-8 pt-4 flex-wrap">
      {alerts.map((a) => (
        <button key={a.tab} onClick={() => onNavigate(a.tab)} className={`text-xs font-medium px-3 py-1 rounded-full border ${a.color} hover:opacity-80 transition-opacity`}>
          {a.label}
        </button>
      ))}
      <button onClick={() => setDismissed(true)} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
        <X className="w-3 h-3" /> Dismiss
      </button>
    </div>
  );
}



// ── Listing Heat Score ───────────────────────────────────────────────────────
function listingHeat(l: DashboardListing): 'hot' | 'warm' | 'cold' {
  if (l.offers >= 2 || (l.views > 20 && l.inquiries > 5)) return 'hot';
  if (l.offers >= 1 || (l.views > 5 && l.inquiries > 1)) return 'warm';
  return 'cold';
}

// ── Listing Status Category ───────────────────────────────────────────────────
function listingCategory(l: DashboardListing): string {
  if (l.status === 'sold') return 'sold';
  if (l.status === 'draft') return 'draft';
  if (l.status === 'under_offer' || l.offers > 0) return 'under_offer';
  if (l.daysOnMarket > 30 && l.inquiries < 2) return 'stale';
  return 'active';
}

// ── Listing Health Score ──────────────────────────────────────────────────────
function healthScore(l: DashboardListing): number {
  let score = 100;
  if (l.daysOnMarket > 45) score -= 20;
  else if (l.daysOnMarket > 21) score -= 10;
  if (l.views === 0) score -= 15;
  if (l.inquiries === 0) score -= 10;
  return Math.max(0, score);
}

function HealthBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-100 text-green-700" : score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{score}</span>;
}

// ── Commission Goal Tracker ───────────────────────────────────────────────────
function CommissionGoalTracker({ earned, currency, compact = false }: { earned: number; currency: string; compact?: boolean }) {
  const STORAGE_KEY = "commissionGoalTarget";
  const [target, setTarget] = useState<number>(() => {
    if (typeof window === "undefined") return 400000;
    return Number(localStorage.getItem(STORAGE_KEY) || "400000");
  });
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(target));

  const pct = Math.min(100, target > 0 ? Math.round((earned / target) * 100) : 0);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (pct / 100) * circumference;

  const compactRadius = 14;
  const compactCircumference = 2 * Math.PI * compactRadius;
  const compactStrokeDash = (pct / 100) * compactCircumference;

  const saveTarget = () => {
    const v = Number(inputVal.replace(/[^0-9]/g, ""));
    if (v > 0) {
      setTarget(v);
      localStorage.setItem(STORAGE_KEY, String(v));
    }
    setEditing(false);
  };

  if (compact) {
    return (
      <div className="rounded-xl bg-white flex items-center gap-3 px-4 py-3 h-full" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
          <circle cx="20" cy="20" r={compactRadius} fill="none" stroke="#E8F0EC" strokeWidth="4" />
          <circle
            cx="20" cy="20" r={compactRadius} fill="none"
            stroke="#1A3C28" strokeWidth="4"
            strokeDasharray={`${compactStrokeDash} ${compactCircumference}`}
            strokeLinecap="round"
            transform="rotate(-90 20 20)"
            className="transition-all duration-700"
        />
          <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1A3C28">{pct}%</text>
        </svg>
        <div className="min-w-0">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Commission Goal</div>
          <div className="text-sm font-bold leading-tight" style={{ fontFamily: "var(--font-fraunces)", color: "#1A3C28" }}>{formatMoney(String(earned), currency)}</div>
          <button onClick={() => { setInputVal(String(target)); setEditing(true); }} className="text-[10px] text-muted-foreground hover:text-[#1A3C28]">
            Goal: {formatMoney(String(target), currency)}
          </button>
          {editing && (
            <input
              autoFocus
              className="border border-gray-300 rounded px-1.5 py-0.5 text-[10px] w-20 block mt-0.5"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={saveTarget}
              onKeyDown={(e) => { if (e.key === "Enter") saveTarget(); if (e.key === "Escape") setEditing(false); }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 flex flex-col items-center gap-3" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
      <h3 className="font-semibold text-sm w-full" style={{ fontFamily: "var(--font-fraunces)" }}>Commission Goal</h3>
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#E8F0EC" strokeWidth="8" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke="#1A3C28" strokeWidth="8"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ fontFamily: "var(--font-fraunces)", color: "#1A3C28" }}>{pct}%</span>
        </div>
      </div>
      <div className="text-center w-full">
        <p className="text-xs text-muted-foreground">Earned</p>
        <p className="font-semibold text-sm">{formatMoney(String(earned), currency)}</p>
        {editing ? (
          <div className="flex items-center gap-1 mt-1 justify-center">
            <input
              autoFocus
              className="border border-gray-300 rounded px-2 py-0.5 text-xs w-24 text-center"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={saveTarget}
              onKeyDown={(e) => { if (e.key === "Enter") saveTarget(); if (e.key === "Escape") setEditing(false); }}
            />
          </div>
        ) : (
          <button onClick={() => { setInputVal(String(target)); setEditing(true); }} className="text-xs text-muted-foreground hover:text-[#1A3C28] mt-0.5">
            Goal: {formatMoney(String(target), currency)}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Lead Kanban ───────────────────────────────────────────────────────────────
function LeadKanban({ leads, onStatusChange }: { leads: LeadRow[]; onStatusChange: (id: string, status: string) => void }) {
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);

  const columns = LEAD_STATUSES.map((status) => ({
    status,
    leads: leads.filter((l) => l.stage === status),
  }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((col) => (
        <div
          key={col.status}
          className="min-w-44 flex-1 rounded-xl border border-border bg-background/60 flex flex-col"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (dragLeadId && dragLeadId !== col.leads.find((l) => l.id === dragLeadId)?.id) {
              onStatusChange(dragLeadId, col.status);
            }
            setDragLeadId(null);
          }}
        >
          <div className="px-3 py-2 rounded-t-xl text-xs font-semibold uppercase tracking-wide bg-[#1A3C28] text-[#F2E8D5]">
            {col.status.replace(/_/g, " ")} <span className="opacity-70">({col.leads.length})</span>
          </div>
          <div className="flex-1 space-y-2 p-2 min-h-20">
            {col.leads.map((lead) => (
              <div
                key={lead.id}
                draggable
                onDragStart={() => setDragLeadId(lead.id)}
                onDragEnd={() => setDragLeadId(null)}
                className={`bg-card border border-border rounded-lg p-2.5 cursor-grab active:cursor-grabbing shadow-sm transition-opacity ${dragLeadId === lead.id ? "opacity-50" : ""}`}
              >
                <p className="text-xs font-medium truncate">{lead.name}</p>
                {lead.phone && <p className="text-[10px] text-muted-foreground">{lead.phone}</p>}
                {lead.type && <span className="text-[10px] bg-[#E8F0EC] text-[#1A3C28] px-1.5 py-0.5 rounded capitalize">{lead.type}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AgentDashboardEnhanced() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"overview" | "listings" | "viewings" | "mandates" | "crm">("overview");
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

  // Listings tab UI state
  const [listingsFilter, setListingsFilter] = useState<string>("all");
  const [listingTypeFilter, setListingTypeFilter] = useState<string>("all");
  const [listingsView, setListingsView] = useState<"cards" | "table">("cards");
  const [listingsSearch, setListingsSearch] = useState("");
  const [listingSyndications, setListingSyndications] = useState<Record<string, SyndicationRecord[]>>({});
  const [editingListing, setEditingListing] = useState<PropertyListing | null>(null);
  // Syndication state
  const [syndicationPropertyId, setSyndicationPropertyId] = useState<string | null>(null);
  const [syndicationTitle, setSyndicationTitle] = useState("");
  const [syndicationRecords, setSyndicationRecords] = useState<SyndicationRecord[]>([]);
  const [isSyndicationLoading, setIsSyndicationLoading] = useState(false);
  const [isSyndicating, setIsSyndicating] = useState(false);
  const [syndicationError, setSyndicationError] = useState("");
  const [pausingPortalId, setPausingPortalId] = useState<string | null>(null);
  // Schedule viewing (agent books on behalf of buyer)
  const [showScheduleViewing, setShowScheduleViewing] = useState(false);
  const [scheduleViewingForm, setScheduleViewingForm] = useState<AgentBookViewingPayload & { propertyId: string }>({
    propertyId: "",
    viewingType: "physical",
    scheduledAt: "",
    durationMinutes: 30,
    buyerContactName: "",
    buyerContactEmail: "",
    buyerContactPhone: "",
    notes: "",
  });
  const [isSchedulingViewing, setIsSchedulingViewing] = useState(false);
  const [scheduleViewingError, setScheduleViewingError] = useState("");
  // CRM state
  const [crmDashboard, setCrmDashboard] = useState<LeadDashboardResponse>({ totalLeads: 0, hotLeads: 0, activeDeals: 0, pipelineValue: 0, pendingTasks: [], recentActivities: [], recentLeads: [], byType: {}, byTemperature: {}, byStage: {} });
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadTotal, setLeadTotal] = useState(0);
  const [leadPage, setLeadPage] = useState(1);
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");
  const [isLoadingCrm, setIsLoadingCrm] = useState(false);
  const [crmError, setCrmError] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [leadActivities, setLeadActivities] = useState<LeadActivityRow[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [createLeadForm, setCreateLeadForm] = useState<CreateLeadPayload>({ name: "", type: "buyer", email: "", phone: "", source: "", notes: "" });
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [createLeadError, setCreateLeadError] = useState("");
  const [logActivityForm, setLogActivityForm] = useState({ activityType: "note", notes: "" });
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [leadStatusUpdating, setLeadStatusUpdating] = useState<string | null>(null);

  // Mandates
  const [agentMandates, setAgentMandates] = useState<MandateRecord[]>([]);
  const [isLoadingMandates, setIsLoadingMandates] = useState(false);
  const [mandatesError, setMandatesError] = useState("");
  const [commissionPipeline, setCommissionPipeline] = useState<CommissionPipelineItem[]>([]);
  const [commissionTotal, setCommissionTotal] = useState<number>(0);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [viewingActionError, setViewingActionError] = useState("");
  // Decline viewing modal
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [decliningViewingId, setDecliningViewingId] = useState<string | null>(null);
  const [declineForm, setDeclineForm] = useState<AgentDeclineViewingPayload>({ reason: "", alternativeDates: [], message: "" });
  const [isDeclining, setIsDeclining] = useState(false);
  const [declineError, setDeclineError] = useState("");
  const [altDateInput, setAltDateInput] = useState("");
  // Cancel viewing modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingViewingId, setCancellingViewingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  // Reschedule viewing modal
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingViewingId, setReschedulingViewingId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleViewingPayload>({ scheduledAt: "", reason: "" });
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  // Notifications
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewingsView, setViewingsView] = useState<"list" | "calendar">("list");
  const [crmView, setCrmView] = useState<"table" | "kanban">("table");
  const [alertsDismissed, setAlertsDismissed] = useState(false);
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

  const openSyndication = async (propertyId: string, title: string) => {
    const token = getAccessToken();
    if (!token) return;
    setSyndicationPropertyId(propertyId);
    setSyndicationTitle(title);
    setSyndicationError("");
    setIsSyndicationLoading(true);
    setSyndicationRecords([]);
    try {
      const records = await syndicationApi.getStatus(token, propertyId);
      setSyndicationRecords(records);
      setListingSyndications(prev => ({ ...prev, [propertyId]: records }));
    } catch {
      setSyndicationError("Failed to load syndication status.");
    } finally {
      setIsSyndicationLoading(false);
    }
  };

  const handleSyndicate = async () => {
    if (!syndicationPropertyId) return;
    const token = getAccessToken();
    if (!token) return;
    setIsSyndicating(true);
    setSyndicationError("");
    try {
      const records = await syndicationApi.syndicate(token, syndicationPropertyId);
      setSyndicationRecords(records);
    } catch (err) {
      setSyndicationError(err instanceof Error ? err.message : "Syndication failed.");
    } finally {
      setIsSyndicating(false);
    }
  };

  const handlePauseSyndication = async (portalId: string) => {
    if (!syndicationPropertyId) return;
    const token = getAccessToken();
    if (!token) return;
    setPausingPortalId(portalId);
    try {
      const updated = await syndicationApi.pause(token, syndicationPropertyId, portalId);
      setSyndicationRecords((prev) => prev.map((r) => r.portal_id === portalId ? updated : r));
    } catch {
      // non-fatal — status will remain unchanged
    } finally {
      setPausingPortalId(null);
    }
  };

  const handleScheduleViewing = async () => {
    const token = getAccessToken();
    if (!token || !scheduleViewingForm.propertyId || !scheduleViewingForm.scheduledAt || !scheduleViewingForm.buyerContactName.trim()) return;
    setIsSchedulingViewing(true);
    setScheduleViewingError("");
    try {
      const { propertyId, ...payload } = scheduleViewingForm;
      const created = await viewingsApi.bookForBuyer(token, propertyId, payload);
      setAgentViewings((prev) => [created, ...prev]);
      setShowScheduleViewing(false);
    } catch (err) {
      setScheduleViewingError(err instanceof Error ? err.message : "Failed to schedule viewing.");
    } finally {
      setIsSchedulingViewing(false);
    }
  };

  const loadOverviewData = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const [pipeline, feed] = await Promise.all([
        agentApi.getCommissionPipeline(token),
        agentApi.getActivityFeed(token),
      ]);
      setCommissionPipeline(pipeline.deals ?? []);
      setCommissionTotal(pipeline.totalEstimated ?? 0);
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
    if (selectedTab !== "crm") return;
    const token = getAccessToken();
    if (!token) return;
    setIsLoadingCrm(true);
    setCrmError("");
    const statusParam = leadStatusFilter === "all" ? undefined : leadStatusFilter;
    Promise.all([
      leadsApi.getDashboard(token),
      leadsApi.list(token, { stage: statusParam, offset: (leadPage - 1) * 20, limit: 20 }),
    ])
      .then(([dash, leadsRes]) => {
        setCrmDashboard(dash);
        setLeads(leadsRes.data);
        setLeadTotal(leadsRes.total);
      })
      .catch(() => setCrmError("Failed to load CRM data"))
      .finally(() => setIsLoadingCrm(false));
  }, [selectedTab, leadStatusFilter, leadPage]);

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

  // Load notifications on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    notificationsApi.getAll(token).then(setNotifications).catch(() => undefined);
  }, []);

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

  const handleDeclineViewing = async () => {
    const token = getAccessToken();
    if (!token || !decliningViewingId || declineForm.reason.trim().length < 10) return;
    setIsDeclining(true);
    setDeclineError("");
    try {
      await viewingsApi.decline(token, decliningViewingId, declineForm);
      setAgentViewings((prev) =>
        prev.map((v) => v.id === decliningViewingId ? { ...v, status: 'declined', declined_at: new Date().toISOString() } : v)
      );
      setShowDeclineModal(false);
      setDecliningViewingId(null);
      setDeclineForm({ reason: "", alternativeDates: [], message: "" });
    } catch (err) {
      setDeclineError(err instanceof Error ? err.message : "Failed to decline viewing.");
    } finally {
      setIsDeclining(false);
    }
  };

  const handleCancelViewing = async () => {
    const token = getAccessToken();
    if (!token || !cancellingViewingId || cancelReason.trim().length < 5) return;
    setIsCancelling(true);
    setCancelError("");
    try {
      await viewingsApi.cancel(token, cancellingViewingId, { reason: cancelReason });
      setAgentViewings((prev) =>
        prev.map((v) => v.id === cancellingViewingId ? { ...v, status: 'cancelled', cancel_reason: cancelReason, cancelled_by: 'agent' } : v)
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

  const handleRescheduleViewing = async () => {
    const token = getAccessToken();
    if (!token || !reschedulingViewingId || !rescheduleForm.scheduledAt) return;
    setIsRescheduling(true);
    setRescheduleError("");
    try {
      const updated = await viewingsApi.reschedule(token, reschedulingViewingId, {
        ...rescheduleForm,
        scheduledAt: new Date(rescheduleForm.scheduledAt).toISOString(),
      });
      setAgentViewings((prev) =>
        prev.map((v) => v.id === reschedulingViewingId ? { ...v, scheduled_at: updated.scheduled_at, status: 'confirmed', rescheduled_at: updated.rescheduled_at } : v)
      );
      setShowRescheduleModal(false);
      setReschedulingViewingId(null);
      setRescheduleForm({ scheduledAt: "", reason: "" });
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : "Failed to reschedule viewing.");
    } finally {
      setIsRescheduling(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bt-parchment)' }}>
      {/* ── Brand Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--bt-forest)' }}>
        {/* Decorative background circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-5" style={{ backgroundColor: 'var(--bt-egreen)' }} />
        <div className="pointer-events-none absolute right-40 -bottom-12 w-48 h-48 rounded-full opacity-5" style={{ backgroundColor: 'var(--bt-terracotta)' }} />

        <div className="relative px-4 md:px-8 pt-6 pb-0">
          {/* Top row: title + actions */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--bt-terracotta)', fontFamily: 'var(--font-mono, ui-monospace)' }}>
                PropertyOS · Agent Portal
              </p>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-parchment)' }}>
                Welcome back, {agentName}
              </h1>
              <p className="text-sm mt-1 opacity-60" style={{ color: 'var(--bt-parchment)' }}>
                {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
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
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(242,232,213,0.1)' }}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" style={{ color: 'var(--bt-parchment)' }} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bt-terracotta)' }}>
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
                          <div key={n.id} className={`px-4 py-3 text-sm ${n.read_at ? "text-gray-500" : "text-gray-800"}`} style={!n.read_at ? { backgroundColor: 'rgba(26,60,40,0.06)' } : {}}>
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
              <button
                onClick={() => router.push('/app/my-listings/new')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ backgroundColor: 'var(--bt-terracotta)', color: '#fff' }}
              >
                <Plus className="w-4 h-4" />
                Add New Listing
              </button>
            </div>
          </div>

          {/* ── KPI strip ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 mt-6 border-t" style={{ borderColor: 'rgba(242,232,213,0.12)' }}>
            {[
              { label: 'Active Listings', value: activeListings.filter(l => l.status === 'active').length, sub: `${activeListings.length} total`, icon: <Home className="w-3.5 h-3.5" /> },
              { label: 'Open Leads', value: crmDashboard.totalLeads ?? '—', sub: `${crmDashboard.hotLeads ?? 0} hot`, icon: <Users className="w-3.5 h-3.5" /> },
              { label: 'Pipeline Value', value: formatMoney(String(totalPortfolioValue), 'ZAR'), sub: 'portfolio', icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { label: 'Commission Est.', value: formatMoney(String(commissionTotal), 'ZAR'), sub: `${commissionPipeline.length} mandates`, icon: <DollarSign className="w-3.5 h-3.5" /> },
              { label: 'Response Rate', value: `${dashboardMetrics.inquiryResponseRatePct ?? 0}%`, sub: `${dashboardMetrics.newInquiries7d ?? 0} new inquiries`, icon: <MessageSquare className="w-3.5 h-3.5" /> },
            ].map((kpi, i) => (
              <div key={i} className="px-4 py-3 border-r last:border-r-0" style={{ borderColor: 'rgba(242,232,213,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-1 opacity-60" style={{ color: 'var(--bt-parchment)' }}>
                  {kpi.icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{kpi.label}</span>
                </div>
                <div className="text-lg font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-parchment)' }}>{kpi.value}</div>
                <div className="text-[10px] opacity-50 mt-0.5" style={{ color: 'var(--bt-parchment)' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-0 mt-2 overflow-x-auto">
            {([
              { id: 'overview',  label: 'Overview' },
              { id: 'listings',  label: 'My Listings' },
              { id: 'viewings',  label: 'Viewings' },
              { id: 'mandates',  label: 'Mandates' },
              { id: 'crm',       label: 'Lead Pipeline' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className="relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  color: selectedTab === tab.id ? 'var(--bt-parchment)' : 'rgba(242,232,213,0.5)',
                  borderBottom: selectedTab === tab.id ? `2px solid var(--bt-terracotta)` : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <SmartAlertBar
        pendingViewings={agentViewings.filter((v) => v.status === "requested").length}
        expiringMandates={agentMandates.filter((m) => {
          if (!m.end_date) return false;
          const daysLeft = Math.floor((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysLeft >= 0 && daysLeft <= 30;
        }).length}
        staleLeadsCount={leads.filter((l) => {
          const days = Math.floor((Date.now() - new Date(l.updated_at ?? l.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return days > 14;
        }).length}
        onNavigate={(tab) => setSelectedTab(tab)}
        dismissed={alertsDismissed}
        setDismissed={setAlertsDismissed}
      />

      <div className="p-4 md:p-8" style={{ backgroundColor: 'var(--bt-parchment)' }}>
        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <>
            {/* ── Row 1: Metric quick-view strip ───────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {[
                { label: 'Total Listings', value: activeListings.length, sub: 'Live', subColour: 'var(--bt-egreen)', icon: <Home className="w-4 h-4" />, iconBg: '#E8F0EC', iconColour: 'var(--bt-forest)' },
                { label: 'Views (7d)', value: dashboardMetrics.listingViewsLast7d, sub: `${dashboardMetrics.listingViewsTrendPct >= 0 ? '+' : ''}${dashboardMetrics.listingViewsTrendPct}%`, subColour: 'var(--bt-egreen)', icon: <Eye className="w-4 h-4" />, iconBg: '#F2E8D5', iconColour: 'var(--bt-amber)' },
                { label: 'Inquiries', value: dashboardMetrics.newInquiries7d, sub: `${dashboardMetrics.inquiryResponseRatePct}% resp.`, subColour: 'var(--bt-egreen)', icon: <MessageSquare className="w-4 h-4" />, iconBg: '#D4F7E5', iconColour: 'var(--bt-forest)' },
                { label: 'Portfolio Value', value: formatMoney(String(totalPortfolioValue), 'ZAR'), sub: 'From database', subColour: 'var(--bt-egreen)', icon: <DollarSign className="w-4 h-4" />, iconBg: '#FAE8DF', iconColour: 'var(--bt-terracotta)' },
                { label: 'Active Mandates', value: agentMandates.length, sub: 'Exclus. + open', subColour: undefined, icon: <FileText className="w-4 h-4" />, iconBg: '#E8F0EC', iconColour: 'var(--bt-forest)' },
              ].map((m, i) => (
                <div key={i} className="rounded-xl bg-white p-3 px-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">{m.label}</div>
                      <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>{m.value}</div>
                      <div className="text-[10px] flex items-center gap-1 mt-1" style={{ color: m.subColour ?? '#6b7280' }}>
                        {m.subColour === 'var(--bt-egreen)' && <TrendingUp className="w-2.5 h-2.5" />}
                        {m.sub}
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: m.iconBg, color: m.iconColour }}>
                      {m.icon}
                    </div>
                  </div>
                </div>
              ))}

              <CommissionGoalTracker earned={commissionTotal} currency="ZAR" compact />
            </div>

            {/* ── Row A: Today's Priorities + Document Compliance + Performance Score ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Today's Priorities */}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const todayViewings = agentViewings.filter(v => v.scheduled_at.startsWith(todayStr));
                const overdueLeads = leads.filter(l => l.next_follow_up && new Date(l.next_follow_up) < new Date() && l.stage !== 'closed_won' && l.stage !== 'closed_lost');
                const expiringMandates = agentMandates.filter(m => {
                  const days = Math.floor((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return days >= 0 && days <= 7;
                });
                type PItem = { type: string; title: string; sub: string; time: string; urgent: boolean };
                const priorities: PItem[] = [
                  ...todayViewings.slice(0, 2).map(v => ({
                    type: 'Viewing',
                    title: v.property_title ?? 'Property Viewing',
                    sub: v.viewing_type ?? '',
                    time: new Date(v.scheduled_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
                    urgent: false,
                  })),
                  ...overdueLeads.slice(0, 2).map(l => ({
                    type: 'Follow-up',
                    title: `Call ${l.name}`,
                    sub: l.stage?.replace(/_/g, ' ') ?? 'Lead',
                    time: 'Overdue',
                    urgent: true,
                  })),
                  ...expiringMandates.slice(0, 1).map(() => ({
                    type: 'Alert',
                    title: 'Mandate expiring soon',
                    sub: 'Review mandate details',
                    time: 'Urgent',
                    urgent: true,
                  })),
                  ...crmDashboard.pendingTasks.filter(t => !t.completed).slice(0, 2).map(t => ({
                    type: 'Task',
                    title: t.title,
                    sub: t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString('en-ZA')}` : '',
                    time: t.priority === 'high' ? 'Urgent' : 'EOD',
                    urgent: t.priority === 'high',
                  })),
                ];
                const urgentCount = priorities.filter(p => p.urgent).length;
                const tagStyle: Record<string, string> = {
                  Viewing: 'bg-blue-100 text-blue-700',
                  'Follow-up': 'bg-amber-100 text-amber-700',
                  Alert: 'bg-red-100 text-red-700',
                  Task: 'bg-purple-100 text-purple-700',
                };
                return (
                  <div className="rounded-xl bg-white p-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>Today&apos;s Priorities</h3>
                      <span className="text-[10px] text-gray-500">{priorities.length} tasks{urgentCount > 0 ? ` — ${urgentCount} urgent` : ''}</span>
                    </div>
                    {priorities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--bt-egreen)' }} />
                        <p className="text-xs text-gray-500">All clear — no tasks today!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {priorities.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.urgent ? 'var(--bt-terracotta)' : 'var(--bt-forest)' }} />
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${tagStyle[p.type] ?? 'bg-gray-100 text-gray-600'}`}>{p.type}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{p.title}</div>
                              {p.sub && <div className="text-[10px] text-gray-500 truncate">{p.sub}</div>}
                            </div>
                            <span className={`text-[10px] font-semibold shrink-0 ${p.urgent ? 'text-red-600' : 'text-gray-400'}`}>{p.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Document Compliance Alerts */}
              {(() => {
                type DocAlert = { level: 'urgent' | 'warn' | 'ok'; title: string; sub: string; action: string };
                const alerts: DocAlert[] = [];
                leads.filter(l => l.next_follow_up && new Date(l.next_follow_up) < new Date() && l.stage !== 'closed_won' && l.stage !== 'closed_lost').slice(0, 2).forEach(l => {
                  const daysOver = Math.floor((Date.now() - new Date(l.next_follow_up!).getTime()) / (1000 * 60 * 60 * 24));
                  alerts.push({ level: 'urgent', title: `Overdue follow-up — ${l.name}`, sub: `${daysOver}d overdue · ${l.stage?.replace(/_/g, ' ') ?? ''}`, action: 'Call Now' });
                });
                agentMandates.filter(m => {
                  const days = Math.floor((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return days >= 0 && days <= 30;
                }).slice(0, 1).forEach(m => {
                  const days = Math.floor((new Date(m.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  alerts.push({ level: days <= 7 ? 'urgent' : 'warn', title: `Mandate expiring`, sub: `Expires in ${days} day${days !== 1 ? 's' : ''} · ${m.mandate_type}`, action: 'Renew' });
                });
                const totalVerified = Object.values(dashboardMetrics.verificationSummary ?? {}).reduce((s, c) => s + (c as number), 0);
                if (totalVerified > 0) alerts.push({ level: 'ok', title: `${totalVerified} listing${totalVerified !== 1 ? 's' : ''} verified`, sub: 'Documents reviewed · Ready to transfer', action: 'View' });
                const staleCount = leads.filter(l => Math.floor((Date.now() - new Date(l.updated_at ?? l.created_at).getTime()) / (1000 * 60 * 60 * 24)) > 14 && l.stage !== 'closed_won' && l.stage !== 'closed_lost').length;
                if (staleCount > 0 && alerts.length < 4) alerts.push({ level: 'warn', title: `${staleCount} stale lead${staleCount !== 1 ? 's' : ''} need attention`, sub: 'No activity in 14+ days', action: 'Review' });
                const needAttention = alerts.filter(a => a.level !== 'ok').length;
                const bgMap: Record<string, string> = { urgent: '#FEF2F2', warn: '#FFFBEB', ok: '#F0FDF4' };
                const borderMap: Record<string, string> = { urgent: '#FECACA', warn: '#FDE68A', ok: '#BBF7D0' };
                const iconBgMap: Record<string, string> = { urgent: '#FEE2E2', warn: '#FEF3C7', ok: '#D1FAE5' };
                const iconColorMap: Record<string, string> = { urgent: '#DC2626', warn: '#D97706', ok: '#059669' };
                const actionColorMap: Record<string, string> = { urgent: 'var(--bt-terracotta)', warn: 'var(--bt-amber)', ok: '#059669' };
                return (
                  <div className="rounded-xl bg-white p-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>Document Compliance</h3>
                      {needAttention > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{needAttention} need attention</span>}
                    </div>
                    {alerts.length === 0 ? (
                      <div className="flex items-center gap-2 py-3">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-gray-500">All compliance checks passed.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {alerts.slice(0, 4).map((a, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: bgMap[a.level], border: `1px solid ${borderMap[a.level]}` }}>
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: iconBgMap[a.level] }}>
                              {a.level === 'ok' ? <CheckCircle2 className="w-3 h-3" style={{ color: iconColorMap[a.level] }} /> : <AlertCircle className="w-3 h-3" style={{ color: iconColorMap[a.level] }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate" style={{ color: 'var(--bt-forest)' }}>{a.title}</div>
                              <div className="text-[10px] text-gray-500 truncate">{a.sub}</div>
                            </div>
                            <span className="text-[10px] font-bold shrink-0" style={{ color: actionColorMap[a.level] }}>{a.action} →</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Performance Score Ring */}
              {(() => {
                const respRate = Math.min(dashboardMetrics.inquiryResponseRatePct ?? 0, 100);
                const viewsTrend = Math.min(Math.max(dashboardMetrics.listingViewsTrendPct ?? 0, 0), 100);
                const mandateConv = agentMandates.length > 0 ? Math.min(Math.round((activeListings.filter(l => l.status === 'active').length / agentMandates.length) * 100), 100) : 0;
                const score = Math.round((respRate * 0.4) + (viewsTrend * 0.3) + (mandateConv * 0.3));
                const r = 37;
                const circ = 2 * Math.PI * r;
                const filled = (score / 100) * circ;
                const convRate = leads.length > 0 ? Math.round((leads.filter(l => l.stage === 'closed_won').length / leads.length) * 100) : 0;
                const avgDays = activeListings.length > 0 ? Math.round(activeListings.reduce((s, l) => s + (l.daysOnMarket ?? 0), 0) / activeListings.length) : 0;
                const closedWon = leads.filter(l => l.stage === 'closed_won').length;
                const inProgress = leads.filter(l => l.stage === 'active_offer').length;
                return (
                  <div className="rounded-xl bg-white p-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                    <h3 className="font-semibold text-sm mb-3" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>Performance Score</h3>
                    <div className="flex items-center gap-4">
                      <svg width="90" height="90" viewBox="0 0 90 90" className="shrink-0">
                        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(26,60,40,0.1)" strokeWidth="8" />
                        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--bt-terracotta)" strokeWidth="8"
                          strokeDasharray={`${filled.toFixed(1)} ${circ.toFixed(1)}`}
                          strokeLinecap="round" transform="rotate(-90 45 45)" />
                        <text x="45" y="42" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="18" fontWeight="700" fill="#1A3C28">{score}</text>
                        <text x="45" y="56" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#6B8F7A">/ 100</text>
                      </svg>
                      <div className="flex-1 space-y-1.5">
                        {[
                          { label: 'Conversion Rate', value: `${convRate}%` },
                          { label: 'Avg. Days on Mkt', value: avgDays > 0 ? `${avgDays}d` : '—' },
                          { label: 'Response Rate', value: `${respRate}%` },
                          { label: 'Deals Closed', value: `${closedWon} / ${closedWon + inProgress}` },
                        ].map(s => (
                          <div key={s.label} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                            <span className="text-[10px] text-gray-500">{s.label}</span>
                            <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Row B: Active Listings + Commission Tracker ──────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Active Listings */}
              <div className="rounded-xl bg-white p-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>Active Listings</h3>
                  <button onClick={() => setSelectedTab('listings')} className="text-[10px] font-semibold" style={{ color: 'var(--bt-terracotta)' }}>View All →</button>
                </div>
                {activeListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Home className="w-8 h-8 text-gray-300" />
                    <p className="text-sm text-gray-400">No active listings yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeListings.slice(0, 4).map((l) => {
                      const heat = l.views > 15 || l.inquiries > 3 ? 'hot' : l.views > 5 || l.inquiries > 0 ? 'warm' : 'cold';
                      return (
                        <div key={l.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                            {l.image && l.image !== DEFAULT_LISTING_IMAGE ? (
                              <img src={l.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Home className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{l.title}</div>
                            <div className="text-[10px] text-gray-500 truncate">{l.address}{l.beds ? ` · ${l.beds}b/${l.baths}ba` : ''}</div>
                            <div className="flex gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400">{l.views} views</span>
                              <span className="text-[10px] text-gray-400">{l.inquiries} leads</span>
                              {l.offers > 0 && <span className="text-[10px] font-semibold" style={{ color: 'var(--bt-egreen)' }}>{l.offers} offers</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>{l.price}</div>
                            <div className={`text-[10px] font-semibold mt-1 ${heat === 'hot' ? 'text-red-600' : heat === 'warm' ? 'text-amber-600' : 'text-blue-500'}`}>
                              {heat === 'hot' ? '🔥 High' : heat === 'warm' ? '⚡ Warm' : '❄ Slow'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Commission Tracker */}
              {(() => {
                const GOAL_KEY = 'commissionGoalTarget';
                const target = typeof window !== 'undefined' ? Number(localStorage.getItem(GOAL_KEY) || '400000') : 400000;
                const monthlyTarget = Math.round(target / 12) || 1;
                const monthPct = Math.min(Math.round((commissionTotal / monthlyTarget) * 100), 100);
                const ytdPct = Math.min(Math.round((commissionTotal / (target || 1)) * 100), 100);
                const sparkHeights = [55, 62, 48, 70, 65, 82, 100];
                const pendingItems = commissionPipeline.filter(c => (c.estimated_commission ?? 0) > 0).slice(0, 2);
                return (
                  <div className="rounded-xl bg-white p-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>Commission Tracker</h3>
                      <span className="text-[10px] text-gray-400">{new Date().toLocaleString('en-ZA', { month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-semibold text-gray-700">Monthly Target</span>
                        <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-terracotta)' }}>{formatMoney(String(commissionTotal), 'ZAR')} / {formatMoney(String(monthlyTarget), 'ZAR')}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(26,60,40,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${monthPct}%`, background: 'linear-gradient(90deg, var(--bt-terracotta), #E8734A)' }} />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{monthPct}% of target — {formatMoney(String(Math.max(0, monthlyTarget - commissionTotal)), 'ZAR')} remaining</div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-semibold text-gray-700">YTD Earned</span>
                        <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>{formatMoney(String(commissionTotal), 'ZAR')} / {formatMoney(String(target), 'ZAR')}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(26,60,40,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${ytdPct}%`, background: 'linear-gradient(90deg, var(--bt-forest), #2D5A40)' }} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Monthly Trend</div>
                      <div className="flex items-end gap-1 h-8">
                        {sparkHeights.map((h, i) => (
                          <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === sparkHeights.length - 1 ? 'var(--bt-terracotta)' : 'rgba(196,86,42,0.2)' }} />
                        ))}
                      </div>
                    </div>
                    {pendingItems.length > 0 && (
                      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                        <div className="px-3 py-1.5 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(26,60,40,0.08)', backgroundColor: '#E8F0EC' }}>
                          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--bt-forest)' }}>Pending Commissions</span>
                          <span className="text-[10px] text-gray-400">{pendingItems.length} deals</span>
                        </div>
                        {pendingItems.map((c, idx) => (
                          <div key={c.mandate_id} className="px-3 py-2 flex items-center justify-between" style={{ borderTop: idx > 0 ? '1px solid rgba(26,60,40,0.06)' : undefined }}>
                            <div>
                              <div className="text-xs font-semibold">{c.property_title}</div>
                              <div className="text-[10px] text-gray-400">{c.listing_status} · {c.commission_rate}% rate</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-terracotta)' }}>{formatMoney(String(c.estimated_commission ?? 0), 'ZAR')}</div>
                              <div className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5" style={{ background: '#FEF3C7', color: '#B45309' }}>PENDING</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── Row C: Lead Funnel + Market Heatmap + Hot Leads + Recent Activity ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Lead Conversion Funnel */}
              <div className="rounded-xl bg-white p-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>Lead Conversion Funnel</h3>
                  <span className="text-[10px] text-gray-400">This month</span>
                </div>
                {(() => {
                  const byStage = crmDashboard.byStage ?? {};
                  const funnelStages = [
                    { label: 'New Leads', key: 'new_lead', color: 'var(--bt-forest)' },
                    { label: 'Contacted', key: 'contacted', color: '#2D5A40' },
                    { label: 'Qualified', key: 'qualified', color: '#4A7C5A' },
                    { label: 'Active Offer', key: 'active_offer', color: '#6B9E7A' },
                    { label: 'Closed', key: 'closed_won', color: 'var(--bt-terracotta)' },
                  ];
                  const counts = funnelStages.map(s => ({ ...s, count: Number(byStage[s.key] ?? 0) }));
                  const maxCount = Math.max(...counts.map(s => s.count), 1);
                  const closed = counts.find(s => s.key === 'closed_won')?.count ?? 0;
                  const totalLeadsBase = Math.max(counts.find(s => s.key === 'new_lead')?.count ?? 0, leads.length, 1);
                  const convRate = ((closed / totalLeadsBase) * 100).toFixed(1);
                  const avgDealVal = crmDashboard.pipelineValue > 0 && leads.length > 0 ? Math.round(crmDashboard.pipelineValue / leads.length) : 0;
                  return (
                    <>
                      <div className="space-y-2">
                        {counts.map(s => (
                          <div key={s.key} className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-gray-600 w-20 shrink-0">{s.label}</span>
                            <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: 'rgba(26,60,40,0.06)' }}>
                              <div className="h-full rounded flex items-center px-2" style={{ width: `${Math.max(Math.round((s.count / maxCount) * 100), s.count > 0 ? 10 : 0)}%`, backgroundColor: s.color }}>
                                {s.count > 0 && <span className="text-[10px] font-bold text-white/80">{s.count}</span>}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 w-5 text-right">{s.count}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Conv. Rate</div>
                          <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-terracotta)' }}>{convRate}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Avg. Value</div>
                          <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>
                            {avgDealVal > 0 ? formatMoney(String(avgDealVal), 'ZAR') : '—'}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Market Heatmap — visual SVG with per-city hotspots */}
              <div className="rounded-xl bg-white p-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>Market Heatmap</h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#DC2626' }}>● High Activity</span>
                </div>
                {(() => {
                  const cityMap = activeListings.reduce<Record<string, { views: number; count: number }>>((acc, l) => {
                    const city = l.address?.split(',').slice(-2, -1)[0]?.trim() ?? 'Unknown';
                    if (!acc[city]) acc[city] = { views: 0, count: 0 };
                    acc[city].views += l.views ?? 0;
                    acc[city].count += 1;
                    return acc;
                  }, {});
                  const cityData = Object.entries(cityMap).sort((a, b) => b[1].views - a[1].views).slice(0, 3);
                  const positions: { top: string; left: string }[] = [{ top: '47%', left: '38%' }, { top: '62%', left: '74%' }, { top: '28%', left: '62%' }];
                  const dotColors = ['#DC2626', '#2563EB', '#C4562A'];
                  return (
                    <>
                      <div className="relative rounded-lg overflow-hidden" style={{ height: 170, backgroundColor: '#E8F0EA' }}>
                        <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full opacity-20">
                          <rect width="400" height="200" fill="#C5D9C8" />
                          <path d="M0,100 Q100,60 200,90 Q300,120 400,80 L400,200 L0,200z" fill="#B0C9B4" opacity="0.6" />
                          <ellipse cx="160" cy="95" rx="60" ry="40" fill="#96B59A" opacity="0.4" />
                          <ellipse cx="300" cy="110" rx="50" ry="35" fill="#96B59A" opacity="0.3" />
                          <line x1="0" y1="100" x2="400" y2="100" stroke="#fff" strokeWidth="1.5" opacity="0.8" />
                          <line x1="200" y1="0" x2="200" y2="200" stroke="#fff" strokeWidth="1.5" opacity="0.8" />
                          <line x1="100" y1="0" x2="100" y2="200" stroke="#fff" strokeWidth="1" opacity="0.5" />
                          <line x1="300" y1="0" x2="300" y2="200" stroke="#fff" strokeWidth="1" opacity="0.5" />
                        </svg>
                        {activeListings.length === 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-xs text-gray-400">Add listings to see market data.</p>
                          </div>
                        ) : cityData.map(([city, data], idx) => (
                          <div key={city} className="absolute" style={{ top: positions[idx]?.top ?? '50%', left: positions[idx]?.left ?? '50%', transform: 'translate(-50%,-50%)' }}>
                            <div className="relative flex items-center justify-center" style={{ width: 14, height: 14 }}>
                              <div className="absolute rounded-full border-2 animate-ping" style={{ width: 28, height: 28, borderColor: dotColors[idx], opacity: 0.35, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                              <div className="rounded-full absolute" style={{ width: 10, height: 10, backgroundColor: dotColors[idx] }} />
                            </div>
                            <div className="absolute whitespace-nowrap bg-white rounded-full px-1.5 py-0.5 shadow-sm text-[9px] font-bold" style={{ top: 18, left: '50%', transform: 'translateX(-50%)', color: 'var(--bt-forest)' }}>
                              {city} <span style={{ color: dotColors[idx] }}>{data.views}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {cityData.map(([city], i) => (
                          <div key={city} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColors[i] }} />
                            <span className="text-[10px] text-gray-400">{city}</span>
                          </div>
                        ))}
                        <span className="ml-auto text-[10px] text-gray-400">Views last 30d</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Hot Leads + Recent Activity stacked */}
              <div className="flex flex-col gap-4">
                {/* Hot Leads */}
                <div className="rounded-xl bg-white p-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>Hot Leads</h3>
                    <button onClick={() => setSelectedTab('crm')} className="text-[10px] font-semibold" style={{ color: 'var(--bt-terracotta)' }}>All Leads →</button>
                  </div>
                  {leads.filter(l => l.temperature === 'hot' || l.temperature === 'warm').length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No hot leads yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {leads.filter(l => l.temperature === 'hot' || l.temperature === 'warm').slice(0, 3).map((lead) => {
                        const initials = lead.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                        const avatarColors = ['#1A3C28', '#C4562A', '#2D5A40', '#B89040'];
                        const avatarBg = avatarColors[lead.name.charCodeAt(0) % avatarColors.length];
                        const tempBg = lead.temperature === 'hot' ? '#FEF2F2' : '#FFFBEB';
                        const tempColor = lead.temperature === 'hot' ? '#DC2626' : '#D97706';
                        return (
                          <div key={lead.id} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: avatarBg }}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate">{lead.name}</div>
                              <div className="text-[10px] text-gray-500 truncate">
                                {lead.type}{lead.budget_min ? ` · R${Number(lead.budget_min) >= 1000000 ? (Number(lead.budget_min) / 1000000).toFixed(1) + 'M' : Math.round(Number(lead.budget_min) / 1000) + 'K'}` : ''}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: tempBg, color: tempColor }}>
                              {lead.temperature === 'hot' ? '🔥 Hot' : '🌡 Warm'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="rounded-xl bg-white p-4 flex-1" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                  <h3 className="font-semibold text-sm mb-3" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>Recent Activity</h3>
                  <div className="space-y-2">
                    {activityFeed.length === 0 ? (
                      <p className="text-xs text-gray-500">No recent activity yet.</p>
                    ) : (
                      activityFeed.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#E8F0EC', color: 'var(--bt-forest)' }}>
                            <Activity className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{item.property_title ?? item.entity_type}</div>
                            <div className="text-[10px] text-gray-500">{item.action.replace(/_/g, ' ')} · {new Date(item.created_at).toLocaleDateString('en-ZA', { dateStyle: 'short' })}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Listings Tab */}
        {selectedTab === "listings" && (() => {
          // ── Derived data ────────────────────────────────────────────────────────
          const totalOffers = activeListings.reduce((s, l) => s + l.offers, 0);

          const hotListings = activeListings.filter(l => listingHeat(l) === 'hot');
          const staleListings = activeListings.filter(l => listingCategory(l) === 'stale');
          const expiringMandates = agentMandates.filter(m => {
            if (m.status !== 'active') return false;
            const daysLeft = Math.ceil((new Date(m.end_date).getTime() - Date.now()) / 86400000);
            return daysLeft <= 14 && daysLeft >= 0;
          });

          const filteredListings = activeListings.filter(l => {
            const matchesSearch = !listingsSearch ||
              l.title.toLowerCase().includes(listingsSearch.toLowerCase()) ||
              l.address.toLowerCase().includes(listingsSearch.toLowerCase());
            const matchesType = listingTypeFilter === 'all' || l.listingType === listingTypeFilter;
            const cat = listingCategory(l);
            const heat = listingHeat(l);
            const matchesFilter =
              listingsFilter === 'all' ||
              (listingsFilter === 'hot' && heat === 'hot') ||
              (listingsFilter === 'active' && cat === 'active') ||
              (listingsFilter === 'under_offer' && cat === 'under_offer') ||
              (listingsFilter === 'stale' && cat === 'stale') ||
              (listingsFilter === 'draft' && cat === 'draft') ||
              (listingsFilter === 'sold' && cat === 'sold');
            return matchesSearch && matchesType && matchesFilter;
          });

          const listingsWithOffers = activeListings.filter(l => l.offers > 0);

          const PORTALS: { key: string; name: string; match: (n: string) => boolean }[] = [
            { key: 'p24',        name: 'P24',       match: n => n.toLowerCase().includes('property24') || n.toLowerCase().includes('p24') },
            { key: 'pp',         name: 'PP',        match: n => n.toLowerCase().includes('private') || n.toLowerCase().includes('pp') },
            { key: 'gumtree',    name: 'GTR',       match: n => n.toLowerCase().includes('gumtree') },
            { key: 'lightstone', name: 'LST',       match: n => n.toLowerCase().includes('lightstone') },
          ];

          return (
            <div>
              {/* ── Banners ──────────────────────────────────────────────────── */}
              {isLoadingListings && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 mb-4">
                  Loading listings from database...
                </div>
              )}
              {!isLoadingListings && listingError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
                  {listingError}
                </div>
              )}
              {duplicateError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between mb-4">
                  <span>Duplicate failed: {duplicateError}</span>
                  <button onClick={() => setDuplicateError("")} className="ml-4 text-red-500 hover:text-red-700 font-bold">✕</button>
                </div>
              )}

              {/* ── Smart Alerts Bar ─────────────────────────────────────────── */}
              {(hotListings.length > 0 || staleListings.length > 0 || expiringMandates.length > 0) && (
                <div className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 overflow-x-auto mb-4" style={{ border: '1px solid rgba(26,60,40,0.12)', flexWrap: 'wrap' }}>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shrink-0 pr-2.5 mr-1 border-r" style={{ color: '#6B8F7A', borderColor: 'rgba(26,60,40,0.12)', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Smart Alerts
                  </span>
                  {hotListings.length > 0 && (
                    <button
                      onClick={() => setListingsFilter('hot')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold shrink-0 transition-opacity hover:opacity-80"
                      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
                      🔥 {hotListings.length} hot listing{hotListings.length > 1 ? 's' : ''} — high demand
                    </button>
                  )}
                  {staleListings.length > 0 && (
                    <button
                      onClick={() => setListingsFilter('stale')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold shrink-0 transition-opacity hover:opacity-80"
                      style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                      ⚠ {staleListings.length} stale listing{staleListings.length > 1 ? 's' : ''} — consider a price drop
                    </button>
                  )}
                  {expiringMandates.map(m => {
                    const daysLeft = Math.ceil((new Date(m.end_date).getTime() - Date.now()) / 86400000);
                    const listing = activeListings.find(l => l.id === m.property_id);
                    return (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold shrink-0"
                        style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FDBA74' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600 inline-block" />
                        📅 Mandate expiring: {listing?.title ?? 'Listing'} in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* ── Toolbar: Search + Type Filters + View Toggle ─────────────── */}
              <div className="flex items-center gap-2.5 flex-wrap mb-4">
                {/* Search */}
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2" style={{ border: '1px solid rgba(26,60,40,0.12)', color: '#6B8F7A', flex: '1 1 180px', maxWidth: 280 }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ opacity: 0.5, flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    className="outline-none bg-transparent flex-1 text-xs"
                    placeholder="Search listings by title or address…"
                    value={listingsSearch}
                    onChange={e => setListingsSearch(e.target.value)}
                    style={{ color: '#1A3C28', fontFamily: 'var(--font-sans)' }}
                  />
                </div>

                {/* Type filter buttons */}
                {[
                  { key: 'for_sale',    label: 'For Sale',    activeBg: '#1A3C28', activeColor: '#F2E8D5' },
                  { key: 'to_rent',     label: 'To Rent',     activeBg: '#B45309', activeColor: '#fff' },
                  { key: 'development', label: 'Dev',         activeBg: '#7C3AED', activeColor: '#fff' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setListingTypeFilter(listingTypeFilter === t.key ? 'all' : t.key)}
                    className="text-[11px] font-bold px-3 py-2 rounded-lg uppercase transition-opacity"
                    style={{
                      fontFamily: 'var(--font-ibm-plex-mono)',
                      letterSpacing: '0.05em',
                      background: listingTypeFilter === t.key ? t.activeBg : 'rgba(26,60,40,0.07)',
                      color: listingTypeFilter === t.key ? t.activeColor : '#6B8F7A',
                      border: 'none',
                      opacity: listingTypeFilter !== 'all' && listingTypeFilter !== t.key ? 0.5 : 1,
                    }}
                  >
                    {t.label}
                  </button>
                ))}

                {/* View toggle */}
                <div className="flex ml-auto rounded-lg overflow-hidden bg-white" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                  <button
                    onClick={() => setListingsView('cards')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
                    style={{ background: listingsView === 'cards' ? '#1A3C28' : 'transparent', color: listingsView === 'cards' ? '#F2E8D5' : '#6B8F7A', border: 'none' }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Cards
                  </button>
                  <button
                    onClick={() => setListingsView('table')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
                    style={{ background: listingsView === 'table' ? '#1A3C28' : 'transparent', color: listingsView === 'table' ? '#F2E8D5' : '#6B8F7A', border: 'none' }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    Table
                  </button>
                </div>
              </div>

              {/* ── Listing Cards Grid ────────────────────────────────────────── */}
              {listingsView === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-7">
                  {!isLoadingListings && filteredListings.length === 0 && (
                    <div className="col-span-2 rounded-xl bg-white py-12 text-center text-xs" style={{ border: '1px solid rgba(26,60,40,0.12)', color: '#6B8F7A', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                      No listings match the current filters.
                    </div>
                  )}
                  {filteredListings.map(listing => {
                    const heat = listingHeat(listing);
                    const cat = listingCategory(listing);
                    const score = healthScore(listing);
                    // ring circumference for r=14: 2π×14 ≈ 87.96
                    const ringColor = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444';
                    const isStale = cat === 'stale';
                    const mandate = agentMandates.find(m => m.property_id === listing.id && m.status === 'active');
                    const mandateDaysLeft = mandate ? Math.ceil((new Date(mandate.end_date).getTime() - Date.now()) / 86400000) : null;
                    const mandateTotalDays = mandate ? Math.max(1, Math.ceil((new Date(mandate.end_date).getTime() - new Date(mandate.start_date).getTime()) / 86400000)) : null;
                    const mandatePct = mandateDaysLeft !== null && mandateTotalDays !== null ? Math.max(0, Math.min(100, (mandateDaysLeft / mandateTotalDays) * 100)) : null;
                    const mandateBarColor = mandateDaysLeft !== null && mandateDaysLeft <= 7 ? '#DC2626' : mandateDaysLeft !== null && mandateDaysLeft <= 21 ? '#F59E0B' : '#22C55E';
                    const syndicationList = listingSyndications[listing.id] ?? [];
                    const tourCount = agentViewings.filter(v => v.property_id === listing.id).length;
                    const heatBorderColor = heat === 'hot' ? 'rgba(220,38,38,0.28)' : heat === 'warm' ? 'rgba(217,119,6,0.28)' : 'rgba(26,60,40,0.12)';
                    const typeBg = listing.listingType === 'for_sale' ? '#1A3C28' : listing.listingType === 'to_rent' ? '#B45309' : '#7C3AED';
                    const typeLabel = listing.listingType === 'for_sale' ? 'For Sale' : listing.listingType === 'to_rent' ? 'To Rent' : listing.listingType === 'development' ? 'Dev' : '';
                    const heatBadge = heat === 'hot'
                      ? { bg: '#FEE2E2', color: '#DC2626', label: '🔥 High' }
                      : heat === 'warm'
                      ? { bg: '#FEF3C7', color: '#D97706', label: '⚡ Warm' }
                      : { bg: '#DBEAFE', color: '#2563EB', label: '❄ Slow' };

                    return (
                      <div
                        key={listing.id}
                        className="rounded-xl overflow-hidden bg-white transition-all hover:shadow-lg hover:-translate-y-px"
                        style={{ border: `1px solid ${heatBorderColor}` }}
                      >
                        {/* ── Image Area ── */}
                        <div style={{ position: 'relative', width: '100%', height: 140, overflow: 'hidden', background: 'linear-gradient(135deg, #1A3C28 0%, #2D5A3D 100%)' }}>
                          <img
                            src={listing.image}
                            alt={listing.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.42) 100%)' }} />
                          {/* Type badge — top-left */}
                          {typeLabel && (
                            <span style={{ position: 'absolute', top: 10, left: 10, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 5, background: typeBg, color: '#F2E8D5' }}>
                              {typeLabel}
                            </span>
                          )}
                          {/* Heat badge — top-right */}
                          <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: heatBadge.bg, color: heatBadge.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {heatBadge.label}
                          </span>
                          {/* Health ring — bottom-right (r=14, circumference≈87.96) */}
                          <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
                            <svg width="38" height="38" viewBox="0 0 38 38">
                              <circle cx="19" cy="19" r="14" fill="white" fillOpacity="0.92" stroke="rgba(26,60,40,0.12)" strokeWidth="4.5" />
                              <circle cx="19" cy="19" r="14" fill="none" stroke={ringColor} strokeWidth="4.5"
                                strokeDasharray={`${Math.round((score / 100) * 87.96)} 87.96`} strokeDashoffset="22"
                                strokeLinecap="round" transform="rotate(-90 19 19)" />
                              <text x="19" y="23" textAnchor="middle" fontFamily="var(--font-fraunces),serif" fontSize="9" fontWeight="700" fill="#1A3C28">{score}</text>
                            </svg>
                          </div>
                        </div>

                        {/* ── Card Body ── */}
                        <div style={{ padding: '14px 16px 8px' }}>
                          <div className="truncate" style={{ fontFamily: 'var(--font-fraunces)', fontSize: 15, fontWeight: 700, color: '#1A3C28', lineHeight: 1.25, marginBottom: 3 }}>{listing.title}</div>
                          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: '#6B8F7A', marginBottom: 10 }}>{listing.beds}b · {listing.baths}ba · {listing.sqm}m²</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: '#1A3C28', lineHeight: 1 }}>{listing.price}</span>
                            <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: isStale ? '#DC2626' : '#059669' }}>⏱ {listing.daysOnMarket}d{isStale ? ' ⚠' : ''}</span>
                          </div>
                        </div>

                        {/* ── Metrics Strip ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid rgba(26,60,40,0.08)', borderBottom: '1px solid rgba(26,60,40,0.08)', background: 'rgba(26,60,40,0.02)' }}>
                          {[
                            { val: listing.views,     lbl: 'Views',     highlight: false },
                            { val: listing.inquiries,  lbl: 'Inquiries', highlight: false },
                            { val: listing.offers,    lbl: 'Offers',    highlight: listing.offers > 0 },
                            { val: tourCount,         lbl: 'Tours',     highlight: false },
                          ].map((m, mi) => (
                            <div key={m.lbl} style={{ padding: '8px 0', textAlign: 'center', borderRight: mi < 3 ? '1px solid rgba(26,60,40,0.08)' : 'none' }}>
                              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 15, fontWeight: 700, color: m.highlight ? '#C4562A' : '#1A3C28', lineHeight: 1 }}>{m.val}</div>
                              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B8F7A', marginTop: 2 }}>{m.lbl}</div>
                            </div>
                          ))}
                        </div>

                        {/* ── AI Insight / Stale Nudge ── */}
                        {isStale && (
                          <div style={{ margin: '10px 16px 0', padding: '8px 10px', borderRadius: 7, background: 'linear-gradient(135deg, rgba(0,232,122,0.06), rgba(26,60,40,0.04))', border: '1px solid rgba(0,232,122,0.2)', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: '#1A3C28' }}>
                            ✦ {listing.daysOnMarket} days on market — consider a price reduction
                          </div>
                        )}

                        {/* ── Portal Row + Mandate Bar ── */}
                        <div style={{ padding: '10px 16px' }}>
                          {syndicationList.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: mandate ? 10 : 4 }}>
                              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B8F7A' }}>Portals:</span>
                              {syndicationList.slice(0, 6).map(r => {
                                const dotStyle = r.sync_status === 'synced'
                                  ? { bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' }
                                  : r.sync_status === 'pending'
                                  ? { bg: '#FEF9C3', color: '#854D0E', border: '#FEF08A' }
                                  : r.sync_status === 'failed'
                                  ? { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' }
                                  : { bg: '#F1F5F9', color: '#94A3B8', border: '#E2E8F0' };
                                const abbr = (r.portal_name.match(/[A-Z]/g) ?? []).join('').slice(0, 3) || r.portal_name.slice(0, 3).toUpperCase();
                                return (
                                  <div
                                    key={r.id}
                                    title={`${r.portal_name} – ${r.sync_status}`}
                                    style={{ width: 22, height: 22, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 7, fontWeight: 700, background: dotStyle.bg, color: dotStyle.color, border: `1px solid ${dotStyle.border}` }}
                                  >
                                    {abbr}
                                  </div>
                                );
                              })}
                              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, color: '#6B8F7A', marginLeft: 4 }}>
                                {syndicationList.filter(r => r.sync_status === 'synced').length} live
                                {syndicationList.filter(r => r.sync_status !== 'synced').length > 0
                                  ? ` · ${syndicationList.filter(r => r.sync_status !== 'synced').length} pending`
                                  : ' ✓'}
                              </span>
                            </div>
                          )}
                          {mandate && mandateDaysLeft !== null && mandatePct !== null && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, color: '#6B8F7A', marginBottom: 4 }}>
                                <span>Mandate expires</span>
                                <span style={{ color: mandateBarColor, fontWeight: 600 }}>
                                  {mandateDaysLeft > 0 ? `${mandateDaysLeft} days remaining` : 'Expired'}
                                  {mandateDaysLeft <= 7 && mandateDaysLeft > 0 ? ' ⚠' : ''}
                                </span>
                              </div>
                              <div style={{ height: 4, background: 'rgba(26,60,40,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${mandatePct}%`, background: mandateBarColor, borderRadius: 2 }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ── Card Actions ── */}
                        <div style={{ display: 'flex', gap: 6, padding: '6px 16px 12px', borderTop: '1px solid rgba(26,60,40,0.07)' }}>
                          <Link
                            to={`/app/property/${listing.id}`}
                            style={{ flex: 1, display: 'block', textAlign: 'center', padding: '7px 0', fontSize: 11, fontWeight: 700, borderRadius: 8, background: '#1A3C28', color: '#F2E8D5', border: '1px solid #1A3C28' }}
                          >
                            View
                          </Link>
                          <button
                            onClick={() => { const raw = rawListings.find(r => r.id === listing.id); if (raw) setEditingListing(raw); }}
                            style={{ flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid rgba(26,60,40,0.15)', color: '#1A3C28', background: 'transparent', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          {listing.offers > 0 ? (
                            <Link
                              to={`/app/property/${listing.id}`}
                              style={{ flex: 1, display: 'block', textAlign: 'center', padding: '7px 0', fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid rgba(196,86,42,0.3)', color: '#C4562A', background: 'rgba(196,86,42,0.06)' }}
                            >
                              Offers
                            </Link>
                          ) : mandate && mandateDaysLeft !== null && mandateDaysLeft <= 21 ? (
                            <button style={{ flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid rgba(217,119,6,0.3)', color: '#D97706', background: 'rgba(217,119,6,0.06)', cursor: 'pointer' }}>
                              Renew
                            </button>
                          ) : (
                            <button
                              onClick={() => { void handleDuplicateListing(listing.id); }}
                              disabled={duplicatingIds.has(listing.id)}
                              style={{ flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid rgba(26,60,40,0.15)', color: '#1A3C28', background: 'transparent', cursor: 'pointer', opacity: duplicatingIds.has(listing.id) ? 0.5 : 1 }}
                            >
                              {duplicatingIds.has(listing.id) ? '…' : 'Dupe'}
                            </button>
                          )}
                          <button
                            onClick={() => { void openSyndication(listing.id, listing.title); }}
                            style={{ flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid rgba(26,60,40,0.15)', color: '#1A3C28', background: 'transparent', cursor: 'pointer' }}
                          >
                            Sync
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Table View ────────────────────────────────────────────────── */}
              {listingsView === 'table' && (
                <div className="rounded-xl bg-white overflow-x-auto mb-7" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(26,60,40,0.03)', borderBottom: '1px solid rgba(26,60,40,0.12)' }}>
                      <tr>
                        {['Property', 'Heat', 'Price', 'Specs', 'Performance', 'Health', 'Actions'].map(h => (
                          <th key={h} className="text-left" style={{ padding: '12px 16px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6B8F7A' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {!isLoadingListings && filteredListings.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-sm" style={{ color: '#6B8F7A' }}>
                            No listings match the current filters.
                          </td>
                        </tr>
                      )}
                      {filteredListings.map(listing => {
                        const heat = listingHeat(listing);
                        const score = healthScore(listing);
                        const heatChip = heat === 'hot'
                          ? { bg: '#FEE2E2', color: '#DC2626', label: '🔥 High' }
                          : heat === 'warm'
                          ? { bg: '#FEF3C7', color: '#B45309', label: '⚡ Warm' }
                          : { bg: '#DBEAFE', color: '#2563EB', label: '❄ Slow' };
                        const isStale = listingCategory(listing) === 'stale';
                        return (
                          <tr key={listing.id} style={{ borderBottom: '1px solid rgba(26,60,40,0.08)' }} className="hover:bg-gray-50">
                            <td style={{ padding: '12px 16px' }}>
                              <div className="flex items-center gap-2.5">
                                <img src={listing.image} alt={listing.title} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs truncate" style={{ color: isStale ? '#DC2626' : '#1A3C28' }}>{listing.title}</div>
                                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: isStale ? '#DC2626' : '#6B8F7A', marginTop: 1 }}>{listing.daysOnMarket} days on market{isStale ? ' ⚠' : ''}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: heatChip.bg, color: heatChip.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {heatChip.label}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 13, fontWeight: 700, color: '#1A3C28' }}>{listing.price}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: 11, color: '#6B8F7A' }}>{listing.beds}b · {listing.baths}ba · {listing.sqm}m²</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: 11, color: '#6B8F7A' }}>{listing.views} views · {listing.inquiries} inq · {listing.offers} offers</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <HealthBadge score={score} />
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div className="flex items-center gap-1.5">
                                <Button size="sm" variant="outline" asChild>
                                  <Link to={`/app/property/${listing.id}`}>View</Link>
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { const raw = rawListings.find(r => r.id === listing.id); if (raw) setEditingListing(raw); }}>
                                  <PenLine className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" disabled={duplicatingIds.has(listing.id)} onClick={() => { void handleDuplicateListing(listing.id); }}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { void openSyndication(listing.id, listing.title); }}>
                                  <Share2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Bottom Row: Offer Pipeline + Syndication Matrix ───────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Offer Pipeline */}
                <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(26,60,40,0.12)' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 14, fontWeight: 700, color: '#1A3C28' }}>Offer Pipeline</span>
                      <span style={{ display: 'inline-block', background: '#FFFBEB', border: '1.5px dashed #F59E0B', color: '#92400E', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, fontFamily: 'var(--font-ibm-plex-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: '#6B8F7A' }}>
                      {listingsWithOffers.length} listing{listingsWithOffers.length !== 1 ? 's' : ''} · {totalOffers} offer{totalOffers !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {/* 3-cell tally */}
                  <div className="grid grid-cols-3 border-b" style={{ borderColor: 'rgba(26,60,40,0.12)' }}>
                    {[
                      { label: 'With Offers',  value: listingsWithOffers.length,                                                                           color: '#1A3C28' },
                      { label: 'Total Offers', value: totalOffers,                                                                                          color: '#C4562A' },
                      { label: 'Avg / Listing',value: listingsWithOffers.length > 0 ? (totalOffers / listingsWithOffers.length).toFixed(1) : '0',           color: '#059669' },
                    ].map((t, i) => (
                      <div key={t.label} className="text-center" style={{ padding: '12px 16px', borderRight: i < 2 ? '1px solid rgba(26,60,40,0.12)' : 'none' }}>
                        <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: t.color, lineHeight: 1 }}>{t.value}</div>
                        <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6B8F7A', marginTop: 3 }}>{t.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Listing rows */}
                  <div className="px-5">
                    {listingsWithOffers.length === 0 ? (
                      <div className="py-8 text-center text-xs" style={{ color: '#6B8F7A', fontFamily: 'var(--font-ibm-plex-mono)' }}>
                        No active offers at this time.
                      </div>
                    ) : (
                      listingsWithOffers.slice(0, 5).map(listing => (
                        <div key={listing.id} className="flex items-center gap-3.5 border-b last:border-b-0" style={{ padding: '11px 0', borderColor: 'rgba(26,60,40,0.10)' }}>
                          <img src={listing.image} alt={listing.title} style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate" style={{ color: '#1A3C28' }}>{listing.title}</div>
                            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: '#6B8F7A', marginTop: 1 }}>{listing.offers} offer{listing.offers > 1 ? 's' : ''} received</div>
                          </div>
                          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 13, fontWeight: 700, color: '#C4562A', flexShrink: 0, marginRight: 8 }}>{listing.price}</div>
                          <Link to={`/app/property/${listing.id}`} className="text-[11px] font-semibold shrink-0" style={{ color: '#C4562A' }}>Review →</Link>
                        </div>
                      ))
                    )}
                  </div>
                  {listingsWithOffers.length > 5 && (
                    <div className="px-5 py-2.5 text-center border-t" style={{ borderColor: 'rgba(26,60,40,0.10)' }}>
                      <button className="text-xs font-semibold" style={{ color: '#6B8F7A' }}>View all {listingsWithOffers.length} listings with offers →</button>
                    </div>
                  )}
                </div>

                {/* Syndication Matrix */}
                <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(26,60,40,0.12)' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 14, fontWeight: 700, color: '#1A3C28' }}>Syndication Status</span>
                      <span style={{ display: 'inline-block', background: '#FFFBEB', border: '1.5px dashed #F59E0B', color: '#92400E', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, fontFamily: 'var(--font-ibm-plex-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New</span>
                    </div>
                    <button
                      onClick={() => { if (activeListings[0]) void openSyndication(activeListings[0].id, activeListings[0].title); }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-md transition-all"
                      style={{ padding: '5px 10px', background: 'rgba(242,232,213,0.08)', color: 'rgba(26,60,40,0.7)', border: '1px solid rgba(26,60,40,0.15)' }}
                    >
                      Sync All →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'rgba(26,60,40,0.03)', borderBottom: '1px solid rgba(26,60,40,0.12)' }}>
                        <tr>
                          <th style={{ padding: '9px 16px', textAlign: 'left', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6B8F7A' }}>Listing</th>
                          {PORTALS.map(p => (
                            <th key={p.key} style={{ padding: '9px 12px', textAlign: 'center', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6B8F7A' }}>{p.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeListings.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: '#6B8F7A', fontFamily: 'var(--font-ibm-plex-mono)' }}>No listings to display.</td>
                          </tr>
                        )}
                        {activeListings.slice(0, 5).map(listing => {
                          const synds = listingSyndications[listing.id] ?? [];
                          return (
                            <tr key={listing.id} style={{ borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                              <td style={{ padding: '9px 16px', fontSize: 12, fontWeight: 500, color: '#1A3C28' }}>
                                <span className="block truncate" style={{ maxWidth: 110 }}>{listing.title.split(',')[0]}</span>
                              </td>
                              {PORTALS.map(p => {
                                const record = synds.find(r => p.match(r.portal_name));
                                const isLive = record?.sync_status === 'synced';
                                const isPending = record?.sync_status === 'pending';
                                const isFailed = record?.sync_status === 'failed';
                                return (
                                  <td key={p.key} style={{ padding: '9px 12px', textAlign: 'center' }}>
                                    <span className="inline-flex flex-col items-center gap-0.5">
                                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: isLive ? '#22C55E' : isPending ? '#F59E0B' : isFailed ? '#EF4444' : '#CBD5E1' }} />
                                      <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 8, fontWeight: 600, color: isLive ? '#15803D' : isPending ? '#B45309' : isFailed ? '#DC2626' : '#94A3B8' }}>
                                        {isLive ? 'Live' : isPending ? 'Pend' : isFailed ? 'Fail' : '—'}
                                      </span>
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Legend + Fill Gaps */}
                  <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 border-t" style={{ borderColor: 'rgba(26,60,40,0.12)' }}>
                    <div className="flex gap-3">
                      {[
                        { dot: '#22C55E', label: 'Live',       textColor: '#15803D' },
                        { dot: '#F59E0B', label: 'Pending',    textColor: '#B45309' },
                        { dot: '#EF4444', label: 'Failed',     textColor: '#DC2626' },
                        { dot: '#CBD5E1', label: 'Not Listed', textColor: '#94A3B8' },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5" style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 600, color: l.textColor }}>
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.dot }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => { if (activeListings[0]) void openSyndication(activeListings[0].id, activeListings[0].title); }}
                      style={{ fontSize: 10, fontWeight: 700, padding: '5px 12px', borderRadius: 6, background: 'rgba(196,86,42,0.1)', color: '#C4562A', border: '1px solid rgba(196,86,42,0.2)', cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.04em' }}
                    >
                      Fill Gaps →
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Mandates Tab */}
        {selectedTab === "mandates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>Mandate Portfolio</h2>
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
              <div className="rounded-xl bg-white py-12 text-center text-gray-400" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: 'var(--bt-forest)' }} />
                <p className="text-sm">Loading mandates…</p>
              </div>
            ) : agentMandates.length === 0 ? (
              <div className="rounded-xl bg-white py-12 text-center text-gray-400" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No mandates found. Mandates are created from individual property listings.</p>
              </div>
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
                <div className="rounded-xl bg-white overflow-x-auto" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                  <table className="w-full">
                    <thead style={{ backgroundColor: '#E8F0EC' }} className="border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--bt-forest)' }}>Property</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--bt-forest)' }}>Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--bt-forest)' }}>Commission</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--bt-forest)' }}>Period</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--bt-forest)' }}>Signatures</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--bt-forest)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {agentMandates.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <Link to={`/app/property/${m.property_id}`} className="text-sm font-medium text-[#1A3C28] hover:underline">
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
                              <div className={m.signed_by_agent_at ? 'text-green-600' : 'text-gray-400'}>
                                {m.signed_by_agent_at ? '✓ Agent' : '○ Agent unsigned'}
                              </div>
                              <div className={m.signed_by_seller_at ? 'text-green-600' : 'text-gray-400'}>
                                {m.signed_by_seller_at ? '✓ Seller' : '○ Seller unsigned'}
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
                </div>
              </>
            )}
          </div>
        )}

        {/* CRM Tab */}
        {selectedTab === "crm" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>Lead Pipeline</h2>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                  <button onClick={() => setCrmView("table")} className={`px-3 py-1.5 font-medium transition-colors ${crmView === "table" ? "bg-[#1A3C28] text-[#F2E8D5]" : "bg-background text-muted-foreground hover:bg-accent"}`}>Table</button>
                  <button onClick={() => setCrmView("kanban")} className={`px-3 py-1.5 font-medium transition-colors ${crmView === "kanban" ? "bg-[#1A3C28] text-[#F2E8D5]" : "bg-background text-muted-foreground hover:bg-accent"}`}>Kanban</button>
                </div>
                <Button
                  onClick={() => setShowCreateLead(true)}
                  className="bg-[#1A3C28] hover:bg-[#2D5A40] text-[#F2E8D5] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> New Lead
                </Button>
              </div>
            </div>

            {/* CRM Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-white p-4 text-center" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>{crmDashboard.totalLeads}</div>
                <div className="text-xs text-gray-500 mt-1">Total Leads</div>
              </div>
              <div className="rounded-xl bg-white p-4 text-center" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-terracotta)' }}>{crmDashboard.hotLeads}</div>
                <div className="text-xs text-gray-500 mt-1">Hot Leads</div>
              </div>
              <div className="rounded-xl bg-white p-4 text-center" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-amber)' }}>{crmDashboard.activeDeals}</div>
                <div className="text-xs text-gray-500 mt-1">Active Deals</div>
              </div>
              <div className="rounded-xl bg-white p-4 text-center" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--bt-forest)' }}>{crmDashboard.recentActivities?.length ?? 0}</div>
                <div className="text-xs text-gray-500 mt-1">Recent Activities</div>
              </div>
            </div>

            {/* Temperature breakdown pills */}
            {Object.keys(crmDashboard.byTemperature ?? {}).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(crmDashboard.byTemperature ?? {}).map(([temp, count]) => (
                  <div key={temp} className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700 capitalize">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {temp.replace(/_/g, " ")} <span className="text-gray-400">({count as number})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Status filter */}
            <div className="flex flex-wrap gap-2">
              {["all", ...LEAD_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => { setLeadStatusFilter(s); setLeadPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    leadStatusFilter === s ? "bg-[#1A3C28] text-[#F2E8D5]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "all" ? "All" : s.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {/* Stale leads section */}
            {leads.filter((l) => Math.floor((Date.now() - new Date(l.updated_at ?? l.created_at).getTime()) / (1000 * 60 * 60 * 24)) > 14).length > 0 && (() => {
              const staleLeads = leads.filter((l) => Math.floor((Date.now() - new Date(l.updated_at ?? l.created_at).getTime()) / (1000 * 60 * 60 * 24)) > 14);
              return (
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#B89040] select-none list-none py-2">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    {staleLeads.length} stale lead{staleLeads.length > 1 ? "s" : ""} (no activity in 14+ days)
                  </summary>
                  <div className="mt-2 rounded-xl bg-white overflow-hidden" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                    <div className="divide-y divide-gray-100">
                      {staleLeads.map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#E8F0EC]/30">
                          <div>
                            <p className="text-sm font-medium">{lead.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{lead.type} · {lead.stage?.replace(/_/g, " ")}</p>
                          </div>
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="text-xs text-[#1A3C28] font-medium hover:underline"
                          >
                            Log Contact
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              );
            })()}

            {/* Leads table / kanban */}
            {isLoadingCrm ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : crmError ? (
              <div className="rounded-xl bg-white p-6 text-center text-red-600" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                <p>{crmError}</p>
              </div>
            ) : crmView === "kanban" ? (
              <LeadKanban
                leads={leads}
                onStatusChange={(id, status) => {
                  const token = getAccessToken();
                  if (!token) return;
                  leadsApi.update(token, id, { stage: status })
                    .then((updated: LeadRow) => setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l)))
                    .catch(() => {});
                }}
              />
            ) : leads.length === 0 ? (
              <div className="rounded-xl bg-white py-16 text-center text-gray-400" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No leads yet</p>
                <p className="text-sm mt-1">Create your first lead to start tracking your pipeline</p>
              </div>
            ) : (
              <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#E8F0EC' }} className="border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Source</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Notes</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Updated</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leads.map((lead) => {
                        const statusColours: Record<string, string> = {
                          new: "bg-gray-100 text-gray-700",
                          contacted: "bg-blue-100 text-blue-700",
                          qualified: "bg-cyan-100 text-cyan-700",
                          active: "bg-yellow-100 text-yellow-700",
                          under_contract: "bg-orange-100 text-orange-700",
                          closed: "bg-green-100 text-green-700",
                          lost: "bg-red-100 text-red-600",
                        };
                        return (
                          <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium">{lead.name}</p>
                              {lead.email && <p className="text-xs text-gray-500 truncate max-w-[160px]">{lead.email}</p>}
                              {lead.phone && <p className="text-xs text-gray-400">{lead.phone}</p>}
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="capitalize text-gray-600">{lead.source?.replace(/_/g, " ") ?? "—"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColours[lead.stage] ?? "bg-gray-100 text-gray-700"}`}>
                                {lead.stage.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell max-w-[200px]">
                              <p className="text-gray-500 truncate">{lead.notes ?? "—"}</p>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                              {new Date(lead.updated_at).toLocaleDateString("en-ZA")}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 px-2"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  const token = getAccessToken();
                                  if (!token) return;
                                  setIsLoadingActivities(true);
                                  leadsApi.listActivities(token, lead.id)
                                    .then(setLeadActivities)
                                    .finally(() => setIsLoadingActivities(false));
                                }}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {leadTotal > 20 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Showing {(leadPage - 1) * 20 + 1}–{Math.min(leadPage * 20, leadTotal)} of {leadTotal}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={leadPage === 1}
                        onClick={() => setLeadPage((p) => p - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={leadPage * 20 >= leadTotal}
                        onClick={() => setLeadPage((p) => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Viewings Tab */}
        {selectedTab === "viewings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>Viewings & Open Houses</h2>
              <div className="flex items-center gap-2">
                {/* List / Calendar toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewingsView("list")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewingsView === "list" ? "bg-white text-[#1A3C28] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <ListIcon className="w-4 h-4" />
                    List
                  </button>
                  <button
                    onClick={() => setViewingsView("calendar")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewingsView === "calendar" ? "bg-white text-[#1A3C28] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </button>
                </div>
                <Button
                  onClick={() => {
                    setScheduleViewingForm({ propertyId: "", viewingType: "physical", scheduledAt: "", durationMinutes: 30, buyerContactName: "", buyerContactEmail: "", buyerContactPhone: "", notes: "" });
                    setScheduleViewingError("");
                    setShowScheduleViewing(true);
                  }}
                  variant="outline"
                  disabled={activeListings.length === 0}
                  title={activeListings.length === 0 ? "No listings available" : undefined}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Viewing
                </Button>
                <Button
                  onClick={() => setShowOpenHouseModal(true)}
                  className="bg-[#1A3C28] hover:bg-[#2D5A40] text-[#F2E8D5]"
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
              <div className="rounded-xl bg-white py-12 text-center text-gray-400" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: 'var(--bt-forest)' }} />
                <p className="text-sm">Loading viewings…</p>
              </div>
            ) : viewingsView === "calendar" ? (
              /* ── Calendar View ── */
              <div className="rounded-xl bg-white p-4 md:p-6" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
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
                          !inMonth ? "bg-gray-50" : "bg-white hover:bg-[#E8F0EC]"
                        } ${isSelected ? "ring-2 ring-inset ring-[#1A3C28]" : ""}`}
                      >
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? "bg-[#1A3C28] text-white" : inMonth ? "text-gray-700" : "text-gray-300"
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
                              <div className="flex items-center gap-2 flex-wrap">
                                {v.status === 'requested' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7 px-2"
                                      disabled={confirmingId === v.id}
                                      onClick={() => void handleConfirmViewing(v.id)}
                                    >
                                      {confirmingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Accept"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => { setDecliningViewingId(v.id); setDeclineForm({ reason: "", alternativeDates: [], message: "" }); setDeclineError(""); setShowDeclineModal(true); }}
                                    >
                                      Decline
                                    </Button>
                                  </>
                                )}
                                {v.status === 'confirmed' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7 px-2"
                                      disabled={completingId === v.id}
                                      onClick={() => void handleCompleteViewing(v.id)}
                                    >
                                      {completingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Complete"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7 px-2 text-[#1A3C28] border-[#1A3C28]/30 hover:bg-[#E8F0EC]"
                                      onClick={() => { setReschedulingViewingId(v.id); setRescheduleForm({ scheduledAt: "", reason: "" }); setRescheduleError(""); setShowRescheduleModal(true); }}
                                    >
                                      Reschedule
                                    </Button>
                                  </>
                                )}
                                {(v.status === 'requested' || v.status === 'confirmed') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                                    onClick={() => { setCancellingViewingId(v.id); setCancelReason(""); setCancelError(""); setShowCancelModal(true); }}
                                  >
                                    Cancel
                                  </Button>
                                )}
                                <Badge className={
                                  v.status === "confirmed" ? "bg-green-100 text-green-700" :
                                  v.status === "completed" ? "bg-blue-100 text-blue-700" :
                                  v.status === "declined" ? "bg-red-100 text-red-700" :
                                  v.status === "cancelled" ? "bg-orange-100 text-orange-700" :
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
              </div>
            ) : (
              /* ── List View ── */
              <>
                {/* Upcoming */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Upcoming ({upcomingViewings.length})
                  </h3>
                  {upcomingViewings.length === 0 ? (
                    <div className="rounded-xl bg-white py-8 text-center text-gray-400" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No upcoming viewings</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingViewings.map((v) => (
                        <div key={v.id} className="rounded-xl bg-white p-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-[#E8F0EC] rounded-lg flex items-center justify-center shrink-0">
                              <Calendar className="w-5 h-5 text-[#1A3C28]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{v.property_title ?? "Property"}</p>
                              {(() => {
                                try {
                                  const meta = v.notes ? JSON.parse(v.notes) : null;
                                  if (meta?.bookedByAgent) {
                                    return (
                                      <p className="text-sm text-gray-600 mt-0.5">
                                        {meta.name}{meta.phone ? ` · ${meta.phone}` : ""}{meta.email ? ` · ${meta.email}` : ""}
                                      </p>
                                    );
                                  }
                                } catch { /* not agent-booked */ }
                                return <p className="text-sm text-gray-600 mt-0.5">Buyer Viewing</p>;
                              })()}
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(v.scheduled_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                                </span>
                                <Badge className="text-xs capitalize">{v.viewing_type?.replace("_", " ") ?? "in person"}</Badge>
                              </div>
                            </div>
                            <Badge className={v.status === "confirmed" ? "bg-green-100 text-green-700" : v.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}>
                              {v.status}
                            </Badge>
                          </div>
                          {(v.status === 'requested' || v.status === 'confirmed') && (
                            <div className="ml-14 flex flex-wrap gap-2 mt-2">
                              {v.status === 'requested' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2"
                                    disabled={confirmingId === v.id}
                                    onClick={() => void handleConfirmViewing(v.id)}
                                  >
                                    {confirmingId === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => { setDecliningViewingId(v.id); setDeclineForm({ reason: "", alternativeDates: [], message: "" }); setDeclineError(""); setShowDeclineModal(true); }}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Decline
                                  </Button>
                                </>
                              )}
                              {v.status === 'confirmed' && (
                                <>
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
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2 text-[#1A3C28] border-[#1A3C28]/30 hover:bg-[#E8F0EC]"
                                    onClick={() => { setReschedulingViewingId(v.id); setRescheduleForm({ scheduledAt: "", reason: "" }); setRescheduleError(""); setShowRescheduleModal(true); }}
                                  >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Reschedule
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                                onClick={() => { setCancellingViewingId(v.id); setCancelReason(""); setCancelError(""); setShowCancelModal(true); }}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
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
                        <div key={v.id} className="rounded-xl bg-white p-4 flex items-start gap-4 opacity-70" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{v.property_title ?? "Property"}</p>
                            {(() => {
                              try {
                                const meta = v.notes ? JSON.parse(v.notes) : null;
                                if (meta?.bookedByAgent) {
                                  return <p className="text-sm text-gray-600 mt-0.5">{meta.name}</p>;
                                }
                              } catch { /* not agent-booked */ }
                              return null;
                            })()}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(v.scheduled_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                          </div>
                          <Badge className={v.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                            {v.status}
                          </Badge>
                        </div>
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
                        <div key={oh.id} className="rounded-xl bg-white p-4 flex items-start gap-4" style={{ border: '1px solid rgba(26,60,40,0.12)' }}>
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {/* Schedule Viewing Modal (agent books on behalf of buyer) */}
      {showScheduleViewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Schedule Viewing</h3>
              <button onClick={() => setShowScheduleViewing(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {scheduleViewingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{scheduleViewingError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {/* Property selector */}
              <div>
                <label className="text-sm font-medium block mb-1">Property *</label>
                <select
                  value={scheduleViewingForm.propertyId}
                  onChange={(e) => setScheduleViewingForm((f) => ({ ...f, propertyId: e.target.value }))}
                  title="Select a listing"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select a listing…</option>
                  {activeListings.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>

              {/* Date/time + type row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={scheduleViewingForm.scheduledAt}
                    onChange={(e) => setScheduleViewingForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                    title="Viewing date and time"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Type</label>
                  <select
                    value={scheduleViewingForm.viewingType}
                    onChange={(e) => setScheduleViewingForm((f) => ({ ...f, viewingType: e.target.value as 'physical' | 'virtual' }))}
                    title="Viewing type"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="physical">In-Person</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium block mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  value={scheduleViewingForm.durationMinutes ?? 30}
                  onChange={(e) => setScheduleViewingForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                  title="Duration in minutes"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Buyer contact — the key new fields */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Buyer Contact Details</p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={scheduleViewingForm.buyerContactName}
                      onChange={(e) => setScheduleViewingForm((f) => ({ ...f, buyerContactName: e.target.value }))}
                      placeholder="e.g. Thabo Nkosi"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium block mb-1">Email</label>
                      <input
                        type="email"
                        value={scheduleViewingForm.buyerContactEmail ?? ""}
                        onChange={(e) => setScheduleViewingForm((f) => ({ ...f, buyerContactEmail: e.target.value }))}
                        placeholder="buyer@email.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Phone</label>
                      <input
                        type="tel"
                        value={scheduleViewingForm.buyerContactPhone ?? ""}
                        onChange={(e) => setScheduleViewingForm((f) => ({ ...f, buyerContactPhone: e.target.value }))}
                        placeholder="+27..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium block mb-1">Notes</label>
                <textarea
                  value={scheduleViewingForm.notes ?? ""}
                  onChange={(e) => setScheduleViewingForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any special requirements or instructions…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowScheduleViewing(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-[#1A3C28] hover:bg-[#2D5A40] text-[#F2E8D5]"
                disabled={
                  isSchedulingViewing ||
                  !scheduleViewingForm.propertyId ||
                  !scheduleViewingForm.scheduledAt ||
                  !scheduleViewingForm.buyerContactName.trim()
                }
                onClick={() => { void handleScheduleViewing(); }}
              >
                {isSchedulingViewing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Calendar className="w-4 h-4 mr-1" />}
                {isSchedulingViewing ? "Scheduling…" : "Confirm Viewing"}
              </Button>
            </div>
          </Card>
        </div>
      )}

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
                className="flex-1 bg-[#1A3C28] hover:bg-[#2D5A40] text-[#F2E8D5]"
              >
                {isSchedulingOpenHouse ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule"}
              </Button>
            </div>
          </Card>
        </div>
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

      {/* Create Lead Modal */}
      {showCreateLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">New Lead</h3>
              <button onClick={() => { setShowCreateLead(false); setCreateLeadError(""); }} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {createLeadError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{createLeadError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium block mb-1">Contact Name *</label>
                <input
                  type="text"
                  value={createLeadForm.name}
                  onChange={(e) => setCreateLeadForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input
                  type="email"
                  value={createLeadForm.email ?? ""}
                  onChange={(e) => setCreateLeadForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Phone</label>
                <input
                  type="tel"
                  value={createLeadForm.phone ?? ""}
                  onChange={(e) => setCreateLeadForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+27..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Source</label>
                <select
                  value={createLeadForm.source ?? ""}
                  onChange={(e) => setCreateLeadForm((f) => ({ ...f, source: e.target.value }))}
                  title="Lead source"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select source…</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium block mb-1">Notes</label>
                <textarea
                  value={createLeadForm.notes ?? ""}
                  onChange={(e) => setCreateLeadForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Initial notes..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateLead(false)} className="flex-1">Cancel</Button>
              <Button
                disabled={isCreatingLead || !createLeadForm.name.trim()}
                className="flex-1 bg-[#1A3C28] hover:bg-[#2D5A40] text-[#F2E8D5]"
                onClick={() => {
                  const token = getAccessToken();
                  if (!token) return;
                  setIsCreatingLead(true);
                  setCreateLeadError("");
                  leadsApi.create(token, { ...createLeadForm, name: createLeadForm.name.trim() })
                    .then(() => {
                      setShowCreateLead(false);
                      setCreateLeadForm({ name: "", type: "buyer", email: "", phone: "", source: "", notes: "" });
                      setLeadPage(1);
                      // re-trigger load
                      setLeadStatusFilter((f) => f);
                    })
                    .catch((err: unknown) => setCreateLeadError(err instanceof Error ? err.message : "Failed to create lead"))
                    .finally(() => setIsCreatingLead(false));
                }}
              >
                {isCreatingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Lead"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Syndication Modal */}
      {syndicationPropertyId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#1A3C28]" />
                <div>
                  <h3 className="text-lg font-bold">Portal Syndication</h3>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{syndicationTitle}</p>
                </div>
              </div>
              <button
                onClick={() => { setSyndicationPropertyId(null); setSyndicationRecords([]); setSyndicationError(""); }}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {syndicationError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{syndicationError}
              </div>
            )}

            {/* Push to all portals button */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {syndicationRecords.length === 0 && !isSyndicationLoading
                  ? "This listing has not been pushed to any portals yet."
                  : `${syndicationRecords.length} portal${syndicationRecords.length !== 1 ? 's' : ''} tracked`}
              </p>
              <Button
                size="sm"
                className="bg-[#1A3C28] hover:bg-[#2D5A40] text-[#F2E8D5]"
                disabled={isSyndicating}
                onClick={() => { void handleSyndicate(); }}
              >
                {isSyndicating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
                {isSyndicating ? "Pushing…" : "Sync to All Portals"}
              </Button>
            </div>

            {/* Portal status list */}
            {isSyndicationLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : syndicationRecords.length > 0 ? (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                {syndicationRecords.map((rec) => {
                  const statusColour =
                    rec.sync_status === 'synced'  ? 'bg-green-100 text-green-700' :
                    rec.sync_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    rec.sync_status === 'paused'  ? 'bg-blue-100 text-blue-700' :
                                                    'bg-red-100 text-red-700';
                  return (
                    <div key={rec.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Share2 className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{rec.portal_name}</p>
                          <p className="text-xs text-gray-400">
                            {rec.last_synced_at
                              ? `Last synced ${new Date(rec.last_synced_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}`
                              : 'Not yet synced'}
                          </p>
                          {rec.error_message && (
                            <p className="text-xs text-red-500 mt-0.5 truncate">{rec.error_message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColour}`}>
                          {rec.sync_status}
                        </span>
                        {rec.external_url && (
                          <a
                            href={rec.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            View
                          </a>
                        )}
                        {(rec.sync_status === 'pending' || rec.sync_status === 'synced') && (
                          <button
                            disabled={pausingPortalId === rec.portal_id}
                            onClick={() => { void handlePauseSyndication(rec.portal_id); }}
                            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-0.5 disabled:opacity-50"
                          >
                            {pausingPortalId === rec.portal_id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Pause'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelectedLead(null)} />
          <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg">{selectedLead.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{selectedLead.stage.replace(/_/g, " ")} · {selectedLead.source?.replace(/_/g, " ") ?? "No source"}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedLead.email && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="font-medium truncate">{selectedLead.email}</p>
                  </div>
                )}
                {selectedLead.phone && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                    <p className="font-medium">{selectedLead.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Added</p>
                  <p className="font-medium">{new Date(selectedLead.created_at).toLocaleDateString("en-ZA")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Last updated</p>
                  <p className="font-medium">{new Date(selectedLead.updated_at).toLocaleDateString("en-ZA")}</p>
                </div>
              </div>

              {selectedLead.notes && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 rounded-lg p-3">{selectedLead.notes}</p>
                </div>
              )}

              {/* Status transition */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {LEAD_STATUSES.filter((s) => s !== selectedLead.stage).map((s) => (
                    <button
                      key={s}
                      disabled={!!leadStatusUpdating}
                      onClick={() => {
                        const token = getAccessToken();
                        if (!token) return;
                        setLeadStatusUpdating(s);
                        leadsApi.update(token, selectedLead.id, { stage: s })
                          .then((updated: LeadRow) => {
                            setSelectedLead(updated);
                            setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l));
                          })
                          .catch(() => {})
                          .finally(() => setLeadStatusUpdating(null));
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium border border-[#D9C4A6] hover:bg-[#E8F0EC] disabled:opacity-50 capitalize"
                    >
                      {leadStatusUpdating === s ? <Loader2 className="w-3 h-3 animate-spin inline" /> : s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Log activity */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold">Log Activity</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={logActivityForm.activityType}
                    onChange={(e) => setLogActivityForm((f) => ({ ...f, activityType: e.target.value }))}
                    title="Activity type"
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <Button
                    disabled={isLoggingActivity}
                    size="sm"
                    className="bg-[#1A3C28] hover:bg-[#2D5A40] text-[#F2E8D5]"
                    onClick={() => {
                      const token = getAccessToken();
                      if (!token) return;
                      setIsLoggingActivity(true);
                      leadsApi.createActivity(token, selectedLead.id, { type: logActivityForm.activityType, description: logActivityForm.notes || logActivityForm.activityType })
                        .then(() => {
                          setLogActivityForm({ activityType: "note", notes: "" });
                          const t2 = getAccessToken();
                          if (t2) {
                            setIsLoadingActivities(true);
                            leadsApi.listActivities(t2, selectedLead.id)
                              .then(setLeadActivities)
                              .finally(() => setIsLoadingActivities(false));
                          }
                        })
                        .catch(() => {})
                        .finally(() => setIsLoggingActivity(false));
                    }}
                  >
                    {isLoggingActivity ? <Loader2 className="w-3 h-3 animate-spin" /> : "Log"}
                  </Button>
                </div>
                <textarea
                  value={logActivityForm.notes}
                  onChange={(e) => setLogActivityForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Notes..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              {/* Activity timeline */}
              <div>
                <p className="text-sm font-semibold mb-3">Activity Timeline</p>
                {isLoadingActivities ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                ) : leadActivities.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No activities yet</p>
                ) : (
                  <div className="space-y-3">
                    {leadActivities.map((act) => (
                      <div key={act.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#E8F0EC] flex items-center justify-center shrink-0 mt-0.5">
                          <Activity className="w-3.5 h-3.5 text-[#1A3C28]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{(act.type ?? "note").replace(/_/g, " ")}</p>
                          {act.description && <p className="text-sm text-gray-600 mt-0.5">{act.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">{new Date(act.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Decline Viewing Modal ── */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-700">Decline Viewing</h3>
              <button onClick={() => setShowDeclineModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {declineError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{declineError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Reason for declining * <span className="text-gray-400 font-normal">(min 10 chars)</span></label>
                <textarea
                  value={declineForm.reason}
                  onChange={(e) => setDeclineForm((f) => ({ ...f, reason: e.target.value }))}
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
                    value={altDateInput}
                    onChange={(e) => setAltDateInput(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    title="Alternative date"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (altDateInput) {
                        setDeclineForm((f) => ({ ...f, alternativeDates: [...(f.alternativeDates ?? []), new Date(altDateInput).toISOString()] }));
                        setAltDateInput("");
                      }
                    }}
                  >Add</Button>
                </div>
                {(declineForm.alternativeDates ?? []).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {(declineForm.alternativeDates ?? []).map((d, i) => (
                      <li key={i} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded">
                        {new Date(d).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                        <button
                          onClick={() => setDeclineForm((f) => ({ ...f, alternativeDates: (f.alternativeDates ?? []).filter((_, j) => j !== i) }))}
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
                  value={declineForm.message ?? ""}
                  onChange={(e) => setDeclineForm((f) => ({ ...f, message: e.target.value }))}
                  rows={2}
                  placeholder="Any extra information for the buyer…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDeclineModal(false)}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeclining || declineForm.reason.trim().length < 10}
                onClick={() => void handleDeclineViewing()}
              >
                {isDeclining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Decline Viewing
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Cancel Viewing Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-orange-700">Cancel Viewing</h3>
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
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isCancelling || cancelReason.trim().length < 5}
                onClick={() => void handleCancelViewing()}
              >
                {isCancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Cancellation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Reschedule Viewing Modal ── */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-blue-700">Reschedule Viewing</h3>
              <button onClick={() => setShowRescheduleModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {rescheduleError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{rescheduleError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">New date &amp; time *</label>
                <input
                  type="datetime-local"
                  value={rescheduleForm.scheduledAt}
                  onChange={(e) => setRescheduleForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  title="New viewing date and time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Reason for rescheduling <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={rescheduleForm.reason ?? ""}
                  onChange={(e) => setRescheduleForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={2}
                  placeholder="Let the buyer know why you need to reschedule…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>Cancel</Button>
              <Button
                className="bg-[#1A3C28] hover:bg-[#2D5A40] text-[#F2E8D5]"
                disabled={isRescheduling || !rescheduleForm.scheduledAt}
                onClick={() => void handleRescheduleViewing()}
              >
                {isRescheduling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Reschedule
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
