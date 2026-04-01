'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Shield,
  Info,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { agentOffersApi, propertiesApi, type PropertyOfferRow, type PropertyListing, type CounterOfferPayload } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { AcceptOfferModal } from '@/components/my-listings/AcceptOfferModal';
import { CounterOfferModal } from '@/components/my-listings/CounterOfferModal';
import { RejectOfferModal } from '@/components/my-listings/RejectOfferModal';
import { ListingBreadcrumbHeader } from '@/components/my-listings/ListingBreadcrumbHeader';

function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(num);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'pending':   return { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    case 'accepted':  return { label: 'Accepted',       color: 'bg-green-100 text-green-700',  icon: CheckCircle2 };
    case 'rejected':  return { label: 'Rejected',       color: 'bg-red-100 text-red-700',      icon: XCircle };
    case 'countered': return { label: 'Countered',      color: 'bg-blue-100 text-blue-700',    icon: MessageSquare };
    case 'withdrawn': return { label: 'Withdrawn',      color: 'bg-gray-100 text-gray-700',    icon: ArrowLeft };
    default:          return { label: status,           color: 'bg-gray-100 text-gray-700',    icon: Info };
  }
}

interface OfferComparison {
  highest: number;
  average: number;
  lowest: number;
  rank: number;
  total: number;
}

function computeComparison(offers: PropertyOfferRow[], currentId: string): OfferComparison | null {
  if (offers.length === 0) return null;
  const amounts = offers.map(o => parseFloat(o.amount)).sort((a, b) => b - a);
  const current = offers.find(o => o.id === currentId);
  if (!current) return null;
  const currentAmount = parseFloat(current.amount);
  const rank = amounts.indexOf(currentAmount) + 1;
  const average = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  return {
    highest: amounts[0],
    average,
    lowest: amounts[amounts.length - 1],
    rank,
    total: amounts.length,
  };
}

