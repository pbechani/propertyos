'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Search, FileText,
  Plus, RefreshCw, TrendingUp, X,
} from 'lucide-react';
import { salesApi, agentSalesApi, adminSalesApi, propertiesApi, type Sale, type PropertyListing } from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth-session';
import { STAGE_NAMES } from '@/lib/constants';

// ── Brand tokens (mirrors My Listings) ───────────────────────────────────────
const C = {
  forest:      '#1A3C28',
  forestLight: '#4A7C5A',
  parchment:   '#F2E8D5',
  amber:       '#B89040',
  terracotta:  '#C4562A',
  egreen:      '#00E87A',
  muted:       '#E8F0EC',
  border:      'rgba(26,60,40,0.12)',
  textMuted:   '#6B8F7A',
};

// Stages that are document-heavy — "Awaiting Docs" computed filter
const DOC_STAGES = new Set([6, 8, 9, 10, 11]);

type TabKey = 'all' | 'active' | 'awaiting_docs' | 'completed' | 'disputed' | 'cancelled';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',           label: 'All Sales' },
  { key: 'active',        label: 'Active' },
  { key: 'awaiting_docs', label: 'Awaiting Docs' },
  { key: 'completed',     label: 'Completed' },
  { key: 'disputed',      label: 'Disputed' },
  { key: 'cancelled',     label: 'Cancelled' },
];

const statusStyle: Record<string, { accent: string; bg: string; color: string }> = {
  active:    { accent: C.egreen,     bg: 'rgba(0,232,122,0.12)',   color: '#1A5C34' },
  completed: { accent: '#A3B89A',    bg: 'rgba(26,60,40,0.08)',    color: C.forest },
  disputed:  { accent: C.terracotta, bg: 'rgba(196,86,42,0.12)',   color: C.terracotta },
  cancelled: { accent: '#D1D5DB',    bg: 'rgba(107,143,122,0.15)', color: C.textMuted },
};

