'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Building2, CheckCircle, XCircle, Eye, Filter } from 'lucide-react';
import { adminCompaniesApi, type AdminCompany } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

const CATEGORY_LABELS: Record<string, string> = {
  agent: 'Estate Agency',
  estate_agency: 'Estate Agency',
  contractor: 'Contractor',
  supplier: 'Supplier',
  conveyancer: 'Conveyancer',
  inspector: 'Inspector',
  developer: 'Developer',
  developing: 'Developer',
  logistics: 'Logistics',
};

function StatusBadge({ company }: { company: AdminCompany }) {
  const { status, verification_status } = company;
  if (status === 'active' || verification_status === 'verified') {
    return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Verified</span>;
  }
  if (status === 'pending_verification' || verification_status === 'pending') {
    return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Pending</span>;
  }
  if (verification_status === 'rejected' || status === 'rejected') {
    return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Rejected</span>;
  }
  if (status === 'suspended') {
    return <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Suspended</span>;
  }
  if (status === 'under_investigation') {
    return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Under Investigation</span>;
  }
  return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full capitalize">{status}</span>;
}

function isPending(c: AdminCompany) {
  return c.status === 'pending_verification' || c.verification_status === 'pending';
}

export default function Page() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'pending' | 'active' | 'under_investigation' | 'suspended' | 'rejected' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) { setError('Not authenticated'); setLoading(false); return; }
    try {
      const res = await adminCompaniesApi.list(token, { limit: 100 });
      setCompanies(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      q === '' ||
      c.name.toLowerCase().includes(q) ||
      (c.registration_number ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q);

    if (tab === 'pending') return matchesSearch && isPending(c);
    if (tab === 'active') return matchesSearch && c.status === 'active';
    if (tab === 'under_investigation') return matchesSearch && c.status === 'under_investigation';
    if (tab === 'suspended') return matchesSearch && c.status === 'suspended';
    if (tab === 'rejected') return matchesSearch && (c.verification_status === 'rejected' || c.status === 'rejected');
    return matchesSearch;
  });

  const pendingCount = companies.filter(isPending).length;
  const activeCount = companies.filter((c) => c.status === 'active').length;
  const underInvestigationCount = companies.filter((c) => c.status === 'under_investigation').length;
  const suspendedCount = companies.filter((c) => c.status === 'suspended').length;
  const rejectedCount = companies.filter((c) => c.verification_status === 'rejected' || c.status === 'rejected').length;

  const tabs: { key: typeof tab; label: string; count: number; countColor?: string }[] = [
    { key: 'pending', label: 'Pending Approval', count: pendingCount },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'under_investigation', label: 'Under Investigation', count: underInvestigationCount, countColor: 'bg-yellow-100 text-yellow-800' },
    { key: 'suspended', label: 'Suspended', count: suspendedCount, countColor: 'bg-red-100 text-red-700' },
    { key: 'rejected', label: 'Rejected', count: rejectedCount },
    { key: 'all', label: 'All', count: companies.length },
  ];

  async function handleVerify(company: AdminCompany) {
    const token = getAccessToken();
    if (!token) return;
    setActionLoading(company.id);
    try {
      const updated = await adminCompaniesApi.verify(token, company.id);
      setCompanies((prev) => prev.map((c) => (c.id === company.id ? { ...c, ...updated } : c)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to verify company');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(company: AdminCompany) {
    const reason = window.prompt(`Reason for rejecting "${company.name}":`);
    if (!reason?.trim()) return;
    const token = getAccessToken();
    if (!token) return;
    setActionLoading(company.id);
    try {
      const updated = await adminCompaniesApi.reject(token, company.id, reason.trim());
      setCompanies((prev) => prev.map((c) => (c.id === company.id ? { ...c, ...updated } : c)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject company');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
        <p className="text-gray-600 mt-1">Review and approve company registrations on the platform</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              tab === t.key
                ? t.countColor ?? (t.key === 'pending' ? 'bg-amber-100 text-amber-700'
                  : t.key === 'rejected' ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700')
                : 'bg-gray-200 text-gray-600'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or reg number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Company</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">Category</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden lg:table-cell">Contact</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden xl:table-cell">Reg Number</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden lg:table-cell">Submitted</th>
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
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No companies found
                </td>
              </tr>
            ) : filtered.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg shrink-0 overflow-hidden bg-indigo-100 flex items-center justify-center">
                      {company.logo_url
                        ? <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                        : <Building2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-400">
                        {company.address?.city ?? '—'}
                        {company.address?.country ? ` · ${company.address.country}` : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <span className="text-sm text-gray-700">{CATEGORY_LABELS[company.category] ?? company.category}</span>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <div>
                    <p className="text-sm text-gray-900">{company.email ?? '—'}</p>
                    <p className="text-xs text-gray-400">{company.phone ?? ''}</p>
                  </div>
                </td>
                <td className="px-5 py-4 hidden xl:table-cell">
                  <span className="text-sm font-mono text-gray-600">{company.registration_number ?? '—'}</span>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <span className="text-sm text-gray-600">
                    {new Date(company.created_at).toLocaleDateString('en-ZA', { dateStyle: 'medium' })}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge company={company} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/app/admin/companies/${company.id}`}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {isPending(company) && (
                      <>
                        <button
                          onClick={() => void handleVerify(company)}
                          disabled={actionLoading === company.id}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => void handleReject(company)}
                          disabled={actionLoading === company.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <p>Showing {filtered.length} of {companies.length} companies</p>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40" disabled>Previous</button>
          <span className="px-3 py-1.5 bg-amber-600 text-white rounded-md font-medium">1</span>
          <button className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40" disabled>Next</button>
        </div>
      </div>
    </div>
  );
}
