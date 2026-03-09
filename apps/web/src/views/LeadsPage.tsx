'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, Phone, Mail, Flame, Thermometer, Snowflake, Leaf, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { leadsApi, type LeadRow, type CreateLeadPayload, LEAD_SOURCES } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const temperatureConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  hot: { label: 'Hot', color: 'bg-red-100 text-red-700 border-red-200', icon: <Flame className="h-3 w-3" /> },
  warm: { label: 'Warm', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Thermometer className="h-3 w-3" /> },
  cold: { label: 'Cold', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Snowflake className="h-3 w-3" /> },
  nurture: { label: 'Nurture', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Leaf className="h-3 w-3" /> },
};

const stageConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  qualified: { label: 'Qualified', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
  under_contract: { label: 'Under Contract', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  closed: { label: 'Closed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700 border-red-200' },
};

const typeLabels: Record<string, string> = {
  buyer: 'Buyer', seller: 'Seller', renter: 'Renter', investor: 'Investor',
};

const ALL_STAGES = ['new', 'contacted', 'qualified', 'active', 'under_contract', 'closed', 'lost'];
const PAGE_SIZE = 20;

function formatBudget(min?: string | null, max?: string | null, currency?: string | null) {
  const sym = currency ?? 'ZAR';
  const fmt = (n: number) => n >= 1_000_000 ? `${sym} ${(n / 1_000_000).toFixed(1)}M` : `${sym} ${(n / 1_000).toFixed(0)}K`;
  const minN = min ? parseFloat(min) : null;
  const maxN = max ? parseFloat(max) : null;
  if (minN && maxN) return `${fmt(minN)} – ${fmt(maxN)}`;
  if (maxN) return `Up to ${fmt(maxN)}`;
  if (minN) return `From ${fmt(minN)}`;
  return '—';
}

const EMPTY_FORM: CreateLeadPayload = { name: '', type: 'buyer', email: '', phone: '', source: '', temperature: 'warm', notes: '' };

export default function LeadsPage() {
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
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters */}
      <Card className="rounded-2xl border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads by name, email, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="all">All Types</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="renter">Renter</option>
                <option value="investor">Investor</option>
              </select>
            </div>
            <div className="relative">
              <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="all">All Temperatures</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="nurture">Nurture</option>
              </select>
            </div>
          </div>

          {/* Stage pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => setStageFilter('all')} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${stageFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-muted-foreground hover:bg-accent'}`}>
              All Stages
            </button>
            {ALL_STAGES.map((s) => (
              <button key={s} onClick={() => setStageFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${stageFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                {stageConfig[s].label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-border overflow-hidden">
        {error && <p className="px-4 py-3 text-sm text-red-600 border-b border-border">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-foreground">Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Temperature</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Stage</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Budget</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No leads match your filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} &middot; {total} leads
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg p-1.5 border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg p-1.5 border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

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

function LeadRow({ lead }: { lead: LeadRow }) {
  const temp = temperatureConfig[lead.temperature] ?? temperatureConfig.warm;
  const stage = stageConfig[lead.stage] ?? { label: lead.stage, color: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <tr className="hover:bg-accent/50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <Link href={`/app/leads/${lead.id}`} className="font-medium text-foreground hover:text-blue-600 transition-colors">
            {lead.name}
          </Link>
          <div className="flex items-center gap-3 mt-0.5">
            {lead.email && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />{lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />{lead.phone}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="capitalize text-sm text-muted-foreground">{typeLabels[lead.type] ?? lead.type}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground capitalize">{lead.source?.replace(/_/g, ' ') ?? '—'}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${temp.color}`}>
          {temp.icon}{temp.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stage.color}`}>
          {stage.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{formatBudget(lead.budget_min, lead.budget_max, lead.budget_currency)}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="rounded-lg p-1.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors" title="Call">
              <Phone className="h-4 w-4" />
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="rounded-lg p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Email">
              <Mail className="h-4 w-4" />
            </a>
          )}
          <Link href={`/app/leads/${lead.id}`} className="rounded-lg px-2.5 py-1 text-xs font-medium border border-border text-foreground hover:bg-accent transition-colors">
            View
          </Link>
        </div>
      </td>
    </tr>
  );
}