export default function SalesDashboard() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // ── Initiate Sale modal ──────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalListings, setModalListings] = useState<PropertyListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [buyerId, setBuyerId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [submittingInitiate, setSubmittingInitiate] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);

  const token = getAccessToken();
  const user = getStoredUser();
  const role = user?.role?.toLowerCase() ?? '';

  useEffect(() => {
    if (!token) { router.push('/login?next=/app/sales'); return; }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: Sale[];
        if (role === 'admin') {
          data = await adminSalesApi.getSales(token);
        } else if (role === 'agent') {
          data = await agentSalesApi.getSales(token);
        } else {
          data = await salesApi.getMySales(token);
        }
        setSales(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load sales');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, role, router]);

  const openInitiateModal = async () => {
    if (!token) { router.push('/login?next=/app/sales'); return; }
    setShowModal(true);
    setInitiateError(null);
    setSelectedPropertyId('');
    setAgreedPrice('');
    setCurrency('ZAR');
    setBuyerId('');
    setDepositAmount('');
    setLoadingListings(true);
    try {
      let listings: PropertyListing[];
      if (role === 'agent') {
        const res = await propertiesApi.getMyListings(token, 'active');
        listings = res.data;
      } else {
        const res = await propertiesApi.getOwnerListings(token, 'active');
        listings = res.data;
      }
      setModalListings(listings);
    } catch {
      setModalListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  const handleInitiateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPropertyId || !agreedPrice) {
      setInitiateError('Please select a property and enter an agreed price.');
      return;
    }
    const currentUser = getStoredUser();
    if (!currentUser?.id) { setInitiateError('Session expired — please log in again.'); return; }
    setSubmittingInitiate(true);
    setInitiateError(null);
    try {
      const sale = await salesApi.create(token, {
        propertyId: selectedPropertyId,
        sellerId: currentUser.id,
        buyerId: buyerId.trim() || undefined,
        agreedPrice: Number(agreedPrice),
        currency,
        ...(depositAmount ? { depositAmount: Number(depositAmount) } : {}),
      });
      setShowModal(false);
      setSales(prev => [sale, ...prev]);
      router.push(`/workspace/${sale.id}`);
    } catch (err) {
      setInitiateError(err instanceof Error ? err.message : 'Failed to initiate sale.');
    } finally {
      setSubmittingInitiate(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const tabCounts: Record<TabKey, number> = {
    all:           sales.length,
    active:        sales.filter(s => s.status === 'active').length,
    awaiting_docs: sales.filter(s => s.status === 'active' && DOC_STAGES.has(s.currentStage)).length,
    completed:     sales.filter(s => s.status === 'completed').length,
    disputed:      sales.filter(s => s.status === 'disputed').length,
    cancelled:     sales.filter(s => s.status === 'cancelled').length,
  };

  const activeSales   = sales.filter(s => s.status === 'active');
  const pipelineValue = activeSales.reduce((sum, s) => sum + s.purchasePrice, 0);
  const avgStage      = activeSales.length
    ? Math.round(activeSales.reduce((sum, s) => sum + s.currentStage, 0) / activeSales.length)
    : 0;

  const awaitingDocsSales = sales.filter(s => s.status === 'active' && DOC_STAGES.has(s.currentStage));
  const deedsOfficeSales  = sales.filter(s => s.status === 'active' && s.currentStage === 11);

  const alerts: { id: string; text: string; icon: 'doc' | 'alert' }[] = [
    ...(awaitingDocsSales.length > 0 ? [{
      id: 'awaiting_docs',
      text: `${awaitingDocsSales.length} sale${awaitingDocsSales.length > 1 ? 's' : ''} awaiting compliance or verification documents`,
      icon: 'doc' as const,
    }] : []),
    ...(deedsOfficeSales.length > 0 ? [{
      id: 'deeds_office',
      text: `${deedsOfficeSales.length} sale${deedsOfficeSales.length > 1 ? 's' : ''} at Deeds Office registration — confirm registration date`,
      icon: 'alert' as const,
    }] : []),
  ].filter(a => !dismissedAlerts.has(a.id));

  const filtered = sales.filter((s) => {
    const addr = [s.property?.addressLine1, s.property?.city].filter(Boolean).join(', ').toLowerCase();
    const buyerName = s.buyer ? `${s.buyer.firstName} ${s.buyer.lastName}`.toLowerCase() : '';
    const matchesSearch = !search || addr.includes(search.toLowerCase()) || buyerName.includes(search.toLowerCase());
    let matchesTab: boolean;
    if (activeTab === 'all')                matchesTab = true;
    else if (activeTab === 'awaiting_docs') matchesTab = s.status === 'active' && DOC_STAGES.has(s.currentStage);
    else                                    matchesTab = s.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const defaultCurrency = sales[0]?.currency ?? 'ZAR';
  const currencySymbol = (c: string) =>
    ({ ZAR: 'R', USD: '$', ZWL: 'Z$', BWP: 'P', KES: 'KSh', GBP: '£' } as Record<string, string>)[c] ?? c;

  return (
    <>
      <div className="min-h-screen" style={{ background: C.muted }}>

        {/* ── Forest hero header ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden" style={{ background: C.forest }}>
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full"
            style={{ background: C.terracotta, opacity: 0.07 }} />
          <div className="pointer-events-none absolute -bottom-8 left-1/3 w-48 h-48 rounded-full"
            style={{ background: C.egreen, opacity: 0.04 }} />

          <div className="relative z-10 px-6 pt-6 pb-0">
            {/* Eyebrow */}
            <p className="mb-2 uppercase"
              style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: C.terracotta, letterSpacing: '0.12em' }}>
              Agent Cockpit · Sales Pipeline
            </p>

            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5">
              <div>
                <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 28, fontWeight: 700, color: C.parchment, lineHeight: 1.15 }}>
                  Sales Pipeline
                </h1>
                <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
                  {tabCounts.active} active · {defaultCurrency}{' '}
                  {pipelineValue.toLocaleString()} in progress · 14-stage legal workflow
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 pb-1">
                <button
                  onClick={() => router.refresh()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ border: '1px solid rgba(242,232,213,0.2)', color: C.parchment, background: 'transparent' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
                <button
                  onClick={openInitiateModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: C.terracotta, color: '#fff' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Initiate Sale
                </button>
              </div>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pb-5">
              {([
                { label: 'Active Sales',   value: String(tabCounts.active),                        valueColor: C.egreen,      useFraunces: false },
                { label: 'Pipeline Value', value: `${defaultCurrency} ${pipelineValue.toLocaleString()}`, valueColor: C.parchment, useFraunces: true  },
                { label: 'Completed',      value: String(tabCounts.completed),                     valueColor: '#A3D6B0',      useFraunces: false },
                { label: 'Avg Stage',      value: `${avgStage} / 14`,                              valueColor: C.amber,        useFraunces: false },
                { label: 'Disputes',       value: String(tabCounts.disputed),                      valueColor: tabCounts.disputed > 0 ? '#F87171' : C.textMuted, useFraunces: false },
              ] as const).map((kpi) => (
                <div key={kpi.label} className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(242,232,213,0.1)' }}>
                  <div className="text-xs mb-1.5" style={{ color: C.textMuted, fontFamily: 'var(--font-ibm-plex-mono)' }}>
                    {kpi.label}
                  </div>
                  <div className="font-bold leading-none"
                    style={{ color: kpi.valueColor, fontSize: kpi.useFraunces ? 16 : 22, fontFamily: kpi.useFraunces ? 'var(--font-fraunces)' : undefined }}>
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Status tab bar */}
            <div className="flex items-end overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap shrink-0 transition-colors"
                    style={{
                      color: isActive ? C.parchment : C.textMuted,
                      borderBottom: isActive ? `2px solid ${C.terracotta}` : '2px solid transparent',
                      fontWeight: isActive ? 600 : 400,
                      background: 'transparent',
                    }}
                  >
                    {tab.label}
                    <span className="rounded-full px-1.5 py-0.5 text-xs"
                      style={{
                        background: isActive ? C.terracotta : 'rgba(255,255,255,0.1)',
                        color: isActive ? '#fff' : C.textMuted,
                        fontFamily: 'var(--font-ibm-plex-mono)',
                      }}>
                      {tabCounts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Smart Pipeline Alerts ───────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="border-b" style={{ background: '#fff', borderColor: C.border }}>
            <div className="px-6 py-2.5 flex flex-col sm:flex-row gap-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-2 flex-1 min-w-0">
                  {alert.icon === 'doc'
                    ? <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: C.amber }} />
                    : <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: C.terracotta }} />}
                  <span className="text-xs truncate" style={{ color: '#374151' }}>{alert.text}</span>
                  <button
                    onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
                    className="ml-auto shrink-0 p-0.5 rounded"
                    style={{ color: '#9CA3AF' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
            <input
              type="text"
              placeholder="Search by address or buyer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none"
              style={{ border: `1.5px solid ${C.border}`, background: '#fff', color: '#111827', fontFamily: 'var(--font-jakarta)' }}
            />
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="px-6 pb-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-5 h-5 animate-spin mr-3" style={{ color: C.textMuted }} />
              <span className="text-sm" style={{ color: C.textMuted }}>Loading sales…</span>
            </div>
          ) : error ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
              <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: C.terracotta }} />
              <p className="font-medium text-gray-700">{error}</p>
              <button
                onClick={() => router.refresh()}
                className="mt-4 px-4 py-2 rounded-xl text-sm"
                style={{ border: `1.5px solid ${C.border}`, color: C.forest }}
              >
                Try Again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: C.muted }}>
                <TrendingUp className="w-6 h-6" style={{ color: C.textMuted }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}>
                {sales.length === 0 ? 'No Sales Yet' : 'No Results Found'}
              </h3>
              <p className="text-sm" style={{ color: C.textMuted }}>
                {sales.length === 0
                  ? 'When you initiate a property sale, it will appear here.'
                  : 'Try adjusting your search or filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((sale) => {
                const ref         = `TXN-${sale.id.slice(-6).toUpperCase()}`;
                const address     = [sale.property?.addressLine1, sale.property?.city].filter(Boolean).join(', ');
                const listingName = sale.property?.title || address || 'Property Sale';
                const buyerName   = sale.buyer ? `${sale.buyer.firstName} ${sale.buyer.lastName}` : 'N/A';
                const stageName   = STAGE_NAMES[sale.currentStage] ?? `Stage ${sale.currentStage}`;
                const status      = sale.status as string;
                const cardStyle   = statusStyle[status] ?? statusStyle.cancelled;
                const stagePct    = Math.min((sale.currentStage / 14) * 100, 100);
                const barColor    = status === 'disputed' ? C.terracotta : C.egreen;
                const sym         = currencySymbol(sale.currency);

                return (
                  <div
                    key={sale.id}
                    onClick={() => router.push(`/workspace/${sale.id}`)}
                    className="rounded-2xl overflow-hidden cursor-pointer transition-shadow hover:shadow-md flex"
                    style={{ background: '#fff', border: `1px solid ${C.border}` }}
                  >
                    {/* Left accent bar */}
                    <div className="w-1 shrink-0" style={{ background: cardStyle.accent }} />

                    <div className="flex-1 p-4 min-w-0">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate"
                              style={{ fontFamily: 'var(--font-fraunces)', color: C.forest, fontSize: 15 }}>
                              {listingName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: 'rgba(26,60,40,0.07)', color: C.textMuted, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10 }}>
                              {ref}
                            </span>
                          </div>
                          {address && <p className="text-xs mt-0.5 truncate" style={{ color: C.textMuted }}>{address}</p>}
                          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                            Buyer: <span style={{ color: '#111827', fontWeight: 500 }}>{buyerName}</span>
                            {sale.seller && (
                              <> · Seller: <span style={{ color: '#111827', fontWeight: 500 }}>
                                {sale.seller.firstName} {sale.seller.lastName}
                              </span></>
                            )}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color: C.forest }}>
                            {sym}{sale.purchasePrice.toLocaleString()}
                          </div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: cardStyle.bg, color: cardStyle.color, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10 }}>
                            {status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Stage progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs" style={{ color: C.textMuted, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10 }}>
                            Stage {sale.currentStage} / 14
                          </span>
                          <span className="text-xs truncate max-w-[60%] text-right" style={{ color: '#374151', fontSize: 11 }}>
                            {stageName}
                          </span>
                        </div>
                        <div className="rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(26,60,40,0.1)' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${stagePct}%`, background: `linear-gradient(90deg, ${barColor}BB, ${barColor})` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Initiate Sale Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ background: '#fff' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ background: C.forest }}>
              <div>
                <p className="uppercase mb-0.5"
                  style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: C.terracotta, letterSpacing: '0.12em' }}>
                  Sales Pipeline
                </p>
                <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color: C.parchment }}>
                  Initiate a Sale
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg"
                style={{ color: C.parchment, background: 'rgba(255,255,255,0.1)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleInitiateSale} className="p-5 space-y-4">
              {/* Property */}
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase"
                  style={{ color: C.forest, fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.08em' }}>
                  Property *
                </label>
                {loadingListings ? (
                  <div className="flex items-center gap-2 text-sm py-2" style={{ color: C.textMuted }}>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading your listings…
                  </div>
                ) : modalListings.length === 0 ? (
                  <p className="text-sm rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(184,144,64,0.08)', color: C.amber, border: '1px solid rgba(184,144,64,0.2)' }}>
                    No active listings found. Create a listing first.
                  </p>
                ) : (
                  <select
                    value={selectedPropertyId}
                    onChange={e => {
                      setSelectedPropertyId(e.target.value);
                      const prop = modalListings.find(p => p.id === e.target.value);
                      if (prop) { setAgreedPrice(prop.price); setCurrency(prop.currency); }
                    }}
                    required
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ border: `1.5px solid ${C.border}`, color: '#111827' }}
                  >
                    <option value="">— Select a property —</option>
                    {modalListings.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title}{p.location?.city ? ` · ${p.location.city}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Price + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase"
                    style={{ color: C.forest, fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.08em' }}>
                    Agreed Price *
                  </label>
                  <input
                    type="number" min="1" step="0.01"
                    value={agreedPrice}
                    onChange={e => setAgreedPrice(e.target.value)}
                    required
                    placeholder="e.g. 1500000"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ border: `1.5px solid ${C.border}`, color: '#111827' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase"
                    style={{ color: C.forest, fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.08em' }}>
                    Currency *
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ border: `1.5px solid ${C.border}`, color: '#111827' }}
                  >
                    <option value="ZAR">ZAR</option>
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                    <option value="BWP">BWP</option>
                    <option value="KES">KES</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* Deposit */}
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase"
                  style={{ color: C.forest, fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.08em' }}>
                  Deposit Amount{' '}
                  <span style={{ color: C.textMuted, textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit' }}>(optional)</span>
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ border: `1.5px solid ${C.border}`, color: '#111827' }}
                />
              </div>

              {/* Buyer ID */}
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase"
                  style={{ color: C.forest, fontFamily: 'var(--font-ibm-plex-mono)', letterSpacing: '0.08em' }}>
                  Buyer ID{' '}
                  <span style={{ color: C.textMuted, textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={buyerId}
                  onChange={e => setBuyerId(e.target.value)}
                  placeholder="Buyer's user UUID"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ border: `1.5px solid ${C.border}`, color: '#111827' }}
                />
              </div>

              {initiateError && (
                <p className="text-sm rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(196,86,42,0.07)', color: C.terracotta, border: '1px solid rgba(196,86,42,0.2)' }}>
                  {initiateError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: `1.5px solid ${C.border}`, color: C.forest }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInitiate || modalListings.length === 0}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: C.terracotta, color: '#fff' }}
                >
                  {submittingInitiate && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {submittingInitiate ? 'Creating…' : 'Initiate Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
