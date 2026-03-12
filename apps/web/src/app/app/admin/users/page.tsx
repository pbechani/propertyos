'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Shield, CheckCircle, XCircle, MoreHorizontal, Filter, RefreshCw, AlertCircle, AlertTriangle, Ban, UserCheck } from 'lucide-react';
import { adminUsersApi, type AdminUserRecord } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

const ROLE_STYLES: Record<string, string> = {
  buyer: 'bg-sky-100 text-sky-700',
  seller: 'bg-teal-100 text-teal-700',
  agent: 'bg-blue-100 text-blue-700',
  contractor: 'bg-orange-100 text-orange-700',
  supplier: 'bg-yellow-100 text-yellow-700',
  conveyancer: 'bg-indigo-100 text-indigo-700',
  inspector: 'bg-emerald-100 text-emerald-700',
  admin: 'bg-red-100 text-red-700',
};

const KYC_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  not_submitted: 'bg-gray-100 text-gray-500',
};

const KYC_LABELS: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  not_submitted: 'Not Submitted',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  under_investigation: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  deleted: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  under_investigation: 'Investigating',
  suspended: 'Suspended',
  deleted: 'Deleted',
};

const ROLES = ['all', 'buyer', 'agent', 'contractor', 'supplier', 'conveyancer', 'inspector', 'admin'];
const KYC_STATUSES = ['all', 'approved', 'pending', 'rejected', 'not_submitted'];

type ActionType = 'investigate' | 'suspend' | 'reinstate';

interface ActionModal {
  type: ActionType;
  userId: string;
  userName: string;
}

export default function Page() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');

  // Action modal state
  const [actionModal, setActionModal] = useState<ActionModal | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        return;
      }
      const result = await adminUsersApi.list(token, {
        limit: 200,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: search.trim() || undefined,
      });
      setUsers(result?.data ?? []);
      setTotal(result?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const filtered = kycFilter === 'all'
    ? users
    : users.filter((u) => (u.kycStatus ?? 'not_submitted') === kycFilter);

  const kycApprovedCount = users.filter((u) => u.kycStatus === 'approved').length;
  const kycPendingCount = users.filter((u) => u.kycStatus === 'pending').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;
  const investigatingCount = users.filter((u) => u.status === 'under_investigation').length;

  const openModal = (type: ActionType, userId: string, userName: string) => {
    setActionModal({ type, userId, userName });
    setActionReason('');
    setActionError(null);
  };

  const closeModal = () => {
    if (actionLoading) return;
    setActionModal(null);
    setActionReason('');
    setActionError(null);
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication required.');
      const { type, userId } = actionModal;
      if (type === 'investigate') {
        await adminUsersApi.investigate(token, userId, actionReason.trim() || undefined);
      } else if (type === 'suspend') {
        await adminUsersApi.suspend(token, userId, actionReason.trim() || undefined);
      } else {
        await adminUsersApi.reinstate(token, userId);
      }
      setActionModal(null);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const ACTION_CONFIG: Record<ActionType, { label: string; description: (name: string) => string; btnClass: string; showReason: boolean }> = {
    investigate: {
      label: 'Place Under Investigation',
      description: (name) => `Place ${name} under investigation. Their account will remain accessible but company admins will be notified.`,
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      showReason: true,
    },
    suspend: {
      label: 'Suspend Account',
      description: (name) => `Suspend ${name}'s account. They will be logged out and will not be able to log in until reinstated. Company admins will be notified.`,
      btnClass: 'bg-red-600 hover:bg-red-700 text-white',
      showReason: true,
    },
    reinstate: {
      label: 'Reinstate Account',
      description: (name) => `Reinstate ${name}'s account. They will regain full access and will be notified by email.`,
      btnClass: 'bg-green-600 hover:bg-green-700 text-white',
      showReason: false,
    },
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">View and manage all registered users on the platform</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
          <button
            onClick={load}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{loading ? '—' : total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Users</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{loading ? '—' : kycApprovedCount}</p>
          <p className="text-sm text-gray-500 mt-1">KYC Approved</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm bg-amber-50/30">
          <p className="text-2xl font-bold text-amber-600">{loading ? '—' : kycPendingCount}</p>
          <p className="text-sm text-gray-500 mt-1">KYC Pending</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-2xl font-bold text-orange-600">{loading ? '—' : suspendedCount}</p>
          <p className="text-sm text-gray-500 mt-1">Suspended</p>
        </div>
      </div>

      {investigatingCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><strong>{investigatingCount}</strong> user{investigatingCount !== 1 ? 's are' : ' is'} currently under investigation.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">{r === 'all' ? 'All roles' : r}</option>
            ))}
          </select>
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {KYC_STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All KYC' : KYC_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">User</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">Role</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">KYC Status</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden lg:table-cell">Companies</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden lg:table-cell">Joined</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Status</th>
              <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No users found
                </td>
              </tr>
            ) : filtered.map((user) => {
              const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
              const initial = displayName.charAt(0).toUpperCase();
              const kycKey = user.kycStatus ?? 'not_submitted';
              const statusKey = user.status ?? 'active';
              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-blue-600">{initial}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {user.role ? (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${ROLE_STYLES[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      {kycKey === 'approved' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : kycKey === 'rejected' ? (
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${KYC_STYLES[kycKey] ?? 'bg-gray-100 text-gray-600'}`}>
                        {KYC_LABELS[kycKey] ?? kycKey}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-sm text-gray-600">{user.companyCount}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[statusKey] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[statusKey] ?? statusKey}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {(statusKey === 'active' || statusKey === 'under_investigation') && (
                        <>
                          {statusKey === 'active' && (
                            <button
                              onClick={() => openModal('investigate', user.id, displayName)}
                              className="flex items-center gap-1 px-2 py-1.5 text-xs text-amber-700 hover:bg-amber-50 rounded-md transition-colors font-medium"
                              title="Place under investigation"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Investigate
                            </button>
                          )}
                          <button
                            onClick={() => openModal('suspend', user.id, displayName)}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-700 hover:bg-red-50 rounded-md transition-colors font-medium"
                            title="Suspend account"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                        </>
                      )}
                      {(statusKey === 'suspended' || statusKey === 'under_investigation') && (
                        <button
                          onClick={() => openModal('reinstate', user.id, displayName)}
                          className="flex items-center gap-1 px-2 py-1.5 text-xs text-green-700 hover:bg-green-50 rounded-md transition-colors font-medium"
                          title="Reinstate account"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Reinstate
                        </button>
                      )}
                      {statusKey === 'deleted' && (
                        <span className="text-xs text-gray-400 px-2">
                          <MoreHorizontal className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">Showing {filtered.length} of {total} users</div>

      {/* Action Modal */}
      {actionModal && (() => {
        const config = ACTION_CONFIG[actionModal.type];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">{config.label}</h2>
              <p className="text-sm text-gray-600">{config.description(actionModal.userName)}</p>

              {config.showReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reason <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Provide a reason that will be included in notifications…"
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}

              {actionError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {actionError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeModal}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${config.btnClass}`}
                >
                  {actionLoading ? 'Processing…' : config.label}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
