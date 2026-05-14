import React, { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, Star, ChevronLeft, Map as MapIcon, Grid, Navigation, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface MapViewProps {
  onNavigate: (screen: Screen) => void;
}

export const MapView: React.FC<MapViewProps> = ({ onNavigate }) => {
  const [selectedContractor, setSelectedContractor] = useState<any>(null);

  const contractors = [
    { id: '1', name: 'Jordan Smith', role: 'Master Carpenter', rating: 4.9, reviews: 124, location: 'Brooklyn, NY', price: '$$$', color: 'bg-blue-500', x: 45, y: 35 },
    { id: '2', name: 'Elena Rodriguez', role: 'Interior Architect', rating: 5.0, reviews: 89, location: 'Manhattan, NY', price: '$$$$', color: 'bg-purple-500', x: 65, y: 55 },
    { id: '3', name: 'Marcus Chen', role: 'Smart Home Specialist', rating: 4.8, reviews: 210, location: 'Queens, NY', price: '$$', color: 'bg-emerald-500', x: 25, y: 65 },
    { id: '4', name: 'Sarah Miller', role: 'Custom Cabinetry', rating: 4.7, reviews: 156, location: 'Brooklyn, NY', price: '$$$', color: 'bg-orange-500', x: 55, y: 75 },
  ];

  return (
    <div className="h-screen bg-gray-100 relative overflow-hidden">
      {/* Map Background (Simulated) */}
      <div className="absolute inset-0 bg-[#E5E3DF]">
        {/* Simple grid to simulate map lines */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Markers */}
        {contractors.map((contractor) => (
          <motion.button
            key={contractor.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setSelectedContractor(contractor)}
            className={`absolute w-10 h-10 rounded-full ${contractor.color} border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold z-10`}
            style={{ left: `${contractor.x}%`, top: `${contractor.y}%` }}
          >
            {contractor.name.split(' ').map(n => n[0]).join('')}
          </motion.button>
        ))}
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-40 space-y-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => onNavigate('discover')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Navigation size={20} />
            </button>
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Info size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search in this area..."
              className="w-full bg-white rounded-2xl py-3 pl-12 pr-4 text-sm shadow-lg focus:outline-none"
            />
          </div>
          <button className="p-3 bg-white rounded-2xl shadow-lg">
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Selected Contractor Card Overlay */}
      <AnimatePresence>
        {selectedContractor && (
          <motion.div 
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="absolute bottom-6 left-6 right-6 z-50"
          >
            <div className="bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl ${selectedContractor.color} flex items-center justify-center text-white text-xl font-bold`}>
                {selectedContractor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{selectedContractor.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{selectedContractor.role}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedContractor(null)}
                    className="text-gray-300 hover:text-black"
                  >
                    <ChevronLeft size={20} className="rotate-90" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-black text-black" />
                    <span className="text-xs font-bold">{selectedContractor.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={12} />
                    <span className="text-[10px] font-bold">{selectedContractor.location}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black">{selectedContractor.price}</span>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('profile')}
                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center"
              >
                <ChevronLeft size={24} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
