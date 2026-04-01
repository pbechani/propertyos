import React from 'react';
import { ChevronLeft, AlertCircle, MessageSquare, Phone, Mail, ChevronRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface ReportIssueScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ReportIssueScreen: React.FC<ReportIssueScreenProps> = ({ onNavigate }) => {
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onNavigate('home');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white pb-12 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4">
        <button 
          onClick={() => onNavigate('profile')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Report an Issue</h1>
      </header>

      <div className="flex-1 px-6 flex flex-col space-y-8">
        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-100">
              <Check size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Issue Reported</h2>
              <p className="text-gray-400 text-sm max-w-[280px]">Thank you for your feedback. Our support team will review your report and get back to you shortly.</p>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Redirecting to home...</p>
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-start gap-4">
                <AlertCircle size={24} className="text-red-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-red-900 mb-1">How can we help?</h3>
                  <p className="text-xs text-red-700 leading-relaxed">If you're experiencing technical difficulties or have concerns about a project, please let us know.</p>
                </div>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">Issue Category</label>
                  <select className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 focus:border-black focus:ring-0 transition-colors text-sm font-bold appearance-none">
                    <option>Project Dispute</option>
                    <option>Technical Bug</option>
                    <option>Payment Issue</option>
                    <option>Safety Concern</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">Description</label>
                  <textarea 
                    className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 focus:border-black focus:ring-0 transition-colors min-h-[150px] text-sm leading-relaxed"
                    placeholder="Please provide as much detail as possible..."
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-black text-white p-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              >
                Submit Report
              </button>
            </form>

            <section className="space-y-4 pt-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Other Ways to Reach Us</h2>
              <div className="space-y-3">
                {[
                  { icon: <MessageSquare size={18} />, label: 'Live Chat', sub: 'Available 24/7' },
                  { icon: <Phone size={18} />, label: 'Call Support', sub: 'Mon-Fri, 9am-6pm' },
                  { icon: <Mail size={18} />, label: 'Email Us', sub: 'support@buildtrust.com' }
                ].map((item, i) => (
                  <button key={i} className="w-full bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-black transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        {item.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold">{item.label}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.sub}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
