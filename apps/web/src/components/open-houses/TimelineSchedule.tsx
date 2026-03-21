// @ts-nocheck
"use client"
import { Clock, Phone, Home, FileText } from 'lucide-react';

interface ScheduleItem {
  id: number;
  time: string;
  title: string;
  type: 'call' | 'viewing' | 'meeting' | 'document';
  description: string;
}

interface TimelineScheduleProps {
  schedule: ScheduleItem[];
  isAdvanced: boolean;
}

const iconMap = {
  call: Phone,
  viewing: Home,
  meeting: Users,
  document: FileText,
};

const colorMap = {
  call: 'bg-blue-100 text-blue-600',
  viewing: 'bg-emerald-100 text-emerald-600',
  meeting: 'bg-purple-100 text-purple-600',
  document: 'bg-amber-100 text-amber-600',
};

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export function TimelineSchedule({ schedule, isAdvanced }: TimelineScheduleProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-5 h-5 text-slate-700" />
        <h2 className="font-semibold text-slate-900">Today's Schedule</h2>
      </div>
      
      <div className="space-y-4">
        {schedule.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No events scheduled for today</p>
        ) : schedule.map((item, index) => {
          const Icon = iconMap[item.type];
          return (
            <div key={item.id} className="relative">
              {index !== schedule.length - 1 && (
                <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-100" />
              )}
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorMap[item.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900">{item.title}</span>
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </div>
                  {isAdvanced && (
                    <p className="text-sm text-slate-600">{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
