'use client';

import { X, DollarSign, ArrowRight, Calendar, FileText, TrendingUp, Clock, AlertCircle, Send, Calculator } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface Offer {
  id: string;
  buyer: string;
  amount: number;
  earnestMoney?: number | null;
  contingencies: string[];
  closingDate?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  submittedDate: string;
  financing: string;
  notes: string;
}

interface CounterOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer | null;
  listPrice?: number;
  onCounter: (counterOffer: { counterAmount: number; counterEarnestMoney?: number; counterClosingDate?: string; counterNotes?: string }) => void;
}

const counterStrategies = [
  {
    name: 'Meet in Middle',
    description: 'Split the difference',
    calculate: (original: number, list: number) => Math.round((original + list) / 2 / 1000) * 1000,
  },
  {
    name: 'Small Concession',
    description: 'Move 2-3% closer',
    calculate: (original: number, list: number) => Math.round((list - (list - original) * 0.75) / 1000) * 1000,
  },
  {
    name: 'Firm on Price',
    description: 'Hold asking price',
    calculate: (_original: number, list: number) => list,
  },
];

export function CounterOfferModal({ open, onOpenChange, offer, listPrice, onCounter }: CounterOfferModalProps) {
  const [formData, setFormData] = useState({
    counterAmount: '',
    counterEarnestMoney: '',
    counterClosingDate: '',
    expirationDate: '',
    expirationTime: '17:00',
    counterNotes: '',
    removeContingencies: [] as string[],
    sellerConcessions: '',
  });

  useEffect(() => {
    if (offer) {
      setFormData({
        counterAmount: listPrice != null ? listPrice.toString() : offer.amount.toString(),
        counterEarnestMoney: offer.earnestMoney != null ? offer.earnestMoney.toString() : '',
        counterClosingDate: offer.closingDate ?? '',
        expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expirationTime: '17:00',
        counterNotes: '',
        removeContingencies: [],
        sellerConcessions: '',
      });
    }
  }, [offer, listPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (offer) {
      onCounter({
        counterAmount: parseFloat(formData.counterAmount),
        counterEarnestMoney: formData.counterEarnestMoney ? parseFloat(formData.counterEarnestMoney) : undefined,
        counterClosingDate: formData.counterClosingDate || undefined,
        counterNotes: formData.counterNotes || undefined,
      });
    }
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!offer) return null;

  const originalAmount = offer.amount;
  const counterAmount = parseFloat(formData.counterAmount) || 0;
  const difference = counterAmount - originalAmount;
  const percentChange = originalAmount > 0 ? ((difference / originalAmount) * 100).toFixed(2) : '0';

  const handleContingencyToggle = (contingency: string) => {
    setFormData({
      ...formData,
      removeContingencies: formData.removeContingencies.includes(contingency)
        ? formData.removeContingencies.filter(c => c !== contingency)
        : [...formData.removeContingencies, contingency]
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden z-50">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Counter Offer
                </Dialog.Title>
                <p className="text-sm text-gray-600">
                  Responding to offer from {offer.buyer}
                </p>
              </div>
            </div>
            <Dialog.Close className="p-1 hover:bg-white/50 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-140px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Original Offer Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Original Offer Summary
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Offer Amount</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(offer.amount)}</div>
                    <div className="text-xs text-gray-500">
                      {listPrice != null ? `${((offer.amount / listPrice) * 100).toFixed(1)}% of asking` : ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Earnest Money</div>
                    <div className="font-semibold text-gray-900">
                      {offer.earnestMoney ? formatCurrency(offer.earnestMoney) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Closing Date</div>
                    <div className="font-semibold text-gray-900">
                      {offer.closingDate
                        ? new Date(offer.closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Contingencies</div>
                    <div className="font-semibold text-gray-900">{offer.contingencies.length}</div>
                  </div>
                </div>
              </div>

              {/* Quick Counter Strategies — only shown when list price differs from offer */}
              {listPrice != null && listPrice !== originalAmount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Counter Strategies
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {counterStrategies.map((strategy) => {
                    const suggestedAmount = strategy.calculate(originalAmount, listPrice);
                    return (
                      <button
                        key={strategy.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, counterAmount: suggestedAmount.toString() })}
                        className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="font-medium text-gray-900 mb-1">{strategy.name}</div>
                        <div className="text-xs text-gray-600 mb-2">{strategy.description}</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(suggestedAmount)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          +{formatCurrency(suggestedAmount - originalAmount)} from offer
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-5">
                <div className="flex items-center gap-2 text-blue-800 font-medium mb-4">
                  <Calculator className="w-5 h-5" />
                  Counter Offer Details
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Original */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Original Offer</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(originalAmount)}</div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-blue-600" />
                  </div>

                  {/* Counter */}
                  <div className="bg-white rounded-lg p-4 border-2 border-blue-500">
                    <div className="text-xs text-blue-600 mb-1">Your Counter</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {counterAmount > 0 ? formatCurrency(counterAmount) : '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Counter Amount *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        required
                        value={formData.counterAmount}
                        onChange={(e) => setFormData({ ...formData, counterAmount: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="820000"
                        step="1000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Counter Earnest Money
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.counterEarnestMoney}
                        onChange={(e) => setFormData({ ...formData, counterEarnestMoney: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="30000"
                        step="1000"
                      />
                    </div>
                  </div>
                </div>

                {/* Difference Display */}
                {counterAmount > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-blue-200">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Difference</div>
                      <div className={`text-lg font-semibold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">% Change</div>
                      <div className={`text-lg font-semibold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {difference >= 0 ? '+' : ''}{percentChange}%
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">% of Asking</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {listPrice != null ? `${((counterAmount / listPrice) * 100).toFixed(1)}%` : '—'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Counter Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Counter Closing Date
                    </div>
                  </label>
                  <input
                    type="date"
                    value={formData.counterClosingDate}
                    onChange={(e) => setFormData({ ...formData, counterClosingDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Original: {offer.closingDate
                      ? new Date(offer.closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Not set'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seller Concessions (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.sellerConcessions}
                      onChange={(e) => setFormData({ ...formData, sellerConcessions: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      step="500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Amount seller will contribute to buyer costs
                  </p>
                </div>
              </div>

              {/* Contingencies to Remove */}
              {offer.contingencies.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Request Removal of Contingencies
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {offer.contingencies.map((contingency) => (
                      <button
                        key={contingency}
                        type="button"
                        onClick={() => handleContingencyToggle(contingency)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          formData.removeContingencies.includes(contingency)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            formData.removeContingencies.includes(contingency)
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-gray-300'
                          }`}>
                            {formData.removeContingencies.includes(contingency) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`font-medium text-sm ${
                            formData.removeContingencies.includes(contingency) ? 'text-orange-900' : 'text-gray-900'
                          }`}>
                            {contingency}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.removeContingencies.length === 0 ? 'All contingencies remain' : 
                     `Requesting removal of ${formData.removeContingencies.length} contingenc${formData.removeContingencies.length === 1 ? 'y' : 'ies'}`}
                  </p>
                </div>
              )}

              {/* Counter Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Counter Offer Expiration *
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      required
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      required
                      value={formData.expirationTime}
                      onChange={(e) => setFormData({ ...formData, expirationTime: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Buyer must respond by this date and time or counter becomes void
                </p>
              </div>

              {/* Counter Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Counter Offer Explanation
                </label>
                <textarea
                  value={formData.counterNotes}
                  onChange={(e) => setFormData({ ...formData, counterNotes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Explain your counter offer rationale, justification for the price, recent comps, property improvements, market conditions, etc."
                />
              </div>

              {/* Negotiation Tips */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-purple-900 mb-2">Negotiation Best Practices</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Keep counter reasonable - large gaps can end negotiations</li>
                      <li>• Consider the buyer's position and motivation level</li>
                      <li>• Justify your counter with recent comps or property improvements</li>
                      <li>• Be prepared to negotiate on non-price terms (closing date, concessions)</li>
                      <li>• Set a realistic expiration time to maintain momentum</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Important</h4>
                    <p className="text-sm text-amber-800">
                      Once submitted, this counter offer will be sent to the buyer. Consult with your seller before 
                      submitting. A counter offer rejects the original offer and creates a new binding offer if accepted.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Counter Offer
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
