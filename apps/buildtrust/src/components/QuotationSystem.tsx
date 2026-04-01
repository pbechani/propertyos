import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  DollarSign, 
  FileText, 
  Paperclip, 
  ChevronRight, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Send, 
  History, 
  TrendingUp, 
  MoreVertical,
  Copy,
  XCircle,
  Calendar,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface QuotationSystemProps {
  onNavigate: (screen: Screen) => void;
  initialData?: any;
}

interface PriceItem {
  id: string;
  label: string;
  amount: number;
}

interface Quote {
  id: string;
  jobTitle: string;
  clientName: string;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'withdrawn' | 'rejected';
  date: string;
  items: PriceItem[];
  timeline: string;
}

const MOCK_QUOTES: Quote[] = [
  {
    id: 'Q-101',
    jobTitle: 'Emergency Pipe Repair',
    clientName: 'Robert D.',
    totalAmount: 450,
    status: 'pending',
    date: '2026-03-24',
    timeline: '1 day',
    items: [
      { id: '1', label: 'Emergency Call-out', amount: 150 },
      { id: '2', label: 'Pipe Materials', amount: 100 },
      { id: '3', label: 'Labor (3 hours)', amount: 200 }
    ]
  },
  {
    id: 'Q-98',
    jobTitle: 'Kitchen Backsplash',
    clientName: 'Linda W.',
    totalAmount: 950,
    status: 'accepted',
    date: '2026-03-20',
    timeline: '3 days',
    items: [
      { id: '1', label: 'Tiling Labor', amount: 600 },
      { id: '2', label: 'Grout & Adhesive', amount: 150 },
      { id: '3', label: 'Subway Tiles', amount: 200 }
    ]
  }
];

