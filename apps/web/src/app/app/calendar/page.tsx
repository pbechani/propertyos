'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal, X, Clock, Home, CalendarDays, Tag } from 'lucide-react';
import { agentApi, type ViewingResponse, type OpenHouseRecord } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { NewEventModal } from '@/components/my-listings/NewEventModal';

// ── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  forest:    '#1A3C28',
  parchment: '#F2E8D5',
  cream:     '#EAD9C4',
  terra:     '#C4562A',
  egreen:    '#00E87A',
  amber:     '#B89040',
};

// ── Types ────────────────────────────────────────────────────────────────────
type EventKind = 'viewing' | 'open-house';

interface CalendarEvent {
  id: string;
  kind: EventKind;
  title: string;
  propertyTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function buildGrid(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();
  const startDow = firstDay.getDay();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevLastDate - i), isCurrentMonth: false });
  }
  for (let i = 1; i <= lastDate; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return days;
}

// ── Event Detail Dialog ───────────────────────────────────────────────────────
function EventDetailDialog({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const isViewing = event.kind === 'viewing';
  const accentColor = isViewing ? C.forest : C.terra;
  const endTime = new Date(event.scheduledAt.getTime() + event.durationMinutes * 60_000);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12,13,16,0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.parchment,
          borderRadius: 14,
          width: 420,
          maxWidth: 'calc(100vw - 2rem)',
          boxShadow: '0 24px 48px rgba(12,13,16,0.22)',
          overflow: 'hidden',
        }}
      >
        {/* Header stripe */}
        <div
          style={{
            background: accentColor,
            padding: '18px 20px 16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              fontSize: '0.63rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isViewing ? C.egreen : 'rgba(255,255,255,0.6)',
              marginBottom: 5,
            }}
          >
            {isViewing ? 'Property Viewing' : 'Open House'}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
              fontSize: '1.35rem',
              color: '#fff',
              fontWeight: 300,
              lineHeight: 1.2,
              paddingRight: 36,
            }}
          >
            {event.title}
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 28,
              height: 28,
              borderRadius: 7,
              border: 'none',
              background: 'rgba(255,255,255,0.18)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px 4px' }}>
          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <CalendarDays size={14} color="rgba(26,60,40,0.42)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: '0.6rem', color: 'rgba(26,60,40,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                Date
              </div>
              <div style={{ fontSize: '0.82rem', color: C.forest, fontWeight: 500 }}>
                {event.scheduledAt.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <Clock size={14} color="rgba(26,60,40,0.42)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: '0.6rem', color: 'rgba(26,60,40,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                Time
              </div>
              <div style={{ fontSize: '0.82rem', color: C.forest, fontWeight: 500 }}>
                {formatTime(event.scheduledAt)} – {formatTime(endTime)}{' '}
                <span style={{ color: 'rgba(26,60,40,0.42)', fontWeight: 400 }}>({event.durationMinutes} min)</span>
              </div>
            </div>
          </div>

          {/* Property */}
          {event.propertyTitle && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
              <Home size={14} color="rgba(26,60,40,0.42)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: '0.6rem', color: 'rgba(26,60,40,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  Property
                </div>
                <div style={{ fontSize: '0.82rem', color: C.forest, fontWeight: 500 }}>{event.propertyTitle}</div>
              </div>
            </div>
          )}

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
            <Tag size={14} color="rgba(26,60,40,0.42)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: '0.6rem', color: 'rgba(26,60,40,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Status
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: 20,
                  textTransform: 'capitalize',
                  background: event.status === 'cancelled' ? 'rgba(196,86,42,0.10)' : event.status === 'completed' ? 'rgba(0,232,122,0.12)' : 'rgba(26,60,40,0.08)',
                  color: event.status === 'cancelled' ? C.terra : event.status === 'completed' ? '#00a855' : C.forest,
                }}
              >
                {event.status}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px 18px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 20px',
              borderRadius: 8,
              background: C.forest,
              color: C.egreen,
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AgentCalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleNewEvent = (date?: Date) => {
    setSelectedDate(date);
    setShowNewEventModal(true);
  };

  const handleSaveEvent = (eventData: unknown) => {
    console.log('New event:', eventData);
    fetchEvents(currentDate);
  };

  const fetchEvents = useCallback((md: Date) => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const from = new Date(md.getFullYear(), md.getMonth(), 1).toISOString();
    const to   = new Date(md.getFullYear(), md.getMonth() + 1, 0, 23, 59, 59).toISOString();

    setLoading(true);
    setError('');

    Promise.all([
      agentApi.getViewings(token, from, to),
      agentApi.getOpenHouses(token),
    ])
      .then(([viewings, openHouses]) => {
        const vEvents: CalendarEvent[] = (viewings ?? []).map((v: ViewingResponse) => ({
          id: v.id,
          kind: 'viewing',
          title: v.property_title ?? 'Viewing',
          propertyTitle: v.property_title ?? '',
          scheduledAt: new Date(v.scheduled_at),
          durationMinutes: v.duration_minutes ?? 60,
          status: v.status,
        }));

        const ohEvents: CalendarEvent[] = (openHouses ?? []).map((oh: OpenHouseRecord) => ({
          id: oh.id,
          kind: 'open-house',
          title: oh.property_title ?? 'Open House',
          propertyTitle: oh.property_title ?? '',
          scheduledAt: new Date(oh.scheduled_at),
          durationMinutes: Math.round(
            (new Date(oh.end_at).getTime() - new Date(oh.scheduled_at).getTime()) / 60_000,
          ),
          status: oh.status,
        }));

        setEvents([...vEvents, ...ohEvents]);
      })
      .catch((err: Error) => setError(err.message ?? 'Failed to load calendar events'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate, fetchEvents]);

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const gridDays = buildGrid(currentDate.getFullYear(), currentDate.getMonth());

  const getEventsForDay = (date: Date) =>
    events
      .filter((e) => isSameDay(e.scheduledAt, date))
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  const todayEvents = getEventsForDay(today).slice(0, 5);
  const viewingCount = events.filter((e) => e.kind === 'viewing').length;
  const ohCount      = events.filter((e) => e.kind === 'open-house').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        height: '100%',
        background: C.parchment,
        paddingLeft: '1.75rem',
        paddingRight: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: '1px solid rgba(26,60,40,0.1)',
          paddingTop: '1rem',
          paddingBottom: '0.875rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
              fontSize: '1.75rem',
              color: C.forest,
              fontWeight: 400,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            My Calendar
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              fontSize: '0.68rem',
              color: 'rgba(26,60,40,0.45)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: '0.2rem',
              marginBottom: 0,
            }}
          >
            Agent Cockpit &middot;{' '}
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid rgba(26,60,40,0.15)',
              background: 'transparent',
              fontSize: '0.78rem',
              color: 'rgba(26,60,40,0.55)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={13} />
            Filter
          </button>
          <button
            onClick={() => handleNewEvent()}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              background: C.forest,
              color: C.egreen,
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <Plus size={14} />
            New Event
          </button>
        </div>
      </div>

      {/* ── Body split ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, gap: 0, minHeight: 0, overflow: 'hidden' }}>

        {/* Left: calendar ─────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingRight: '1.25rem',
            paddingBottom: '1.5rem',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {/* Month nav row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              paddingBottom: '0.625rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={prevMonth}
                style={{
                  width: 29,
                  height: 29,
                  borderRadius: 7,
                  background: 'rgba(26,60,40,0.07)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={14} color={C.forest} />
              </button>
              <span
                style={{
                  fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
                  fontSize: '1.1rem',
                  color: C.forest,
                  fontWeight: 300,
                  minWidth: 170,
                }}
              >
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button
                onClick={nextMonth}
                style={{
                  width: 29,
                  height: 29,
                  borderRadius: 7,
                  background: 'rgba(26,60,40,0.07)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={14} color={C.forest} />
              </button>
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', gap: 3 }}>
              {(['month', 'week', 'day'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '4px 11px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.73rem',
                    fontWeight: 500,
                    background: view === v ? C.forest : 'transparent',
                    color: view === v ? C.egreen : 'rgba(26,60,40,0.45)',
                    transition: 'background 0.15s',
                  }}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(196,86,42,0.07)',
                border: '1px solid rgba(196,86,42,0.2)',
                color: C.terra,
                fontSize: '0.78rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                  fontSize: '0.67rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(26,60,40,0.4)',
                  padding: '6px 0',
                  borderBottom: '1px solid rgba(26,60,40,0.08)',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
              }}
            >
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    minHeight: 90,
                    background:
                      i % 7 === 0
                        ? 'rgba(234,217,196,0.6)'
                        : 'rgba(242,232,213,0.6)',
                    borderBottom: '1px solid rgba(26,60,40,0.07)',
                    borderRight: '1px solid rgba(26,60,40,0.07)',
                    padding: '6px',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 10,
                      borderRadius: 3,
                      background: 'rgba(26,60,40,0.08)',
                      marginBottom: 6,
                    }}
                  />
                  {i % 3 === 0 && (
                    <div
                      style={{
                        height: 10,
                        borderRadius: 3,
                        background: 'rgba(26,60,40,0.06)',
                        marginBottom: 3,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {gridDays.map((day, idx) => {
                const dayEvents  = getEventsForDay(day.date);
                const isToday    = isSameDay(day.date, today);
                const isWeekend  = day.date.getDay() === 0 || day.date.getDay() === 6;

                return (
                  <div
                    key={idx}
                    style={{
                      minHeight: 90,
                      padding: '5px 6px 4px',
                      background: day.isCurrentMonth
                        ? isToday
                          ? 'rgba(196,86,42,0.04)'
                          : isWeekend
                            ? 'rgba(234,217,196,0.55)'
                            : C.parchment
                        : 'rgba(225,210,188,0.45)',
                      borderBottom: '1px solid rgba(26,60,40,0.07)',
                      borderRight:
                        (idx + 1) % 7 === 0
                          ? 'none'
                          : '1px solid rgba(26,60,40,0.07)',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Date number */}
                    {isToday ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          width: 23,
                          height: 23,
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: C.terra,
                          color: '#fff',
                          borderRadius: '50%',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          marginBottom: 3,
                        }}
                      >
                        {day.date.getDate()}
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          width: 23,
                          height: 23,
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: day.isCurrentMonth ? 500 : 400,
                          color: day.isCurrentMonth
                            ? C.forest
                            : 'rgba(26,60,40,0.28)',
                          marginBottom: 3,
                        }}
                      >
                        {day.date.getDate()}
                      </span>
                    )}

                    {/* Event pills */}
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        title={`${formatTime(ev.scheduledAt)} · ${ev.title}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                        style={{ cursor: 'pointer',
                          display: 'block',
                          fontSize: '0.67rem',
                          padding: '2px 4px',
                          marginBottom: 2,
                          borderRadius: '0 3px 3px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.45,
                          ...(ev.kind === 'viewing'
                            ? {
                                borderLeft: `2px solid ${C.forest}`,
                                background: 'rgba(26,60,40,0.09)',
                                color: C.forest,
                              }
                            : {
                                borderLeft: `2px solid ${C.terra}`,
                                background: 'rgba(196,86,42,0.09)',
                                color: C.terra,
                              }),
                        }}
                      >
                        {formatTime(ev.scheduledAt)}&nbsp;{ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div
                        style={{
                          fontSize: '0.62rem',
                          color: 'rgba(26,60,40,0.4)',
                          paddingLeft: 4,
                        }}
                      >
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: forest panel ─────────────────────────────────────────────── */}
        <div
          style={{
            width: 236,
            flexShrink: 0,
            background: C.forest,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Big date display */}
          <div
            style={{
              padding: '20px 18px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.09)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                fontSize: '0.63rem',
                color: 'rgba(255,255,255,0.38)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 5,
              }}
            >
              Today
            </div>
            <div
              style={{
                fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
                fontSize: '3.75rem',
                color: '#fff',
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              {today.getDate()}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                fontSize: '0.63rem',
                color: 'rgba(255,255,255,0.42)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: 6,
              }}
            >
              {DAY_NAMES[today.getDay()]} · {MONTH_NAMES[today.getMonth()]}{' '}
              {today.getFullYear()}
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: 9,
                background: 'rgba(0,232,122,0.13)',
                border: '1px solid rgba(0,232,122,0.28)',
                color: C.egreen,
                fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 3,
              }}
            >
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
          </div>

          {/* Today's event list */}
          <div
            style={{
              padding: '12px 16px',
              flex: 1,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                fontSize: '0.62rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.32)',
                marginBottom: 10,
              }}
            >
              {loading
                ? 'Loading…'
                : todayEvents.length === 0
                  ? 'No events today'
                  : `${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today`}
            </div>

            {!loading && todayEvents.length === 0 && (
              <p
                style={{
                  fontSize: '0.76rem',
                  color: 'rgba(255,255,255,0.28)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Clear schedule — enjoy the day.
              </p>
            )}

            {todayEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 8,
                  padding: '9px 10px',
                  marginBottom: 8,
                  borderLeft: `3px solid ${ev.kind === 'viewing' ? C.egreen : C.terra}`,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                    fontSize: '0.62rem',
                    color: 'rgba(255,255,255,0.38)',
                    marginBottom: 2,
                  }}
                >
                  {formatTime(ev.scheduledAt)} · {ev.durationMinutes} min
                </div>
                <div
                  style={{
                    fontSize: '0.77rem',
                    fontWeight: 600,
                    color: '#fff',
                    marginBottom: 2,
                  }}
                >
                  {ev.kind === 'viewing' ? 'Viewing' : 'Open House'}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.42)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ev.propertyTitle}
                </div>
              </div>
            ))}
          </div>

          {/* Mini stats */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
            }}
          >
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
                  fontSize: '1.5rem',
                  color: C.egreen,
                  fontWeight: 300,
                  lineHeight: 1,
                }}
              >
                {viewingCount}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                  fontSize: '0.57rem',
                  color: 'rgba(255,255,255,0.32)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginTop: 3,
                }}
              >
                Viewings
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
                  fontSize: '1.5rem',
                  color: '#fff',
                  fontWeight: 300,
                  lineHeight: 1,
                }}
              >
                {ohCount}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                  fontSize: '0.57rem',
                  color: 'rgba(255,255,255,0.32)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginTop: 3,
                }}
              >
                Open Houses
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
                  fontSize: '1.5rem',
                  color: '#fff',
                  fontWeight: 300,
                  lineHeight: 1,
                }}
              >
                {viewingCount + ohCount}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                  fontSize: '0.57rem',
                  color: 'rgba(255,255,255,0.32)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginTop: 3,
                }}
              >
                Total
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      <NewEventModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
}
