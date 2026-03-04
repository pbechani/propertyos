'use client';

import { useState, useEffect } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { getActiveCompanyContext, getAccessToken } from "@/lib/auth-session";
import { companiesApi, type CompanyMember, type CompanyInvitation } from "@/lib/api-client";
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
  Mail,
  Ban,
} from "lucide-react";

function memberName(m: CompanyMember): string {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ');
  return full || m.email;
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function invitedByName(inv: CompanyInvitation): string {
  const full = [inv.invited_by_first_name, inv.invited_by_last_name].filter(Boolean).join(' ');
  return full || inv.invited_by_email || '—';
}

function isExpired(inv: CompanyInvitation): boolean {
  return inv.status === 'pending' && new Date(inv.expires_at).getTime() < Date.now();
}

export default function CompanyUserManagement() {
  const navigate = useNavigate();
  const activeCompany = getActiveCompanyContext();

  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended" | "revoked">("all");
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCompany || activeCompany.slug === 'self') {
      navigate('/app/my-dashboard');
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    Promise.all([
      companiesApi.listMembers(token, activeCompany.id),
      companiesApi.listInvitations(token, activeCompany.id),
    ])
      .then(([membersData, invitationsData]) => {
        setMembers(membersData);
        setInvitations(invitationsData);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load members'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRevokeInvitation = async (inviteId: string) => {
    const token = getAccessToken();
    if (!token || !activeCompany) return;
    setRevoking(inviteId);
    try {
      await companiesApi.revokeInvitation(token, activeCompany.id, inviteId);
      setInvitations(prev =>
        prev.map(inv => inv.id === inviteId ? { ...inv, status: 'revoked' as const } : inv)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    } finally {
      setRevoking(null);
    }
  };

  const companyName = activeCompany?.name ?? 'Company';

  const filtered = members.filter((m) => {
    const name = memberName(m);
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || m.status === filter;
    return matchSearch && matchFilter;
  });

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' && !isExpired(inv));
  const revokedOrExpiredInvitations = invitations.filter(inv => inv.status === 'revoked' || isExpired(inv));

  const counts = {
    total: members.length,
    active: members.filter((m) => m.status === "active").length,
    suspended: members.filter((m) => m.status === "suspended").length,
    revoked: members.filter((m) => m.status === "revoked").length,
    pendingInvites: pendingInvitations.length,
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
      <div className="grid grid-cols-5 gap-6 mb-6">
        <StatCard label="Total Members" value={counts.total} icon={Users} color="bg-indigo-100 text-indigo-600" />
        <StatCard label="Active" value={counts.active} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard label="Suspended" value={counts.suspended} icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Revoked" value={counts.revoked} icon={UserX} color="bg-red-100 text-red-600" />
        <StatCard label="Pending Invites" value={counts.pendingInvites} icon={Mail} color="bg-blue-100 text-blue-600" />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

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

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
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
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                  Loading members…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                  No members found
                </td>
              </tr>
            ) : (
              filtered.map((member) => {
                const name = memberName(member);
                const permCount = Array.isArray(member.permissions) ? member.permissions.length : 0;
                return (
                  <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full flex-shrink-0">
                          <span className="text-sm text-indigo-600">{initials(name)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                          {member.role.toUpperCase()}
                        </span>
                        {member.is_admin && (
                          <Shield className="w-4 h-4 text-amber-500" aria-label="Admin" />
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
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle className="w-4 h-4" /> Accepted
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{permCount} permissions</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invitations Section */}
      {!loading && (
        <div>
          <h2 className="text-xl mb-4">Invitations</h2>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
              <div className="px-6 py-4 bg-blue-50 border-b border-gray-200 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Pending Invitations ({pendingInvitations.length})</span>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Invited By</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Sent</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Expires</th>
                    <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvitations.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium">{inv.invited_email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                            {inv.role.toUpperCase()}
                          </span>
                          {inv.is_admin && <Shield className="w-4 h-4 text-amber-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invitedByName(inv)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          disabled={revoking === inv.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {revoking === inv.id ? 'Revoking…' : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Revoked / Expired Invitations */}
          {revokedOrExpiredInvitations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">Revoked &amp; Expired ({revokedOrExpiredInvitations.length})</span>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Invited By</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {revokedOrExpiredInvitations.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 opacity-70">
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.invited_email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          {inv.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isExpired(inv) ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                            <Clock className="w-3.5 h-3.5" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
                            <XCircle className="w-3.5 h-3.5" /> Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invitedByName(inv)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pendingInvitations.length === 0 && revokedOrExpiredInvitations.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-400">
              No invitations yet. Use <strong>Invite Member</strong> to add people to this company.
            </div>
          )}
        </div>
      )}
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


