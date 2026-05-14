import React from 'react';
import { ChevronLeft, Sparkles, Check, ArrowRight, Info, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface AIBuilderScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const AIBuilderScreen: React.FC<AIBuilderScreenProps> = ({ onNavigate }) => {
  const [step, setStep] = React.useState(1);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const startGeneration = () => {
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setStep(2);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white pb-12 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('createProject')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">AI Project Builder</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
          <Sparkles size={20} />
        </div>
      </header>

      <div className="flex-1 px-6 flex flex-col space-y-8">
        {step === 1 ? (
          <>
            <section className="space-y-4">
              <div className="p-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-purple-200 relative overflow-hidden">
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">AI Assistant Ready</h3>
                    <p className="text-sm text-white/80 leading-relaxed">Describe your vision, and I'll generate a complete project plan, budget, and timeline for you.</p>
                  </div>
                </div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Project Description</label>
                <textarea 
                  className="w-full bg-gray-50 rounded-[2rem] p-6 border border-gray-100 focus:border-black focus:ring-0 transition-all min-h-[180px] text-sm leading-relaxed"
                  placeholder="Tell me about your project... (e.g., I want to remodel my kitchen with a modern aesthetic, white cabinets, and a large island.)"
                  defaultValue="I'm looking to remodel my master bathroom. It's about 100 square feet. I want to replace the old tile with marble, add a double vanity with a quartz countertop, and install a walk-in shower with a glass enclosure. I'm hoping to start in about two months and my budget is around $15,000."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Budget Range</label>
                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 text-sm font-bold flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Plus size={14} className="rotate-45" />
                    </div>
                    $10k - $20k
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Timeline</label>
                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 text-sm font-bold flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Plus size={14} />
                    </div>
                    2-3 Months
                  </div>
                </div>
              </div>
            </section>

            <div className="flex-1"></div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={startGeneration}
              disabled={isGenerating}
              className="w-full bg-black text-white p-6 rounded-3xl font-bold text-base flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 shadow-2xl shadow-black/20"
            >
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="generating"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Generating Plan...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="generate"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Sparkles size={18} />
                    <span>Generate Project Plan</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <section className="bg-black text-white p-6 rounded-3xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-1">Master Bathroom Remodel</h3>
                <p className="text-white/60 text-xs mb-4">Project Plan Generated by AI</p>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Estimate</span>
                    <span className="text-sm font-bold">$14,500 - $16,200</span>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Duration</span>
                    <span className="text-sm font-bold">8-10 Weeks</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Project Phases</h2>
              <div className="space-y-3">
                {[
                  { title: 'Demolition & Preparation', duration: '1 Week', status: 'Planned' },
                  { title: 'Plumbing & Electrical', duration: '2 Weeks', status: 'Planned' },
                  { title: 'Tiling & Surfaces', duration: '3 Weeks', status: 'Planned' },
                  { title: 'Fixtures & Finishing', duration: '2 Weeks', status: 'Planned' }
                ].map((phase, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold">{phase.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{phase.duration}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Recommended Experts</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                {[
                  { name: 'Jordan Smith', role: 'Plumber', rating: 4.9, color: 'bg-blue-500' },
                  { name: 'Elena Rodriguez', role: 'Tiler', rating: 5.0, color: 'bg-purple-500' },
                  { name: 'Marcus Chen', role: 'Electrician', rating: 4.8, color: 'bg-emerald-500' }
                ].map((expert, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 min-w-[160px] flex flex-col items-center text-center gap-2">
                    <div className={`w-12 h-12 rounded-full ${expert.color} flex items-center justify-center text-white font-bold`}>
                      {expert.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{expert.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{expert.role}</p>
                    </div>
                    <button className="w-full mt-2 py-2 bg-gray-50 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">Invite</button>
                  </div>
                ))}
              </div>
            </section>

            <div className="pt-4 space-y-4">
              <button 
                onClick={() => onNavigate('jobSuccess')}
                className="w-full bg-black text-white p-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Check size={18} /> Post Project Now
              </button>
              <button 
                onClick={() => setStep(1)}
                className="w-full bg-gray-100 text-gray-600 p-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              >
                Refine Details
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
