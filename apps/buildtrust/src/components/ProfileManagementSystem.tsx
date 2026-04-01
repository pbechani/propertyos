import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Camera, 
  Plus, 
  X, 
  Check, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Star, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Image as ImageIcon, 
  FileText, 
  DollarSign, 
  Calendar, 
  Globe, 
  AlertTriangle,
  MessageSquare,
  Eye,
  Award,
  Settings,
  User,
  Search
} from 'lucide-react';
import { Screen } from '../types';

interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

// --- Mock Data ---
const services = [
  { id: '1', name: 'Kitchen Remodeling', category: 'Renovation' },
  { id: '2', name: 'Bathroom Tiling', category: 'Flooring' },
  { id: '3', name: 'General Plumbing', category: 'Maintenance' },
];

const portfolioItems = [
  { id: '1', title: 'Modern Kitchen', imageUrl: 'https://picsum.photos/seed/kitchen/400/300' },
  { id: '2', title: 'Luxury Bathroom', imageUrl: 'https://picsum.photos/seed/bath/400/300' },
  { id: '3', title: 'Hardwood Deck', imageUrl: 'https://picsum.photos/seed/deck/400/300' },
];

const certifications = [
  { id: '1', name: 'Licensed General Contractor', issuer: 'State Board', expiry: 'Dec 2026', status: 'Verified' },
  { id: '2', name: 'Master Plumber', issuer: 'Plumbing Association', expiry: 'Jun 2027', status: 'Pending' },
];

const reviews = [
  { id: '1', author: 'Sarah J.', rating: 5, date: '2 days ago', content: 'Excellent work on our kitchen! Very professional and timely.', response: null },
  { id: '2', author: 'Mike R.', rating: 4, date: '1 week ago', content: 'Great tiling job. A small delay but the quality is top-notch.', response: 'Thanks Mike! Glad you liked the results.' },
];

// --- Components ---

