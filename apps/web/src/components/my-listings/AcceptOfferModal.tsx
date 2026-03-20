import { X, CheckCircle2, AlertTriangle, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { useState } from 'react';

interface AcceptOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: {
    id: string;
    buyer: string;
    amount: number;
    closingDate: string;
    contingencies?: string[];
    earnestMoney?: number;
  } | null;
  onAccept?: (offerId: string, notes: string) => void;
}

export function AcceptOfferModal({ open, onOpenChange, offer, onAccept }: AcceptOfferModalProps) {
  const [notes, setNotes] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !offer) return null;

  const handleAccept = async () => {
    if (!confirmChecked) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onAccept) {
      onAccept(offer.id, notes);
    }
    
    // Reset state
    setNotes('');
    setConfirmChecked(false);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Accept Offer</h2>
                <p className="text-sm text-gray-600">Review and confirm acceptance</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Offer Summary */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">You're about to accept this offer</h3>
                <p className="text-sm text-green-800">
                  This will create a binding contract. Please review all details carefully.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  Offer Amount
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(offer.amount)}
                </div>
                {offer.earnestMoney && (
                  <div className="text-xs text-gray-600 mt-1">
                    Earnest: {formatCurrency(offer.earnestMoney)}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <User className="w-4 h-4" />
                  Buyer
                </div>
                <div className="font-semibold text-gray-900">
                  {offer.buyer}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Close: {formatDate(offer.closingDate)}
                </div>
              </div>
            </div>

            {offer.contingencies && offer.contingencies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="text-sm font-medium text-green-900 mb-2">Active Contingencies:</div>
                <div className="flex flex-wrap gap-2">
                  {offer.contingencies.map((contingency, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-300 rounded-full text-xs font-medium"
                    >
                      {contingency}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Important Information */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-2">Important Information</h4>
                <ul className="text-sm text-orange-800 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>Accepting this offer creates a legally binding purchase agreement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>All other pending offers will be automatically rejected</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>The buyer will be notified immediately via email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>You'll proceed to escrow and begin the closing process</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add any internal notes about accepting this offer (not visible to buyer)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes are for internal record-keeping only
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  I confirm that I have reviewed all offer details
                </div>
                <div className="text-sm text-gray-600">
                  I understand that accepting this offer creates a binding contract and I have the authority to accept this offer on behalf of the seller.
                </div>
              </div>
            </label>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps After Acceptance</h4>
                <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                  <li>Buyer and agent will be notified immediately</li>
                  <li>Earnest money deposit will be submitted to escrow</li>
                  <li>Contingency periods begin (inspection, financing, etc.)</li>
                  <li>Title work and escrow process begins</li>
                  <li>Property is marked as "Under Contract" on MLS</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!confirmChecked || isSubmitting}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Accept Offer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
