import React from 'react';
import { ChevronLeft, Download, Share2, Printer, ShieldCheck, Mail, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface InvoiceScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const InvoiceScreen: React.FC<InvoiceScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('paymentHistory')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Invoice Details</h1>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Share2 size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Printer size={20} />
          </button>
        </div>
      </header>

      <div className="p-6 space-y-8 pb-32">
        {/* Invoice Header */}
        <div className="bg-gray-50 rounded-[3rem] p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block">
                Paid
              </div>
              <h2 className="text-2xl font-bold tracking-tight">#INV-2026-0324</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issued Mar 24, 2026</p>
            </div>
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-500 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From</p>
              <p className="text-sm font-bold">Elite Plumbing Solutions</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                123 Contractor Lane<br />
                San Francisco, CA 94103
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To</p>
              <p className="text-sm font-bold">Pritesh Bechani</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                456 Homeowner Blvd<br />
                San Francisco, CA 94110
              </p>
            </div>
          </div>
        </div>

        {/* Itemized List */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Itemized Details</label>
          <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Kitchen Remodel - Initial Deposit</p>
                  <p className="text-xs text-gray-500">20% of total project value ($12,700.00)</p>
                </div>
                <span className="text-sm font-bold">$2,540.00</span>
              </div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Platform Service Fee</p>
                  <p className="text-xs text-gray-500">Secure escrow processing</p>
                </div>
                <span className="text-sm font-bold">$45.00</span>
              </div>
            </div>
            <div className="bg-gray-50 p-6 flex justify-between items-center">
              <span className="text-base font-bold">Total Paid</span>
              <span className="text-2xl font-bold">$2,585.00</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Payment Method</label>
          <div className="bg-gray-50 rounded-[2rem] p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">Visa •••• 4242</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Processed via Secure Escrow</p>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => onNavigate('refundRequest')}
            className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:underline"
          >
            Request Refund
          </button>
          <span className="text-gray-200">|</span>
          <button className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:underline">
            Contact Support
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-40">
        <button className="w-full py-5 bg-black text-white rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Download size={18} /> Download PDF Invoice
        </button>
      </div>
    </div>
  );
};
