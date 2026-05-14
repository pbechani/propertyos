'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, ArrowUpCircle, ArrowDownCircle,
  CreditCard, Loader2, RefreshCw, AlertCircle, Wallet,
} from 'lucide-react';
import { adminFinanceApi, type CompanyEscrowAccount, type AdminPendingDeposit, type EscrowReleaseRequest } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

function formatCurrency(value: number, currency = 'ZAR') {
  if (value >= 1_000_000) return `${currency} ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${currency} ${(value / 1_000).toFixed(1)}K`;
  return `${currency} ${value.toLocaleString()}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

type LedgerRow = CompanyEscrowAccount['recentTransactions'][number] & {
  accountNumber: string;
  accountCurrency: string;
};

export default function Page() {
  const [accounts, setAccounts] = useState<CompanyEscrowAccount[]>([]);
  const [deposits, setDeposits] = useState<AdminPendingDeposit[]>([]);
  const [releases, setReleases] = useState<EscrowReleaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const [accs, deps, rels] = await Promise.all([
        adminFinanceApi.getCompanyEscrowAccounts(token),
        adminFinanceApi.getPendingDeposits(token),
        adminFinanceApi.listReleases(token, 'buyer_approved'),
      ]);
      setAccounts(accs);
      setDeposits(deps);
      setReleases(rels);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  // Derived values
  const escrowPool = accounts.reduce((sum, a) => sum + a.balance, 0);
  const pendingReleaseTotal = releases.reduce((sum, r) => sum + Number(r.releaseAmount), 0);
  const txRows: LedgerRow[] = accounts.flatMap((a) =>
    a.recentTransactions.map((tx) => ({
      ...tx,
      accountNumber: a.accountNumber,
      accountCurrency: a.currency,
    })),
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-800">Failed to load finance data</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => void loadAll()}
              className="mt-3 text-sm text-red-700 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Finance</h1>
          <p className="text-gray-600 mt-1">Escrow accounts, pending activity, and transaction ledger</p>
        </div>
        <button
          onClick={() => void loadAll()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Finance stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="p-2.5 bg-blue-100 rounded-lg inline-block mb-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(escrowPool)}</p>
          <p className="text-sm text-gray-500 mt-1">Escrow Pool (Active)</p>
          <p className="text-xs text-gray-400 mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="p-2.5 bg-green-100 rounded-lg inline-block mb-3">
            <ArrowDownCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{deposits.length}</p>
          <p className="text-sm text-gray-500 mt-1">Pending Deposits</p>
          <p className="text-xs text-green-600 mt-1">Awaiting confirmation</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="p-2.5 bg-amber-100 rounded-lg inline-block mb-3">
            <ArrowUpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{releases.length}</p>
          <p className="text-sm text-gray-500 mt-1">Pending Releases</p>
          <p className="text-xs text-amber-600 mt-1">{formatCurrency(pendingReleaseTotal)} awaiting approval</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="p-2.5 bg-purple-100 rounded-lg inline-block mb-3">
            <Wallet className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{txRows.length}</p>
          <p className="text-sm text-gray-500 mt-1">Recent Ledger Entries</p>
          <p className="text-xs text-gray-400 mt-1">Across all accounts</p>
        </div>
      </div>

      {/* Revenue analytics placeholder */}
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
        <TrendingUp className="w-8 h-8 mx-auto mb-3 text-gray-400" />
        <p className="font-medium text-gray-700">Revenue Analytics</p>
        <p className="text-sm mt-1">Commission, escrow fee, and subscription breakdowns coming in Phase 2.</p>
      </div>

      {/* Pending Deposits */}
      {deposits.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="font-semibold text-gray-900">Pending Deposits ({deposits.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Account / Ref</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">Requested</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-800">{dep.account?.referenceId ?? dep.account?.id}</p>
                      <p className="text-xs text-gray-400">{dep.account?.currency ?? dep.currency}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {dep.currency} {Number(dep.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{formatDate(dep.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                        {dep.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Releases */}
      {releases.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-semibold text-gray-900">Releases Awaiting Approval ({releases.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Release ID</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Reason</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">Requested</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {releases.map((rel) => (
                  <tr key={rel.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-xs font-mono text-gray-500 truncate max-w-[140px]">{rel.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {rel.currency} {Number(rel.releaseAmount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 truncate max-w-[180px] block">{rel.reason ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{formatDate(rel.requestedAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        Buyer Approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Ledger Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Ledger Entries</h2>
          <p className="text-xs text-gray-400 mt-0.5">Latest 50 entries across all escrow accounts</p>
        </div>
        {txRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No ledger entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Description</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Account</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Amount</th>
                  <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {txRows.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {tx.entryType === 'debit' ? (
                          <ArrowUpCircle className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-800 capitalize">{tx.entryType}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700">{tx.description ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-gray-500">{tx.accountNumber}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {tx.accountCurrency} {Number(tx.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{formatDate(tx.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
