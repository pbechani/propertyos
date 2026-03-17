'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  TrendingUp,
  Plus,
  Building,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  conveyancerApi,
  type ConveyancerCaseDetail,
  type ConveyancerTask,
  type ConveyancerDeadline,
  type ConveyancerGovInteraction,
  type ConveyancerLifecycleEvent,
} from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";

const LIFECYCLE_PHASES: Record<number, string> = {
  1: "Case Intake",
  2: "Legal Verification",
  3: "Seller Compliance",
  4: "Buyer Compliance",
  5: "Financial Structure",
  6: "Bond Cancellation",
  7: "Compliance Certificates",
  8: "Transfer Duty",
  9: "Transfer Doc Preparation",
  10: "Deeds Office Lodgement",
  11: "Registration",
  12: "Financial Settlement",
  13: "Case Closure",
};

const GOV_DEPT_LABEL: Record<string, string> = {
  deeds_office: "Deeds Office",
  sars: "SARS / Tax Authority",
  municipality: "Municipality",
  banks: "Banks",
  other: "Other",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-700",
  lodged: "bg-blue-100 text-blue-700",
  registered: "bg-emerald-100 text-emerald-700",
  closed: "bg-purple-100 text-purple-700",
  suspended: "bg-red-100 text-red-700",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

const DEADLINE_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  met: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  extended: "bg-orange-100 text-orange-700",
};

