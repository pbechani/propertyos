'use client';

import { useState, useEffect } from "react";
import {
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Clock,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  conveyancerApi,
  type ConveyancerTurnaroundRow,
  type ConveyancerOutstandingTaskRow,
  type ConveyancerFeeCollectionRow,
  type ConveyancerCaseloadRow,
} from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Page() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [turnaround, setTurnaround] = useState<ConveyancerTurnaroundRow[]>([]);
  const [outstanding, setOutstanding] = useState<ConveyancerOutstandingTaskRow[]>([]);
  const [feeCollection, setFeeCollection] = useState<ConveyancerFeeCollectionRow[]>([]);
  const [caseload, setCaseload] = useState<ConveyancerCaseloadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = getAccessToken() ?? "";

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const dateParams =
        fromDate || toDate
          ? { fromDate: fromDate || undefined, toDate: toDate || undefined }
          : undefined;
      const [ta, ot, fc, cl] = await Promise.all([
        conveyancerApi.getTurnaroundReport(token, dateParams),
        conveyancerApi.getOutstandingTasksReport(token, dateParams),
        conveyancerApi.getFeeCollectionReport(token, dateParams),
        conveyancerApi.getCaseloadReport(token),
      ]);
      setTurnaround(ta);
      setOutstanding(ot);
      setFeeCollection(fc);
      setCaseload(cl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived stats
  const totalCases = turnaround.length;
  const avgDaysOpen =
    totalCases > 0
      ? Math.round(
          turnaround.reduce((sum, r) => sum + (r.days_open ?? 0), 0) / totalCases
        )
      : 0;
  const outstandingCount = outstanding.length;
  const totalOpenCases = caseload.reduce(
    (sum, r) => sum + parseInt(r.open_cases || "0", 10),
    0
  );
  const totalFeeOutstanding = feeCollection.reduce((sum, r) => {
    const amt = parseFloat(r.outstanding_amount || "0");
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  // Chart data: top 20 cases by days_open
  const turnaroundChartData = turnaround.slice(0, 20).map((r) => ({
    ref: r.case_reference,
    days: r.days_open ?? 0,
  }));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports &amp; Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive business intelligence and insights
          </p>
        </div>
        <button
          onClick={loadReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {loading ? "Loading…" : "Refresh Reports"}
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={loadReports}
            disabled={loading}
            className="px-4 py-2 border border-blue-600 text-blue-600 text-sm rounded-lg hover:bg-blue-50 disabled:opacity-50"
          >
            Apply Filter
          </button>
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Cases (Report)</h3>
          {loading ? (
            <div className="h-9 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{totalCases}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">From turnaround report</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Fees Outstanding</h3>
          {loading ? (
            <div className="h-9 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">
              R {totalFeeOutstanding.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">Unpaid fee collection</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Avg Days Open</h3>
          {loading ? (
            <div className="h-9 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{avgDaysOpen}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">Average across open cases</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            {outstandingCount > 0 && (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Outstanding Tasks</h3>
          {loading ? (
            <div className="h-9 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">{outstandingCount}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {totalOpenCases} open cases across team
          </p>
        </div>
      </div>

      {/* Turnaround Chart */}
      {!loading && turnaroundChartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Case Turnaround (Days Open — top 20)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={turnaroundChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ref" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="days" fill="#3b82f6" name="Days Open" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Turnaround Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Turnaround Report</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : turnaround.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No data for selected period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Reference</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Phase</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Opened</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Target</th>
                  <th className="text-right py-2 font-medium text-gray-700">Days Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {turnaround.map((row) => (
                  <tr key={row.case_reference} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-blue-600">{row.case_reference}</td>
                    <td className="py-2 pr-4 text-gray-700">{row.case_type}</td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{row.lifecycle_phase}</td>
                    <td className="py-2 pr-4 text-gray-600">{fmtDate(row.opened_at)}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {fmtDate(row.target_registration_date)}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {row.days_open}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outstanding Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Outstanding Tasks</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : outstanding.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No outstanding tasks.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Case</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Task</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Due</th>
                  <th className="text-right py-2 font-medium text-gray-700">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {outstanding.map((row) => (
                  <tr key={row.task_id} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-blue-600">{row.case_reference}</td>
                    <td className="py-2 pr-4 text-gray-700">
                      {row.title}
                      {row.is_blocker && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                          Blocker
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{fmtDate(row.due_date)}</td>
                    <td className={`py-2 text-right font-medium ${(row.days_overdue ?? 0) > 0 ? "text-red-600" : "text-gray-500"}`}>
                      {row.days_overdue != null ? row.days_overdue : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fee Collection Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fee Collection</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : feeCollection.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No fee data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Case</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Invoice Type</th>
                  <th className="text-right py-2 pr-4 font-medium text-gray-700">Total</th>
                  <th className="text-right py-2 pr-4 font-medium text-gray-700">Paid</th>
                  <th className="text-right py-2 pr-4 font-medium text-gray-700">Outstanding</th>
                  <th className="text-left py-2 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feeCollection.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-blue-600">{row.case_reference}</td>
                    <td className="py-2 pr-4 text-gray-700">{row.invoice_type}</td>
                    <td className="py-2 pr-4 text-right text-gray-900">R {parseFloat(row.total_amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 pr-4 text-right text-green-700">R {parseFloat(row.paid_amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                    <td className={`py-2 pr-4 text-right font-medium ${parseFloat(row.outstanding_amount) > 0 ? "text-red-700" : "text-gray-500"}`}>
                      R {parseFloat(row.outstanding_amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                        {row.invoice_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

