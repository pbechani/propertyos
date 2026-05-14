'use client';

// TODO(sprint-refinement): Replace this query-param tab approach (Approach B) with
// Next.js parallel routes / nested layouts (Approach C). This would give true URL-segment
// tabs (/app/leads/pipeline instead of /app/leads?tab=pipeline), native browser back/forward
// support, and better SSR. Track in a future project refinement sprint.

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { leadsApi, type LeadDashboardResponse, type LeadTaskRow } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import LeadDashboard from '@/views/LeadDashboard';
import LeadsPage from '@/views/LeadsPage';
import LeadPipeline from '@/views/LeadPipeline';
import LeadAnalytics from '@/views/LeadAnalytics';

const TABS = [
  { id: 'dashboard', label: 'Dashboard',  badge: null },
  { id: 'leads',     label: 'All Leads',  badge: 'leads' },
  { id: 'pipeline',  label: 'Pipeline',   badge: null },
  { id: 'analytics', label: 'Analytics',  badge: null },
  { id: 'tasks',     label: 'Tasks',      badge: 'tasks' },
] as const;

type TabId = typeof TABS[number]['id'];

const EMPTY_DASHBOARD: LeadDashboardResponse = {
  totalLeads: 0, hotLeads: 0, activeDeals: 0, pipelineValue: 0,
  pendingTasks: [], recentActivities: [], recentLeads: [], byType: {}, byTemperature: {}, byStage: {},
};

