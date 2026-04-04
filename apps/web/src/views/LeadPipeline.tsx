'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { leadsApi, type LeadRow, type LeadPipelineStage } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ── Stage config ────────────────────────────────────────────────────────────
const STAGES: Array<{ id: string; label: string; color: string }> = [
  { id: 'new',            label: 'NEW',            color: '#1A3C28' },
  { id: 'contacted',      label: 'CONTACTED',      color: '#1D4ED8' },
  { id: 'qualified',      label: 'QUALIFIED',      color: '#6D28D9' },
  { id: 'active',         label: 'ACTIVE',         color: '#065F46' },
  { id: 'under_contract', label: 'UNDER CONTRACT', color: '#C2410C' },
  { id: 'closed',         label: 'CLOSED',         color: '#059669' },
];

const tempBadge: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
  hot:     { label: 'Hot',     emoji: '🔥', bg: '#FFF1EE', color: '#C4562A' },
  warm:    { label: 'Warm',    emoji: '☀️', bg: '#FFFBEB', color: '#B45309' },
  cold:    { label: 'Cold',    emoji: '❄️', bg: '#EFF6FF', color: '#1D4ED8' },
  nurture: { label: 'Nurture', emoji: '🌱', bg: '#F0FDF4', color: '#15803D' },
};

const typeLabels: Record<string, string> = {
  buyer: 'Buyer', seller: 'Seller', renter: 'Renter', investor: 'Investor',
};

