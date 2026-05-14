'use client';

import { useState } from 'react';
import { NewEventModal } from '@/components/my-listings/NewEventModal';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Home, User, Phone, Clock, MapPin } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'viewing' | 'meeting' | 'open-house' | 'call';
  location?: string;
  client?: string;
  attendees?: string[];
  color: string;
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Property Viewing - 123 Maple Ave',
    date: new Date(2026, 2, 15),
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    type: 'viewing',
    location: '123 Maple Avenue, San Francisco',
    attendees: ['John Smith'],
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    id: '2',
    title: 'Client Meeting',
    date: new Date(2026, 2, 15),
    startTime: '2:00 PM',
    endTime: '3:00 PM',
    type: 'meeting',
    location: 'Office',
    attendees: ['Sarah Johnson'],
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    id: '3',
    title: 'Open House - 456 Oak St',
    date: new Date(2026, 2, 18),
    startTime: '1:00 PM',
    endTime: '3:00 PM',
    type: 'open-house',
    location: '456 Oak Street, Oakland',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  {
    id: '4',
    title: 'Follow-up Call',
    date: new Date(2026, 2, 20),
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    type: 'call',
    attendees: ['Mike Davis'],
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    id: '5',
    title: 'Property Viewing - 789 Pine Blvd',
    date: new Date(2026, 2, 22),
    startTime: '3:00 PM',
    endTime: '4:00 PM',
    type: 'viewing',
    location: '789 Pine Boulevard, Berkeley',
    attendees: ['Emily Chen'],
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    id: '6',
    title: 'Open House - 321 Elm Dr',
    date: new Date(2026, 2, 25),
    startTime: '2:00 PM',
    endTime: '4:00 PM',
    type: 'open-house',
    location: '321 Elm Drive, San Jose',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MyListingsCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 15));
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleNewEvent = (date?: Date) => {
    setSelectedDate(date);
    setShowNewEventModal(true);
  };

  const handleSaveEvent = (eventData: unknown) => {
    console.log('New event:', eventData);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => event.date.toDateString() === date.toDateString());
  };

  const isToday = (date: Date) => {
    const today = new Date(2026, 2, 15);
    return date.toDateString() === today.toDateString();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'viewing': return Home;
      case 'meeting': return User;
      case 'open-house': return Home;
      case 'call': return Phone;
      default: return CalendarIcon;
    }
  };

  const upcomingEvents = mockEvents
    .filter(event => event.date >= new Date(2026, 2, 15))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your schedule and appointments</p>
        </div>
        <button
          onClick={() => handleNewEvent()}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(2026, 2, 15))}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Today
                  </button>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                {(['month', 'week', 'day'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      view === v
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentDate).map((day, index) => {
                  const dayEvents = getEventsForDate(day.date);
                  const isTodayDate = isToday(day.date);

                  return (
                    <div
                      key={index}
                      className={`min-h-24 border rounded-lg p-2 ${
                        day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                      } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      } ${isTodayDate ? 'text-blue-600' : ''}`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`${event.color} text-xs p-1 rounded truncate`}
                          >
                            {event.startTime} {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-600 pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const Icon = getEventIcon(event.type);
                return (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${event.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm mb-1">{event.title}</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.startTime} - {event.endTime}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          {event.client && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {event.client}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Event Types</h3>
            <div className="space-y-2">
              {[
                { label: 'Property Viewing', color: 'bg-blue-500' },
                { label: 'Client Meeting', color: 'bg-purple-500' },
                { label: 'Open House', color: 'bg-green-500' },
                { label: 'Phone Call', color: 'bg-orange-500' },
              ].map((type) => (
                <div key={type.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${type.color} rounded`}></div>
                  <span className="text-sm text-gray-700">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <NewEventModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
}
