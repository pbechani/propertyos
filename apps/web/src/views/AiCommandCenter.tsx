'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CirclePause,
  CirclePlay,
  Clock,
  Database,
  DollarSign,
  Eye,
  GitBranch,
  Layers,
  Loader2,
  Lock,
  Radio,
  RefreshCw,
  Send,
  Shield,
  Terminal,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth-session';
import {
  aiCommandCenterApi,
  aiIntelligenceApi,
  type AgentDescriptor,
  type AgentTrace,
  type CommandCenterOverview,
  type ObservabilityReport,
  type OrchestratorResult,
  type SafetyRule,
} from '@/lib/api-client';

// ── Theme constants ──────────────────────────────────────────────────────────
const BG = '#030712';
const CARD = '#0d1117';
const BORDER = 'rgba(52,211,153,0.15)';
const ACCENT_GREEN = '#34d399';
const ACCENT_PURPLE = '#818cf8';
const TEXT_DIM = '#6b7280';
const TEXT_MAIN = '#d1d5db';

type View = 'dashboard' | 'agents' | 'registry' | 'tasks' | 'workflows' | 'memory' | 'events' | 'observability' | 'safety' | 'permissions' | 'command';

// ── Static domain data ────────────────────────────────────────────────────────

const WORKFLOW_TEMPLATES = [
  {
    id: 'WF001', name: 'Property Search Pipeline', color: '#34d399',
    desc: 'Search → Rank → Match buyers → Notify',
    steps: ['PropertySearchAgent', 'RankingAgent', 'BuyerMatchAgent', 'NotificationAgent'],
  },
  {
    id: 'WF002', name: 'Full Valuation Report', color: '#818cf8',
    desc: 'Search → Value → Document',
    steps: ['PropertySearchAgent', 'PropertyValuationAgent', 'DocumentAgent'],
  },
  {
    id: 'WF003', name: 'Buyer Demand Analysis', color: '#fb923c',
    desc: 'Profile buyers → Analyze demand → Insights',
    steps: ['BuyerProfileAgent', 'DemandAnalysisAgent', 'RankingAgent'],
  },
  {
    id: 'WF004', name: 'Offer to Close', color: '#f472b6',
    desc: 'Analyze offer → Negotiate → Contract',
    steps: ['OfferAnalysisAgent', 'NegotiationAgent', 'DocumentAgent'],
  },
];

const PERM_COLS = ['property_db', 'buyer_db', 'email', 'sms', 'contracts', 'payments'] as const;

type PermValue = 'read' | 'write' | boolean | null;

const AGENT_PERMISSIONS: Record<string, Record<string, PermValue>> = {
  PropertySearchAgent:    { property_db: 'read', buyer_db: null,   email: false, sms: false, contracts: false, payments: false },
  PropertyValuationAgent: { property_db: 'read', buyer_db: null,   email: false, sms: false, contracts: false, payments: false },
  RankingAgent:           { property_db: 'read', buyer_db: null,   email: false, sms: false, contracts: false, payments: false },
  BuyerProfileAgent:      { property_db: null,   buyer_db: 'read', email: false, sms: false, contracts: false, payments: false },
  BuyerMatchAgent:        { property_db: 'read', buyer_db: 'read', email: false, sms: false, contracts: false, payments: false },
  DemandAnalysisAgent:    { property_db: null,   buyer_db: 'read', email: false, sms: false, contracts: false, payments: false },
  OfferAnalysisAgent:     { property_db: 'read', buyer_db: 'read', email: false, sms: false, contracts: false, payments: true  },
  NegotiationAgent:       { property_db: 'read', buyer_db: 'read', email: false, sms: false, contracts: false, payments: false },
  NotificationAgent:      { property_db: null,   buyer_db: null,   email: true,  sms: true,  contracts: false, payments: false },
  DocumentAgent:          { property_db: 'read', buyer_db: null,   email: false, sms: false, contracts: true,  payments: false },
  WorkflowAgent:          { property_db: null,   buyer_db: null,   email: false, sms: false, contracts: false, payments: false },
};

