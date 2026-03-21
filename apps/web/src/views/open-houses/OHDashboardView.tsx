// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToggleLeft, ToggleRight, Home, Users, CheckCircle2, XCircle } from 'lucide-react';
import { OpenHouseCard } from '@/components/open-houses/OpenHouseCard';
import { TimelineSchedule } from '@/components/open-houses/TimelineSchedule';
import { LeadMetrics } from '@/components/open-houses/LeadMetrics';
import { TaskProgress } from '@/components/open-houses/TaskProgress';
import { agentApi, type OpenHouseRecord } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

function toOpenHouseStatus(r: OpenHouseRecord): 'today' | 'upcoming' | 'completed' {
  if (r.status === 'completed') return 'completed';
  const now = new Date();
  const scheduled = new Date(r.scheduled_at);
  const isToday = scheduled.toDateString() === now.toDateString();
  if (isToday) return 'today';
  // treat any scheduled_at in the past as completed (DB may not have been updated)
  if (scheduled < now) return 'completed';
  return 'upcoming';
}

function toCardItem(r: OpenHouseRecord) {
  const start = new Date(r.scheduled_at);
  const end = new Date(r.end_at);
  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return {
    id: r.id,
    address: r.property_title ?? 'Untitled property',
    city: '',
    date: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time: `${fmt(start)} – ${fmt(end)}`,
    attendees: r.max_attendees ?? 0,
    status: toOpenHouseStatus(r),
  };
}

function deriveMetrics(records: OpenHouseRecord[]) {
  const scheduled = records.filter(r => r.status === 'scheduled').length;
  const completed = records.filter(r => r.status === 'completed').length;
  const totalAttendees = records.reduce((s, r) => s + (r.max_attendees ?? 0), 0);
  const cancelled = records.filter(r => r.status === 'cancelled').length;
  return [
    { id: 1, label: 'Scheduled', value: String(scheduled), change: 0, icon: Home },
    { id: 2, label: 'Completed', value: String(completed), change: 0, icon: CheckCircle2 },
    { id: 3, label: 'Expected Attendees', value: String(totalAttendees), change: 0, icon: Users },
    { id: 4, label: 'Cancelled', value: String(cancelled), change: 0, icon: XCircle },
  ];
}

function deriveTodaySchedule(records: OpenHouseRecord[]) {
  const todayStr = new Date().toDateString();
  return records
    .filter(r => new Date(r.scheduled_at).toDateString() === todayStr && r.status !== 'cancelled')
    .map(r => ({
      id: r.id,
      time: new Date(r.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      title: r.property_title ?? 'Open House',
      type: 'viewing' as const,
      description: r.description ?? '',
    }))
    .sort((a, b) => new Date(a.time) > new Date(b.time) ? 1 : -1);
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

export function DashboardView({ onViewOpenHouse }: { onViewOpenHouse?: () => void }) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [records, setRecords] = useState<OpenHouseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.push('/login?next=/app/open-houses'); return; }
    setLoading(true);
    agentApi
      .getOpenHouses(token)
      .then(data => setRecords(data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load open houses'))
      .finally(() => setLoading(false));
  }, [router]);

  const now = new Date();
  const cards = records
    .filter(r => r.status !== 'cancelled' && new Date(r.scheduled_at) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 6)
    .map(toCardItem);
  const metrics = deriveMetrics(records);
  const schedule = deriveTodaySchedule(records);
  const tasks = deriveTasks(records);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24 text-rose-500">
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
          <p className="text-slate-600">Here's your overview</p>
        </div>
        <button
          onClick={() => setIsAdvanced(!isAdvanced)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          {isAdvanced ? (
            <ToggleRight className="w-5 h-5 text-slate-900" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-slate-600" />
          )}
          <span className="text-sm font-medium text-slate-900">
            {isAdvanced ? 'Advanced' : 'Simple'} Mode
          </span>
        </button>
      </div>

      {/* Lead Metrics */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Metrics</h3>
        <LeadMetrics metrics={metrics} isAdvanced={isAdvanced} />
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Open Houses */}
        <section className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Open Houses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-10 text-slate-400 bg-white rounded-xl border border-slate-100">
                <span className="text-sm">No open houses scheduled</span>
              </div>
            ) : cards.map((openHouse) => (
              <div key={openHouse.id} onClick={() => router.push(`/app/open-houses/events/${openHouse.id}`)} className="cursor-pointer">
                <OpenHouseCard
                  openHouse={openHouse}
                  isAdvanced={isAdvanced}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Right Column - Schedule */}
        <section>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Schedule</h3>
          <TimelineSchedule schedule={schedule} isAdvanced={isAdvanced} />
        </section>
      </div>

      {/* Task Progress */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Tasks</h3>
        <TaskProgress tasks={tasks} isAdvanced={isAdvanced} />
      </section>
    </div>
  );
}