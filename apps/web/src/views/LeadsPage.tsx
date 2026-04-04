'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { leadsApi, type LeadRow, type CreateLeadPayload, LEAD_SOURCES } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { Button } from '@/components/ui/button';

const typeLabels: Record<string, string> = {
  buyer: 'Buyer', seller: 'Seller', renter: 'Renter', investor: 'Investor',
};

const PAGE_SIZE = 20;

function formatBudget(min?: string | null, max?: string | null, currency?: string | null) {
  const sym = (!currency || currency === 'ZAR') ? 'R' : currency;
  const compact = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${(n / 1_000).toFixed(0)}K`;
  const minN = min ? parseFloat(min) : null;
  const maxN = max ? parseFloat(max) : null;
  if (minN && maxN) return `${sym} ${compact(minN)} – ${compact(maxN)}`;
  if (maxN) return `Up to ${sym} ${compact(maxN)}`;
  if (minN) return `${sym} ${compact(minN)}+`;
  return '—';
}

const EMPTY_FORM: CreateLeadPayload = { name: '', type: 'buyer', email: '', phone: '', source: '', temperature: 'warm', notes: '' };

export default function LeadsPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateLeadPayload>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tempFilter, setTempFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLeads = useCallback(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError('');
    leadsApi.list(token, {
      search: debouncedSearch || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      temperature: tempFilter !== 'all' ? tempFilter : undefined,
      stage: stageFilter !== 'all' ? stageFilter : undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    })
      .then((res) => { setLeads(res.data); setTotal(res.total); })
      .catch(() => setError('Failed to load leads'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, typeFilter, tempFilter, stageFilter, page]);

  // reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter, tempFilter, stageFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleCreate() {
    const token = getAccessToken();
    if (!token) return;
    setCreating(true);
    setCreateError('');
    leadsApi.create(token, { ...form, name: form.name.trim() })
      .then(() => {
        setShowCreate(false);
        setForm(EMPTY_FORM);
        fetchLeads();
      })
      .catch(() => setCreateError('Failed to create lead. Please try again.'))
      .finally(() => setCreating(false));
  }

  return (
    <div className="space-y-4">
      {/* Header — hidden when rendered inside LeadManagementHub */}
      {!isEmbedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? 'Loading…' : `${total} lead${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setCreateError(''); setShowCreate(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      )}

      {/* ── Toolbar (mockup-style) ── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search leads by name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px 8px 32px', fontSize: 12, color: '#1F2937', outline: 'none' }}
          />
        </div>
        {/* Stage filter */}
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
          onClick={() => setStageFilter(stageFilter === 'all' ? 'new' : 'all')}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          Stage
        </button>
        {/* Temperature filter */}
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
          onClick={() => setTempFilter(tempFilter === 'all' ? 'hot' : 'all')}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>
          Temperature
        </button>
        {/* Type filter */}
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
          onClick={() => setTypeFilter(typeFilter === 'all' ? 'buyer' : 'all')}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          Date Range
        </button>
      </div>

      {/* ── Card with header + view toggle ── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>
            All Leads{' '}
            <span style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', fontFamily: "var(--font-mono)" }}>({loading ? '…' : total})</span>
          </span>
          {/* View toggle */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: viewMode === 'list' ? '#1A3C28' : '#fff', color: viewMode === 'list' ? '#F2E8D5' : '#374151', transition: 'all 0.15s' }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', borderLeft: '1px solid #E5E7EB', background: viewMode === 'grid' ? '#1A3C28' : '#fff', color: viewMode === 'grid' ? '#F2E8D5' : '#374151', transition: 'all 0.15s' }}
            >
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              Grid
            </button>
          </div>
        </div>

        {error && <p style={{ padding: '10px 16px', fontSize: 12, color: '#DC2626', borderBottom: '1px solid #FEE2E2' }}>{error}</p>}

        {/* ── List view ── */}
        {viewMode === 'list' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAF8' }}>
                  {['Name', 'Type', 'Temp', 'Stage', 'Budget', 'Last Contact'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.07em', fontFamily: "var(--font-mono)", whiteSpace: 'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center' }}>
                    <Loader2 className="h-5 w-5 animate-spin" style={{ margin: '0 auto', color: '#9CA3AF' }} />
                  </td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>No leads match your filters.</td></tr>
                ) : (
                  leads.map((lead) => <LeadTableRow key={lead.id} lead={lead} />)
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Grid view ── */}
        {viewMode === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, padding: 20 }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0' }}>
                <Loader2 className="h-5 w-5 animate-spin" style={{ margin: '0 auto', color: '#9CA3AF' }} />
              </div>
            ) : leads.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: '#6B7280', fontSize: 13 }}>No leads match your filters.</div>
            ) : (
              leads.map((lead) => <LeadGridCard key={lead.id} lead={lead} />)
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: 11, color: '#6B7280' }}>Page {page} of {totalPages} &middot; {total} leads</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ borderRadius: 8, padding: '5px 8px', border: '1px solid #E5E7EB', color: '#6B7280', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ borderRadius: 8, padding: '5px 8px', border: '1px solid #E5E7EB', color: '#6B7280', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">New Lead</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {createError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{createError}</p>}

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Full name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jane Dlamini"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type + Temperature */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Type <span className="text-red-500">*</span></label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="renter">Renter</option>
                    <option value="investor">Investor</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Temperature</label>
                  <select value={form.temperature ?? 'warm'} onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                    <option value="nurture">Nurture</option>
                  </select>
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                  <input type="email" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
                  <input type="tel" value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+27 82 000 0000" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Source</label>
                <select value={form.source ?? ''} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select source…</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Notes</label>
                <textarea value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Initial notes about this lead…" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                disabled={!form.name.trim() || creating}
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create Lead'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helper sub-components (mockup-faithful)
// ─────────────────────────────────────────────────────────────────

