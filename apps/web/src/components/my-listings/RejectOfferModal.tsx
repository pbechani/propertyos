import { X, XCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface RejectOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: {
    id: string;
    buyer: string;
    amount: number;
  } | null;
  onReject?: (offerId: string, reason: string, notifyBuyer: boolean) => void;
}

export function RejectOfferModal({ open, onOpenChange, offer, onReject }: RejectOfferModalProps) {
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [notifyBuyer, setNotifyBuyer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !offer) return null;

  const predefinedReasons = [
    'Price is below acceptable range',
    'Terms are not favorable',
    'Accepted another offer',
    'Too many contingencies',
    'Financing concerns',
    'Closing date doesn\'t work',
    'Other',
  ];

  const handleReject = async () => {
    if (!selectedReason && !reason) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalReason = selectedReason === 'Other' ? reason : selectedReason || reason;
    
    if (onReject) {
      onReject(offer.id, finalReason, notifyBuyer);
    }
    
    // Reset state
    setReason('');
    setSelectedReason('');
    setNotifyBuyer(true);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Reject Offer</h2>
                <p className="text-sm text-gray-600">Decline this offer with a reason</p>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">You're about to reject this offer</h3>
                <div className="text-sm text-red-800 space-y-1">
                  <div><strong>Buyer:</strong> {offer.buyer}</div>
                  <div><strong>Offer Amount:</strong> {formatCurrency(offer.amount)}</div>
                </div>
                <p className="text-sm text-red-800 mt-3">
                  This action cannot be undone. The buyer will be notified of the rejection.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Reason for Rejection *
            </label>
            <div className="space-y-2">
              {predefinedReasons.map((reasonOption) => (
                <label
                  key={reasonOption}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedReason === reasonOption
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reasonOption}
                    checked={selectedReason === reasonOption}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-900">{reasonOption}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          {selectedReason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify the reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Provide details about why you're rejecting this offer..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Additional Notes */}
          {selectedReason && selectedReason !== 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Add any additional context or notes..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Notification Options */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Notification Settings</h4>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyBuyer}
                onChange={(e) => setNotifyBuyer(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  Send rejection notification to buyer's agent
                </div>
                <div className="text-sm text-gray-600">
                  The buyer's agent will receive an email notification that the offer has been rejected{notifyBuyer && ' along with the reason provided'}.
                </div>
              </div>
            </label>
          </div>

          {/* Professional Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Professional Tip</h4>
            <p className="text-sm text-blue-800">
              Consider providing constructive feedback when rejecting an offer. This maintains good relationships with other agents and may encourage buyers to submit improved offers in the future.
            </p>
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
              onClick={handleReject}
              disabled={!selectedReason || (selectedReason === 'Other' && !reason.trim()) || isSubmitting}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Reject Offer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
