import React from 'react';
import { ChevronLeft, Grid, List, Share2, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface PortfolioScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const PortfolioScreen: React.FC<PortfolioScreenProps> = ({ onNavigate }) => {
  const projects = [
    { id: '1', title: 'Minimalist Kitchen', category: 'Renovation', year: '2025', image: 'https://picsum.photos/seed/k1/800/800' },
    { id: '2', title: 'Custom Oak Library', category: 'Carpentry', year: '2024', image: 'https://picsum.photos/seed/k2/800/800' },
    { id: '3', title: 'Modern Decking', category: 'Exterior', year: '2024', image: 'https://picsum.photos/seed/k3/800/800' },
    { id: '4', title: 'Loft Conversion', category: 'Full Build', year: '2023', image: 'https://picsum.photos/seed/k4/800/800' },
    { id: '5', title: 'Heritage Restoration', category: 'Restoration', year: '2023', image: 'https://picsum.photos/seed/k5/800/800' },
    { id: '6', title: 'Bespoke Wardrobes', category: 'Carpentry', year: '2022', image: 'https://picsum.photos/seed/k6/800/800' },
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
        <h1 className="text-sm font-bold uppercase tracking-widest">Project Portfolio</h1>
        <div className="flex gap-2">
          <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Jordan Smith</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">6 Projects Published</p>
          </div>
          <div className="flex bg-gray-50 p-1 rounded-xl">
            <button className="p-2 bg-white rounded-lg shadow-sm"><Grid size={18} /></button>
            <button className="p-2 text-gray-400"><List size={18} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {projects.map((project, i) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
            >
              <img 
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-white text-xs font-bold">{project.title}</h3>
                <p className="text-white/60 text-[8px] font-bold uppercase tracking-wider">{project.category} • {project.year}</p>
              </div>
              <button className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Heart size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
