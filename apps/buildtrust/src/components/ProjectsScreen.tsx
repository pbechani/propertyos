import React, { useState } from 'react';
import { Search, Plus, ChevronRight, Clock, CheckCircle2, MoreHorizontal, Filter, MessageSquare, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface ProjectsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const projects = [
    { id: '1', title: 'Kitchen Remodel', status: 'active', phase: 'Quotes Received', progress: 0, contractor: '3 Quotes Available', date: 'Mar 2026', color: 'bg-emerald-500', hasQuotes: true },
    { id: '2', title: 'Bathroom Renovation', status: 'active', phase: 'Plumbing Rough-in', progress: 30, contractor: 'Elena Rodriguez', date: 'Apr 2026', color: 'bg-purple-500' },
    { id: '3', title: 'Deck Construction', status: 'completed', phase: 'Finished', progress: 100, contractor: 'Marcus Chen', date: 'Jan 2026', color: 'bg-emerald-500' },
    { id: '4', title: 'Basement Finishing', status: 'completed', phase: 'Finished', progress: 100, contractor: 'Sarah Miller', date: 'Dec 2025', color: 'bg-orange-500' },
  ];

  const filteredProjects = projects.filter(p => p.status === activeTab);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 space-y-6 bg-white border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <button 
            onClick={() => onNavigate('createProject')}
            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"
          >
            <Plus size={24} />
          </button>
        </div>
        
        <div className="flex bg-gray-50 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'active' ? 'bg-white text-black shadow-sm' : 'text-gray-400'
            }`}
          >
            Active
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'completed' ? 'bg-white text-black shadow-sm' : 'text-gray-400'
            }`}
          >
            Completed
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project, i) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => {
                if ((project as any).hasQuotes) {
                  onNavigate('quotesList');
                } else {
                  onNavigate('jobDetail');
                }
              }}
              className={`bg-white rounded-3xl border border-gray-100 p-5 space-y-4 hover:border-black transition-colors cursor-pointer`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${project.color} flex items-center justify-center text-white font-bold`}>
                    {project.title[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{project.title}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{project.contractor}</p>
                  </div>
                </div>
                <button className="text-gray-300">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Progress</span>
                  <span className="text-xs font-bold">{project.progress}%</span>
                </div>
                <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full ${project.color}`}
                  ></motion.div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                <div className="flex items-center gap-2">
                  {project.status === 'active' ? (
                    <Clock size={14} className="text-blue-500" />
                  ) : (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {project.status === 'active' ? project.phase : 'Completed'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('chat');
                    }}
                    className="p-2 bg-gray-50 text-black rounded-xl hover:bg-black hover:text-white transition-all flex items-center gap-2"
                  >
                    <MessageSquare size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Message</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if ((project as any).hasQuotes) {
                        onNavigate('quotesList');
                      } else {
                        onNavigate('jobDetail');
                      }
                    }}
                    className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2"
                  >
                    <Eye size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Details</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <Plus size={40} />
            </div>
            <div>
              <h3 className="text-lg font-bold">No {activeTab} projects</h3>
              <p className="text-sm text-gray-400">Start a new project to see it here.</p>
            </div>
            <button className="px-8 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">
              Create Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
