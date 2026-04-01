import React, { useState } from 'react';
import { ChevronLeft, AlertTriangle, MessageSquare, Camera, X, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface DisputeScreenProps {
  onNavigate: (screen: Screen) => void;
  userRole?: 'homeowner' | 'contractor';
}

export const DisputeScreen: React.FC<DisputeScreenProps> = ({ onNavigate, userRole }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const reasons = [
    'Quality of work',
    'Timeline delays',
    'Scope of work mismatch',
    'Payment dispute',
    'Contract breach',
    'Other'
  ];

  const handleSubmit = () => {
    setIsSubmitted(true);
    setTimeout(() => {
      onNavigate('jobDetail');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button 
          onClick={() => onNavigate('contractDetail')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Contract Dispute</h1>
      </header>

      <div className="p-6 space-y-8 pb-32">
        {/* Contract Summary Card */}
        <div className="bg-gray-50 rounded-[2.5rem] p-6 border border-gray-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Kitchen Remodel Agreement</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CTR-2026-0421</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Amount: $12,700.00</span>
            <span>•</span>
            <span>Deposit: $6,350.00</span>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-orange-50 border border-orange-100 p-6 rounded-[2.5rem] flex gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm flex-shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-orange-900">Escrow Protection Active</h3>
            <p className="text-xs text-orange-700 leading-relaxed">
              Opening a dispute will pause all pending payments. Our mediation team will review your case within 24-48 hours.
            </p>
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
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Description of the Issue</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide as much detail as possible..."
            className="w-full bg-gray-50 border-none rounded-[2rem] p-6 text-sm min-h-[160px] focus:ring-2 focus:ring-black transition-all"
          />
        </div>

        {/* Evidence Upload */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Evidence (Photos/Videos)</label>
          <div className="flex gap-4">
            <button className="w-20 h-20 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all border-2 border-dashed border-gray-200">
              <Camera size={24} />
              <span className="text-[8px] font-bold uppercase mt-1">Add</span>
            </button>
            <div className="w-20 h-20 rounded-2xl bg-gray-100 relative group overflow-hidden">
              <img src="https://picsum.photos/seed/dispute1/200/200" className="w-full h-full object-cover opacity-50" alt="Evidence" />
              <button className="absolute inset-0 flex items-center justify-center text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>
          </div>
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
          <Send size={18} /> Submit Dispute
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
                <h3 className="text-2xl font-bold tracking-tight">Dispute Filed</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We've received your request. A mediator will contact you shortly.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
