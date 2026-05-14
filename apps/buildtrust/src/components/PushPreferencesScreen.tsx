import React, { useState } from 'react';
import { ChevronLeft, Bell, MessageSquare, CheckCircle2, AlertCircle, Calendar, Smartphone, Mail, MessageCircle, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface PushPreferencesScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const PushPreferencesScreen: React.FC<PushPreferencesScreenProps> = ({ onNavigate }) => {
  const [preferences, setPreferences] = useState({
    messages: true,
    milestones: true,
    payments: true,
    schedule: false,
    marketing: false,
    email: true,
    sms: false
  });

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      title: 'Activity Notifications',
      items: [
        { id: 'messages', icon: <MessageSquare size={18} />, label: 'New Messages', sub: 'Direct messages from contractors', key: 'messages' as const },
        { id: 'milestones', icon: <CheckCircle2 size={18} />, label: 'Milestone Updates', sub: 'Status changes & approvals', key: 'milestones' as const },
        { id: 'payments', icon: <AlertCircle size={18} />, label: 'Payment Alerts', sub: 'Due dates & confirmations', key: 'payments' as const },
        { id: 'schedule', icon: <Calendar size={18} />, label: 'Schedule Changes', sub: 'Timeline updates & delays', key: 'schedule' as const }
      ]
    },
    {
      title: 'Communication Channels',
      items: [
        { id: 'push', icon: <Smartphone size={18} />, label: 'Push Notifications', sub: 'Real-time mobile alerts', key: 'messages' as const },
        { id: 'email', icon: <Mail size={18} />, label: 'Email Notifications', sub: 'Daily summaries & reports', key: 'email' as const },
        { id: 'sms', icon: <MessageCircle size={18} />, label: 'SMS Alerts', sub: 'Critical updates via text', key: 'sms' as const }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('settings')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Notification Settings</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <MoreVertical size={24} />
        </button>
      </header>

      <div className="p-6 space-y-8">
        <div className="bg-gray-50 rounded-[2.5rem] p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Bell size={24} className="text-black" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Stay Updated</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Choose how and when you want to be notified about your project progress.
            </p>
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{section.title}</h2>
            <div className="bg-gray-50 rounded-[2.5rem] overflow-hidden">
              {section.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-6 flex items-center justify-between ${
                    idx !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold">{item.label}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sub}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => togglePreference(item.key)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      preferences[item.key] ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <motion.div 
                      animate={{ x: preferences[item.key] ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Marketing */}
        <div className="p-6 bg-gray-50 rounded-[2.5rem] flex items-center justify-between">
          <div className="text-left">
            <h4 className="text-sm font-bold">Marketing & Tips</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Offers, news & helpful guides</p>
          </div>
          <button 
            onClick={() => togglePreference('marketing')}
            className={`w-12 h-6 rounded-full transition-all relative ${
              preferences.marketing ? 'bg-black' : 'bg-gray-200'
            }`}
          >
            <motion.div 
              animate={{ x: preferences.marketing ? 24 : 4 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
