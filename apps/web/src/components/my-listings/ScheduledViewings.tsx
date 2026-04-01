'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Video, Phone, Home, Loader2,
  List, CalendarDays, Check, X, Quote,
} from 'lucide-react';
import { propertiesApi, viewingsApi, type ListingViewingRecord } from '@/lib/api-client';
import { ScheduleViewingModal } from './ScheduleViewingModal';

interface Props {
  propertyId: string;
  authToken: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];


function ViewingTypeIcon({ type }: { type: string }) {
  if (type === 'virtual') return <Video className="w-4 h-4 text-purple-600" />;
  if (type === 'phone') return <Phone className="w-4 h-4 text-blue-600" />;
  return <Home className="w-4 h-4 text-green-600" />;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'in-progress': return 'bg-amber-100 text-amber-700';
    case 'upcoming':    return 'bg-blue-100 text-blue-700';
    case 'requested':   return 'bg-yellow-100 text-yellow-700';
    case 'confirmed':   return 'bg-green-100 text-green-700';
    case 'completed':   return 'bg-gray-100 text-gray-600';
    case 'ended':       return 'bg-gray-100 text-gray-600';
    case 'declined':    return 'bg-red-100 text-red-700';
    case 'cancelled':   return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function chipClass(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-green-100 border-green-500 text-green-800';
    case 'requested': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    case 'completed': return 'bg-gray-100 border-gray-400 text-gray-700';
    case 'declined':  return 'bg-red-100 border-red-500 text-red-800';
    case 'cancelled': return 'bg-red-100 border-red-500 text-red-800';
    default: return 'bg-gray-100 border-gray-400 text-gray-700';
  }
}

const VIEWING_STATUS_LABELS: Record<string, string> = {
  'in-progress': 'In Progress',
  upcoming: 'Upcoming',
  confirmed: 'Confirmed',
  requested: 'Requested',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  ended: 'Ended',
};

function deriveViewingDisplayStatus(v: { status: string; scheduled_at: string; duration_minutes: number | null }) {
  if (v.status !== 'requested' && v.status !== 'confirmed') return v.status;
  const now = new Date();
  const start = new Date(v.scheduled_at);
  const durationMs = (v.duration_minutes ?? 60) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);
  if (now >= end) return 'ended';
  if (now >= start) return 'in-progress';
  return 'upcoming';
}

