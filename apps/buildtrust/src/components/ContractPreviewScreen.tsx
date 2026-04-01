import React from 'react';
import { ChevronLeft, FileText, Shield, Download, Share2, Printer, CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface ContractPreviewScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ContractPreviewScreen: React.FC<ContractPreviewScreenProps> = ({ onNavigate }) => {
  const contractData = {
    id: 'CTR-2026-0421',
    title: 'Kitchen Remodel Agreement',
    contractor: 'Elite Plumbing Solutions',
    homeowner: 'Alexander Wright',
    date: 'March 12, 2026',
    amount: '$12,700.00',
    deposit: '$6,350.00',
    status: 'Active & Funded',
    sections: [
      {
        title: '1. Scope of Work',
        content: 'Contractor agrees to perform the following services: Full kitchen plumbing remodel, including installation of new sink, faucet, dishwasher connection, and garbage disposal. All work will be performed in accordance with local building codes. Cabinetry installation and electrical rough-in are included as per the attached design specifications.'
      },
      {
        title: '2. Payment Schedule',
        content: 'Total project cost is $12,700.00. A deposit of $6,350.00 (50%) is held in escrow. Milestone 1 (Demolition): $1,200.00. Milestone 2 (Rough-in): $2,500.00. Milestone 3 (Installation): $4,000.00. Final Payment: $1,500.00 upon completion and approval.'
      },
      {
        title: '3. Timeline & Completion',
        content: 'Work commenced on March 15, 2026. Estimated completion date is April 10, 2026. Contractor will provide weekly progress updates via the platform. Any changes to the scope must be approved via a written change order.'
      },
      {
        title: '4. Insurance & Liability',
        content: 'Contractor maintains active general liability insurance and workers compensation. Homeowner agrees to provide reasonable access to the property during agreed working hours (8:00 AM - 6:00 PM).'
      },
      {
        title: '5. Dispute Resolution',
        content: 'Any disputes arising from this agreement will be handled through the platform\'s integrated dispute resolution service before seeking external legal action.'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('jobDetail')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Service Agreement</h1>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
            <Share2 size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
            <Printer size={20} />
          </button>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {/* Status Banner */}
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Contract Status</p>
            <p className="text-sm font-bold text-emerald-900">{contractData.status}</p>
          </div>
          <div className="ml-auto">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
        </div>

        {/* Contract Metadata */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{contractData.title}</h2>
              <p className="text-xs text-gray-400 font-medium">ID: {contractData.id}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-black">
              <FileText size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contractor</p>
              <p className="text-sm font-bold">{contractData.contractor}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Homeowner</p>
              <p className="text-sm font-bold">{contractData.homeowner}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Effective Date</p>
              <p className="text-sm font-bold">{contractData.date}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Value</p>
              <p className="text-sm font-bold text-black">{contractData.amount}</p>
            </div>
          </div>
        </div>

        {/* Contract Body */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-4">Agreement Terms</h3>
          
          <div className="space-y-4">
            {contractData.sections.map((section, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4"
              >
                <h4 className="text-xs font-bold uppercase tracking-widest text-black">{section.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{section.content}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Signatures */}
        <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 space-y-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Digital Signatures</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold">{contractData.homeowner}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Signed on {contractData.date}</p>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Verified</span>
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold">{contractData.contractor}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Signed on {contractData.date}</p>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent z-40">
        <button 
          className="w-full py-5 bg-black text-white rounded-[2rem] font-bold text-sm flex items-center justify-center gap-3 shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Download size={20} /> Download PDF Version
        </button>
      </div>
    </div>
  );
};
