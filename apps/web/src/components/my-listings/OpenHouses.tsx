'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, LayoutGrid, List, Loader2, Users,
  CheckSquare, Square,
} from 'lucide-react';
import { propertiesApi, type OpenHouseRecord } from '@/lib/api-client';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useRouter } from 'next/navigation';
import { ScheduleOpenHouseModal } from './ScheduleOpenHouseModal';

interface Props {
  propertyId: string;
  authToken: string;
  propertyAddress?: string;
  currentAgentName?: string;
}

type OpenHouseViewMode = 'list' | 'calendar';

const CALENDAR_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameMonth(date: Date, month: Date) {
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

function isToday(value: Date) {
  const now = new Date();
  return now.getFullYear() === value.getFullYear()
    && now.getMonth() === value.getMonth()
    && now.getDate() === value.getDate();
}

function formatCalendarDateLabel(value: Date) {
  return value.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function statusColor(status: string) {
  switch (status) {
    case 'upcoming': return 'bg-blue-100 text-blue-700';
    case 'in-progress': return 'bg-amber-100 text-amber-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    case 'ended': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
}

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Upcoming',
  'in-progress': 'In Progress',
  ended: 'Ended',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function deriveDisplayStatus(oh: OpenHouseRecord): 'upcoming' | 'in-progress' | 'ended' | 'completed' | 'cancelled' {
  if (oh.status !== 'scheduled') return oh.status as 'completed' | 'cancelled';
  const now = new Date();
  const end = new Date(oh.end_at);
  const start = new Date(oh.scheduled_at);
  if (now >= end) return 'ended';
  if (now >= start) return 'in-progress';
  return 'upcoming';
}

const CHANNEL_COLORS: Record<string, string> = {
  facebook:  'bg-blue-100 text-blue-700',
  instagram: 'bg-pink-100 text-pink-700',
  whatsapp:  'bg-green-100 text-green-700',
  email:     'bg-gray-100 text-gray-600',
  portal:    'bg-purple-100 text-purple-700',
  twitter:   'bg-sky-100 text-sky-700',
  sms:       'bg-orange-100 text-orange-700',
};

function durationLabel(startDate: Date, endDate: Date): string {
  const mins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

function accentBarColor(status: string) {
  switch (status) {
    case 'upcoming':    return 'bg-blue-500';
    case 'in-progress': return 'bg-amber-400';
    case 'completed':   return 'bg-green-500';
    case 'ended':       return 'bg-gray-400';
    case 'cancelled':   return 'bg-red-400';
    default:            return 'bg-gray-300';
  }
}

function OpenHouseCard({ oh, onClick }: { oh: OpenHouseRecord; onClick: () => void }) {
  const start = new Date(oh.scheduled_at);
  const end = new Date(oh.end_at);
  const displayStatus = deriveDisplayStatus(oh);
  const dur = durationLabel(start, end);

  // Suggestion 3 — checklist progress
  const totalTasks     = oh.preparation_checklist?.length ?? 0;
  const completedTasks = oh.preparation_checklist?.filter((t) => t.completed).length ?? 0;
  const checklistPct   = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : -1;
  const barColor       = checklistPct === 100
    ? 'bg-green-500'
    : checklistPct >= 50
      ? 'bg-blue-500'
      : 'bg-amber-400';

  // Suggestion 4 — marketing channels
  const enabledChannels  = oh.marketing_options?.filter((m) => m.enabled) ?? [];
  const disabledChannels = oh.marketing_options?.filter((m) => !m.enabled) ?? [];

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 hover:shadow-sm transition-all text-left flex"
    >
      {/* Suggestion 5 accent bar */}
      <div className={`w-1 shrink-0 ${accentBarColor(displayStatus)}`} />

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Large day/month */}
          <div className="shrink-0 text-center min-w-[40px]">
            <div className="text-xs font-medium text-gray-400 uppercase">
              {start.toLocaleDateString('en-ZA', { month: 'short' })}
            </div>
            <div className="text-2xl font-bold text-gray-800 leading-tight">{start.getDate()}</div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900">Open House</div>

            {/* Suggestion 5 — duration pill + capacity gauge */}
            <div className="flex items-center flex-wrap gap-2 mt-0.5 text-sm text-gray-500">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {start.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {end.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{dur}</span>
              {oh.max_attendees != null && (
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${
                  oh.max_attendees === 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Users className="w-3 h-3" />
                  0 / {oh.max_attendees}
                </span>
              )}
            </div>

            {oh.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{oh.description}</p>
            )}

            {/* Suggestion 3 — checklist progress bar */}
            {checklistPct >= 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  {checklistPct === 100
                    ? <CheckSquare className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    : <Square className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${checklistPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {completedTasks}/{totalTasks} ready
                  </span>
                </div>
              </div>
            )}

            {/* Suggestion 4 — marketing channel badges */}
            {(enabledChannels.length > 0 || disabledChannels.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {enabledChannels.map((m) => (
                  <span
                    key={m.channel}
                    className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                      CHANNEL_COLORS[m.channel.toLowerCase()] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {m.channel}
                  </span>
                ))}
                {disabledChannels.map((m) => (
                  <span
                    key={m.channel}
                    className="text-xs px-1.5 py-0.5 rounded capitalize bg-gray-50 text-gray-300 line-through"
                  >
                    {m.channel}
                  </span>
                ))}
              </div>
            )}
          </div>

          <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${statusColor(displayStatus)}`}>
            {STATUS_LABELS[displayStatus] ?? displayStatus}
          </span>
        </div>
      </div>
    </button>
  );
}

export function OpenHouses({ propertyId, authToken, propertyAddress, currentAgentName }: Props) {
  const [openHouses, setOpenHouses] = useState<OpenHouseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<OpenHouseViewMode>('list');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const router = useRouter();
  const [editingOpenHouse, setEditingOpenHouse] = useState<OpenHouseRecord | null>(null);
  // Suggestion 1 — clickable stat filter
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const loadOpenHouses = () => {
    setIsLoading(true);
    propertiesApi
      .getPropertyOpenHouses(propertyId)
      .then(setOpenHouses)
      .catch((err: Error) => setError(err.message || 'Failed to load open houses'))
      .finally(() => setIsLoading(false));
  };

  const handleOpenHouseSuccess = (record: OpenHouseRecord) => {
    setError('');
    setOpenHouses((previous) => {
      const existingIndex = previous.findIndex((item) => item.id === record.id);
      if (existingIndex === -1) {
        return [record, ...previous];
      }
      return previous.map((item) => (item.id === record.id ? { ...item, ...record } : item));
    });
  };

  useEffect(() => {
    loadOpenHouses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const sortedOpenHouses = useMemo(
    () => [...openHouses].sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime()),
    [openHouses],
  );

  const openHousesByDate = useMemo(() => {
    const entries = new Map<string, OpenHouseRecord[]>();
    sortedOpenHouses.forEach((openHouse) => {
      const key = toDateKey(openHouse.scheduled_at);
      const items = entries.get(key) ?? [];
      items.push(openHouse);
      entries.set(key, items);
    });
    return entries;
  }, [sortedOpenHouses]);

  const calendarMonthOpenHouses = useMemo(
    () => sortedOpenHouses.filter((openHouse) => isSameMonth(new Date(openHouse.scheduled_at), currentMonth)),
    [currentMonth, sortedOpenHouses],
  );

  const selectedCalendarOpenHouses = selectedDateKey ? openHousesByDate.get(selectedDateKey) ?? [] : [];

  useEffect(() => {
    const currentlySelected = selectedDateKey ? new Date(selectedDateKey) : null;
    if (currentlySelected && isSameMonth(currentlySelected, currentMonth)) {
      return;
    }
    const firstOpenHouseThisMonth = calendarMonthOpenHouses[0];
    if (firstOpenHouseThisMonth) {
      setSelectedDateKey(toDateKey(firstOpenHouseThisMonth.scheduled_at));
      return;
    }
    const todayKey = toDateKey(new Date());
    setSelectedDateKey(todayKey);
  }, [calendarMonthOpenHouses, currentMonth, selectedDateKey]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 text-sm">{error}</div>;
  }

  // Derived counts for stat strip
  const upcomingAll   = sortedOpenHouses.filter((oh) => deriveDisplayStatus(oh) === 'upcoming');
  const inProgressAll = sortedOpenHouses.filter((oh) => deriveDisplayStatus(oh) === 'in-progress');
  const completedAll  = sortedOpenHouses.filter((oh) => oh.status === 'completed');
  const cancelledAll  = sortedOpenHouses.filter((oh) => oh.status === 'cancelled');

  // Filtered list (respects stat strip selection)
  const filteredOpenHouses = statusFilter
    ? sortedOpenHouses.filter((oh) => {
        if (statusFilter === 'upcoming')    return deriveDisplayStatus(oh) === 'upcoming';
        if (statusFilter === 'in-progress') return deriveDisplayStatus(oh) === 'in-progress';
        if (statusFilter === 'completed')   return oh.status === 'completed';
        if (statusFilter === 'cancelled')   return oh.status === 'cancelled';
        return true;
      })
    : sortedOpenHouses;

  const inProgress = filteredOpenHouses.filter((oh) => deriveDisplayStatus(oh) === 'in-progress');
  const upcoming   = filteredOpenHouses.filter((oh) => deriveDisplayStatus(oh) === 'upcoming');
  const past       = filteredOpenHouses.filter((oh) => !['upcoming', 'in-progress'].includes(deriveDisplayStatus(oh)));

  // Suggestion 2 — next open house spotlight
  const nextUpcoming = upcomingAll[0] ?? inProgressAll[0] ?? null;
  const isLive       = nextUpcoming ? deriveDisplayStatus(nextUpcoming) === 'in-progress' : false;

  const monthLabel = currentMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  const selectedDate = selectedDateKey ? new Date(selectedDateKey) : null;
  const selectedDateLabel = selectedDate ? formatCalendarDateLabel(selectedDate) : 'Selected day';
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  // Suggestion 6 — calendar monthly stats (moved to header strip)
  const calThisMonth  = calendarMonthOpenHouses.length;
  const calUpcoming   = calendarMonthOpenHouses.filter((oh) => oh.status === 'scheduled').length;
  const calCompleted  = calendarMonthOpenHouses.filter((oh) => oh.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Open Houses ({openHouses.length})</h3>
          <p className="text-sm text-gray-500 mt-0.5">Switch between the existing list and a monthly calendar.</p>
        </div>
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'list' || value === 'calendar') setViewMode(value);
            }}
            variant="outline"
            size="sm"
            aria-label="Open house view"
            className="bg-white"
          >
            <ToggleGroupItem value="list" aria-label="List view" className="gap-2 px-3">
              <List className="w-4 h-4" />
              <span>List</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar view" className="gap-2 px-3">
              <LayoutGrid className="w-4 h-4" />
              <span>Calendar</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Schedule
          </button>
        </div>
      </div>

      {/* Suggestion 1 — stat strip, always visible above both views */}
      <div className="grid grid-cols-5 gap-3">
        {([
          { label: 'Total',       count: openHouses.length,   key: null,          color: 'text-gray-900',  ring: 'ring-blue-500'   },
          { label: 'Upcoming',    count: upcomingAll.length,  key: 'upcoming',    color: 'text-blue-700',  ring: 'ring-blue-500'   },
          { label: 'In Progress', count: inProgressAll.length,key: 'in-progress', color: 'text-amber-700', ring: 'ring-amber-400'  },
          { label: 'Completed',   count: completedAll.length, key: 'completed',   color: 'text-green-700', ring: 'ring-green-500'  },
          { label: 'Cancelled',   count: cancelledAll.length, key: 'cancelled',   color: 'text-red-700',   ring: 'ring-red-500'    },
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

      {openHouses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No open houses scheduled for this listing.</p>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Schedule your first open house
          </button>
        </div>
      )}

      {/* Suggestion 2 — "Next Open House" spotlight card (list view only) */}
      {viewMode === 'list' && nextUpcoming && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white shadow-md">
          {isLive && (
            <span className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-semibold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live Now
            </span>
          )}
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
            {isLive ? 'Happening Now' : 'Next Open House'}
          </p>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-4xl font-bold leading-none">
                {new Date(nextUpcoming.scheduled_at).getDate()}
              </div>
              <div className="text-sm text-blue-200 mt-0.5">
                {new Date(nextUpcoming.scheduled_at).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-0.5">
              <span className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-xs">
                <Clock className="w-3 h-3" />
                {new Date(nextUpcoming.scheduled_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(nextUpcoming.end_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full">
                  {durationLabel(new Date(nextUpcoming.scheduled_at), new Date(nextUpcoming.end_at))}
                </span>
              </span>
              {nextUpcoming.max_attendees != null && (
                <span className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-xs">
                  <Users className="w-3 h-3" />
                  Max {nextUpcoming.max_attendees}
                </span>
              )}
              {nextUpcoming.preparation_checklist && nextUpcoming.preparation_checklist.length > 0 && (() => {
                const total = nextUpcoming.preparation_checklist.length;
                const done  = nextUpcoming.preparation_checklist.filter((t) => t.completed).length;
                return (
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${done === total ? 'bg-green-400/30' : 'bg-amber-400/30'}`}>
                    <CheckSquare className="w-3 h-3" />
                    {done}/{total} tasks ready
                  </span>
                );
              })()}
            </div>
          </div>
          <button
            onClick={() => router.push(`/app/my-listings/${propertyId}/open-houses/${nextUpcoming.id}`)}
            className="mt-3 text-xs text-blue-200 hover:text-white underline underline-offset-2 transition-colors"
          >
            View details →
          </button>
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && openHouses.length > 0 && (
        <div className="space-y-6">
          {([
            { label: 'In Progress', color: 'text-amber-700', items: inProgress },
            { label: 'Upcoming',    color: 'text-blue-700',  items: upcoming   },
            { label: 'Past',        color: 'text-gray-500',  items: past       },
          ] as const).map(({ label, color, items }) =>
            items.length === 0 ? null : (
              <div key={label}>
                <p className={`text-sm font-semibold uppercase tracking-wide mb-2 ${color}`}>{label}</p>
                <div className="space-y-3">
                  {items.map((oh) => (
                    <OpenHouseCard key={oh.id} oh={oh} onClick={() => router.push(`/app/my-listings/${propertyId}/open-houses/${oh.id}`)} />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Calendar view */}
      {viewMode === 'calendar' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Suggestion 6 — calendar header with inline monthly stats */}
          <div className="flex flex-col gap-4 p-5 border-b border-gray-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Open House Calendar</p>
                <h4 className="text-lg font-semibold text-gray-900">{monthLabel}</h4>
              </div>
              {/* Month stats inline */}
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-gray-800">{calThisMonth}</span>
                  <span className="text-gray-500">total</span>
                </div>
                <div className="w-px h-5 bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-blue-700">{calUpcoming}</span>
                  <span className="text-gray-500">upcoming</span>
                </div>
                <div className="w-px h-5 bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-green-700">{calCompleted}</span>
                  <span className="text-gray-500">completed</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {CALENDAR_DAY_LABELS.map((day) => (
                      <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                      <div key={`blank-${index}`} className="min-h-[124px] rounded-xl border border-dashed border-gray-200 bg-gray-50/60" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, index) => {
                      const day = index + 1;
                      const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const dayKey = toDateKey(dayDate);
                      const dayOpenHouses = openHousesByDate.get(dayKey) ?? [];
                      const isSelected = selectedDateKey === dayKey;
                      const hasEvents = dayOpenHouses.length > 0;
                      const todayDay = isToday(dayDate);

                      return (
                        <button
                          key={dayKey}
                          onClick={() => setSelectedDateKey(dayKey)}
                          className={`min-h-[124px] rounded-xl border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : hasEvents
                                ? 'border-blue-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {/* Suggestion 6 — today ring */}
                          <div className="flex items-center justify-between mb-3">
                            {todayDay ? (
                              <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                                {day}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-gray-800">{day}</span>
                            )}
                            {hasEvents && (
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                                {dayOpenHouses.length}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {dayOpenHouses.slice(0, 2).map((openHouse) => {
                              const start = new Date(openHouse.scheduled_at);
                              return (
                                <div
                                  key={openHouse.id}
                                  className={`rounded-lg border px-2 py-1.5 text-xs ${
                                    openHouse.status === 'scheduled'
                                      ? 'border-blue-200 bg-blue-50 text-blue-900'
                                      : openHouse.status === 'completed'
                                        ? 'border-green-200 bg-green-50 text-green-900'
                                        : 'border-red-200 bg-red-50 text-red-900'
                                  }`}
                                >
                                  <div className="font-semibold">Open House</div>
                                  <div>{start.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                              );
                            })}
                            {dayOpenHouses.length > 2 && (
                              <div className="text-xs font-medium text-gray-500">
                                +{dayOpenHouses.length - 2} more
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Calendar side panel */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Selected Day</p>
                    <h5 className="text-base font-semibold text-gray-900">{selectedDateLabel}</h5>
                  </div>
                  {selectedCalendarOpenHouses.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {selectedCalendarOpenHouses.length} scheduled
                    </span>
                  )}
                </div>

                {selectedCalendarOpenHouses.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center">
                    <Calendar className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-700">No open houses on this day</p>
                    <p className="mt-1 text-sm text-gray-500">Pick another day or schedule a new open house.</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedCalendarOpenHouses.map((openHouse) => (
                      <OpenHouseCard key={openHouse.id} oh={openHouse} onClick={() => router.push(`/app/my-listings/${propertyId}/open-houses/${openHouse.id}`)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ScheduleOpenHouseModal
        open={showScheduleModal || !!editingOpenHouse}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowScheduleModal(false);
            setEditingOpenHouse(null);
          }
        }}
        propertyAddress={propertyAddress}
        currentAgentName={currentAgentName}
        propertyId={propertyId}
        authToken={authToken}
        onSuccess={handleOpenHouseSuccess}
        openHouseId={editingOpenHouse?.id}
        openHouseRecord={editingOpenHouse ?? undefined}
      />

    </div>
  );
}
