'use client';

import { useState, useEffect } from "react";
import { Link } from "@/lib/router-compat";
import {
  Shield,
  Users,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  BarChart3,
  MessageSquare,
  ChevronRight,
  X,
  ZoomIn,
  Flag,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatusChip } from "@/components/ui/status-chip";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import {
  adminKycApi,
  auditApi,
  adminUsersApi,
  KycRecord,
  AuditLogEntry,
  AuthUser,
  ApiError,
} from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";

type BadgeRole =
  | "buyer"
  | "agent"
  | "contractor"
  | "property_manager"
  | "admin"
  | "supplier"
  | "conveyancer"
  | "inspector";

function toBadgeRole(role?: string | null): BadgeRole {
  if (
    role === "agent" || role === "contractor" || role === "admin" ||
    role === "supplier" || role === "conveyancer" || role === "inspector"
  ) return role;
  return "buyer";
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

type AuditActivityItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "success" | "info" | "error" | "pending";
  user: string;
};

function auditToActivity(entry: AuditLogEntry): AuditActivityItem {
  const actionLabel = entry.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let type: AuditActivityItem["type"] = "info";
  if (/approv|success|register|login/.test(entry.action)) type = "success";
  else if (/reject|fail|suspend|delet/.test(entry.action)) type = "error";
  else if (/submit|pending|upload|review/.test(entry.action)) type = "pending";

  return {
    id: entry.id,
    title: actionLabel,
    description: `${entry.resourceType ?? ""} ${entry.resourceId?.slice(0, 8) ?? ""}`.trim() || "-",
    timestamp: formatRelativeTime(entry.createdAt),
    type,
    user: `Actor: ${entry.actorId.slice(0, 8)}`,
  };
}