const GOV_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  submitted: "bg-blue-100 text-blue-700",
  acknowledged: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-purple-100 text-purple-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  // Case data
  const [caseData, setCaseData] = useState<ConveyancerCaseDetail | null>(null);
  const [caseLoading, setCaseLoading] = useState(true);
  const [caseError, setCaseError] = useState<string | null>(null);

  // Tasks
  const [tasks, setTasks] = useState<ConveyancerTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Deadlines
  const [deadlines, setDeadlines] = useState<ConveyancerDeadline[]>([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(false);

  // Government interactions
  const [govInteractions, setGovInteractions] = useState<ConveyancerGovInteraction[]>([]);
  const [govLoading, setGovLoading] = useState(false);
  const [showGovForm, setShowGovForm] = useState(false);
  const [govFormData, setGovFormData] = useState({
    department: "deeds_office",
    interactionType: "submission",
    description: "",
    referenceNumber: "",
    expectedResponseAt: "",
    notes: "",
  });
  const [govFormError, setGovFormError] = useState<string | null>(null);
  const [govFormSaving, setGovFormSaving] = useState(false);

  // Lifecycle
  const [lifecycleHistory, setLifecycleHistory] = useState<ConveyancerLifecycleEvent[]>([]);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [advancePhase, setAdvancePhase] = useState<number>(2);
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [advanceSaving, setAdvanceSaving] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const token = getAccessToken() ?? "";

  const loadCase = useCallback(async () => {
    if (!id) return;
    setCaseLoading(true);
    setCaseError(null);
    try {
      const data = await conveyancerApi.getCase(token, id);
      setCaseData(data);
      setCurrentPhase(data.lifecycle_phase ?? 1);
      setAdvancePhase(Math.min((data.lifecycle_phase ?? 1) + 1, 13));
    } catch (e: unknown) {
      setCaseError(e instanceof Error ? e.message : "Failed to load case");
    } finally {
      setCaseLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  useEffect(() => {
    if (!id) return;
    if (activeTab === "tasks" && tasks.length === 0) {
      setTasksLoading(true);
      conveyancerApi
        .listTasks(token, id)
        .then(setTasks)
        .catch(() => {
          /* silent */
        })
        .finally(() => setTasksLoading(false));
    }
    if (activeTab === "deadlines" && deadlines.length === 0) {
      setDeadlinesLoading(true);
      conveyancerApi
        .listDeadlines(token, id)
        .then(setDeadlines)
        .catch(() => {
          /* silent */
        })
        .finally(() => setDeadlinesLoading(false));
    }
    if (activeTab === "government" && govInteractions.length === 0) {
      setGovLoading(true);
      conveyancerApi
        .listGovInteractions(token, id)
        .then(setGovInteractions)
        .catch(() => {
          /* silent */
        })
        .finally(() => setGovLoading(false));
    }
    if (activeTab === "lifecycle") {
      setLifecycleLoading(true);
      conveyancerApi
        .getLifecycleHistory(token, id)
        .then((res) => {
          setLifecycleHistory(res.history);
          setCurrentPhase(res.currentPhase);
          setAdvancePhase(Math.min(res.currentPhase + 1, 13));
        })
        .catch(() => {
          /* silent */
        })
        .finally(() => setLifecycleLoading(false));
    }
  }, [activeTab, id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateGovInteraction(e: React.FormEvent) {
    e.preventDefault();
    setGovFormError(null);
    setGovFormSaving(true);
    try {
      const created = await conveyancerApi.createGovInteraction(token, id!, {
        department: govFormData.department,
        interactionType: govFormData.interactionType,
        description: govFormData.description,
        referenceNumber: govFormData.referenceNumber || undefined,
        expectedResponseAt: govFormData.expectedResponseAt || undefined,
        notes: govFormData.notes || undefined,
      });
      setGovInteractions((prev) => [created, ...prev]);
      setShowGovForm(false);
      setGovFormData({
        department: "deeds_office",
        interactionType: "submission",
        description: "",
        referenceNumber: "",
        expectedResponseAt: "",
        notes: "",
      });
    } catch (e: unknown) {
      setGovFormError(
        e instanceof Error ? e.message : "Failed to record interaction"
      );
    } finally {
      setGovFormSaving(false);
    }
  }

  async function handleAdvanceLifecycle(e: React.FormEvent) {
    e.preventDefault();
    setAdvanceError(null);
    setAdvanceSaving(true);
    try {
      const res = await conveyancerApi.advanceLifecycle(token, id!, {
        toPhase: advancePhase,
        notes: advanceNotes || undefined,
      });
      setLifecycleHistory(res.history);
      setCurrentPhase(res.currentPhase);
      setAdvancePhase(Math.min(res.currentPhase + 1, 13));
      setAdvanceNotes("");
      setCaseData((prev) =>
        prev ? { ...prev, lifecycle_phase: res.currentPhase } : prev
      );
    } catch (e: unknown) {
      setAdvanceError(
        e instanceof Error ? e.message : "Failed to advance lifecycle"
      );
    } finally {
      setAdvanceSaving(false);
    }
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "tasks", label: "Tasks", icon: CheckCircle },
    { id: "deadlines", label: "Deadlines", icon: Clock },
    { id: "government", label: "Government", icon: Building },
    { id: "lifecycle", label: "Lifecycle", icon: ChevronRight },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "financials", label: "Financials", icon: DollarSign },
    { id: "communications", label: "Communications", icon: MessageSquare },
  ];

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (caseError || !caseData) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Case Not Found</h2>
          <p className="text-gray-600 mb-6">
            {caseError ?? "The case you're looking for doesn't exist."}
          </p>
          <Link
            href="/app/conveyancer/cases"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  const phaseProgress = Math.round(((currentPhase - 1) / 12) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-8">
          <Link
            href="/app/conveyancer/cases"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cases
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{caseData.case_reference}</h1>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    STATUS_COLOR[caseData.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {caseData.status}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    PRIORITY_COLOR[caseData.priority] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {caseData.priority} priority
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-1">
                Type:{" "}
                <span className="font-medium text-gray-700">{caseData.case_type}</span>
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Opened: {fmtDate(caseData.opened_at)}</span>
                </div>
                {caseData.target_registration_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Target: {fmtDate(caseData.target_registration_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={loadCase}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Phase Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Phase {currentPhase}: {LIFECYCLE_PHASES[currentPhase] ?? "—"}
              </span>
              <span className="text-sm text-gray-600">{phaseProgress}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${phaseProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8">
          <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h2>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Case ID</dt>
                    <dd className="font-medium text-gray-900 mt-1">{caseData.id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Reference</dt>
                    <dd className="font-medium text-gray-900 mt-1">{caseData.case_reference}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Type</dt>
                    <dd className="font-medium text-gray-900 mt-1">{caseData.case_type}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Country</dt>
                    <dd className="font-medium text-gray-900 mt-1">{caseData.country}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Opened</dt>
                    <dd className="font-medium text-gray-900 mt-1">{fmtDate(caseData.opened_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Target Registration</dt>
                    <dd className="font-medium text-gray-900 mt-1">
                      {fmtDate(caseData.target_registration_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Actual Registration</dt>
                    <dd className="font-medium text-gray-900 mt-1">
                      {fmtDate(caseData.actual_registration_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Lifecycle Phase</dt>
                    <dd className="font-medium text-gray-900 mt-1">
                      Phase {caseData.lifecycle_phase} —{" "}
                      {LIFECYCLE_PHASES[caseData.lifecycle_phase] ?? "—"}
                    </dd>
                  </div>
                </dl>
                {caseData.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <dt className="text-gray-500 text-sm mb-1">Notes</dt>
                    <dd className="text-sm text-gray-700">{caseData.notes}</dd>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("deadlines")}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Clock className="w-4 h-4" />
                    View Deadlines
                  </button>
                  <button
                    onClick={() => setActiveTab("government")}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Building className="w-4 h-4" />
                    Government Interactions
                  </button>
                  <button
                    onClick={() => setActiveTab("lifecycle")}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Advance Lifecycle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks tab */}
        {activeTab === "tasks" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Case Tasks</h2>
            {tasksLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No tasks found for this case.</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          PRIORITY_COLOR[task.priority] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          STATUS_COLOR[task.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.status}
                      </span>
                      {task.is_blocker && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
                          Blocker
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {task.responsible_role && <span>Role: {task.responsible_role}</span>}
                      {task.due_date && <span>Due: {fmtDate(task.due_date)}</span>}
                      {task.completed_at && (
                        <span className="text-green-600">
                          Completed: {fmtDate(task.completed_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deadlines tab */}
        {activeTab === "deadlines" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Deadlines</h2>
            {deadlinesLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : deadlines.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No deadlines found for this case.</p>
            ) : (
              <div className="space-y-4">
                {deadlines.map((dl) => (
                  <div key={dl.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {dl.deadline_type.replace(/_/g, " ")}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          DEADLINE_STATUS_COLOR[dl.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {dl.status}
                      </span>
                    </div>
                    {dl.description && (
                      <p className="text-sm text-gray-600 mb-1">{dl.description}</p>
                    )}
                    <p className="text-sm text-gray-500">Due: {fmtDate(dl.due_date)}</p>
                    {dl.extension_reason && (
                      <p className="text-sm text-orange-600 mt-1">
                        Extension reason: {dl.extension_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Government Interactions tab */}
        {activeTab === "government" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Government Department Interactions
              </h2>
              <button
                onClick={() => setShowGovForm((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Record Interaction
              </button>
            </div>

            {showGovForm && (
              <form
                onSubmit={handleCreateGovInteraction}
                className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4"
              >
                <h3 className="font-medium text-gray-900">New Government Interaction</h3>
                {govFormError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {govFormError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={govFormData.department}
                      onChange={(e) =>
                        setGovFormData((p) => ({ ...p, department: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      required
                    >
                      {Object.entries(GOV_DEPT_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interaction Type
                    </label>
                    <select
                      value={govFormData.interactionType}
                      onChange={(e) =>
                        setGovFormData((p) => ({ ...p, interactionType: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      required
                    >
                      {["submission", "inquiry", "response", "follow_up", "resolution"].map(
                        (t) => (
                          <option key={t} value={t}>
                            {t.replace(/_/g, " ")}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={govFormData.description}
                      onChange={(e) =>
                        setGovFormData((p) => ({ ...p, description: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number (optional)
                    </label>
                    <input
                      type="text"
                      value={govFormData.referenceNumber}
                      onChange={(e) =>
                        setGovFormData((p) => ({ ...p, referenceNumber: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Response Date (optional)
                    </label>
                    <input
                      type="date"
                      value={govFormData.expectedResponseAt}
                      onChange={(e) =>
                        setGovFormData((p) => ({ ...p, expectedResponseAt: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={govFormData.notes}
                      onChange={(e) =>
                        setGovFormData((p) => ({ ...p, notes: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGovForm(false)}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={govFormSaving}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {govFormSaving ? "Saving…" : "Save Interaction"}
                  </button>
                </div>
              </form>
            )}

            {govLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : govInteractions.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                No government interactions recorded yet.
              </p>
            ) : (
              <div className="space-y-4">
                {govInteractions.map((gi) => (
                  <div key={gi.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900">
                        {GOV_DEPT_LABEL[gi.department] ?? gi.department}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {gi.interaction_type.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          GOV_STATUS_COLOR[gi.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {gi.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{gi.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      {gi.reference_number && <span>Ref: {gi.reference_number}</span>}
                      {gi.submitted_at && <span>Submitted: {fmtDate(gi.submitted_at)}</span>}
                      {gi.expected_response_at && (
                        <span>Expected: {fmtDate(gi.expected_response_at)}</span>
                      )}
                      {gi.resolved_at && (
                        <span className="text-green-600">Resolved: {fmtDate(gi.resolved_at)}</span>
                      )}
                      <span>Recorded: {fmtDate(gi.created_at)}</span>
                    </div>
                    {gi.notes && (
                      <p className="text-sm text-gray-500 mt-2">{gi.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lifecycle tab */}
        {activeTab === "lifecycle" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Lifecycle History</h2>
                {lifecycleLoading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : lifecycleHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">
                    No lifecycle events recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {lifecycleHistory.map((event) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                          <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {event.from_phase
                                ? `Phase ${event.from_phase} → Phase ${event.to_phase}`
                                : `Initialised at Phase ${event.to_phase}`}
                            </span>
                            <span className="text-xs text-gray-500">
                              {fmtDate(event.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {LIFECYCLE_PHASES[event.to_phase] ?? `Phase ${event.to_phase}`}
                          </p>
                          {event.from_status && (
                            <p className="text-xs text-gray-500 mt-1">
                              Status: {event.from_status} → {event.to_status}
                            </p>
                          )}
                          {event.notes && (
                            <p className="text-sm text-gray-500 mt-1">{event.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">by {event.triggered_by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Advance Lifecycle</h2>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  <strong>Current:</strong> Phase {currentPhase} —{" "}
                  {LIFECYCLE_PHASES[currentPhase] ?? "—"}
                </div>
                <form onSubmit={handleAdvanceLifecycle} className="space-y-4">
                  {advanceError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      {advanceError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Advance to Phase
                    </label>
                    <select
                      value={advancePhase}
                      onChange={(e) => setAdvancePhase(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      required
                    >
                      {Object.entries(LIFECYCLE_PHASES)
                        .filter(([n]) => Number(n) !== currentPhase)
                        .map(([n, label]) => (
                          <option key={n} value={Number(n)}>
                            Phase {n}: {label}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={advanceNotes}
                      onChange={(e) => setAdvanceNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={advanceSaving || advancePhase === currentPhase}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {advanceSaving ? "Advancing…" : "Advance Lifecycle"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Documents — coming later */}
        {activeTab === "documents" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700">Documents</h2>
            <p className="text-gray-500 mt-2">Document management coming in Sprint 06.</p>
          </div>
        )}

        {/* Financials — coming later */}
        {activeTab === "financials" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700">Financials</h2>
            <p className="text-gray-500 mt-2">Financial details coming in Sprint 05-d.</p>
          </div>
        )}

        {/* Communications — coming later */}
        {activeTab === "communications" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700">Communications</h2>
            <p className="text-gray-500 mt-2">Messaging features coming in a future sprint.</p>
          </div>
        )}
      </div>
    </div>
  );
}