function formatValue(n: number): string {
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R ${(n / 1_000).toFixed(0)}K`;
  return `R ${n.toLocaleString()}`;
}

function formatDue(due: string | null): string {
  if (!due) return '';
  const d = new Date(due);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
  if (diffDays === 0) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function isDueOverdue(due: string | null): boolean {
  if (!due) return false;
  return new Date(due) < new Date();
}

function isDueToday(due: string | null): boolean {
  if (!due) return false;
  const d = new Date(due);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function TasksTab({ tasks }: { tasks: LeadTaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#9CA3AF' }}>
        <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ width: 40, height: 40, marginBottom: 12, opacity: 0.4 }}>
          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        <p style={{ fontSize: 13, fontWeight: 600 }}>All caught up — no pending tasks</p>
      </div>
    );
  }

  const overdue = tasks.filter((t) => !t.completed && isDueOverdue(t.due_date) && !isDueToday(t.due_date));
  const dueToday = tasks.filter((t) => !t.completed && isDueToday(t.due_date));
  const thisWeek = tasks.filter((t) => !t.completed && !isDueOverdue(t.due_date) && !isDueToday(t.due_date));

  const priorityDotColor: Record<string, string> = {
    high: '#DC2626', medium: '#D97706', low: '#6D28D9',
  };

  function TaskRow({ task }: { task: LeadTaskRow }) {
    const overdueDue = isDueOverdue(task.due_date) && !isDueToday(task.due_date);
    const todayDue = isDueToday(task.due_date);
    return (
      <div
        className="task-row-item"
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid #E5E7EB', cursor: 'pointer' }}
      >
        <div style={{ width: 18, height: 18, borderRadius: 5, border: '2px solid #D1D5DB', flexShrink: 0 }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityDotColor[task.priority] ?? '#9CA3AF', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
          {task.assigned_agent_name && (
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{task.assigned_agent_name} &middot; {task.type}</div>
          )}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: overdueDue || todayDue ? 700 : 400,
          color: overdueDue ? '#DC2626' : todayDue ? '#D97706' : '#6B7280',
          flexShrink: 0,
        }}>
          {formatDue(task.due_date)}
        </div>
        <div style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.15s' }} className="task-row-actions">
          <button style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Complete">
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12" /></svg>
          </button>
          <button style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Snooze">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 12, height: 12 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 18px', minWidth: 100, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#DC2626', fontFamily: "var(--font-fraunces)" }}>{overdue.length}</div>
          <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, fontFamily: "var(--font-mono)" }}>OVERDUE</div>
        </div>
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 18px', minWidth: 100, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', fontFamily: "var(--font-fraunces)" }}>{dueToday.length}</div>
          <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600, fontFamily: "var(--font-mono)" }}>DUE TODAY</div>
        </div>
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 18px', minWidth: 100, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: "var(--font-fraunces)" }}>{thisWeek.length}</div>
          <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, fontFamily: "var(--font-mono)" }}>THIS WEEK</div>
        </div>
        <div style={{ background: '#F9F8F6', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 18px', minWidth: 100, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1F2937', fontFamily: "var(--font-fraunces)" }}>{tasks.filter((t) => !t.completed).length}</div>
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, fontFamily: "var(--font-mono)" }}>TOTAL OPEN</div>
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 6, background: '#C4562A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Task
        </button>
      </div>

      {/* Filter toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
          All Tasks
          <span style={{ background: '#DC2626', color: '#fff', borderRadius: '50%', padding: '0 6px', fontSize: 10, fontWeight: 700, lineHeight: '18px' }}>{tasks.filter((t) => !t.completed).length}</span>
        </button>
        {['Overdue', 'Today', 'This Week', 'Completed'].map((f) => (
          <button key={f} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>{f}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          Filter by lead
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {overdue.length > 0 && (
          <>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#DC2626', padding: '10px 20px 6px', borderTop: '1px solid #E5E7EB' }}>
              🔴&nbsp; Overdue — {overdue.length} task{overdue.length !== 1 ? 's' : ''}
            </div>
            {overdue.map((t) => <TaskRow key={t.id} task={t} />)}
          </>
        )}
        {dueToday.length > 0 && (
          <>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#D97706', padding: '10px 20px 6px', borderTop: '1px solid #E5E7EB' }}>
              📅&nbsp; Due Today — {dueToday.length} task{dueToday.length !== 1 ? 's' : ''}
            </div>
            {dueToday.map((t) => <TaskRow key={t.id} task={t} />)}
          </>
        )}
        {thisWeek.length > 0 && (
          <>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6B7280', padding: '10px 20px 6px', borderTop: '1px solid #E5E7EB' }}>
              📆&nbsp; This Week — {thisWeek.length} task{thisWeek.length !== 1 ? 's' : ''}
            </div>
            {thisWeek.map((t) => <TaskRow key={t.id} task={t} />)}
          </>
        )}
        {overdue.length === 0 && dueToday.length === 0 && thisWeek.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>No open tasks</div>
        )}
      </div>
      <style>{`.task-row-item:hover .task-row-actions { opacity: 1 !important; }`}</style>
    </>
  );
}

function HubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get('tab') ?? 'dashboard';
  const activeTab: TabId = TABS.some((t) => t.id === rawTab)
    ? (rawTab as TabId)
    : 'dashboard';

  const [dashboard, setDashboard] = useState<LeadDashboardResponse>(EMPTY_DASHBOARD);
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setKpiLoading(false); return; }
    leadsApi.getDashboard(token)
      .then(setDashboard)
      .catch(() => { /* silently fail — KPI strip is non-critical */ })
      .finally(() => setKpiLoading(false));
  }, []);

  function selectTab(id: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    router.replace(`?${params.toString()}`);
  }

  const taskCount = dashboard.pendingTasks.filter((t) => !t.completed).length;

  return (
    <div style={{ minHeight: '100vh', background: '#F9F8F6' }}>
      {/* ── Forest header ── */}
      <div style={{ background: '#1A3C28', padding: '32px 32px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(196,86,42,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 10, left: '40%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,232,122,0.04)', pointerEvents: 'none' }} />

        {/* Header top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#C4562A', marginBottom: 6 }}>
              Agent Cockpit › Lead Management
            </div>
            <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: 28, fontWeight: 700, color: '#F2E8D5', letterSpacing: '-0.5px', margin: 0, lineHeight: 1.2 }}>
              Lead Management
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(242,232,213,0.55)', marginTop: 6, marginBottom: 0 }}>
              Track, nurture, and convert your pipeline — all in one place.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 4 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(242,232,213,0.08)', border: '1px solid rgba(242,232,213,0.14)', borderRadius: 8, padding: '8px 14px', color: '#F2E8D5', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
              Filters
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(242,232,213,0.08)', border: '1px solid rgba(242,232,213,0.14)', borderRadius: 8, padding: '8px 14px', color: '#F2E8D5', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#C4562A', border: '1px solid #C4562A', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add Lead
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, paddingBottom: 24 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 6 }}>Total Leads</div>
            <div style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, fontWeight: 700, color: '#F2E8D5' }}>{kpiLoading ? '—' : dashboard.totalLeads}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#00E87A', marginTop: 4 }}>↑ {kpiLoading ? '…' : Math.max(0, dashboard.totalLeads - 112)} this week</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 6 }}>Hot Leads</div>
            <div style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, fontWeight: 700, color: '#F2E8D5' }}>{kpiLoading ? '—' : dashboard.hotLeads}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#00E87A', marginTop: 4 }}>↑ 3 new today</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 6 }}>Pipeline Value</div>
            <div style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, fontWeight: 700, color: '#F2E8D5' }}>{kpiLoading ? '—' : formatValue(dashboard.pipelineValue)}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#00E87A', marginTop: 4 }}>↑ 8% vs last month</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 6 }}>Conversion Rate</div>
            <div style={{ fontFamily: "var(--font-fraunces)", fontSize: 22, fontWeight: 700, color: '#F2E8D5' }}>{kpiLoading ? '—' : `${dashboard.activeDeals}%`}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#F87171', marginTop: 4 }}>↓ 2% vs target</div>
          </div>
        </div>

        {/* Tab bar — still inside forest div, with top border separator */}
        <div style={{ borderTop: '1px solid rgba(242,232,213,0.08)', marginLeft: -32, marginRight: -32, paddingLeft: 32, display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'tasks' && taskCount > 0;
            const showLeadsBadge = tab.id === 'leads' && dashboard.totalLeads > 0;
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                style={{
                  padding: '14px 22px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: isActive ? '#F2E8D5' : 'rgba(242,232,213,0.5)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #C4562A' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap' as const,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.15s',
                }}
              >
                {tab.label}
                {showLeadsBadge && (
                  <span style={{
                    background: isActive ? '#C4562A' : 'rgba(196,86,42,0.25)',
                    color: isActive ? '#fff' : '#C4562A',
                    borderRadius: 20,
                    padding: '1px 7px',
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: '16px',
                  }}>
                    {dashboard.totalLeads}
                  </span>
                )}
                {showBadge && (
                  <span style={{
                    background: '#DC2626',
                    color: '#fff',
                    borderRadius: 20,
                    padding: '1px 7px',
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: '16px',
                  }}>
                    {taskCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '24px 32px' }}>
        {activeTab === 'dashboard' && <LeadDashboard isEmbedded />}
        {activeTab === 'leads'     && <LeadsPage isEmbedded />}
        {activeTab === 'pipeline'  && <LeadPipeline isEmbedded />}
        {activeTab === 'analytics' && <LeadAnalytics isEmbedded />}
        {activeTab === 'tasks'     && <TasksTab tasks={dashboard.pendingTasks} />}
      </div>
    </div>
  );
}

export default function LeadManagementHub() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 192 }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#6B7280' }} />
        </div>
      }
    >
      <HubContent />
    </Suspense>
  );
}
