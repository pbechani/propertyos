import React from 'react';
import { ChevronLeft, ShieldCheck, FileText, CheckCircle2, AlertCircle, ExternalLink, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface ComplianceScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ComplianceScreen: React.FC<ComplianceScreenProps> = ({ onNavigate }) => {
  const credentials = [
    { title: 'Master Carpenter License', id: 'LIC-2024-8891', status: 'Active', expiry: 'Dec 2026', verified: true },
    { title: 'General Liability Insurance', id: 'INS-GL-4452', status: 'Active', expiry: 'Jan 2027', verified: true },
    { title: 'Workers Compensation', id: 'WC-NY-9912', status: 'Active', expiry: 'Mar 2027', verified: true },
    { title: 'OSHA 30 Safety Certification', id: 'OSHA-30-5512', status: 'Active', expiry: 'Lifetime', verified: true },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-40">
        <button 
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest">Compliance & Credentials</h1>
        <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
          <Download size={20} />
        </button>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Verification Badge */}
        <div className="bg-emerald-50 p-6 rounded-3xl flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-900">BuildTrust Verified</h2>
            <p className="text-xs text-emerald-800/60 mt-1 leading-relaxed">
              All credentials have been manually verified by our compliance team as of March 2026.
            </p>
          </div>
        </div>

        {/* Credentials List */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Active Credentials</h3>
          <div className="space-y-4">
            {credentials.map((cred, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center gap-4 hover:border-black transition-colors group cursor-pointer"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold">{cred.title}</h4>
                    <div className="flex items-center gap-1 text-emerald-500">
                      <CheckCircle2 size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">ID: {cred.id}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Exp: {cred.expiry}</span>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-300 group-hover:text-black transition-colors" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Safety & Compliance Note */}
        <div className="bg-gray-50 p-6 rounded-3xl flex gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">About Verification</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              BuildTrust verifies licenses, insurance, and certifications annually. We recommend homeowners also perform their own due diligence before signing contracts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
