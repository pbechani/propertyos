'use client';

import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Home,
  Heart,
  Calendar,
  Bell,
  Settings,
  Search,
  ChevronRight,
  FileText,
  Hammer,
  Shield,
  BedDouble,
  Bath,
  Maximize,
  Star,
  Wallet,
  Activity,
  ArrowUpRight,
  BarChart3,
  Plus,
  Filter,
  Loader2,
  Bookmark,
  ShoppingCart,
  AlertOctagon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  propertiesApi,
  auditApi,
  usersApi,
  PropertyListing,
  AuditLogEntry,
  AuthUser,
} from "@/lib/api-client";
import { getAccessToken, getStoredUser } from "@/lib/auth-session";

// ─── Derived notification from audit log ─────────────────────────────────────

type DerivedNotification = {
  id: string;
  type: "property" | "purchase" | "construction" | "fraud" | "kyc" | "general";
  title: string;
  description: string;
  time: string;
  unread: boolean;
};

import { formatRelativeTime } from "@/lib/formatters";

function auditToNotification(entry: AuditLogEntry): DerivedNotification {
  const action = entry.action.toLowerCase();
  let type: DerivedNotification["type"] = "general";
  let title = "Activity";
  let description = `Action: ${entry.action}`;

  if (action.includes("property") || entry.resourceType === "property") {
    type = "property";
    if (action.includes("save")) {
      title = "Property saved";
      description = "You added a property to your favourites";
    } else if (action.includes("inquiry") || action.includes("viewing")) {
      title = "Viewing inquiry submitted";
      description = "Your viewing request has been sent to the agent";
    } else if (action.includes("create") || action.includes("list")) {
      title = "Listing created";
      description = "Your property listing has been published";
    } else if (action.includes("fraud")) {
      type = "fraud";
      title = "Fraud report submitted";
      description = "Your report is under review";
    } else {
      title = "Property update";
      description = `${entry.resourceType}: ${entry.action}`;
    }
  } else if (action.includes("kyc")) {
    type = "kyc";
    title = "KYC update";
    description = `KYC status changed: ${entry.action}`;
  } else if (action.includes("login") || action.includes("register")) {
    type = "general";
    title = "Account activity";
    description = `${entry.action}`;
  } else if (action.includes("purchase") || action.includes("stage") || action.includes("offer")) {
    type = "purchase";
    title = "Purchase update";
    description = entry.action;
  }

  return {
    id: entry.id,
    type,
    title,
    description,
    time: formatRelativeTime(entry.createdAt),
    unread: false,
  };
}

// ─── Saved property shape (matches API response) ─────────────────────────────

type SavedPropertyItem = {
  id: string;
  image: string | null;
  price: string;
  currency: string;
  address: string;
  beds: number | null;
  baths: number | null;
  sqm: string | null;
  verified: boolean;
};

function listingToSaved(p: PropertyListing): SavedPropertyItem {
  const primary = p.media?.find((m) => m.is_primary) ?? p.media?.[0];
  const loc = [p.location?.city, p.location?.region, p.location?.country]
    .filter(Boolean)
    .join(", ");
  return {
    id: p.id,
    image: primary?.url ?? null,
    price: `${p.currency} ${Number(p.price).toLocaleString()}`,
    currency: p.currency,
    address: p.title + (loc ? ` — ${loc}` : ""),
    beds: p.bedrooms ?? null,
    baths: p.bathrooms ?? null,
    sqm: p.area_sqm ?? null,
    verified: p.verification_status === "verified",
  };
}

