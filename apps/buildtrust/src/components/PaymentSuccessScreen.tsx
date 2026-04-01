import React from 'react';
import { CheckCircle2, ArrowRight, Download, Share2, Sparkles, ShieldCheck, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface PaymentSuccessScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-12">
      {/* Success Icon */}
      <div className="relative">
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-200 relative z-10"
        >
          <CheckCircle2 size={64} />
        </motion.div>
        
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl opacity-20"
        />
        
        <div className="absolute -top-4 -right-4 text-yellow-400">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          >
            <Sparkles size={32} />
          </motion.div>
        </div>
      </div>

      {/* Text Content */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Payment Successful!</h1>
        <p className="text-base text-gray-500 leading-relaxed max-w-xs mx-auto">
          $2,585.00 has been successfully funded into escrow for the Kitchen Remodel project.
        </p>
      </div>

      {/* Transaction Details */}
      <div className="w-full max-w-sm bg-gray-50 rounded-[2.5rem] p-8 space-y-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Transaction ID</span>
          <span className="font-bold font-mono">#TXN-8829-XJ</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Date</span>
          <span className="font-bold">Mar 24, 2026 • 20:01</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Status</span>
          <div className="flex items-center gap-1 text-emerald-500 font-bold">
            <ShieldCheck size={14} /> Escrow Funded
          </div>
        </div>
        <div className="h-px bg-gray-200" />
        <div className="flex gap-3">
          <button className="flex-1 py-4 bg-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-sm">
            <Download size={14} /> Receipt
          </button>
          <button className="flex-1 py-4 bg-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-sm">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={() => onNavigate('jobDetail')}
          className="w-full py-5 bg-black text-white rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          View Project Details <ArrowRight size={18} />
        </button>
        <button 
          onClick={() => onNavigate('home')}
          className="w-full py-5 bg-gray-50 text-black rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
        >
          <Home size={18} /> Back to Home
        </button>
      </div>
    </div>
  );
};
