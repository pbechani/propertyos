import React from 'react';
import { CheckCircle, Layout, Share2, Calendar, ShieldCheck, ArrowRight, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface ContractSuccessScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ContractSuccessScreen: React.FC<ContractSuccessScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-black/5 rounded-full blur-[120px] -z-10"></div>

      <motion.div 
        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 100 }}
        className="w-32 h-32 bg-black rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-black/20"
      >
        <ShieldCheck size={64} className="text-white" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 max-w-xs"
      >
        <h1 className="text-4xl font-bold tracking-tight leading-tight">Contract Signed!</h1>
        <p className="text-gray-500 text-base leading-relaxed">
          You've officially hired Elite Plumbing Solutions. Your deposit is held in escrow and work is scheduled to begin.
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 w-full space-y-4"
      >
        <button 
          onClick={() => onNavigate('projects')}
          className="w-full bg-black text-white p-6 rounded-3xl font-bold text-base flex items-center justify-center gap-3 shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Layout size={20} /> Go to Project Dashboard
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            className="bg-gray-50 text-gray-500 p-5 rounded-3xl font-bold text-xs flex items-center justify-center gap-2 border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <MessageSquare size={18} /> Message Pro
          </button>
          <button 
            className="bg-gray-50 text-gray-500 p-5 rounded-3xl font-bold text-xs flex items-center justify-center gap-2 border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <Calendar size={18} /> View Schedule
          </button>
        </div>

        <button 
          onClick={() => onNavigate('home')}
          className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] pt-8 hover:text-black transition-colors"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
};
