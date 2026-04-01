import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Filter, 
  Star, 
  Bookmark, 
  Map as MapIcon, 
  List, 
  Zap, 
  Clock, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Settings, 
  Sparkles,
  Heart,
  Navigation,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface JobFeedScreenProps {
  onNavigate: (screen: Screen) => void;
}

type FeedTab = 'available' | 'recommended' | 'saved';

interface Job {
  id: string;
  title: string;
  client: string;
  location: string;
  distance: string;
  budget: string;
  posted: string;
  isUrgent: boolean;
  isRecommended: boolean;
  isSaved: boolean;
  category: string;
  description: string;
  requirements: string[];
}

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Emergency Pipe Repair',
    client: 'Robert D.',
    location: 'Brooklyn, NY',
    distance: '1.2 miles',
    budget: '$350 - $500',
    posted: '10 mins ago',
    isUrgent: true,
    isRecommended: true,
    isSaved: false,
    category: 'Plumbing',
    description: 'Burst pipe in the basement. Needs immediate attention to prevent further flooding. Water has been shut off but repair is critical.',
    requirements: ['Master Plumber License', 'Emergency Response', 'Pipe Welding']
  },
  {
    id: '2',
    title: 'Custom Bookshelf Installation',
    client: 'Sarah M.',
    location: 'Manhattan, NY',
    distance: '3.5 miles',
    budget: '$1,200 - $1,800',
    posted: '2 hours ago',
    isUrgent: false,
    isRecommended: true,
    isSaved: true,
    category: 'Carpentry',
    description: 'Looking for a skilled carpenter to build and install floor-to-ceiling bookshelves in a home office. Material is white oak.',
    requirements: ['Fine Woodworking', 'Installation', 'White Oak Experience']
  },
  {
    id: '3',
    title: 'Kitchen Backsplash Tiling',
    client: 'James L.',
    location: 'Queens, NY',
    distance: '5.8 miles',
    budget: '$800 - $1,200',
    posted: '5 hours ago',
    isUrgent: false,
    isRecommended: false,
    isSaved: false,
    category: 'Tiling',
    description: 'Subway tile installation for a standard kitchen backsplash. Area is approximately 35 sq ft. All materials provided.',
    requirements: ['Tiling Experience', 'Precision Cutting', 'Grouting']
  },
  {
    id: '4',
    title: 'Full House Rewiring',
    client: 'Estate Management',
    location: 'Staten Island, NY',
    distance: '12.4 miles',
    budget: '$8,000 - $12,000',
    posted: '1 day ago',
    isUrgent: false,
    isRecommended: false,
    isSaved: false,
    category: 'Electrical',
    description: 'Complete rewiring of a 3-bedroom Victorian home. Must be up to current code. Permits required.',
    requirements: ['Licensed Electrician', 'Permit Handling', 'Old Home Experience']
  }
];

