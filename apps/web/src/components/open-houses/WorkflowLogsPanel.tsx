// @ts-nocheck
"use client";
import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
  Zap,
  Mail,
  GitBranch,
  Timer,
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  agentApi,
  WorkflowRecord,
  WorkflowEnrollmentSummary,
  WorkflowEnrollmentDetail,
  WorkflowStepLog,
} from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string | Date): string {
  try {
    return new Intl.DateTimeFormat('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

function relativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Status configs ────────────────────────────────────────────────────────────

const enrollmentStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
  completed: { label: 'Completed',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  active:    { label: 'Active',     color: 'bg-blue-50 text-blue-700 border-blue-200',           dot: 'bg-blue-500'    },
  paused:    { label: 'Paused',     color: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-500'   },
  failed:    { label: 'Failed',     color: 'bg-red-50 text-red-700 border-red-200',              dot: 'bg-red-500'     },
  cancelled: { label: 'Cancelled',  color: 'bg-slate-50 text-slate-600 border-slate-200',        dot: 'bg-slate-400'   },
};

const stepStatusConfig: Record<string, { label: string; bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }> = {
  executed: { label: 'Executed', bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: CheckCircle2 },
  skipped:  { label: 'Skipped',  bg: 'bg-slate-100',   text: 'text-slate-500',   Icon: SkipForward   },
  failed:   { label: 'Failed',   bg: 'bg-red-100',     text: 'text-red-700',     Icon: XCircle       },
  waiting:  { label: 'Waiting',  bg: 'bg-amber-100',   text: 'text-amber-700',   Icon: Clock         },
};

const nodeTypeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  trigger:   Zap,
  action:    Mail,
  condition: GitBranch,
  delay:     Timer,
};

// ─── Step detail row ──────────────────────────────────────────────────────────

function StepRow({ log }: { log: WorkflowStepLog }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = stepStatusConfig[log.status] ?? stepStatusConfig.skipped;
  const NodeIcon  = nodeTypeIcon[log.step_type] ?? Zap;
  const { Icon: StatusIcon } = statusCfg;

  const hasResult = log.result && Object.keys(log.result).length > 0;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => hasResult && setExpanded((v) => !v)}
        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
          hasResult ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
        }`}
      >
        {/* Node type icon */}
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <NodeIcon className="w-4 h-4 text-slate-600" />
        </div>

        {/* Label + message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {log.step_label || log.step_type}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {(log.result as { message?: string })?.message || '—'}
          </p>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text} shrink-0`}>
          <StatusIcon className="w-3 h-3" />
          {statusCfg.label}
        </span>

        {/* Time */}
        <span className="text-xs text-slate-400 shrink-0 w-20 text-right">
          {relativeTime(log.executed_at)}
        </span>

        {/* Expand chevron */}
        {hasResult && (
          <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {expanded && hasResult && (
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Step Data</p>
          <pre className="text-xs text-slate-700 whitespace-pre-wrap break-all font-mono bg-white border border-slate-200 rounded p-2 max-h-48 overflow-auto">
            {JSON.stringify(log.result, null, 2)}
          </pre>
          <p className="text-xs text-slate-400 mt-2">Executed: {fmt(log.executed_at)}</p>
        </div>
      )}
    </div>
  );
}

// ─── Enrollment detail view ───────────────────────────────────────────────────

function EnrollmentDetail({
  workflowId,
  enrollment,
  onBack,
}: {
  workflowId: string;
  enrollment: WorkflowEnrollmentSummary;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<WorkflowEnrollmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getAccessToken();
      if (!token) { setLoading(false); return; }
      try {
        const data = await agentApi.getWorkflowEnrollmentDetail(token, workflowId, enrollment.id);
        setDetail(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workflowId, enrollment.id]);

  const statusCfg = enrollmentStatusConfig[enrollment.status] ?? enrollmentStatusConfig.cancelled;

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {enrollment.lead_name || enrollment.lead_email || 'Anonymous'}
            </p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
          </div>
          {enrollment.lead_email && (
            <p className="text-xs text-slate-500 truncate">{enrollment.lead_email}</p>
          )}
        </div>
        <p className="text-xs text-slate-400 shrink-0">{fmt(enrollment.created_at)}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {detail && !loading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{detail.stepLogs.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Steps run</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">
                  {detail.stepLogs.filter((s) => s.status === 'executed').length}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">Executed</p>
              </div>
              <div className={`border rounded-lg p-3 text-center ${
                enrollment.failed_steps > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className={`text-xl font-bold ${enrollment.failed_steps > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                  {enrollment.failed_steps}
                </p>
                <p className={`text-xs mt-0.5 ${enrollment.failed_steps > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                  Failed
                </p>
              </div>
            </div>

            {/* Step logs */}
            {detail.stepLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No step logs recorded for this run.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Step Execution Trace</p>
                {detail.stepLogs.map((log) => (
                  <StepRow key={log.id} log={log} />
                ))}
              </div>
            )}

            {/* Paused info */}
            {enrollment.status === 'paused' && enrollment.resume_at && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <Timer className="w-4 h-4 shrink-0" />
                Paused — resumes {fmt(enrollment.resume_at)}
              </div>
            )}

            {/* Context data (collapsed by default) */}
            {detail.enrollment.context && Object.keys(detail.enrollment.context).length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1 select-none">
                  <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                  Context data
                </summary>
                <pre className="mt-2 text-xs text-slate-700 whitespace-pre-wrap break-all font-mono bg-white border border-slate-200 rounded p-2 max-h-40 overflow-auto">
                  {JSON.stringify(detail.enrollment.context, null, 2)}
                </pre>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Enrollment list view ─────────────────────────────────────────────────────

function EnrollmentList({
  workflowId,
  workflowName,
  onSelect,
}: {
  workflowId: string;
  workflowName: string;
  onSelect: (e: WorkflowEnrollmentSummary) => void;
}) {
  const [logs, setLogs] = useState<WorkflowEnrollmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getAccessToken();
    if (!token) { setLoading(false); return; }
    try {
      const data = await agentApi.getWorkflowLogs(token, workflowId);
      setLogs(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      {/* List header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
        <div>
          <p className="text-sm font-semibold text-slate-800">{workflowName}</p>
          <p className="text-xs text-slate-500">Run history</p>
        </div>
        <button
          onClick={load}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="m-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {!loading && !error && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No runs yet</p>
            <p className="text-xs text-slate-500">Runs will appear here once the workflow is triggered.</p>
          </div>
        )}
        {!loading && logs.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => {
              const sc = enrollmentStatusConfig[log.status] ?? enrollmentStatusConfig.cancelled;
              return (
                <li key={log.id}>
                  <button
                    onClick={() => onSelect(log)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left group"
                  >
                    {/* Avatar placeholder */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {log.lead_name || log.lead_email || 'Anonymous'}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{log.step_count} step{log.step_count !== 1 ? 's' : ''} run</span>
                        {log.failed_steps > 0 && (
                          <span className="text-red-500">{log.failed_steps} failed</span>
                        )}
                        {log.lead_email && (
                          <span className="truncate">{log.lead_email}</span>
                        )}
                      </div>
                    </div>

                    {/* Time + chevron */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {relativeTime(log.created_at)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface WorkflowLogsPanelProps {
  workflow: WorkflowRecord;
  onClose: () => void;
}

export function WorkflowLogsPanel({ workflow, onClose }: WorkflowLogsPanelProps) {
  const [selectedEnrollment, setSelectedEnrollment] = useState<WorkflowEnrollmentSummary | null>(null);

  return (
    // Overlay
    <div className="fixed inset-0 z-[300] flex justify-end">
      {/* Dim background */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="relative z-10 w-full max-w-lg bg-white shadow-2xl flex flex-col h-full">
        {/* Panel top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white/80" />
            <span className="text-sm font-semibold text-white">Workflow Logs</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — either list or detail */}
        <div className="flex-1 overflow-hidden">
          {selectedEnrollment ? (
            <EnrollmentDetail
              workflowId={workflow.id}
              enrollment={selectedEnrollment}
              onBack={() => setSelectedEnrollment(null)}
            />
          ) : (
            <EnrollmentList
              workflowId={workflow.id}
              workflowName={workflow.name}
              onSelect={setSelectedEnrollment}
            />
          )}
        </div>
      </div>
    </div>
  );
}
