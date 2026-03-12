'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, AlertCircle, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { conveyancerApi, type ConveyancerCase, type CreateCasePayload } from "@/lib/api-client";
import { getAccessToken, getActiveCompanyContext, getStoredUser } from "@/lib/auth-session";

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-600",
  high:   "text-red-600",
  normal: "text-yellow-600",
  low:    "text-green-600",
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  on_track:   { label: "On Track",   cls: "bg-green-100 text-green-700" },
  delayed:    { label: "Delayed",    cls: "bg-red-100 text-red-700" },
  on_hold:    { label: "On Hold",    cls: "bg-yellow-100 text-yellow-700" },
  closed:     { label: "Closed",     cls: "bg-gray-100 text-gray-700" },
  cancelled:  { label: "Cancelled",  cls: "bg-gray-100 text-gray-500" },
  lodged:     { label: "Lodged",     cls: "bg-blue-100 text-blue-700" },
  registered: { label: "Registered", cls: "bg-purple-100 text-purple-700" },
};

const CASE_TYPES = [
  { value: "transfer",          label: "Transfer" },
  { value: "bond_registration", label: "Bond Registration" },
  { value: "bond_cancellation", label: "Bond Cancellation" },
  { value: "sectional_title",   label: "Sectional Title" },
  { value: "development",       label: "Development" },
];

const PRIORITIES = [
  { value: "normal", label: "Normal" },
  { value: "low",    label: "Low" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "Urgent" },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY_FORM = {
  saleId: "",
  caseType: "transfer",
  priority: "normal",
  targetRegistrationDate: "",
  notes: "",
};

export default function Page() {
  const router = useRouter();

  const [cases, setCases]       = useState<ConveyancerCase[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // New Case modal
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [formError, setFormError]       = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const result = await conveyancerApi.getCases(token, { limit: 100 });
      setCases(result.data);
      setTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const token = getAccessToken();
    if (!token) { setFormError("Not authenticated"); return; }

    const firm = getActiveCompanyContext();
    const user = getStoredUser();
    if (!firm?.id) { setFormError("No active company context — please re-login."); return; }
    if (!user?.id) { setFormError("User session missing — please re-login."); return; }
    if (!form.saleId.trim()) { setFormError("Sale ID is required."); return; }

    const payload: CreateCasePayload = {
      saleId:              form.saleId.trim(),
      firmId:              firm.id,
      leadConveyancerId:   user.id,
      caseType:            form.caseType,
      priority:            form.priority || undefined,
      targetRegistrationDate: form.targetRegistrationDate || undefined,
      notes:               form.notes || undefined,
    };

    setSubmitting(true);
    try {
      const created = await conveyancerApi.createCase(token, payload);
      setShowModal(false);
      router.push(`/app/conveyancer/cases/${created.id}`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create case");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = cases.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      c.case_reference.toLowerCase().includes(term) ||
      c.buyer_name.toLowerCase().includes(term) ||
      c.seller_name.toLowerCase().includes(term) ||
      c.property_address.toLowerCase().includes(term);

    const matchStatus = statusFilter === "all" ||
      c.display_status === statusFilter ||
      c.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-600 mt-1">
            Track and manage all conveyancing cases
            {!loading && <span className="ml-2 text-sm text-gray-400">({total} total)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Case
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by case reference, buyer, seller, or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Status</option>
            <option value="on_track">On Track</option>
            <option value="delayed">Delayed</option>
            <option value="on_hold">On Hold</option>
            <option value="lodged">Lodged</option>
            <option value="registered">Registered</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          Loading cases…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
            const badge = STATUS_LABEL[c.display_status] ?? STATUS_LABEL[c.status] ?? { label: c.status, cls: "bg-gray-100 text-gray-700" };
            return (
              <Link
                key={c.id}
                href={`/app/conveyancer/cases/${c.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{c.case_reference}</h3>
                    <p className="text-sm text-gray-500 mt-1">{c.property_address}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Buyer</span>
                    <span className="text-gray-900 font-medium">{c.buyer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Seller</span>
                    <span className="text-gray-900 font-medium">{c.seller_name}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Stage {c.current_stage} of 14</span>
                    <span className="text-sm font-medium text-gray-900">{c.progress_pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        c.progress_pct >= 75 ? "bg-green-600" :
                        c.progress_pct >= 50 ? "bg-blue-600" :
                        "bg-yellow-600"
                      }`}
                      style={{ width: `${c.progress_pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Priority</p>
                    <span className={`font-medium capitalize ${PRIORITY_COLOR[c.priority] ?? "text-gray-900"}`}>
                      {c.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500">Target Date</p>
                    <p className="font-medium text-gray-900">{formatDate(c.target_registration_date)}</p>
                  </div>
                </div>

                {c.blocker_count > 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{c.blocker_count} blocker task{c.blocker_count > 1 ? "s" : ""} pending</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">{cases.length === 0 ? "No cases found" : "No cases match your search"}</p>
        </div>
      )}

      {/* New Case modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Open New Case</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="UUID of the associated property sale"
                  value={form.saleId}
                  onChange={(e) => setForm(f => ({ ...f, saleId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.caseType}
                  onChange={(e) => setForm(f => ({ ...f, caseType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {CASE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Registration Date</label>
                  <input
                    type="date"
                    value={form.targetRegistrationDate}
                    onChange={(e) => setForm(f => ({ ...f, targetRegistrationDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional opening notes…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Creating…" : "Create Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
