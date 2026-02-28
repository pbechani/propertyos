'use client';

import { useState, useEffect } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { getActiveCompanyContext } from "@/lib/auth-session";
import {
  Users,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  UserX,
  UserPlus,
  Shield,
} from "lucide-react";

type MemberStatus = "active" | "suspended" | "revoked";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  status: MemberStatus;
  invitationAccepted: boolean;
  permissionsCount: number;
  joinedAt: string;
};

// Stub data — replace with GET /api/v1/companies/:id/members
const STUB_MEMBERS: Member[] = [
  { id: "1", userId: "u1", name: "Sarah Johnson", email: "sarah@eliteprops.co.ke", role: "agent", isAdmin: false, status: "active", invitationAccepted: true, permissionsCount: 4, joinedAt: "2025-12-01T09:00:00Z" },
  { id: "2", userId: "u2", name: "Mike Chen", email: "mike@eliteprops.co.ke", role: "agent", isAdmin: false, status: "active", invitationAccepted: true, permissionsCount: 3, joinedAt: "2025-12-10T09:00:00Z" },
  { id: "3", userId: "u3", name: "Lisa Patel", email: "lisa@eliteprops.co.ke", role: "agent", isAdmin: false, status: "active", invitationAccepted: false, permissionsCount: 2, joinedAt: "2026-01-05T09:00:00Z" },
  { id: "4", userId: "u4", name: "Tom Williams", email: "tom@eliteprops.co.ke", role: "admin", isAdmin: true, status: "active", invitationAccepted: true, permissionsCount: 10, joinedAt: "2025-11-15T09:00:00Z" },
  { id: "5", userId: "u5", name: "Anna Brooks", email: "anna@eliteprops.co.ke", role: "agent", isAdmin: false, status: "suspended", invitationAccepted: true, permissionsCount: 1, joinedAt: "2026-01-20T09:00:00Z" },
];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("");
}

export default function CompanyUserManagement() {
  const navigate = useNavigate();
  const activeCompany = getActiveCompanyContext();

  useEffect(() => {
    if (!activeCompany || activeCompany.slug === 'self') {
      navigate('/app/my-dashboard');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const companyName = activeCompany?.name ?? 'Company';

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended" | "revoked">("all");

  const filtered = STUB_MEMBERS.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || m.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    total: STUB_MEMBERS.length,
    active: STUB_MEMBERS.filter((m) => m.status === "active").length,
    suspended: STUB_MEMBERS.filter((m) => m.status === "suspended").length,
    revoked: STUB_MEMBERS.filter((m) => m.status === "revoked").length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2">User Management</h1>
          <p className="text-gray-600">{companyName} · Manage company members, roles, and permissions</p>
        </div>
        <Link
          to="/company/users/invite"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Invite Member
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Members" value={counts.total} icon={Users} color="bg-indigo-100 text-indigo-600" />
        <StatCard label="Active" value={counts.active} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard label="Suspended" value={counts.suspended} icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Revoked" value={counts.revoked} icon={UserX} color="bg-red-100 text-red-600" />
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "suspended", "revoked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition text-sm capitalize ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Member</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Role</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Invitation</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Permissions</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Joined</th>
              <th className="px-6 py-4 text-right text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                  No members found
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full flex-shrink-0">
                        <span className="text-sm text-indigo-600">{initials(member.name)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                        {member.role.toUpperCase()}
                      </span>
                      {member.isAdmin && (
                        <Shield className="w-4 h-4 text-amber-500" title="Admin" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {member.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle className="w-4 h-4" /> Active
                      </span>
                    ) : member.status === "suspended" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                        <Clock className="w-4 h-4" /> Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
                        <XCircle className="w-4 h-4" /> Revoked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {member.invitationAccepted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle className="w-4 h-4" /> Accepted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                        <Clock className="w-4 h-4" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{member.permissionsCount} permissions</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl">{value}</p>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
