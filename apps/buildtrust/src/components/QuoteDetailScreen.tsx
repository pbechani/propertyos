import React from 'react';
import { ChevronLeft, Star, Clock, DollarSign, ArrowRight, CheckCircle2, MessageSquare, X, Shield, FileText, Plus, Minus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface QuoteDetailScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const QuoteDetailScreen: React.FC<QuoteDetailScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'breakdown' | 'terms'>('overview');
  const [showNegotiate, setShowNegotiate] = React.useState(false);
  const [showCounterOffer, setShowCounterOffer] = React.useState(false);
  const [showTimelineNegotiation, setShowTimelineNegotiation] = React.useState(false);
  const [showScopeNegotiation, setShowScopeNegotiation] = React.useState(false);
  const [counterAmount, setCounterAmount] = React.useState(1150);

  const quote = {
    id: '1',
    contractor: 'Elite Plumbing Solutions',
    contractorName: 'Marco Rossi',
    rating: 4.9,
    reviews: 124,
    amount: '$1,250',
    timeline: '3-4 days',
    avatar: 'https://picsum.photos/seed/marco/100/100',
    description: "I've reviewed your project and I'm confident we can handle this kitchen remodel efficiently. Our team specializes in high-end plumbing and fixture installations. We use only premium materials and provide a 2-year warranty on all labor.",
    breakdown: [
      { item: 'Labor & Installation', price: '$750' },
      { item: 'Materials & Fixtures', price: '$400' },
      { item: 'Permits & Disposal', price: '$100' }
    ],
    terms: [
      '50% deposit required to start',
      'Remaining 50% upon completion',
      '2-year labor warranty included',
      'All materials provided by contractor'
    ]
  };

  return (
    <div className="min-h-screen bg-white pb-32 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('quotesList')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Quote Detail</h1>
        </div>
        <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors">
          <Shield size={20} />
        </button>
      </header>

      <div className="flex-1 px-6 space-y-8">
        {/* Contractor Profile */}
        <section className="flex items-center gap-5 p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100">
          <img src={quote.avatar} className="w-16 h-16 rounded-2xl object-cover" alt={quote.contractorName} />
          <div className="flex-1">
            <h3 className="font-bold text-lg leading-tight">{quote.contractor}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-xs font-bold">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span>{quote.rating}</span>
              </div>
              <span className="text-gray-300">•</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{quote.reviews} Reviews</span>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('portfolio')}
            className="p-3 rounded-2xl bg-white shadow-sm text-black hover:bg-gray-100 transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </section>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-2xl">
          {(['overview', 'breakdown', 'terms'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Total Quote</span>
                    <span className="text-2xl font-bold text-black">{quote.amount}</span>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Timeline</span>
                    <span className="text-2xl font-bold text-black">{quote.timeline}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2">Contractor's Note</h3>
                  <p className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 text-sm text-gray-600 leading-relaxed italic">
                    "{quote.description}"
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'breakdown' && (
              <motion.div
                key="breakdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {quote.breakdown.map((item, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-sm">{item.item}</span>
                    <span className="font-bold text-black">{item.price}</span>
                  </div>
                ))}
                <div className="p-6 bg-black rounded-3xl text-white flex justify-between items-center shadow-xl shadow-black/10">
                  <span className="font-bold text-sm uppercase tracking-widest">Total</span>
                  <span className="text-xl font-bold">{quote.amount}</span>
                </div>
              </motion.div>
            )}

            {activeTab === 'terms' && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {quote.terms.map((term, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{term}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-4 z-30">
        <button 
          onClick={() => setShowNegotiate(true)}
          className="flex-1 bg-gray-50 text-black p-5 rounded-3xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <MessageSquare size={18} /> Negotiate
        </button>
        <button 
          onClick={() => onNavigate('quotesList')}
          className="p-5 rounded-3xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
        >
          <X size={20} />
        </button>
        <button 
          onClick={() => onNavigate('hireContractor')}
          className="flex-[2] bg-black text-white p-5 rounded-3xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <CheckCircle2 size={18} /> Accept Quote
        </button>
      </div>

      {/* Negotiate Overlay */}
      <AnimatePresence>
        {showNegotiate && (
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
              className="w-full bg-white rounded-t-[3rem] p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Negotiation</h2>
                <button 
                  onClick={() => setShowNegotiate(false)}
                  className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setShowNegotiate(false);
                    setShowCounterOffer(true);
                  }}
                  className="w-full p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:border-black transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black">
                      <DollarSign size={24} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold">Make Counter Offer</h4>
                      <p className="text-xs text-gray-400">Propose a different price</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => {
                    setShowNegotiate(false);
                    setShowTimelineNegotiation(true);
                  }}
                  className="w-full p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:border-black transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black">
                      <Clock size={24} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold">Request Timeline Change</h4>
                      <p className="text-xs text-gray-400">Ask for a faster or later start</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => {
                    setShowNegotiate(false);
                    setShowScopeNegotiation(true);
                  }}
                  className="w-full p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:border-black transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-black">
                      <FileText size={24} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold">Modify Scope</h4>
                      <p className="text-xs text-gray-400">Change materials or tasks</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="pt-4">
                <button 
                  className="w-full bg-black text-white p-6 rounded-3xl font-bold text-base flex items-center justify-center gap-3 shadow-2xl shadow-black/20"
                >
                  <MessageSquare size={20} /> Chat with Contractor
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Counter Offer Overlay */}
      <AnimatePresence>
        {showCounterOffer && (
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
              className="w-full bg-white rounded-t-[3rem] p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Counter Offer</h2>
                <button 
                  onClick={() => setShowCounterOffer(false)}
                  className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8 text-center">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Your Proposed Price</span>
                  <div className="flex items-center justify-center gap-8">
                    <button 
                      onClick={() => setCounterAmount(prev => Math.max(0, prev - 50))}
                      className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 transition-colors"
                    >
                      <Minus size={24} />
                    </button>
                    <span className="text-5xl font-bold tracking-tight">${counterAmount}</span>
                    <button 
                      onClick={() => setCounterAmount(prev => prev + 50)}
                      className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 transition-colors"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Original quote: {quote.amount}</p>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Reason for counter offer</label>
                  <textarea 
                    placeholder="e.g. I'm looking to stay within a specific budget, or I've received other quotes in this range..."
                    className="w-full p-6 bg-gray-50 rounded-3xl border border-gray-100 focus:border-black outline-none min-h-[120px] text-sm leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => {
                    setShowCounterOffer(false);
                    onNavigate('quotesList');
                  }}
                  className="w-full bg-black text-white p-6 rounded-3xl font-bold text-base flex items-center justify-center gap-3 shadow-2xl shadow-black/20"
                >
                  Send Counter Offer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Negotiation Overlay */}
      <AnimatePresence>
        {showTimelineNegotiation && (
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
              className="w-full bg-white rounded-t-[3rem] p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Timeline Request</h2>
                <button 
                  onClick={() => setShowTimelineNegotiation(false)}
                  className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Preferred Start</label>
                    <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Preferred End</label>
                    <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Additional Details</label>
                  <textarea 
                    placeholder="Why do you need to change the timeline?"
                    className="w-full p-6 bg-gray-50 rounded-3xl border border-gray-100 focus:border-black outline-none min-h-[120px] text-sm leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => {
                    setShowTimelineNegotiation(false);
                    onNavigate('chat');
                  }}
                  className="w-full bg-black text-white p-6 rounded-3xl font-bold text-base flex items-center justify-center gap-3 shadow-2xl shadow-black/20"
                >
                  Send Timeline Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scope Negotiation Overlay */}
      <AnimatePresence>
        {showScopeNegotiation && (
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
              className="w-full bg-white rounded-t-[3rem] p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Modify Scope</h2>
                <button 
                  onClick={() => setShowScopeNegotiation(false)}
                  className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Requested Changes</label>
                  <textarea 
                    placeholder="Describe the changes to materials, tasks, or deliverables..."
                    className="w-full p-6 bg-gray-50 rounded-3xl border border-gray-100 focus:border-black outline-none min-h-[160px] text-sm leading-relaxed"
                  />
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 items-start">
                  <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                    Modifying the scope may result in a price adjustment from the contractor.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => {
                    setShowScopeNegotiation(false);
                    onNavigate('chat');
                  }}
                  className="w-full bg-black text-white p-6 rounded-3xl font-bold text-base flex items-center justify-center gap-3 shadow-2xl shadow-black/20"
                >
                  Send Scope Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
