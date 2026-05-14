// @ts-nocheck
"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  date: string;           // "YYYY-MM-DD"
  time: string;           // "9:00 AM – 11:00 AM"
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  attendees: number;
  maxAttendees?: number;
  views: number;
  price: string;
  type: string;
  agent: string;
}

type TimeGroup = 'live' | 'today' | 'week' | 'later' | 'completed';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  forest:    '#1A3C28',
  forest60:  'rgba(26,60,40,0.60)',
  forest30:  'rgba(26,60,40,0.30)',
  forest12:  'rgba(26,60,40,0.12)',
  forest06:  'rgba(26,60,40,0.06)',
  parchment: '#F2E8D5',
  terra:     '#C4562A',
  terra10:   'rgba(196,86,42,0.10)',
  terra20:   'rgba(196,86,42,0.20)',
  egreen:    '#00E87A',
  egreen10:  'rgba(0,232,122,0.10)',
  egreen20:  'rgba(0,232,122,0.20)',
  amber:     '#B89040',
  amber12:   'rgba(184,144,64,0.12)',
  amber20:   'rgba(184,144,64,0.20)',
  white:     '#ffffff',
} as const;

const statusConfig = {
  scheduled: { label: 'Scheduled', bg: 'rgba(26,60,40,0.06)',   color: '#1A3C28', border: 'rgba(26,60,40,0.12)'  },
  live:      { label: 'Live Now',  bg: 'rgba(196,86,42,0.10)',  color: '#C4562A', border: 'rgba(196,86,42,0.20)' },
  completed: { label: 'Completed', bg: 'rgba(0,232,122,0.10)',  color: '#1a6640', border: 'rgba(0,232,122,0.20)' },
  cancelled: { label: 'Cancelled', bg: 'rgba(184,144,64,0.12)', color: '#B89040', border: 'rgba(184,144,64,0.20)' },
};

// ─── Time grouping ────────────────────────────────────────────────────────────
const SECTION_ORDER: TimeGroup[] = ['live', 'today', 'week', 'later', 'completed'];
const SECTION_META: Record<TimeGroup, { label: string; color: string; pulse?: boolean }> = {
  live:      { label: 'Live Now',           color: '#C4562A', pulse: true },
  today:     { label: 'Today',              color: 'rgba(26,60,40,0.60)' },
  week:      { label: 'This Week',          color: 'rgba(26,60,40,0.60)' },
  later:     { label: 'Later',              color: 'rgba(26,60,40,0.60)' },
  completed: { label: 'Recently Completed', color: 'rgba(26,60,40,0.30)' },
};

function getTimeGroup(event: Property): TimeGroup {
  if (event.status === 'live') return 'live';
  if (event.status === 'completed' || event.status === 'cancelled') return 'completed';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date + 'T00:00:00');
  const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'completed';
  if (diffDays === 0) return 'today';
  if (diffDays <= 6) return 'week';
  return 'later';
}

function fmtDayAbbr(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}
function fmtDateShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
function isEventToday(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d.getTime() === today.getTime();
}

// ─── LiveDot ──────────────────────────────────────────────────────────────────
function LiveDot({ small }: { small?: boolean }) {
  const size = small ? '6px' : '8px';
  return (
    <span style={{
      display: 'inline-block', flexShrink: 0,
      width: size, height: size, borderRadius: '50%',
      background: '#C4562A',
      animation: 'oh-pulse 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
    }} />
  );
}

// ─── IconBtn ──────────────────────────────────────────────────────────────────
function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: '30px', height: '30px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '7px', border: '1px solid transparent',
      background: 'transparent', cursor: 'pointer', color: 'rgba(26,60,40,0.60)',
    }}>
      {children}
    </button>
  );
}

