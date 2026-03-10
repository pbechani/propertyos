'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Clock, CheckCircle2, AlertCircle, Search,
  Filter, Plus, RefreshCw, TrendingUp, X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { salesApi, agentSalesApi, adminSalesApi, propertiesApi, type Sale, type PropertyListing } from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth-session';

const STAGE_NAMES: Record<number, string> = {
  1: 'Property Search & Viewing',
  2: 'Offer Submission',
  3: 'Offer Accepted / Negotiation',
  4: 'Sale Agreement (OTP)',
  5: 'Deposit & Escrow',
  6: 'Title Deed Search & Verification',
  7: 'Mortgage / Financing Approval',
  8: 'Property Inspection & Due Diligence',
  9: 'Compliance Certificates',
  10: 'Transfer Documentation',
  11: 'Deeds Office Submission',
  12: 'Transfer Duty Payment',
  13: 'Capital Gains / Income Tax Clearance',
  14: 'Deeds Office Registration',
  15: 'Final Payment & Handover',
};

function statusBadgeClass(status: Sale['status']) {
  switch (status) {
    case 'active':    return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'cancelled': return 'bg-gray-100 text-gray-600';
    case 'disputed':  return 'bg-red-100 text-red-700';
    default:          return 'bg-gray-100 text-gray-600';
  }
}

export default function SalesDashboard() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ── Initiate Sale modal ──────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalListings, setModalListings] = useState<PropertyListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [buyerId, setBuyerId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [submittingInitiate, setSubmittingInitiate] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);

  const token = getAccessToken();
  const user = getStoredUser();
  const role = user?.role?.toLowerCase() ?? '';

  useEffect(() => {
    if (!token) { router.push('/login?next=/app/sales'); return; }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: Sale[];
        if (role === 'admin') {
          data = await adminSalesApi.getSales(token);
        } else if (role === 'agent') {
          data = await agentSalesApi.getSales(token);
        } else {
          data = await salesApi.getMySales(token);
        }
        setSales(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load sales');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, role, router]);

  const openInitiateModal = async () => {
    if (!token) { router.push('/login?next=/app/sales'); return; }
    setShowModal(true);
    setInitiateError(null);
    setSelectedPropertyId('');
    setAgreedPrice('');
    setCurrency('ZAR');
    setBuyerId('');
    setDepositAmount('');
    setLoadingListings(true);
    try {
      let listings: PropertyListing[];
      if (role === 'agent') {
        const res = await propertiesApi.getMyListings(token, 'active');
        listings = res.data;
      } else {
        const res = await propertiesApi.getOwnerListings(token, 'active');
        listings = res.data;
      }
      setModalListings(listings);
    } catch {
      setModalListings([]);
    } finally {
      setLoadingListings(false);
    }
  };

  const handleInitiateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPropertyId || !agreedPrice) {
      setInitiateError('Please select a property and enter an agreed price.');
      return;
    }
    const user = getStoredUser();
    if (!user?.id) { setInitiateError('Session expired — please log in again.'); return; }
    setSubmittingInitiate(true);
    setInitiateError(null);
    try {
      const sale = await salesApi.create(token, {
        propertyId: selectedPropertyId,
        sellerId: user.id,
        buyerId: buyerId.trim() || undefined,
        agreedPrice: Number(agreedPrice),
        currency,
        ...(depositAmount ? { depositAmount: Number(depositAmount) } : {}),
      });
      setShowModal(false);
      setSales(prev => [sale, ...prev]);
      router.push(`/workspace/${sale.id}`);
    } catch (err) {
      setInitiateError(err instanceof Error ? err.message : 'Failed to initiate sale.');
    } finally {
      setSubmittingInitiate(false);
    }
  };

  const filtered = sales.filter((s) => {
    const addr = [s.property?.addressLine1, s.property?.city].filter(Boolean).join(', ').toLowerCase();
    const buyerName = s.buyer ? `${s.buyer.firstName} ${s.buyer.lastName}`.toLowerCase() : '';
    const matchesSearch = !search || addr.includes(search.toLowerCase()) || buyerName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    active: sales.filter(s => s.status === 'active').length,
    completed: sales.filter(s => s.status === 'completed').length,
    disputed: sales.filter(s => s.status === 'disputed').length,
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-gray-600 mt-1">Track all active and historical property sales.</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 w-full md:w-auto" onClick={openInitiateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Initiate Sale
          </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.active}</div>
              <div className="text-sm text-gray-600">Active Sales</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.disputed}</div>
              <div className="text-sm text-gray-600">Disputed</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by address or buyer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-3" />
          <span className="text-gray-500">Loading sales...</span>
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.refresh()}>
            Try Again
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {sales.length === 0 ? 'No Sales Yet' : 'No Results Found'}
          </h3>
          <p className="text-gray-500 text-sm">
            {sales.length === 0
              ? 'When you initiate a property sale, it will appear here.'
              : 'Try adjusting your search or filter.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sale) => {
            const ref = `TXN-${sale.id.slice(-6).toUpperCase()}`;
            const address = [sale.property?.addressLine1, sale.property?.city]
              .filter(Boolean)
              .join(', ');
            const listingName = sale.property?.title || address || 'Property Sale';

            const buyerName = sale.buyer
              ? `${sale.buyer.firstName} ${sale.buyer.lastName}`
              : 'N/A';

            const stageName = STAGE_NAMES[sale.currentStage] ?? `Stage ${sale.currentStage}`;

            return (
              <Card
                key={sale.id}
                className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/workspace/${sale.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{listingName}</div>
                      {address && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">{address}</div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-mono text-xs text-gray-400 mr-2">{ref}</span>
                        Buyer: <span className="font-medium text-gray-800">{buyerName}</span>
                        {sale.seller && (
                          <> · Seller: <span className="font-medium text-gray-800">
                            {sale.seller.firstName} {sale.seller.lastName}
                          </span></>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        {sale.currency} {sale.purchasePrice.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {stageName}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={statusBadgeClass(sale.status)}>
                        {sale.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        Stage {sale.currentStage} / 15
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>

      {/* Initiate Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Initiate a Sale</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleInitiateSale} className="p-5 space-y-4">
              {/* Property select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                {loadingListings ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading your listings…
                  </div>
                ) : modalListings.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    No active listings found. Create a listing first.
                  </p>
                ) : (
                  <select
                    value={selectedPropertyId}
                    onChange={e => {
                      setSelectedPropertyId(e.target.value);
                      const prop = modalListings.find(p => p.id === e.target.value);
                      if (prop) {
                        setAgreedPrice(prop.price);
                        setCurrency(prop.currency);
                      }
                    }}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select a property —</option>
                    {modalListings.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title}{p.location?.city ? ` · ${p.location.city}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Agreed price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Price *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={agreedPrice}
                    onChange={e => setAgreedPrice(e.target.value)}
                    required
                    placeholder="e.g. 1500000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ZAR">ZAR</option>
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                    <option value="BWP">BWP</option>
                    <option value="KES">KES</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount <span className="text-gray-400">(optional)</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buyer ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer ID <span className="text-gray-400">(optional — add later)</span></label>
                <input
                  type="text"
                  value={buyerId}
                  onChange={e => setBuyerId(e.target.value)}
                  placeholder="Buyer's user UUID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {initiateError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{initiateError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  disabled={submittingInitiate || modalListings.length === 0}
                >
                  {submittingInitiate ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submittingInitiate ? 'Creating…' : 'Initiate Sale'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
