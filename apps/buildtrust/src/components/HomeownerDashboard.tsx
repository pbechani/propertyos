import React from 'react';
import { Bell, Search, MapPin, Star, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface HomeownerDashboardProps {
  onNavigate: (screen: Screen) => void;
}

export const HomeownerDashboard: React.FC<HomeownerDashboardProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F9F9F9] pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-white border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, Alexander</h1>
          <p className="text-sm text-gray-500 font-medium">Tuesday, March 24</p>
        </div>
        <button 
          onClick={() => onNavigate('notifications')}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Bell size={24} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Active Project Card */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Active Project</h2>
            <button 
              onClick={() => onNavigate('projects')}
              className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onNavigate('jobDetail')}
            className="bg-black text-white rounded-2xl p-6 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className="relative z-10">
              <span className="inline-block px-2 py-1 bg-white/10 rounded text-[10px] font-bold uppercase tracking-wider mb-3">In Progress</span>
              <h3 className="text-xl font-bold mb-1">Kitchen Remodel</h3>
              <p className="text-white/60 text-sm mb-6">Phase 2: Cabinetry Installation</p>
              
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-blue-500 flex items-center justify-center text-[10px] font-bold">JS</div>
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-700 flex items-center justify-center text-[10px] font-bold">+2</div>
                </div>
                <span className="text-xs font-medium text-white/80">3 team members active</span>
              </div>
            </div>
            {/* Abstract background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          </motion.div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('discover')}
            className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col gap-3 hover:border-black transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <Search size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Find Experts</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Discover Talent</p>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('createProject')}
            className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col gap-3 hover:border-black transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold">New Project</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Start Planning</p>
            </div>
          </button>
        </section>

        {/* Recommended for You */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Recommended Experts</h2>
            <button 
              onClick={() => onNavigate('discover')}
              className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-1"
            >
              See More <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Jordan Smith', role: 'Master Carpenter', rating: 4.9, reviews: 124, location: 'Brooklyn, NY', color: 'bg-blue-500' },
              { name: 'Elena Rodriguez', role: 'Interior Architect', rating: 5.0, reviews: 89, location: 'Manhattan, NY', color: 'bg-purple-500' },
              { name: 'Marcus Chen', role: 'Smart Home Specialist', rating: 4.8, reviews: 210, location: 'Queens, NY', color: 'bg-emerald-500' }
            ].map((expert, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onNavigate('profile')}
                className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-black transition-colors"
              >
                <div className={`w-12 h-12 rounded-full ${expert.color} flex items-center justify-center text-white font-bold`}>
                  {expert.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">{expert.name}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{expert.role}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star size={10} className="fill-black text-black" />
                      <span className="text-[10px] font-bold">{expert.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <MapPin size={10} />
                      <span className="text-[10px] font-bold">{expert.location}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