export const JobFeedScreen: React.FC<JobFeedScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('available');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobIds, setSavedJobIds] = useState<string[]>(['2']);

  const filteredJobs = MOCK_JOBS.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'recommended') return matchesSearch && job.isRecommended;
    if (activeTab === 'saved') return matchesSearch && savedJobIds.includes(job.id);
    return matchesSearch;
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedJobIds(prev => 
      prev.includes(id) ? prev.filter(jobId => jobId !== id) : [...prev, id]
    );
  };

  const renderJobCard = (job: Job) => (
    <motion.div
      key={job.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => setSelectedJob(job)}
      className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${
        job.isUrgent ? 'border-red-100 bg-red-50/30' : 'border-gray-100 hover:border-black shadow-sm'
      }`}
    >
      {job.isUrgent && (
        <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1.5 rounded-bl-2xl flex items-center gap-1.5">
          <Zap size={12} fill="currentColor" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Urgent</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight">{job.title}</h3>
            {job.isRecommended && <Sparkles size={16} className="text-purple-500" />}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{job.category} • {job.client}</p>
        </div>
        <button 
          onClick={(e) => toggleSave(job.id, e)}
          className={`p-2 rounded-xl transition-colors ${
            savedJobIds.includes(job.id) ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
          }`}
        >
          <Heart size={18} fill={savedJobIds.includes(job.id) ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-gray-500">
          <MapPin size={14} />
          <span className="text-xs font-medium">{job.location} ({job.distance})</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Clock size={14} />
          <span className="text-xs font-medium">{job.posted}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="space-y-0.5">
          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Budget Range</p>
          <p className="text-base font-bold text-black">{job.budget}</p>
        </div>
        <button className="px-6 py-2.5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest group-hover:scale-105 transition-transform">
          View Details
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Job Feed</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('jobAlertSettings')}
              className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Settings size={20} className="text-gray-400" />
            </button>
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="p-3 rounded-2xl bg-black text-white shadow-lg shadow-black/10"
            >
              {viewMode === 'list' ? <MapIcon size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
            />
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors relative"
          >
            <Filter size={20} />
            <span className="absolute top-3 right-3 w-2 h-2 bg-black rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {[
          { id: 'available', label: 'Available', icon: <Briefcase size={14} /> },
          { id: 'recommended', label: 'AI Recommended', icon: <Sparkles size={14} /> },
          { id: 'saved', label: 'Saved', icon: <Heart size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FeedTab)}
            className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 min-w-max ${
              activeTab === tab.id ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="px-6 py-4">
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map(renderJobCard)
            ) : (
              <div className="py-20 text-center space-y-4 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto text-gray-300">
                  <Search size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">No jobs found</h3>
                  <p className="text-sm text-gray-400 max-w-[200px] mx-auto">Try adjusting your filters or search query to find more opportunities.</p>
                </div>
                <button 
                  onClick={() => {setSearchQuery(''); setActiveTab('available');}}
                  className="text-[10px] font-bold text-black uppercase tracking-widest underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[60vh] bg-gray-100 rounded-[3rem] relative overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Mock Map View */}
            <div className="absolute inset-0 blueprint-pattern opacity-20" />
            {filteredJobs.map((job, i) => (
              <motion.button
                key={job.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedJob(job)}
                className={`absolute p-3 rounded-2xl shadow-xl flex items-center gap-2 border-2 transition-all hover:scale-110 ${
                  job.isUrgent ? 'bg-red-500 text-white border-white' : 'bg-white text-black border-gray-100'
                }`}
                style={{ 
                  top: `${20 + (i * 15)}%`, 
                  left: `${15 + (i * 20)}%` 
                }}
              >
                <MapPin size={16} />
                <span className="text-[10px] font-bold">{job.budget.split(' - ')[0]}</span>
              </motion.button>
            ))}
            <div className="absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                  <Navigation size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Location</p>
                  <p className="text-xs font-bold">Brooklyn, NY</p>
                </div>
              </div>
              <button className="p-3 bg-white rounded-xl shadow-sm">
                <MapIcon size={20} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {/* Job Detail Preview */}
        {selectedJob && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center z-10">
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => toggleSave(selectedJob.id, e)}
                    className={`p-3 rounded-2xl transition-colors ${
                      savedJobIds.includes(selectedJob.id) ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    <Heart size={20} fill={savedJobIds.includes(selectedJob.id) ? "currentColor" : "none"} />
                  </button>
                  <button className="p-3 rounded-2xl bg-gray-50 text-gray-400">
                    <AlertCircle size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  {selectedJob.isUrgent && (
                    <span className="px-4 py-1.5 bg-red-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2">
                      <Zap size={12} fill="currentColor" /> Urgent Request
                    </span>
                  )}
                  <h2 className="text-3xl font-bold tracking-tight leading-tight">{selectedJob.title}</h2>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin size={16} />
                      <span className="text-sm font-medium">{selectedJob.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={16} />
                      <span className="text-sm font-medium">Posted {selectedJob.posted}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-6 rounded-3xl space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget</p>
                    <p className="text-xl font-bold">{selectedJob.budget}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</p>
                    <p className="text-xl font-bold">{selectedJob.category}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedJob.description}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requirements.map(req => (
                      <span key={req} className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    onClick={() => setSelectedJob(null)}
                    className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    Reject Job
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedJob(null);
                      onNavigate('createQuote');
                    }}
                    className="flex-[2] py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-[1.02] transition-transform"
                  >
                    Accept & Quote
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Filters Overlay */}
        {showFilters && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 w-[85%] bg-white z-50 p-10 space-y-10"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-50 rounded-xl">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distance</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['< 5 miles', '< 10 miles', '< 25 miles', 'Anywhere'].map(d => (
                      <button key={d} className={`py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        d === '< 10 miles' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'
                      }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget Range</h3>
                  <div className="h-1 bg-gray-100 rounded-full relative">
                    <div className="absolute inset-y-0 left-[20%] right-[40%] bg-black rounded-full" />
                    <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-black rounded-full shadow-lg" />
                    <div className="absolute right-[40%] top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-black rounded-full shadow-lg" />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>$100</span>
                    <span>$10,000+</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Plumbing', 'Carpentry', 'Electrical', 'Painting', 'Tiling', 'HVAC'].map(c => (
                      <button key={c} className={`px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        c === 'Carpentry' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'
                      }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-10 right-10 space-y-4">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
                >
                  Apply Filters
                </button>
                <button className="w-full py-5 bg-gray-50 text-gray-400 rounded-full text-xs font-bold uppercase tracking-widest">
                  Reset
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const JobAlertSettingsScreen: React.FC<JobFeedScreenProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState({
    urgent: true,
    recommended: true,
    newInArea: true,
    budgetMatches: false
  });

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button 
          onClick={() => onNavigate('jobFeed')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Job Alerts</h1>
      </header>

      <div className="p-6 space-y-8">
        <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-4 text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Zap size={24} className="text-black" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Never miss a lead</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Customize your alerts to get notified about the jobs that matter most to your business.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Notification Types</h2>
          <div className="bg-gray-50 rounded-[2.5rem] overflow-hidden">
            {[
              { id: 'urgent', label: 'Urgent Jobs', sub: 'Immediate response required', key: 'urgent' as const },
              { id: 'recommended', label: 'AI Recommendations', sub: 'Jobs matching your skills', key: 'recommended' as const },
              { id: 'newInArea', label: 'New in Area', sub: 'Within 10 miles of your location', key: 'newInArea' as const },
              { id: 'budget', label: 'High Budget Matches', sub: 'Projects over $5,000', key: 'budgetMatches' as const },
            ].map((item, idx) => (
              <div key={item.id} className={`p-6 flex items-center justify-between ${idx !== 3 ? 'border-b border-gray-100' : ''}`}>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">{item.label}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sub}</p>
                </div>
                <button 
                  onClick={() => setAlerts(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${alerts[item.key] ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <motion.div 
                    animate={{ x: alerts[item.key] ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Quiet Hours</h2>
          <button className="w-full p-6 bg-gray-50 rounded-[2.5rem] flex items-center justify-between group hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Clock size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold">Do Not Disturb</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">10:00 PM - 07:00 AM</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
