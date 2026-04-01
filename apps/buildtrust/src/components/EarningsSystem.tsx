import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Download, 
  ChevronRight, 
  CreditCard, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Search,
  FileText,
  Plus,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Screen } from '../types';

interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

// --- Mock Data ---
const earningsData = [
  { name: 'Mon', amount: 450 },
  { name: 'Tue', amount: 800 },
  { name: 'Wed', amount: 600 },
  { name: 'Thu', amount: 1200 },
  { name: 'Fri', amount: 950 },
  { name: 'Sat', amount: 1500 },
  { name: 'Sun', amount: 1100 },
];

const transactions = [
  { id: 'TX12345', type: 'Payment', title: 'Kitchen Remodel Milestone 2', date: 'Mar 24, 2026', amount: 1250, status: 'Completed', icon: <DollarSign className="text-emerald-500" /> },
  { id: 'TX12346', type: 'Withdrawal', title: 'Withdrawal to Chase Bank', date: 'Mar 22, 2026', amount: -2500, status: 'Processing', icon: <ArrowUpRight className="text-blue-500" /> },
  { id: 'TX12347', type: 'Payment', title: 'Bathroom Tile Completion', date: 'Mar 20, 2026', amount: 850, status: 'Completed', icon: <DollarSign className="text-emerald-500" /> },
  { id: 'TX12348', type: 'Fee', title: 'Service Fee - Kitchen Remodel', date: 'Mar 24, 2026', amount: -62.50, status: 'Completed', icon: <AlertCircle className="text-gray-400" /> },
  { id: 'TX12349', type: 'Payment', title: 'Deck Repair Deposit', date: 'Mar 18, 2026', amount: 500, status: 'Completed', icon: <DollarSign className="text-emerald-500" /> },
];

const bankAccounts = [
  { id: '1', bankName: 'Chase Bank', accountType: 'Checking', last4: '8824', isPrimary: true },
  { id: '2', bankName: 'Wells Fargo', accountType: 'Savings', last4: '1109', isPrimary: false },
];

// --- Components ---