export function ScheduledViewings({ propertyId, authToken }: Props) {
  const router = useRouter();
  const [viewings, setViewings] = useState<ListingViewingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [calendarFilter, setCalendarFilter] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, 'confirming' | 'declining'>>({});

  useEffect(() => {
    if (!authToken) { setIsLoading(false); return; }
    setIsLoading(true);
    propertiesApi
      .getPropertyViewings(authToken, propertyId)
      .then(setViewings)
      .catch((err: Error) => setError(err.message || 'Failed to load viewings'))
      .finally(() => setIsLoading(false));
  }, [propertyId, authToken]);

  const getViewingsForDay = (date: Date) =>
    viewings.filter((v) => {
      const d = new Date(v.scheduled_at);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });

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

  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 text-sm">{error}</div>;
  }

  // Stat counts
  const confirmedCount  = viewings.filter((v) => v.status === 'confirmed').length;
  const pendingCount    = viewings.filter((v) => v.status === 'requested').length;
  const completedCount  = viewings.filter((v) => v.status === 'completed').length;
  const declinedCount   = viewings.filter((v) => v.status === 'declined' || v.status === 'cancelled').length;

  // Filtered list (respects stat-strip selection)
  const filteredViewings = statusFilter
    ? viewings.filter((v) => {
        if (statusFilter === 'declined') return v.status === 'declined' || v.status === 'cancelled';
        return v.status === statusFilter;
      })
    : viewings;

  const inProgress = filteredViewings.filter((v) => deriveViewingDisplayStatus(v) === 'in-progress');
  const upcoming   = filteredViewings.filter((v) => deriveViewingDisplayStatus(v) === 'upcoming');
  const past       = filteredViewings.filter((v) =>
    !['upcoming', 'in-progress'].includes(deriveViewingDisplayStatus(v)),
  );

  // Today spotlight
  const todayDate = new Date();
  const todayViewings = viewings.filter((v) => {
    const d = new Date(v.scheduled_at);
    return (
      d.getFullYear() === todayDate.getFullYear() &&
      d.getMonth() === todayDate.getMonth() &&
      d.getDate() === todayDate.getDate()
    );
  });

  // Calendar live-count chips
  const calMonthViewings = viewings.filter((v) => {
    const d = new Date(v.scheduled_at);
    return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
  });
  const calConfirmedCount = calMonthViewings.filter((v) => v.status === 'confirmed').length;
  const calPendingCount   = calMonthViewings.filter((v) => v.status === 'requested').length;
  const calPastCount      = calMonthViewings.filter((v) =>
    ['completed', 'declined', 'cancelled'].includes(v.status),
  ).length;

  const accentBarClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'requested': return 'bg-yellow-400';
      case 'completed': return 'bg-gray-400';
      case 'declined':
      case 'cancelled': return 'bg-red-400';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Scheduled Viewings ({viewings.length})</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm ${
                view === 'list' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm ${
                view === 'calendar' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Schedule
          </button>
        </div>
      </div>

      {/* Stat strip — 5 clickable filter tiles */}
      <div className="grid grid-cols-5 gap-3">
        {([
          { label: 'Total',     count: viewings.length, key: null,        color: 'text-gray-900',  ring: 'ring-blue-500'  },
          { label: 'Confirmed', count: confirmedCount,  key: 'confirmed', color: 'text-green-700', ring: 'ring-green-500' },
          { label: 'Pending',   count: pendingCount,    key: 'requested', color: 'text-yellow-700',ring: 'ring-yellow-500'},
          { label: 'Completed', count: completedCount,  key: 'completed', color: 'text-gray-600',  ring: 'ring-gray-400'  },
          { label: 'Declined',  count: declinedCount,   key: 'declined',  color: 'text-red-700',   ring: 'ring-red-500'   },
        ] as const).map(({ label, count, key, color, ring }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(statusFilter === key ? null : key)}
            className={`bg-white border rounded-xl p-3 text-center hover:shadow-sm transition-all ${
              statusFilter === key ? `ring-2 ${ring} border-transparent` : 'border-gray-200'
            }`}
          >
            <div className={`text-2xl font-bold ${color}`}>{count}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Today spotlight strip */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">Today&apos;s Viewings</span>
        </div>
        {todayViewings.length === 0 ? (
          <p className="text-sm text-blue-400 italic">No viewings scheduled for today.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {todayViewings.map((v) => {
              const dt = new Date(v.scheduled_at);
              const buyerName =
                [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || 'Buyer';
              const time = dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={v.id}
                  onClick={() => router.push(`/app/my-listings/${propertyId}/viewings/${v.id}`)}
                  className="flex-shrink-0 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:shadow-sm transition-shadow"
                >
                  <div className="font-semibold text-blue-800">{time}</div>
                  <div className="text-gray-600">{buyerName}</div>
                  <div className="text-xs text-gray-400 capitalize">{v.viewing_type.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewings.length === 0 && view === 'list' && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No viewings scheduled for this listing.</p>
        </div>
      )}

      {/* List view */}
      {view === 'list' && viewings.length > 0 && (
        <div className="space-y-6">
          {([
            { label: 'In Progress', color: 'text-amber-700', items: inProgress },
            { label: 'Upcoming',    color: 'text-blue-700',  items: upcoming   },
            { label: 'Past',        color: 'text-gray-500',  items: past       },
          ] as const).map(({ label, color, items }) =>
            items.length === 0 ? null : (
              <div key={label}>
                <h4 className={`text-sm font-semibold uppercase tracking-wide mb-2 ${color}`}>{label}</h4>
                <div className="space-y-3">
                  {items.map((v) => {
                    const dt = new Date(v.scheduled_at);
                    const buyerName =
                      [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || 'Unknown Buyer';
                    const time = dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                    const loadingAction = actionLoading[v.id];
                    return (
                      <div key={v.id}>
                        {/* Accent-bar card */}
                        <div
                          onClick={() => router.push(`/app/my-listings/${propertyId}/viewings/${v.id}`)}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer flex"
                        >
                          <div className={`w-1 flex-shrink-0 ${accentBarClass(v.status)}`} />
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-3">
                              {/* Large day/month */}
                              <div className="flex-shrink-0 text-center min-w-[40px]">
                                <div className="text-xs font-medium text-gray-400 uppercase">
                                  {MONTHS[dt.getMonth()].slice(0, 3)}
                                </div>
                                <div className="text-2xl font-bold text-gray-800 leading-tight">
                                  {dt.getDate()}
                                </div>
                              </div>
                              {/* Detail */}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate">{buyerName}</div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-500 flex-wrap">
                                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>{time}</span>
                                  {v.duration_minutes && (
                                    <><span>·</span><span>{v.duration_minutes} min</span></>
                                  )}
                                  <span>·</span>
                                  <ViewingTypeIcon type={v.viewing_type} />
                                  <span className="capitalize">{v.viewing_type.replace('_', ' ')}</span>
                                </div>
                              </div>
                              {/* Status + inline quick actions */}
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadgeClass(v.status)}`}
                                >
                                  {VIEWING_STATUS_LABELS[v.status] ?? v.status}
                                </span>
                                {v.status === 'requested' && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={(e) => handleConfirm(v.id, e)}
                                      disabled={!!loadingAction}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-300 text-green-700 text-xs rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                                    >
                                      {loadingAction === 'confirming'
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <Check className="w-3 h-3" />}
                                      Confirm
                                    </button>
                                    <button
                                      onClick={(e) => handleDecline(v.id, e)}
                                      disabled={!!loadingAction}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-300 text-red-700 text-xs rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                                    >
                                      {loadingAction === 'declining'
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <X className="w-3 h-3" />}
                                      Decline
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Feedback callout card */}
                        {v.status === 'completed' && v.buyer_feedback && (
                          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3 mt-0.5 flex items-start gap-2">
                            <Quote className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 italic">{v.buyer_feedback}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
                }
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold min-w-[180px] text-center">
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() =>
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
                }
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Live-count chip filters */}
            <div className="flex items-center gap-2">
              {([
                { label: 'Confirmed', count: calConfirmedCount, key: 'confirmed', dot: 'bg-green-500', active: 'bg-green-100 border-green-500 text-green-700' },
                { label: 'Pending',   count: calPendingCount,   key: 'requested', dot: 'bg-yellow-400', active: 'bg-yellow-100 border-yellow-500 text-yellow-700'},
                { label: 'Past',      count: calPastCount,      key: 'past',      dot: 'bg-gray-400',   active: 'bg-gray-100 border-gray-400 text-gray-700'     },
              ] as const).map(({ label, count, key, dot, active }) => (
                <button
                  key={key}
                  onClick={() => setCalendarFilter(calendarFilter === key ? null : key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    calendarFilter === key
                      ? active
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Compact calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Short day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 py-2 border-b border-gray-200"
              >
                {day}
              </div>
            ))}

            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[72px] bg-gray-50 border border-gray-100 rounded-lg" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              let dayViewings = getViewingsForDay(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
              );
              if (calendarFilter === 'confirmed') {
                dayViewings = dayViewings.filter((v) => v.status === 'confirmed');
              } else if (calendarFilter === 'requested') {
                dayViewings = dayViewings.filter((v) => v.status === 'requested');
              } else if (calendarFilter === 'past') {
                dayViewings = dayViewings.filter((v) =>
                  ['completed', 'declined', 'cancelled'].includes(v.status),
                );
              }
              const today        = isToday(day);
              const overflowCount  = dayViewings.length > 2 ? dayViewings.length - 2 : 0;
              const visibleViewings = dayViewings.slice(0, 2);

              return (
                <div
                  key={day}
                  className={`min-h-[72px] p-1.5 border rounded-lg transition-colors ${
                    today ? 'border-2 border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-end mb-1">
                    {today ? (
                      <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {day}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-600">{day}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {visibleViewings.map((v) => {
                      const dt   = new Date(v.scheduled_at);
                      const time = dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div
                          key={v.id}
                          onClick={() => router.push(`/app/my-listings/${propertyId}/viewings/${v.id}`)}
                          className={`rounded border-l-2 px-1 py-0.5 text-xs cursor-pointer truncate ${chipClass(v.status)}`}
                          title={time}
                        >
                          {time}
                        </div>
                      );
                    })}
                    {overflowCount > 0 && (
                      <div className="text-xs text-center text-gray-500 bg-gray-100 rounded px-1 py-0.5">
                        +{overflowCount} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ScheduleViewingModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
}
