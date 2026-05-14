import React from 'react';
import { ChevronLeft, FileText, Trash2, ArrowRight, Clock, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface DraftsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const DraftsScreen: React.FC<DraftsScreenProps> = ({ onNavigate }) => {
  const drafts = [
    { id: '1', title: 'Kitchen Remodel', lastEdited: '2 hours ago', progress: 65, category: 'Interior' },
    { id: '2', title: 'Backyard Deck', lastEdited: 'Yesterday', progress: 30, category: 'Exterior' },
    { id: '3', title: 'Smart Lighting Setup', lastEdited: '3 days ago', progress: 90, category: 'Electrical' }
  ];

  return (
    <div className="min-h-screen bg-white pb-12 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('createProject')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Project Drafts</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
          <FileText size={20} />
        </div>
      </header>

      <div className="flex-1 px-6 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">{drafts.length} Active Drafts</h2>
          <button className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-1">
            <Trash2 size={14} /> Clear All
          </button>
        </div>

        <div className="space-y-4">
          {drafts.map((draft, i) => (
            <motion.div 
              key={draft.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-5 group hover:border-black hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <FileText size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{draft.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <Clock size={12} />
                      <span>Edited {draft.lastEdited}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <MoreVertical size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em]">
                  <span className="text-gray-400">Completion</span>
                  <span className="text-black">{draft.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${draft.progress}%` }}
                    transition={{ duration: 1.5, delay: i * 0.2, ease: "easeOut" }}
                    className="h-full bg-black rounded-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="px-3 py-1.5 bg-white rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-100">{draft.category}</span>
                <button 
                  onClick={() => onNavigate('manualEntry')}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black group-hover:translate-x-2 transition-transform"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="pt-8">
          <button 
            onClick={() => onNavigate('createProject')}
            className="w-full bg-gray-50 border border-dashed border-gray-300 p-6 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-black hover:text-black transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Plus size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Start New Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Plus = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14M12 5v14"/>
  </svg>
);
