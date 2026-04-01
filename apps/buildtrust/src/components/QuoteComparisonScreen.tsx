import React from 'react';
import { ChevronLeft, Star, Clock, DollarSign, CheckCircle2, X, Info, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface QuoteComparisonScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const QuoteComparisonScreen: React.FC<QuoteComparisonScreenProps> = ({ onNavigate }) => {
  const quotes = [
    {
      id: '1',
      contractor: 'Elite Plumbing',
      amount: '$1,250',
      timeline: '3-4 days',
      rating: 4.9,
      reviews: 124,
      warranty: '2 Years',
      materials: 'Premium',
      deposit: '50%',
      avatar: 'https://picsum.photos/seed/marco/100/100'
    },
    {
      id: '2',
      contractor: 'ProFix Services',
      amount: '$1,100',
      timeline: '5 days',
      rating: 4.7,
      reviews: 89,
      warranty: '1 Year',
      materials: 'Standard',
      deposit: '30%',
      avatar: 'https://picsum.photos/seed/sarah/100/100'
    },
    {
      id: '3',
      contractor: 'Modern Craft',
      amount: '$1,400',
      timeline: '2 days',
      rating: 5.0,
      reviews: 42,
      warranty: '5 Years',
      materials: 'Luxury',
      deposit: '40%',
      avatar: 'https://picsum.photos/seed/david/100/100'
    }
  ];

  const features = [
    { label: 'Total Quote', key: 'amount' },
    { label: 'Timeline', key: 'timeline' },
    { label: 'Rating', key: 'rating' },
    { label: 'Warranty', key: 'warranty' },
    { label: 'Materials', key: 'materials' },
    { label: 'Deposit', key: 'deposit' }
  ];

  return (
    <div className="min-h-screen bg-white pb-12 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('quotesList')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Comparison</h1>
        </div>
        <button className="p-2 rounded-full bg-gray-50 text-gray-400 hover:text-black transition-colors">
          <Info size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-x-auto no-scrollbar">
        <div className="min-w-[800px] px-6 space-y-8">
          {/* Contractor Headers */}
          <div className="grid grid-cols-4 gap-4 sticky top-[88px] bg-white/80 backdrop-blur-md py-4 z-10">
            <div className="flex items-end pb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Features</span>
            </div>
            {quotes.map((quote) => (
              <div key={quote.id} className="space-y-3 text-center">
                <img src={quote.avatar} className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-sm" alt={quote.contractor} />
                <h3 className="font-bold text-sm leading-tight">{quote.contractor}</h3>
              </div>
            ))}
          </div>

          {/* Comparison Grid */}
          <div className="space-y-2">
            {features.map((feature, i) => (
              <motion.div 
                key={feature.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="grid grid-cols-4 gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100 items-center"
              >
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{feature.label}</span>
                {quotes.map((quote) => (
                  <div key={quote.id} className="text-center">
                    {feature.key === 'rating' ? (
                      <div className="flex items-center justify-center gap-1 font-bold text-sm">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span>{quote.rating}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-sm">{quote[feature.key as keyof typeof quote]}</span>
                    )}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4 pt-4">
            <div></div>
            {quotes.map((quote) => (
              <button 
                key={quote.id}
                onClick={() => onNavigate('quoteDetail')}
                className="p-4 bg-black text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Select Quote
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