const typeBadgeStyle: Record<string, { bg: string; color: string }> = {
  buyer:    { bg: '#EFF6FF', color: '#1D4ED8' },
  investor: { bg: '#F5F3FF', color: '#6D28D9' },
  seller:   { bg: '#F0FDF4', color: '#15803D' },
  renter:   { bg: '#FFFBEB', color: '#B45309' },
};

const tempBadge: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
  hot:     { label: 'Hot',     emoji: '🔥', bg: '#FFF1EE', color: '#C4562A' },
  warm:    { label: 'Warm',    emoji: '☀️', bg: '#FFFBEB', color: '#B45309' },
  cold:    { label: 'Cold',    emoji: '❄️', bg: '#EFF6FF', color: '#1D4ED8' },
  nurture: { label: 'Nurture', emoji: '🌱', bg: '#F0FDF4', color: '#15803D' },
};

const stageBadge: Record<string, { label: string; bg: string; color: string }> = {
  new:            { label: 'New',            bg: '#F3F4F6', color: '#6B7280' },
  contacted:      { label: 'Contacted',      bg: '#EFF6FF', color: '#1D4ED8' },
  qualified:      { label: 'Qualified',      bg: '#EEF2FF', color: '#4338CA' },
  active:         { label: 'Active',         bg: '#F0FDF4', color: '#15803D' },
  under_contract: { label: 'Under Contract', bg: '#FFF7ED', color: '#C2410C' },
  closed:         { label: 'Closed',         bg: '#ECFDF5', color: '#065F46' },
  lost:           { label: 'Lost',           bg: '#FEF2F2', color: '#B91C1C' },
};

function TempBadge({ temperature }: { temperature: string }) {
  const cfg = tempBadge[temperature] ?? tempBadge.warm;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", whiteSpace: 'nowrap' }}>
      {cfg.emoji} {cfg.label.toUpperCase()}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cfg = typeBadgeStyle[type] ?? { bg: '#F3F4F6', color: '#374151' };
  return (
    <span style={{ display: 'inline-block', background: cfg.bg, color: cfg.color, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {typeLabels[type] ?? type}
    </span>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const cfg = stageBadge[stage] ?? stageBadge.new;
  return (
    <span style={{ display: 'inline-block', background: cfg.bg, color: cfg.color, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

function LeadTableRow({ lead }: { lead: LeadRow }) {
  const budget = formatBudget(lead.budget_min, lead.budget_max, lead.budget_currency);
  const lastContact = lead.last_contact_at
    ? new Date(lead.last_contact_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
      <td style={{ padding: '12px 16px' }}>
        <Link href={`/app/leads/${lead.id}`} style={{ fontWeight: 600, fontSize: 13, color: '#1F2937', textDecoration: 'none' }}>
          {lead.name}
        </Link>
        {lead.email && (
          <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: "var(--font-mono)", marginTop: 2 }}>{lead.email}</div>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}><TypeBadge type={lead.type} /></td>
      <td style={{ padding: '12px 16px' }}><TempBadge temperature={lead.temperature} /></td>
      <td style={{ padding: '12px 16px' }}><StageBadge stage={lead.stage} /></td>
      <td style={{ padding: '12px 16px', fontFamily: "var(--font-fraunces)", fontWeight: 700, fontSize: 13, color: '#C4562A', whiteSpace: 'nowrap' }}>{budget}</td>
      <td style={{ padding: '12px 16px', fontFamily: "var(--font-mono)", fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{lastContact}</td>
    </tr>
  );
}

function LeadGridCard({ lead }: { lead: LeadRow }) {
  const budget = formatBudget(lead.budget_min, lead.budget_max, lead.budget_currency);
  const lastContact = lead.last_contact_at
    ? new Date(lead.last_contact_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const initials = lead.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const typeColors = typeBadgeStyle[lead.type] ?? { bg: '#F3F4F6', color: '#374151' };

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top: avatar + name + temp badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: typeColors.bg, color: typeColors.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/app/leads/${lead.id}`} style={{ fontWeight: 700, fontSize: 13, color: '#1F2937', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lead.name}
          </Link>
          {lead.email && (
            <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: "var(--font-mono)", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.email}</div>
          )}
        </div>
        <TempBadge temperature={lead.temperature} />
      </div>
      {/* Badges row */}
      <div style={{ display: 'flex', gap: 6 }}>
        <TypeBadge type={lead.type} />
        <StageBadge stage={lead.stage} />
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: 0 }} />
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "var(--font-fraunces)", fontWeight: 700, fontSize: 14, color: '#C4562A' }}>{budget}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: '#9CA3AF' }}>last contact {lastContact}</span>
      </div>
    </div>
  );
}
