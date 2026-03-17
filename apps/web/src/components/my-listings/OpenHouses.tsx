'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, LayoutGrid, List, Loader2, Users } from 'lucide-react';
import { propertiesApi, type OpenHouseRecord } from '@/lib/api-client';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScheduleOpenHouseModal } from './ScheduleOpenHouseModal';
import { OpenHouseDetailModal } from './OpenHouseDetailModal';

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

function toDetailProps(oh: OpenHouseRecord) {
  const start = new Date(oh.scheduled_at);
  const end = new Date(oh.end_at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    id: oh.id,
    date: oh.scheduled_at,
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    attendance: 0,
    interestedParties: 0,
    status: deriveDisplayStatus(oh),
    notes: oh.description ?? '',
    preparationChecklist: oh.preparation_checklist ?? [],
    marketingOptions: oh.marketing_options ?? [],
  };
}

function OpenHouseCard({ oh, onClick }: { oh: OpenHouseRecord; onClick: () => void }) {
  const start = new Date(oh.scheduled_at);
  const end = new Date(oh.end_at);
  const displayStatus = deriveDisplayStatus(oh);

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition-all text-left"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex flex-col items-center justify-center shrink-0">
            <div className="text-xs font-medium text-blue-600">
              {start.toLocaleDateString('en-ZA', { month: 'short' })}
            </div>
            <div className="text-lg font-bold text-blue-700 leading-none">{start.getDate()}</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Open House</div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {start.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {end.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {oh.max_attendees && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <Users className="w-3.5 h-3.5" />
                <span>Max {oh.max_attendees} attendees</span>
              </div>
            )}
            {oh.description && (
              <p className="text-sm text-gray-600 mt-1">{oh.description}</p>
            )}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${statusColor(displayStatus)}`}>
          {STATUS_LABELS[displayStatus] ?? displayStatus}
        </span>
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
  const [selectedOpenHouse, setSelectedOpenHouse] = useState<OpenHouseRecord | null>(null);
  const [editingOpenHouse, setEditingOpenHouse] = useState<OpenHouseRecord | null>(null);

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

  const inProgress = sortedOpenHouses.filter((oh) => deriveDisplayStatus(oh) === 'in-progress');
  const upcoming = sortedOpenHouses.filter((oh) => deriveDisplayStatus(oh) === 'upcoming');
  const past = sortedOpenHouses.filter((oh) => !['upcoming', 'in-progress'].includes(deriveDisplayStatus(oh)));
  const monthLabel = currentMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  const selectedDate = selectedDateKey ? new Date(selectedDateKey) : null;
  const selectedDateLabel = selectedDate ? formatCalendarDateLabel(selectedDate) : 'Selected day';
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  return (
    <div className="space-y-4">
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
              if (value === 'list' || value === 'calendar') {
                setViewMode(value);
              }
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

      {openHouses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No open houses scheduled for this listing.</p>
        </div>
      )}

      {viewMode === 'list' && (
        <>
          {inProgress.length > 0 && (
            <div>
              <p className="text-sm font-medium text-amber-600 mb-2">In Progress</p>
              <div className="space-y-3">
                {inProgress.map((oh) => (
                  <OpenHouseCard key={oh.id} oh={oh} onClick={() => setSelectedOpenHouse(oh)} />
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Upcoming</p>
              <div className="space-y-3">
                {upcoming.map((oh) => (
                  <OpenHouseCard key={oh.id} oh={oh} onClick={() => setSelectedOpenHouse(oh)} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Past</p>
              <div className="space-y-3">
                {past.map((oh) => (
                  <OpenHouseCard key={oh.id} oh={oh} onClick={() => setSelectedOpenHouse(oh)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex flex-col gap-4 p-5 border-b border-gray-200 bg-linear-to-br from-slate-50 via-white to-blue-50/50 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Open House Calendar</p>
              <h4 className="text-lg font-semibold text-gray-900">{monthLabel}</h4>
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
                <div className="min-w-180">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {CALENDAR_DAY_LABELS.map((day) => (
                      <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                      <div key={`blank-${index}`} className="min-h-31 rounded-xl border border-dashed border-gray-200 bg-gray-50/60" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, index) => {
                      const day = index + 1;
                      const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const dayKey = toDateKey(dayDate);
                      const dayOpenHouses = openHousesByDate.get(dayKey) ?? [];
                      const isSelected = selectedDateKey === dayKey;
                      const hasEvents = dayOpenHouses.length > 0;

                      return (
                        <button
                          key={dayKey}
                          onClick={() => setSelectedDateKey(dayKey)}
                          className={`min-h-31 rounded-xl border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : hasEvents
                                ? 'border-blue-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-semibold ${isToday(dayDate) ? 'text-blue-700' : 'text-gray-800'}`}>{day}</span>
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
                      <OpenHouseCard key={openHouse.id} oh={openHouse} onClick={() => setSelectedOpenHouse(openHouse)} />
                    ))}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-white p-3 border border-gray-200">
                  <div>
                    <div className="text-xl font-semibold text-gray-900">{calendarMonthOpenHouses.length}</div>
                    <div className="text-xs text-gray-500">This month</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-blue-700">{calendarMonthOpenHouses.filter((openHouse) => openHouse.status === 'scheduled').length}</div>
                    <div className="text-xs text-gray-500">Upcoming</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-green-700">{calendarMonthOpenHouses.filter((openHouse) => openHouse.status === 'completed').length}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                </div>
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

      {selectedOpenHouse && (
        <OpenHouseDetailModal
          open={!!selectedOpenHouse}
          onOpenChange={(open) => { if (!open) setSelectedOpenHouse(null); }}
          openHouse={toDetailProps(selectedOpenHouse)}
          authToken={authToken}
          propertyAddress={propertyAddress}
          currentAgentName={currentAgentName}
          onEdit={() => {
            setEditingOpenHouse(selectedOpenHouse);
            setSelectedOpenHouse(null);
          }}
          onCancelled={(openHouseId) => {
            setOpenHouses((prev) =>
              prev.map((oh) => oh.id === openHouseId ? { ...oh, status: 'cancelled' } : oh)
            );
            setSelectedOpenHouse(null);
          }}
        />
      )}
    </div>
  );
}
