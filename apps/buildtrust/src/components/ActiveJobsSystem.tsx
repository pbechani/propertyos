import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Camera, 
  MessageSquare, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  ChevronRight, 
  MoreVertical,
  Play,
  Image as ImageIcon,
  Calendar,
  MapPin,
  User,
  Plus,
  Send,
  Paperclip,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { Screen } from '../types';
import { motion } from 'motion/react';

interface ActiveJobsProps {
  onNavigate: (screen: Screen) => void;
}

// 1. Active Jobs List
export const ActiveJobsListScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  const jobs = [
    { id: '1', title: 'Emergency Pipe Repair', client: 'Robert D.', status: 'In Progress', progress: 65, deadline: 'Today, 5 PM', budget: '$805' },
    { id: '2', title: 'Bathroom Tile Install', client: 'Sarah M.', status: 'Starting Soon', progress: 0, deadline: 'Tomorrow', budget: '$1,200' },
    { id: '3', title: 'Kitchen Sink Replacement', client: 'James L.', status: 'On Hold', progress: 30, deadline: 'Mar 28', budget: '$450' },
  ];

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight">Active Jobs</h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">3 Active</span>
        </div>
      </header>

      <main className="p-6 space-y-4">
        {jobs.map((job) => (
          <button 
            key={job.id}
            onClick={() => onNavigate('jobDetail')}
            className="w-full bg-gray-50 rounded-[2rem] p-6 text-left space-y-4 hover:bg-gray-100 transition-colors group"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
                <p className="text-sm text-gray-500 font-medium">{job.client}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                job.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 
                job.status === 'Starting Soon' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {job.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                  className="h-full bg-black"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{job.deadline}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <DollarSign size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{job.budget}</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
            </div>
          </button>
        ))}
      </main>
    </div>
  );
};

// 2. Job Detail
export const ActiveJobDetailScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-40">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button onClick={() => onNavigate('activeJobs')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Job Details</h1>
        <button className="ml-auto p-2 rounded-full hover:bg-gray-100">
          <MoreVertical size={24} />
        </button>
      </header>

      <main className="p-6 space-y-8">
        {/* Header Info */}
        <section className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Emergency Pipe Repair</h2>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin size={16} />
                <span className="text-sm font-medium">Brooklyn, NY • 1.2 miles away</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Clock size={24} />
            </div>
          </div>
          
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-black text-white rounded-full text-[8px] font-bold uppercase tracking-widest">In Progress</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[8px] font-bold uppercase tracking-widest">Priority</span>
            <button 
              onClick={() => onNavigate('contractDetail')}
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] font-bold uppercase tracking-widest flex items-center gap-1"
            >
              <FileText size={10} /> View Contract
            </button>
          </div>
        </section>

        {/* Client Card */}
        <section className="bg-gray-50 rounded-[2rem] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg">RD</div>
            <div>
              <p className="text-sm font-bold">Robert D.</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('chat')}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <MessageSquare size={20} />
          </button>
        </section>

        {/* Progress Tracker */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Progress</h3>
            <span className="text-2xl font-bold tracking-tighter">65%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-black w-[65%]" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('updateProgress')}
              className="p-6 bg-gray-50 rounded-[2rem] space-y-3 hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                <Play size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">Update Progress</p>
            </button>
            <button 
              onClick={() => onNavigate('uploadMedia')}
              className="p-6 bg-gray-50 rounded-[2rem] space-y-3 hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center">
                <Camera size={20} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">Upload Media</p>
            </button>
          </div>
        </section>

        {/* Milestones */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Milestones</h3>
          <div className="space-y-3">
            {[
              { label: 'Site Inspection', status: 'completed' },
              { label: 'Material Procurement', status: 'completed' },
              { label: 'Pipe Replacement', status: 'current' },
              { label: 'Pressure Testing', status: 'pending' },
              { label: 'Final Cleanup', status: 'pending' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  m.status === 'completed' ? 'bg-emerald-500 text-white' : 
                  m.status === 'current' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {m.status === 'completed' ? <CheckCircle2 size={14} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <span className={`text-sm font-bold ${m.status === 'pending' ? 'text-gray-400' : 'text-black'}`}>{m.label}</span>
                {m.status === 'current' && (
                  <button 
                    onClick={() => onNavigate('markMilestone')}
                    className="ml-auto text-[8px] font-bold uppercase tracking-widest text-blue-600"
                  >
                    Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-8 border-t border-gray-100 space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Job Management</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('delayNotification')}
              className="p-4 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <AlertTriangle size={16} />
              Report Delay
            </button>
            <button 
              onClick={() => onNavigate('cancelJobRequest')}
              className="p-4 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <XCircle size={16} />
              Cancel Job
            </button>
          </div>
          <button 
            onClick={() => onNavigate('dispute')}
            className="w-full p-4 bg-gray-50 text-gray-500 rounded-3xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
          >
            <ShieldAlert size={16} />
            Open Dispute
          </button>
        </section>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-[72px] left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-40">
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate('requestPayment')}
            className="flex-1 py-5 bg-gray-50 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
          >
            Request Pay
          </button>
          <button 
            onClick={() => onNavigate('jobCompletion')}
            className="flex-[2] py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
          >
            Complete Job
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Update Progress
export const UpdateProgressScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  const [progress, setProgress] = useState(65);

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => onNavigate('jobDetail')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Update Progress</h1>
      </header>

      <main className="p-8 space-y-12">
        <div className="text-center space-y-4">
          <div className="text-7xl font-bold tracking-tighter">{progress}%</div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drag to adjust progress</p>
        </div>

        <div className="px-4">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-black"
          />
        </div>

        <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-6">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Updates</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '+5%', value: 5 },
              { label: '+10%', value: 10 },
              { label: '+25%', value: 25 },
              { label: '100%', value: 100 - progress },
            ].map((btn) => (
              <button 
                key={btn.label}
                onClick={() => setProgress(Math.min(100, progress + btn.value))}
                className="py-4 bg-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-all"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => onNavigate('jobDetail')}
          className="w-full py-6 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
        >
          Save Progress
        </button>
      </main>
    </div>
  );
};

// 4. Upload Images/Videos
export const UploadMediaScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => onNavigate('jobDetail')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Upload Media</h1>
      </header>

      <main className="p-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <button className="aspect-square bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400 hover:bg-gray-100 transition-colors">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Camera size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Take Photo</span>
          </button>
          <button className="aspect-square bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400 hover:bg-gray-100 transition-colors">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Play size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Record Video</span>
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Recent Uploads</h3>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-3xl overflow-hidden relative group">
                <img src={`https://picsum.photos/seed/job${i}/200/200`} alt="upload" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
              </div>
            ))}
            <button className="aspect-square bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
              <Plus size={24} />
            </button>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('jobDetail')}
          className="w-full py-6 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
        >
          Done
        </button>
      </main>
    </div>
  );
};