function formatValue(value: string | null | undefined) {
  const n = value ? parseFloat(value) : 0;
  if (!n) return null;
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${(n / 1_000).toFixed(0)}K`;
}

function formatBudget(min?: string | null, max?: string | null) {
  const low = formatValue(min);
  const high = formatValue(max);
  if (low && high) return `R ${low} – ${high}`;
  if (high) return `R ${high}`;
  if (low) return `R ${low}+`;
  return '—';
}

// ── Sub-components ──────────────────────────────────────────────────────────
function TempBadge({ temperature, small = false }: { temperature: string; small?: boolean }) {
  const cfg = tempBadge[temperature] ?? tempBadge.warm;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: small ? '1px 6px' : '2px 8px', fontSize: small ? 9 : 10, fontWeight: 700, fontFamily: "var(--font-mono)", whiteSpace: 'nowrap' }}>
      {cfg.emoji} {cfg.label.toUpperCase()}
    </span>
  );
}

function PipelineKanbanCard({ lead, isActive }: { lead: LeadRow; isActive?: boolean }) {
  const budget = formatBudget(lead.budget_min, lead.budget_max);
  return (
    <Link href={`/app/leads/${lead.id}`} style={{ textDecoration: 'none', display: 'block', margin: 10 }}>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderLeft: isActive ? '3px solid #C4562A' : '1px solid #E5E7EB', borderRadius: 8, padding: 12, cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: '#1F2937', marginBottom: 4, lineHeight: 1.3 }}>{lead.name}</div>
        <div style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, fontSize: 12, color: '#C4562A' }}>{budget}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <TempBadge temperature={lead.temperature} small />
          <span style={{ fontSize: 10, color: '#6B7280' }}>{typeLabels[lead.type] ?? lead.type}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function LeadPipeline({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [stages, setStages] = useState<LeadPipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pipelineView, setPipelineView] = useState<'kanban' | 'list'>('kanban');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    leadsApi.getPipeline(token)
      .then((res) => setStages(res.stages))
      .catch(() => setError('Failed to load pipeline'))
      .finally(() => setLoading(false));
  }, []);

  const stageMap = new Map(stages.map((s) => [s.stage, s]));

  const totalPipeline = stages.reduce((sum, s) => sum + (parseFloat(String(s.totalValue)) || 0), 0);
  const formattedTotal = totalPipeline >= 1_000_000
    ? `R${(totalPipeline / 1_000_000).toFixed(1)}M`
    : `R${(totalPipeline / 1_000).toFixed(0)}K`;

  // Flattened + filtered leads for list view
  const allLeads: Array<{ lead: LeadRow; stage: string }> = STAGES.flatMap((stg) =>
    (stageMap.get(stg.id)?.leads ?? [])
      .filter((l) => typeFilter === 'all' || l.type === typeFilter)
      .map((lead) => ({ lead, stage: stg.label }))
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 192 }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9CA3AF' }} />
      </div>
    );
  }

  if (error) {
    return <p style={{ fontSize: 13, color: '#DC2626', textAlign: 'center', padding: '32px 0' }}>{error}</p>;
  }

  return (
    <div>
      {/* ── Pipeline header bar (always visible) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {/* Title + total */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!isEmbedded && (
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', margin: 0 }}>Pipeline Board</h1>
          )}
          {isEmbedded && (
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1F2937' }}>Pipeline Board</span>
          )}
          {' '}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
            {formattedTotal} total
          </span>
        </div>

        {/* Filter by type */}
        <button
          onClick={() => setTypeFilter((p) => p === 'all' ? 'buyer' : p === 'buyer' ? 'seller' : p === 'seller' ? 'investor' : 'all')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, color: typeFilter === 'all' ? '#374151' : '#C4562A', cursor: 'pointer' }}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          {typeFilter === 'all' ? 'Filter by type' : typeLabels[typeFilter] ?? typeFilter}
        </button>

        {/* Kanban / List view toggle */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
          <button
            onClick={() => setPipelineView('kanban')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: pipelineView === 'kanban' ? '#1A3C28' : '#fff', color: pipelineView === 'kanban' ? '#F2E8D5' : '#374151', transition: 'all 0.15s' }}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            Kanban
          </button>
          <button
            onClick={() => setPipelineView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', borderLeft: '1px solid #E5E7EB', background: pipelineView === 'list' ? '#1A3C28' : '#fff', color: pipelineView === 'list' ? '#F2E8D5' : '#374151', transition: 'all 0.15s' }}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            List
          </button>
        </div>
      </div>

      {/* ── Kanban board ── */}
      {pipelineView === 'kanban' && (
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 14, minWidth: `${STAGES.length * 220}px` }}>
            {STAGES.map((stage) => {
              const stageData = stageMap.get(stage.id);
              const leads = (stageData?.leads ?? []).filter((l) => typeFilter === 'all' || l.type === typeFilter);
              const isActiveStage = stage.id === 'active';
              return (
                <div key={stage.id} style={{ background: 'rgba(26,60,40,0.04)', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', minWidth: 180 }}>
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: stage.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {stage.label}
                    </span>
                    <span style={{ background: stage.color, color: '#F2E8D5', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                      {leads.length}
                    </span>
                  </div>
                  {/* Cards */}
                  <div style={{ minHeight: 120 }}>
                    {leads.map((lead) => (
                      <PipelineKanbanCard key={lead.id} lead={lead} isActive={isActiveStage} />
                    ))}
                    {leads.length === 0 && (
                      <div style={{ margin: 10, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#D1D5DB', border: '2px dashed #E5E7EB', borderRadius: 8 }}>
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── List view ── */}
      {pipelineView === 'list' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAF8' }}>
                  {['Lead', 'Stage', 'Temp', 'Budget', 'Last Activity'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "var(--font-mono)", whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allLeads.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No leads in pipeline</td></tr>
                ) : (
                  allLeads.map(({ lead, stage }) => {
                    const budget = formatBudget(lead.budget_min, lead.budget_max);
                    const lastActivity = lead.last_contact_at
                      ? new Date(lead.last_contact_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
                      : '—';
                    return (
                      <tr key={lead.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <Link href={`/app/leads/${lead.id}`} style={{ fontWeight: 600, fontSize: 13, color: '#1F2937', textDecoration: 'none' }}>{lead.name}</Link>
                          <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: "var(--font-mono)", marginTop: 2 }}>{typeLabels[lead.type] ?? lead.type}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: '#F2E8D5', background: STAGES.find((s) => s.id === lead.stage)?.color ?? '#6B7280', borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase' }}>
                            {stage}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}><TempBadge temperature={lead.temperature} /></td>
                        <td style={{ padding: '12px 16px', fontFamily: "var(--font-fraunces)", fontWeight: 700, fontSize: 13, color: '#C4562A', whiteSpace: 'nowrap' }}>{budget}</td>
                        <td style={{ padding: '12px 16px', fontFamily: "var(--font-mono)", fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{lastActivity}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