// ─── CapacityBar ──────────────────────────────────────────────────────────────
function CapacityBar({ attendees, maxAttendees }: { attendees: number; maxAttendees: number }) {
  const pct = Math.min(Math.round((attendees / maxAttendees) * 100), 100);
  const color = pct >= 85 ? '#C4562A' : pct >= 40 ? '#B89040' : '#00E87A';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.03em', color: 'rgba(26,60,40,0.30)' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      </svg>
      {attendees} / {maxAttendees}
      <div style={{ width: '36px', height: '4px', background: 'rgba(26,60,40,0.06)', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px' }} />
      </div>
      <span style={{ color, minWidth: '26px' }}>{pct}%</span>
    </span>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ event, dimmed }: { event: Property; dimmed?: boolean }) {
  const router = useRouter();
  const isLive = event.status === 'live';
  const cfg = statusConfig[event.status] ?? statusConfig.scheduled;
  const showAsToday = isLive || isEventToday(event.date);

  const timeStart = (event.time ?? '').split('–')[0]?.trim() ?? '';
  const ampmMatch = timeStart.match(/^(\d+)(?::(\d+))?\s*(AM|PM)/i);
  const timeHour = ampmMatch ? ampmMatch[1] : timeStart;
  const timeAmPm = ampmMatch ? ampmMatch[3].toUpperCase() : '';

  return (
    <div
      style={{
        background: isLive ? `linear-gradient(to right, rgba(196,86,42,0.03) 0%, #fff 100px)` : '#fff',
        border: `1.5px solid ${isLive ? 'rgba(196,86,42,0.20)' : 'rgba(26,60,40,0.12)'}`,
        borderRadius: '12px',
        display: 'grid',
        gridTemplateColumns: '52px 1fr auto',
        alignItems: 'center',
        overflow: 'hidden',
        opacity: dimmed ? 0.62 : 1,
        cursor: 'pointer',
      }}
      onClick={() => router.push(`/app/open-houses/events/${event.id}`)}
    >
      {/* Time / Day column */}
      <div style={{
        padding: '14px 0', textAlign: 'center',
        borderRight: '1px solid rgba(26,60,40,0.06)',
        alignSelf: 'stretch',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {showAsToday ? (
          <>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.05rem', fontWeight: 600, color: isLive ? '#C4562A' : '#1A3C28', lineHeight: 1 }}>
              {timeHour || '◆'}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.5rem', color: isLive ? '#C4562A' : 'rgba(26,60,40,0.30)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>
              {timeAmPm}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.62rem', fontWeight: 500, color: 'rgba(26,60,40,0.60)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {fmtDayAbbr(event.date)}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.5rem', color: 'rgba(26,60,40,0.30)', letterSpacing: '0.04em', marginTop: '2px' }}>
              {fmtDateShort(event.date)}
            </div>
          </>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px', minWidth: 0 }}>
        <div style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif', fontSize: '0.88rem', fontWeight: 600, color: '#1A3C28', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '5px' }}>
          {event.address}{event.city ? `, ${event.city}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 9px', borderRadius: '50px',
            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
            fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.55rem', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
          }}>
            {isLive && <LiveDot small />}
            {cfg.label}
          </span>
          {/* Time range */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.03em', color: 'rgba(26,60,40,0.30)', whiteSpace: 'nowrap' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {event.time}
          </span>
          {/* Capacity */}
          {event.maxAttendees && event.maxAttendees > 0 ? (
            <CapacityBar attendees={event.attendees} maxAttendees={event.maxAttendees} />
          ) : event.attendees > 0 ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.58rem', color: 'rgba(26,60,40,0.30)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              {event.attendees} attending
            </span>
          ) : null}
          {/* Price */}
          {event.price && event.price !== '—' && (
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.58rem', color: '#B89040', letterSpacing: '0.02em' }}>{event.price}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '12px 12px 12px 6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <IconBtn onClick={e => { e.stopPropagation(); router.push(`/app/open-houses/events/${event.id}`); }} title="View event">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </IconBtn>
        {!dimmed && (
          <IconBtn title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </IconBtn>
        )}
        <IconBtn title="More options">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </IconBtn>
      </div>
    </div>
  );
}

// ─── TimelineView ─────────────────────────────────────────────────────────────
function TimelineView({ groups }: { groups: Record<TimeGroup, Property[]> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {SECTION_ORDER.map(group => {
        const events = groups[group];
        if (!events || !events.length) return null;
        const meta = SECTION_META[group];
        return (
          <div key={group}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              {meta.pulse && <LiveDot />}
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: meta.color, whiteSpace: 'nowrap' }}>
                {meta.label}
              </span>
              <div style={{ height: '1px', flex: 1, background: 'rgba(26,60,40,0.12)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {events.map(event => (
                <EventCard key={event.id} event={event} dimmed={group === 'completed'} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── GridView ─────────────────────────────────────────────────────────────────
function GridView({ events }: { events: Property[] }) {
  const router = useRouter();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
      {events.map(event => {
        const isLive = event.status === 'live';
        const cfg = statusConfig[event.status] ?? statusConfig.scheduled;
        const capPct = (event.maxAttendees && event.maxAttendees > 0)
          ? Math.min(Math.round((event.attendees / event.maxAttendees) * 100), 100)
          : 0;
        const capColor = capPct >= 85 ? '#C4562A' : capPct >= 40 ? '#B89040' : '#00E87A';
        return (
          <div
            key={event.id}
            style={{
              background: isLive ? `linear-gradient(135deg, rgba(196,86,42,0.04) 0%, #fff 100%)` : '#fff',
              border: `1.5px solid ${isLive ? 'rgba(196,86,42,0.20)' : 'rgba(26,60,40,0.12)'}`,
              borderRadius: '12px', padding: '16px', cursor: 'pointer',
            }}
            onClick={() => router.push(`/app/open-houses/events/${event.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                <div style={{ fontFamily: 'IBM Plex Sans, system-ui', fontSize: '0.85rem', fontWeight: 600, color: '#1A3C28', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {event.address}
                </div>
                {event.city && (
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.56rem', color: 'rgba(26,60,40,0.30)', letterSpacing: '0.04em', marginTop: '2px' }}>{event.city}</div>
                )}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '50px',
                background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
                fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.52rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
              }}>
                {isLive && <LiveDot small />}
                {cfg.label}
              </span>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.58rem', color: 'rgba(26,60,40,0.60)', letterSpacing: '0.03em', marginBottom: '10px' }}>
              {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.time}
            </div>
            {event.maxAttendees && event.maxAttendees > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.52rem', color: 'rgba(26,60,40,0.30)', marginBottom: '4px' }}>
                  <span>{event.attendees} / {event.maxAttendees} registered</span>
                  <span style={{ color: capColor }}>{capPct}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(26,60,40,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${capPct}%`, background: capColor, borderRadius: '4px' }} />
                </div>
              </div>
            )}
            {event.price && event.price !== '—' && (
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.6rem', color: '#B89040', letterSpacing: '0.03em', marginBottom: '12px' }}>{event.price}</div>
            )}
            <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => router.push(`/app/open-houses/events/${event.id}`)}
                style={{ flex: 1, padding: '8px', background: '#1A3C28', color: '#F2E8D5', border: 'none', borderRadius: '8px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                View Details
              </button>
              <button style={{ padding: '8px 10px', background: 'rgba(26,60,40,0.06)', border: '1px solid rgba(26,60,40,0.12)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(26,60,40,0.60)', display: 'flex', alignItems: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── StatusStrip ─────────────────────────────────────────────────────────────
function StatusStrip({ counts }: { counts: { live: number; today: number; week: number; completed: number } }) {
  const pills = [
    { count: counts.live,      label: 'Live Now',  bg: 'rgba(196,86,42,0.10)',  border: 'rgba(196,86,42,0.20)',  color: '#C4562A', pulse: true  },
    { count: counts.today,     label: 'Today',     bg: 'rgba(26,60,40,0.06)',   border: 'rgba(26,60,40,0.12)',   color: '#1A3C28'              },
    { count: counts.week,      label: 'This Week', bg: 'rgba(184,144,64,0.12)', border: 'rgba(184,144,64,0.20)', color: '#B89040'              },
    { count: counts.completed, label: 'Completed', bg: 'rgba(0,232,122,0.10)',  border: 'rgba(0,232,122,0.20)',  color: '#1a6640'              },
  ];
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {pills.map(pill => (
        <div key={pill.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '50px', background: pill.bg, border: `1.5px solid ${pill.border}` }}>
          {pill.pulse && <LiveDot />}
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: pill.color }}>{pill.count}</span>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.10em', textTransform: 'uppercase', color: pill.color }}>{pill.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────
const FILTER_CHIPS = [
  { key: 'all',       label: 'All',       dot: '#C4562A'  },
  { key: 'live',      label: 'Live',      dot: '#C4562A'  },
  { key: 'scheduled', label: 'Scheduled', dot: '#1A3C28'  },
  { key: 'completed', label: 'Completed', dot: '#1a6640'  },
  { key: 'cancelled', label: 'Cancelled', dot: '#B89040'  },
] as const;

function Toolbar({ searchQuery, onSearch, statusFilter, onStatusFilter, viewMode, onViewMode }: {
  searchQuery: string; onSearch: (q: string) => void;
  statusFilter: string; onStatusFilter: (s: string) => void;
  viewMode: 'timeline' | 'grid'; onViewMode: (m: 'timeline' | 'grid') => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {/* Search */}
      <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
        <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'rgba(26,60,40,0.30)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search address, suburb…"
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 34px', background: 'rgba(26,60,40,0.05)', border: '1.5px solid rgba(26,60,40,0.12)', borderRadius: '9px', fontFamily: 'IBM Plex Sans, system-ui, sans-serif', fontSize: '0.82rem', color: '#1A3C28', outline: 'none' }}
        />
      </div>
      {/* Filter chips */}
      {FILTER_CHIPS.map(chip => {
        const active = statusFilter === chip.key;
        return (
          <button
            key={chip.key}
            onClick={() => onStatusFilter(chip.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', border: `1.5px solid ${active ? '#1A3C28' : 'rgba(26,60,40,0.12)'}`, borderRadius: '9px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: active ? '#F2E8D5' : 'rgba(26,60,40,0.60)', background: active ? '#1A3C28' : 'transparent', cursor: 'pointer' }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? '#F2E8D5' : chip.dot, flexShrink: 0 }} />
            {chip.label}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      {/* View toggle */}
      <div style={{ display: 'flex', background: 'rgba(26,60,40,0.06)', border: '1.5px solid rgba(26,60,40,0.12)', borderRadius: '9px', padding: '3px', gap: '2px' }}>
        {(['timeline', 'grid'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onViewMode(mode)}
            style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: viewMode === mode ? '#1A3C28' : 'transparent', color: viewMode === mode ? '#F2E8D5' : 'rgba(26,60,40,0.30)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {mode}
          </button>
        ))}
      </div>
      {/* Schedule CTA */}
      <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: '#C4562A', color: '#fff', border: 'none', borderRadius: '9px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>
        Schedule Event
      </button>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px', background: 'rgba(26,60,40,0.03)', border: '1.5px dashed rgba(26,60,40,0.12)', borderRadius: '16px' }}>
      <div style={{ width: '48px', height: '48px', background: 'rgba(26,60,40,0.04)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A3C28" strokeWidth={1.5} opacity={0.4}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.05rem', fontWeight: 600, color: '#1A3C28', marginBottom: '6px' }}>No open houses yet</div>
      <div style={{ fontFamily: 'IBM Plex Sans, system-ui', fontSize: '0.78rem', color: 'rgba(26,60,40,0.60)', marginBottom: '18px' }}>Schedule your first event to start capturing leads</div>
      <button style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', background: '#C4562A', color: '#fff', border: 'none', borderRadius: '9px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>
        Schedule Open House
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function PropertyListView({ properties = [], loading, error }: { properties?: Property[]; loading: boolean; error: string | null }) {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 0', color: 'rgba(26,60,40,0.30)' }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.72rem', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Loading events…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 0', color: '#C4562A' }}>
        <span style={{ fontFamily: 'IBM Plex Sans, system-ui', fontSize: '0.85rem' }}>{error}</span>
      </div>
    );
  }

  const filtered = properties.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    live:      filtered.filter(p => p.status === 'live').length,
    today:     filtered.filter(p => getTimeGroup(p) === 'today').length,
    week:      filtered.filter(p => getTimeGroup(p) === 'week').length,
    completed: filtered.filter(p => p.status === 'completed').length,
  };

  const groups = SECTION_ORDER.reduce((acc, g) => {
    acc[g] = filtered.filter(p => getTimeGroup(p) === g);
    return acc;
  }, {} as Record<TimeGroup, Property[]>);

  return (
    <>
      <style>{`
        @keyframes oh-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(196,86,42,0.50); }
          70%  { box-shadow: 0 0 0 7px rgba(196,86,42,0); }
          100% { box-shadow: 0 0 0 0 rgba(196,86,42,0); }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Toolbar
          searchQuery={searchQuery}   onSearch={setSearchQuery}
          statusFilter={statusFilter} onStatusFilter={setStatusFilter}
          viewMode={viewMode}         onViewMode={setViewMode}
        />
        <StatusStrip counts={counts} />
        {filtered.length === 0 && <EmptyState />}
        {filtered.length > 0 && viewMode === 'timeline' && <TimelineView groups={groups} />}
        {filtered.length > 0 && viewMode === 'grid'     && <GridView events={filtered} />}
      </div>
    </>
  );
}
