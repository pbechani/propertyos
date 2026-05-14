'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, Search, CheckCircle, XCircle, RefreshCw,
  ExternalLink, Loader2, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { adminFraudApi, type FraudReport } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-700',
  under_investigation: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_investigation: 'Under Investigation',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  double_sale: 'Double Sale',
  fake_title: 'Fake Title',
  non_existent: 'Non-Existent',
  misrepresentation: 'Misrepresentation',
  other: 'Other',
};

const PAGE_SIZE = 20;

type Tab = 'all' | 'submitted' | 'under_investigation' | 'resolved' | 'dismissed';

export default function Page() {
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Resolve panel
  const [selected, setSelected] = useState<FraudReport | null>(null);
  const [resolution, setResolution] = useState<'resolved' | 'dismissed'>('resolved');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (tab: Tab, pageIdx: number) => {
    setError(null);
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        return;
      }
      const result = await adminFraudApi.list(token, {
        status: tab === 'all' ? undefined : tab,
        limit: PAGE_SIZE,
        offset: pageIdx * PAGE_SIZE,
      });
      setReports(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fraud reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab, page);
  }, [load, tab, page]);

  function switchTab(next: Tab) {
    setTab(next);
    setPage(0);
  }

  const filtered = search.trim()
    ? reports.filter((r) =>
        r.property_title.toLowerCase().includes(search.toLowerCase()) ||
        r.report_type.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()),
      )
    : reports;

  async function handleResolve() {
    if (!selected) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication required');
      await adminFraudApi.resolve(token, selected.id, resolution, notes || undefined);
      setSelected(null);
      setNotes('');
      setResolution('resolved');
      await load(tab, page);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fraud Reports</h1>
          <p className="text-gray-600 mt-1">Review and resolve property fraud reports submitted by users</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load(tab, page)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <span className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Fraud Queue
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['all', 'submitted', 'under_investigation', 'resolved', 'dismissed'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'all' ? 'All' : STATUS_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search title, type, description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Property</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Reported</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No fraud reports found.
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 max-w-[200px] truncate">
                        {report.property_title}
                      </div>
                      <Link
                        href={`/app/properties/${report.property_id}`}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                        target="_blank"
                      >
                        View listing <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-600 max-w-[240px] line-clamp-2">{report.description}</p>
                      {report.evidence_urls.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{report.evidence_urls.length} evidence file{report.evidence_urls.length !== 1 ? 's' : ''}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[report.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[report.status] ?? report.status}
                      </span>
                      {report.resolution_notes && (
                        <p className="text-xs text-gray-400 mt-1 max-w-[160px] truncate" title={report.resolution_notes}>
                          {report.resolution_notes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {(report.status === 'submitted' || report.status === 'under_investigation') ? (
                        <button
                          onClick={() => { setSelected(report); setActionError(null); }}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {report.resolved_at ? new Date(report.resolved_at).toLocaleDateString() : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Resolve Fraud Report</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <p className="font-medium text-gray-900">{selected.property_title}</p>
              <p className="text-gray-500">
                {REPORT_TYPE_LABELS[selected.report_type] ?? selected.report_type} — {selected.description}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Resolution</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResolution('resolved')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    resolution === 'resolved'
                      ? 'bg-green-50 border-green-400 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmed Fraud
                </button>
                <button
                  onClick={() => setResolution('dismissed')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    resolution === 'dismissed'
                      ? 'bg-gray-100 border-gray-400 text-gray-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Dismiss
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add resolution notes for the record…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {actionError && (
              <p className="text-sm text-red-600">{actionError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setSelected(null)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleResolve()}
                disabled={actionLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-50 ${
                  resolution === 'resolved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {resolution === 'resolved' ? 'Mark as Fraud' : 'Dismiss Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
