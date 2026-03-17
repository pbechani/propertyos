'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, ChevronLeft, ChevronRight, Video, Phone, Home, Loader2, List, CalendarDays } from 'lucide-react';
import { propertiesApi, type ListingViewingRecord } from '@/lib/api-client';
import { ScheduleViewingModal } from './ScheduleViewingModal';

interface Props {
  propertyId: string;
  authToken: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  const inProgress = viewings.filter((v) => deriveViewingDisplayStatus(v) === 'in-progress');
  const upcoming = viewings.filter((v) => deriveViewingDisplayStatus(v) === 'upcoming');
  const past = viewings.filter((v) => !['upcoming', 'in-progress'].includes(deriveViewingDisplayStatus(v)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Scheduled Viewings ({viewings.length})</h3>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm ${
                view === 'list'
                  ? 'bg-white shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm ${
                view === 'calendar'
                  ? 'bg-white shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-900'
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

      {viewings.length === 0 && view === 'list' && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No viewings scheduled for this listing.</p>
        </div>
      )}

      {/* List view */}
      {view === 'list' && viewings.length > 0 && (
        <div className="space-y-6">
          {[{ label: 'In Progress', color: 'text-amber-700', items: inProgress },
            { label: 'Upcoming',    color: 'text-blue-700',  items: upcoming },
            { label: 'Past',        color: 'text-gray-500',  items: past },
          ].map(({ label, color, items }) =>
            items.length === 0 ? null : (
              <div key={label}>
                <h4 className={`text-sm font-semibold uppercase tracking-wide mb-2 ${color}`}>{label}</h4>
                <div className="space-y-3">
                  {items.map((v) => {
                    const dt = new Date(v.scheduled_at);
                    const buyerName =
                      [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || 'Unknown Buyer';
                    return (
                      <div
                        key={v.id}
                        onClick={() => router.push(`/app/my-listings/${propertyId}/viewings/${v.id}`)}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                              <div className="text-xs font-medium text-blue-600">
                                {MONTHS[dt.getMonth()].slice(0, 3)}
                              </div>
                              <div className="text-lg font-bold text-blue-700 leading-none">
                                {dt.getDate()}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{buyerName}</div>
                              {v.buyer_email && (
                                <div className="text-sm text-gray-500">{v.buyer_email}</div>
                              )}
                              {v.buyer_phone && (
                                <div className="text-sm text-gray-500">{v.buyer_phone}</div>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                <ViewingTypeIcon type={v.viewing_type} />
                                <span className="capitalize">{v.viewing_type.replace('_', ' ')}</span>
                                <span>·</span>
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {v.duration_minutes && <span>· {v.duration_minutes} min</span>}
                              </div>
                              {v.buyer_feedback && (
                                <p className="text-xs text-gray-500 italic mt-1">"{v.buyer_feedback}"</p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full capitalize flex-shrink-0 ${statusBadgeClass(v.status)}`}
                          >
                            {VIEWING_STATUS_LABELS[v.status] ?? v.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
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

            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-100 border-2 border-green-500" />
                <span className="text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-100 border-2 border-yellow-500" />
                <span className="text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-100 border-2 border-gray-400" />
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-100 border-2 border-red-500" />
                <span className="text-gray-600">Declined</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {FULL_DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-700 py-3 border-b border-gray-200"
              >
                {day}
              </div>
            ))}

            {/* Empty cells before month starts */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[120px] bg-gray-50 border border-gray-100 rounded-lg" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayViewings = getViewingsForDay(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
              );
              const today = isToday(day);

              return (
                <div
                  key={day}
                  className={`min-h-[120px] p-2 border rounded-lg transition-colors ${
                    today
                      ? 'border-2 border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${today ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayViewings.map((v) => {
                      const dt = new Date(v.scheduled_at);
                      const buyerName =
                        [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || 'Buyer';
                      const time = dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div
                          key={v.id}
                          onClick={() => router.push(`/app/my-listings/${propertyId}/viewings/${v.id}`)}
                          className={`p-1.5 rounded border-l-2 text-xs cursor-pointer hover:shadow-sm transition-shadow ${chipClass(v.status)}`}
                          title={`${buyerName} — ${time}`}
                        >
                          <div className="font-medium truncate">{time}</div>
                          <div className="truncate">{buyerName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{viewings.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">
                  {viewings.filter((v) => v.status === 'confirmed').length}
                </div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-yellow-600">
                  {viewings.filter((v) => v.status === 'requested').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-600">
                  {viewings.filter((v) => v.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-600">
                  {viewings.filter((v) => v.status === 'declined' || v.status === 'cancelled').length}
                </div>
                <div className="text-sm text-gray-600">Declined</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScheduleViewingModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
}