// 5. Mark Milestone Complete
export const MarkMilestoneScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => onNavigate('jobDetail')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Complete Milestone</h1>
      </header>

      <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Pipe Replacement</h2>
          <p className="text-gray-500 font-medium">Are you sure you want to mark this milestone as complete?</p>
        </div>

        <div className="w-full bg-gray-50 rounded-[2.5rem] p-6 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-gray-400">
              <ImageIcon size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">3 Photos Attached</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-gray-400">
              <MessageSquare size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Notes Added</span>
          </div>
        </div>
      </main>

      <div className="p-6 space-y-4">
        <button 
          onClick={() => onNavigate('jobDetail')}
          className="w-full py-6 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
        >
          Confirm Completion
        </button>
        <button 
          onClick={() => onNavigate('jobDetail')}
          className="w-full py-6 bg-gray-50 text-gray-500 rounded-full text-xs font-bold uppercase tracking-widest"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// 6. Request Payment
export const RequestPaymentScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => onNavigate('jobDetail')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Request Payment</h1>
      </header>

      <main className="p-8 space-y-10">
        <div className="text-center space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Request Amount</p>
          <h2 className="text-6xl font-bold tracking-tighter">$450.00</h2>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Select Milestone</h3>
          <div className="space-y-3">
            {[
              { label: 'Initial Deposit', amount: 250, status: 'Paid' },
              { label: 'Pipe Replacement', amount: 450, status: 'Current' },
              { label: 'Final Payment', amount: 105, status: 'Locked' },
            ].map((m, i) => (
              <button 
                key={i}
                disabled={m.status !== 'Current'}
                className={`w-full p-6 rounded-[2rem] flex justify-between items-center border-2 transition-all ${
                  m.status === 'Current' ? 'bg-white border-black shadow-lg' : 'bg-gray-50 border-transparent opacity-50'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm font-bold">{m.label}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.status}</p>
                </div>
                <span className="text-lg font-bold">${m.amount}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-[2rem] p-6 flex gap-4">
          <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <p className="text-xs font-medium text-blue-800 leading-relaxed">
            Payment will be released from escrow once the client approves this milestone.
          </p>
        </div>

        <button 
          onClick={() => onNavigate('jobDetail')}
          className="w-full py-6 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
        >
          Send Request
        </button>
      </main>
    </div>
  );
};

// 7. Delay Notification
export const DelayNotificationScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => onNavigate('jobDetail')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Report Delay</h1>
      </header>

      <main className="p-8 space-y-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Reason for Delay</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              'Material Backorder',
              'Weather Conditions',
              'Equipment Failure',
              'Unexpected Site Issue',
              'Other',
            ].map((reason) => (
              <button 
                key={reason}
                className="w-full p-5 bg-gray-50 rounded-3xl text-left text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                {reason}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">New Estimated Completion</h3>
          <div className="p-5 bg-gray-50 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-gray-400" />
              <span className="text-sm font-bold">Tomorrow, 12:00 PM</span>
            </div>
            <button className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Change</button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Message to Client</h3>
          <textarea 
            placeholder="Explain the situation to the client..."
            className="w-full h-32 p-6 bg-gray-50 rounded-[2rem] text-sm font-medium focus:outline-none resize-none"
          />
        </div>

        <button 
          onClick={() => onNavigate('jobDetail')}
          className="w-full py-6 bg-orange-500 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-orange-500/20"
        >
          Notify Client
        </button>
      </main>
    </div>
  );
};

// 8. Cancel Job Request
export const CancelJobRequestScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => onNavigate('jobDetail')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Cancel Job</h1>
      </header>

      <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-[2.5rem] flex items-center justify-center">
          <XCircle size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Cancel this job?</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            Cancelling an active job may affect your rating and could result in a partial refund to the client.
          </p>
        </div>

        <div className="w-full bg-red-50 rounded-[2.5rem] p-6 space-y-4 text-left border border-red-100">
          <h3 className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Important Note</h3>
          <p className="text-xs font-medium text-red-800 leading-relaxed">
            Please contact support if you are cancelling due to safety concerns or client misconduct.
          </p>
        </div>
      </main>

      <div className="p-6 space-y-4">
        <button 
          onClick={() => onNavigate('contractorHome')}
          className="w-full py-6 bg-red-600 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-red-600/20"
        >
          Confirm Cancellation
        </button>
        <button 
          onClick={() => onNavigate('jobDetail')}
          className="w-full py-6 bg-gray-50 text-gray-500 rounded-full text-xs font-bold uppercase tracking-widest"
        >
          Keep Job
        </button>
      </div>
    </div>
  );
};

// 9. Complete Job
export const CompleteJobScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => onNavigate('jobDetail')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Complete Job</h1>
      </header>

      <main className="p-8 space-y-10">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Ready to finish?</h2>
            <p className="text-gray-500 font-medium">Ensure all work is done and the site is clean.</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Completion Checklist</h3>
          <div className="space-y-3">
            {[
              'Final inspection performed',
              'Site cleaned and debris removed',
              'Client walk-through completed',
              'All tools and materials collected',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 rounded-3xl">
                <div className="w-6 h-6 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-emerald-500 opacity-0" />
                </div>
                <span className="text-sm font-bold text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Total Earnings</span>
            <span className="text-xl font-bold">$805.00</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Service Fee</span>
            <span className="text-sm font-bold text-red-500">-$80.50</span>
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm font-bold">Net Payout</span>
            <span className="text-2xl font-bold text-emerald-600">$724.50</span>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('contractorHome')}
          className="w-full py-6 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
        >
          Submit for Payment
        </button>
      </main>
    </div>
  );
};

// 10. Chat with Client (Active Job Context)
export const ActiveJobChatScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  const [message, setMessage] = useState('');
  const messages = [
    { id: '1', sender: 'client', text: 'Hi, how is the pipe repair going?', time: '10:30 AM' },
    { id: '2', sender: 'me', text: 'Going well! Just finished the main replacement. About to start pressure testing.', time: '10:35 AM' },
    { id: '3', sender: 'client', text: 'Great, thanks for the update. Let me know if you need anything.', time: '10:36 AM' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col pb-[64px]">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <button onClick={() => onNavigate('jobDetail')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold">RD</div>
          <div>
            <h1 className="text-sm font-bold">Robert D.</h1>
            <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Online</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="text-center">
          <span className="px-4 py-1 bg-gray-50 text-[8px] font-bold text-gray-400 uppercase tracking-widest rounded-full">Today</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] space-y-1 ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
              <div className={`p-4 rounded-3xl text-sm font-medium ${
                msg.sender === 'me' ? 'bg-black text-white rounded-tr-none' : 'bg-gray-100 text-black rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest px-2">{msg.time}</p>
            </div>
          </div>
        ))}
      </main>

      <div className="p-6 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 rounded-full p-2 pl-6">
          <button className="text-gray-400 hover:text-black transition-colors">
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
          />
          <button className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg shadow-black/10">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
