import React, { useState } from 'react';
import { ChevronLeft, ShieldCheck, CreditCard, ArrowRight, Info, Lock, Wallet, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface EscrowFundingScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const EscrowFundingScreen: React.FC<EscrowFundingScreenProps> = ({ onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFund = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onNavigate('paymentSuccess');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button 
          onClick={() => onNavigate('paymentMethod')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Fund Escrow</h1>
      </header>

      <div className="p-6 space-y-8 pb-32">
        {/* Project Summary */}
        <div className="bg-gray-50 rounded-[3rem] p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Kitchen Remodel</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contractor: Marco Rossi</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-sm">
              <Lock size={20} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Project Value</span>
              <span className="font-bold">$12,700.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Initial Deposit (20%)</span>
              <span className="font-bold">$2,540.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Service Fee</span>
              <span className="font-bold">$45.00</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between items-center">
              <span className="text-base font-bold">Amount to Fund</span>
              <span className="text-2xl font-bold">$2,585.00</span>
            </div>
          </div>
        </div>

        {/* Payment Method Preview */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Funding Source</label>
          <div className="bg-white border border-gray-100 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-black">
                <CreditCard size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Visa •••• 4242</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expires 12/26</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('paymentMethod')}
              className="text-[10px] font-bold text-black uppercase tracking-widest underline"
            >
              Change
            </button>
          </div>
        </div>

        {/* Escrow Info */}
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2.5rem] flex gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-blue-900">How Escrow Works</h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              Your funds are held securely by our platform. They are only released to the contractor when you approve each milestone completion.
            </p>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 px-4">
          <div className="mt-1">
            <Info size={16} className="text-gray-400" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
            By clicking "Fund Escrow", you authorize a charge of $2,585.00 to your selected payment method.
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-40">
        <button 
          onClick={handleFund}
          disabled={isProcessing}
          className={`w-full py-5 rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
            isProcessing ? 'bg-gray-100 text-gray-300' : 'bg-black text-white shadow-black/10 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isProcessing ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full"
            />
          ) : (
            <>Fund Escrow <ArrowRight size={18} /></>
          )}
        </button>
      </div>

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-6"
          >
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white shadow-2xl relative overflow-hidden">
              <motion.div 
                animate={{ y: [0, -100] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-t from-emerald-500 to-transparent opacity-20"
              />
              <Wallet size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Processing Payment</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Please don't close the app. We're securing your funds in escrow.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
