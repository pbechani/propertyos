'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Milestone,
  HardHat,
  Truck,
  FileText,
  Video,
  Wrench
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  type: 'milestone' | 'inspection' | 'delivery' | 'meeting' | 'deadline' | 'task' | 'permit';
  project: string;
  projectColor: string;
  description?: string;
  location?: string;
  attendees?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'upcoming' | 'completed' | 'overdue' | 'in-progress';
}

const events: CalendarEvent[] = [
  { id: 'e1', title: 'Level 15 Concrete Pour', date: '2026-03-12', time: '6:00 AM', type: 'milestone', project: 'Tower A', projectColor: 'bg-blue-500', description: 'Critical structural milestone', location: 'Tower A - Level 15', attendees: ['Sarah Johnson', 'BuildTech Team'], priority: 'critical', status: 'in-progress' },
  { id: 'e2', title: 'Safety Inspection', date: '2026-03-12', time: '10:00 AM', type: 'inspection', project: 'GreenTech Park', projectColor: 'bg-green-500', description: 'Monthly safety compliance inspection', location: 'GreenTech Industrial Park', attendees: ['Safety Inspector', 'David Martinez'], priority: 'high', status: 'upcoming' },
  { id: 'e3', title: 'Steel Rebar Delivery', date: '2026-03-13', time: '8:00 AM', type: 'delivery', project: 'Tower A', projectColor: 'bg-blue-500', description: '50 tons Steel Rebar #8 from SteelCorp', location: 'Tower A Loading Dock', priority: 'medium', status: 'upcoming' },
  { id: 'e4', title: 'Client Progress Meeting', date: '2026-03-13', time: '2:00 PM', type: 'meeting', project: 'Riverside Complex', projectColor: 'bg-amber-500', description: 'Monthly progress review with client stakeholders', attendees: ['Michael Chen', 'Client Team', 'Design Team'], priority: 'high', status: 'upcoming' },
  { id: 'e5', title: 'MEP Coordination Review', date: '2026-03-14', time: '9:00 AM', type: 'meeting', project: 'Tower A', projectColor: 'bg-blue-500', attendees: ['MEP Team', 'Structural Team', 'Sarah Johnson'], priority: 'medium', status: 'upcoming' },
  { id: 'e6', title: 'Building Permit Decision', date: '2026-03-14', type: 'permit', project: 'Lakeside Shopping', projectColor: 'bg-purple-500', description: 'Expected decision from NYC DOB on Phase 2 permit', priority: 'high', status: 'upcoming' },
  { id: 'e7', title: 'Facade Installation Start', date: '2026-03-15', type: 'milestone', project: 'Tower A', projectColor: 'bg-blue-500', description: 'Begin south elevation curtain wall installation', priority: 'high', status: 'upcoming' },
  { id: 'e8', title: 'Concrete Curing Test', date: '2026-03-15', time: '11:00 AM', type: 'inspection', project: 'Tower A', projectColor: 'bg-blue-500', description: 'Test Level 15 concrete compressive strength', priority: 'medium', status: 'upcoming' },
  { id: 'e9', title: 'Roofing Milestone Due', date: '2026-03-16', type: 'deadline', project: 'Riverside Complex', projectColor: 'bg-amber-500', description: 'Waterproofing membrane completion deadline', priority: 'critical', status: 'overdue' },
  { id: 'e10', title: 'Weekly Safety Toolbox', date: '2026-03-16', time: '7:00 AM', type: 'meeting', project: 'All Projects', projectColor: 'bg-gray-500', attendees: ['All Site Supervisors'], priority: 'medium', status: 'upcoming' },
  { id: 'e11', title: 'Foundation Inspection', date: '2026-03-17', time: '9:00 AM', type: 'inspection', project: 'GreenTech Park', projectColor: 'bg-green-500', description: 'Phase 2 foundation structural inspection', priority: 'high', status: 'upcoming' },
  { id: 'e12', title: 'HVAC Equipment Delivery', date: '2026-03-18', time: '10:00 AM', type: 'delivery', project: 'Riverside Complex', projectColor: 'bg-amber-500', description: 'Rooftop HVAC units delivery', priority: 'medium', status: 'upcoming' },
  { id: 'e13', title: 'Investor Site Visit', date: '2026-03-19', time: '1:00 PM', type: 'meeting', project: 'Tower A', projectColor: 'bg-blue-500', attendees: ['Sarah Johnson', 'CFO', 'Investor Group'], priority: 'critical', status: 'upcoming' },
  { id: 'e14', title: 'Electrical Rough-In Complete', date: '2026-03-20', type: 'milestone', project: 'Riverside Complex', projectColor: 'bg-amber-500', priority: 'high', status: 'upcoming' },
  { id: 'e15', title: 'Monthly Budget Review', date: '2026-03-20', time: '3:00 PM', type: 'meeting', project: 'All Projects', projectColor: 'bg-gray-500', attendees: ['Finance Team', 'All PMs'], priority: 'medium', status: 'upcoming' },
  // Past events
  { id: 'e16', title: 'Level 14 Structure Complete', date: '2026-03-10', type: 'milestone', project: 'Tower A', projectColor: 'bg-blue-500', priority: 'high', status: 'completed' },
  { id: 'e17', title: 'Fire Safety Drill', date: '2026-03-09', time: '2:00 PM', type: 'inspection', project: 'Tower A', projectColor: 'bg-blue-500', priority: 'medium', status: 'completed' },
  { id: 'e18', title: 'Portland Cement Delivery', date: '2026-03-08', time: '7:00 AM', type: 'delivery', project: 'Tower A', projectColor: 'bg-blue-500', priority: 'low', status: 'completed' },
];

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  milestone: { icon: Milestone, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Milestone' },
  inspection: { icon: HardHat, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Inspection' },
  delivery: { icon: Truck, color: 'text-green-600', bg: 'bg-green-100', label: 'Delivery' },
  meeting: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Meeting' },
  deadline: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', label: 'Deadline' },
  task: { icon: Wrench, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Task' },
  permit: { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Permit' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function UnifiedCalendar() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(2); // March (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-03-12');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [view, setView] = useState<'month' | 'week'>('month');

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const toDateStr = (day: number) => `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const filteredEvents = events.filter(e => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (filterProject !== 'all' && e.project !== filterProject) return false;
    return true;
  });

  const getEventsForDay = (day: number) => {
    const dateStr = toDateStr(day);
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const selectedEvents = selectedDate ? filteredEvents.filter(e => e.date === selectedDate).sort((a, b) => (a.time || 'ZZZ').localeCompare(b.time || 'ZZZ')) : [];

  const today = '2026-03-12';
  const todayEvents = filteredEvents.filter(e => e.date === today);
  const upcomingEvents = filteredEvents.filter(e => e.date > today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const overdueEvents = filteredEvents.filter(e => e.status === 'overdue');

  const projects = [...new Set(events.map(e => e.project))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            Unified Calendar
          </h1>
          <p className="text-gray-500 mt-1">Cross-project schedule view &middot; {todayEvents.length} events today</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setView('month')}>Month</Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setView('week')}>Week</Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-1" /> New Event</Button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueEvents.length > 0 && (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800">{overdueEvents.length} overdue event{overdueEvents.length > 1 ? 's' : ''} requiring attention</p>
              <p className="text-xs text-red-600">{overdueEvents.map(e => e.title).join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><Filter className="w-3 h-3 mr-1" /><SelectValue placeholder="Event Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
                <CardTitle className="text-lg">{MONTHS[currentMonth]} {currentYear}</CardTitle>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs text-gray-500 py-2">{d}</div>
                ))}
              </div>
              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[90px] border-t border-gray-100 p-1" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(day);
                  const dayEvents = getEventsForDay(day);
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-h-[90px] border-t border-gray-100 p-1 text-left transition-colors hover:bg-blue-50 ${
                        isSelected ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset rounded-lg' : ''
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                        isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                      }`}>{day}</span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 3).map(evt => (
                          <div key={evt.id} className={`text-xs px-1 py-0.5 rounded truncate ${
                            evt.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            evt.status === 'completed' ? 'bg-gray-100 text-gray-500 line-through' :
                            `${typeConfig[evt.type].bg} ${typeConfig[evt.type].color}`
                          }`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${evt.projectColor}`} />
                            {evt.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-400 pl-1">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Day Detail */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No events on this date</p>
              ) : (
                selectedEvents.map(evt => {
                  const cfg = typeConfig[evt.type];
                  const Icon = cfg.icon;
                  return (
                    <div key={evt.id} className={`p-3 rounded-lg border ${evt.status === 'overdue' ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm text-gray-900 truncate">{evt.title}</h4>
                            {evt.status === 'overdue' && <Badge className="bg-red-100 text-red-700 text-xs">Overdue</Badge>}
                            {evt.status === 'completed' && <Badge className="bg-green-100 text-green-700 text-xs">Done</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-block w-2 h-2 rounded-full ${evt.projectColor}`} />
                            <span className="text-xs text-gray-500">{evt.project}</span>
                            {evt.time && (
                              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />{evt.time}
                              </span>
                            )}
                          </div>
                          {evt.description && <p className="text-xs text-gray-500 mt-1">{evt.description}</p>}
                          {evt.location && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{evt.location}
                            </p>
                          )}
                          {evt.attendees && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" />{evt.attendees.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingEvents.map(evt => {
                const cfg = typeConfig[evt.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={evt.id}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setSelectedDate(evt.date)}
                  >
                    <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{evt.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(evt.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {evt.time && ` · ${evt.time}`}
                      </p>
                    </div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${evt.projectColor}`} />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(typeConfig).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      {cfg.label}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t space-y-1">
                {[
                  { label: 'Tower A', color: 'bg-blue-500' },
                  { label: 'Riverside Complex', color: 'bg-amber-500' },
                  { label: 'GreenTech Park', color: 'bg-green-500' },
                  { label: 'Lakeside Shopping', color: 'bg-purple-500' },
                ].map(p => (
                  <div key={p.label} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                    {p.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