export const EarningsDashboardScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[3rem] shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Earnings</h1>
          <button className="p-2 -mr-2 hover:bg-gray-50 rounded-full transition-colors">
            <Download size={20} />
          </button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Available Balance</p>
          <h2 className="text-5xl font-black tracking-tighter">$8,450.00</h2>
          <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold text-xs">
            <TrendingUp size={14} />
            <span>+12% from last month</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-lg font-bold">$2,120.00</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">This Month</p>
            <p className="text-lg font-bold">$12,450.00</p>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('withdrawFunds')}
          className="w-full mt-6 bg-black text-white py-4 rounded-2xl font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-black/10"
        >
          Withdraw Funds
        </button>
      </div>

      <div className="px-6 mt-8 space-y-8">
        {/* Earnings Chart */}
        <section>
          <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue (Last 7 Days)</h2>
            <div className="flex items-center gap-1 text-[10px] font-bold text-black uppercase tracking-widest">
              Weekly <Calendar size={12} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#000" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Activity</h2>
            <button 
              onClick={() => onNavigate('transactionHistory')}
              className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-1"
            >
              See All <ChevronRight size={14} />
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            {transactions.slice(0, 3).map((tx, i) => (
              <button 
                key={tx.id}
                onClick={() => onNavigate('payoutStatus')}
                className={`w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-gray-50 ${
                  i !== 2 ? 'border-bottom border-gray-50' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                  {tx.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{tx.title}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-500' : 'text-black'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{tx.status}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('bankDetails')}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center gap-3 text-center transition-transform active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest">Bank Details</p>
          </button>
          <button 
            onClick={() => onNavigate('taxSummary')}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center gap-3 text-center transition-transform active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest">Tax Summary</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export const TransactionHistoryScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 pt-12 pb-4 border-b border-gray-50">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => onNavigate('earningsDashboard')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Transactions</h1>
          <button className="p-2 -mr-2 hover:bg-gray-50 rounded-full transition-colors">
            <Filter size={20} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..."
            className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all"
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Monthly Groups */}
        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">March 2026</h2>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <button 
                key={tx.id}
                onClick={() => onNavigate('payoutStatus')}
                className="w-full flex items-center gap-4 p-4 rounded-3xl border border-gray-50 hover:border-gray-200 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                  {tx.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{tx.title}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{tx.date} • {tx.id}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-500' : 'text-black'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                  <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                    tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">February 2026</h2>
          <div className="space-y-4 opacity-60">
            <div className="flex items-center gap-4 p-4 rounded-3xl border border-gray-50">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                <DollarSign className="text-emerald-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Monthly Bonus</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Feb 28, 2026</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-emerald-500">+$250.00</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WithdrawFundsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [amount, setAmount] = React.useState('2500');
  const [selectedBank, setSelectedBank] = React.useState(bankAccounts[0]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <button onClick={() => onNavigate('earningsDashboard')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Withdraw Funds</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 space-y-8">
        {/* Amount Input */}
        <div className="text-center py-8">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Enter Amount</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-4xl font-black text-gray-300">$</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-6xl font-black tracking-tighter border-none focus:ring-0 w-48 text-center p-0"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs font-bold text-gray-400 mt-4">Available: $8,450.00</p>
        </div>

        {/* Bank Selection */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Withdraw to</h2>
          <div className="space-y-3">
            {bankAccounts.map((bank) => (
              <button 
                key={bank.id}
                onClick={() => setSelectedBank(bank)}
                className={`w-full flex items-center gap-4 p-5 rounded-3xl border transition-all text-left ${
                  selectedBank.id === bank.id ? 'border-black bg-black text-white' : 'border-gray-100 bg-white text-black'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedBank.id === bank.id ? 'bg-white/10' : 'bg-gray-50'
                }`}>
                  <Building2 size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{bank.bankName}</h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    selectedBank.id === bank.id ? 'text-white/60' : 'text-gray-400'
                  }`}>
                    {bank.accountType} •••• {bank.last4}
                  </p>
                </div>
                {selectedBank.id === bank.id && (
                  <CheckCircle2 size={20} className="text-white" />
                )}
              </button>
            ))}
            <button 
              onClick={() => onNavigate('bankDetails')}
              className="w-full flex items-center justify-center gap-2 p-5 rounded-3xl border border-dashed border-gray-200 text-gray-400 font-bold text-sm hover:border-gray-400 hover:text-gray-600 transition-all"
            >
              <Plus size={18} /> Add New Bank
            </button>
          </div>
        </section>

        {/* Info Box */}
        <div className="bg-blue-50 p-5 rounded-3xl flex gap-4 items-start">
          <Clock className="text-blue-500 shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">Estimated Arrival</p>
            <p className="text-xs font-medium text-blue-700 leading-relaxed">
              Funds usually arrive in your bank account within 1-3 business days.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 pb-12">
          <button 
            onClick={() => onNavigate('payoutStatus')}
            className="w-full bg-black text-white py-5 rounded-2xl font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-black/10"
          >
            Confirm Withdrawal
          </button>
        </div>
      </div>
    </div>
  );
};

