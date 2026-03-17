'use client';

import { X, DollarSign, User, Calendar, FileText, TrendingUp, CheckSquare, AlertCircle, Calculator } from 'lucide-react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface AddOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listPrice?: number;
  onAdd?: (offer: any) => void;
}

const financingOptions = [
  { value: 'cash', label: 'Cash Offer', icon: '💵', description: 'No financing contingency' },
  { value: 'conventional', label: 'Conventional', icon: '🏦', description: 'Traditional bank loan' },
  { value: 'fha', label: 'FHA Loan', icon: '🏘️', description: 'Federal Housing Administration' },
  { value: 'va', label: 'VA Loan', icon: '🎖️', description: 'Veterans Affairs' },
  { value: 'usda', label: 'USDA Loan', icon: '🌾', description: 'Rural development' },
  { value: 'other', label: 'Other', icon: '📋', description: 'Other financing type' },
];

const commonContingencies = [
  { id: 'financing', label: 'Financing', description: 'Subject to buyer obtaining financing' },
  { id: 'inspection', label: 'Inspection', description: 'Subject to satisfactory home inspection' },
  { id: 'appraisal', label: 'Appraisal', description: 'Property must appraise at offer amount' },
  { id: 'sale', label: 'Sale of Current Home', description: 'Buyer must sell existing property' },
  { id: 'title', label: 'Title Review', description: 'Clear title must be provided' },
  { id: 'hoa', label: 'HOA Review', description: 'Review of HOA documents' },
];

export function AddOfferModal({ open, onOpenChange, listPrice = 825000, onAdd }: AddOfferModalProps) {
  const [formData, setFormData] = useState({
    buyer: '',
    amount: '',
    earnestMoney: '',
    financing: 'conventional',
    contingencies: [] as string[],
    closingDate: '',
    notes: '',
  });

  const offerAmount = parseFloat(formData.amount) || 0;
  const percentOfAsking = listPrice > 0 ? ((offerAmount / listPrice) * 100).toFixed(2) : '0';
  const differenceFromAsking = offerAmount - listPrice;

  const handleContingencyToggle = (contingencyId: string) => {
    setFormData({
      ...formData,
      contingencies: formData.contingencies.includes(contingencyId)
        ? formData.contingencies.filter(c => c !== contingencyId)
        : [...formData.contingencies, contingencyId]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAdd) {
      onAdd({
        ...formData,
        amount: parseFloat(formData.amount),
        earnestMoney: parseFloat(formData.earnestMoney),
        status: 'pending',
        submittedDate: new Date().toISOString().split('T')[0],
      });
    }
    onOpenChange(false);
    // Reset form
    setFormData({
      buyer: '',
      amount: '',
      earnestMoney: '',
      financing: 'conventional',
      contingencies: [],
      closingDate: '',
      notes: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-50">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Add New Offer
                </Dialog.Title>
                <p className="text-sm text-gray-600">
                  List Price: <span className="font-semibold">{formatCurrency(listPrice)}</span>
                </p>
              </div>
            </div>
            <Dialog.Close className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-140px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Buyer Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Buyer Name *
                  </div>
                </label>
                <input
                  type="text"
                  required
                  value={formData.buyer}
                  onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Jennifer Martinez or Martinez Family Trust"
                />
              </div>

              {/* Offer Amount Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-2 text-green-800 font-medium">
                  <Calculator className="w-5 h-5" />
                  Offer Amount
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offer Amount *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="810000"
                        step="1000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Earnest Money Deposit *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        required
                        value={formData.earnestMoney}
                        onChange={(e) => setFormData({ ...formData, earnestMoney: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="25000"
                        step="1000"
                      />
                    </div>
                  </div>
                </div>

                {/* Offer Analysis */}
                {offerAmount > 0 && (
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-green-200">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">% of Asking</div>
                      <div className={`text-lg font-semibold ${
                        parseFloat(percentOfAsking) >= 100 ? 'text-green-600' : 
                        parseFloat(percentOfAsking) >= 95 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {percentOfAsking}%
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Difference</div>
                      <div className={`text-lg font-semibold ${
                        differenceFromAsking >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {differenceFromAsking >= 0 ? '+' : ''}{formatCurrency(differenceFromAsking)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Earnest %</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {((parseFloat(formData.earnestMoney || '0') / offerAmount) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Financing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Financing Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {financingOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, financing: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.financing === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{option.icon}</span>
                        <span className={`font-medium text-sm ${
                          formData.financing === option.value ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Closing Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Proposed Closing Date *
                  </div>
                </label>
                <input
                  type="date"
                  required
                  value={formData.closingDate}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
                {formData.closingDate && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    {Math.ceil((new Date(formData.closingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from today
                  </p>
                )}
              </div>

              {/* Contingencies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Contingencies
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {commonContingencies.map((contingency) => (
                    <button
                      key={contingency.id}
                      type="button"
                      onClick={() => handleContingencyToggle(contingency.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.contingencies.includes(contingency.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          formData.contingencies.includes(contingency.id)
                            ? 'bg-orange-500 border-orange-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.contingencies.includes(contingency.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium text-sm ${
                            formData.contingencies.includes(contingency.id) ? 'text-orange-900' : 'text-gray-900'
                          }`}>
                            {contingency.label}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">{contingency.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.contingencies.length === 0 ? 'No contingencies selected - this is a stronger offer' : 
                   `${formData.contingencies.length} contingenc${formData.contingencies.length === 1 ? 'y' : 'ies'} selected`}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Additional Notes
                  </div>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add any additional details about this offer, buyer's situation, pre-approval status, motivation, special requests, etc."
                />
              </div>

              {/* Offer Strength Indicator */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Offer Strength Assessment</h4>
                    <div className="space-y-1.5 text-sm text-blue-800">
                      {parseFloat(percentOfAsking) >= 100 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>At or above asking price</span>
                        </div>
                      )}
                      {formData.financing === 'cash' && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Cash offer - no financing contingency</span>
                        </div>
                      )}
                      {formData.contingencies.length <= 2 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Few contingencies - cleaner offer</span>
                        </div>
                      )}
                      {parseFloat(formData.earnestMoney || '0') / offerAmount >= 0.03 && offerAmount > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Strong earnest money deposit (3%+)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Important Reminders</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Verify buyer's pre-approval letter before presenting offer</li>
                      <li>• Review all contingency timelines and deadlines</li>
                      <li>• Confirm proof of funds for earnest money deposit</li>
                      <li>• Consult with seller before accepting or countering</li>
                    </ul>
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
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Add Offer
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
