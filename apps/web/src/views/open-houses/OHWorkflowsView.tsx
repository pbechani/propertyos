// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import {
  Plus,
  Zap,
  Trash2,
  Edit,
  MoreVertical,
  Users,
  TrendingUp,
  Clock,
  Mail,
  ScrollText,
} from 'lucide-react';
import { agentApi, WorkflowRecord } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { EnhancedWorkflowBuilder } from '@/components/open-houses/EnhancedWorkflowBuilder';
import { WorkflowLogs } from '@/components/open-houses/WorkflowLogs';

export function WorkflowsView() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowRecord | null>(null);
  const [logsWorkflow, setLogsWorkflow] = useState<WorkflowRecord | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getAccessToken();
      if (!token) { setLoading(false); return; }
      try {
        const data = await agentApi.getWorkflows(token);
        setWorkflows(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (workflowId: string) => {
    const token = await getAccessToken();
    if (!token) return;
    await agentApi.deleteWorkflow(token, workflowId);
    setWorkflows(prev => prev.filter(w => w.id !== workflowId));
  };

  const handleToggleStatus = async (workflow: WorkflowRecord) => {
    const token = await getAccessToken();
    if (!token) return;
    const newStatus = workflow.status === 'active' ? 'inactive' : 'active';
    const updated = await agentApi.updateWorkflow(token, workflow.id, { status: newStatus });
    setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
  };

  const statusConfig = {
    active:   { label: 'Active',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    inactive: { label: 'Inactive', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    draft:    { label: 'Draft',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  // Computed stats
  const activeCount   = workflows.filter(w => w.status === 'active').length;
  const totalEnrolled = workflows.reduce((s, w) => s + (w.enrolled_count ?? 0), 0);
  const activeSent    = workflows.filter(w => w.status === 'active' && w.performance?.sent > 0);
  const avgOpenRate   = activeSent.length
    ? activeSent.reduce((s, w) => s + w.performance.opened / w.performance.sent, 0) / activeSent.length
    : 0;
  const avgClickRate  = activeSent.length
    ? activeSent.reduce((s, w) => s + w.performance.clicked / w.performance.sent, 0) / activeSent.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Workflows</h2>
          <p className="text-slate-600">Automate your follow-up sequences</p>
        </div>
        <button
          onClick={() => { setEditingWorkflow(null); setShowBuilder(true); }}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Workflows', value: String(activeCount),                      icon: Zap,         color: 'text-emerald-600' },
          { label: 'Total Enrolled',   value: String(totalEnrolled),                    icon: Users,       color: 'text-blue-600'    },
          { label: 'Avg. Open Rate',   value: activeSent.length ? `${(avgOpenRate * 100).toFixed(1)}%`  : '—', icon: TrendingUp, color: 'text-purple-600'  },
          { label: 'Avg. Click Rate',  value: activeSent.length ? `${(avgClickRate * 100).toFixed(1)}%` : '—', icon: Mail,       color: 'text-amber-600'   },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-sm text-slate-600">{stat.label}</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Workflow List */}
      {!loading && workflows.length > 0 && (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-slate-900">{workflow.name}</h3>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[workflow.status]?.color}`}>
                          {statusConfig[workflow.status]?.label}
                        </span>
                      </div>
                      {workflow.description && (
                        <p className="text-sm text-slate-600 mb-2">{workflow.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {workflow.trigger_type && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            {workflow.trigger_type}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {Array.isArray(workflow.steps) ? workflow.steps.length : 0} steps
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {workflow.enrolled_count} enrolled
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(workflow)}
                      className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        workflow.status === 'active'
                          ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {workflow.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setLogsWorkflow(workflow)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      <ScrollText className="w-3.5 h-3.5" />
                      Logs
                    </button>
                    <button
                      onClick={() => { setEditingWorkflow(workflow); setShowBuilder(true); }}
                      className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="w-8 h-8 border border-slate-200 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Performance */}
                {workflow.status === 'active' && workflow.performance?.sent > 0 && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Sent</span>
                        <span className="text-sm font-semibold text-slate-900">{workflow.performance.sent}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Opened</span>
                        <span className="text-sm font-semibold text-emerald-600">
                          {workflow.performance.opened} ({Math.round((workflow.performance.opened / workflow.performance.sent) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(workflow.performance.opened / workflow.performance.sent) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Clicked</span>
                        <span className="text-sm font-semibold text-purple-600">
                          {workflow.performance.clicked} ({Math.round((workflow.performance.clicked / workflow.performance.sent) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(workflow.performance.clicked / workflow.performance.sent) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && workflows.length === 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-8 text-center">
          <Zap className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Automate Your Follow-ups</h3>
          <p className="text-slate-600 mb-4 max-w-md mx-auto">
            Create automated workflows to nurture leads, follow up after open houses, and re-engage cold prospects
          </p>
          <button
            onClick={() => { setEditingWorkflow(null); setShowBuilder(true); }}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Build Your First Workflow
          </button>
        </div>
      )}

      {/* Workflow Builder Modal */}
      {showBuilder && (
        <EnhancedWorkflowBuilder
          workflow={editingWorkflow}
          onClose={() => { setShowBuilder(false); setEditingWorkflow(null); }}
          onSave={async (payload) => {
            const token = await getAccessToken();
            if (!token) return;
            if (editingWorkflow) {
              const updated = await agentApi.updateWorkflow(token, editingWorkflow.id, payload);
              setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
            } else {
              const created = await agentApi.createWorkflow(token, payload);
              setWorkflows(prev => [created, ...prev]);
            }
            setShowBuilder(false);
            setEditingWorkflow(null);
          }}
        />
      )}

      {/* Workflow Logs */}
      {logsWorkflow && (
        <WorkflowLogs
          workflow={logsWorkflow}
          onClose={() => setLogsWorkflow(null)}
        />
      )}
    </div>
  );
}
