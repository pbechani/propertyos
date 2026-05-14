'use client';

import { useState, useEffect } from "react";
import { Link } from "@/lib/router-compat";
import { UserPlus, Mail, ArrowLeft, Send, CheckCircle, Shield, Loader2 } from "lucide-react";
import { getActiveCompanyContext, getAccessToken } from "@/lib/auth-session";
import { companiesApi, type CompanyMemberPermission } from "@/lib/api-client";

// ─── Display metadata (same table as CompanyPermissions) ──────────────────────
const PERM_DISPLAY: Record<string, { name: string; description: string; category: string }> = {
  'property:read':   { name: 'View Listings',        description: 'View all company property listings',     category: 'Property'  },
  'property:create': { name: 'Create Listing',       description: 'Create new property listings',           category: 'Property'  },
  'property:update': { name: 'Update Listing',       description: 'Edit existing property listings',        category: 'Property'  },
  'property:full':   { name: 'Full Property Access', description: 'Complete control over property module',  category: 'Property'  },
  'project:read':    { name: 'View Projects',        description: 'View construction projects',             category: 'Projects'  },
  'project:create':  { name: 'Create Projects',      description: 'Create new construction projects',       category: 'Projects'  },
  'project:update':  { name: 'Update Projects',      description: 'Update project progress and details',    category: 'Projects'  },
  'project:full':    { name: 'Full Project Access',  description: 'Complete control over project module',   category: 'Projects'  },
  'escrow:read':     { name: 'View Escrow',          description: 'View escrow accounts and transactions',  category: 'Financial' },
  'escrow:deposit':  { name: 'Deposit to Escrow',    description: 'Initiate escrow deposits',               category: 'Financial' },
  'escrow:full':     { name: 'Full Escrow Access',   description: 'Complete control over escrow module',   category: 'Financial' },
  'users:self':      { name: 'Manage Own Profile',   description: 'Update own user profile and settings',   category: 'Identity'  },
  'users:full':      { name: 'Full User Management', description: 'Manage all users and roles',             category: 'Identity'  },
  'kyc:submit':      { name: 'Submit KYC',           description: 'Submit identity verification documents', category: 'Identity'  },
  'kyc:approve':     { name: 'Approve KYC',          description: 'Review and approve KYC submissions',     category: 'Identity'  },
};

function permKey(p: CompanyMemberPermission) { return `${p.resource}:${p.action}`; }

function resolveDisplay(p: CompanyMemberPermission) {
  const d = PERM_DISPLAY[permKey(p)];
  if (d) return d;
  const name = `${p.action.charAt(0).toUpperCase() + p.action.slice(1)} ${p.resource.charAt(0).toUpperCase() + p.resource.slice(1)}`;
  return { name, description: `${p.action} access for ${p.resource}`, category: p.resource.charAt(0).toUpperCase() + p.resource.slice(1) };
}

function groupPerms(perms: CompanyMemberPermission[]): Record<string, CompanyMemberPermission[]> {
  return perms.reduce((acc, p) => {
    const { category } = resolveDisplay(p);
    (acc[category] = acc[category] || []).push(p);
    return acc;
  }, {} as Record<string, CompanyMemberPermission[]>);
}

