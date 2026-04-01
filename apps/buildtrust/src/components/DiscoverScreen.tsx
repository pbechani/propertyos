import React, { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, Star, ChevronRight, Map as MapIcon, Grid } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface DiscoverScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const categories = [
    { name: 'Carpentry', icon: '🪚', count: 124 },
    { name: 'Plumbing', icon: '🚰', count: 89 },
    { name: 'Electrical', icon: '⚡', count: 56 },
    { name: 'Painting', icon: '🎨', count: 210 },
    { name: 'Masonry', icon: '🧱', count: 45 },
    { name: 'Landscaping', icon: '🌿', count: 132 },
  ];

  const contractors = [
    { id: '1', name: 'Jordan Smith', role: 'Master Carpenter', rating: 4.9, reviews: 124, location: 'Brooklyn, NY', price: '$$$', color: 'bg-blue-500' },
    { id: '2', name: 'Elena Rodriguez', role: 'Interior Architect', rating: 5.0, reviews: 89, location: 'Manhattan, NY', price: '$$$$', color: 'bg-purple-500' },
    { id: '3', name: 'Marcus Chen', role: 'Smart Home Specialist', rating: 4.8, reviews: 210, location: 'Queens, NY', price: '$$', color: 'bg-emerald-500' },
    { id: '4', name: 'Sarah Miller', role: 'Custom Cabinetry', rating: 4.7, reviews: 156, location: 'Brooklyn, NY', price: '$$$', color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 space-y-4 bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
          <button 
            onClick={() => onNavigate(viewMode === 'grid' ? 'map' : 'discover')}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest"
          >
            {viewMode === 'grid' ? <MapIcon size={14} /> : <Grid size={14} />}
            {viewMode === 'grid' ? 'Map View' : 'Grid View'}
          </button>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search experts, skills, or projects..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-black transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-3 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors">
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Categories */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Categories</h2>
            <button className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-1">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            {categories.map((cat, i) => (
              <motion.button 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-2 min-w-[100px] hover:border-black transition-colors"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{cat.name}</span>
                <span className="text-[8px] text-gray-400 font-bold">{cat.count} Experts</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Featured Contractors */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Featured Experts</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {contractors.map((contractor, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onNavigate('profile')}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:border-black transition-colors group cursor-pointer"
              >
                <div className="h-48 bg-gray-100 relative">
                  <img 
                    src={`https://picsum.photos/seed/${contractor.id}/800/400`} 
                    alt={contractor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={12} className="fill-black text-black" />
                    <span className="text-xs font-bold">{contractor.rating}</span>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full ${contractor.color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                      {contractor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{contractor.price}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">{contractor.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{contractor.role}</p>
                    <div className="flex items-center gap-1 text-gray-400 mt-1">
                      <MapPin size={12} />
                      <span className="text-[10px] font-bold">{contractor.location}</span>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
