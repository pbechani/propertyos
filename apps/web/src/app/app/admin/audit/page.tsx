'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  Search, ClipboardList, CheckCircle, XCircle, Activity, Pause, User,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import { auditApi, type AuditLogEntry } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

const ACTION_STYLES: Record<string, { icon: ReactNode; bg: string; text: string }> = {
  verify: { icon: <CheckCircle className="w-4 h-4 text-green-600" />, bg: 'bg-green-100', text: 'text-green-700' },
  approve: { icon: <CheckCircle className="w-4 h-4 text-green-600" />, bg: 'bg-green-100', text: 'text-green-700' },
  reject: { icon: <XCircle className="w-4 h-4 text-red-600" />, bg: 'bg-red-100', text: 'text-red-700' },
  suspend: { icon: <Pause className="w-4 h-4 text-orange-600" />, bg: 'bg-orange-100', text: 'text-orange-700' },
  reinstate: { icon: <CheckCircle className="w-4 h-4 text-green-600" />, bg: 'bg-green-100', text: 'text-green-700' },
  assign_role: { icon: <User className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-100', text: 'text-blue-700' },
  login: { icon: <Activity className="w-4 h-4 text-gray-600" />, bg: 'bg-gray-100', text: 'text-gray-600' },
};

const DEFAULT_STYLE = ACTION_STYLES.login;

const EVENT_TYPES = ['all', 'verify', 'approve', 'reject', 'suspend', 'reinstate', 'assign_role', 'login'];
const PAGE_SIZE = 50;

function formatTimestamp(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function Page() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (action: string, pageIdx: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const results = await auditApi.getAdminLogs(token, {
        action: action !== 'all' ? action : undefined,
        limit: PAGE_SIZE + 1,
        offset: pageIdx * PAGE_SIZE,
      });
      setHasMore(results.length > PAGE_SIZE);
      setLogs(results.slice(0, PAGE_SIZE));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(eventFilter, page);
  }, [load, eventFilter, page]);

  const handleEventFilter = (val: string) => {
    setEventFilter(val);
    setPage(0);
  };

  const filtered = logs.filter((log) => {
    if (search === '') return true;
    const q = search.toLowerCase();
    return (
      log.actorId.toLowerCase().includes(q) ||
      (log.resourceType ?? '').toLowerCase().includes(q) ||
      (log.resourceId ?? '').toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.ipAddress ?? '').includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Immutable record of all admin actions and system events</p>
        </div>
        <button
          onClick={() => void load(eventFilter, page)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <ClipboardList className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Audit logs are append-only and cannot be edited or deleted. All timestamps are in UTC+2 (SAST).
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-800">Failed to load audit logs</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button onClick={() => void load(eventFilter, page)} className="mt-2 text-sm text-red-700 underline hover:text-red-900">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search actor ID, resource, action or IP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => handleEventFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">{t === 'all' ? 'All Events' : t.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Timestamp</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Event</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Actor ID</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">Resource</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden lg:table-cell">IP Address</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden xl:table-cell">Resource ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No audit entries found
                  </td>
                </tr>
              ) : filtered.map((log) => {
                const style = ACTION_STYLES[log.action] ?? DEFAULT_STYLE;
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono text-gray-700 whitespace-nowrap">{formatTimestamp(log.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${style.bg}`}>{style.icon}</div>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${style.bg} ${style.text}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-xs font-mono text-gray-700 truncate max-w-[140px]">{log.actorId}</p>
                        {log.actorRole && <p className="text-xs text-gray-400 capitalize">{log.actorRole}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-700 capitalize">{log.resourceType ?? '—'}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm font-mono text-gray-600">{log.ipAddress ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded truncate block max-w-[160px]">
                        {log.resourceId ?? '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination + count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading…' : `Showing ${filtered.length} entries (page ${page + 1})`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