const STATIC_ROLES = [
  { key: 'admin',   label: 'Administrator', color: '#f472b6', agents: null as string[] | null,          desc: 'Full access — unrestricted' },
  { key: 'analyst', label: 'Analyst',        color: '#818cf8', agents: ['PropertySearchAgent', 'PropertyValuationAgent', 'RankingAgent', 'BuyerProfileAgent', 'BuyerMatchAgent', 'DemandAnalysisAgent'] as string[], desc: 'Read-only analysis' },
  { key: 'agent',   label: 'Agent',          color: '#34d399', agents: ['PropertySearchAgent', 'PropertyValuationAgent', 'RankingAgent', 'BuyerMatchAgent', 'OfferAnalysisAgent', 'NegotiationAgent', 'NotificationAgent', 'DocumentAgent'] as string[], desc: 'Full transaction access' },
  { key: 'viewer',  label: 'Viewer',         color: '#64748b', agents: ['PropertySearchAgent', 'RankingAgent'] as string[], desc: 'View/search only' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function ms(val?: number) {
  if (val === undefined || val === null) return '—';
  if (val < 1000) return `${val}ms`;
  return `${(val / 1000).toFixed(2)}s`;
}

function pct(val?: number) {
  if (val === undefined || val === null) return '—';
  return `${(val * 100).toFixed(1)}%`;
}

function usd(val?: number) {
  if (val === undefined || val === null) return '—';
  return `$${val.toFixed(4)}`;
}

function timeAgo(iso?: string) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = ACCENT_GREEN,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon: React.ElementType;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} color={accent} />
        <span style={{ fontSize: 11, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, fontFamily: 'monospace' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: TEXT_DIM }}>{sub}</div>}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'active' || status === 'success'
      ? ACCENT_GREEN
      : status === 'paused'
        ? '#fbbf24'
        : '#ef4444';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}`,
        flexShrink: 0,
      }}
    />
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#fbbf24',
    low: '#34d399',
  };
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: colors[severity] ?? TEXT_DIM,
        border: `1px solid ${colors[severity] ?? TEXT_DIM}`,
        background: 'transparent',
      }}
    >
      {severity}
    </span>
  );
}

// ── Dashboard view ────────────────────────────────────────────────────────────

function DashboardView({ overview }: { overview: CommandCenterOverview }) {
  const { health, metrics, memorySizes } = overview;
  const recentTraces = metrics.recentTraces.slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Total Agents" value={health.totalAgents} sub={`${health.activeAgents} active`} icon={Bot} />
        <StatCard label="Total Queries" value={metrics.totalTraces} sub={`${health.totalInvocations} invocations`} icon={Zap} />
        <StatCard
          label="Success Rate"
          value={pct(metrics.successRate)}
          sub={`${metrics.totalTraces - Math.round(metrics.totalTraces * metrics.successRate)} failed`}
          accent={metrics.successRate > 0.9 ? ACCENT_GREEN : '#f97316'}
          icon={TrendingUp}
        />
        <StatCard label="Avg Latency" value={ms(metrics.avgDurationMs)} sub="across all agents" icon={Clock} />
        <StatCard label="Total Cost" value={usd(metrics.totalEstimatedCostUsd)} sub="estimated USD" accent={ACCENT_PURPLE} icon={DollarSign} />
        <StatCard
          label="Memory Entries"
          value={memorySizes.shortTerm + memorySizes.longTerm}
          sub={`${memorySizes.shortTerm} short / ${memorySizes.longTerm} long`}
          accent={ACCENT_PURPLE}
          icon={Brain}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Per-agent metrics */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: ACCENT_GREEN, marginBottom: 12, fontWeight: 600 }}>
            AGENT PERFORMANCE
          </div>
          {metrics.agentMetrics.length === 0 ? (
            <p style={{ color: TEXT_DIM, fontSize: 12 }}>No agent data yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ color: TEXT_DIM, textAlign: 'left' }}>
                  <th style={{ paddingBottom: 8 }}>Agent</th>
                  <th style={{ paddingBottom: 8, textAlign: 'right' }}>Calls</th>
                  <th style={{ paddingBottom: 8, textAlign: 'right' }}>Success</th>
                  <th style={{ paddingBottom: 8, textAlign: 'right' }}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {metrics.agentMetrics.map((m) => (
                  <tr key={m.agentName} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ paddingTop: 8, paddingBottom: 8, color: TEXT_MAIN }}>{m.agentName}</td>
                    <td style={{ textAlign: 'right', color: TEXT_DIM }}>{m.totalCalls}</td>
                    <td style={{ textAlign: 'right', color: m.successRate > 0.9 ? ACCENT_GREEN : '#f97316' }}>
                      {pct(m.successRate)}
                    </td>
                    <td style={{ textAlign: 'right', color: TEXT_DIM }}>{ms(m.avgDurationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent trace feed */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: ACCENT_GREEN, marginBottom: 12, fontWeight: 600 }}>
            RECENT ACTIVITY
          </div>
          {recentTraces.length === 0 ? (
            <p style={{ color: TEXT_DIM, fontSize: 12 }}>No traces yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentTraces.map((t) => (
                <div
                  key={t.traceId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: `1px solid ${BORDER}`,
                    fontSize: 11,
                  }}
                >
                  <StatusDot status={t.status} />
                  <span style={{ color: ACCENT_PURPLE, flex: '0 0 auto' }}>{t.agentName}</span>
                  <span style={{ color: TEXT_DIM, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.inputSummary ?? t.action ?? '—'}
                  </span>
                  <span style={{ color: TEXT_DIM, flex: '0 0 auto' }}>{timeAgo(t.startedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Agents view ───────────────────────────────────────────────────────────────

function AgentsView({
  agents,
  onPause,
  onResume,
}: {
  agents: AgentDescriptor[];
  onPause: (name: string) => void;
  onResume: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (agents.length === 0) {
    return (
      <div style={{ color: TEXT_DIM, fontSize: 13, padding: 32, textAlign: 'center' }}>
        No agents registered yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {agents.map((agent) => (
        <div
          key={agent.name}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              cursor: 'pointer',
            }}
            onClick={() => setExpanded(expanded === agent.name ? null : agent.name)}
          >
            <StatusDot status={agent.status} />
            <Bot size={14} color={ACCENT_PURPLE} />
            <span style={{ color: TEXT_MAIN, fontSize: 13, fontWeight: 600, flex: 1 }}>
              {agent.name}
            </span>
            <span style={{ color: TEXT_DIM, fontSize: 11 }}>
              {agent.invocationCount} calls · {pct(agent.successCount / Math.max(agent.invocationCount, 1))} success
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: agent.status === 'active' ? ACCENT_GREEN : agent.status === 'paused' ? '#fbbf24' : '#ef4444',
                border: `1px solid ${agent.status === 'active' ? ACCENT_GREEN : agent.status === 'paused' ? '#fbbf24' : '#ef4444'}`,
              }}
            >
              {agent.status}
            </span>
            {/* Pause / Resume */}
            {agent.status === 'active' ? (
              <button
                onClick={(e) => { e.stopPropagation(); onPause(agent.name); }}
                style={{
                  background: 'transparent',
                  border: `1px solid #fbbf24`,
                  borderRadius: 4,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  color: '#fbbf24',
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CirclePause size={11} />
                Pause
              </button>
            ) : agent.status === 'paused' ? (
              <button
                onClick={(e) => { e.stopPropagation(); onResume(agent.name); }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${ACCENT_GREEN}`,
                  borderRadius: 4,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  color: ACCENT_GREEN,
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CirclePlay size={11} />
                Resume
              </button>
            ) : null}
            {expanded === agent.name ? (
              <ChevronDown size={14} color={TEXT_DIM} />
            ) : (
              <ChevronRight size={14} color={TEXT_DIM} />
            )}
          </div>

          {/* Expanded details */}
          {expanded === agent.name && (
            <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 12 }}>{agent.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: ACCENT_GREEN, marginBottom: 6, textTransform: 'uppercase' }}>
                    Capabilities
                  </div>
                  {agent.capabilities.map((c) => (
                    <div key={c} style={{ fontSize: 11, color: TEXT_MAIN, padding: '2px 0' }}>• {c}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: ACCENT_GREEN, marginBottom: 6, textTransform: 'uppercase' }}>
                    Actions
                  </div>
                  {agent.actions.map((a) => (
                    <div key={a} style={{ fontSize: 11, color: TEXT_MAIN, padding: '2px 0' }}>• {a}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: ACCENT_GREEN, marginBottom: 6, textTransform: 'uppercase' }}>
                    Metrics
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_DIM }}>
                    Invocations: <span style={{ color: TEXT_MAIN }}>{agent.invocationCount}</span>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_DIM }}>
                    Errors: <span style={{ color: agent.errorCount > 0 ? '#ef4444' : TEXT_MAIN }}>{agent.errorCount}</span>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_DIM }}>
                    Avg latency: <span style={{ color: TEXT_MAIN }}>{ms(agent.avgDurationMs)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_DIM }}>
                    Last used: <span style={{ color: TEXT_MAIN }}>{timeAgo(agent.lastInvokedAt)}</span>
                  </div>
                </div>
              </div>
              {agent.lastError && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 8,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 4,
                    fontSize: 11,
                    color: '#ef4444',
                  }}
                >
                  Last error: {agent.lastError}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Observability view ────────────────────────────────────────────────────────

function ObservabilityView({
  metrics,
  traces,
}: {
  metrics: ObservabilityReport;
  traces: AgentTrace[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="Total Traces" value={metrics.totalTraces} icon={Activity} />
        <StatCard label="Active" value={metrics.activeTraces} icon={CircleCheck} />
        <StatCard label="Success Rate" value={pct(metrics.successRate)} accent={metrics.successRate > 0.9 ? ACCENT_GREEN : '#f97316'} icon={TrendingUp} />
        <StatCard label="Avg Latency" value={ms(metrics.avgDurationMs)} icon={Clock} />
        <StatCard label="Total Cost" value={usd(metrics.totalEstimatedCostUsd)} accent={ACCENT_PURPLE} icon={DollarSign} />
      </div>

      {/* Traces table */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 12, color: ACCENT_GREEN, marginBottom: 12, fontWeight: 600 }}>
          EXECUTION TRACES
        </div>
        {traces.length === 0 ? (
          <p style={{ color: TEXT_DIM, fontSize: 12 }}>No traces recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ color: TEXT_DIM, textAlign: 'left' }}>
                  <th style={{ paddingBottom: 10, paddingRight: 12 }}>Status</th>
                  <th style={{ paddingBottom: 10, paddingRight: 12 }}>Agent</th>
                  <th style={{ paddingBottom: 10, paddingRight: 12 }}>Intent</th>
                  <th style={{ paddingBottom: 10, paddingRight: 12 }}>Input</th>
                  <th style={{ paddingBottom: 10, paddingRight: 12 }}>Duration</th>
                  <th style={{ paddingBottom: 10, paddingRight: 12 }}>Cost</th>
                  <th style={{ paddingBottom: 10 }}>When</th>
                </tr>
              </thead>
              <tbody>
                {traces.slice(0, 40).map((t) => (
                  <tr key={t.traceId} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ paddingTop: 8, paddingBottom: 8, paddingRight: 12 }}>
                      <StatusDot status={t.status} />
                    </td>
                    <td style={{ paddingTop: 8, paddingBottom: 8, paddingRight: 12, color: ACCENT_PURPLE }}>
                      {t.agentName}
                    </td>
                    <td style={{ paddingTop: 8, paddingBottom: 8, paddingRight: 12, color: TEXT_DIM }}>
                      {t.matchedIntent ?? '—'}
                    </td>
                    <td
                      style={{
                        paddingTop: 8,
                        paddingBottom: 8,
                        paddingRight: 12,
                        color: TEXT_MAIN,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.inputSummary ?? t.action ?? '—'}
                    </td>
                    <td style={{ paddingTop: 8, paddingBottom: 8, paddingRight: 12, color: TEXT_DIM }}>
                      {ms(t.durationMs)}
                    </td>
                    <td style={{ paddingTop: 8, paddingBottom: 8, paddingRight: 12, color: TEXT_DIM }}>
                      {usd(t.estimatedCostUsd)}
                    </td>
                    <td style={{ paddingTop: 8, paddingBottom: 8, color: TEXT_DIM }}>
                      {timeAgo(t.startedAt)}
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

// ── Safety view ───────────────────────────────────────────────────────────────

function SafetyView({ rules }: { rules: SafetyRule[] }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Shield size={14} color={ACCENT_GREEN} />
        <span style={{ fontSize: 12, color: ACCENT_GREEN, fontWeight: 600 }}>GUARDRAIL RULES</span>
        <span
          style={{
            marginLeft: 'auto',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            color: ACCENT_GREEN,
            border: `1px solid ${ACCENT_GREEN}`,
          }}
        >
          {rules.filter((r) => r.enabled).length} / {rules.length} active
        </span>
      </div>
      {rules.length === 0 ? (
        <p style={{ color: TEXT_DIM, fontSize: 12 }}>Loading rules…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 6,
                border: `1px solid ${BORDER}`,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: TEXT_DIM,
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 3,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {rule.id}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 600 }}>{rule.name}</span>
                  <SeverityBadge severity={rule.severity} />
                </div>
                <p style={{ fontSize: 11, color: TEXT_DIM, margin: 0 }}>{rule.description}</p>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 16,
                  borderRadius: 8,
                  background: rule.enabled ? ACCENT_GREEN : '#374151',
                  position: 'relative',
                  cursor: 'default',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: rule.enabled ? 14 : 2,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.15s',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Registry view ────────────────────────────────────────────────────────────

function RegistryView({ agents }: { agents: AgentDescriptor[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {agents.length} agents registered
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.35)' }}>
                {['Agent', 'Status', 'Capabilities', 'Actions', 'Invocations', 'Avg Latency', 'Last Used'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 9, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${BORDER}`, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px 14px', color: TEXT_DIM, textAlign: 'center' }}>No agents registered yet.</td>
                </tr>
              ) : agents.map(agent => (
                <tr key={agent.name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bot size={11} color={ACCENT_PURPLE} />
                      <span style={{ color: TEXT_MAIN, fontWeight: 500 }}>{agent.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StatusDot status={agent.status} />
                      <span style={{ fontSize: 10, color: agent.status === 'active' ? ACCENT_GREEN : agent.status === 'paused' ? '#fbbf24' : '#ef4444' }}>{agent.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {agent.capabilities.slice(0, 2).map(c => (
                        <span key={c} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: `1px solid ${BORDER}`, color: TEXT_DIM }}>{c}</span>
                      ))}
                      {agent.capabilities.length > 2 && (
                        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: `1px solid ${BORDER}`, color: TEXT_DIM }}>+{agent.capabilities.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {agent.actions.slice(0, 2).map(a => (
                        <span key={a} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: `1px solid ${BORDER}`, color: ACCENT_PURPLE }}>{a}</span>
                      ))}
                      {agent.actions.length > 2 && (
                        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: `1px solid ${BORDER}`, color: TEXT_DIM }}>+{agent.actions.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: TEXT_DIM, fontFamily: 'monospace' }}>{agent.invocationCount}</td>
                  <td style={{ padding: '10px 14px', color: TEXT_DIM, fontFamily: 'monospace' }}>{ms(agent.avgDurationMs)}</td>
                  <td style={{ padding: '10px 14px', color: TEXT_DIM }}>{timeAgo(agent.lastInvokedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tasks view ────────────────────────────────────────────────────────────────

function TasksView({ traces }: { traces: AgentTrace[] }) {
  const active = traces.filter(t => t.status === 'running').length;
  const success = traces.filter(t => t.status === 'success').length;
  const failed = traces.filter(t => t.status !== 'running' && t.status !== 'success').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="Active" value={active} sub="currently running" accent="#fbbf24" icon={CirclePlay} />
        <StatCard label="Succeeded" value={success} sub="completed tasks" accent={ACCENT_GREEN} icon={CircleCheck} />
        <StatCard label="Failed" value={failed} sub="error / timeout" accent="#ef4444" icon={AlertTriangle} />
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 12, color: ACCENT_GREEN, marginBottom: 12, fontWeight: 600 }}>TASK PIPELINE</div>
        {traces.length === 0 ? (
          <p style={{ color: TEXT_DIM, fontSize: 12 }}>No tasks yet — run a command to see execution.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {traces.map(t => (
              <div
                key={t.traceId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6,
                  border: `1px solid ${BORDER}`,
                  fontSize: 11,
                }}
              >
                <StatusDot status={t.status} />
                <span style={{ color: ACCENT_PURPLE, flex: '0 0 auto', fontFamily: 'monospace' }}>{t.agentName}</span>
                <span style={{ color: TEXT_MAIN, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.inputSummary ?? t.action ?? '—'}
                </span>
                <span style={{ color: TEXT_DIM, flex: '0 0 auto' }}>{ms(t.durationMs)}</span>
                <span style={{ color: TEXT_DIM, flex: '0 0 auto' }}>{timeAgo(t.startedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Workflows view ────────────────────────────────────────────────────────────

function WorkflowsView() {
  const [running, setRunning] = useState<string | null>(null);
  const [runs, setRuns] = useState<{ id: string; name: string; status: string; ts: string }[]>([]);
  const [wfError, setWfError] = useState<string | null>(null);

  const trigger = async (wf: (typeof WORKFLOW_TEMPLATES)[0]) => {
    if (running) return;
    setRunning(wf.id);
    setWfError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      await aiIntelligenceApi.queryOrchestrated(token, `Execute workflow: ${wf.name} — ${wf.desc}`, 'admin:ai-command-center');
      setRuns(prev => [{ id: wf.id, name: wf.name, status: 'completed', ts: new Date().toISOString() }, ...prev]);
    } catch (err) {
      setWfError(err instanceof Error ? err.message : 'Workflow trigger failed');
      setRuns(prev => [{ id: wf.id, name: wf.name, status: 'failed', ts: new Date().toISOString() }, ...prev]);
    } finally {
      setRunning(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {wfError && (
        <div style={{ padding: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={12} />
          {wfError}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {WORKFLOW_TEMPLATES.map(wf => (
          <div key={wf.id} style={{ background: CARD, borderRadius: 8, padding: 16, border: `1px solid ${wf.color}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, border: `1px solid ${wf.color}`, color: wf.color, fontFamily: 'monospace' }}>{wf.id}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_MAIN }}>{wf.name}</span>
            </div>
            <p style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 12, lineHeight: 1.5 }}>{wf.desc}</p>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
              {wf.steps.map((step, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: ACCENT_PURPLE, background: 'rgba(129,140,248,0.1)', padding: '2px 6px', borderRadius: 3 }}>
                    {step.replace('Agent', '')}
                  </span>
                  {i < wf.steps.length - 1 && <span style={{ color: TEXT_DIM, fontSize: 10 }}>→</span>}
                </span>
              ))}
            </div>
            <button
              onClick={() => void trigger(wf)}
              disabled={!!running}
              style={{
                width: '100%',
                padding: '7px',
                borderRadius: 6,
                background: running === wf.id ? 'rgba(255,255,255,0.05)' : `${wf.color}18`,
                border: `1px solid ${wf.color}40`,
                color: running ? TEXT_DIM : wf.color,
                fontSize: 10,
                cursor: running ? 'not-allowed' : 'pointer',
                fontFamily: 'monospace',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {running === wf.id ? <><Loader2 size={10} className="animate-spin" /> Running…</> : '▶ TRIGGER'}
            </button>
          </div>
        ))}
      </div>
      {runs.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: ACCENT_GREEN, marginBottom: 12, fontWeight: 600 }}>WORKFLOW RUNS ({runs.length})</div>
          {runs.map((run, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${run.status === 'completed' ? ACCENT_GREEN + '30' : '#ef444430'}`,
                marginBottom: 6,
                fontSize: 11,
              }}
            >
              <StatusDot status={run.status === 'completed' ? 'success' : 'error'} />
              <span style={{ color: TEXT_MAIN, flex: 1 }}>{run.name}</span>
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, color: run.status === 'completed' ? ACCENT_GREEN : '#ef4444', border: `1px solid ${run.status === 'completed' ? ACCENT_GREEN : '#ef4444'}` }}>
                {run.status.toUpperCase()}
              </span>
              <span style={{ color: TEXT_DIM }}>{timeAgo(run.ts)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Memory view ───────────────────────────────────────────────────────────────

function MemoryView({ overview }: { overview: CommandCenterOverview }) {
  const { memorySizes, agents } = overview;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { title: 'Short-Term Memory', color: ACCENT_PURPLE, count: memorySizes.shortTerm, desc: 'Per-session context. Holds recent task results, current working state, and interaction history. Cleared on session reset.' },
          { title: 'Long-Term Memory',  color: ACCENT_GREEN,  count: memorySizes.longTerm,  desc: 'Persistent learned facts. Promoted from short-term when patterns repeat. Stores buyer preferences, market signals, agent learnings.' },
        ].map(({ title, color, count, desc }) => (
          <div key={title} style={{ background: CARD, borderRadius: 8, padding: 16, border: `1px solid ${color}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Brain size={14} color={color} />
              <span style={{ fontSize: 12, fontWeight: 600, color }}>{title}</span>
              <span style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>{count}</span>
            </div>
            <p style={{ fontSize: 11, color: TEXT_DIM, lineHeight: 1.6, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 12, color: ACCENT_GREEN, marginBottom: 12, fontWeight: 600 }}>PER-AGENT ACTIVITY</div>
        {agents.length === 0 ? (
          <p style={{ color: TEXT_DIM, fontSize: 12 }}>No agents registered.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {agents.map(agent => (
              <div
                key={agent.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${BORDER}`,
                  fontSize: 11,
                }}
              >
                <Bot size={12} color={ACCENT_PURPLE} />
                <span style={{ color: TEXT_MAIN, flex: 1 }}>{agent.name}</span>
                <span style={{ fontSize: 10, color: TEXT_DIM }}>
                  {agent.invocationCount} invocations · last active {timeAgo(agent.lastInvokedAt)}
                </span>
                <StatusDot status={agent.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Events view ───────────────────────────────────────────────────────────────

function EventsView({ traces }: { traces: AgentTrace[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Event bus — {traces.length} events
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 12, color: ACCENT_GREEN, marginBottom: 12, fontWeight: 600 }}>LIVE EVENT FEED</div>
        {traces.length === 0 ? (
          <p style={{ color: TEXT_DIM, fontSize: 12 }}>No events yet. Run a command to generate activity.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {traces.map(t => (
              <div
                key={t.traceId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                  borderBottom: `1px solid ${BORDER}`,
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              >
                <span style={{ color: TEXT_DIM, flex: '0 0 80px' }}>{timeAgo(t.startedAt)}</span>
                <StatusDot status={t.status} />
                <span style={{ color: ACCENT_PURPLE, flex: '0 0 auto' }}>{t.agentName}</span>
                <span style={{ color: TEXT_DIM, flex: '0 0 auto' }}>.{t.action ?? t.matchedIntent ?? 'invoked'}</span>
                <span style={{ color: TEXT_MAIN, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.inputSummary ?? ''}
                </span>
                {t.durationMs != null && (
                  <span style={{ color: TEXT_DIM, flex: '0 0 auto' }}>{ms(t.durationMs)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Permissions view ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'ai_cc_role_config';

type RoleEntry = { label: string; color: string; agents: string[] | null; desc: string };
type RoleConfig = Record<string, RoleEntry>;

function buildDefaultRoleConfig(): RoleConfig {
  const cfg: RoleConfig = {};
  for (const r of STATIC_ROLES) {
    cfg[r.key] = { label: r.label, color: r.color, agents: r.agents, desc: r.desc };
  }
  return cfg;
}

function loadRoleConfig(): RoleConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<RoleConfig>;
      const defaults = buildDefaultRoleConfig();
      // Merge saved non-admin entries over defaults
      return { ...defaults, ...parsed, admin: defaults['admin'] };
    }
  } catch { /* ignore */ }
  return buildDefaultRoleConfig();
}

function PermissionsView({ agents }: { agents: AgentDescriptor[] }) {
  const agentNames = agents.length > 0 ? agents.map(a => a.name) : Object.keys(AGENT_PERMISSIONS);
  const [roleConfig, setRoleConfig] = useState<RoleConfig>(loadRoleConfig);
  const [saved, setSaved] = useState(false);

  function toggleRoleAgent(roleKey: string, agentName: string) {
    setRoleConfig(prev => {
      const current = prev[roleKey]?.agents ?? [];
      const updated = current.includes(agentName)
        ? current.filter(a => a !== agentName)
        : [...current, agentName];
      return { ...prev, [roleKey]: { ...prev[roleKey], agents: updated } };
    });
  }

  function handleSave() {
    const toSave: Partial<RoleConfig> = {};
    for (const [key, val] of Object.entries(roleConfig)) {
      if (key !== 'admin') toSave[key] = { ...val };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setRoleConfig(buildDefaultRoleConfig());
  }

  const configurableRoles = Object.entries(roleConfig).filter(([k]) => k !== 'admin');
  const adminEntry = roleConfig['admin'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Role access matrix */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: ACCENT_GREEN, fontWeight: 600 }}>ROLE AGENT ACCESS</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleReset}
              style={{ fontSize: 10, padding: '4px 12px', background: 'transparent', border: '1px solid #7f1d1d', color: '#f87171', borderRadius: 5, cursor: 'pointer' }}
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              style={{ fontSize: 10, padding: '4px 12px', background: saved ? `${ACCENT_GREEN}30` : '#15803d20', border: `1px solid ${saved ? ACCENT_GREEN : '#15803d'}`, color: saved ? TEXT_MAIN : ACCENT_GREEN, borderRadius: 5, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 10, color: TEXT_DIM, margin: '0 0 12px' }}>Configure which agents each role may invoke</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
          {configurableRoles.map(([roleKey, roleDef]) => (
            <div key={roleKey} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 6, padding: 12, border: `1px solid ${roleDef.color}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: roleDef.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: roleDef.color, fontWeight: 600 }}>{roleDef.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 9, color: TEXT_DIM }}>
                  {(roleDef.agents ?? []).length}/{agentNames.length}
                </span>
              </div>
              <p style={{ fontSize: 10, color: TEXT_DIM, margin: '0 0 8px', lineHeight: 1.5 }}>{roleDef.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {agentNames.map(name => {
                  const checked = (roleDef.agents ?? []).includes(name);
                  return (
                    <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 0' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRoleAgent(roleKey, name)}
                        style={{ accentColor: roleDef.color, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 9, color: checked ? TEXT_MAIN : TEXT_DIM }}>{name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Admin — non-configurable */}
          {adminEntry && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 6, padding: 12, border: `1px solid ${adminEntry.color}20`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: adminEntry.color }} />
              <span style={{ fontSize: 11, color: adminEntry.color, fontWeight: 600 }}>Administrator</span>
              <span style={{ fontSize: 10, color: TEXT_DIM, textAlign: 'center', lineHeight: 1.5 }}>Unrestricted access to all agents — not configurable</span>
              <span style={{ fontSize: 9, color: TEXT_DIM }}>∞ / {agentNames.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tool permissions matrix */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 12, color: ACCENT_GREEN, fontWeight: 600 }}>
          AGENT TOOL PERMISSIONS
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.35)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 9, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${BORDER}`, fontWeight: 500 }}>Agent</th>
                {PERM_COLS.map(c => (
                  <th key={c} style={{ textAlign: 'center', padding: '10px 10px', fontSize: 9, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${BORDER}`, fontWeight: 500 }}>
                    {c.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(AGENT_PERMISSIONS).map(([agentName, perms]) => (
                <tr key={agentName} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '9px 14px', color: TEXT_MAIN }}>{agentName}</td>
                  {PERM_COLS.map(col => {
                    const v = perms[col];
                    const color = v === 'read' ? ACCENT_PURPLE : v === 'write' ? '#fb923c' : v === true ? ACCENT_GREEN : '#374151';
                    const label = v === 'read' ? 'R' : v === 'write' ? 'W' : v === true ? '✓' : '—';
                    return (
                      <td key={col} style={{ textAlign: 'center', padding: '9px 10px' }}>
                        <span style={{ fontSize: 10, color, background: v !== false && v !== null ? `${color}15` : 'transparent', padding: '2px 6px', borderRadius: 3 }}>
                          {label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '8px 14px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 16 }}>
            {[['R', ACCENT_PURPLE, 'Read'], ['W', '#fb923c', 'Write'], ['✓', ACCENT_GREEN, 'Execute'], ['—', '#374151', 'Denied']].map(([l, c, d]) => (
              <span key={l} style={{ fontSize: 9, color: TEXT_DIM, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: c }}>{l}</span>{d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Command panel ─────────────────────────────────────────────────────────────

function CommandPanel() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const EXAMPLES = [
    'Show all active leads with hot temperature',
    'Which agents are currently paused?',
    'Summarise today\'s AI activity and costs',
    'List properties needing verification',
  ];

  const run = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const res = await aiIntelligenceApi.queryOrchestrated(token, trimmed, 'admin:ai-command-center');
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void run(input);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Input area */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 12, color: ACCENT_GREEN, marginBottom: 12, fontWeight: 600 }}>
          NATURAL LANGUAGE COMMAND
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a command or question… (Enter to send)"
            rows={3}
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              padding: '10px 12px',
              color: TEXT_MAIN,
              fontSize: 12,
              fontFamily: 'monospace',
              resize: 'none',
              outline: 'none',
            }}
          />
          <button
            onClick={() => void run(input)}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? '#1f2937' : ACCENT_GREEN,
              border: 'none',
              borderRadius: 6,
              padding: '0 16px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              color: '#030712',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
              alignSelf: 'stretch',
              transition: 'background 0.15s',
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {loading ? 'Running' : 'Run'}
          </button>
        </div>
        {/* Example chips */}
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setInput(ex); textareaRef.current?.focus(); }}
              style={{
                background: 'transparent',
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                color: TEXT_DIM,
                fontSize: 10,
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = ACCENT_GREEN;
                (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT_GREEN;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = TEXT_DIM;
                (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER;
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {error && (
        <div
          style={{
            padding: 12,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            color: '#ef4444',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
          {/* Meta */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: TEXT_DIM }}>
              Intent: <span style={{ color: ACCENT_PURPLE }}>{result.intent}</span>
            </span>
            <span style={{ fontSize: 10, color: TEXT_DIM }}>
              Confidence: <span style={{ color: ACCENT_GREEN }}>{pct(result.confidence)}</span>
            </span>
            <span style={{ fontSize: 10, color: TEXT_DIM }}>
              Duration: <span style={{ color: TEXT_MAIN }}>{ms(result.durationMs)}</span>
            </span>
            <span style={{ fontSize: 10, color: TEXT_DIM, marginLeft: 'auto', fontFamily: 'monospace' }}>
              {result.traceId.slice(0, 12)}…
            </span>
          </div>

          {/* Response body */}
          <ResponseRenderer response={result.response} />
        </div>
      )}
    </div>
  );
}

function ResponseRenderer({ response }: { response: OrchestratorResult['response'] }) {
  if (response.responseType === 'error') {
    return <p style={{ color: '#ef4444', fontSize: 12 }}>{response.text}</p>;
  }
  if (response.responseType === 'text') {
    return (
      <>
        {response.title && (
          <div style={{ fontSize: 12, color: ACCENT_GREEN, fontWeight: 600, marginBottom: 8 }}>{response.title}</div>
        )}
        <p style={{ fontSize: 12, color: TEXT_MAIN, lineHeight: 1.6, margin: 0 }}>{response.text}</p>
      </>
    );
  }
  if (response.responseType === 'list' && response.items) {
    return (
      <>
        {response.title && (
          <div style={{ fontSize: 12, color: ACCENT_GREEN, fontWeight: 600, marginBottom: 8 }}>{response.title}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {response.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: `1px solid ${BORDER}`,
                fontSize: 11,
              }}
            >
              <span style={{ color: TEXT_MAIN, flex: 1 }}>{item.label}</span>
              {item.sublabel && <span style={{ color: TEXT_DIM }}>{item.sublabel}</span>}
              {item.badge && (
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 3,
                    fontSize: 10,
                    color: item.badgeColor === 'green' ? ACCENT_GREEN : item.badgeColor === 'purple' ? ACCENT_PURPLE : TEXT_DIM,
                    border: `1px solid ${item.badgeColor === 'green' ? ACCENT_GREEN : item.badgeColor === 'purple' ? ACCENT_PURPLE : TEXT_DIM}`,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }
  if (response.responseType === 'summary' && response.summaryCards) {
    return (
      <>
        {response.title && (
          <div style={{ fontSize: 12, color: ACCENT_GREEN, fontWeight: 600, marginBottom: 8 }}>{response.title}</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {response.summaryCards.map((card, i) => (
            <div
              key={i}
              style={{
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
              }}
            >
              <div style={{ fontSize: 10, color: TEXT_DIM, marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: card.color ?? ACCENT_GREEN, fontFamily: 'monospace' }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }
  return <p style={{ color: TEXT_DIM, fontSize: 12 }}>Unknown response type.</p>;
}

// ── Main component ────────────────────────────────────────────────────────────

export function AiCommandCenter() {
  const [view, setView] = useState<View>('dashboard');
  const [overview, setOverview] = useState<CommandCenterOverview | null>(null);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [safetyRules, setSafetyRules] = useState<SafetyRule[]>([]);
  const [metrics, setMetrics] = useState<ObservabilityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const [ov, tr, sr, met] = await Promise.all([
        aiCommandCenterApi.getOverview(token),
        aiCommandCenterApi.getTraces(token, 50),
        aiCommandCenterApi.getSafetyRules(token),
        aiCommandCenterApi.getMetrics(token),
      ]);
      setOverview(ov);
      setTraces(tr);
      setSafetyRules(sr);
      setMetrics(met);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    intervalRef.current = setInterval(() => void load(true), 15_000);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  const handlePause = async (name: string) => {
    const token = await getAccessToken();
    if (!token) return;
    await aiCommandCenterApi.pauseAgent(token, name);
    void load(true);
  };

  const handleResume = async (name: string) => {
    const token = await getAccessToken();
    if (!token) return;
    await aiCommandCenterApi.resumeAgent(token, name);
    void load(true);
  };

  const TABS: { id: View; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard',     label: 'Dashboard',     icon: Activity  },
    { id: 'agents',        label: 'Agents',         icon: Bot       },
    { id: 'registry',      label: 'Registry',       icon: Database  },
    { id: 'tasks',         label: 'Tasks',           icon: Layers    },
    { id: 'workflows',     label: 'Workflows',       icon: GitBranch },
    { id: 'memory',        label: 'Memory',          icon: Brain     },
    { id: 'events',        label: 'Events',          icon: Radio     },
    { id: 'observability', label: 'Observability',   icon: Eye       },
    { id: 'safety',        label: 'Safety',          icon: Shield    },
    { id: 'permissions',   label: 'Permissions',     icon: Lock      },
    { id: 'command',       label: 'Command',         icon: Terminal  },
  ];

  return (
    <div
      style={{
        background: BG,
        minHeight: '100%',
        color: TEXT_MAIN,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontSize: 13,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${BORDER}`,
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Brain size={18} color={ACCENT_GREEN} />
        <span style={{ color: ACCENT_GREEN, fontWeight: 700, fontSize: 14 }}>AI COMMAND CENTER</span>
        <span style={{ color: TEXT_DIM, fontSize: 11 }}>// real-time intelligence dashboard</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {refreshing && <Loader2 size={13} color={TEXT_DIM} className="animate-spin" />}
          {overview && (
            <>
              <span style={{ fontSize: 10, color: TEXT_DIM }}>
                <span style={{ color: ACCENT_GREEN }}>{overview.health.activeAgents}</span>/{overview.health.totalAgents} agents
              </span>
              <StatusDot status="active" />
              <span style={{ fontSize: 10, color: ACCENT_GREEN }}>LIVE</span>
            </>
          )}
          <button
            onClick={() => void load(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
              color: TEXT_DIM,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
            }}
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          borderBottom: `1px solid ${BORDER}`,
          padding: '0 24px',
          display: 'flex',
          gap: 2,
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `2px solid ${ACCENT_GREEN}` : '2px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                color: active ? ACCENT_GREEN : TEXT_DIM,
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT_DIM, padding: 32, justifyContent: 'center' }}>
            <Loader2 size={18} className="animate-spin" />
            <span>Loading AI intelligence data…</span>
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: 16,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              color: '#ef4444',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={14} />
            {error}. Ensure you have company admin privileges.
          </div>
        )}

        {!loading && !error && view === 'dashboard' && overview && (
          <DashboardView overview={overview} />
        )}

        {!loading && !error && view === 'agents' && overview && (
          <AgentsView
            agents={overview.agents}
            onPause={handlePause}
            onResume={handleResume}
          />
        )}

        {!loading && !error && view === 'registry' && overview && (
          <RegistryView agents={overview.agents} />
        )}

        {!loading && !error && view === 'tasks' && (
          <TasksView traces={traces} />
        )}

        {!loading && !error && view === 'workflows' && (
          <WorkflowsView />
        )}

        {!loading && !error && view === 'memory' && overview && (
          <MemoryView overview={overview} />
        )}

        {!loading && !error && view === 'events' && (
          <EventsView traces={traces} />
        )}

        {!loading && !error && view === 'observability' && metrics && (
          <ObservabilityView metrics={metrics} traces={traces} />
        )}

        {!loading && !error && view === 'safety' && (
          <SafetyView rules={safetyRules} />
        )}

        {!loading && !error && view === 'permissions' && overview && (
          <PermissionsView agents={overview.agents} />
        )}

        {!loading && view === 'command' && (
          <CommandPanel />
        )}
      </div>
    </div>
  );
}
