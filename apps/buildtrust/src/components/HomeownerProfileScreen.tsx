import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Star, 
  ChevronRight, 
  CreditCard, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut,
  ShieldCheck,
  Bell,
  Heart
} from 'lucide-react';
import { Screen } from '../types';

interface HomeownerProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const HomeownerProfileScreen: React.FC<HomeownerProfileScreenProps> = ({ onNavigate }) => {
  const menuItems = [
    { id: 'projects', icon: <Briefcase size={20} />, label: 'My Projects', desc: 'Manage your active and past jobs' },
    { id: 'saved', icon: <Heart size={20} />, label: 'Saved Contractors', desc: 'Your favorite experts' },
    { id: 'paymentMethod', icon: <CreditCard size={20} />, label: 'Payment Methods', desc: 'Manage cards and bank accounts' },
    { id: 'paymentHistory', icon: <History size={20} />, label: 'Transaction History', desc: 'View all your payments' },
    { id: 'notifications', icon: <Bell size={20} />, label: 'Notifications', desc: 'Manage your alerts' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Account Settings', desc: 'Profile and security preferences' },
    { id: 'help', icon: <HelpCircle size={20} />, label: 'Help & Support', desc: 'FAQs and contact us' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Profile Header */}
      <div className="bg-white px-6 pt-16 pb-10 rounded-b-[3rem] shadow-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-[2.5rem] bg-gray-100 overflow-hidden border-4 border-white shadow-xl">
              <img 
                src="https://picsum.photos/seed/alexander/300/300" 
                alt="Alexander" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-white shadow-lg">
              <ShieldCheck size={16} />
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tighter">Alexander Pierce</h1>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <MapPin size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">Manhattan, NY</span>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <div className="bg-gray-50 px-6 py-3 rounded-2xl text-center">
              <p className="text-lg font-black tracking-tighter">12</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Projects</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 rounded-2xl text-center">
              <p className="text-lg font-black tracking-tighter">4.8</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="px-6 mt-8 space-y-4">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Account Management</h2>
        <div className="space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Screen)}
              className="w-full bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:border-black transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">{item.label}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.desc}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-colors" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => onNavigate('login')}
          className="w-full mt-8 p-6 bg-red-50 rounded-[2rem] flex items-center justify-center gap-3 text-red-500 hover:bg-red-100 transition-all"
        >
          <LogOut size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </div>
  );
};
