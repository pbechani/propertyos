import React from 'react';
import { Home, Search, Briefcase, MessageSquare, Bookmark, User, TrendingUp } from 'lucide-react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  userRole: 'homeowner' | 'contractor';
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, userRole }) => {
  const navItems = [
    { id: (userRole === 'contractor' ? 'contractorHome' : 'home') as Screen, icon: Home, label: 'Home' },
    { id: (userRole === 'contractor' ? 'jobFeed' : 'discover') as Screen, icon: Search, label: userRole === 'contractor' ? 'Job Feed' : 'Discover' },
    ...(userRole === 'contractor' ? [
      { id: 'activeJobs' as Screen, icon: Briefcase, label: 'Active' },
      { id: 'conversationsList' as Screen, icon: MessageSquare, label: 'Messages' },
      { id: 'quoteHistory' as Screen, icon: Bookmark, label: 'Quotes' },
      { id: 'profile' as Screen, icon: User, label: 'Profile' },
    ] : []),
    ...(userRole === 'homeowner' ? [
      { id: 'projects' as Screen, icon: Briefcase, label: 'Projects' },
      { id: 'conversationsList' as Screen, icon: MessageSquare, label: 'Messages' },
      { id: 'saved' as Screen, icon: Bookmark, label: 'Saved' },
      { id: 'homeownerProfile' as Screen, icon: User, label: 'Profile' },
    ] : []),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-black' : 'text-gray-400'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
