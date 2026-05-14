import React from 'react';
import { ChevronLeft, Mic, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface CreateProjectScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const CreateProjectScreen: React.FC<CreateProjectScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4">
        <button 
          onClick={() => onNavigate('home')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
      </header>

      <div className="px-6 py-4 space-y-8">
        <section>
          <p className="text-gray-500 mb-8">How would you like to start your next project? Choose a method that works best for you.</p>
          
          <div className="space-y-4">
            {/* AI Builder Option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('aiBuilder')}
              className="w-full bg-black text-white p-6 rounded-3xl flex items-center gap-6 text-left relative overflow-hidden group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Sparkles size={28} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">AI Project Builder</h3>
                <p className="text-white/60 text-xs leading-relaxed">Describe your vision and let our AI generate a detailed project plan for you.</p>
              </div>
              <ArrowRight size={20} className="text-white/40 group-hover:text-white transition-colors" />
              
              {/* Decorative glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors"></div>
            </motion.button>

            {/* Voice Input Option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('voiceInput')}
              className="w-full bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center gap-6 text-left group hover:border-black transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Mic size={28} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Voice Dictation</h3>
                <p className="text-gray-400 text-xs leading-relaxed">Speak naturally about your project requirements and we'll transcribe them.</p>
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
            </motion.button>

            {/* Manual Entry Option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('manualEntry')}
              className="w-full bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center gap-6 text-left group hover:border-black transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <FileText size={28} className="text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Manual Setup</h3>
                <p className="text-gray-400 text-xs leading-relaxed">Fill out a step-by-step form to define your project scope and budget.</p>
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
            </motion.button>
          </div>
        </section>

        {/* Recent Drafts */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Recent Drafts</h2>
            <button 
              onClick={() => onNavigate('drafts')}
              className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 italic text-gray-400 text-center text-sm">
            No active drafts found. Start a new project above.
          </div>
        </section>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
