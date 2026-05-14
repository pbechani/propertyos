import React from 'react';
import { motion } from 'motion/react';
import { Star, Verified, MapPin, Calendar, ArrowLeft, Share2, MoreVertical, MessageCircle, ArrowRight, ChevronRight, Clock, ShieldCheck, Grid, AlertCircle, Wallet, Settings } from 'lucide-react';
import { Button, Card } from './components/UI';
import { Screen, Review, Project, PriceItem } from './types';

const REVIEWS: Review[] = [
  { id: '1', author: 'Marcus Sterling', initials: 'MS', date: '2 days ago', rating: 5, content: 'Jordan was incredibly professional. He fixed our persistent leak in under an hour and even checked our other pipes for free. Highly recommended!', colorClass: 'bg-secondary-container text-on-secondary-container' },
  { id: '2', author: 'Linda Wu', initials: 'LW', date: '1 week ago', rating: 5, content: 'Excellent kitchen renovation work. The attention to detail on the backsplash was impressive. Completed ahead of schedule too.', colorClass: 'bg-tertiary-container text-on-tertiary' }
];

const PROJECTS: Project[] = [
  { id: '1', title: 'Luxury Bathroom Refit', description: 'Modern aesthetic', year: '2023', imageUrl: 'https://picsum.photos/seed/bath/400/300' },
  { id: '2', title: "Chef's Kitchen Upgrade", description: 'Open concept', year: '2023', imageUrl: 'https://picsum.photos/seed/kitchen/400/300' }
];

const PRICING: PriceItem[] = [
  { label: 'Emergency Call-out', range: '$85 - $120' },
  { label: 'Leak Repair', range: '$150 - $300' },
  { label: 'HVAC Service', range: '$200 - $450' }
];

export const ProfileScreen: React.FC<{ onNavigate: (screen: Screen) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header Image */}
      <div className="h-64 bg-gray-100 relative">
        <img 
          className="w-full h-full object-cover" 
          src="https://picsum.photos/seed/jordan-work/1200/800" 
          alt="Jordan Smith at work" 
          referrerPolicy="no-referrer" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent"></div>
        <nav className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-12 text-white">
          <button onClick={() => onNavigate('discover')} className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"><Share2 className="w-5 h-5" /></button>
            <button className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </nav>
      </div>

      <main className="-mt-12 relative z-10 bg-white rounded-t-[40px] px-6 pt-8 space-y-8">
        {/* Profile Info */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-2xl">
              <img className="w-full h-full object-cover" src="https://picsum.photos/seed/jordan/300/300" alt="Jordan Smith" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute bottom-1 right-1 bg-black text-white p-1.5 rounded-full ring-4 ring-white">
              <Verified className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-black">Jordan Smith</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Master Carpenter & Joiner</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-black text-black" />
                <span className="text-sm font-bold">4.9</span>
              </div>
              <span className="text-gray-400 text-sm font-bold">(124 reviews) • Brooklyn, NY</span>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
          <div className="text-center">
            <p className="text-xl font-bold">12+</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Years Exp.</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-xl font-bold">240</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Projects</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">100%</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Verified</p>
          </div>
        </section>

        {/* Navigation Grid */}
        <section className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('portfolio')}
            className="bg-gray-50 p-6 rounded-3xl flex flex-col gap-4 hover:bg-black hover:text-white transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors">
              <Grid className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Portfolio</h3>
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">6 Projects</p>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('reviews')}
            className="bg-gray-50 p-6 rounded-3xl flex flex-col gap-4 hover:bg-black hover:text-white transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Reviews</h3>
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">124 Reviews</p>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('availability')}
            className="bg-gray-50 p-6 rounded-3xl flex flex-col gap-4 hover:bg-black hover:text-white transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Availability</h3>
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Next: Mar 24</p>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('compliance')}
            className="bg-gray-50 p-6 rounded-3xl flex flex-col gap-4 hover:bg-black hover:text-white transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Compliance</h3>
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Verified</p>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('paymentHistory')}
            className="bg-gray-50 p-6 rounded-3xl flex flex-col gap-4 hover:bg-black hover:text-white transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Payments</h3>
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">History & Invoices</p>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('settings')}
            className="bg-gray-50 p-6 rounded-3xl flex flex-col gap-4 hover:bg-black hover:text-white transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Settings</h3>
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">App Preferences</p>
            </div>
          </button>
        </section>

        {/* About */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">About Jordan</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Specializing in high-end residential carpentry and custom joinery. With over 12 years of experience in the New York area, I pride myself on precision, reliability, and clear communication.
          </p>
        </section>

        {/* Services */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Services</h2>
          <div className="flex flex-wrap gap-2">
            {['Custom Cabinetry', 'Hardwood Flooring', 'Decking', 'Structural Framing', 'Finish Carpentry'].map(service => (
              <span key={service} className="px-4 py-2 bg-gray-50 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {service}
              </span>
            ))}
          </div>
        </section>
        {/* Support */}
        <section className="pt-4 border-t border-gray-100">
          <button 
            onClick={() => onNavigate('reportIssue')}
            className="w-full flex items-center justify-between p-4 bg-red-50 rounded-2xl text-red-600 hover:bg-red-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Report an Issue</span>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>
      </main>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="flex gap-4">
          <button className="flex-1 py-5 bg-gray-50 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors">
            Message
          </button>
          <button className="flex-[2] py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10">
            Start Project
          </button>
        </div>
      </div>
    </div>
  );
};
