import React from 'react';
import { ChevronLeft, Shield, FileText, CheckCircle2, ArrowRight, X, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface HireContractorScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const HireContractorScreen: React.FC<HireContractorScreenProps> = ({ onNavigate }) => {
  const [isSigned, setIsSigned] = React.useState(false);
  const [showContract, setShowContract] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  const contractor = {
    name: 'Elite Plumbing Solutions',
    contractorName: 'Marco Rossi',
    amount: '$1,250',
    timeline: '3-4 days',
    deposit: '$625 (50%)',
    avatar: 'https://picsum.photos/seed/marco/100/100'
  };

  return (
    <div className="min-h-screen bg-white pb-32 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('quoteDetail')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Hire Expert</h1>
        </div>
        <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors">
          <Info size={20} />
        </button>
      </header>

      <div className="flex-1 px-6 space-y-8">
        {/* Summary Card */}
        <section className="p-8 bg-black rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-black/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div className="flex items-center gap-4">
            <img src={contractor.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10" alt={contractor.name} />
            <div>
              <h3 className="font-bold text-lg leading-tight">{contractor.name}</h3>
              <p className="text-xs text-white/50">{contractor.contractorName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Total Amount</span>
              <span className="text-xl font-bold">{contractor.amount}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Timeline</span>
              <span className="text-xl font-bold">{contractor.timeline}</span>
            </div>
          </div>
        </section>

        {/* Protection Banner */}
        <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
            <Shield size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-emerald-900">Payment Protection Active</h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your funds are held securely in escrow and only released when you approve the completed work.
            </p>
          </div>
        </div>

        {/* Contract Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-2">Legal & Terms</h3>
          
          <button 
            onClick={() => setShowContract(true)}
            className="w-full p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:border-black transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black">
                <FileText size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold">Service Agreement</h4>
                <p className="text-xs text-gray-400">Review full contract details</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black">
                <AlertCircle size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold">Deposit Required</h4>
                <p className="text-xs text-gray-400">To secure the start date</p>
              </div>
              <div className="ml-auto text-right">
                <span className="text-lg font-bold text-black">{contractor.deposit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Checkbox */}
        <label className="flex gap-4 p-4 cursor-pointer group">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="peer appearance-none w-6 h-6 rounded-lg border-2 border-gray-200 checked:bg-black checked:border-black transition-all"
            />
            <CheckCircle2 size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <span className="text-xs text-gray-500 leading-relaxed">
            I agree to the Service Agreement and authorize the deposit payment of {contractor.deposit} to be held in escrow.
          </span>
        </label>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 z-30">
        <button 
          disabled={!agreedToTerms}
          onClick={() => onNavigate('paymentMethod')}
          className={`w-full p-6 rounded-3xl font-bold text-base flex items-center justify-center gap-3 transition-all ${agreedToTerms ? 'bg-black text-white shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          Confirm & Hire Expert
        </button>
      </div>

      {/* Contract Preview Overlay */}
      <AnimatePresence>
        {showContract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full h-[90vh] bg-white rounded-t-[3rem] p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Service Agreement</h2>
                <button 
                  onClick={() => setShowContract(false)}
                  className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm text-gray-600 leading-relaxed">
                <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                  <h4 className="font-bold text-black uppercase tracking-widest text-[10px]">1. Scope of Work</h4>
                  <p>Contractor agrees to perform the following services: Full kitchen plumbing remodel, including installation of new sink, faucet, dishwasher connection, and garbage disposal. All work will be performed in accordance with local building codes.</p>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                  <h4 className="font-bold text-black uppercase tracking-widest text-[10px]">2. Payment Terms</h4>
                  <p>Total project cost is {contractor.amount}. A deposit of {contractor.deposit} is required to secure the start date. Final payment is due upon completion and client approval of work.</p>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                  <h4 className="font-bold text-black uppercase tracking-widest text-[10px]">3. Timeline</h4>
                  <p>Work is estimated to begin on April 1st, 2026 and be completed within {contractor.timeline}. Contractor will notify client of any potential delays immediately.</p>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                  <h4 className="font-bold text-black uppercase tracking-widest text-[10px]">4. Warranty</h4>
                  <p>Contractor provides a 2-year limited warranty on all labor performed. Material warranties are provided by the respective manufacturers.</p>
                </div>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => setShowContract(false)}
                  className="w-full bg-black text-white p-6 rounded-3xl font-bold text-base shadow-2xl shadow-black/20"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
