import React, { useState } from 'react';
import { ChevronLeft, Plus, CreditCard, Landmark, Wallet, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface PaymentMethodScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = ({ onNavigate }) => {
  const [selectedMethod, setSelectedMethod] = useState('card-1');

  const methods = [
    { id: 'card-1', type: 'card', brand: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
    { id: 'card-2', type: 'card', brand: 'Mastercard', last4: '8888', expiry: '08/25', isDefault: false },
    { id: 'bank-1', type: 'bank', bankName: 'Chase Bank', last4: '1234', isDefault: false }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button 
          onClick={() => onNavigate('homeownerProfile')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Payment Method</h1>
      </header>

      <div className="p-6 space-y-8 pb-32">
        {/* Security Banner */}
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem] flex gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-emerald-900">Secure Payments</h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your payment information is encrypted and stored securely. We never share your full card details.
            </p>
          </div>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saved Methods</label>
            <button className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-1">
              <Plus size={12} /> Add New
            </button>
          </div>

          <div className="space-y-3">
            {methods.map((method) => (
              <motion.button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between ${
                  selectedMethod === method.id 
                    ? 'bg-black border-black shadow-xl ring-4 ring-gray-50' 
                    : 'bg-gray-50 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    selectedMethod === method.id ? 'bg-white/10 text-white' : 'bg-white text-gray-400 shadow-sm'
                  }`}>
                    {method.type === 'card' ? <CreditCard size={20} /> : <Landmark size={20} />}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${selectedMethod === method.id ? 'text-white' : 'text-black'}`}>
                      {method.type === 'card' ? `${method.brand} •••• ${method.last4}` : `${method.bankName} •••• ${method.last4}`}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedMethod === method.id ? 'text-gray-400' : 'text-gray-400'}`}>
                      {method.type === 'card' ? `Expires ${method.expiry}` : 'Bank Account'}
                    </p>
                  </div>
                </div>
                {selectedMethod === method.id && (
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black">
                    <Check size={14} />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Other Options */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Other Options</label>
          <button className="w-full p-6 bg-gray-50 rounded-[2rem] flex items-center justify-between hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm">
                <Wallet size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Apple Pay</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fast & Secure</p>
              </div>
            </div>
            <ChevronLeft size={20} className="rotate-180 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-40">
        <button 
          onClick={() => onNavigate('escrowFunding')}
          className="w-full py-5 bg-black text-white rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Confirm Method <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
