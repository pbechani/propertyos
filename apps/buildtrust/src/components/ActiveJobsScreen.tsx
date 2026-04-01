import React from 'react';
import { ChevronLeft, Clock, MapPin, Hammer, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface ActiveJobsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ActiveJobsScreen: React.FC<ActiveJobsScreenProps> = ({ onNavigate }) => {
  const activeJobs = [
    {
      id: '1',
      title: 'Kitchen Remodel',
      contractor: 'Marco Rossi',
      company: 'Elite Plumbing Solutions',
      avatarUrl: 'https://picsum.photos/seed/marco/100/100',
      progress: 65,
      status: 'In Progress',
      nextMilestone: 'Cabinet Installation',
      dueDate: 'Apr 15',
      imageUrl: 'https://picsum.photos/seed/kitchen/400/300'
    },
    {
      id: '2',
      title: 'Bathroom Tiling',
      contractor: 'Sarah Jenkins',
      company: 'ProFix Home Services',
      avatarUrl: 'https://picsum.photos/seed/sarah/100/100',
      progress: 30,
      status: 'In Progress',
      nextMilestone: 'Floor Waterproofing',
      dueDate: 'Apr 08',
      imageUrl: 'https://picsum.photos/seed/bathroom/400/300'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-white sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Active Jobs</h1>
        </div>
      </header>

      {/* Jobs List */}
      <div className="p-6 space-y-8">
        {activeJobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onNavigate('jobDetail')}
            className="bg-white rounded-[3rem] overflow-hidden shadow-xl shadow-black/5 border border-gray-100 group cursor-pointer hover:scale-[1.02] transition-transform duration-500"
          >
            <div className="relative h-56 overflow-hidden">
              <img 
                src={job.imageUrl} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                alt={job.title} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-white/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {job.status}
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{job.title}</h3>
                  <div className="flex items-center gap-2">
                    <img src={job.avatarUrl} className="w-6 h-6 rounded-full border-2 border-white/30 object-cover" alt={job.contractor} />
                    <p className="text-xs font-medium text-white/80">{job.contractor}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Progress</p>
                    <p className="text-3xl font-bold tracking-tighter">{job.progress}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Milestone</p>
                    <p className="text-xs font-bold text-black">{job.nextMilestone}</p>
                  </div>
                </div>
                
                <div className="relative group/progress">
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover/progress:opacity-100 transition-all duration-300 pointer-events-none z-10 whitespace-nowrap shadow-lg translate-y-2 group-hover/progress:translate-y-0">
                    {job.progress}% Complete
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />
                  </div>

                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${job.progress}%` }}
                      transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
                      className="h-full bg-black rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <Hammer size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company</p>
                    <p className="text-sm font-bold">{job.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Date</p>
                  <p className="text-sm font-bold text-emerald-600">{job.dueDate}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
