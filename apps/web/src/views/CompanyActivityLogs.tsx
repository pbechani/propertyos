'use client';

import { useState, useEffect } from "react";
import { Activity, Filter, Download, Search, Calendar, Loader2 } from "lucide-react";
import { useNavigate } from "@/lib/router-compat";
import { getActiveCompanyContext, getAccessToken } from "@/lib/auth-session";
import { companiesApi, type CompanyAuditLogEntry } from "@/lib/api-client";

type AuditEvent =
  | "company.created"
  | "company.submitted_for_verification"
  | "company.verified"
  | "company_member.invited"
  | "company_member.joined"
  | "company_member.permissions_updated"
  | "company_member.promoted_to_admin"
  | "company_member.access_revoked"
  | "company_context.selected"
  | "orphaned_task.assigned"
  | string;

type LogEntry = {
  id: string;
  userId: string;
  userName: string;
  event: AuditEvent;
  description: string;
  timestamp: string;
  companyId: string;
  metadata?: Record<string, unknown>;
};


const EVENT_COLORS: Record<string, string> = {
  "company_member.invited": "bg-blue-100 text-blue-700",
  "company_member.joined": "bg-green-100 text-green-700",
  "company_member.permissions_updated": "bg-indigo-100 text-indigo-700",
  "company_member.promoted_to_admin": "bg-purple-100 text-purple-700",
  "company_member.access_revoked": "bg-red-100 text-red-700",
  "company_context.selected": "bg-gray-100 text-gray-700",
  "company.submitted_for_verification": "bg-amber-100 text-amber-700",
  "company.verified": "bg-emerald-100 text-emerald-700",
  "company.created": "bg-teal-100 text-teal-700",
  "orphaned_task.assigned": "bg-orange-100 text-orange-700",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatEvent(event: string): string {
  return event
    .split(".")
    .map((part) =>
      part.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(" › ");
}

function mapEntry(entry: CompanyAuditLogEntry, companyId: string): LogEntry {
  const fullName = [entry.first_name, entry.last_name].filter(Boolean).join(' ').trim();
  const eventKey = (entry.event_id ?? entry.action) as AuditEvent;
  return {
    id: entry.id,
    userId: entry.actor_id ?? 'system',
    userName: fullName || entry.email || 'System',
    event: eventKey,
    description: formatEvent(eventKey),
    timestamp: entry.created_at,
    companyId,
    metadata: entry.payload ?? undefined,
  };
}

export default function CompanyActivityLogs() {
  const navigate = useNavigate();
  const activeCompany = getActiveCompanyContext();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState("all");

  useEffect(() => {
    if (!activeCompany || activeCompany.slug === 'self') {
      navigate('/app/my-dashboard');
      return;
    }
    const token = getAccessToken();
    if (!token) { navigate('/login'); return; }

    companiesApi
      .getActivityLogs(token, activeCompany.id)
      .then((entries) => setLogs(entries.map((e) => mapEntry(e, activeCompany.id))))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load logs'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const companyName = activeCompany?.name ?? 'Company';

  const uniqueEvents = ["all", ...new Set(logs.map((l) => l.event))];

  const filtered = logs.filter((log) => {
    const matchSearch =
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterEvent === "all" || log.event === filterEvent;
    return matchSearch && matchFilter;
  });

  // Simple date-based stats
  const todayCount = logs.filter(
    (l) => new Date(l.timestamp).toDateString() === new Date().toDateString()
  ).length;

  const uniqueActors = [...new Set(logs.map((l) => l.userName))];
  const mostActive = uniqueActors[0] ?? "—";

  return (
    <div className="p-8">
      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}
      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6">
          {error}
        </div>
      )}
      {!loading && !error && (<>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2">Activity Logs</h1>
          <p className="text-gray-600">{companyName} · Complete audit trail of company events and user actions</p>
        </div>
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm">
          <Download className="w-5 h-5" />
          Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatsCard label="Total Events" value={logs.length} icon={Activity} color="bg-indigo-100 text-indigo-600" />
        <StatsCard label="Today" value={todayCount} icon={Calendar} color="bg-green-100 text-green-600" />
        <StatsCard label="Active Members" value={uniqueActors.length} icon={Activity} color="bg-blue-100 text-blue-600" />
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Most Active</p>
              <p className="text-base font-medium truncate">{mostActive}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 text-purple-600 text-sm font-semibold">
              {mostActive.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description or user…"
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              {uniqueEvents.map((e) => (
                <option key={e} value={e}>
                  {e === "all" ? "All events" : formatEvent(e)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm text-gray-600">User</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Event</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Description</th>
              <th className="px-6 py-4 text-right text-sm text-gray-600">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-sm">
                  No log entries match your filter
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0">
                        <span className="text-xs text-indigo-600">
                          {log.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        EVENT_COLORS[log.event] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formatEvent(log.event)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.description}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs text-gray-500">{timeAgo(log.timestamp)}</span>
                    <p className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </>)}
    </div>
  );
}

function StatsCard({
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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
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
