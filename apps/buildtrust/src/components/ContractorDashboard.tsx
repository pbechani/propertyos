import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  MapPin, 
  Star, 
  ChevronRight, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  User,
  Settings,
  LogOut,
  WifiOff,
  Zap,
  Calendar,
  MessageSquare,
  BarChart3,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface ContractorDashboardProps {
  onNavigate: (screen: Screen) => void;
}

type DashboardTab = 'home' | 'earnings' | 'performance' | 'stats';

export const ContractorDashboard: React.FC<ContractorDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const stats = [
    { label: 'Total Earnings', value: '$12,450', change: '+12%', trend: 'up', icon: <DollarSign size={20} /> },
    { label: 'Active Jobs', value: '4', change: '0', trend: 'neutral', icon: <Briefcase size={20} /> },
    { label: 'Rating', value: '4.9', change: '+0.1', trend: 'up', icon: <Star size={20} /> },
    { label: 'Completion Rate', value: '98%', change: '+2%', trend: 'up', icon: <CheckCircle2 size={20} /> },
  ];

  const recentJobs = [
    { id: '1', title: 'Kitchen Remodel', client: 'Alexander W.', status: 'In Progress', price: '$4,500', progress: 65 },
    { id: '2', title: 'Bathroom Tile', client: 'Sarah L.', status: 'Pending Approval', price: '$2,200', progress: 100 },
    { id: '3', title: 'Deck Repair', client: 'Mike R.', status: 'Scheduled', price: '$1,800', progress: 0 },
  ];

  const renderHome = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => {
              if (stat.label === 'Total Earnings') onNavigate('earningsDashboard');
              if (stat.label === 'Active Jobs') onNavigate('activeJobs');
            }}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:border-black transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-gray-50 rounded-xl text-black">
                {stat.icon}
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
                stat.trend === 'up' ? 'text-emerald-500' : stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {stat.trend === 'up' && <ArrowUpRight size={12} />}
                {stat.trend === 'down' && <ArrowDownRight size={12} />}
                {stat.change !== '0' && stat.change}
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-xl font-bold tracking-tight">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Active Jobs Section */}
      <section>
        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Jobs</h2>
          <button 
            onClick={() => onNavigate('activeJobs')}
            className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-1"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-4">
          {recentJobs.map((job, i) => (
            <motion.div 
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={() => onNavigate('jobDetail')}
              className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-black transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-bold mb-1">{job.title}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{job.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{job.price}</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{job.status}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>Progress</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${job.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    className="h-full bg-black"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Actions Widget */}
      <section className="bg-gray-50 rounded-[2.5rem] p-8 space-y-6">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: <Plus size={20} />, label: 'New Bid', color: 'bg-blue-500', screen: 'jobFeed' },
            { icon: <MessageSquare size={20} />, label: 'Chat', color: 'bg-purple-500', screen: 'conversationsList' },
            { icon: <Calendar size={20} />, label: 'Schedule', color: 'bg-orange-500', screen: 'availability' },
            { icon: <DollarSign size={20} />, label: 'Invoices', color: 'bg-emerald-500', screen: 'paymentHistory' },
          ].map((action) => (
            <button 
              key={action.label} 
              onClick={() => onNavigate(action.screen as Screen)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 ${action.color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{action.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black text-white rounded-[3rem] p-10 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Available Balance</p>
          <h2 className="text-5xl font-bold tracking-tighter">$8,240.50</h2>
          <div className="pt-4 flex gap-4">
            <button className="px-6 py-3 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-widest">Withdraw</button>
            <button className="px-6 py-3 bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">History</button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Earnings Breakdown</h2>
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                <TrendingUp size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Project Revenue</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This Month</p>
              </div>
            </div>
            <span className="text-lg font-bold">$10,200</span>
          </div>
          <div className="h-[1px] bg-gray-100 w-full" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Referral Bonus</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifetime</p>
              </div>
            </div>
            <span className="text-lg font-bold">$2,250</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold">Monthly Growth</h3>
          <BarChart3 size={20} className="text-gray-400" />
        </div>
        <div className="h-32 flex items-end gap-2 px-2">
          {[40, 60, 45, 90, 65, 80, 100].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.1 }}
              className={`flex-1 rounded-t-lg ${i === 6 ? 'bg-black' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest px-1">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center">
            <span className="text-xl font-bold">98%</span>
          </div>
          <div>
            <h4 className="text-sm font-bold">Success Rate</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last 30 Days</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center">
            <span className="text-xl font-bold">4.9</span>
          </div>
          <div>
            <h4 className="text-sm font-bold">Avg. Rating</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">124 Reviews</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Skill Metrics</h2>
        <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-6">
          {[
            { label: 'Communication', value: 95, color: 'bg-blue-500' },
            { label: 'Timeliness', value: 88, color: 'bg-purple-500' },
            { label: 'Work Quality', value: 100, color: 'bg-emerald-500' },
            { label: 'Cleanliness', value: 92, color: 'bg-orange-500' },
          ].map((skill) => (
            <div key={skill.label} className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span>{skill.label}</span>
                <span className="text-gray-400">{skill.value}%</span>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.value}%` }}
                  className={`h-full ${skill.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black text-white p-8 rounded-[2.5rem] flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-bold">Top 1% Contractor</h4>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">In your region</p>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
          <TrendingUp size={24} className="text-emerald-400" />
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Job Statistics</h2>
          <PieChart size={24} className="text-gray-400" />
        </div>
        
        <div className="flex justify-center py-4">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-gray-100" />
              <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={502} strokeDashoffset={502 * (1 - 0.65)} className="text-black" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">65%</span>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Completed</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-black" />
              <span className="text-xl font-bold">42</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jobs Completed</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-200" />
              <span className="text-xl font-bold">12</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Bids</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Recent Milestones</h2>
        <div className="space-y-3">
          {[
            { label: 'Kitchen Plumbing', date: 'Mar 22', status: 'Completed', icon: <CheckCircle2 size={16} /> },
            { label: 'Electrical Rough-in', date: 'Mar 24', status: 'In Progress', icon: <Clock size={16} /> },
            { label: 'Drywall Delivery', date: 'Mar 25', status: 'Scheduled', icon: <Calendar size={16} /> },
          ].map((m) => (
            <div key={m.label} className="bg-gray-50 p-6 rounded-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black shadow-sm">
                  {m.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{m.label}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.date}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                m.status === 'Completed' ? 'text-emerald-500' : 'text-blue-500'
              }`}>{m.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isOffline) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-32 h-32 bg-red-50 rounded-[3rem] flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
          <WifiOff size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">You're Offline</h1>
          <p className="text-gray-500 max-w-xs mx-auto leading-relaxed">
            Please check your internet connection to access your dashboard and active jobs.
          </p>
        </div>
        <button 
          onClick={() => setIsOffline(false)}
          className="px-10 py-5 bg-black text-white rounded-full text-sm font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 transition-transform"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white font-bold shadow-lg shadow-black/10">
            JS
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Jordan Smith</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {isAvailable ? 'Available for hire' : 'Busy'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onNavigate('notifications')}
            className="relative p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button 
            onClick={() => setIsOffline(true)}
            className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Availability Toggle */}
      <div className="px-6 py-4">
        <div className="bg-gray-50 rounded-[2rem] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAvailable ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400'}`}>
              <Zap size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold">Accepting New Jobs</h4>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Toggle visibility</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAvailable(!isAvailable)}
            className={`w-12 h-6 rounded-full transition-all relative ${isAvailable ? 'bg-black' : 'bg-gray-200'}`}
          >
            <motion.div 
              animate={{ x: isAvailable ? 24 : 4 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {[
            { id: 'home', label: 'Overview' },
            { id: 'earnings', label: 'Earnings' },
            { id: 'performance', label: 'Performance' },
            { id: 'stats', label: 'Job Stats' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 py-4">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'earnings' && renderEarnings()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'stats' && renderStats()}
      </main>

      {/* Quick Actions Overlay */}
      <AnimatePresence>
        {showQuickActions && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickActions(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-10 z-50 space-y-8"
            >
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto" />
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold">Quick Actions</h3>
                <p className="text-xs text-gray-400">Manage your business on the go</p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { icon: <Plus />, label: 'New Job', color: 'bg-blue-500', screen: 'jobFeed' },
                  { icon: <MessageSquare />, label: 'Messages', color: 'bg-purple-500', screen: 'conversationsList' },
                  { icon: <Calendar />, label: 'Schedule', color: 'bg-orange-500', screen: 'availability' },
                  { icon: <DollarSign />, label: 'Payments', color: 'bg-emerald-500', screen: 'paymentHistory' },
                  { icon: <User />, label: 'Profile', color: 'bg-gray-800', screen: 'profile' },
                  { icon: <Settings />, label: 'Settings', color: 'bg-gray-400', screen: 'settings' },
                ].map((action) => (
                  <button 
                    key={action.label} 
                    onClick={() => {
                      setShowQuickActions(false);
                      onNavigate(action.screen as Screen);
                    }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className={`w-16 h-16 ${action.color} text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-black/5`}>
                      {action.icon}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{action.label}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowQuickActions(false)}
                className="w-full py-5 bg-gray-50 rounded-full text-xs font-bold uppercase tracking-widest"
              >
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowQuickActions(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20 z-30 hover:scale-110 transition-transform"
      >
        <Plus size={32} />
      </button>
    </div>
  );
};
