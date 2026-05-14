import React, { useState } from 'react';
import { 
  ChevronLeft, 
  FileText, 
  Shield, 
  Download, 
  Share2, 
  Printer, 
  CheckCircle2, 
  X, 
  PenTool, 
  AlertCircle,
  Info,
  ArrowRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface ContractSystemProps {
  onNavigate: (screen: Screen) => void;
  userRole: 'homeowner' | 'contractor';
  contractId?: string;
}

const MOCK_CONTRACT = {
  id: 'CTR-2026-0421',
  title: 'Kitchen Remodel Agreement',
  contractor: 'Elite Plumbing Solutions',
  homeowner: 'Alexander Wright',
  date: 'March 12, 2026',
  amount: '$12,700.00',
  deposit: '$6,350.00',
  status: 'Pending Signatures',
  homeownerSigned: false,
  contractorSigned: false,
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
    }
  ]
};

export const CreateContractScreen: React.FC<ContractSystemProps> = ({ onNavigate }) => {
  const [title, setTitle] = useState('Service Agreement');
  const [amount, setAmount] = useState('12700');
  const [deposit, setDeposit] = useState('6350');
  const [scope, setScope] = useState('Full kitchen plumbing remodel...');

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button onClick={() => onNavigate('quoteHistory')} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Draft Contract</h1>
      </header>

      <main className="p-6 space-y-8">
        <div className="p-6 bg-blue-50 rounded-3xl flex gap-4 items-start">
          <Info className="text-blue-500 shrink-0" size={20} />
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            This contract is pre-filled based on your accepted quote. Review and adjust the terms before sending to the client.
          </p>
        </div>

        <section className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Agreement Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-5 bg-gray-50 rounded-2xl text-sm font-bold focus:outline-none border border-gray-100"
          />
        </section>

        <div className="grid grid-cols-2 gap-4">
          <section className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Total Amount</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-5 bg-gray-50 rounded-2xl text-sm font-bold focus:outline-none border border-gray-100"
              />
            </div>
          </section>
          <section className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Escrow Deposit</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="number" 
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full pl-10 pr-4 py-5 bg-gray-50 rounded-2xl text-sm font-bold focus:outline-none border border-gray-100"
              />
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Scope of Work</label>
          <textarea 
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full h-48 p-6 bg-gray-50 rounded-[2rem] text-sm font-medium focus:outline-none resize-none border border-gray-100"
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Standard Clauses</h3>
          <div className="space-y-3">
            {['Payment Schedule', 'Timeline & Delays', 'Insurance & Liability', 'Dispute Resolution'].map(clause => (
              <div key={clause} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-gray-400" />
                  <span className="text-sm font-bold">{clause}</span>
                </div>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <button 
          onClick={() => onNavigate('contractPreview')}
          className="w-full py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10"
        >
          Review & Send to Client
        </button>
      </div>
    </div>
  );
};

export const SignContractScreen: React.FC<ContractSystemProps> = ({ onNavigate, userRole }) => {
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const handleSign = () => {
    setIsSigning(true);
    setTimeout(() => {
      setSigned(true);
      setIsSigning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button onClick={() => onNavigate('contractDetail')} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Sign Agreement</h1>
      </header>

      <main className="p-6 space-y-8">
        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="font-bold">BuildTrust Protection</h2>
              <p className="text-xs text-gray-500">Legally binding digital signature</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            By signing this document, you agree to the terms and conditions outlined in the Service Agreement. This signature is legally binding and carries the same weight as a physical signature.
          </p>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Sign Below</label>
          <div className="w-full h-64 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 group hover:border-black transition-all cursor-crosshair relative overflow-hidden">
            {signed ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <p className="font-serif italic text-4xl text-black select-none">
                  {userRole === 'homeowner' ? 'Alexander Wright' : 'Marco Rossi'}
                </p>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Digitally Verified</p>
              </motion.div>
            ) : (
              <>
                <PenTool size={32} className="text-gray-300 group-hover:text-black transition-colors" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Draw your signature here</p>
              </>
            )}
          </div>
          {!signed && (
            <button className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors ml-2">
              Clear Signature
            </button>
          )}
        </div>

        <div className="p-6 bg-emerald-50 rounded-3xl flex gap-4 items-start border border-emerald-100">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
          <p className="text-xs text-emerald-700 leading-relaxed font-medium">
            Your identity has been verified via your account credentials.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <button 
          disabled={!signed || isSigning}
          onClick={() => onNavigate('contractSuccess')}
          className={`w-full py-5 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
            signed ? 'bg-black text-white shadow-black/10' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSigning ? 'Processing...' : 'Complete Signing'}
        </button>
      </div>

      {!signed && (
        <div className="fixed bottom-32 left-0 right-0 px-6 flex justify-center pointer-events-none">
          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={handleSign}
            className="pointer-events-auto px-8 py-4 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2"
          >
            <PenTool size={16} /> Quick Sign
          </motion.button>
        </div>
      )}
    </div>
  );
};

export const ContractDetailScreen: React.FC<ContractSystemProps> = ({ onNavigate, userRole }) => {
  const contract = MOCK_CONTRACT;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(userRole === 'homeowner' ? 'jobDetail' : 'activeJobs')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Service Agreement</h1>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
            <Download size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
            <Printer size={20} />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* Status Banner */}
        <div className={`p-6 rounded-[2rem] border flex items-center gap-4 ${
          contract.status === 'Active & Funded' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'
        }`}>
          <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm ${
            contract.status === 'Active & Funded' ? 'text-emerald-500' : 'text-blue-500'
          }`}>
            <Shield size={24} />
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${
              contract.status === 'Active & Funded' ? 'text-emerald-600' : 'text-blue-600'
            }`}>Contract Status</p>
            <p className={`text-sm font-bold ${
              contract.status === 'Active & Funded' ? 'text-emerald-900' : 'text-blue-900'
            }`}>{contract.status}</p>
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{contract.title}</h2>
              <p className="text-xs text-gray-400 font-medium">ID: {contract.id}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-black">
              <FileText size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contractor</p>
              <p className="text-sm font-bold">{contract.contractor}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Homeowner</p>
              <p className="text-sm font-bold">{contract.homeowner}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</p>
              <p className="text-sm font-bold">{contract.amount}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deposit</p>
              <p className="text-sm font-bold">{contract.deposit}</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {contract.sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-black">{section.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Signatures */}
        <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 space-y-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Digital Signatures</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold">{contract.homeowner}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  {contract.homeownerSigned ? `Signed on ${contract.date}` : 'Awaiting Signature'}
                </p>
              </div>
              {contract.homeownerSigned ? (
                <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Verified</span>
                </div>
              ) : (
                <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
                  <Clock size={12} className="text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Pending</span>
                </div>
              )}
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold">{contract.contractor}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  {contract.contractorSigned ? `Signed on ${contract.date}` : 'Awaiting Signature'}
                </p>
              </div>
              {contract.contractorSigned ? (
                <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Verified</span>
                </div>
              ) : (
                <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
                  <Clock size={12} className="text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Pending</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dispute Resolution Section */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold">Dispute Resolution</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mediation Services</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            If you encounter any issues regarding the scope of work, quality, or payments that cannot be resolved directly, you can open a formal dispute.
          </p>
          <button 
            onClick={() => onNavigate('dispute')}
            className="w-full py-4 bg-orange-50 text-orange-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
          >
            <AlertCircle size={14} /> Open Formal Dispute
          </button>
        </div>
      </main>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-40">
        {((userRole === 'homeowner' && !contract.homeownerSigned) || (userRole === 'contractor' && !contract.contractorSigned)) ? (
          <button 
            onClick={() => onNavigate('signContract')}
            className="w-full py-5 bg-black text-white rounded-full font-bold text-sm flex items-center justify-center gap-3 shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PenTool size={20} /> Sign Agreement
          </button>
        ) : (
          <button 
            className="w-full py-5 bg-gray-50 text-gray-400 rounded-full font-bold text-sm flex items-center justify-center gap-3"
          >
            <CheckCircle2 size={20} /> Signed & Verified
          </button>
        )}
      </div>
    </div>
  );
};