export default function BuyerDashboardEnhanced() {
  const [activeTab, setActiveTab] = useState("overview");

  // ── Async state ──────────────────────────────────────────────────────────
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [savedProperties, setSavedProperties] = useState<SavedPropertyItem[]>([]);
  const [notifications, setNotifications] = useState<DerivedNotification[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [unsaveInFlight, setUnsaveInFlight] = useState<Set<string>>(new Set());

  // ── Fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken();

    // Resolve user from session (already available) or fallback to /users/me
    if (!user && token) {
      usersApi.me(token).then(setUser).catch(() => null);
    }

    if (!token) {
      setLoadingSaved(false);
      setLoadingActivity(false);
      return;
    }

    // Saved / favourite properties
    propertiesApi
      .getSavedProperties(token)
      .then((res) => setSavedProperties((res.data ?? []).map(listingToSaved)))
      .catch(() => setSavedProperties([]))
      .finally(() => setLoadingSaved(false));

    // Activity feed derived from audit log
    auditApi
      .getMyLogs(token, 20, 0)
      .then((entries) => setNotifications(entries.map(auditToNotification)))
      .catch(() => setNotifications([]))
      .finally(() => setLoadingActivity(false));
  }, []);

  // ── Unsave handler ───────────────────────────────────────────────────────
  async function handleUnsave(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setUnsaveInFlight((prev) => new Set(prev).add(id));
    try {
      await propertiesApi.unsave(token, id);
      setSavedProperties((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setUnsaveInFlight((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const userName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "there";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">Buyer Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {userName}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" className="border-gray-300 dark:border-gray-700">
                <Bell className="w-4 h-4 mr-2" />
                {notifications.length > 0 && (
                  <Badge className="bg-red-600 text-white ml-1">{notifications.length}</Badge>
                )}
              </Button>
              <Button variant="outline" className="border-gray-300 dark:border-gray-700">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Link to="/app/listings">
                <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-4">
            {/* Favourites — real data */}
            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-5 h-5 text-gray-600" />
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              </div>
              {loadingSaved ? (
                <div className="h-8 w-10 bg-gray-200 animate-pulse rounded mb-1" />
              ) : (
                <div className="text-2xl font-bold text-black">{savedProperties.length}</div>
              )}
              <div className="text-xs text-gray-600">Saved Properties</div>
            </Card>

            {/* Active Purchases — Sprint 04 */}
            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <Badge className="bg-gray-100 text-gray-500 text-xs">Sprint 04</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-400">—</div>
              <div className="text-xs text-gray-600">Active Purchases</div>
            </Card>

            {/* Construction Projects — Sprint 06 */}
            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Hammer className="w-5 h-5 text-gray-600" />
                <Badge className="bg-gray-100 text-gray-500 text-xs">Sprint 06</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-400">—</div>
              <div className="text-xs text-gray-600">Construction Projects</div>
            </Card>

            {/* Escrow Balance — Sprint 05 */}
            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-gray-600" />
                <Badge className="bg-gray-100 text-gray-500 text-xs">Sprint 05</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-400">—</div>
              <div className="text-xs text-gray-600">Escrow Balance</div>
            </Card>

            {/* Activity count — real (audit log) */}
            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-gray-600" />
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
              </div>
              {loadingActivity ? (
                <div className="h-8 w-10 bg-gray-200 animate-pulse rounded mb-1" />
              ) : (
                <div className="text-2xl font-bold text-black">{notifications.length}</div>
              )}
              <div className="text-xs text-gray-600">Activity Events</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="purchases">Active Purchases</TabsTrigger>
            <TabsTrigger value="construction">Construction</TabsTrigger>
            <TabsTrigger value="saved">Saved Properties</TabsTrigger>
            <TabsTrigger value="viewings">Viewings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">

            {/* Saved Properties Snapshot */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Saved Properties</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("saved")}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {loadingSaved ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <Card key={i} className="p-4 border-gray-200 animate-pulse">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : savedProperties.length === 0 ? (
                  <Card className="p-8 border-gray-200 text-center">
                    <Heart className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 mb-3">No saved properties yet</p>
                    <Link to="/app/listings">
                      <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                        Browse Properties
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {savedProperties.slice(0, 2).map((property) => (
                      <Card key={property.id} className="p-4 border-gray-200">
                        <div className="flex gap-3">
                          {property.image ? (
                            <img
                              src={property.image}
                              alt={property.address}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Home className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1">{property.price}</div>
                            <div className="text-xs text-gray-600 mb-2 line-clamp-2">{property.address}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              {property.beds !== null && <span>{property.beds} beds</span>}
                              {property.baths !== null && <span>{property.baths} baths</span>}
                              {property.sqm && <span>{property.sqm} m²</span>}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Purchases — Coming in Sprint 04 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Active Purchases</h2>
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Sprint 04</Badge>
                </div>
                <Card className="p-8 border-gray-200 border-dashed text-center">
                  <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="font-medium text-gray-600 mb-1">Purchase tracking coming soon</p>
                  <p className="text-xs text-gray-400 mb-4">
                    14-stage property purchase pipeline including escrow, legal transfers &amp; document workflows
                  </p>
                  <Link to="/app/listings">
                    <Button size="sm" variant="outline" className="border-gray-300">
                      Browse Properties
                    </Button>
                  </Link>
                </Card>
              </div>
            </div>

            {/* Construction Projects — Coming in Sprint 06 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Construction Projects</h2>
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Sprint 06</Badge>
              </div>
              <Card className="p-8 border-gray-200 border-dashed">
                <div className="flex items-center gap-6">
                  <Hammer className="w-12 h-12 text-gray-300 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-600 mb-1">Construction management coming soon</p>
                    <p className="text-sm text-gray-400">
                      Manage budgets, milestones, contractors, BOQ, geo-verified progress photos &amp; site inspections from one dashboard.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Upcoming features row */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 border-gray-200 border-dashed">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-600 text-sm">Escrow &amp; Payments</span>
                  <Badge className="bg-gray-100 text-gray-500 text-xs ml-auto">Sprint 05</Badge>
                </div>
                <p className="text-xs text-gray-400">Multi-stage milestone escrow with immutable audit trail</p>
              </Card>
              <Card className="p-4 border-gray-200 border-dashed">
                <div className="flex items-center gap-3 mb-2">
                  <Bookmark className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-600 text-sm">Service Providers</span>
                  <Badge className="bg-gray-100 text-gray-500 text-xs ml-auto">Sprint 07</Badge>
                </div>
                <p className="text-xs text-gray-400">Bookmark contractors, suppliers &amp; request quotes</p>
              </Card>
              <Card className="p-4 border-gray-200 border-dashed">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-600 text-sm">Materials &amp; RFQs</span>
                  <Badge className="bg-gray-100 text-gray-500 text-xs ml-auto">Sprint 08</Badge>
                </div>
                <p className="text-xs text-gray-400">Purchase materials and send bulk quote requests</p>
              </Card>
            </div>

            {/* Recent Activity – real data from audit log */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <Card className="p-4 border-gray-200">
                {loadingActivity ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2 pt-1">
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 8).map((notification, index) => (
                      <div key={notification.id}>
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              notification.type === "purchase"
                                ? "bg-blue-100"
                                : notification.type === "construction"
                                ? "bg-orange-100"
                                : notification.type === "fraud"
                                ? "bg-red-100"
                                : notification.type === "kyc"
                                ? "bg-purple-100"
                                : "bg-green-100"
                            }`}
                          >
                            {notification.type === "purchase" ? (
                              <FileText className="w-4 h-4 text-blue-600" />
                            ) : notification.type === "construction" ? (
                              <Hammer className="w-4 h-4 text-orange-600" />
                            ) : notification.type === "fraud" ? (
                              <AlertOctagon className="w-4 h-4 text-red-600" />
                            ) : notification.type === "kyc" ? (
                              <Shield className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Home className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-0.5">{notification.title}</div>
                            <div className="text-sm text-gray-600 mb-1">{notification.description}</div>
                            <div className="text-xs text-gray-400">{notification.time}</div>
                          </div>
                        </div>
                        {index < Math.min(notifications.length - 1, 7) && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Active Purchases Tab */}
          <TabsContent value="purchases" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Purchases</h2>
              <Link to="/app/listings">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Purchase
                </Button>
              </Link>
            </div>
            <Card className="p-16 border-gray-200 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">Purchase Tracking — Sprint 04</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                The full 14-stage property purchase pipeline — from offer through legal transfer, escrow, inspections, and deeds registration — is coming in Sprint 04.
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/app/listings">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
                <Link to="/fraud-report">
                  <Button variant="outline" className="border-gray-300">
                    <AlertOctagon className="w-4 h-4 mr-2" />
                    Report Fraud
                  </Button>
                </Link>
              </div>
            </Card>
          </TabsContent>

          {/* Construction Tab */}
          <TabsContent value="construction" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Construction Projects</h2>
              <Link to="/construction">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </Button>
              </Link>
            </div>
            <Card className="p-16 border-gray-200 text-center">
              <Hammer className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">Construction Management — Sprint 06</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                Manage build projects with budgets, BOQ, stage milestones, contractor payments, geo-tagged progress photos, government inspections and offline-first mobile tracking.
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/boq-workspace">
                  <Button variant="outline" className="border-gray-300">
                    <FileText className="w-4 h-4 mr-2" />
                    Open BOQ Workspace
                  </Button>
                </Link>
                <Link to="/ai-design-studio">
                  <Button variant="outline" className="border-gray-300">
                    <Star className="w-4 h-4 mr-2" />
                    AI Design Studio
                  </Button>
                </Link>
              </div>
            </Card>
          </TabsContent>

          {/* Saved Properties Tab */}
          <TabsContent value="saved" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Saved Properties
                {!loadingSaved && (
                  <span className="text-gray-400 font-normal text-base ml-2">
                    ({savedProperties.length})
                  </span>
                )}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Link to="/app/listings">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <Search className="w-4 h-4 mr-2" />
                    Browse More
                  </Button>
                </Link>
              </div>
            </div>

            {loadingSaved ? (
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden border-gray-200 animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : savedProperties.length === 0 ? (
              <Card className="p-16 border-gray-200 text-center">
                <Heart className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <h3 className="font-semibold text-gray-600 mb-2">No saved properties yet</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Browse the marketplace and tap the heart icon to save properties you like.
                </p>
                <Link to="/app/listings">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {savedProperties.map((property) => (
                  <Card key={property.id} className="overflow-hidden border-gray-200">
                    <div className="relative">
                      {property.image ? (
                        <img
                          src={property.image}
                          alt={property.address}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <Home className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      <button
                        onClick={() => handleUnsave(property.id)}
                        disabled={unsaveInFlight.has(property.id)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-60"
                        title="Remove from saved"
                        aria-label="Remove from saved"
                      >
                        {unsaveInFlight.has(property.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        )}
                      </button>
                      {property.verified && (
                        <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-xl font-bold text-black mb-1">{property.price}</div>
                      <div className="text-sm text-gray-600 mb-3 line-clamp-2">{property.address}</div>
                      <div className="flex gap-4 mb-4 text-sm text-gray-600">
                        {property.beds !== null && (
                          <div className="flex items-center gap-1">
                            <BedDouble className="w-4 h-4" />
                            {property.beds}
                          </div>
                        )}
                        {property.baths !== null && (
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            {property.baths}
                          </div>
                        )}
                        {property.sqm && (
                          <div className="flex items-center gap-1">
                            <Maximize className="w-4 h-4" />
                            {property.sqm}m²
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/app/property/${property.id}`} className="flex-1">
                          <Button variant="outline" className="w-full border-gray-300">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          className="flex-1 bg-black text-white hover:bg-gray-800"
                          onClick={() => {
                            // Inquiry/offer will be wired to property detail page
                            window.location.href = `/app/property/${property.id}`;
                          }}
                        >
                          Make Offer
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Viewings Tab */}
          <TabsContent value="viewings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Scheduled Viewings</h2>
              <Link to="/app/listings">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Calendar className="w-4 h-4 mr-2" />
                  Browse &amp; Request Viewing
                </Button>
              </Link>
            </div>
            <Card className="p-16 border-gray-200 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">Viewing Calendar — Sprint 04</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                Schedule and manage property viewings — in-person and virtual — with integrated calendar and agent coordination. Coming in Sprint 04.
              </p>
              <p className="text-xs text-gray-400">
                You can already submit viewing inquiries from any property listing page.
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-6 p-6 border-gray-200 bg-linear-to-r from-gray-900 to-gray-700 text-white">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-6 gap-3">
            <Link to="/app/listings">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Search className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">Browse</div>
              </button>
            </Link>
            <Link to="/service-providers">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Bookmark className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">Contractors</div>
              </button>
            </Link>
            <Link to="/boq-workspace">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">BOQ</div>
              </button>
            </Link>
            <Link to="/ai-design-studio">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Star className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">AI Studio</div>
              </button>
            </Link>
            <Link to="/property-lifecycle">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Activity className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">Lifecycle</div>
              </button>
            </Link>
            <Link to="/risk-analytics">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">Analytics</div>
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}