// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, Users, CheckCircle2, XCircle, CalendarDays, TrendingUp, Eye } from 'lucide-react';
import { agentApi, type OpenHouseRecord } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ── Static data ───────────────────────────────────────────────────────────────
const THUMB_GRADIENTS = [
  'from-[#2D5A40] to-[#1A3C28]',
  'from-[#3d4a2e] to-[#2D5A40]',
  'from-[#1A3C28] to-[#0e2d1c]',
  'from-[#2D5A40] to-[#4a6e52]',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Sub-components ─────────────────────────────────────────────────────────────
function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[0.55rem] font-mono tracking-[0.14em] uppercase text-[rgba(26,60,40,0.35)] whitespace-nowrap flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-[rgba(26,60,40,0.08)]" />
    </div>
  );
}

const ICON_BG: Record<string, string> = {
  '#1A3C28': 'rgba(26,60,40,0.06)',
  '#00E87A': 'rgba(0,232,122,0.1)',
  '#C4562A': 'rgba(196,86,42,0.1)',
  '#B89040': 'rgba(184,144,64,0.12)',
};

function MetricCard({
  label, value, delta, deltaUp, icon, accent, sparkPath,
}: {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean | null;
  icon: React.ReactNode;
  accent: string;
  sparkPath?: string;
}) {
  const iconBg = ICON_BG[accent] ?? 'rgba(26,60,40,0.06)';
  const safeid = label.replace(/[^a-z]/gi, '');
  return (
    <div
      className="bg-white rounded-xl border border-[rgba(26,60,40,0.06)] p-[18px_20px_16px] relative overflow-hidden transition-all duration-150 hover:-translate-y-px"
      style={{ boxShadow: '0 1px 3px rgba(26,60,40,0.08),0 1px 2px rgba(26,60,40,0.06)' }}
    >
      {/* left accent bar */}
      <div className="absolute top-0 left-0 w-[3px] h-full rounded-l-xl" style={{ background: accent }} />

      {/* icon */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: iconBg }}>
        {icon}
      </div>

      {/* label */}
      <p className="text-[0.58rem] font-mono tracking-[0.1em] uppercase text-[rgba(26,60,40,0.45)] mb-1">{label}</p>

      {/* value */}
      <p
        className="text-[2rem] font-bold leading-none text-[#1A3C28] mb-2"
        style={{ fontFamily: 'var(--font-fraunces,"Fraunces",Georgia,serif)' }}
      >
        {value}
      </p>

      {/* delta */}
      <div className="text-[0.6rem] font-mono font-medium">
        {deltaUp === true  && <span style={{ color: '#1a9c52' }}>{delta}</span>}
        {deltaUp === false && <span style={{ color: '#C4562A' }}>{delta}</span>}
        {deltaUp === null  && <span className="text-[rgba(26,60,40,0.4)]">{delta}</span>}
      </div>

      {/* sparkline */}
      {sparkPath && (
        <div className="mt-2.5">
          <svg width="100%" height="28" viewBox="0 0 120 28" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id={`spark-${safeid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={accent} stopOpacity="0.15" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={sparkPath} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
            <path d={`${sparkPath} L120,28 L0,28 Z`} fill={`url(#spark-${safeid})`} />
          </svg>
        </div>
      )}
    </div>
  );
}

function deriveTasks(records: OpenHouseRecord[]) {
  return records.flatMap(r =>
    (r.preparation_checklist ?? []).map(t => ({
      id: `${r.id}-${t.task}`,
      title: t.task,
      category: r.property_title ?? 'Open House',
      completed: t.completed,
      priority: 'medium' as const,
    }))
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DashboardView({ onViewOpenHouse }: { onViewOpenHouse?: () => void }) {
  const [records, setRecords] = useState<OpenHouseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.push('/login?next=/app/open-houses'); return; }
    setLoading(true);
    setError(null);
    agentApi
      .getOpenHouses(token)
      .then(data => setRecords(data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load on show events'))
      .finally(() => setLoading(false));
  }, [router, retryCount]);

  const now       = new Date();
  const todayStr  = now.toDateString();

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const total          = records.length;
  const completedCount = records.filter(r => r.status === 'completed').length;
  const scheduledCount = records.filter(r => r.status === 'scheduled').length;
  const cancelledCount = records.filter(r => r.status === 'cancelled').length;
  const totalCapacity  = records.reduce((s, r) => s + (r.max_attendees ?? 0), 0);

  const completedPct = total ? Math.round((completedCount / total) * 100) : 0;
  const scheduledPct = total ? Math.round((scheduledCount / total) * 100) : 0;
  const cancelledPct = total ? Math.round((cancelledCount / total) * 100) : 0;
  const pendingPct   = Math.max(0, 100 - completedPct - scheduledPct - cancelledPct);

  const avgCapacity = total > 0 ? (totalCapacity / total).toFixed(1) : '—';

  // ── Upcoming cards (max 3) ───────────────────────────────────────────────────
  const upcomingCards = records
    .filter(r => r.status !== 'cancelled' && new Date(r.scheduled_at) >= new Date(todayStr))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 3);

  // ── Live events ────────────────────────────────────────────────────────────
  const liveEvents = records.filter(r => {
    const s = new Date(r.scheduled_at), e = new Date(r.end_at);
    return now >= s && now <= e;
  });
  const liveEvent = liveEvents[0];
  const liveProgressPct = liveEvent
    ? Math.min(100, Math.round(
        (now.getTime() - new Date(liveEvent.scheduled_at).getTime()) /
        (new Date(liveEvent.end_at).getTime()   - new Date(liveEvent.scheduled_at).getTime()) * 100
      ))
    : 0;
  const liveMinsRemaining = liveEvent
    ? Math.max(0, Math.round((new Date(liveEvent.end_at).getTime() - now.getTime()) / 60000))
    : 0;

  // ── Next event countdown ────────────────────────────────────────────────────
  const nextEvent = records
    .filter(r => {
      const s = new Date(r.scheduled_at);
      return s > now && s.toDateString() === todayStr && r.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
  const minutesToNext = nextEvent
    ? Math.round((new Date(nextEvent.scheduled_at).getTime() - now.getTime()) / 60000)
    : null;

  // ── Today's timeline ────────────────────────────────────────────────────────
  const todaySchedule = records
    .filter(r => new Date(r.scheduled_at).toDateString() === todayStr && r.status !== 'cancelled')
    .map(r => {
      const s = new Date(r.scheduled_at), e = new Date(r.end_at);
      const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return {
        id: r.id,
        title: r.property_title ?? 'Open House',
        start: s, end: e,
        timeStr: `${fmt(s)} – ${fmt(e)}`,
        isLive: now >= s && now <= e,
        isDone: e < now,
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasks = deriveTasks(records);

  // ── Donut segments — circumference ≈ 150.8 (r=24) ─────────────────────────
  const C_CIRC = 150.8;
  const d1 = (completedPct / 100) * C_CIRC;
  const d2 = (scheduledPct / 100) * C_CIRC;
  const d3 = (cancelledPct / 100) * C_CIRC;

  // ──────────────────────────────────────────────────────────────────────────
  // Loading state
  // ──────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          {[0, 0.2, 0.4, 0.6].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[rgba(26,60,40,0.06)] p-4 animate-pulse"
              style={{ borderLeft: '3px solid rgba(26,60,40,0.1)', boxShadow: '0 1px 3px rgba(26,60,40,0.08)' }}
            >
              <div className="w-10 h-2 bg-[rgba(26,60,40,0.07)] rounded mb-2.5" />
              <div className="w-8 h-6 bg-[rgba(26,60,40,0.07)] rounded" />
            </div>
          ))}
        </div>
        <div className="h-24 rounded-xl animate-pulse bg-[rgba(26,60,40,0.04)] border border-[rgba(26,60,40,0.06)]" />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Error state
  // ──────────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="bg-white rounded-xl p-5"
        style={{ border: '1px solid rgba(196,86,42,0.15)', borderLeft: '3px solid #C4562A', boxShadow: '0 1px 3px rgba(26,60,40,0.08)' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(196,86,42,0.1)] flex items-center justify-center flex-shrink-0">
            <XCircle className="w-4 h-4 text-[#C4562A]" />
          </div>
          <div className="flex-1">
            <p
              className="text-[0.9rem] font-semibold text-[#1A3C28] mb-1"
              style={{ fontFamily: 'var(--font-fraunces,"Fraunces",Georgia,serif)' }}
            >
              Failed to load on show events
            </p>
            <p className="text-xs text-[rgba(26,60,40,0.5)] mb-3">{error}</p>
            <button
              onClick={() => setRetryCount(c => c + 1)}
              className="px-4 py-2 rounded-lg bg-[#C4562A] text-white text-[0.62rem] font-mono font-semibold tracking-[0.06em] uppercase hover:bg-[#b34a23] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="pb-10">

      {/* ── LIVE NOW BANNER (full-bleed, dark) ─────────────────────────────── */}
      {liveEvents.length > 0 && (
        <div
          className="relative overflow-hidden -mt-6 px-7 flex items-center gap-3 py-[11px] border-b border-[rgba(196,86,42,0.25)] mb-6"
          style={{ background: 'linear-gradient(135deg,#1a0a04 0%,#2d1208 40%,#1a1206 100%)' }}
        >
          {/* terra overlay sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg,rgba(196,86,42,0.08),transparent 60%)' }}
          />

          {/* Live pill */}
          <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 bg-[#C4562A] rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[0.58rem] font-mono font-semibold tracking-[0.1em] uppercase text-white">
              Live Now
            </span>
          </div>

          {/* Event info */}
          <div className="relative z-10 flex-1 min-w-0">
            <p className="text-[0.82rem] font-medium text-[#F2E8D5] truncate">
              {liveEvents.length === 1
                ? `${liveEvent.property_title ?? 'Open House'} — On Show in progress`
                : `${liveEvents.length} Events Live Now`}
            </p>
            {liveEvent && (
              <p className="text-[0.58rem] font-mono text-[rgba(242,232,213,0.45)] tracking-[0.05em]">
                {new Date(liveEvent.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                {' – '}
                {new Date(liveEvent.end_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                {' · '}{liveEvent.max_attendees ?? 0} capacity
                {' · '}<span className="text-[#00E87A]">{liveMinsRemaining}m remaining</span>
              </p>
            )}
          </div>

          {/* View Event button */}
          {liveEvent && (
            <button
              onClick={() => router.push(`/app/open-houses/events/${liveEvent.id}`)}
              className="relative z-10 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#C4562A] text-white rounded-md text-[0.6rem] font-mono font-semibold tracking-[0.06em] uppercase hover:bg-[#b34a23] transition-colors"
            >
              View Event →
            </button>
          )}

          {/* elapsed progress bar */}
          <div
            className="absolute bottom-0 left-0 h-[2px]"
            style={{ width: `${liveProgressPct}%`, background: 'linear-gradient(90deg,#C4562A,#F5C87A)' }}
          />
        </div>
      )}

      <div className="space-y-6 px-7">

        {/* ── PERFORMANCE METRIC CARDS ─────────────────────────────────────── */}
        <section>
          <SectionEyebrow label="Performance · This Month" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <MetricCard
              label="Scheduled"
              value={String(scheduledCount)}
              delta={scheduledCount > 0 ? `${scheduledCount} upcoming` : 'None scheduled'}
              deltaUp={scheduledCount > 0 ? true : null}
              icon={<CalendarDays className="w-4 h-4" style={{ color: '#1A3C28' }} />}
              accent="#1A3C28"
              sparkPath="M0,22 L15,18 L30,20 L45,14 L60,16 L75,10 L90,8 L105,5 L120,4"
            />
            <MetricCard
              label="Completed"
              value={String(completedCount)}
              delta={total > 0 ? `${completedPct}% completion rate` : 'No events yet'}
              deltaUp={completedPct >= 60 ? true : null}
              icon={<CheckCircle2 className="w-4 h-4" style={{ color: '#1a7a46' }} />}
              accent="#00E87A"
              sparkPath="M0,20 L15,22 L30,16 L45,18 L60,12 L75,14 L90,8 L105,6 L120,4"
            />
            <MetricCard
              label="Leads Captured"
              value={totalCapacity > 0 ? String(totalCapacity) : '—'}
              delta={totalCapacity > 0 ? `From ${total} events` : 'No data yet'}
              deltaUp={totalCapacity > 0 ? true : null}
              icon={<Users className="w-4 h-4" style={{ color: '#C4562A' }} />}
              accent="#C4562A"
              sparkPath="M0,24 L15,22 L30,20 L45,18 L60,16 L75,12 L90,9 L105,7 L120,4"
            />
            <MetricCard
              label="Avg. Attendance"
              value={avgCapacity}
              delta={cancelledCount > 0 ? `${cancelledCount} cancelled` : 'No cancellations'}
              deltaUp={cancelledCount === 0 ? true : false}
              icon={<Clock className="w-4 h-4" style={{ color: '#B89040' }} />}
              accent="#B89040"
              sparkPath="M0,8 L15,6 L30,10 L45,8 L60,14 L75,12 L90,16 L105,18 L120,20"
            />
          </div>
        </section>

        {/* ── TWO COLUMN: EVENT CARDS + SCHEDULE ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* Event Cards */}
          <div>
            <SectionEyebrow label="Upcoming On Show Events" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {upcomingCards.map((r, idx) => {
                const start = new Date(r.scheduled_at);
                const end   = new Date(r.end_at);
                const fmt = (d: Date) =>
                  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const isLive  = now >= start && now <= end;
                const isToday = start.toDateString() === todayStr;
                const dateLabel = isLive
                  ? '● Live'
                  : isToday
                  ? 'Today'
                  : `${DAYS[start.getDay()]} ${start.getDate()} ${MONTHS[start.getMonth()]}`;
                const statusCls = isLive
                  ? 'bg-[#C4562A] text-white'
                  : isToday
                  ? 'bg-[rgba(0,232,122,0.15)] text-[#00b85f] border border-[rgba(0,232,122,0.25)]'
                  : 'bg-[rgba(242,232,213,0.15)] text-[rgba(242,232,213,0.8)] border border-[rgba(242,232,213,0.2)]';
                const gradient = THUMB_GRADIENTS[idx % THUMB_GRADIENTS.length];
                const estLeads = Math.max(0, Math.floor((r.max_attendees ?? 0) * 0.3));

                return (
                  <div
                    key={r.id}
                    onClick={() => router.push(`/app/open-houses/events/${r.id}`)}
                    className="bg-white rounded-xl border border-[rgba(26,60,40,0.07)] overflow-hidden cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                    style={{ boxShadow: '0 1px 3px rgba(26,60,40,0.08)' }}
                  >
                    {/* Thumbnail */}
                    <div className={`h-20 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
                      <p className="absolute bottom-2 left-2.5 right-2 text-[0.72rem] font-medium text-white truncate">
                        {r.property_title ?? 'Open House'}
                      </p>
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[0.52rem] font-mono font-semibold tracking-[0.06em] uppercase ${statusCls}`}>
                        {dateLabel}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="px-3.5 pt-3 pb-3.5">
                      <div className="flex items-center gap-1.5 text-[0.6rem] font-mono text-[#C4562A] tracking-[0.04em] mb-2.5">
                        <CalendarDays className="w-2.5 h-2.5 flex-shrink-0" />
                        {isToday || isLive
                          ? `Today · ${fmt(start)} – ${fmt(end)}`
                          : `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${fmt(start)} – ${fmt(end)}`}
                      </div>
                      <div className="flex items-center gap-3 pt-2.5 border-t border-[rgba(26,60,40,0.06)]">
                        <div className="flex items-center gap-1 text-[0.72rem] text-[#1A3C28]">
                          <Users className="w-3 h-3 text-[rgba(26,60,40,0.38)]" />
                          {r.max_attendees ?? 0} max
                        </div>
                        <div className="flex items-center gap-1 text-[0.72rem] text-[#1A3C28]">
                          <Eye className="w-3 h-3 text-[rgba(26,60,40,0.38)]" />
                          {isLive ? 'Live' : `${r.max_attendees ?? 0} RSVP`}
                        </div>
                        {estLeads > 0 && (
                          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(0,232,122,0.1)] text-[0.56rem] font-mono font-semibold tracking-[0.06em] text-[#1a7a46]">
                            <TrendingUp className="w-2 h-2" />
                            {estLeads} leads
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Quick-add card */}
              <button
                onClick={() => router.push('/app/open-houses/events/new')}
                className="min-h-[170px] flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border-2 border-dashed border-[rgba(26,60,40,0.14)] cursor-pointer transition-all text-center hover:border-[#C4562A] hover:bg-[rgba(196,86,42,0.04)]"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(26,60,40,0.06)] flex items-center justify-center text-[rgba(26,60,40,0.3)]">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="text-[0.6rem] font-mono tracking-[0.1em] uppercase text-[rgba(26,60,40,0.35)]">
                  Schedule New<br />On Show
                </p>
              </button>

              {upcomingCards.length === 0 && (
                <p className="text-[0.75rem] text-[rgba(26,60,40,0.35)] py-4 col-span-2 text-center">
                  No on show events scheduled
                </p>
              )}
            </div>
          </div>

          {/* Today's Schedule Panel */}
          <div>
            <SectionEyebrow label="Today's Schedule" />
            <div
              className="bg-white rounded-xl border border-[rgba(26,60,40,0.07)] overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(26,60,40,0.08)' }}
            >
              {/* Dark forest header */}
              <div className="bg-[#1A3C28] px-4 py-3.5 flex items-center justify-between">
                <p
                  className="text-[0.9rem] font-semibold text-[#F2E8D5]"
                  style={{ fontFamily: 'var(--font-fraunces,"Fraunces",Georgia,serif)' }}
                >
                  Today
                </p>
                <p className="text-[0.55rem] font-mono tracking-[0.1em] uppercase text-[rgba(242,232,213,0.4)]">
                  {now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Countdown chip */}
              {minutesToNext !== null && minutesToNext <= 240 && (
                <div className="px-4 pt-3">
                  <div className="bg-[#1A3C28] rounded-lg px-3.5 py-2.5 flex items-center gap-2.5">
                    <div className="flex-1">
                      <p className="text-[0.53rem] font-mono tracking-[0.1em] uppercase text-[rgba(242,232,213,0.45)] mb-0.5">
                        Next Event In
                      </p>
                      <p
                        className="text-[1.2rem] font-bold text-[#00E87A] leading-none"
                        style={{ fontFamily: 'var(--font-fraunces,"Fraunces",Georgia,serif)' }}
                      >
                        {Math.floor(minutesToNext / 60)}:{String(minutesToNext % 60).padStart(2, '0')}
                      </p>
                      <p className="text-[0.7rem] text-[rgba(242,232,213,0.55)] mt-0.5">
                        {nextEvent?.property_title ?? 'Open House'}
                        {' · '}
                        {new Date(nextEvent!.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <Clock className="w-6 h-6 text-[rgba(0,232,122,0.5)] flex-shrink-0" />
                  </div>
                </div>
              )}

              {/* Timeline items */}
              <div className="p-4">
                {todaySchedule.length === 0 ? (
                  <p className="text-center text-[0.62rem] font-mono tracking-[0.08em] uppercase text-[rgba(26,60,40,0.3)] py-6">
                    No events today
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {todaySchedule.map((item, idx) => (
                      <div key={item.id} className="flex gap-3 relative">
                        {/* connector */}
                        {idx < todaySchedule.length - 1 && (
                          <div className="absolute left-2.5 top-5 w-px bg-[rgba(26,60,40,0.08)]" style={{ height: 'calc(100% + 8px)' }} />
                        )}
                        {/* marker */}
                        <div
                          className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            item.isLive
                              ? 'bg-[#C4562A]'
                              : item.isDone
                              ? 'bg-[rgba(26,60,40,0.07)]'
                              : 'bg-[rgba(26,60,40,0.1)]'
                          }`}
                          style={item.isLive ? { boxShadow: '0 0 0 3px rgba(196,86,42,0.2)' } : undefined}
                        >
                          {item.isLive && <span className="w-2 h-2 rounded-full bg-white" />}
                          {item.isDone && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(26,60,40,0.4)" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {!item.isLive && !item.isDone && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(26,60,40,0.3)]" />
                          )}
                        </div>
                        {/* content */}
                        <div className="flex-1">
                          <p className="text-[0.58rem] font-mono text-[rgba(26,60,40,0.38)] tracking-[0.06em] mb-0.5">
                            {item.timeStr}
                          </p>
                          <p className="text-[0.8rem] font-medium text-[#1A3C28] mb-0.5">{item.title}</p>
                          <p className="text-[0.7rem] text-[rgba(26,60,40,0.42)]">
                            {item.isLive ? '● Live' : item.isDone ? 'Completed' : 'Upcoming'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW: LEAD SOURCES + ATTENDANCE + TASKS ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_280px] gap-4">

          {/* Lead Sources */}
          <div
            className="bg-white rounded-xl border border-[rgba(26,60,40,0.07)] overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(26,60,40,0.08)' }}
          >
            <div className="px-4 py-3.5 border-b border-[rgba(26,60,40,0.06)] flex items-center justify-between">
              <p
                className="text-[0.85rem] font-semibold text-[#1A3C28]"
                style={{ fontFamily: 'var(--font-fraunces,"Fraunces",Georgia,serif)' }}
              >
                Lead Sources
              </p>
              <button className="text-[0.55rem] font-mono tracking-[0.08em] uppercase text-[#C4562A]">
                See all →
              </button>
            </div>
            <div className="p-4">
              {[
                { label: 'Open House',   pct: 72, count: 67, color: '#1A3C28' },
                { label: 'Referral',     pct: 55, count: 51, color: '#00E87A' },
                { label: 'Website',      pct: 48, count: 45, color: '#C4562A' },
                { label: 'Social Media', pct: 32, count: 30, color: '#B89040' },
              ].map(({ label, pct, count, color }) => (
                <div key={label} className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-[0.75rem] text-[rgba(26,60,40,0.7)] w-[90px] flex-shrink-0 truncate">{label}</span>
                  <div className="flex-1 h-1.5 bg-[rgba(26,60,40,0.06)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[0.62rem] font-mono text-[rgba(26,60,40,0.45)] w-7 text-right flex-shrink-0">{count}</span>
                </div>
              ))}

              {/* Conversion funnel */}
              <div className="mt-3.5 pt-3 border-t border-[rgba(26,60,40,0.07)]">
                <p className="text-[0.54rem] font-mono tracking-[0.14em] uppercase text-[rgba(26,60,40,0.35)] mb-2">
                  Conversion Funnel
                </p>
                {[
                  { label: 'Visitors',  pct: 100, color: '#1A3C28' },
                  { label: 'Qualified', pct:  62, color: '#2D5A40' },
                  { label: 'Showings',  pct:  39, color: '#C4562A' },
                  { label: 'Offers',    pct:  17, color: '#B89040' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-2.5 mb-2 last:mb-0">
                    <span className="text-[0.73rem] text-[#1A3C28] w-[72px] flex-shrink-0">{label}</span>
                    <div className="flex-1 h-5 rounded bg-[rgba(26,60,40,0.05)] overflow-hidden">
                      <div
                        className="h-full rounded flex items-center pl-2 text-[0.57rem] font-mono font-semibold text-white whitespace-nowrap"
                        style={{ width: `${pct}%`, background: color }}
                      >
                        {pct}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attendance Rate */}
          <div
            className="bg-white rounded-xl border border-[rgba(26,60,40,0.07)] overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(26,60,40,0.08)' }}
          >
            <div className="px-4 py-3.5 border-b border-[rgba(26,60,40,0.06)] flex items-center justify-between">
              <p
                className="text-[0.85rem] font-semibold text-[#1A3C28]"
                style={{ fontFamily: 'var(--font-fraunces,"Fraunces",Georgia,serif)' }}
              >
                Attendance Rate
              </p>
              <button className="text-[0.55rem] font-mono tracking-[0.08em] uppercase text-[#C4562A]">
                History →
              </button>
            </div>
            <div className="p-4">
              {/* Big number + donut */}
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p
                    className="text-[2.8rem] font-bold text-[#1A3C28] leading-none"
                    style={{ fontFamily: 'var(--font-fraunces,"Fraunces",Georgia,serif)' }}
                  >
                    {total > 0 ? completedPct : 0}
                    <span className="text-[1.2rem] text-[rgba(26,60,40,0.4)]">%</span>
                  </p>
                  <p className="text-[0.7rem] font-mono text-[rgba(26,60,40,0.4)] mt-1">of RSVPs attended</p>
                </div>
                <div className="flex-1 flex justify-end">
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(26,60,40,0.07)" strokeWidth="10" />
                    {total > 0 && (
                      <>
                        <circle cx="32" cy="32" r="24" fill="none" stroke="#00E87A" strokeWidth="10"
                          strokeDasharray={`${d1} ${C_CIRC}`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          transform="rotate(-90 32 32)" />
                        {d2 > 0 && (
                          <circle cx="32" cy="32" r="24" fill="none" stroke="#B89040" strokeWidth="10"
                            strokeDasharray={`${d2} ${C_CIRC}`}
                            strokeDashoffset={`${-d1}`}
                            strokeLinecap="round"
                            transform="rotate(-90 32 32)" />
                        )}
                        {d3 > 0 && (
                          <circle cx="32" cy="32" r="24" fill="none" stroke="#C4562A" strokeWidth="10"
                            strokeDasharray={`${d3} ${C_CIRC}`}
                            strokeDashoffset={`${-(d1 + d2)}`}
                            strokeLinecap="round"
                            transform="rotate(-90 32 32)" />
                        )}
                      </>
                    )}
                  </svg>
                </div>
              </div>

              {/* Segment bar */}
              <div className="h-2 rounded-full overflow-hidden flex mb-2.5">
                <div style={{ width: `${completedPct}%`, background: '#00E87A', transition: 'width 0.5s' }} />
                <div style={{ width: `${scheduledPct}%`, background: '#B89040', transition: 'width 0.5s' }} />
                <div style={{ width: `${cancelledPct}%`, background: '#C4562A', transition: 'width 0.5s' }} />
                <div style={{ width: `${pendingPct}%`,   background: 'rgba(26,60,40,0.1)', transition: 'width 0.5s' }} />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: `Attended ${completedPct}%`, color: '#00E87A' },
                  { label: `Scheduled ${scheduledPct}%`, color: '#B89040' },
                  { label: `Cancelled ${cancelledPct}%`, color: '#C4562A' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1 text-[0.55rem] font-mono text-[rgba(26,60,40,0.5)] tracking-[0.05em]">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* 8-week trend chart */}
              <div className="pt-3 border-t border-[rgba(26,60,40,0.07)]">
                <p className="text-[0.54rem] font-mono tracking-[0.14em] uppercase text-[rgba(26,60,40,0.35)] mb-1.5">
                  Leads — 8 Week Trend
                </p>
                <svg width="100%" height="42" viewBox="0 0 220 42" preserveAspectRatio="none" fill="none">
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#00E87A" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#00E87A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,36 L28,30 L56,32 L84,22 L112,26 L140,16 L168,12 L196,8 L220,5"
                    fill="none" stroke="#00E87A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <path
                    d="M0,36 L28,30 L56,32 L84,22 L112,26 L140,16 L168,12 L196,8 L220,5 L220,42 L0,42 Z"
                    fill="url(#trendGrad)"
                  />
                  {['W1','W2','W3','W4','W5','W6','W7','W8'].map((w, i) => (
                    <text key={w} x={i * 28} y="41" fontFamily="IBM Plex Mono" fontSize="6" fill="rgba(26,60,40,0.28)">
                      {w}
                    </text>
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div
            className="bg-white rounded-xl border border-[rgba(26,60,40,0.07)] overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(26,60,40,0.08)' }}
          >
            <div className="px-4 py-3.5 border-b border-[rgba(26,60,40,0.06)] flex items-center justify-between">
              <p
                className="text-[0.85rem] font-semibold text-[#1A3C28]"
                style={{ fontFamily: 'var(--font-fraunces,"Fraunces",Georgia,serif)' }}
              >
                Tasks
              </p>
              <button
                onClick={() => router.push('/app/on-show?tab=tasks')}
                className="text-[0.55rem] font-mono tracking-[0.08em] uppercase text-[#C4562A]"
              >
                All tasks →
              </button>
            </div>
            <div className="px-4 pb-2">
              {tasks.length === 0 ? (
                <p className="text-center text-[0.62rem] font-mono tracking-[0.08em] uppercase text-[rgba(26,60,40,0.3)] py-6">
                  No tasks pending
                </p>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2.5 py-2.5 border-b border-[rgba(26,60,40,0.06)] last:border-b-0"
                  >
                    {/* checkbox */}
                    <div
                      className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center mt-0.5 border-[1.5px] transition-colors ${
                        task.completed
                          ? 'bg-[#00E87A] border-[#00E87A]'
                          : 'border-[rgba(26,60,40,0.2)]'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="#0C0D10" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {/* content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[0.78rem] mb-0.5 ${
                          task.completed ? 'line-through text-[rgba(26,60,40,0.35)]' : 'text-[#1A3C28]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-[0.57rem] font-mono text-[rgba(26,60,40,0.35)] tracking-[0.04em] truncate">
                        {task.category}
                      </p>
                    </div>
                    {/* priority badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[0.52rem] font-mono font-semibold tracking-[0.06em] uppercase flex-shrink-0 ${
                        task.priority === 'high'
                          ? 'bg-[rgba(196,86,42,0.1)] text-[#C4562A]'
                          : task.priority === 'low'
                          ? 'bg-[rgba(26,60,40,0.06)] text-[#2D5A40]'
                          : 'bg-[rgba(184,144,64,0.12)] text-[#B89040]'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}