import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Info, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface AvailabilityScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const AvailabilityScreen: React.FC<AvailabilityScreenProps> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState(24);

  const days = [
    { day: 'Mon', date: 23, available: false },
    { day: 'Tue', date: 24, available: true },
    { day: 'Wed', date: 25, available: true },
    { day: 'Thu', date: 26, available: false },
    { day: 'Fri', date: 27, available: true },
    { day: 'Sat', date: 28, available: true },
    { day: 'Sun', date: 29, available: false },
  ];

  const timeSlots = [
    { time: '09:00 AM', available: true },
    { time: '10:30 AM', available: false },
    { time: '01:00 PM', available: true },
    { time: '02:30 PM', available: true },
    { time: '04:00 PM', available: false },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-40">
        <button 
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest">Availability</h1>
        <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
          <Info size={20} />
        </button>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Calendar Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">March 2026</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-gray-50 rounded-full"><ChevronLeft size={20} /></button>
            <button className="p-2 bg-gray-50 rounded-full"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Days Row */}
        <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
          {days.map((d, i) => (
            <motion.button 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => d.available && setSelectedDate(d.date)}
              className={`flex-shrink-0 w-12 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                selectedDate === d.date 
                  ? 'bg-black text-white' 
                  : d.available 
                    ? 'bg-gray-50 text-black hover:bg-gray-100' 
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">{d.day}</span>
              <span className="text-base font-bold">{d.date}</span>
              {d.available && selectedDate !== d.date && <div className="w-1 h-1 bg-black rounded-full"></div>}
            </motion.button>
          ))}
        </div>

        {/* Time Slots */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Available Time Slots</h3>
          <div className="grid grid-cols-2 gap-4">
            {timeSlots.map((slot, i) => (
              <motion.button 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                disabled={!slot.available}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  slot.available 
                    ? 'bg-white border-gray-100 hover:border-black' 
                    : 'bg-gray-50 border-transparent opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock size={16} className={slot.available ? 'text-black' : 'text-gray-400'} />
                  <span className="text-sm font-bold">{slot.time}</span>
                </div>
                {slot.available && <CheckCircle2 size={16} className="text-emerald-500" />}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Booking Note */}
        <div className="bg-blue-50 p-6 rounded-3xl flex gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">Consultation Booking</h4>
            <p className="text-xs text-blue-800/60 mt-1 leading-relaxed">
              Booking a consultation allows Jordan to review your project requirements and provide a preliminary estimate.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10">
          Confirm Selection
        </button>
      </div>
    </div>
  );
};
