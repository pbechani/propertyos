'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Video, Phone, Home, Loader2,
  Check, X, RefreshCw, AlertTriangle, Shield, MessageSquare, Plus, Activity,
} from 'lucide-react';
import { propertiesApi, viewingsApi, type ListingViewingRecord } from '@/lib/api-client';
import { ScheduleViewingModal } from './ScheduleViewingModal';
import { LiveViewingCapture, type CapturedState } from './LiveViewingCapture';
import { LogOutcomeModal } from './LogOutcomeModal';
import { ViewingMessageModal } from './ViewingMessageModal';

interface Props {
  propertyId: string;
  authToken: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DOW_MON_START = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function ViewingTypeIcon({ type }: { type: string }) {
  if (type === 'virtual') return <Video className="w-3.5 h-3.5 text-[#C4562A]" />;
  if (type === 'phone') return <Phone className="w-3.5 h-3.5 text-[#1A3C28]" />;
  return <Home className="w-3.5 h-3.5 text-[#1A3C28]" />;
}

function ViewingTypeBadge({ type, status }: { type: string; status: string }) {
  const label = type === 'virtual' ? 'Virtual' : type === 'phone' ? 'Phone' : 'In-Person';
  if (status === 'declined') return (
    <span className="text-[9px] font-bold font-mono uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full border bg-[#C4562A]/[0.06] text-[#C4562A] border-[#C4562A]/20">Declined</span>
  );
  if (status === 'cancelled') return (
    <span className="text-[9px] font-bold font-mono uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full border bg-[#C4562A]/[0.06] text-[#C4562A] border-[#C4562A]/20">Cancelled</span>
  );
  if (status === 'completed') return (
    <span className="text-[9px] font-bold font-mono uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full border bg-[#1A3C28]/[0.05] text-[#1A3C28]/60 border-[#1A3C28]/12">{label}</span>
  );
  return (
    <span className="text-[9px] font-bold font-mono uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full border bg-[#00E87A]/10 text-[#0D7039] border-[#00E87A]/20">{label}</span>
  );
}

function deriveViewingDisplayStatus(v: { status: string; scheduled_at: string; duration_minutes: number | null }) {
  if (v.status !== 'requested' && v.status !== 'confirmed') return v.status;
  const now = new Date();
  const start = new Date(v.scheduled_at);
  const durationMs = (v.duration_minutes ?? 60) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);
  if (now >= end) return 'ended';
  if (now >= start) return 'in-progress';
  return v.status; // 'requested' | 'confirmed'
}

