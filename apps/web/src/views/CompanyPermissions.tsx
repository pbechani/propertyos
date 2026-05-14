'use client';

import { useState, useEffect } from "react";
import { Settings, Search, Save, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "@/lib/router-compat";
import { getActiveCompanyContext, getAccessToken } from "@/lib/auth-session";
import { companiesApi, type CompanyMember, type CompanyMemberPermission } from "@/lib/api-client";

// ─── Display metadata ──────────────────────────────────────────────────────────
// Maps "resource:action" → human-readable label and UI category.
// The available ceiling permissions come from the API; this table is for labelling only.
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

function permKey(p: CompanyMemberPermission) {
  return `${p.resource}:${p.action}`;
}

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

function memberName(m: CompanyMember) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ');
  return full || m.email;
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('');
}

export default function CompanyPermissions() {
  const navigate = useNavigate();
  const activeCompany = getActiveCompanyContext();
  const companyId = activeCompany?.id ?? null;
  const companyName = activeCompany?.name ?? 'Company';

  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberPerms, setMemberPerms] = useState<Record<string, CompanyMemberPermission[]>>({});
  const [ceilingPerms, setCeilingPerms] = useState<CompanyMemberPermission[]>([]);
  const [loadingCeiling, setLoadingCeiling] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');

  // Load members on mount
  useEffect(() => {
    if (!activeCompany || activeCompany.slug === 'self') {
      navigate('/app/my-dashboard');
      return;
    }
    const token = getAccessToken();
    if (!token || !companyId) return;
    setLoadingMembers(true);
    companiesApi
      .listMembers(token, companyId)
      .then((data) => {
        const active = data.filter((m) => m.status === 'active' && !m.is_admin);
        setMembers(active);
        const initial: Record<string, CompanyMemberPermission[]> = {};
        active.forEach((m) => { initial[m.user_id] = Array.isArray(m.permissions) ? m.permissions : []; });
        setMemberPerms(initial);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load members'))
      .finally(() => setLoadingMembers(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load ceiling permissions when a member is selected
  useEffect(() => {
    if (!selectedMemberId || !companyId) return;
    const member = members.find((m) => m.user_id === selectedMemberId);
    if (!member) return;
    const token = getAccessToken();
    if (!token) return;
    setLoadingCeiling(true);
    companiesApi
      .getRolePermissions(token, companyId, member.role)
      .then(setCeilingPerms)
      .catch(() => setCeilingPerms([]))
      .finally(() => setLoadingCeiling(false));
  }, [selectedMemberId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedMember = members.find((m) => m.user_id === selectedMemberId);
  const currentPerms = selectedMemberId ? (memberPerms[selectedMemberId] ?? []) : [];
  const grouped = groupPerms(ceilingPerms);

  const hasPermission = (p: CompanyMemberPermission) =>
    currentPerms.some((c) => c.resource === p.resource && c.action === p.action);

  const toggle = (p: CompanyMemberPermission) => {
    if (!selectedMemberId) return;
    setMemberPerms((prev) => {
      const existing = prev[selectedMemberId] ?? [];
      const has = existing.some((c) => c.resource === p.resource && c.action === p.action);
      return {
        ...prev,
        [selectedMemberId]: has
          ? existing.filter((c) => !(c.resource === p.resource && c.action === p.action))
          : [...existing, p],
      };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedMember || !companyId) return;
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      await companiesApi.updateMemberPermissions(token, companyId, selectedMember.id, currentPerms);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      memberName(m).toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Permission Management</h1>
        <p className="text-gray-600">{companyName} · Configure fine-grained permissions for each team member</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Member List */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-medium mb-4">Active Members</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {loadingMembers ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No active non-admin members found.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredMembers.map((m) => {
                const isSelected = selectedMemberId === m.user_id;
                const permCount = (memberPerms[m.user_id] ?? []).length;
                const ceilingCount = m.user_id === selectedMemberId ? ceilingPerms.length : '?';
                return (
                  <button
                    key={m.user_id}
                    onClick={() => { setSelectedMemberId(m.user_id); setSaved(false); }}
                    className={`w-full p-3 rounded-lg text-left transition border-2 ${
                      isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full flex-shrink-0">
                        <span className="text-sm text-indigo-600">{initials(memberName(m))}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{memberName(m)}</p>
                        <p className="text-xs text-gray-500 truncate">{m.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{m.role}</p>
                        <p className="text-xs text-gray-400">{permCount}/{ceilingCount} permissions</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Permissions Panel */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          {selectedMember ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h2 className="text-lg">Configure Permissions</h2>
                    <p className="text-sm text-gray-600">
                      {memberName(selectedMember)} — <span className="capitalize">{selectedMember.role}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm ${
                    saved ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                  }`}
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : saved ? (
                    <><CheckCircle className="w-4 h-4" /> Saved</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-5">
                Permissions shown are limited to the ceiling allowed for the{' '}
                <strong>{selectedMember.role}</strong> role. You cannot grant permissions beyond the role baseline.
              </p>

              {loadingCeiling ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : ceilingPerms.length === 0 ? (
                <p className="text-sm text-gray-500">No permissions defined for role &quot;{selectedMember.role}&quot;.</p>
              ) : (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                  {Object.entries(grouped).map(([category, perms]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
                        <span className="text-xs text-gray-500">
                          {perms.filter(hasPermission).length}/{perms.length}
                        </span>
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
                                  onChange={() => toggle(perm)}
                                  className="w-4 h-4 text-indigo-600"
                                />
                                {has && <CheckCircle className="absolute -top-1 -right-1 w-3 h-3 text-indigo-600 bg-white rounded-full" />}
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
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <Settings className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg text-gray-600 mb-2">Select a Member</h3>
              <p className="text-sm text-gray-500">
                Choose a member from the list to configure their permissions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
