'use client';

import { DollarSign, Calendar, FileText, AlertCircle, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AddOfferModal } from './AddOfferModal';
import { CounterOfferModal } from './CounterOfferModal';
import { agentOffersApi, type PropertyOfferRow } from '@/lib/api-client';

interface Props { propertyId: string; authToken: string; }

export function Offers({ propertyId, authToken }: Props) {
  const [offers, setOffers] = useState<PropertyOfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOfferModalOpen, setIsAddOfferModalOpen] = useState(false);
  const [isCounterOfferModalOpen, setIsCounterOfferModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PropertyOfferRow | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agentOffersApi.list(authToken, propertyId);
      setOffers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [authToken, propertyId]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  const handleAddOffer = async (formData: {
    buyer: string;
    amount: number;
    earnestMoney: number;
    financing: string;
    contingencies: string[];
    closingDate: string;
    notes: string;
  }) => {
    try {
      await agentOffersApi.create(authToken, propertyId, {
        buyerName: formData.buyer,
        amount: formData.amount,
        earnestMoney: formData.earnestMoney || undefined,
        financing: formData.financing,
        contingencies: formData.contingencies,
        closingDate: formData.closingDate || undefined,
        notes: formData.notes || undefined,
      });
      await loadOffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add offer');
    }
  };

  const handleUpdateStatus = async (offerId: string, status: string) => {
    setUpdatingId(offerId);
    try {
      await agentOffersApi.updateStatus(authToken, propertyId, offerId, status);
      await loadOffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':  return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':  return 'bg-red-100 text-red-800 border-red-200';
      case 'countered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
      default:          return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-500">Loading offers…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Offers</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          onClick={() => setIsAddOfferModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Offer
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-700 mb-1">Total Offers</div>
          <div className="text-2xl font-semibold text-blue-600">{offers.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-700 mb-1">Highest Offer</div>
          <div className="text-2xl font-semibold text-green-600">
            {offers.length > 0 ? formatCurrency(Math.max(...offers.map(o => parseFloat(o.amount)))) : '—'}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-700 mb-1">Pending Review</div>
          <div className="text-2xl font-semibold text-yellow-600">
            {offers.filter(o => o.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {offers.map((offer) => (
          <div key={offer.id} className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{offer.buyer_name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Submitted {new Date(offer.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded border text-sm font-medium ${getStatusColor(offer.status)}`}>
                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    Offer Amount
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">{formatCurrency(offer.amount)}</div>
                </div>
                <div className="space-y-2">
                  {offer.earnest_money && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Earnest Money:</span>
                      <span className="font-medium">{formatCurrency(offer.earnest_money)}</span>
                    </div>
                  )}
                  {offer.closing_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Closing Date:</span>
                      <span className="font-medium">
                        {new Date(offer.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Financing:</span>
                    <span className="font-medium capitalize">{offer.financing}</span>
                  </div>
                </div>
              </div>

              {offer.contingencies.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Contingencies:</div>
                  <div className="flex flex-wrap gap-2">
                    {offer.contingencies.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {offer.notes && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-900">{offer.notes}</p>
                  </div>
                </div>
              )}

              {offer.status === 'pending' && (
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleUpdateStatus(offer.id, 'accepted')}
                    disabled={updatingId === offer.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept Offer
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    onClick={() => { setSelectedOffer(offer); setIsCounterOfferModalOpen(true); }}
                  >
                    Counter Offer
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(offer.id, 'rejected')}
                    disabled={updatingId === offer.id}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {offers.length === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No offers received yet</p>
          <p className="text-sm text-gray-500 mt-1">Click "Add Offer" to record a buyer's offer</p>
        </div>
      )}

      <AddOfferModal
        open={isAddOfferModalOpen}
        onOpenChange={setIsAddOfferModalOpen}
        onAdd={handleAddOffer}
      />

      <CounterOfferModal
        open={isCounterOfferModalOpen}
        onOpenChange={setIsCounterOfferModalOpen}
        offer={selectedOffer as any}
      />
    </div>
  );
}