export default function CompanyInviteUser() {
  const activeCompany = getActiveCompanyContext();
  const companyId = activeCompany?.id ?? null;

  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [rolePermissions, setRolePermissions] = useState<CompanyMemberPermission[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    role: '',
    isAdmin: false,
    selectedPermissions: [] as CompanyMemberPermission[],
  });
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load allowed roles for this company
  useEffect(() => {
    const token = getAccessToken();
    if (!token || !companyId) return;
    setLoadingRoles(true);
    companiesApi
      .getAllowedRoles(token, companyId)
      .then(setAllowedRoles)
      .catch(() => setAllowedRoles([]))
      .finally(() => setLoadingRoles(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load ceiling permissions when role changes
  useEffect(() => {
    if (!formData.role || !companyId) {
      setRolePermissions([]);
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    setLoadingPerms(true);
    companiesApi
      .getRolePermissions(token, companyId, formData.role)
      .then((perms) => {
        setRolePermissions(perms);
        // Pre-select all ceiling permissions by default
        setFormData((prev) => ({ ...prev, selectedPermissions: perms }));
      })
      .catch(() => setRolePermissions([]))
      .finally(() => setLoadingPerms(false));
  }, [formData.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = groupPerms(rolePermissions);

  const hasPermission = (p: CompanyMemberPermission) =>
    formData.selectedPermissions.some((s) => s.resource === p.resource && s.action === p.action);

  const togglePermission = (p: CompanyMemberPermission) =>
    setFormData((prev) => ({
      ...prev,
      selectedPermissions: hasPermission(p)
        ? prev.selectedPermissions.filter((s) => !(s.resource === p.resource && s.action === p.action))
        : [...prev.selectedPermissions, p],
    }));

  const toggleAll = (category: string) => {
    const catPerms = grouped[category] ?? [];
    const allSelected = catPerms.every(hasPermission);
    setFormData((prev) => ({
      ...prev,
      selectedPermissions: allSelected
        ? prev.selectedPermissions.filter((s) => !catPerms.some((c) => c.resource === s.resource && c.action === s.action))
        : [...new Set([...prev.selectedPermissions, ...catPerms])],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    const token = getAccessToken();
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      await companiesApi.inviteMember(token, companyId, {
        email: formData.email,
        role: formData.role,
        is_admin: formData.isAdmin,
        permissions: formData.selectedPermissions,
      });
      setIsSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl mb-2">Invitation Sent!</h2>
          <p className="text-gray-600 mb-6">
            An invitation email has been sent to <strong>{formData.email}</strong>. The link will
            expire in 72 hours.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setIsSent(false); setFormData({ email: "", role: "", isAdmin: false, selectedPermissions: [] }); }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
            >
              Invite Another
            </button>
            <Link
              to="/company/users"
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:border-gray-400 transition text-sm"
            >
              Back to Users
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/company/users"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl mb-1">Invite Team Member</h1>
          <p className="text-gray-600">Send an invitation email with a role and permissions</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg mb-5 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invitation Details
            </h2>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="member@company.com"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  An invitation link valid for 72 hours will be sent to this address.
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, role: e.target.value, selectedPermissions: [] }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="">Select a role…</option>
                  {loadingRoles ? (
                    <option disabled>Loading…</option>
                  ) : (
                    allowedRoles.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Admin Toggle */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData((p) => ({ ...p, isAdmin: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-indigo-600"
                />
                <label htmlFor="isAdmin" className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">Grant Admin Privileges</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Admins can manage users, update company settings, and create other admins. Use
                    with caution.
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Permissions */}
          {formData.role && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Assign Permissions
                </h2>
                <span className="text-sm text-gray-500">
                  {formData.selectedPermissions.length} / {rolePermissions.length} selected
                </span>
              </div>

              {loadingPerms ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : rolePermissions.length === 0 ? (
                <p className="text-sm text-gray-500">No permissions defined for this role.</p>
              ) : (
                <div className="space-y-5">
                  {Object.entries(grouped).map(([category, perms]) => {
                    const allSelected = perms.every(hasPermission);
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-700">{category}</h3>
                          <button
                            type="button"
                            onClick={() => toggleAll(category)}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            {allSelected ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {perms.map((perm) => {
                            const { name, description } = resolveDisplay(perm);
                            const has = hasPermission(perm);
                            return (
                              <label
                                key={permKey(perm)}
                                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                                  has ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="relative mt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={has}
                                    onChange={() => togglePermission(perm)}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  {has && (
                                    <CheckCircle className="absolute -top-1 -right-1 w-3 h-3 text-indigo-600 bg-white rounded-full" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{name}</p>
                                  <p className="text-xs text-gray-500">{description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.role}
              className={`flex-1 py-3 rounded-lg transition flex items-center justify-center gap-2 ${
                !isLoading && formData.email && formData.role
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
              {isLoading ? "Sending…" : "Send Invitation"}
            </button>
            <Link
              to="/company/users"
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition flex items-center gap-2 text-sm text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
