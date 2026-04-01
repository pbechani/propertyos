import React from 'react';
import { ChevronLeft, Filter, Star, Clock, DollarSign, ArrowRight, CheckCircle2, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface QuotesListScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const QuotesListScreen: React.FC<QuotesListScreenProps> = ({ onNavigate }) => {
  const quotes = [
    {
      id: '1',
      contractor: 'Elite Plumbing Solutions',
      contractorName: 'Marco Rossi',
      rating: 4.9,
      reviews: 124,
      amount: '$1,250',
      timeline: '3-4 days',
      status: 'new',
      avatar: 'https://picsum.photos/seed/marco/100/100',
      isTopRated: true
    },
    {
      id: '2',
      contractor: 'ProFix Home Services',
      contractorName: 'Sarah Jenkins',
      rating: 4.7,
      reviews: 89,
      amount: '$1,100',
      timeline: '5 days',
      status: 'new',
      avatar: 'https://picsum.photos/seed/sarah/100/100',
      isTopRated: false
    },
    {
      id: '3',
      contractor: 'Modern Craft Builders',
      contractorName: 'David Chen',
      rating: 5.0,
      reviews: 42,
      amount: '$1,400',
      timeline: '2 days',
      status: 'new',
      avatar: 'https://picsum.photos/seed/david/100/100',
      isTopRated: true
    }
  ];

  return (
    <div className="min-h-screen bg-white pb-24 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('projects')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Kitchen Remodel</p>
          </div>
        </div>
        <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors">
          <Filter size={20} />
        </button>
      </header>

      <div className="flex-1 px-6 space-y-6">
        {/* Compare Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-black rounded-[2rem] text-white flex items-center justify-between shadow-xl shadow-black/10"
        >
          <div className="space-y-1">
            <h3 className="font-bold">Compare Quotes</h3>
            <p className="text-xs text-white/60">See side-by-side comparison of all offers</p>
          </div>
          <button 
            onClick={() => onNavigate('quoteComparison')}
            className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </motion.div>

        {/* Quotes List */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-2">Received ({quotes.length})</h2>
          {quotes.map((quote, i) => (
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onNavigate('quoteDetail')}
              className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col gap-6 group hover:border-black hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="relative">
                    <img src={quote.avatar} className="w-14 h-14 rounded-2xl object-cover" alt={quote.contractorName} />
                    {quote.isTopRated && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                        <Star size={12} className="text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div>
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
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <MoreVertical size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Total Quote</span>
                  <span className="text-lg font-bold text-black">{quote.amount}</span>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Timeline</span>
                  <span className="text-lg font-bold text-black">{quote.timeline}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Verified Expert</span>
                </div>
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black group-hover:translate-x-2 transition-transform">
                  View Offer <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
