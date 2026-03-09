'use client';

import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { useNavigate } from "@/lib/router-compat";
import { getActiveCompanyContext, getAccessToken } from "@/lib/auth-session";
import { companiesApi, type CompanyDashboardData } from "@/lib/api-client";
import {
  Users,
  Activity,
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  ChevronRight,
  UserX,
  Shield,
  Mail,
  Loader2,
} from "lucide-react";

type StatItem = {
  name: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\./g, ' › ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function actorName(entry: CompanyDashboardData['recentActivity'][number]): string {
  if (entry.first_name || entry.last_name) {
    return [entry.first_name, entry.last_name].filter(Boolean).join(' ');
  }
  return entry.email ?? 'Unknown user';
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<CompanyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCompany = getActiveCompanyContext();

  useEffect(() => {
    if (!activeCompany || activeCompany.slug === 'self' || !activeCompany.is_admin) {
      navigate('/app/my-dashboard');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    companiesApi
      .getDashboard(token, activeCompany.id)
      .then(setData)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error ?? 'Could not load dashboard data.'}</p>
        </div>
      </div>
    );
  }

  const { company, stats, recentActivity } = data;

  const statItems: StatItem[] = [
    {
      name: "Active Members",
      value: stats.activeMembers,
      icon: Users,
      color: "bg-blue-500",
      sub: "Across all roles",
    },
    {
      name: "Today's Activities",
      value: stats.todayActivities,
      icon: Activity,
      color: "bg-green-500",
      sub: "Actions logged today",
    },
    {
      name: "Pending Invitations",
      value: stats.pendingInvitations,
      icon: Mail,
      color: "bg-amber-500",
      sub: "Awaiting acceptance",
    },
    {
      name: "Company Status",
      value: company.verification_status === "verified" ? "Verified" : "Pending",
      icon: company.verification_status === "verified" ? CheckCircle : Clock,
      color: company.verification_status === "verified" ? "bg-emerald-500" : "bg-gray-400",
      sub: company.verification_status === "verified" ? "Fully active" : "Under review",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-1">Company Dashboard</h1>
        <p className="text-gray-600">
          Welcome to <strong>{company.name}</strong> — {company.category} workspace
        </p>
      </div>

      {/* Verification Banner */}
      {company.verification_status === "pending" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-900 font-medium mb-0.5">Company Verification Pending</p>
            <p className="text-sm text-amber-700">
              Your company profile is currently under review. You cannot invite members until
              verification is complete. We'll notify you once it's approved.
            </p>
          </div>
        </div>
      )}

      {company.verification_status === "verified" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-900 font-medium">Company Verified</p>
            <p className="text-sm text-green-700">
              Your company is verified and has full access. You can invite team members.
            </p>
          </div>
        </div>
      )}

      {company.verification_status === "rejected" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-900 font-medium">Verification Rejected</p>
            <p className="text-sm text-red-700 mb-2">
              Your company verification was rejected. Please review the feedback and resubmit.
            </p>
            <Link
              to="/company/profile"
              className="text-sm text-red-700 underline hover:text-red-800"
            >
              View company profile →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {statItems.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-lg ${stat.color}`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.name}</div>
              <div className="text-xs text-gray-500">{stat.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl">Recent Activity</h2>
            <Link to="/company/activities" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No activity recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0">
                    <Activity className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <strong>{actorName(item)}</strong> — {formatAction(item.action)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/company/users/invite"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition group"
            >
              <Users className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              <div>
                <p className="text-sm font-medium">Invite Team Member</p>
                <p className="text-xs text-gray-500">Send an email invitation</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              to="/company/permissions"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition group"
            >
              <Shield className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              <div>
                <p className="text-sm font-medium">Manage Permissions</p>
                <p className="text-xs text-gray-500">Control member access</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              to="/company/profile"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition group"
            >
              <Building2 className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              <div>
                <p className="text-sm font-medium">Company Profile</p>
                <p className="text-xs text-gray-500">View & edit details</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>

            {stats.openOrphanedTasks > 0 && (
              <Link
                to="/company/revoked-pool"
                className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition group"
              >
                <UserX className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-700">Revoked Pool</p>
                  <p className="text-xs text-red-600">
                    {stats.openOrphanedTasks} task{stats.openOrphanedTasks > 1 ? "s" : ""} need attention
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400 ml-auto" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
