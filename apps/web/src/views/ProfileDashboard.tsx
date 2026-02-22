'use client';

import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Shield,
  CheckCircle,
  Star,
  Edit,
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  TrendingUp,
  Lock,
  Bell,
  Eye,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/role-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { AuditLogEntry, auditApi, kycApi, usersApi, ApiError } from "@/lib/api-client";
import { getAccessToken, getPrimaryRole } from "@/lib/auth-session";

type BadgeRole = "buyer" | "agent" | "contractor" | "property_manager" | "admin" | "supplier" | "conveyancer" | "inspector";

function toBadgeRole(role: string | null): BadgeRole {
  if (role === "buyer_seller" || role === "investor") {
    return "buyer";
  }

  if (role === "truck_operator") {
    return "property_manager";
  }

  if (
    role === "agent" ||
    role === "contractor" ||
    role === "admin" ||
    role === "supplier" ||
    role === "conveyancer" ||
    role === "inspector"
  ) {
    return role;
  }

  return "buyer";
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "success" | "info" | "error" | "pending";
  user: string;
};

function auditToActivity(entry: AuditLogEntry): ActivityItem {
  const actionLabel = entry.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let type: ActivityItem["type"] = "info";
  if (/approv|success|verified|register|login/.test(entry.action)) type = "success";
  else if (/reject|fail|suspend|delet/.test(entry.action)) type = "error";
  else if (/submit|pending|upload|review/.test(entry.action)) type = "pending";

  return {
    id: entry.id,
    title: actionLabel,
    description: entry.resourceType
      ? `${entry.resourceType.replace(/_/g, " ")} · ${entry.resourceId?.slice(0, 8) ?? "-"}`
      : "-",
    timestamp: formatRelativeTime(entry.createdAt),
    type,
    user: "You",
  };
}

