import React, { useState } from 'react';
import { ChevronLeft, CheckCircle2, Star, ShieldCheck, Download, ArrowRight, MessageSquare, Heart, Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface JobCompletionScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const JobCompletionScreen: React.FC<JobCompletionScreenProps> = ({ onNavigate }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hasConfirmedWork, setHasConfirmedWork] = useState(false);

  const handleConfirm = () => {
    setIsConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button 
          onClick={() => onNavigate('jobDetail')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Final Sign-off</h1>
      </header>

      <div className="p-6 space-y-12 pb-32">
        {/* Completion Card */}
        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[3rem] text-center space-y-6 shadow-sm">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-emerald-500 mx-auto shadow-xl shadow-emerald-200">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-emerald-900">Project Complete!</h2>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Marco Rossi has marked the final milestone as complete. Please review the work before releasing the final payment.
            </p>
          </div>
        </div>

        {/* Final Payment Summary */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Final Payment Summary</label>
          <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Final Milestone</span>
              <span className="text-sm font-bold">$1,500.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Escrow Balance</span>
              <span className="text-sm font-bold">$1,500.00</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between items-center">
              <span className="text-base font-bold">Total to Release</span>
              <span className="text-xl font-bold">$1,500.00</span>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate your experience</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className={`p-2 transition-all ${rating >= s ? 'text-yellow-400 scale-125' : 'text-gray-200 hover:text-gray-300'}`}
                >
                  <Star size={32} fill={rating >= s ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Leave a Review</label>
            <textarea 
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="How was the quality of work? Would you hire Marco again?"
              className="w-full bg-gray-50 border-none rounded-[2rem] p-6 text-sm min-h-[120px] focus:ring-2 focus:ring-black transition-all"
            />
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div 
          onClick={() => setHasConfirmedWork(!hasConfirmedWork)}
          className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-start gap-4 ${
            hasConfirmedWork ? 'bg-emerald-50 border-emerald-500' : 'bg-gray-50 border-transparent hover:border-gray-200'
          }`}
        >
          <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            hasConfirmedWork ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-200'
          }`}>
            {hasConfirmedWork && <CheckCircle2 size={14} className="text-white" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold">Confirm Completion</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              I have inspected the work and confirm that it has been completed to my satisfaction according to the contract.
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-3 text-gray-400 px-4">
          <ShieldCheck size={20} />
          <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            By clicking "Release Payment", you confirm that the work is complete and satisfactory.
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-40">
        <button 
          onClick={handleConfirm}
          disabled={rating === 0 || !hasConfirmedWork}
          className={`w-full py-5 rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
            rating > 0 && hasConfirmedWork ? 'bg-black text-white shadow-black/10 hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-100 text-gray-300'
          }`}
        >
          Release Payment & Finish <ArrowRight size={18} />
        </button>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {isConfirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 text-center space-y-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-blue-500" />
              
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-200 relative">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-emerald-500 rounded-full blur-xl"
                />
                <Sparkles size={48} className="relative" />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">Job Finalized!</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  The final payment has been released to Marco Rossi. Thank you for using our platform!
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => onNavigate('leaveReview')}
                  className="w-full bg-black text-white py-5 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  Leave Detailed Review <ArrowRight size={16} />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onNavigate('home')}
                    className="bg-gray-50 text-black py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Go Home
                  </button>
                  <button className="bg-gray-50 text-black py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
