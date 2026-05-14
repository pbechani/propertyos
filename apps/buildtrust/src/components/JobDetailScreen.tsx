import React, { useState } from 'react';
import { ChevronLeft, MoreVertical, Clock, MapPin, Hammer, CheckCircle2, AlertCircle, MessageSquare, FileText, X, AlertTriangle, ShieldCheck, ArrowRight, Camera, Play, Download, Calendar, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface JobDetailScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'milestones' | 'files' | 'tasks'>('timeline');
  const [showCancelMenu, setShowCancelMenu] = useState(false);
  type Task = { id: string; title: string; status: string; priority: string; startDate?: string; dueDate?: string; contractor?: string };
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Clear kitchen cabinets', status: 'Done', priority: 'medium', dueDate: '2026-03-26', contractor: 'Me' },
    { id: '2', title: 'Cover furniture with plastic', status: 'Done', priority: 'high', dueDate: '2026-03-25', contractor: 'Marco Rossi' },
    { id: '3', title: 'Buy new faucet', status: 'To Do', priority: 'high', dueDate: '2026-03-28', contractor: 'Me' },
    { id: '4', title: 'Choose paint color for walls', status: 'In Progress', priority: 'low', dueDate: '2026-04-01', contractor: 'Sofia V.' },
  ]);
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskEndDate, setNewTaskEndDate] = useState('');
  const [newTaskContractor, setNewTaskContractor] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const teamMembers = [
    { name: 'Marco Rossi', role: 'Lead Contractor', avatar: 'https://picsum.photos/seed/marco/100/100' },
    { name: 'Luca S.', role: 'Plumbing Specialist', avatar: 'https://picsum.photos/seed/luca/100/100' },
    { name: 'Sofia V.', role: 'Interior Designer', avatar: 'https://picsum.photos/seed/sofia/100/100' },
    { name: 'Me', role: 'Homeowner', avatar: 'https://picsum.photos/seed/user/100/100' }
  ];

  const updateTaskStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const statuses: ('To Do' | 'In Progress' | 'Done')[] = ['To Do', 'In Progress', 'Done'];
        const currentIndex = statuses.indexOf(t.status as any);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const isDateInvalid = newTaskStartDate && newTaskEndDate && new Date(newTaskEndDate) < new Date(newTaskStartDate);

  const addTask = () => {
    if (newTask.trim() && !isDateInvalid) {
      setTasks([...tasks, { 
        id: Date.now().toString(), 
        title: newTask, 
        status: 'To Do', 
        priority: newTaskPriority,
        startDate: newTaskStartDate || undefined,
        dueDate: newTaskEndDate || undefined,
        contractor: newTaskContractor || undefined
      }]);
      setNewTask('');
      setNewTaskPriority('medium');
      setNewTaskStartDate('');
      setNewTaskEndDate('');
      setNewTaskContractor('');
      setIsAddingTask(false);
    }
  };

  const milestones = [
    { id: '1', title: 'Demolition & Site Prep', status: 'completed', date: 'Mar 15', amount: '$1,200', approved: true },
    { id: '2', title: 'Plumbing Rough-in', status: 'completed', date: 'Mar 20', amount: '$2,500', approved: true },
    { id: '3', title: 'Cabinet Installation', status: 'in-progress', date: 'Mar 25', amount: '$4,000', approved: false, progress: 75 },
    { id: '4', title: 'Countertop Installation', status: 'pending', date: 'Apr 02', amount: '$3,500', approved: false },
    { id: '5', title: 'Final Inspection', status: 'pending', date: 'Apr 10', amount: '$1,500', approved: false }
  ];

  const timelineEvents = [
    { id: '1', type: 'update', title: 'Cabinet Installation Started', description: 'Marco started installing the upper cabinets today.', time: '2 hours ago', user: 'Marco Rossi', avatar: 'https://picsum.photos/seed/marco/100/100', media: ['https://picsum.photos/seed/cab1/400/300', 'https://picsum.photos/seed/cab2/400/300'] },
    { id: '2', type: 'milestone', title: 'Plumbing Rough-in Completed', description: 'Milestone 2 has been completed and approved.', time: '4 days ago', user: 'System' },
    { id: '3', type: 'message', title: 'Material Delivery', description: 'The quartz countertops have been delivered to the site.', time: '5 days ago', user: 'Marco Rossi', avatar: 'https://picsum.photos/seed/marco/100/100' }
  ];

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('activeJobs')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kitchen Remodel</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">In Progress • 65%</p>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowCancelMenu(!showCancelMenu)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={24} />
          </button>
          
          <AnimatePresence>
            {showCancelMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50"
              >
                <button 
                  onClick={() => onNavigate('jobCompletion')}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-gray-50 transition-colors text-emerald-600"
                >
                  <CheckCircle2 size={16} /> Mark as Completed
                </button>
                <button 
                  onClick={() => onNavigate('dispute')}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-gray-50 transition-colors text-orange-500"
                >
                  <AlertTriangle size={16} /> Open Dispute
                </button>
                <button className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-500">
                  <X size={16} /> Cancel Job
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Contractor Info */}
      <div className="p-6">
        <div className="bg-gray-50 rounded-[2.5rem] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://picsum.photos/seed/marco/100/100" className="w-14 h-14 rounded-2xl object-cover" alt="Marco" />
            <div>
              <h3 className="font-bold text-base">Marco Rossi</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Elite Plumbing Solutions</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('chat')}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-sm hover:scale-110 transition-transform"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-2 overflow-x-auto scrollbar-hide">
        {(['timeline', 'tasks', 'milestones', 'files'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {timelineEvents.map((event, i) => (
                <div key={event.id} className="relative pl-8">
                  {/* Vertical Line */}
                  {i !== timelineEvents.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-[-32px] w-[2px] bg-gray-100" />
                  )}
                  
                  {/* Dot */}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                    event.type === 'milestone' ? 'bg-emerald-500' : 'bg-black'
                  }`}>
                    {event.type === 'milestone' ? <CheckCircle2 size={10} className="text-white" /> : <Camera size={10} className="text-white" />}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-sm">{event.title}</h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{event.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{event.description}</p>
                    
                    {event.media && (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {event.media.map((img, idx) => (
                          <img key={idx} src={img} className="w-40 h-28 rounded-2xl object-cover flex-shrink-0" alt="Update" />
                        ))}
                      </div>
                    )}

                    {event.user !== 'System' && (
                      <div className="flex items-center gap-2 pt-1">
                        <img src={event.avatar} className="w-5 h-5 rounded-full object-cover" alt={event.user} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{event.user}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 rounded-[2.5rem] p-6 space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Sub-tasks</h4>
                  <motion.span 
                    key={tasks.filter(t => t.status === 'Done').length}
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest"
                  >
                    {tasks.filter(t => t.status === 'Done').length}/{tasks.length} Done
                  </motion.span>
                </div>
                
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {tasks.map((task) => (
                      <motion.div 
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => updateTaskStatus(task.id)}
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all shadow-sm group relative overflow-hidden"
                      >
                        {/* Priority Indicator Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          task.status === 'Done' ? 'bg-gray-200' :
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`} />

                        <motion.div 
                          animate={{ 
                            backgroundColor: task.status === 'Done' ? '#10b981' : task.status === 'In Progress' ? '#3b82f6' : '#ffffff',
                            borderColor: task.status === 'Done' ? '#10b981' : task.status === 'In Progress' ? '#3b82f6' : '#e5e7eb',
                            scale: task.status === 'Done' ? [1, 1.2, 1] : 1
                          }}
                          transition={{ duration: 0.2 }}
                          className="w-6 h-6 rounded-lg border-2 flex items-center justify-center z-10"
                        >
                          <AnimatePresence>
                            {task.status === 'Done' ? (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                              >
                                <CheckCircle2 size={14} className="text-white" />
                              </motion.div>
                            ) : task.status === 'In Progress' ? (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                              >
                                <Clock size={12} className="text-white" />
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </motion.div>
                        
                        <div className="flex-1 relative z-10 flex items-center justify-between gap-3">
                          <div className="relative">
                            <motion.span 
                              animate={{ 
                                color: task.status === 'Done' ? '#d1d5db' : '#000000',
                              }}
                              className="text-sm font-bold block"
                            >
                              {task.title}
                            </motion.span>
                            <AnimatePresence>
                              {task.status === 'Done' && (
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  exit={{ width: 0 }}
                                  className="absolute left-0 top-1/2 h-[2px] bg-gray-300 -translate-y-1/2"
                                />
                              )}
                            </AnimatePresence>
                            {task.dueDate && (
                              <div className={`flex items-center gap-1 mt-1 ${task.status === 'Done' ? 'opacity-30' : 'opacity-60'}`}>
                                <Calendar size={10} className="text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-500">
                                  {task.startDate ? `${new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ` : ''}
                                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}
                            {(task as any).contractor && (
                              <div className={`flex items-center gap-2 mt-1 ${(task as any).status === 'Done' ? 'opacity-30' : 'opacity-60'}`}>
                                {teamMembers.find(m => m.name === (task as any).contractor) ? (
                                  <img 
                                    src={teamMembers.find(m => m.name === (task as any).contractor)?.avatar} 
                                    className="w-4 h-4 rounded-full object-cover" 
                                    alt={(task as any).contractor} 
                                  />
                                ) : (
                                  <Hammer size={10} className="text-gray-400" />
                                )}
                                <span className="text-[10px] font-medium text-gray-500">
                                  {(task as any).contractor}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                              task.status === 'Done' ? 'bg-gray-100 text-gray-300' :
                              task.priority === 'high' ? 'bg-red-50 text-red-500' :
                              task.priority === 'medium' ? 'bg-orange-50 text-orange-500' :
                              'bg-blue-50 text-blue-500'
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${
                              task.status === 'Done' ? 'text-emerald-500' :
                              task.status === 'In Progress' ? 'text-blue-500' :
                              'text-gray-400'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>

                        {/* Subtle background pulse on complete */}
                        <AnimatePresence>
                          {task.status === 'Done' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 0.05, scale: 2 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-emerald-500 rounded-full pointer-events-none"
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="pt-4">
                  {!isAddingTask ? (
                    <button 
                      onClick={() => setIsAddingTask(true)}
                      className="w-full py-4 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Plus size={16} /> Add New Task
                    </button>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 shadow-xl"
                    >
                      <div className="flex justify-between items-center">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Task Details</h5>
                        <button onClick={() => setIsAddingTask(false)} className="text-gray-400 hover:text-black">
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400 ml-2">Task Name</label>
                          <input 
                            type="text" 
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="What needs to be done?"
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400 ml-2">Start Date</label>
                            <div className="relative">
                              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input 
                                type="date" 
                                value={newTaskStartDate}
                                onChange={(e) => setNewTaskStartDate(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 focus:ring-2 focus:ring-black"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400 ml-2">End Date</label>
                            <div className="relative">
                              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input 
                                type="date" 
                                value={newTaskEndDate}
                                onChange={(e) => setNewTaskEndDate(e.target.value)}
                                className={`w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 focus:ring-2 ${isDateInvalid ? 'ring-2 ring-red-500' : 'focus:ring-black'}`}
                              />
                            </div>
                            {isDateInvalid && (
                              <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest ml-2 mt-1">
                                End date must be after start date
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400 ml-2">Assign to Team Member</label>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {teamMembers.map((member) => (
                              <button
                                key={member.name}
                                onClick={() => setNewTaskContractor(member.name)}
                                className={`flex-shrink-0 flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                  newTaskContractor === member.name 
                                    ? 'bg-black border-black text-white shadow-lg' 
                                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                }`}
                              >
                                <img src={member.avatar} className="w-6 h-6 rounded-lg object-cover" alt={member.name} />
                                <div className="text-left">
                                  <p className="text-[10px] font-bold leading-tight">{member.name}</p>
                                  <p className={`text-[8px] font-medium opacity-60 leading-tight ${newTaskContractor === member.name ? 'text-white' : 'text-gray-400'}`}>
                                    {member.role}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                          <div className="pt-1">
                            <input 
                              type="text" 
                              value={newTaskContractor}
                              onChange={(e) => setNewTaskContractor(e.target.value)}
                              placeholder="Or type custom name..."
                              className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-black transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400 ml-2">Priority</label>
                          <div className="flex gap-2">
                            {(['low', 'medium', 'high'] as const).map((p) => (
                              <button
                                key={p}
                                onClick={() => setNewTaskPriority(p)}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                  newTaskPriority === p 
                                    ? p === 'high' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                                    : p === 'medium' ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200'
                                    : 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button 
                          onClick={addTask}
                          disabled={!newTask.trim() || isDateInvalid}
                          className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 mt-2 ${
                            !newTask.trim() || isDateInvalid 
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                              : 'bg-black text-white shadow-black/10 hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                        >
                          <CheckCircle2 size={16} /> Save Task
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'milestones' && (
            <motion.div
              key="milestones"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {milestones.map((m) => (
                <div 
                  key={m.id}
                  className={`p-6 rounded-[2.5rem] border transition-all ${
                    m.status === 'in-progress' ? 'bg-white border-black shadow-xl ring-4 ring-gray-50' : 'bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-base">{m.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          m.status === 'completed' ? 'text-emerald-500' : m.status === 'in-progress' ? 'text-blue-500' : 'text-gray-400'
                        }`}>
                          {m.status.replace('-', ' ')}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due {m.date}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold">{m.amount}</span>
                  </div>

                  {m.status === 'in-progress' && (
                    <div className="space-y-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${m.progress}%` }}
                          className="h-full bg-black rounded-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onNavigate('jobCompletion')}
                          className="flex-1 bg-black text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          Approve & Pay
                        </button>
                        <button className="flex-1 bg-gray-100 text-black py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all">
                          Request Revision
                        </button>
                      </div>
                    </div>
                  )}

                  {m.status === 'completed' && (
                    <div className="flex items-center gap-2 text-emerald-500">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Verified & Released</span>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-2 gap-4"
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-50 rounded-[2rem] p-4 space-y-3 group cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="aspect-square bg-white rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-black transition-colors">
                    <FileText size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold truncate">Contract_V2.pdf</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">2.4 MB • Mar 12</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-40">
        <div className="bg-black text-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-black/20">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Escrow</p>
            <p className="text-xl font-bold">$12,700</p>
          </div>
          <button 
            onClick={() => onNavigate('contractDetail')}
            className="bg-white text-black px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
          >
            View Contract <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
