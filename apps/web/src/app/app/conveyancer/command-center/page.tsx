'use client';

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Clock, Shield, DollarSign, Activity, CheckCircle, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { conveyancerApi, type ConveyancerDashboard } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const STATUS_LABEL: Record<string, string> = {
  open:        "Open",
  on_hold:     "On Hold",
  lodged:      "Lodged",
  registered:  "Registered",
  closed:      "Closed",
  cancelled:   "Cancelled",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high:   "bg-orange-100 text-orange-700",
  normal: "bg-yellow-100 text-yellow-700",
  low:    "bg-green-100 text-green-700",
};

function formatAction(action: string): string {
  return action.replace(/\./g, " › ").replace(/_/g, " ");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export default function Page() {
  const [dashboard, setDashboard] = useState<ConveyancerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const data = await conveyancerApi.getDashboard(token);
      setDashboard(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = dashboard?.stats;
  const statCards = [
    {
      title: "Active Cases",
      value: stats?.activeCases ?? "—",
      icon: Activity,
      color: "blue",
      trend: stats ? `${stats.delayedCases} delayed` : "—",
    },
    {
      title: "Delayed Cases",
      value: stats?.delayedCases ?? "—",
      icon: Clock,
      color: "red",
      trend: stats?.delayedCases ? "Requires attention" : "All on track",
    },
    {
      title: "Closed (Month)",
      value: stats?.closedThisMonth ?? "—",
      icon: CheckCircle,
      color: "green",
      trend: "This calendar month",
    },
    {
      title: "Revenue (Month)",
      value: stats ? `R${(stats.invoicedThisMonth / 1000).toFixed(1)}K` : "—",
      icon: DollarSign,
      color: "purple",
      trend: "Paid invoices",
    },
  ];

  // Derive alert-style insights from live data
  const insights: { type: string; message: string; details: string; action: string }[] = [];
  if (dashboard) {
    if (dashboard.stats.delayedCases > 0) {
      insights.push({
        type: "alert",
        message: `${dashboard.stats.delayedCases} case${dashboard.stats.delayedCases > 1 ? "s" : ""} past target registration date`,
        details: "These cases have exceeded their target registration date and require immediate attention.",
        action: "Review delayed cases → Cases",
      });
    }
    const urgentTasks = dashboard.priorityTasks.filter((t) => t.priority === "urgent");
    if (urgentTasks.length > 0) {
      insights.push({
        type: "warning",
        message: `${urgentTasks.length} urgent task${urgentTasks.length > 1 ? "s" : ""} require attention`,
        details: urgentTasks.map((t) => t.title).join("; "),
        action: "See Priority Tasks panel below",
      });
    }
    const blockerTasks = dashboard.priorityTasks.filter((t) => t.isBlocker);
    if (blockerTasks.length > 0) {
      insights.push({
        type: "warning",
        message: `${blockerTasks.length} blocker task${blockerTasks.length > 1 ? "s" : ""} pending`,
        details: "Blocker tasks are preventing stage progression on their cases.",
        action: "Resolve blockers to advance cases",
      });
    }
    if (insights.length === 0) {
      insights.push({
        type: "success",
        message: "All cases are on track",
        details: "No overdue cases or urgent tasks at this time.",
        action: "Continue monitoring",
      });
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning": return "border-l-yellow-500 bg-yellow-50";
      case "alert":   return "border-l-red-500 bg-red-50";
      case "info":    return "border-l-blue-500 bg-blue-50";
      case "success": return "border-l-green-500 bg-green-50";
      default:        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
      case "alert":   return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "success": return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:        return <Shield className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Command Center</h1>
          <p className="text-gray-600 mt-1">Real-time legal operations intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium">
                {lastUpdated.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <h3 className="text-sm text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{loading ? "…" : stat.value}</p>
              <p className="text-xs text-gray-500 mt-2">{stat.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Alerts & Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
            Alerts &amp; Insights
          </h2>
          {!loading && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              {insights.length} Active
            </span>
          )}
        </div>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(insight.type)}`}>
                <div className="flex items-start gap-3">
                  {getAlertIcon(insight.type)}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{insight.message}</h3>
                    <p className="text-sm text-gray-700 mt-1">{insight.details}</p>
                    <p className="text-sm text-purple-700 font-medium mt-2">→ {insight.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cases by Status</h2>
          {loading || !dashboard?.casesByStatus.length ? (
            <p className="text-gray-400 text-sm">{loading ? "Loading…" : "No data"}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboard.casesByStatus.map((r) => ({
                    ...r,
                    name: STATUS_LABEL[r.status] ?? r.status,
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {dashboard.casesByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          {loading || !dashboard?.revenueByMonth.length ? (
            <p className="text-gray-400 text-sm">{loading ? "Loading…" : "No paid invoices in the last 6 months"}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboard.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: number) => [`R${v.toLocaleString()}`, "Revenue"]} />
                <Legend />
                <Line type="monotone" dataKey="amount" name="Revenue" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Priority Tasks & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority Tasks</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : !dashboard?.priorityTasks.length ? (
            <p className="text-gray-400 text-sm">No open tasks</p>
          ) : (
            <div className="space-y-3">
              {dashboard.priorityTasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${PRIORITY_COLOR[task.priority] ?? "bg-gray-100 text-gray-700"}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500">{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                  </div>
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">{task.caseReference}</span>
                    {task.isBlocker && (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">Blocker</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : !dashboard?.recentActivity.length ? (
            <p className="text-gray-400 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {dashboard.recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 bg-blue-500 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 capitalize">{formatAction(activity.action)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.actorRole ?? "system"}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