export function ScheduledViewings({ propertyId, authToken }: Props) {
  const router = useRouter();
  const [viewings, setViewings] = useState<ListingViewingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [captureViewing, setCaptureViewing] = useState<ListingViewingRecord | null>(null);
  const [logOutcomeViewing, setLogOutcomeViewing] = useState<ListingViewingRecord | null>(null);
  const [pendingCapture, setPendingCapture] = useState<CapturedState | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, 'confirming' | 'declining'>>({});
  const [messagingViewing, setMessagingViewing] = useState<ListingViewingRecord | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const fetchViewings = useCallback(() => {
    if (!authToken) { setIsLoading(false); return; }
    setIsLoading(true);
    propertiesApi
      .getPropertyViewings(authToken, propertyId)
      .then(setViewings)
      .catch((err: Error) => setError(err.message || 'Failed to load viewings'))
      .finally(() => setIsLoading(false));
  }, [propertyId, authToken]);

  useEffect(() => {
    fetchViewings();
  }, [fetchViewings]);

  const handleConfirm = useCallback(async (viewingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [viewingId]: 'confirming' }));
    try {
      await viewingsApi.confirm(authToken, viewingId);
      setViewings((prev) =>
        prev.map((v) => (v.id === viewingId ? { ...v, status: 'confirmed' } : v)),
      );
    } catch {
      // silent — user can retry
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[viewingId];
        return next;
      });
    }
  }, [authToken]);

  const handleDecline = useCallback(async (viewingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [viewingId]: 'declining' }));
    try {
      await viewingsApi.decline(authToken, viewingId, { reason: 'Unable to accommodate this time' });
      setViewings((prev) =>
        prev.map((v) => (v.id === viewingId ? { ...v, status: 'declined' } : v)),
      );
    } catch {
      // silent — user can retry
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[viewingId];
        return next;
      });
    }
  }, [authToken]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const { pending, confirmed, past, nextViewing, needsOutcomeCount } = useMemo(() => {
    const now = new Date();

    const pending = viewings.filter((v) => v.status === 'requested');

    const confirmed = viewings
      .filter((v) => {
        if (v.status !== 'confirmed') return false;
        const end = new Date(new Date(v.scheduled_at).getTime() + ((v.duration_minutes ?? 60) * 60 * 1000));
        return end > now;
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    const past = viewings
      .filter((v) => {
        const ds = deriveViewingDisplayStatus(v);
        return ds === 'ended' || ['completed', 'declined', 'cancelled'].includes(v.status);
      })
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    const nextViewing = confirmed[0] ?? null;
    const needsOutcomeCount = past.filter((v) => v.status === 'completed' && !v.buyer_feedback && !v.agent_feedback).length;

    return { pending, confirmed, past, nextViewing, needsOutcomeCount };
  }, [viewings]);

  // ── Mini-calendar dots ───────────────────────────────────────────────────────
  const { calDots, firstDowMon, daysInCal } = useMemo(() => {
    const calYear = calMonth.getFullYear();
    const calMon  = calMonth.getMonth();
    const firstDow = new Date(calYear, calMon, 1).getDay(); // 0=Sun
    const firstDowMon = firstDow === 0 ? 6 : firstDow - 1;
    const daysInCal = new Date(calYear, calMon + 1, 0).getDate();

    const calDots = new Map<number, { confirmed: boolean; pending: boolean }>();
    for (const v of viewings) {
      const d = new Date(v.scheduled_at);
      if (d.getFullYear() !== calYear || d.getMonth() !== calMon) continue;
      const day = d.getDate();
      const existing = calDots.get(day) ?? { confirmed: false, pending: false };
      if (v.status === 'confirmed') existing.confirmed = true;
      if (v.status === 'requested') existing.pending = true;
      calDots.set(day, existing);
    }

    return { calDots, firstDowMon, daysInCal };
  }, [viewings, calMonth]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return {
      dow:   d.toLocaleDateString('en-ZA', { weekday: 'short' }).toUpperCase(),
      day:   d.getDate(),
      month: d.toLocaleDateString('en-ZA', { month: 'short' }).toUpperCase(),
      time:  d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const buyerName = (v: ListingViewingRecord) =>
    [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || 'Unknown Buyer';

  const ageLabel = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hrs = Math.floor(diff / 3_600_000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ── Loading / error ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#1A3C28] animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 text-sm">{error}</div>;
  }

  const today = new Date();
  const calYear = calMonth.getFullYear();
  const calMon  = calMonth.getMonth();

  return (
    <div className="flex gap-5 items-start">
      {/* ─── LEFT COLUMN ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        {/* 1. Action Inbox – pending requests */}
        {pending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold font-mono uppercase tracking-[0.12em] text-[#B89040]">
                Action Required
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
                {pending.length} pending
              </span>
            </div>

            <div className="mb-3 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {pending.length} request{pending.length > 1 ? 's' : ''} awaiting your response
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Oldest: {ageLabel(pending[pending.length - 1].created_at)}
                </p>
              </div>
              <button className="text-xs font-semibold text-amber-700 border border-amber-300 bg-amber-100 hover:bg-amber-200 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap">
                Review All
              </button>
            </div>

            <div className="space-y-3">
              {pending.map((v) => {
                const dt = fmtDate(v.scheduled_at);
                const loading = actionLoading[v.id];
                return (
                  <div
                    key={v.id}
                    className="bg-white border border-amber-200 rounded-xl overflow-hidden grid"
                    style={{ gridTemplateColumns: '64px 1fr' }}
                  >
                    <div className="bg-amber-50 flex flex-col items-center justify-center py-4 border-r border-amber-200">
                      <span className="text-[10px] font-bold font-mono text-amber-700">{dt.dow}</span>
                      <span className="text-2xl font-bold text-amber-800 leading-tight">{dt.day}</span>
                      <span className="text-[10px] font-bold font-mono text-amber-600">{dt.month}</span>
                      <span className="text-[9px] text-amber-500 mt-1">{dt.time}</span>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-[#1A3C28]">{buyerName(v)}</p>
                          <span className="text-[10px] text-[#1A3C28]/40">{ageLabel(v.created_at)}</span>
                        </div>
                        <ViewingTypeBadge type={v.viewing_type} status={v.status} />
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 flex items-center gap-1.5 text-xs text-amber-700">
                        <Calendar className="w-3 h-3" />
                        <span>Requested: {dt.dow} {dt.day} {dt.month} at {dt.time}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={(e) => handleConfirm(v.id, e)}
                          disabled={!!loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3C28] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5A40] disabled:opacity-50 transition-colors"
                        >
                          {loading === 'confirming' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Accept
                        </button>
                        <button
                          onClick={(e) => handleDecline(v.id, e)}
                          disabled={!!loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A3C28]/20 text-[#1A3C28]/70 text-xs font-semibold rounded-lg hover:bg-[#1A3C28]/[0.06] disabled:opacity-50 transition-colors"
                        >
                          {loading === 'declining' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                          Decline
                        </button>
                        <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-[#1A3C28]/15 text-[#1A3C28]/50 text-xs rounded-lg hover:bg-[#1A3C28]/[0.04] transition-colors">
                          <RefreshCw className="w-3 h-3" />
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Confirmed Viewings */}
        {confirmed.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-bold font-mono uppercase tracking-[0.12em] text-[#1A3C28]/50">
                Confirmed Viewings
              </span>
              <div className="flex-1 h-px bg-[#1A3C28]/[0.08]" />
              <span className="text-[10px] text-[#1A3C28]/40">{confirmed.length} upcoming</span>
            </div>
            <div className="space-y-2">
              {confirmed.map((v) => {
                const dt = fmtDate(v.scheduled_at);
                const ds = deriveViewingDisplayStatus(v);
                const isInProgress = ds === 'in-progress';
                return (
                  <div
                    key={v.id}
                    onClick={() => router.push(`/app/my-listings/${propertyId}/viewings/${v.id}`)}
                    className="bg-white border border-[#1A3C28]/10 rounded-xl overflow-hidden cursor-pointer hover:border-[#1A3C28]/25 hover:shadow-sm transition-all grid"
                    style={{ gridTemplateColumns: '5px 64px 1fr auto' }}
                  >
                    <div className={isInProgress ? 'bg-amber-400' : 'bg-[#00E87A]'} />
                    <div className="flex flex-col items-center justify-center py-4 border-r border-[#1A3C28]/[0.07]">
                      <span className="text-[9px] font-mono font-bold text-[#1A3C28]/40">{dt.dow}</span>
                      <span className="text-xl font-bold text-[#1A3C28] leading-tight">{dt.day}</span>
                      <span className="text-[9px] font-mono font-bold text-[#1A3C28]/40">{dt.month}</span>
                    </div>
                    <div className="px-3 py-3 flex flex-col justify-center gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1A3C28]">{buyerName(v)}</span>
                        {isInProgress && (
                          <span className="text-[9px] font-bold font-mono uppercase tracking-[0.1em] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            In Progress
                          </span>
                        )}
                        <ViewingTypeBadge type={v.viewing_type} status={v.status} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#1A3C28]/45">
                        <Clock className="w-3 h-3" />
                        <span>{dt.time}</span>
                        {v.duration_minutes && <><span>·</span><span>{v.duration_minutes} min</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 pr-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCaptureViewing(v); }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#00E87A] text-[#1A3C28] rounded-lg text-[10px] font-bold hover:bg-[#00E87A]/90 transition-colors mr-1"
                      >
                        <Activity className="w-3 h-3" />
                        Capture
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMessagingViewing(v); }}
                        className="p-1.5 rounded-lg hover:bg-[#1A3C28]/[0.06] text-[#1A3C28]/40 hover:text-[#1A3C28]/70 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-[#1A3C28]/[0.06] text-[#1A3C28]/40 hover:text-[#1A3C28]/70 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Outcome nudge */}
        {needsOutcomeCount > 0 && (
          <div className="border-2 border-dashed border-[#1A3C28]/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#1A3C28]/50 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A3C28]">
                {needsOutcomeCount} viewing{needsOutcomeCount > 1 ? 's' : ''} need outcomes logged
              </p>
              <p className="text-xs text-[#1A3C28]/50 mt-0.5">
                Recording outcomes improves your lead tracking and buyer insights.
              </p>
            </div>
            <button
              onClick={() => { const first = past.find((pv) => pv.status === 'completed' && !pv.buyer_feedback && !pv.agent_feedback); if (first) setLogOutcomeViewing(first); }}
              className="text-xs font-semibold bg-[#1A3C28] text-white rounded-lg px-3 py-1.5 hover:bg-[#2D5A40] transition-colors whitespace-nowrap"
            >
              Log Now
            </button>
          </div>
        )}

        {/* 4. Past Viewings */}
        {past.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-bold font-mono uppercase tracking-[0.12em] text-[#1A3C28]/40">
                Past Viewings
              </span>
              <div className="flex-1 h-px bg-[#1A3C28]/[0.07]" />
              <span className="text-[10px] text-[#1A3C28]/30">{past.length}</span>
            </div>
            <div className="space-y-2">
              {past.map((v) => {
                const dt = fmtDate(v.scheduled_at);
                const needsOutcome = v.status === 'completed' && !v.buyer_feedback && !v.agent_feedback;
                const hasOutcome   = v.status === 'completed' && !!v.buyer_feedback;
                const noOutcome    = v.status === 'declined' || v.status === 'cancelled';
                return (
                  <div
                    key={v.id}
                    onClick={() => router.push(`/app/my-listings/${propertyId}/viewings/${v.id}`)}
                    className="bg-white border border-[#1A3C28]/[0.07] rounded-xl overflow-hidden cursor-pointer opacity-60 hover:opacity-90 hover:shadow-sm transition-all grid"
                    style={{ gridTemplateColumns: '5px 64px 1fr auto' }}
                  >
                    <div className="bg-[#1A3C28]/[0.15]" />
                    <div className="flex flex-col items-center justify-center py-4 border-r border-[#1A3C28]/[0.07]">
                      <span className="text-[9px] font-mono font-bold text-[#1A3C28]/35">{dt.dow}</span>
                      <span className="text-xl font-bold text-[#1A3C28]/60 leading-tight">{dt.day}</span>
                      <span className="text-[9px] font-mono font-bold text-[#1A3C28]/30">{dt.month}</span>
                    </div>
                    <div className="px-3 py-3 flex flex-col justify-center gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1A3C28]/70">{buyerName(v)}</span>
                        <ViewingTypeBadge type={v.viewing_type} status={v.status} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#1A3C28]/35">
                        <Clock className="w-3 h-3" />
                        <span>{dt.time}</span>
                        {v.duration_minutes && <><span>·</span><span>{v.duration_minutes} min</span></>}
                      </div>
                    </div>
                    <div className="flex items-center pr-3" onClick={(e) => e.stopPropagation()}>
                      {hasOutcome && (
                        <span className="text-[9px] font-bold font-mono uppercase tracking-[0.08em] bg-[#00E87A]/10 text-[#0D7039] border border-[#00E87A]/20 px-2 py-1 rounded-full whitespace-nowrap">
                          ✓ Outcome logged
                        </span>
                      )}
                      {needsOutcome && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLogOutcomeViewing(v); }}
                          className="text-[9px] font-bold border border-[#1A3C28]/20 text-[#1A3C28]/60 hover:bg-[#1A3C28]/[0.06] px-2 py-1 rounded-full whitespace-nowrap transition-colors"
                        >
                          Log Outcome
                        </button>
                      )}
                      {noOutcome && (
                        <span className="text-[9px] font-bold font-mono uppercase tracking-[0.08em] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full whitespace-nowrap">
                          No outcome
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {pending.length === 0 && confirmed.length === 0 && past.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-[#1A3C28]/20" />
            <p className="text-sm">No viewings scheduled for this listing.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-[#1A3C28] text-white text-sm rounded-lg hover:bg-[#2D5A40] transition-colors"
            >
              Schedule a Viewing
            </button>
          </div>
        )}
      </div>

      {/* ─── RIGHT SIDEBAR ───────────────────────────────────────────────── */}
      <div className="w-[300px] shrink-0 flex flex-col gap-4">

        {/* 5. Next Viewing Hero */}
        {nextViewing && (() => {
          const dt = fmtDate(nextViewing.scheduled_at);
          return (
            <div className="bg-[#1A3C28] rounded-2xl p-4 text-white">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E87A] animate-pulse" />
                <span className="text-[9px] font-bold font-mono uppercase tracking-[0.14em] text-[#00E87A]/90">
                  Next Viewing
                </span>
              </div>
              <p className="text-lg font-serif font-bold leading-tight mb-0.5">
                {buyerName(nextViewing)}
              </p>
              <p className="text-[#00E87A] font-bold text-sm mb-1">
                {dt.dow} {dt.day} {dt.month} · {dt.time}
              </p>
              <p className="text-white/50 text-xs flex items-center gap-1 mb-4">
                <ViewingTypeIcon type={nextViewing.viewing_type} />
                <span className="capitalize">{nextViewing.viewing_type.replace('_', ' ')}</span>
                {nextViewing.duration_minutes && <><span>·</span><span>{nextViewing.duration_minutes} min</span></>}
              </p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center justify-center gap-1.5 bg-[#00E87A]/20 text-[#00E87A] text-xs font-bold rounded-lg py-2 cursor-default">
                  <Check className="w-3 h-3" />
                  Confirmed
                </div>
                <button
                  onClick={() => setMessagingViewing(nextViewing)}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-white/20 text-white/70 text-xs font-semibold rounded-lg py-2 hover:bg-white/[0.06] transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Message
                </button>
              </div>
            </div>
          );
        })()}

        {/* 6. Schedule CTA */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#C4562A] text-white text-sm font-semibold rounded-xl py-3 hover:bg-[#B34B25] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule a Viewing
        </button>

        {/* 7. Mini Calendar */}
        <div className="bg-white border border-[#1A3C28]/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#1A3C28]/50" />
              <span className="text-xs font-semibold text-[#1A3C28]/70 font-serif">
                {MONTHS[calMon]} {calYear}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCalMonth(new Date(calYear, calMon - 1, 1))}
                className="p-1 rounded hover:bg-[#1A3C28]/[0.06] text-[#1A3C28]/50 hover:text-[#1A3C28]/80 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCalMonth(new Date(calYear, calMon + 1, 1))}
                className="p-1 rounded hover:bg-[#1A3C28]/[0.06] text-[#1A3C28]/50 hover:text-[#1A3C28]/80 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DOW headers — Monday-first */}
          <div className="grid grid-cols-7 mb-1">
            {DOW_MON_START.map((d, i) => (
              <div key={i} className="text-center text-[9px] font-bold font-mono text-[#1A3C28]/30 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDowMon }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInCal }).map((_, i) => {
              const day = i + 1;
              const isToday =
                today.getDate() === day &&
                today.getMonth() === calMon &&
                today.getFullYear() === calYear;
              const dots = calDots.get(day);
              return (
                <div key={day} className="flex flex-col items-center py-0.5">
                  <span
                    className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono rounded-full ${
                      isToday
                        ? 'bg-[#1A3C28] text-white font-bold'
                        : 'text-[#1A3C28]/60 hover:bg-[#1A3C28]/[0.06]'
                    }`}
                  >
                    {day}
                  </span>
                  {dots && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dots.confirmed && <span className="w-1 h-1 rounded-full bg-[#00E87A]" />}
                      {dots.pending   && <span className="w-1 h-1 rounded-full bg-[#B89040]" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#1A3C28]/[0.07]">
            <div className="flex items-center gap-1 text-[9px] text-[#1A3C28]/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E87A]" />
              Confirmed
            </div>
            <div className="flex items-center gap-1 text-[9px] text-[#1A3C28]/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B89040]" />
              Pending
            </div>
          </div>
        </div>

        {/* 8. Viewing Stats */}
        <div className="bg-white border border-[#1A3C28]/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[#1A3C28]/50" />
            <span className="text-xs font-semibold text-[#1A3C28]/70">Viewing Stats</span>
          </div>
          {([
            { label: 'Total viewings',   value: viewings.length },
            { label: 'Completed',        value: viewings.filter((v) => v.status === 'completed').length },
            { label: 'Pending requests', value: pending.length },
          ] as const).map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1.5 text-xs border-b border-[#1A3C28]/[0.06] last:border-0">
              <span className="text-[#1A3C28]/50">{label}</span>
              <span className="font-bold text-[#1A3C28]">{value}</span>
            </div>
          ))}
          {viewings.length > 0 && (() => {
            const completedN = viewings.filter((v) => v.status === 'completed').length;
            const interestedN = Math.round(completedN * 0.4);
            const funnel = [
              { label: 'Requests',  value: viewings.length, pct: 100 },
              { label: 'Completed', value: completedN,      pct: Math.round((completedN / viewings.length) * 100) },
              { label: 'Interested',value: interestedN,     pct: Math.round((interestedN / viewings.length) * 100) },
              { label: 'Offers',    value: 0,               pct: 0 },
            ];
            return (
              <div className="mt-3 pt-3 border-t border-[#1A3C28]/[0.07] space-y-1.5">
                {funnel.map(({ label, value, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[9px] text-[#1A3C28]/40 mb-0.5">
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-1 bg-[#1A3C28]/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1A3C28]/30 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <ScheduleViewingModal
        open={showModal}
        onOpenChange={setShowModal}
        propertyId={propertyId}
        authToken={authToken}
        onSuccess={fetchViewings}
      />

      {captureViewing && (
        <LiveViewingCapture
          viewing={captureViewing}
          onEnd={(captured) => {
            const v = captureViewing;
            setPendingCapture(captured);
            setCaptureViewing(null);
            setLogOutcomeViewing(v);
          }}
          onClose={() => setCaptureViewing(null)}
        />
      )}

      {logOutcomeViewing && (
        <LogOutcomeModal
          viewing={logOutcomeViewing}
          authToken={authToken}
          initialCapture={pendingCapture}
          onSuccess={() => {
            const id = logOutcomeViewing.id;
            setViewings((prev) =>
              prev.map((v) =>
                v.id === id ? { ...v, status: 'completed', agent_feedback: { logged: true } } : v,
              ),
            );
            setLogOutcomeViewing(null);
            setPendingCapture(null);
          }}
          onClose={() => { setLogOutcomeViewing(null); setPendingCapture(null); }}
        />
      )}

      {messagingViewing && (
        <ViewingMessageModal
          viewing={messagingViewing}
          authToken={authToken}
          onClose={() => setMessagingViewing(null)}
        />
      )}
    </div>
  );
}
