import React from 'react';
import { ChevronLeft, Bell, CheckCircle2, MessageSquare, AlertCircle, Calendar, ArrowRight, Settings, Trash2, Share2, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface NotificationDetailScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const NotificationDetailScreen: React.FC<NotificationDetailScreenProps> = ({ onNavigate }) => {
  const notification = {
    id: '1',
    type: 'message',
    title: 'New Message',
    description: 'Marco Rossi sent you a message regarding the Kitchen Remodel.',
    time: '2 mins ago',
    isRead: false,
    icon: <MessageSquare className="text-blue-500" size={24} />,
    bg: 'bg-blue-50',
    content: "Hi, I've just uploaded the latest photos of the cabinet installation. Please take a look and let me know if everything looks good. We're on track to finish the plumbing rough-in by Friday.",
    user: {
      name: 'Marco Rossi',
      role: 'Lead Contractor',
      avatar: 'https://picsum.photos/seed/marco/100/100'
    }
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('notifications')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Notification Detail</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MoreVertical size={24} />
        </button>
      </header>

      <div className="p-6 space-y-8">
        {/* Icon and Title */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-20 h-20 rounded-3xl ${notification.bg} flex items-center justify-center shadow-sm`}>
            {notification.icon}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{notification.title}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{notification.time}</p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-6">
          <p className="text-base text-gray-600 leading-relaxed font-medium italic">
            "{notification.content}"
          </p>

          <div className="h-[1px] bg-gray-200 w-full" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={notification.user.avatar} className="w-12 h-12 rounded-2xl object-cover" alt={notification.user.name} />
              <div className="text-left">
                <h4 className="text-sm font-bold">{notification.user.name}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{notification.user.role}</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('chat')}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-sm hover:scale-110 transition-transform"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-[2rem] hover:bg-gray-100 transition-colors">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Share2 size={20} className="text-gray-400" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Share</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-[2rem] hover:bg-gray-100 transition-colors">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delete</span>
          </button>
        </div>

        {/* Primary Action */}
        <button 
          onClick={() => onNavigate('jobDetail')}
          className="w-full bg-black text-white py-5 rounded-[2rem] text-sm font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          View Project Details <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
