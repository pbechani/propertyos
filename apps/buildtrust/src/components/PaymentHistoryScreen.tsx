import React, { useState } from 'react';
import { ChevronLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, Download, FileText, MoreHorizontal, ShieldCheck, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface PaymentHistoryScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'escrow' | 'refunds'>('all');

  const transactions = [
    { id: '1', title: 'Kitchen Remodel - Escrow Funding', type: 'escrow', amount: '$2,585.00', date: 'Mar 24, 2026', status: 'funded', icon: <Wallet size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: '2', title: 'Bathroom Tiling - Milestone 1', type: 'payment', amount: '$1,200.00', date: 'Mar 15, 2026', status: 'released', icon: <ShieldCheck size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: '3', title: 'Deck Construction - Refund', type: 'refund', amount: '$450.00', date: 'Mar 10, 2026', status: 'refunded', icon: <ArrowDownLeft size={18} />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: '4', title: 'Basement Finishing - Final Payment', type: 'payment', amount: '$3,500.00', date: 'Feb 28, 2026', status: 'released', icon: <ShieldCheck size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 space-y-6 bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('homeownerProfile')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black transition-all"
            />
          </div>
          <button className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-black hover:bg-gray-100 transition-colors">
            <Filter size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50 p-1 rounded-2xl">
          {(['all', 'escrow', 'refunds'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Transactions List */}
      <div className="p-6 space-y-4">
        {transactions.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onNavigate('invoice')}
            className="p-6 bg-white rounded-[2.5rem] border border-gray-100 hover:border-black transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${tx.bg} ${tx.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                  {tx.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold group-hover:text-black transition-colors">{tx.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tx.date}</span>
                    <span className="text-gray-300">•</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${tx.color}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-bold">{tx.amount}</p>
                <button className="text-gray-300 hover:text-black transition-colors">
                  <Download size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Export Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-40">
        <button className="w-full py-5 bg-black text-white rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <FileText size={18} /> Export Statement (PDF)
        </button>
      </div>
    </div>
  );
};