export default function ProfileDashboard() {
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [displayName, setDisplayName] = useState("User");
  const [displayEmail, setDisplayEmail] = useState("-");
  const [displayPhone, setDisplayPhone] = useState("-");
  const [avatarInitials, setAvatarInitials] = useState("?");
  const [verificationStatus, setVerificationStatus] = useState<"verified" | "pending" | "rejected" | "unverified">("unverified");
  const [role, setRole] = useState<BadgeRole>("buyer");
  const [verificationLevel, setVerificationLevel] = useState(1);
  const [trustScore, setTrustScore] = useState(25);
  const [completedSteps, setCompletedSteps] = useState<Array<{ id: number; title: string; completed: boolean; date: string }>>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Edit panel state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const [user, kyc] = await Promise.all([
          usersApi.me(token),
          kycApi.getStatus(token),
        ]);

        const fullName = `${user.firstName} ${user.lastName}`.trim();
        setDisplayName(fullName);
        setDisplayEmail(user.email);
        setDisplayPhone(user.phone || "-");
        setAvatarInitials(
          `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?",
        );
        setRole(toBadgeRole(getPrimaryRole()));

        // Edit panel pre-fill
        setEditFirstName(user.firstName ?? "");
        setEditLastName(user.lastName ?? "");
        setEditPhone(user.phone ?? "");

        // KYC-derived state
        const kycStatus = kyc.status;
        const emailVerified = !!user.emailVerifiedAt;
        const kycSubmitted = kycStatus !== "not_submitted";
        const kycApproved = kycStatus === "approved";
        const kycRejected = kycStatus === "rejected";

        if (kycApproved) {
          setVerificationStatus("verified");
          setVerificationLevel(3);
          setTrustScore(85);
        } else if (kycRejected) {
          setVerificationStatus("rejected");
          setVerificationLevel(emailVerified ? 2 : 1);
          setTrustScore(emailVerified ? 40 : 25);
        } else if (kycStatus === "pending" || kycStatus === "under_review") {
          setVerificationStatus("pending");
          setVerificationLevel(emailVerified ? 2 : 1);
          setTrustScore(emailVerified ? 55 : 35);
        } else {
          setVerificationStatus("unverified");
          setVerificationLevel(emailVerified ? 2 : 1);
          setTrustScore(emailVerified ? 40 : 25);
        }

        setCompletedSteps([
          { id: 1, title: "Account Created", completed: true, date: "Completed" },
          {
            id: 2,
            title: "Email Verified",
            completed: emailVerified,
            date: emailVerified
              ? new Date(user.emailVerifiedAt!).toLocaleDateString()
              : "Pending",
          },
          {
            id: 3,
            title: "KYC Documents Submitted",
            completed: kycSubmitted,
            date: kycSubmitted ? "Submitted" : "Pending",
          },
          {
            id: 4,
            title: "Identity Verified",
            completed: kycApproved,
            date: kycApproved ? "Approved" : kycRejected ? "Rejected" : "Pending",
          },
        ]);
      } catch {
        setRole(toBadgeRole(getPrimaryRole()));
      }

      // Load recent activity separately so the rest of the UI isn't blocked
      try {
        const logs = await auditApi.getMyLogs(token, 5, 0);
        setRecentActivity(logs.map(auditToActivity));
      } catch {
        // activity is non-critical, leave empty
      } finally {
        setActivityLoading(false);
      }
    };

    void load();
  }, []);

  const handleSaveProfile = async () => {
    const token = getAccessToken();
    if (!token) return;

    setEditError("");
    setEditSuccess(false);
    setIsSavingEdit(true);

    try {
      const updated = await usersApi.updateMe(token, {
        firstName: editFirstName || undefined,
        lastName: editLastName || undefined,
        phone: editPhone || undefined,
      });
      const fullName = `${updated.firstName} ${updated.lastName}`.trim();
      setDisplayName(fullName);
      setDisplayPhone(updated.phone || "-");
      setAvatarInitials(
        `${updated.firstName?.[0] ?? ""}${updated.lastName?.[0] ?? ""}`.toUpperCase() || "?",
      );
      setEditSuccess(true);
      setTimeout(() => {
        setShowEditPanel(false);
        setEditSuccess(false);
      }, 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        setEditError(err.message);
      } else {
        setEditError("Unable to save profile. Please try again.");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Profile Dashboard</h1>
              <p className="text-gray-600">
                Manage your account and verification status
              </p>
            </div>
            <Link to="/admin">
              <Button variant="outline" size="sm">
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {avatarInitials}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <h2 className="text-xl font-bold mb-1">{displayName}</h2>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <RoleBadge role={role} size="sm" />
                  <VerificationBadge status={verificationStatus} size="sm" />
                </div>
                <p className="text-sm text-gray-600">Verified Account</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{displayEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{displayPhone}</span>
                </div>

              </div>

              <Button
                onClick={() => setShowEditPanel(!showEditPanel)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </Card>

            {/* Trust Score Card */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Trust Score</div>
                    <div className="font-semibold text-gray-900">
                      {trustScore >= 80 ? "Excellent" : trustScore >= 60 ? "Good" : trustScore >= 40 ? "Fair" : "Building"}
                    </div>
                  </div>
                </div>
                <div className="text-4xl font-bold text-green-600">{trustScore}</div>
              </div>

              <div className="w-full h-3 bg-green-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600"
                  style={{ width: `${trustScore}%` }}
                ></div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verification Level</span>
                  <span className="font-medium text-gray-900">Level {verificationLevel}/4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Documents Verified</span>
                  <span className="font-medium text-gray-900">6/6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium text-gray-900">98%</span>
                </div>
              </div>
            </Card>

            {/* Verification Level */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Verification Level
              </h3>

              <div className="space-y-4">
                {[
                  {
                    level: 1,
                    name: "Basic",
                    description: "Account created",
                    completed: true,
                  },
                  {
                    level: 2,
                    name: "Identity",
                    description: "Email verified",
                    completed: verificationLevel >= 2,
                  },
                  {
                    level: 3,
                    name: "Professional",
                    description: "KYC documents approved",
                    completed: verificationLevel >= 3,
                  },
                  {
                    level: 4,
                    name: "Premium",
                    description: "Background check complete",
                    completed: false,
                  },
                ].map((item) => (
                  <div
                    key={item.level}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      item.completed
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                        item.completed
                          ? "bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {item.completed ? <CheckCircle className="w-5 h-5" /> : item.level}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => window.location.href = "/kyc-upload"}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Verification
              </Button>
            </Card>
          </div>

          {/* Right Column - Details & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verification Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-8 h-8" />
                </div>
                <div className="text-2xl font-bold mb-1">{verificationStatus === "verified" ? "Verified" : verificationStatus === "pending" ? "Pending" : verificationStatus === "rejected" ? "Rejected" : "Unverified"}</div>
                <div className="text-sm text-blue-100">Identity Status</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="text-2xl font-bold mb-1">
                  {completedSteps.filter((s) => s.completed).length}/{completedSteps.length || 4}
                </div>
                <div className="text-sm text-green-100">Steps Completed</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-8 h-8" />
                </div>
                <div className="text-2xl font-bold mb-1">{trustScore}/100</div>
                <div className="text-sm text-purple-100">Trust Score</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-8 h-8" />
                </div>
                <div className="text-2xl font-bold mb-1">Level {verificationLevel}</div>
                <div className="text-sm text-orange-100">Verification Level</div>
              </Card>
            </div>

            {/* Completed Steps Checklist */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Verification Progress</h3>
              <div className="space-y-3">
                {completedSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      step.completed
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.completed
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${step.completed ? "text-gray-900" : "text-gray-600"}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">{step.date}</div>
                    </div>
                    {step.completed && (
                      <Eye className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
              {activityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No activity recorded yet.</p>
              ) : (
                <ActivityTimeline items={recentActivity} />
              )}
            </Card>

            {/* Security Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Security & Privacy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Two-Factor Auth
                </Button>
                <Button variant="outline" className="justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Settings
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Privacy Settings
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Panel - Side Drawer */}
      {showEditPanel && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setShowEditPanel(false)}
        >
          <div
            className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Edit Profile</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditPanel(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={displayEmail}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {editError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {editError}
                  </div>
                )}

                {editSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    Profile updated successfully!
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowEditPanel(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={isSavingEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
