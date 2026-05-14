import React from 'react';
import { ChevronLeft, Check, Plus, Trash2, Camera, MapPin, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface ManualEntryScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ManualEntryScreen: React.FC<ManualEntryScreenProps> = ({ onNavigate }) => {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    title: '',
    category: 'Plumbing',
    description: '',
    budget: '',
    minBudget: '',
    maxBudget: '',
    requestQuote: false,
    schedule: '',
    location: 'Brooklyn, NY',
    media: [] as string[]
  });

  const categories = [
    { id: 'plumbing', name: 'Plumbing', icon: '🚰', color: 'bg-blue-50' },
    { id: 'electrical', name: 'Electrical', icon: '⚡', color: 'bg-yellow-50' },
    { id: 'carpentry', name: 'Carpentry', icon: '🪚', color: 'bg-orange-50' },
    { id: 'painting', name: 'Painting', icon: '🎨', color: 'bg-pink-50' },
    { id: 'hvac', name: 'HVAC', icon: '❄️', color: 'bg-cyan-50' },
    { id: 'roofing', name: 'Roofing', icon: '🏠', color: 'bg-green-50' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('jobSuccess');
  };

  const totalSteps = 7; // 6 steps + Review

  return (
    <div className="min-h-screen bg-white pb-12 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onNavigate('createProject')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 7 ? 'Review Job' : `Step ${step} of 6`}
          </h1>
        </div>
        {step < 7 && (
          <button 
            type="button"
            onClick={() => onNavigate('drafts')}
            className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
          >
            Save Draft
          </button>
        )}
      </header>

      <div className="flex-1 px-6 flex flex-col space-y-8">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-black"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1">
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">What category is your job?</h2>
                  <p className="text-gray-500 text-sm">Select the most relevant category for your project.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormData({...formData, category: cat.name});
                        setStep(2);
                      }}
                      className={`p-6 rounded-3xl border-2 text-left transition-all ${formData.category === cat.name ? 'border-black ' + cat.color : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center text-2xl mb-4`}>
                        {cat.icon}
                      </div>
                      <span className="font-bold text-sm">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Describe the job</h2>
                  <p className="text-gray-500 text-sm">Be as detailed as possible to get accurate quotes.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Job Title</label>
                    <input 
                      type="text"
                      placeholder="e.g. Fix Leaky Faucet in Kitchen"
                      className="w-full p-5 bg-gray-50 rounded-3xl border border-gray-100 focus:border-black outline-none font-bold transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Detailed Description</label>
                    <textarea 
                      placeholder="Describe what needs to be done, any specific materials, or accessibility issues..."
                      className="w-full p-5 bg-gray-50 rounded-3xl border border-gray-100 focus:border-black outline-none min-h-[200px] text-sm leading-relaxed transition-all"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Upload media</h2>
                  <p className="text-gray-500 text-sm">Photos or videos help contractors understand the scope.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-black hover:text-black transition-all group">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Camera size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Media</span>
                  </button>
                  <div className="aspect-square bg-gray-100 rounded-[2rem] overflow-hidden relative group">
                    <img src="https://picsum.photos/seed/job1/400/400" className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" className="p-3 bg-white rounded-full text-red-500 shadow-lg">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">What's your budget?</h2>
                  <p className="text-gray-500 text-sm">Give an estimated range or request quotes from contractors.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="space-y-1">
                      <span className="text-sm font-bold">Request Quotes</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Let contractors bid on your job</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, requestQuote: !formData.requestQuote})}
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.requestQuote ? 'bg-black' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.requestQuote ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {!formData.requestQuote && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                          <input 
                            type="number"
                            placeholder="Min"
                            className="w-full p-5 pl-8 bg-gray-50 rounded-2xl border border-gray-100 focus:border-black outline-none font-bold transition-all"
                            value={formData.minBudget}
                            onChange={(e) => setFormData({...formData, minBudget: e.target.value, budget: `${e.target.value} - ${formData.maxBudget}`})}
                          />
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                          <input 
                            type="number"
                            placeholder="Max"
                            className="w-full p-5 pl-8 bg-gray-50 rounded-2xl border border-gray-100 focus:border-black outline-none font-bold transition-all"
                            value={formData.maxBudget}
                            onChange={(e) => setFormData({...formData, maxBudget: e.target.value, budget: `${formData.minBudget} - ${e.target.value}`})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {['< $500', '$500 - $2k', '$2k - $5k', '$5k+'].map(range => (
                          <button 
                            key={range}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, budget: range, requestQuote: false});
                            }}
                            className={`p-4 rounded-2xl text-sm font-bold border transition-all ${formData.budget === range && !formData.requestQuote ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Where is the job?</h2>
                  <p className="text-gray-500 text-sm">Select the location on the map.</p>
                </div>
                <div className="relative aspect-[4/5] bg-gray-100 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner">
                  <img src="https://picsum.photos/seed/map/800/1000" className="w-full h-full object-cover opacity-60" alt="Map" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <MapPin size={48} className="text-black fill-white" />
                      </motion.div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/20 rounded-full blur-[2px]"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/50">
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white shrink-0">
                        <MapPin size={20} />
                      </div>
                      <input 
                        type="text"
                        className="flex-1 text-sm font-bold outline-none bg-transparent"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setStep(6)}
                      className="w-full bg-black text-white p-5 rounded-3xl font-bold text-sm shadow-xl shadow-black/20 active:scale-95 transition-transform"
                    >
                      Confirm Location
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">When should it start?</h2>
                  <p className="text-gray-500 text-sm">Select your preferred schedule.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'asap', label: 'As soon as possible', icon: '⚡', desc: 'Urgent task, needs immediate attention' },
                    { id: 'week', label: 'Within a week', icon: '📅', desc: 'Flexible but preferred soon' },
                    { id: 'month', label: 'Within a month', icon: '🗓️', desc: 'Planning ahead for a future project' },
                    { id: 'flexible', label: 'I am flexible', icon: '🧘', desc: 'No rush, anytime works' },
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFormData({...formData, schedule: option.label})}
                      className={`p-6 rounded-3xl border-2 flex items-center gap-5 transition-all text-left ${formData.schedule === option.label ? 'border-black bg-gray-50 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0">
                        {option.icon}
                      </div>
                      <div>
                        <span className="font-bold text-base block">{option.label}</span>
                        <span className="text-xs text-gray-400">{option.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 7 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Review your job</h2>
                  <p className="text-gray-500 text-sm">Check everything before submitting.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl">
                          {categories.find(c => c.name === formData.category)?.icon || '📋'}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Category</span>
                          <span className="font-bold text-lg">{formData.category}</span>
                        </div>
                      </div>
                      <button onClick={() => setStep(1)} className="p-2 rounded-full bg-white shadow-sm text-gray-400 hover:text-black transition-colors">
                        <ChevronLeft size={16} className="rotate-180" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                          <Plus size={20} />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Title & Description</span>
                          <span className="font-bold block text-lg">{formData.title || 'Untitled'}</span>
                          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{formData.description || 'No description provided.'}</p>
                        </div>
                      </div>
                      <button onClick={() => setStep(2)} className="p-2 rounded-full bg-white shadow-sm text-gray-400 hover:text-black transition-colors">
                        <ChevronLeft size={16} className="rotate-180" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-3xl bg-white shadow-sm space-y-1 relative group">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Budget</span>
                        <span className="font-bold">
                          {formData.requestQuote ? 'Requesting Quotes' : (formData.minBudget && formData.maxBudget ? `$${formData.minBudget} - $${formData.maxBudget}` : formData.budget)}
                        </span>
                        <button onClick={() => setStep(4)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronLeft size={14} className="rotate-180" />
                        </button>
                      </div>
                      <div className="p-4 rounded-3xl bg-white shadow-sm space-y-1 relative group">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Schedule</span>
                        <span className="font-bold">{formData.schedule}</span>
                        <button onClick={() => setStep(6)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronLeft size={14} className="rotate-180" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Location</span>
                          <span className="font-bold block text-lg">{formData.location}</span>
                        </div>
                      </div>
                      <button onClick={() => setStep(5)} className="p-2 rounded-full bg-white shadow-sm text-gray-400 hover:text-black transition-colors">
                        <ChevronLeft size={16} className="rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            {step > 1 && step < 7 && (
              <button 
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-gray-50 text-gray-400 p-5 rounded-3xl font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
            )}
            {step < 7 ? (
              <button 
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex-[2] bg-black text-white p-5 rounded-3xl font-bold text-sm shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Continue
              </button>
            ) : (
              <button 
                type="submit"
                className="flex-1 bg-black text-white p-6 rounded-3xl font-bold text-base flex items-center justify-center gap-3 shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Check size={20} /> Post Job Now
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