export const ContractorProfileHub: React.FC<ScreenProps> = ({ onNavigate }) => {
  const menuItems = [
    { icon: <Edit3 size={20} />, label: 'Edit Profile', screen: 'editProfile', desc: 'Name, bio, and contact info' },
    { icon: <Plus size={20} />, label: 'Add Services', screen: 'addServices', desc: 'Manage your service offerings' },
    { icon: <ImageIcon size={20} />, label: 'Portfolio Upload', screen: 'portfolioUpload', desc: 'Showcase your best work' },
    { icon: <Award size={20} />, label: 'Certifications', screen: 'certificationsUpload', desc: 'Licenses and credentials' },
    { icon: <DollarSign size={20} />, label: 'Pricing Setup', screen: 'pricingSetup', desc: 'Rates and service fees' },
    { icon: <Calendar size={20} />, label: 'Availability', screen: 'availabilitySchedule', desc: 'Weekly working hours' },
    { icon: <Globe size={20} />, label: 'Service Area', screen: 'serviceAreaMap', desc: 'Coverage radius and location' },
    { icon: <ShieldCheck size={20} />, label: 'Verification', screen: 'verificationStatus', desc: 'Identity and business checks' },
    { icon: <Star size={20} />, label: 'Reviews', screen: 'reviewsReceived', desc: 'View and respond to feedback' },
    { icon: <Eye size={20} />, label: 'Profile Preview', screen: 'profilePreview', desc: 'See how clients see you' },
    { icon: <Trash2 size={20} />, label: 'Deactivate', screen: 'deactivateAccount', desc: 'Temporarily hide your profile', color: 'text-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[3rem] shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Profile Management</h1>
          <button onClick={() => onNavigate('settings')} className="p-2 -mr-2 hover:bg-gray-50 rounded-full transition-colors">
            <Settings size={24} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-[2rem] bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
            <img src="https://picsum.photos/seed/contractor/200/200" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter">Alex Thompson</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thompson Quality Builds</p>
            <div className="flex items-center gap-1 mt-1 text-emerald-500">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Verified Pro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-4">
        {menuItems.map((item) => (
          <button 
            key={item.screen}
            onClick={() => onNavigate(item.screen as Screen)}
            className="w-full bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:border-black transition-all text-left group"
          >
            <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors ${item.color || 'text-black'}`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">{item.label}</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.desc}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};

export const EditProfileScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Edit Profile</h1>
        <button onClick={() => onNavigate('profile')} className="text-sm font-bold text-black">Save</button>
      </div>

      <div className="px-6 mt-8 space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gray-100 overflow-hidden border-4 border-white shadow-xl">
              <img src="https://picsum.photos/seed/contractor/200/200" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-0 right-0 w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-white">
              <Camera size={18} />
            </button>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Change Photo</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Full Name</label>
            <input type="text" defaultValue="Alex Thompson" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-black transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Business Name</label>
            <input type="text" defaultValue="Thompson Quality Builds" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-black transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Bio</label>
            <textarea rows={4} defaultValue="Specializing in high-end residential renovations with over 15 years of experience in the Bay Area." className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-black transition-all resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Phone Number</label>
            <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-black transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AddServicesScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Services</h1>
        <button className="p-2 -mr-2 hover:bg-gray-50 rounded-full transition-colors">
          <Plus size={24} />
        </button>
      </div>

      <div className="px-6 mt-8 space-y-8">
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">My Services</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-sm">{service.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{service.category}</p>
                </div>
                <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Popular Categories</h2>
          <div className="flex flex-wrap gap-2">
            {['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'HVAC', 'Roofing'].map((cat) => (
              <button key={cat} className="px-6 py-3 bg-gray-50 rounded-2xl text-xs font-bold hover:bg-black hover:text-white transition-all">
                {cat}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export const PortfolioUploadScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Portfolio</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 mt-8 space-y-8">
        <div className="aspect-square bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 text-center p-8 group hover:border-black transition-all cursor-pointer">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Plus size={32} className="text-black" />
          </div>
          <div className="space-y-1">
            <p className="font-bold">Upload New Project</p>
            <p className="text-xs text-gray-400">Drag and drop or click to browse</p>
          </div>
        </div>

        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Recent Projects</h2>
          <div className="grid grid-cols-2 gap-4">
            {portfolioItems.map((item) => (
              <div key={item.id} className="relative group overflow-hidden rounded-[2rem]">
                <img src={item.imageUrl} alt={item.title} className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                  <h4 className="text-white font-bold text-xs">{item.title}</h4>
                  <button className="absolute top-2 right-2 p-1.5 bg-white/20 backdrop-blur-md rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export const CertificationsUploadScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Certifications</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 mt-8 space-y-8">
        <button className="w-full bg-black text-white p-6 rounded-[2.5rem] flex items-center justify-center gap-3 font-bold shadow-lg shadow-black/10 transition-transform active:scale-95">
          <Plus size={20} /> Add Certification
        </button>

        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Active Credentials</h2>
          <div className="space-y-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  cert.status === 'Verified' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                }`}>
                  <Award size={28} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{cert.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{cert.issuer} • Exp: {cert.expiry}</p>
                </div>
                <div className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-full ${
                  cert.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {cert.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-blue-50 p-6 rounded-[2.5rem] flex gap-4 items-start">
          <ShieldCheck className="text-blue-500 shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">Verification Process</p>
            <p className="text-xs font-medium text-blue-700 leading-relaxed">
              Verified certifications increase your profile visibility and build trust with homeowners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PricingSetupScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Pricing Setup</h1>
        <button className="text-sm font-bold text-black">Save</button>
      </div>

      <div className="px-6 mt-8 space-y-8">
        <section className="bg-gray-50 p-8 rounded-[3rem] text-center space-y-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Hourly Rate</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-black text-gray-300">$</span>
            <input type="number" defaultValue="85" className="text-6xl font-black tracking-tighter border-none bg-transparent focus:ring-0 w-32 text-center p-0" />
            <span className="text-xl font-bold text-gray-400">/hr</span>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Service Pricing</h2>
          <div className="space-y-4">
            {['Consultation Fee', 'Emergency Call-out', 'Material Markup %'].map((item) => (
              <div key={item} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                <p className="font-bold text-sm">{item}</p>
                <div className="flex items-center gap-2">
                  <input type="text" defaultValue={item.includes('%') ? '15' : '50'} className="w-16 bg-gray-50 border-none rounded-xl py-2 px-3 text-right font-bold text-sm focus:ring-1 focus:ring-black" />
                  <span className="text-xs font-bold text-gray-400">{item.includes('%') ? '%' : '$'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-amber-50 p-6 rounded-[2.5rem] flex gap-4 items-start">
          <DollarSign className="text-amber-600 shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-amber-900 mb-1">Pricing Tip</p>
            <p className="text-xs font-medium text-amber-700 leading-relaxed">
              Competitive pricing in your area for similar services ranges from $75 - $110 per hour.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AvailabilityScheduleScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Availability</h1>
        <button className="text-sm font-bold text-black">Save</button>
      </div>

      <div className="px-6 mt-8 space-y-8">
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Weekly Schedule</h2>
          <div className="space-y-3">
            {days.map((day) => (
              <div key={day} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                    day === 'Sat' || day === 'Sun' ? 'bg-gray-50 text-gray-400' : 'bg-black text-white'
                  }`}>
                    {day[0]}
                  </div>
                  <span className="font-bold text-sm">{day}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold">09:00 AM - 05:00 PM</p>
                    <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Available</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-black text-white p-8 rounded-[3rem] flex items-center justify-between shadow-xl shadow-black/20">
          <div className="space-y-1">
            <h3 className="font-bold">Vacation Mode</h3>
            <p className="text-xs text-white/60">Hide your profile from search</p>
          </div>
          <div className="w-14 h-8 bg-white/20 rounded-full p-1 flex items-center cursor-pointer">
            <div className="w-6 h-6 bg-white rounded-full shadow-sm" />
          </div>
        </section>
      </div>
    </div>
  );
};

export const ServiceAreaMapScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Service Area</h1>
        <button className="text-sm font-bold text-black">Save</button>
      </div>

      <div className="px-6 mt-8 space-y-8">
        <div className="aspect-[4/5] bg-gray-100 rounded-[3rem] overflow-hidden relative border border-gray-100 shadow-inner">
          <img src="https://picsum.photos/seed/map/800/1000" alt="Map" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 bg-black/10 border-2 border-black rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-black rounded-full shadow-lg" />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coverage Radius</p>
              <p className="font-black text-lg">25 miles</p>
            </div>
            <input type="range" className="w-full accent-black" />
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Base Location</h2>
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
              <MapPin size={24} className="text-black" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">San Francisco, CA</h4>
              <p className="text-xs text-gray-400">94103 • Mission District</p>
            </div>
            <button className="text-xs font-bold text-black underline">Edit</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export const VerificationStatusScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const items = [
    { label: 'Identity Verification', status: 'Verified', icon: <User size={20} /> },
    { label: 'Business License', status: 'Verified', icon: <FileText size={20} /> },
    { label: 'Insurance Policy', status: 'Pending', icon: <ShieldCheck size={20} /> },
    { label: 'Background Check', status: 'Not Started', icon: <Search size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[3rem] shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Verification</h1>
          <div className="w-10" />
        </div>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto">
            <ShieldCheck size={40} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tighter">Partially Verified</h2>
            <p className="text-sm font-bold text-gray-400">Complete all steps to get the Pro Badge</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-4 pb-12">
        {items.map((item) => (
          <div key={item.label} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              item.status === 'Verified' ? 'bg-emerald-50 text-emerald-500' : 
              item.status === 'Pending' ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-300'
            }`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{item.label}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${
                item.status === 'Verified' ? 'text-emerald-500' : 
                item.status === 'Pending' ? 'text-amber-500' : 'text-gray-400'
              }`}>{item.status}</p>
            </div>
            {item.status === 'Not Started' && (
              <button className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-transform active:scale-95">
                Start
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ReviewsReceivedScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Reviews</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 mt-8 space-y-8">
        <section className="bg-black text-white p-8 rounded-[3rem] flex items-center justify-between shadow-xl shadow-black/20">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Average Rating</p>
            <h2 className="text-4xl font-black tracking-tighter">4.9</h2>
          </div>
          <div className="text-right space-y-1">
            <div className="flex gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill="currentColor" />)}
            </div>
            <p className="text-xs font-bold text-white/50">Based on 48 reviews</p>
          </div>
        </section>

        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="space-y-4">
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs">
                      {review.author[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{review.author}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                
                {!review.response ? (
                  <button 
                    onClick={() => onNavigate('respondToReview')}
                    className="w-full py-3 bg-gray-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                  >
                    Respond to Review
                  </button>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-2xl border-l-4 border-black">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Response</p>
                    <p className="text-xs text-gray-600 italic">"{review.response}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RespondToReviewScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('reviewsReceived')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Respond</h1>
        <button onClick={() => onNavigate('reviewsReceived')} className="text-sm font-bold text-black">Post</button>
      </div>

      <div className="px-6 mt-8 space-y-8">
        <div className="bg-gray-50 p-6 rounded-[2.5rem] space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} fill="currentColor" />)}
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sarah J.</span>
          </div>
          <p className="text-sm text-gray-600 italic">"Excellent work on our kitchen! Very professional and timely."</p>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Your Response</label>
          <textarea 
            rows={8} 
            placeholder="Write your response here..."
            className="w-full bg-gray-50 border-none rounded-[2rem] py-6 px-6 text-sm font-medium focus:ring-2 focus:ring-black transition-all resize-none"
          />
          <p className="text-[10px] font-medium text-gray-400 px-2 leading-relaxed">
            Your response will be public and visible to all users on your profile.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ProfilePreviewScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="relative h-64 bg-gray-100">
        <img src="https://picsum.photos/seed/cover/800/400" alt="Cover" className="w-full h-full object-cover" />
        <button onClick={() => onNavigate('contractorHome')} className="absolute top-12 left-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white">
          <ArrowLeft size={24} />
        </button>
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 rounded-[2rem] bg-white p-1 shadow-xl">
            <img src="https://picsum.photos/seed/contractor/200/200" alt="Profile" className="w-full h-full object-cover rounded-[1.8rem]" />
          </div>
        </div>
      </div>

      <div className="px-6 pt-16 space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tighter">Alex Thompson</h2>
              <ShieldCheck size={20} className="text-blue-500" />
            </div>
            <p className="text-sm font-bold text-gray-400">Thompson Quality Builds</p>
          </div>
          <button onClick={() => onNavigate('editProfile')} className="px-6 py-3 bg-black text-white rounded-2xl font-bold text-xs shadow-lg shadow-black/10">
            Edit Profile
          </button>
        </div>

        <div className="flex gap-8 border-y border-gray-50 py-6">
          <div className="text-center flex-1">
            <p className="text-lg font-black tracking-tighter">4.9</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</p>
          </div>
          <div className="w-px bg-gray-50" />
          <div className="text-center flex-1">
            <p className="text-lg font-black tracking-tighter">150+</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jobs Done</p>
          </div>
          <div className="w-px bg-gray-50" />
          <div className="text-center flex-1">
            <p className="text-lg font-black tracking-tighter">15y</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Experience</p>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Specializing in high-end residential renovations with over 15 years of experience in the Bay Area. We pride ourselves on quality craftsmanship and transparent communication.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Portfolio</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {portfolioItems.map((item) => (
              <div key={item.id} className="w-48 shrink-0 rounded-[2rem] overflow-hidden shadow-sm">
                <img src={item.imageUrl} alt={item.title} className="w-full aspect-square object-cover" />
                <div className="p-4 bg-white">
                  <p className="font-bold text-xs">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export const DeactivateAccountScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <button onClick={() => onNavigate('contractorHome')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Deactivate</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 mt-12 space-y-12 text-center">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
          <AlertTriangle size={48} />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black tracking-tighter">Are you sure?</h2>
          <p className="text-sm text-gray-500 leading-relaxed px-4">
            Deactivating your account will hide your profile and active listings. You can reactivate your account at any time by logging back in.
          </p>
        </div>

        <div className="bg-gray-50 p-8 rounded-[3rem] space-y-6 text-left">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">What happens next?</h3>
          <ul className="space-y-4">
            <li className="flex gap-3 text-xs font-medium text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5 shrink-0" />
              Your profile will be hidden from search
            </li>
            <li className="flex gap-3 text-xs font-medium text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5 shrink-0" />
              Active quotes will be cancelled
            </li>
            <li className="flex gap-3 text-xs font-medium text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5 shrink-0" />
              You will not receive new notifications
            </li>
          </ul>
        </div>

        <div className="space-y-4 pt-8 pb-12">
          <button onClick={() => onNavigate('roleSelection')} className="w-full bg-red-500 text-white py-5 rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20 transition-transform active:scale-95">
            Deactivate Account
          </button>
          <button onClick={() => onNavigate('profile')} className="w-full py-5 rounded-2xl font-bold text-sm text-gray-400">
            Keep My Account
          </button>
        </div>
      </div>
    </div>
  );
};
