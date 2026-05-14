import React, { useState } from 'react';
import { Search, Bookmark, Star, MapPin, ChevronRight, MoreHorizontal, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface SavedScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const savedContractors = [
    { id: '1', name: 'Jordan Smith', role: 'Master Carpenter', rating: 4.9, reviews: 124, location: 'Brooklyn, NY', price: '$$$', color: 'bg-blue-500' },
    { id: '2', name: 'Elena Rodriguez', role: 'Interior Architect', rating: 5.0, reviews: 89, location: 'Manhattan, NY', price: '$$$$', color: 'bg-purple-500' },
    { id: '3', name: 'Marcus Chen', role: 'Smart Home Specialist', rating: 4.8, reviews: 210, location: 'Queens, NY', price: '$$', color: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 space-y-6 bg-white border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
          <button className="w-10 h-10 bg-gray-50 text-black rounded-full flex items-center justify-center">
            <Filter size={20} />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search your saved experts..."
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-black transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {savedContractors.length > 0 ? (
          savedContractors.map((contractor, i) => (
            <motion.div 
              key={contractor.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onNavigate('profile')}
              className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-black transition-colors"
            >
              <div className={`w-16 h-16 rounded-2xl ${contractor.color} flex items-center justify-center text-white text-xl font-bold`}>
                {contractor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold">{contractor.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{contractor.role}</p>
                  </div>
                  <button className="text-black">
                    <Bookmark size={20} className="fill-black" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-black text-black" />
                    <span className="text-xs font-bold">{contractor.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={12} />
                    <span className="text-[10px] font-bold">{contractor.location}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <Bookmark size={40} />
            </div>
            <div>
              <h3 className="text-lg font-bold">No saved experts</h3>
              <p className="text-sm text-gray-400">Save experts to easily find them later.</p>
            </div>
            <button className="px-8 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">
              Explore Experts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
