// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  ChevronRight,
  Filter,
  Download,
  Play,
  Pause,
  Mail,
  MessageSquare,
  Bell,
  Tag,
  GitBranch,
  Zap,
  FileText,
  Home,
  Activity,
  Database,
  ArrowRight,
  Timer,
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

// ─── Internal UI types (matches sample UI shapes) ─────────────────────────────

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'success' | 'failed' | 'running' | 'warning';
  startedAt: string;
  completedAt: string | null;
  duration: number;
  triggeredBy: {
    type: 'manual' | 'auto' | 'webhook' | 'schedule';
    user?: string;
    source?: string;
  };
  triggerData: Record<string, string>;
  nodesExecuted: number;
  totalNodes: number;
  errorMessage?: string;
}

interface NodeExecution {
  nodeId: string;
  nodeName: string;
  nodeType: 'trigger' | 'action' | 'condition' | 'delay';
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  status: 'success' | 'failed' | 'skipped' | 'running' | 'pending';
  startedAt: string;
  completedAt: string | null;
  duration: number;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  errorMessage?: string;
  branchTaken?: 'yes' | 'no';
}

// ─── Data mapping helpers ─────────────────────────────────────────────────────

const typeToIcon: Record<string, React.ComponentType<any>> = {
  trigger:   User,
  action:    Mail,
  condition: GitBranch,
  delay:     Clock,
};

const typeToColor: Record<string, string> = {
  trigger:   '#3b82f6',
  action:    '#10b981',
  condition: '#8b5cf6',
  delay:     '#64748b',
};

const enrollmentStatusToUiStatus: Record<string, WorkflowExecution['status']> = {
  completed: 'success',
  failed:    'failed',
  active:    'running',
  paused:    'warning',
  cancelled: 'warning',
};

const stepStatusToUiStatus: Record<string, NodeExecution['status']> = {
  executed: 'success',
  skipped:  'skipped',
  failed:   'failed',
  waiting:  'running',
};

function mapEnrollmentToExecution(
  e: WorkflowEnrollmentSummary,
  workflowName: string,
  workflowId: string,
  totalNodes: number,
): WorkflowExecution {
  const start = new Date(e.created_at).getTime();
  const end   = new Date(e.updated_at).getTime();
  const duration = Math.max(0, Math.round((end - start) / 1000));

  const triggerData: Record<string, string> = {};
  if (e.lead_name)  triggerData.leadName  = e.lead_name;
  if (e.lead_email) triggerData.leadEmail = e.lead_email;
  if (e.lead_id)    triggerData.leadId    = e.lead_id;

  return {
    id: e.id,
    workflowId,
    workflowName,
    status: enrollmentStatusToUiStatus[e.status] ?? 'warning',
    startedAt: e.created_at,
    completedAt: (e.status === 'completed' || e.status === 'failed') ? e.updated_at : null,
    duration,
    triggeredBy: { type: 'auto', source: 'Workflow Trigger' },
    triggerData,
    nodesExecuted: e.step_count,
    totalNodes,
    errorMessage: e.failed_steps > 0 ? `${e.failed_steps} step(s) failed` : undefined,
  };
}

function mapStepLogToNodeExecution(log: WorkflowStepLog): NodeExecution {
  const result = log.result ?? {};
  return {
    nodeId:       log.step_node_id,
    nodeName:     log.step_label || log.step_type,
    nodeType:     log.step_type as NodeExecution['nodeType'],
    icon:         typeToIcon[log.step_type] ?? Zap,
    color:        typeToColor[log.step_type] ?? '#64748b',
    status:       stepStatusToUiStatus[log.status] ?? 'skipped',
    startedAt:    log.executed_at,
    completedAt:  log.executed_at,
    duration:     (result as any).duration ?? 0,
    inputData:    (result as any).inputData ?? {},
    outputData:   result,
    errorMessage: log.status === 'failed'
      ? ((result as any).error || (result as any).message || 'Step failed')
      : undefined,
    branchTaken: (result as any).branchTaken,
  };
}

/**
 * Merges workflow step definitions with execution logs so that ALL nodes are
 * shown — logged ones get their real status, unlogged ones (triggers, skipped
 * condition branches) appear as 'skipped'.
 */
