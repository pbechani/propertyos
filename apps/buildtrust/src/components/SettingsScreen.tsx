import React from 'react';
import { ChevronLeft, User, Bell, Shield, CreditCard, HelpCircle, LogOut, ArrowRight, Globe, Moon, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
  userRole: 'homeowner' | 'contractor';
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate, userRole }) => {
  const sections = [
    {
      title: 'Account',
      items: [
        { id: 'profile', icon: <User size={20} />, label: 'Personal Information', sub: 'Name, Email, Phone', screen: 'profile' },
        { id: 'payment', icon: <CreditCard size={20} />, label: 'Payment Methods', sub: 'Cards, Bank Accounts', screen: 'paymentMethod' },
        { id: 'security', icon: <Shield size={20} />, label: 'Security', sub: 'Password, 2FA', screen: 'settings' }
      ]
    },
    {
      title: 'Preferences',
      items: [
        { id: 'notifications', icon: <Bell size={20} />, label: 'Notifications', sub: 'Push, Email, SMS', screen: 'pushPreferences' },
        { id: 'language', icon: <Globe size={20} />, label: 'Language', sub: 'English (US)', screen: 'settings' },
        { id: 'appearance', icon: <Moon size={20} />, label: 'Appearance', sub: 'System Default', screen: 'settings' }
      ]
    },
    {
      title: 'Support',
      items: [
        { id: 'help', icon: <HelpCircle size={20} />, label: 'Help Center', sub: 'FAQs, Contact Support', screen: 'settings' },
        { id: 'about', icon: <Smartphone size={20} />, label: 'About App', sub: 'v1.0.4 (Build 245)', screen: 'settings' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(userRole === 'homeowner' ? 'homeownerProfile' : 'profile')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{section.title}</h2>
            <div className="bg-gray-50 rounded-[2.5rem] overflow-hidden">
              {section.items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.screen as Screen)}
                  className={`w-full p-6 flex items-center justify-between group hover:bg-gray-100 transition-all ${
                    idx !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold">{item.label}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sub}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button 
          onClick={() => onNavigate('login')}
          className="w-full p-6 bg-red-50 rounded-[2.5rem] flex items-center justify-center gap-3 text-red-500 hover:bg-red-100 transition-all"
        >
          <LogOut size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </div>
  );
};
