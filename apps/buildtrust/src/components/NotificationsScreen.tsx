import React from 'react';
import { ChevronLeft, Bell, CheckCircle2, MessageSquare, AlertCircle, Calendar, ArrowRight, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface NotificationsScreenProps {
  onNavigate: (screen: Screen) => void;
  userRole: 'homeowner' | 'contractor';
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigate, userRole }) => {
  const notifications = [
    {
      id: '1',
      type: 'message',
      title: 'New Message',
      description: 'Marco Rossi sent you a message regarding the Kitchen Remodel.',
      time: '2 mins ago',
      isRead: false,
      icon: <MessageSquare className="text-blue-500" size={18} />,
      bg: 'bg-blue-50'
    },
    {
      id: '2',
      type: 'milestone',
      title: 'Milestone Completed',
      description: 'Plumbing Rough-in has been marked as completed by Luca S.',
      time: '1 hour ago',
      isRead: false,
      icon: <CheckCircle2 className="text-emerald-500" size={18} />,
      bg: 'bg-emerald-50'
    },
    {
      id: '3',
      type: 'alert',
      title: 'Payment Due',
      description: 'The next milestone payment for "Bathroom Tile" is due in 2 days.',
      time: '3 hours ago',
      isRead: true,
      icon: <AlertCircle className="text-orange-500" size={18} />,
      bg: 'bg-orange-50'
    },
    {
      id: '4',
      type: 'schedule',
      title: 'Schedule Update',
      description: 'Sofia V. updated the timeline for "Interior Design Phase".',
      time: 'Yesterday',
      isRead: true,
      icon: <Calendar className="text-purple-500" size={18} />,
      bg: 'bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(userRole === 'contractor' ? 'contractorHome' : 'home')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
        </div>
        <button 
          onClick={() => onNavigate('pushPreferences')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Settings size={20} className="text-gray-400" />
        </button>
      </header>

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent</h2>
          <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Mark all as read</button>
        </div>

        <div className="space-y-3">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onNavigate('notificationDetail')}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex gap-4 ${
                notif.isRead ? 'bg-white border-gray-100' : 'bg-gray-50 border-transparent shadow-sm'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl ${notif.bg} flex items-center justify-center flex-shrink-0`}>
                {notif.icon}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className={`text-sm font-bold ${notif.isRead ? 'text-gray-600' : 'text-black'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{notif.time}</span>
                </div>
                <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-gray-400' : 'text-gray-500'}`}>
                  {notif.description}
                </p>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="pt-8">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-4">Earlier</h2>
          <div className="bg-gray-50 rounded-[2.5rem] p-8 text-center space-y-2">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <Bell size={24} className="text-gray-200" />
            </div>
            <p className="text-sm font-bold text-gray-400">No older notifications</p>
          </div>
        </div>
      </div>

      {/* Settings Shortcut */}
      <div className="px-6 mt-8">
        <button 
          onClick={() => onNavigate('settings')}
          className="w-full p-6 bg-gray-50 rounded-[2.5rem] flex items-center justify-between group hover:bg-gray-100 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Settings size={20} className="text-black" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold">App Settings</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preferences & Security</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
        </button>
      </div>
    </div>
  );
};
