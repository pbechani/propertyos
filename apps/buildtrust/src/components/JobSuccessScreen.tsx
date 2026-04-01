import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, ArrowRight, Share2, Calendar, Layout } from 'lucide-react';
import { Screen } from '../types';

interface JobSuccessScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const JobSuccessScreen: React.FC<JobSuccessScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[120px] -z-10"></div>

      <motion.div 
        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 100 }}
        className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-emerald-200"
      >
        <CheckCircle size={64} className="text-white" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 max-w-xs"
      >
        <h1 className="text-4xl font-bold tracking-tight leading-tight">Job Posted Successfully!</h1>
        <p className="text-gray-500 text-base leading-relaxed">
          Your project is now live. Contractors in your area will be notified and can start sending you quotes.
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
          <Layout size={20} /> View My Projects
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            className="bg-gray-50 text-gray-500 p-5 rounded-3xl font-bold text-xs flex items-center justify-center gap-2 border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <Share2 size={18} /> Share Job
          </button>
          <button 
            className="bg-gray-50 text-gray-500 p-5 rounded-3xl font-bold text-xs flex items-center justify-center gap-2 border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <Calendar size={18} /> Add to Cal
          </button>
        </div>

        <button 
          onClick={() => onNavigate('home')}
          className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] pt-8 hover:text-black transition-colors"
        >
          Back to Dashboard
        </button>
      </motion.div>

      {/* Confetti simulation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              top: '100%', 
              left: `${Math.random() * 100}%`,
              scale: Math.random() * 0.5 + 0.5,
              rotate: 0
            }}
            animate={{ 
              top: '-10%',
              rotate: 360,
              left: `${Math.random() * 100}%`
            }}
            transition={{ 
              duration: Math.random() * 2 + 2,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className={`absolute w-2 h-2 rounded-sm ${['bg-blue-400', 'bg-emerald-400', 'bg-yellow-400', 'bg-purple-400'][Math.floor(Math.random() * 4)]}`}
          />
        ))}
      </div>
    </div>
  );
};