function buildNodeExecutions(
  workflowSteps: unknown[],
  stepLogs: WorkflowStepLog[],
): NodeExecution[] {
  const logMap = new Map<string, WorkflowStepLog>();
  for (const log of stepLogs) logMap.set(log.step_node_id, log);

  if (workflowSteps.length > 0) {
    return (workflowSteps as any[]).map((step) => {
      const log = logMap.get(step.id);
      if (log) return mapStepLogToNodeExecution(log);
      return {
        nodeId:       step.id ?? '',
        nodeName:     step.label || step.type || 'Node',
        nodeType:     step.type ?? 'action',
        icon:         typeToIcon[step.type] ?? Zap,
        color:        typeToColor[step.type] ?? '#64748b',
        status:       step.type === 'trigger' ? 'skipped' : 'pending',
        startedAt:    '',
        completedAt:  null,
        duration:     0,
        inputData:    {},
        outputData:   {},
      } satisfies NodeExecution;
    });
  }

  // Fallback: only show logged steps
  return stepLogs.map(mapStepLogToNodeExecution);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExecutionListItem({
  execution,
  onClick,
}: {
  execution: WorkflowExecution;
  onClick: () => void;
}) {
  const statusConfig = {
    success: {
      icon:   CheckCircle2,
      color:  'text-emerald-600',
      bg:     'bg-emerald-50',
      border: 'border-emerald-200',
      label:  'Success',
    },
    failed: {
      icon:   XCircle,
      color:  'text-rose-600',
      bg:     'bg-rose-50',
      border: 'border-rose-200',
      label:  'Failed',
    },
    running: {
      icon:   Play,
      color:  'text-blue-600',
      bg:     'bg-blue-50',
      border: 'border-blue-200',
      label:  'Running',
    },
    warning: {
      icon:   AlertCircle,
      color:  'text-amber-600',
      bg:     'bg-amber-50',
      border: 'border-amber-200',
      label:  'Warning',
    },
  };

  const config = statusConfig[execution.status];
  const StatusIcon = config.icon;

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-ZA', {
      month:  'short',
      day:    'numeric',
      year:   'numeric',
      hour:   'numeric',
      minute: '2-digit',
    });

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center shrink-0`}>
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 ${config.bg} ${config.color} border ${config.border} rounded text-xs font-semibold`}>
                {config.label}
              </span>
              {execution.errorMessage && (
                <>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-rose-600 truncate max-w-xs">{execution.errorMessage}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(execution.startedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(execution.duration)}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
      </div>

      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600">
            Auto: <span className="font-medium">{execution.triggeredBy.source}</span>
          </span>
        </div>
        <div className="text-slate-600">
          <span className="font-medium">{execution.nodesExecuted}</span>
          {execution.totalNodes > 0 && execution.totalNodes !== execution.nodesExecuted && (
            <> / {execution.totalNodes}</>
          )} nodes
        </div>
        {execution.triggerData.leadName && (
          <div className="text-slate-600">
            Lead: <span className="font-medium">{execution.triggerData.leadName}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function NodeExecutionItem({ node, isLast }: { node: NodeExecution; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    failed:  { icon: XCircle,      color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200'    },
    skipped: { icon: Pause,        color: 'text-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-200'   },
    running: { icon: Play,         color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
    pending: { icon: Clock,        color: 'text-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-200'   },
  };

  const config    = statusConfig[node.status] ?? statusConfig.pending;
  const StatusIcon = config.icon;
  const NodeIcon   = node.icon;

  const hasDetails =
    Object.keys(node.inputData).length > 0 ||
    Object.keys(node.outputData).length > 0 ||
    !!node.errorMessage;

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-8 top-[68px] bottom-0 w-0.5 bg-slate-200 z-0" />
      )}

      <div
        className={`bg-white border-2 rounded-xl overflow-hidden transition-all relative z-10 ${
          node.status === 'failed'
            ? 'border-rose-200'
            : node.status === 'success'
              ? 'border-emerald-200'
              : 'border-slate-200'
        }`}
      >
        <button
          onClick={() => hasDetails && setIsExpanded((v) => !v)}
          className={`w-full p-4 text-left transition-colors ${hasDetails ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-start gap-4">
            {/* Node icon */}
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 border"
              style={{ backgroundColor: `${node.color}15`, borderColor: `${node.color}30` }}
            >
              <NodeIcon className="w-7 h-7" style={{ color: node.color }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{node.nodeName}</h4>
                  <p className="text-xs text-slate-500 uppercase font-medium">{node.nodeType}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {node.branchTaken && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        node.branchTaken === 'yes'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {node.branchTaken.toUpperCase()} Branch
                    </span>
                  )}
                  <div className={`flex items-center gap-1.5 px-2 py-1 ${config.bg} rounded`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-xs font-semibold capitalize ${config.color}`}>{node.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-600">
                {node.duration > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {node.duration.toFixed(2)}s
                  </span>
                )}
                {node.completedAt && (
                  <span className="text-xs text-slate-500">
                    {new Date(node.completedAt).toLocaleTimeString()}
                  </span>
                )}
                {hasDetails && (
                  <span className="text-xs text-blue-600 font-medium">
                    {isExpanded ? 'Hide details' : 'View details'}
                  </span>
                )}
              </div>

              {node.errorMessage && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <p className="text-sm text-rose-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {node.errorMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Expanded data */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-slate-200 bg-slate-50">
            {Object.keys(node.inputData).length > 0 && (
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                  <h5 className="text-xs font-semibold text-slate-900 uppercase">Input Data</h5>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <pre className="text-xs text-slate-900 font-mono overflow-x-auto">
                    {JSON.stringify(node.inputData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {Object.keys(node.outputData).length > 0 && (
              <div className={Object.keys(node.inputData).length > 0 ? '' : 'pt-4'}>
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                  <h5 className="text-xs font-semibold text-slate-900 uppercase">Output Data</h5>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <pre className="text-xs text-slate-900 font-mono overflow-x-auto">
                    {JSON.stringify(node.outputData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowExecutionDetail({
  execution,
  nodeExecutions,
  detailLoading,
  onBack,
  onClose,
}: {
  execution: WorkflowExecution;
  nodeExecutions: NodeExecution[];
  detailLoading: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-ZA', {
      month:  'short',
      day:    'numeric',
      year:   'numeric',
      hour:   'numeric',
      minute: '2-digit',
      second: '2-digit',
    });

  const formatDuration = (s: number) => `${s}s`;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[310]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600 rotate-180" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Execution Details</h2>
                <p className="text-sm text-slate-600">Execution ID: {execution.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Execution summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Status</p>
                <p
                  className={`text-lg font-semibold capitalize ${
                    execution.status === 'success'
                      ? 'text-emerald-600'
                      : execution.status === 'failed'
                        ? 'text-rose-600'
                        : execution.status === 'running'
                          ? 'text-blue-600'
                          : 'text-amber-600'
                  }`}
                >
                  {execution.status}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Duration</p>
                <p className="text-lg font-semibold text-slate-900">{formatDuration(execution.duration)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Started</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(execution.startedAt)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Triggered By</p>
                <p className="text-sm font-semibold text-slate-900 capitalize">
                  {execution.triggeredBy.type}
                  {execution.triggeredBy.source && ` — ${execution.triggeredBy.source}`}
                </p>
              </div>
            </div>

            {/* Trigger data */}
            {Object.keys(execution.triggerData).length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-600" />
                  Trigger Data
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(execution.triggerData).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-slate-500 mb-1 font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-slate-900 font-mono bg-white px-2 py-1 rounded border border-slate-200 break-all">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution flow */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-600" />
                Execution Flow
              </h3>

              {detailLoading && (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                </div>
              )}

              {!detailLoading && nodeExecutions.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No step execution data recorded for this run.
                </div>
              )}

              {!detailLoading && nodeExecutions.length > 0 && (
                <div className="space-y-3">
                  {nodeExecutions.map((node, idx) => (
                    <NodeExecutionItem
                      key={node.nodeId + idx}
                      node={node}
                      isLast={idx === nodeExecutions.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main WorkflowLogs component ─────────────────────────────────────────────

export function WorkflowLogs({
  workflow,
  onClose,
}: {
  workflow: WorkflowRecord;
  onClose: () => void;
}) {
  const [executions, setExecutions]       = useState<WorkflowExecution[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [filterStatus, setFilterStatus]   = useState<string>('all');
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [nodeExecutions, setNodeExecutions]       = useState<NodeExecution[]>([]);
  const [detailLoading, setDetailLoading]         = useState(false);

  const totalNodes = Array.isArray(workflow.steps) ? workflow.steps.length : 0;

  // Load execution list
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) { setLoading(false); return; }
      try {
        const data = await agentApi.getWorkflowLogs(token, workflow.id);
        setExecutions(
          data.map((e) => mapEnrollmentToExecution(e, workflow.name, workflow.id, totalNodes)),
        );
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workflow.id]);

  // Load detail when execution selected
  useEffect(() => {
    if (!selectedExecution) { setNodeExecutions([]); return; }
    async function loadDetail() {
      setDetailLoading(true);
      const token = await getAccessToken();
      if (!token) { setDetailLoading(false); return; }
      try {
        const detail = await agentApi.getWorkflowEnrollmentDetail(token, workflow.id, selectedExecution.id);
        setNodeExecutions(
          buildNodeExecutions(detail.workflowSteps ?? [], detail.stepLogs ?? []),
        );
      } catch {
        setNodeExecutions([]);
      } finally {
        setDetailLoading(false);
      }
    }
    loadDetail();
  }, [selectedExecution?.id]);

  const filteredExecutions =
    filterStatus === 'all'
      ? executions
      : executions.filter((e) => e.status === filterStatus);

  // Show detail view
  if (selectedExecution) {
    return (
      <WorkflowExecutionDetail
        execution={selectedExecution}
        nodeExecutions={nodeExecutions}
        detailLoading={detailLoading}
        onBack={() => setSelectedExecution(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[300]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Workflow Execution Logs</h2>
              <p className="text-sm text-slate-600 mt-1">{workflow.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
                <option value="warning">Warning</option>
              </select>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Execution list */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-3">
              {filteredExecutions.map((execution) => (
                <ExecutionListItem
                  key={execution.id}
                  execution={execution}
                  onClick={() => setSelectedExecution(execution)}
                />
              ))}
              {filteredExecutions.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No executions found</p>
                  {executions.length === 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      Runs will appear here once the workflow is triggered.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
