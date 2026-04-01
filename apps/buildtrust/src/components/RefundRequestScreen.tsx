import React, { useState } from 'react';
import { ChevronLeft, AlertCircle, MessageSquare, Camera, X, Send, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface RefundRequestScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const RefundRequestScreen: React.FC<RefundRequestScreenProps> = ({ onNavigate }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const reasons = [
    'Job cancelled',
    'Overcharged',
    'Duplicate payment',
    'Work not completed',
    'Quality issues',
    'Other'
  ];

  const handleSubmit = () => {
    setIsSubmitted(true);
    setTimeout(() => {
      onNavigate('paymentHistory');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button 
          onClick={() => onNavigate('invoice')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Request Refund</h1>
      </header>

      <div className="p-6 space-y-8 pb-32">
        {/* Warning Banner */}
        <div className="bg-orange-50 border border-orange-100 p-6 rounded-[2.5rem] flex gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-orange-900">Refund Policy</h3>
            <p className="text-xs text-orange-700 leading-relaxed">
              Refunds for escrowed funds are processed within 3-5 business days after approval. Some fees may be non-refundable.
            </p>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-gray-50 rounded-[2rem] p-6 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction to Refund</p>
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold">#INV-2026-0324</p>
            <p className="text-sm font-bold text-orange-500">$2,585.00</p>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Primary Reason</label>
          <div className="grid grid-cols-2 gap-2">
            {reasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`p-4 rounded-2xl text-xs font-bold transition-all border ${
                  reason === r ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Additional Details</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please explain why you're requesting a refund..."
            className="w-full bg-gray-50 border-none rounded-[2rem] p-6 text-sm min-h-[160px] focus:ring-2 focus:ring-black transition-all"
          />
        </div>

        {/* Evidence Upload */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Supporting Evidence (Optional)</label>
          <button className="w-full h-32 rounded-[2rem] bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all border-2 border-dashed border-gray-200">
            <Camera size={32} />
            <span className="text-[10px] font-bold uppercase mt-2">Upload Photos</span>
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-40">
        <button 
          onClick={handleSubmit}
          disabled={!reason || !description}
          className={`w-full py-5 rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
            reason && description ? 'bg-black text-white shadow-black/10 hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-100 text-gray-300'
          }`}
        >
          <Send size={18} /> Submit Refund Request
        </button>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 text-center space-y-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-200">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">Request Received</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We've received your refund request. Our team will review it and get back to you within 3 business days.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