export default function AdminVerificationPanel() {
  const [currentTab, setCurrentTab] = useState("verification");
  const [selectedKycId, setSelectedKycId] = useState<string | null>(null);
  const [showFraudReport, setShowFraudReport] = useState(false);

  // Live data
  const [kycRecords, setKycRecords] = useState<KycRecord[]>([]);
  const [userMap, setUserMap] = useState<Record<string, AuthUser>>({});
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [queueError, setQueueError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");

  const selectedRecord = kycRecords.find((r) => r.id === selectedKycId);
  const selectedUser = selectedRecord ? userMap[selectedRecord.userId] : null;

  const loadQueue = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoadingQueue(true);
    setQueueError("");
    try {
      const records = await adminKycApi.listPending(token, 50, 0);
      setKycRecords(records);
    } catch (err) {
      setQueueError(err instanceof ApiError ? err.message : "Failed to load verification queue.");
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadAuditLogs = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoadingAudit(true);
    try {
      const logs = await auditApi.getAdminLogs(token, { limit: 20, offset: 0 });
      setAuditLogs(logs);
    } catch {
      // non-critical
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    void loadQueue();
    void loadAuditLogs();
  }, []);

  const handleSelectRecord = async (id: string) => {
    setSelectedKycId(id);
    setActionError("");
    setReviewerNotes("");

    const record = kycRecords.find((r) => r.id === id);
    if (!record) return;
    if (userMap[record.userId]) return; // already loaded

    const token = getAccessToken();
    if (!token) return;

    setLoadingUser(true);
    try {
      const user = await adminUsersApi.getUser(token, record.userId);
      setUserMap((prev) => ({ ...prev, [record.userId]: user }));
    } catch {
      // user details unavailable
    } finally {
      setLoadingUser(false);
    }
  };

  const handleAction = async (
    action: "start-review" | "approve" | "reject",
  ) => {
    if (!selectedRecord) return;
    const token = getAccessToken();
    if (!token) return;

    setActionError("");
    setActionInProgress(action);

    try {
      if (action === "start-review") {
        await adminKycApi.startReview(token, selectedRecord.id);
      } else if (action === "approve") {
        await adminKycApi.approve(token, selectedRecord.id, reviewerNotes || undefined);
      } else {
        await adminKycApi.reject(token, selectedRecord.id, reviewerNotes || undefined);
      }
      // Refresh queue and deselect
      setSelectedKycId(null);
      setReviewerNotes("");
      await loadQueue();
      await loadAuditLogs();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed. Please try again.");
    } finally {
      setActionInProgress(null);
    }
  };

  const stats = [
    {
      label: "Pending Verifications",
      value: String(kycRecords.filter((r) => r.status === "pending").length),
      change: `${kycRecords.filter((r) => r.status === "under_review").length} under review`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Under Review",
      value: String(kycRecords.filter((r) => r.status === "under_review").length),
      change: "active reviews",
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Verified Today",
      value: String(
        auditLogs.filter(
          (l) =>
            l.action === "approve_kyc" &&
            new Date(l.createdAt).toDateString() === new Date().toDateString(),
        ).length,
      ),
      change: "approvals today",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Queue Total",
      value: String(kycRecords.length),
      change: "pending + under review",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-6 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Admin Verification Panel</h1>
                  <p className="text-xs text-gray-500">Document Review & User Verification</p>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/app">
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/app/analytics">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search users, reports..."
                  className="w-64 lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">
                AS
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.change}</div>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">User Verification</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">Audit Logs</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* User Verification Tab */}
          <TabsContent value="verification">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Queue List */}
              <Card className={selectedKycId ? "lg:col-span-1" : "lg:col-span-3"}>
                <div className="p-4 md:p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Verification Queue</h2>
                  <p className="text-sm text-gray-600">
                    {loadingQueue ? "Loading…" : `${kycRecords.length} users pending review`}
                  </p>
                  {queueError && (
                    <p className="text-sm text-red-600 mt-1">{queueError}</p>
                  )}
                </div>
                <div className="divide-y divide-gray-200">
                  {loadingQueue ? (
                    <div className="p-6 text-center text-gray-500 text-sm">Loading queue…</div>
                  ) : kycRecords.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">No pending verifications.</div>
                  ) : (
                    kycRecords.map((record) => {
                      const u = userMap[record.userId];
                      const displayName = u
                        ? `${u.firstName} ${u.lastName}`
                        : record.userId.slice(0, 8) + "…";
                      const initials = u
                        ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
                        : "??";
                      return (
                        <div
                          key={record.id}
                          className={`p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedKycId === record.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                          }`}
                          onClick={() => handleSelectRecord(record.id)}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold truncate">{displayName}</h3>
                                {u && <RoleBadge role={toBadgeRole(u.roles?.[0])} size="sm" />}
                              </div>
                              <p className="text-sm text-gray-600 truncate">{u?.email ?? "—"}</p>
                              <p className="text-xs text-gray-500">{formatRelativeTime(record.submittedAt)}</p>
                            </div>
                            <StatusChip status={record.status as "pending"} size="sm" />
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Document Viewer & Actions */}
              {selectedKycId && selectedRecord && (
                <Card className="lg:col-span-2">
                  <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                          {loadingUser ? "…" : selectedUser
                            ? `${selectedUser.firstName[0]}${selectedUser.lastName[0]}`.toUpperCase()
                            : "??"
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold">
                              {loadingUser ? "Loading…" : selectedUser
                                ? `${selectedUser.firstName} ${selectedUser.lastName}`
                                : selectedRecord.userId.slice(0, 8) + "…"
                              }
                            </h2>
                            {selectedUser && (
                              <RoleBadge role={toBadgeRole(selectedUser.roles?.[0])} size="md" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{selectedUser?.email ?? "—"}</p>
                          <p className="text-sm text-gray-600">{selectedUser?.phone ?? "—"}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedKycId(null)}
                        className="lg:hidden"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="p-4 md:p-6">
                    <h3 className="font-semibold mb-4">Submitted Documents</h3>
                    <div className="space-y-4">
                      {selectedRecord.idDocumentUrl ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between p-4 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {selectedRecord.idDocumentType ?? "ID Document"}
                                </div>
                                <div className="text-xs text-gray-500">Uploaded document</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(selectedRecord.idDocumentUrl!, "_blank")}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(selectedRecord.idDocumentUrl!, "_blank")}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="bg-gray-100 p-8 flex items-center justify-center min-h-[200px]">
                            <div className="text-center">
                              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-600">Document Preview</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Click zoom to view full size
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No documents uploaded.</p>
                      )}
                    </div>

                    {/* Audit Trail */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        Audit Trail
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Submitted:</span>
                          <span className="font-medium">{formatRelativeTime(selectedRecord.submittedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Status:</span>
                          <StatusChip status={selectedRecord.status as "pending"} size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Document Type:</span>
                          <span className="font-medium">{selectedRecord.idDocumentType ?? "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Reviewed By:</span>
                          <span className="font-medium">
                            {selectedRecord.reviewerId ? selectedRecord.reviewerId.slice(0, 8) + "…" : "Not yet reviewed"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reviewer Notes */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reviewer Notes (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        placeholder="Add notes for approve / reject decision…"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Action Error */}
                    {actionError && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {actionError}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={!!actionInProgress}
                        onClick={() => handleAction("approve")}
                      >
                        {actionInProgress === "approve" ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        disabled={!!actionInProgress}
                        onClick={() => handleAction("start-review")}
                      >
                        {actionInProgress === "start-review" ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MessageSquare className="w-4 h-4 mr-2" />
                        )}
                        Start Review
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        disabled={!!actionInProgress}
                        onClick={() => handleAction("reject")}
                      >
                        {actionInProgress === "reject" ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>

                    {/* Fraud Report Button */}
                    <Button
                      variant="outline"
                      className="w-full mt-3 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setShowFraudReport(true)}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report Fraud / Suspicious Activity
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card className="p-4 md:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-1">System Audit Logs</h2>
                <p className="text-sm text-gray-600">
                  Complete trail of all administrative actions and verification decisions
                </p>
              </div>
              {loadingAudit ? (
                <div className="text-center text-gray-500 text-sm py-8">Loading audit logs…</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">No audit logs found.</div>
              ) : (
                <ActivityTimeline items={auditLogs.map(auditToActivity)} />
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fraud Report Modal */}
      {showFraudReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  Report Fraud / Suspicious Activity
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowFraudReport(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity Level
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option>Low - Minor concern</option>
                    <option>Medium - Requires attention</option>
                    <option>High - Urgent review needed</option>
                    <option>Critical - Immediate action required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Category
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option>Fake Documents</option>
                    <option>Identity Theft</option>
                    <option>Impersonation</option>
                    <option>Falsified Information</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed information about the suspicious activity..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>

                <div className="flex items-start gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>Important:</strong> All fraud reports are logged and investigated. False reports may result in disciplinary action.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowFraudReport(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    alert("Fraud report submitted successfully");
                    setShowFraudReport(false);
                  }}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
