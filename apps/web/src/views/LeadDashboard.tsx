'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { leadsApi, type LeadDashboardResponse } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ── Brand tokens ────────────────────────────────────────────────────────────
const F  = '#1A3C28';  // forest
const TC = '#C4562A';  // terracotta
const BD = '#E5E7EB';  // border
const TM = '#9CA3AF';  // text-muted
const TD = '#1F2937';  // text-dark

// ── Lead helpers ─────────────────────────────────────────────────────────────
const AVATAR_BG: Record<string, string> = {
  hot: F, warm: TC, cold: '#10B981', nurture: '#7C3AED',
};

const STAGE_ORDER = ['new', 'contacted', 'qualified', 'active', 'under_contract', 'closed'];
const STAGE_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified',
  active: 'Active', under_contract: 'Under Contract', closed: 'Closed 🏆',
};
const STAGE_COLORS: Record<string, string> = {
  new: F, contacted: F, qualified: '#2D5A40',
  active: TC, under_contract: '#7C3AED', closed: '#00795A',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatBudget(min: string | null, max: string | null): string {
  if (!min && !max) return '—';
  const fmt = (v: string) => {
    const n = parseFloat(v);
    if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `R ${Math.round(n / 1_000)}K`;
    return `R ${n.toLocaleString()}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max || '0');
}

// ── Activity dot icon ────────────────────────────────────────────────────────
const ACT_DOTS: Record<string, { bg: string; stroke: string; icon: 'phone' | 'email' | 'trend' | 'note' }> = {
  call:         { bg: '#FEE2E2', stroke: '#DC2626', icon: 'phone' },
  email:        { bg: '#DBEAFE', stroke: '#2563EB', icon: 'email' },
  stage_change: { bg: '#D1FAE5', stroke: '#065F46', icon: 'trend' },
  note:         { bg: '#F3F4F6', stroke: '#374151', icon: 'note'  },
  sms:          { bg: '#EDE9FE', stroke: '#6D28D9', icon: 'note'  },
  meeting:      { bg: '#FEF3C7', stroke: '#D97706', icon: 'email' },
};

function ActivityDot({ type }: { type: string }) {
  const cfg = ACT_DOTS[type] ?? ACT_DOTS.note;
  return (
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {cfg.icon === 'phone' && (
        <svg width="14" height="14" fill="none" stroke={cfg.stroke} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.66 19.79 19.79 0 01.1 1.09 2 2 0 012.07.07h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1-1.41a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
      )}
      {cfg.icon === 'email' && (
        <svg width="14" height="14" fill="none" stroke={cfg.stroke} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      )}
      {cfg.icon === 'trend' && (
        <svg width="14" height="14" fill="none" stroke={cfg.stroke} strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </svg>
      )}
      {cfg.icon === 'note' && (
        <svg width="14" height="14" fill="none" stroke={cfg.stroke} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      )}
    </div>
  );
}

// ── Temperature badge ────────────────────────────────────────────────────────
const TEMP_CFG: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
  hot:     { label: 'HOT',     emoji: '🔥', bg: '#FFF1EE', color: '#C4562A' },
  warm:    { label: 'WARM',    emoji: '🌡',  bg: '#FFFBEB', color: '#B45309' },
  cold:    { label: 'COLD',    emoji: '❄',  bg: '#EFF6FF', color: '#1D4ED8' },
  nurture: { label: 'NURTURE', emoji: '🌿', bg: '#F0FDF4', color: '#15803D' },
};

function TempBadge({ temperature }: { temperature: string }) {
  const cfg = TEMP_CFG[temperature] ?? TEMP_CFG.warm;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", whiteSpace: 'nowrap' }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDue(due: string | null): string {
  if (!due) return '—';
  const d = new Date(due);
  const diffDays = Math.round((d.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

function priorityBorderColor(priority: string) {
  if (priority === 'high') return '#EF4444';
  if (priority === 'medium') return '#F59E0B';
  return '#10B981';
}

// ── Shared card styles ───────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = { background: '#fff', border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden' };
const cardHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BD}` };
const cardTitleStyle: React.CSSProperties = { fontFamily: "var(--font-jakarta)", fontWeight: 700, fontSize: 13, color: TD };

const EMPTY: LeadDashboardResponse = {
  totalLeads: 0, hotLeads: 0, activeDeals: 0, pipelineValue: 0,
  pendingTasks: [], recentActivities: [], recentLeads: [], byType: {}, byTemperature: {}, byStage: {},
};

export default function LeadDashboard({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [dashboard, setDashboard] = useState<LeadDashboardResponse>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    leadsApi.getDashboard(token)
      .then(setDashboard)
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 192 }}>
        <Loader2 style={{ width: 24, height: 24, color: TM }} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p style={{ textAlign: 'center', color: '#DC2626', fontSize: 13, padding: '32px 0' }}>{error}</p>;
  }

  const { pendingTasks, recentActivities, recentLeads } = dashboard;

  const funnelRows = STAGE_ORDER
    .map((s) => ({ label: STAGE_LABELS[s] ?? s, count: dashboard.byStage[s] ?? 0, color: STAGE_COLORS[s] ?? F }))
    .filter((r) => r.count > 0);
  const maxCount = funnelRows[0]?.count || 1;

  return (
    <div style={{ display: !isEmbedded ? undefined : undefined }}>

      {/* Row 1: Recent Leads + Pending Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>

        {/* Recent Leads */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Recent Leads</span>
          </div>
          <div style={{ padding: '0 20px' }}>
            {recentLeads.length === 0 && (
              <p style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: TM }}>No leads yet</p>
            )}
            {recentLeads.map((lead, idx) => (
              <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: idx < recentLeads.length - 1 ? `1px solid ${BD}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: AVATAR_BG[lead.temperature] ?? F, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-fraunces)", fontWeight: 700, fontSize: 12, color: '#fff', flexShrink: 0 }}>
                  {getInitials(lead.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: TD, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</div>
                  <div style={{ fontSize: 11, color: TM, marginTop: 1 }}>
                    {lead.type.charAt(0).toUpperCase() + lead.type.slice(1)}
                    {lead.address ? ` · ${lead.address}` : ''}
                    {(lead.budget_min || lead.budget_max) ? ` · ${formatBudget(lead.budget_min, lead.budget_max)}` : ''}
                  </div>
                </div>
                <TempBadge temperature={lead.temperature} />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Pending Tasks</span>
            <span style={{ fontSize: 11, color: TM, fontFamily: "var(--font-mono)" }}>{pendingTasks.length} due today</span>
          </div>
          <div style={{ padding: '0 20px' }}>
            {pendingTasks.slice(0, 5).map((task, idx) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: idx < Math.min(pendingTasks.length, 5) - 1 ? `1px solid ${BD}` : 'none' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${priorityBorderColor(task.priority)}`, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12, color: TD }}>{task.title}</div>
                <div style={{ fontSize: 10, color: TM, fontFamily: "var(--font-mono)", whiteSpace: 'nowrap' }}>{formatDue(task.due_date)}</div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <p style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: TM }}>All tasks complete!</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Recent Activity + Conversion Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Recent Activity */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Recent Activity</span>
          </div>
          <div style={{ padding: '0 20px' }}>
            {recentActivities.slice(0, 4).map((act, idx) => (
              <div key={act.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: idx < Math.min(recentActivities.length, 4) - 1 ? `1px solid ${BD}` : 'none' }}>
                <ActivityDot type={act.type} />
                <div>
                  <div style={{ fontSize: 12, color: TD, lineHeight: 1.45 }}>{act.description}</div>
                  <div style={{ fontSize: 10, color: TM, fontFamily: "var(--font-mono)", marginTop: 2 }}>{timeAgo(act.created_at)}</div>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: TM }}>No recent activity</p>
            )}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Conversion Funnel</span>
          </div>
          <div style={{ padding: 20 }}>
            {funnelRows.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: 12, color: TM }}>No data yet</p>
            )}
            {funnelRows.map((stage) => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: TD, width: 110, flexShrink: 0 }}>{stage.label}</span>
                <div style={{ flex: 1, background: 'rgba(26,60,40,0.06)', borderRadius: 4, height: 22, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((stage.count / maxCount) * 100)}%`, height: '100%', background: stage.color, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(242,232,213,0.8)', fontFamily: "var(--font-mono)" }}>{stage.count}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: TM, fontFamily: "var(--font-mono)", width: 24, textAlign: 'right' }}>{stage.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