export default function OfferDetailPage() {
  const { id: listingId, offerId } = useParams<{ id: string; offerId: string }>();
  const router = useRouter();
  const authToken = getAccessToken() ?? '';

  const [offer, setOffer] = useState<PropertyOfferRow | null>(null);
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [comparison, setComparison] = useState<OfferComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [showAcceptModal, setShowAcceptModal]   = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showRejectModal, setShowRejectModal]   = useState(false);

  const loadOffer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allOffers, prop] = await Promise.all([
        agentOffersApi.list(authToken, listingId),
        propertiesApi.getById(listingId, authToken).catch(() => null),
      ]);
      const found = allOffers.find(o => o.id === offerId);
      if (!found) throw new Error('Offer not found');
      setOffer(found);
      setProperty(prop);
      setComparison(computeComparison(allOffers, offerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offer');
    } finally {
      setLoading(false);
    }
  }, [authToken, listingId, offerId]);

  useEffect(() => { loadOffer(); }, [loadOffer]);

  const handleUpdateStatus = async (status: string) => {
    if (!offer) return;
    setUpdatingStatus(true);
    try {
      const updated = await agentOffersApi.updateStatus(authToken, listingId, offer.id, status);
      setOffer(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-500">Loading offer…</span>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">{error ?? 'Offer not found'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(offer.status);
  const offerAmount = parseFloat(offer.amount);
  const earnestAmount = offer.earnest_money ? parseFloat(offer.earnest_money) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ListingBreadcrumbHeader
        backHref={`/app/my-listings/${listingId}?tab=offers`}
        listingId={listingId}
        address={property?.location?.address_line1 ?? property?.title ?? null}
        listingStatus={property?.status ?? null}
        crumbs={[
          { label: 'Offers', href: `/app/my-listings/${listingId}?tab=offers` },
          { label: `Offer from ${offer.buyer_name}` },
        ]}
        titleOverride={`Offer from ${offer.buyer_name}`}
        rightSlot={
          offer.status === 'pending' ? (
            <>
              <button
                disabled={updatingStatus}
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ThumbsDown className="w-4 h-4" />
                Reject
              </button>
              <button
                disabled={updatingStatus}
                onClick={() => setShowCounterModal(true)}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                Counter
              </button>
              <button
                disabled={updatingStatus}
                onClick={() => setShowAcceptModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ThumbsUp className="w-4 h-4" />
                Accept Offer
              </button>
            </>
          ) : null
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Offer Amount Card — dark themed */}
            {(() => {
              const listPrice = property ? parseFloat(property.price) : null;
              const vsListAmount = listPrice !== null ? offerAmount - listPrice : null;
              const pctOfList = listPrice !== null ? ((offerAmount / listPrice) * 100).toFixed(2) : null;
              const daysUntilExpiration = offer.closing_date
                ? Math.ceil((new Date(offer.closing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div className="bg-gray-900 rounded-xl p-6 space-y-6">
                  {/* Top row: three metrics */}
                  <div className="grid grid-cols-3 gap-6">
                    {/* Offer Amount */}
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Offer Amount</div>
                      <div className="text-3xl font-bold text-white mb-1">
                        {formatCurrency(offerAmount)}
                      </div>
                      {vsListAmount !== null && (
                        <div className={`text-sm font-medium ${vsListAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {vsListAmount >= 0 ? '+' : ''}{formatCurrency(vsListAmount)} vs List
                        </div>
                      )}
                    </div>

                    {/* List Price */}
                    {listPrice !== null && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">List Price</div>
                        <div className="text-2xl font-semibold text-gray-200 mb-1">
                          {formatCurrency(listPrice)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Offer is {pctOfList}% of list
                        </div>
                      </div>
                    )}

                    {/* Earnest Money */}
                    {earnestAmount !== null && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Earnest Money</div>
                        <div className="text-2xl font-semibold text-gray-200 mb-1">
                          {formatCurrency(earnestAmount)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {((earnestAmount / offerAmount) * 100).toFixed(1)}% of offer
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Offer Comparison */}
                  {comparison && (
                    <>
                      <div className="border-t border-gray-700" />
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-bold text-white">Offer Comparison</h4>
                          <span className="px-3 py-1 bg-slate-700 text-blue-300 text-sm font-medium rounded-full">
                            #{comparison.rank} of {comparison.total} offers
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {/* Highest */}
                          <div className="bg-green-800 border border-green-600 rounded-lg p-4">
                            <div className="flex items-center gap-1.5 text-xs text-green-300 mb-2">
                              <TrendingUp className="w-3.5 h-3.5" />
                              Highest Offer
                            </div>
                            <div className="text-lg font-bold text-white">
                              {formatCurrency(comparison.highest)}
                            </div>
                          </div>
                          {/* Average */}
                          <div className="bg-gray-800 border border-blue-500 rounded-lg p-4">
                            <div className="text-xs text-blue-400 mb-2">Average Offer</div>
                            <div className="text-lg font-bold text-blue-300">
                              {formatCurrency(Math.round(comparison.average))}
                            </div>
                          </div>
                          {/* Lowest */}
                          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                              <TrendingDown className="w-3.5 h-3.5" />
                              Lowest Offer
                            </div>
                            <div className="text-lg font-bold text-white">
                              {formatCurrency(comparison.lowest)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Expiring Soon banner */}
                  {offer.status === 'pending' && daysUntilExpiration !== null && daysUntilExpiration <= 3 && (
                    <div className="bg-orange-950 border border-orange-700 rounded-lg p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-orange-300">Expiring Soon</div>
                        <div className="text-sm text-orange-400 mt-0.5">
                          This offer expires in {daysUntilExpiration} {daysUntilExpiration === 1 ? 'day' : 'days'} on{' '}
                          {formatDate(offer.closing_date!)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Terms */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Terms
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {offer.closing_date && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Closing Date</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {formatDate(offer.closing_date)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500 mb-1">Financing Type</div>
                  <div className="font-semibold text-gray-900 capitalize">{offer.financing}</div>
                </div>
              </div>

              {offer.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                  <p className="text-sm text-gray-800 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    {offer.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Counter Offer Details */}
            {offer.status === 'countered' && offer.counter_amount && (
              <div className="bg-white rounded-xl shadow-sm border-2 border-blue-300 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Counter Offer Sent
                  {offer.countered_at && (
                    <span className="text-sm font-normal text-gray-500 ml-auto">{formatTimestamp(offer.countered_at)}</span>
                  )}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Counter Amount</div>
                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(parseFloat(offer.counter_amount))}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      vs original {formatCurrency(parseFloat(offer.amount))}
                      {' '}({parseFloat(offer.counter_amount) >= parseFloat(offer.amount) ? '+' : ''}{formatCurrency(parseFloat(offer.counter_amount) - parseFloat(offer.amount))})
                    </div>
                  </div>
                  {offer.counter_earnest_money && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Counter Earnest Money</div>
                      <div className="text-xl font-semibold text-gray-900">{formatCurrency(parseFloat(offer.counter_earnest_money))}</div>
                    </div>
                  )}
                  {offer.counter_closing_date && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Counter Closing Date</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {formatDate(offer.counter_closing_date)}
                      </div>
                    </div>
                  )}
                </div>
                {offer.counter_notes && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Counter Notes</div>
                    <p className="text-sm text-gray-800 bg-blue-50 border border-blue-100 rounded-lg p-3 italic">
                      "{offer.counter_notes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Contingencies */}
            {offer.contingencies.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-600" />
                  Contingencies
                </h3>
                <div className="space-y-3">
                  {offer.contingencies.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-yellow-700" />
                      </div>
                      <span className="font-medium text-gray-900">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Buyer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg">
                  {offer.buyer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{offer.buyer_name}</div>
                  <div className="text-sm text-gray-500">Buyer</div>
                </div>
              </div>
            </div>

            {/* Offer Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                Offer Summary
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Amount</div>
                  <div className="font-semibold text-gray-900">{formatCurrency(offerAmount)}</div>
                </div>
                {earnestAmount !== null && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Earnest Money</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(earnestAmount)}</div>
                  </div>
                )}
                {offer.closing_date && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Closing Date</div>
                    <div className="font-semibold text-gray-900">{formatDate(offer.closing_date)}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Offer Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Offer ID</div>
                  <div className="font-medium text-gray-900 font-mono text-xs break-all">{offer.id}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Submitted</div>
                  <div className="font-medium text-gray-900">{formatTimestamp(offer.submitted_at)}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Last Updated</div>
                  <div className="font-medium text-gray-900">{formatTimestamp(offer.updated_at)}</div>
                </div>
              </div>
            </div>

            {/* Pending Actions */}
            {offer.status === 'pending' && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-orange-900 mb-1">Action Required</div>
                    <p className="text-sm text-orange-800">
                      This offer is awaiting your response. Use the buttons above to accept, counter, or reject.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AcceptOfferModal
        open={showAcceptModal}
        onOpenChange={setShowAcceptModal}
        offer={offer ? {
          id: offer.id,
          buyer: offer.buyer_name,
          amount: offerAmount,
          closingDate: offer.closing_date ?? '',
          contingencies: offer.contingencies,
          earnestMoney: earnestAmount ?? undefined,
        } : null}
        onAccept={async (_offerId) => {
          await handleUpdateStatus('accepted');
          setShowAcceptModal(false);
        }}
      />

      <CounterOfferModal
        open={showCounterModal}
        onOpenChange={setShowCounterModal}
        offer={offer ? {
          id: offer.id,
          buyer: offer.buyer_name,
          amount: offerAmount,
          earnestMoney: earnestAmount ?? 0,
          contingencies: offer.contingencies,
          closingDate: offer.closing_date ?? '',
          status: offer.status as 'pending' | 'accepted' | 'rejected' | 'countered',
          submittedDate: offer.submitted_at,
          financing: offer.financing,
          notes: offer.notes ?? '',
        } : null}
        listPrice={property ? parseFloat(property.price) : undefined}
        onCounter={async (counterData: CounterOfferPayload) => {
          if (offer) {
            const updated = await agentOffersApi.counter(authToken, listingId, offer.id, counterData);
            setOffer(updated);
          }
          setShowCounterModal(false);
        }}
      />

      <RejectOfferModal
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
        offer={offer ? {
          id: offer.id,
          buyer: offer.buyer_name,
          amount: offerAmount,
        } : null}
        onReject={async (_offerId, _reason, _notifyBuyer) => {
          await handleUpdateStatus('rejected');
          setShowRejectModal(false);
        }}
      />
    </div>
  );
}