export const CreateQuoteScreen: React.FC<QuotationSystemProps> = ({ onNavigate, initialData }) => {
  const [items, setItems] = useState<PriceItem[]>(initialData?.items || [
    { id: '1', label: 'Labor', amount: 0 },
    { id: '2', label: 'Materials', amount: 0 }
  ]);
  const [timeline, setTimeline] = useState(initialData?.timeline || '3-5 days');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), label: '', amount: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof PriceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAiSuggest = () => {
    setIsAiSuggesting(true);
    setTimeout(() => {
      setItems([
        { id: '1', label: 'Standard Labor Rate', amount: 450 },
        { id: '2', label: 'Premium Materials', amount: 280 },
        { id: '3', label: 'Disposal Fee', amount: 75 }
      ]);
      setTimeline('2 days');
      setIsAiSuggesting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('jobFeed')} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Create Quote</h1>
        </div>
        <button 
          onClick={handleAiSuggest}
          disabled={isAiSuggesting}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          <Sparkles size={14} className={isAiSuggesting ? 'animate-pulse' : ''} />
          {isAiSuggesting ? 'Analyzing...' : 'AI Suggest'}
        </button>
      </header>

      <main className="p-6 space-y-8">
        {/* Price Breakdown */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price Breakdown</h2>
            <button onClick={addItem} className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-1">
              <Plus size={14} /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <motion.div 
                layout
                key={item.id} 
                className="flex gap-3 items-center bg-gray-50 p-4 rounded-2xl"
              >
                <div className="flex-1 space-y-1">
                  <input 
                    type="text" 
                    value={item.label}
                    onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                    placeholder="Item name"
                    className="w-full bg-transparent text-sm font-bold focus:outline-none"
                  />
                </div>
                <div className="w-24 relative">
                  <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="number" 
                    value={item.amount || ''}
                    onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2 py-2 bg-white rounded-xl text-sm font-bold text-right focus:outline-none"
                  />
                </div>
                <button onClick={() => removeItem(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </div>
          <div className="bg-black text-white p-6 rounded-[2.5rem] flex justify-between items-center shadow-xl shadow-black/10">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Quote</span>
            <span className="text-2xl font-bold">${total.toLocaleString()}</span>
          </div>
        </section>

        {/* Timeline */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Estimated Timeline</h2>
          <div className="grid grid-cols-2 gap-3">
            {['1-2 days', '3-5 days', '1 week', '2+ weeks'].map(t => (
              <button 
                key={t}
                onClick={() => setTimeline(t)}
                className={`py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  timeline === t ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Attachments */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Attachments</h2>
          <div className="grid grid-cols-3 gap-4">
            <button className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-100 transition-colors">
              <Plus size={24} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Upload</span>
            </button>
            <div className="aspect-square bg-gray-100 rounded-3xl relative overflow-hidden group">
              <img src="https://picsum.photos/seed/pipe1/200/200" alt="attachment" className="w-full h-full object-cover" />
              <button className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Additional Notes</h2>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe your approach, materials used, etc."
            className="w-full h-32 p-6 bg-gray-50 rounded-[2rem] text-sm font-medium focus:outline-none resize-none"
          />
        </section>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate('jobFeed')}
            className="flex-1 py-5 bg-gray-50 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onNavigate('quotePreview')}
            className="flex-[2] py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
          >
            Preview Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export const QuotePreviewScreen: React.FC<QuotationSystemProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button onClick={() => onNavigate('createQuote')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Preview Quote</h1>
      </header>

      <main className="p-8 space-y-10">
        <div className="space-y-2 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</p>
          <h2 className="text-5xl font-bold tracking-tighter">$805.00</h2>
        </div>

        <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Details</h3>
            <div className="space-y-1">
              <p className="text-lg font-bold">Emergency Pipe Repair</p>
              <p className="text-sm text-gray-500">Client: Robert D.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Standard Labor Rate', amount: 450 },
                { label: 'Premium Materials', amount: 280 },
                { label: 'Disposal Fee', amount: 75 }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">{item.label}</span>
                  <span className="font-bold">${item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">2 Days</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Paperclip size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">1 File</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-3xl flex gap-4 items-start">
          <Info className="text-blue-500 shrink-0" size={20} />
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            Once submitted, the client will be notified. You can withdraw or edit your quote until it is accepted.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <button 
          onClick={() => onNavigate('quoteSuccess')}
          className="w-full py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          Submit Quote
        </button>
      </div>
    </div>
  );
};

export const QuoteSuccessScreen: React.FC<QuotationSystemProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20"
      >
        <CheckCircle2 size={48} />
      </motion.div>
      <h2 className="text-3xl font-bold tracking-tight mb-4">Quote Submitted!</h2>
      <p className="text-gray-500 max-w-[260px] mb-12 leading-relaxed">
        Your proposal has been sent to Robert D. We'll notify you as soon as they respond.
      </p>
      <div className="w-full space-y-4">
        <button 
          onClick={() => onNavigate('quoteHistory')}
          className="w-full py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
        >
          View Quote History
        </button>
        <button 
          onClick={() => onNavigate('contractorHome')}
          className="w-full py-5 bg-gray-50 text-gray-400 rounded-full text-xs font-bold uppercase tracking-widest"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export const QuoteHistoryScreen: React.FC<QuotationSystemProps> = ({ onNavigate }) => {
  const [quotes, setQuotes] = useState(MOCK_QUOTES);

  const handleWithdraw = (id: string) => {
    setQuotes(quotes.map(q => q.id === id ? { ...q, status: 'withdrawn' } : q));
  };

  const handleDuplicate = (quote: Quote) => {
    onNavigate('createQuote');
    // In a real app, we'd pass the quote data to the creation screen
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('contractorHome')} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Quote History</h1>
        </div>
        <button onClick={() => onNavigate('quoteAnalytics')} className="p-3 bg-gray-50 rounded-2xl">
          <TrendingUp size={20} className="text-gray-400" />
        </button>
      </header>

      <main className="p-6 space-y-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {['All', 'Pending', 'Accepted', 'Rejected'].map(filter => (
            <button key={filter} className="px-6 py-2.5 rounded-full bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-black hover:text-white transition-all">
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {quotes.map((quote) => (
            <div key={quote.id} className="bg-white border border-gray-100 p-6 rounded-[2.5rem] shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">{quote.jobTitle}</h3>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                      quote.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' :
                      quote.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client: {quote.clientName} • {quote.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${quote.totalAmount}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">ID: {quote.id}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-50">
                {quote.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => onNavigate('editQuote')}
                      className="flex-1 py-3 bg-gray-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleWithdraw(quote.id)}
                      className="flex-1 py-3 bg-red-50 text-red-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors"
                    >
                      Withdraw
                    </button>
                  </>
                )}
                <button 
                  onClick={() => handleDuplicate(quote)}
                  className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export const QuoteAnalyticsScreen: React.FC<QuotationSystemProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button onClick={() => onNavigate('quoteHistory')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Quote Analytics</h1>
      </header>

      <main className="p-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Win Rate</p>
            <p className="text-4xl font-bold tracking-tighter">68%</p>
            <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
              <TrendingUp size={12} /> +12%
            </div>
          </div>
          <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg. Quote</p>
            <p className="text-4xl font-bold tracking-tighter">$1.2k</p>
            <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
              <TrendingUp size={12} /> +5%
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Performance Trend</h2>
          <div className="h-48 bg-gray-50 rounded-[2.5rem] flex items-end justify-between p-8 gap-2">
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-black rounded-t-xl" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between px-8 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Mon</span>
            <span>Sun</span>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Insights</h2>
          <div className="space-y-3">
            <div className="p-6 bg-purple-50 rounded-3xl flex gap-4 items-start">
              <Sparkles className="text-purple-500 shrink-0" size={20} />
              <p className="text-xs text-purple-700 leading-relaxed font-medium">
                Quotes with detailed material breakdowns are <span className="font-bold">24% more likely</span> to be accepted by clients in your area.
              </p>
            </div>
            <div className="p-6 bg-blue-50 rounded-3xl flex gap-4 items-start">
              <Info className="text-blue-500 shrink-0" size={20} />
              <p className="text-xs text-blue-700 leading-relaxed font-medium">
                Your response time is faster than <span className="font-bold">85% of contractors</span>. Keep it up to stay competitive!
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
