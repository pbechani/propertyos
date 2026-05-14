// @ts-nocheck
"use client"
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

interface OpenHouse {
  id: number;
  address: string;
  city: string;
  date: string;
  time: string;
  attendees: number;
  status: 'upcoming' | 'today' | 'completed';
}

interface OpenHouseCardProps {
  openHouse: OpenHouse;
  isAdvanced: boolean;
}

export function OpenHouseCard({ openHouse, isAdvanced }: OpenHouseCardProps) {
  const statusColors = {
    upcoming: 'bg-blue-50 text-blue-700',
    today: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-slate-50 text-slate-700'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-slate-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-slate-900 mb-1">{openHouse.address}</h3>
          <div className="flex items-center gap-1 text-slate-500 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>{openHouse.city}</span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[openHouse.status]}`}>
          {openHouse.status}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>{openHouse.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <span>{openHouse.time}</span>
        </div>
        {isAdvanced && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span>{openHouse.attendees} expected attendees</span>
          </div>
        )}
      </div>
    </div>
  );
}