export const BankDetailsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <button onClick={() => onNavigate('earningsDashboard')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Bank Details</h1>
        <button className="p-2 -mr-2 hover:bg-gray-50 rounded-full transition-colors">
          <Plus size={24} />
        </button>
      </div>

      <div className="px-6 space-y-8">
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Linked Accounts</h2>
          <div className="space-y-4">
            {bankAccounts.map((bank) => (
              <div 
                key={bank.id}
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                  <Building2 size={28} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-base">{bank.bankName}</h4>
                    {bank.isPrimary && (
                      <span className="text-[8px] font-black uppercase tracking-tighter bg-black text-white px-2 py-0.5 rounded-full">Primary</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {bank.accountType} •••• {bank.last4}
                  </p>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <MoreVertical size={20} className="text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-50 p-8 rounded-[3rem] text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <CreditCard size={32} className="text-black" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg">Secure Payouts</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              We use bank-grade encryption to keep your financial information safe and secure.
            </p>
          </div>
          <button className="text-xs font-bold text-black underline underline-offset-4">Learn about our security</button>
        </section>
      </div>
    </div>
  );
};

export const PayoutStatusScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const steps = [
    { label: 'Requested', date: 'Mar 24, 10:30 AM', status: 'completed' },
    { label: 'Processing', date: 'Mar 24, 11:45 AM', status: 'completed' },
    { label: 'Sent to Bank', date: 'Mar 25, 09:00 AM', status: 'active' },
    { label: 'Funds Received', date: 'Estimated Mar 27', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[3rem] shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => onNavigate('earningsDashboard')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Payout Status</h1>
          <div className="w-10" />
        </div>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center mx-auto">
            <Clock size={40} />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter">$2,500.00</h2>
            <p className="text-sm font-bold text-blue-500">Processing Withdrawal</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6 pb-12">
        {/* Timeline */}
        <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Tracking Timeline</h3>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step.label} className="flex gap-4 relative">
                {i !== steps.length - 1 && (
                  <div className={`absolute left-[11px] top-7 w-0.5 h-8 ${
                    step.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-100'
                  }`} />
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  step.status === 'completed' ? 'bg-emerald-500 text-white' : 
                  step.status === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-300'
                }`}>
                  {step.status === 'completed' ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${step.status === 'pending' ? 'text-gray-400' : 'text-black'}`}>{step.label}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Details */}
        <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction ID</p>
              <p className="text-xs font-bold">TX12346</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Destination</p>
              <p className="text-xs font-bold">Chase Bank (•••• 8824)</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Method</p>
              <p className="text-xs font-bold">Standard Transfer</p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</p>
            <p className="text-lg font-black">$2,500.00</p>
          </div>
        </section>

        <button className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest py-4">
          <AlertCircle size={14} /> Need help with this payout?
        </button>
      </div>
    </div>
  );
};

export const TaxSummaryScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const years = ['2026', '2025', '2024'];
  const [selectedYear, setSelectedYear] = React.useState('2026');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <button onClick={() => onNavigate('earningsDashboard')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Tax Summary</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 space-y-8">
        {/* Year Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {years.map((year) => (
            <button 
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                selectedYear === year ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-gray-50 text-gray-400'
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        {/* Summary Card */}
        <section className="bg-black text-white p-8 rounded-[3rem] shadow-xl shadow-black/20">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2">Gross Earnings ({selectedYear})</p>
          <h2 className="text-4xl font-black tracking-tighter mb-8">$142,500.00</h2>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Expenses</p>
              <p className="text-lg font-bold">$12,450.00</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Net Income</p>
              <p className="text-lg font-bold">$130,050.00</p>
            </div>
          </div>
        </section>

        {/* Documents */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Tax Documents</h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <FileText size={28} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Form 1099-K</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available Jan 31, 2027</p>
              </div>
              <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-black transition-colors">
                <Download size={20} />
              </button>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <FileText size={28} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Annual Earnings Report</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PDF • 2.4 MB</p>
              </div>
              <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-black transition-colors">
                <Download size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* Note */}
        <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100">
          <div className="flex gap-3 items-start mb-2">
            <AlertCircle className="text-amber-600 shrink-0" size={18} />
            <p className="text-sm font-bold text-amber-900">Tax Information</p>
          </div>
          <p className="text-xs font-medium text-amber-700 leading-relaxed">
            This summary is for informational purposes only. We recommend consulting with a tax professional for accurate tax filing.
          </p>
        </div>
      </div>
    </div>
  );
};
