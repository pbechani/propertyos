'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DollarSign, Clock, CheckCircle2, XCircle, RefreshCw,
  AlertTriangle, Shield, Building2, ArrowDownLeft, ChevronDown, ChevronRight,
  TrendingUp, Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  adminFinanceApi,
  type AdminPendingDeposit,
  type CompanyEscrowAccount,
} from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

export default function AdminFinanceView() {
  const token = getAccessToken();

  // ── Company escrow accounts ──────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<CompanyEscrowAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!token) return;
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const data = await adminFinanceApi.getCompanyEscrowAccounts(token);
      setAccounts(data);
    } catch (e) {
      setAccountsError(e instanceof Error ? e.message : 'Failed to load escrow accounts');
    } finally {
      setAccountsLoading(false);
    }
  }, [token]);

  // ── Pending deposits ────────────────────────────────────────────────────────
  const [deposits, setDeposits] = useState<AdminPendingDeposit[]>([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [depositsError, setDepositsError] = useState<string | null>(null);

  // Per-deposit confirm state
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  const loadDeposits = useCallback(async () => {
    if (!token) return;
    setDepositsLoading(true);
    setDepositsError(null);
    try {
      const data = await adminFinanceApi.getPendingDeposits(token);
      setDeposits(data);
    } catch (e) {
      setDepositsError(e instanceof Error ? e.message : 'Failed to load pending deposits');
    } finally {
      setDepositsLoading(false);
    }
  }, [token]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadAccounts(), loadDeposits()]);
  }, [loadAccounts, loadDeposits]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleConfirm = async (dep: AdminPendingDeposit) => {
    if (!token) return;
    setConfirmingId(dep.id);
    setConfirmError(null);
    setConfirmSuccess(null);
    try {
      await adminFinanceApi.confirmDeposit(token, { paymentRequestId: dep.id });
      setConfirmSuccess(dep.id);
      await Promise.all([loadDeposits(), loadAccounts()]);
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : 'Confirmation failed');
    } finally {
      setConfirmingId(null);
    }
  };

  const totalEscrow = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const isLoading = accountsLoading || depositsLoading;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Escrow &amp; Finance</h1>
            <p className="text-sm text-gray-500">Manage escrow accounts, deposits, and release approvals</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-linear-to-br from-blue-600 to-blue-700 text-white border-0 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-white/80" />
            <span className="text-xs font-medium text-white/80">Total Escrow</span>
          </div>
          <div className="text-2xl font-bold">
            {accountsLoading ? '—' : totalEscrow.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-white/60 mt-1">across all accounts</div>
        </Card>
        <Card className="p-5 bg-linear-to-br from-green-500 to-green-600 text-white border-0">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-white/80" />
            <span className="text-xs font-medium text-white/80">Escrow Accounts</span>
          </div>
          <div className="text-3xl font-bold">{accountsLoading ? '—' : accounts.length}</div>
        </Card>
        <Card className="p-5 bg-linear-to-br from-amber-500 to-amber-600 text-white border-0">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-white/80" />
            <span className="text-xs font-medium text-white/80">Pending Deposits</span>
          </div>
          <div className="text-3xl font-bold">{depositsLoading ? '—' : deposits.length}</div>
        </Card>
        <Card className="p-5 bg-linear-to-br from-purple-500 to-purple-600 text-white border-0">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownLeft className="w-5 h-5 text-white/80" />
            <span className="text-xs font-medium text-white/80">Pending Value</span>
          </div>
          <div className="text-3xl font-bold">
            {depositsLoading ? '—' : deposits.reduce((s, d) => s + Number(d.amount), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </Card>
      </div>

      {/* ── Escrow Accounts ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Company Escrow Accounts
        </h2>

        {accountsError && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {accountsError}
          </div>
        )}

        {accountsLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading accounts…
          </div>
        ) : accounts.length === 0 ? (
          <Card className="p-10 text-center text-gray-500">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium">No escrow accounts found</p>
            <p className="text-sm text-gray-400 mt-1">Escrow accounts are created when a purchase deposit is initiated.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map(acc => {
              const isExpanded = expandedAccountId === acc.id;
              return (
                <Card key={acc.id} className="overflow-hidden">
                  <button
                    className="w-full p-5 flex flex-col sm:flex-row sm:items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedAccountId(isExpanded ? null : acc.id)}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {acc.currency} {Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <Badge className={`text-xs ${acc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {acc.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="font-mono">{acc.accountNumber}</span>
                        {acc.referenceId && (
                          <span>Sale: <span className="font-mono">{acc.referenceId.slice(0, 8)}…</span></span>
                        )}
                        <span>{new Date(acc.createdAt).toLocaleDateString()}</span>
                        <span className="text-gray-400">{acc.recentTransactions.length} recent txns</span>
                      </div>
                    </div>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {acc.recentTransactions.length === 0 ? (
                        <p className="text-sm text-gray-400 p-5 text-center">No ledger entries yet.</p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {acc.recentTransactions.map(tx => {
                            const isCredit = tx.creditAccountId === acc.id;
                            return (
                              <div key={tx.id} className="px-5 py-3 flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-100' : 'bg-red-50'}`}>
                                  {isCredit
                                    ? <ArrowDownLeft className="w-3.5 h-3.5 text-green-600" />
                                    : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${isCredit ? 'text-green-700' : 'text-red-600'}`}>
                                      {isCredit ? '+' : '−'}{tx.currency} {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                    <Badge className="bg-gray-100 text-gray-500 text-xs">{tx.entryType.replace(/_/g, ' ')}</Badge>
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">{tx.description ?? '—'}</p>
                                </div>
                                <span className="text-xs text-gray-400 shrink-0">
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Pending Deposits ── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Pending Deposit Confirmations
        </h2>

        {depositsError && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {depositsError}
          </div>
        )}

        {confirmSuccess && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Deposit confirmed successfully.
          </div>
        )}

        {confirmError && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
            <XCircle className="w-4 h-4 shrink-0" />
            {confirmError}
          </div>
        )}

        {depositsLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading…
          </div>
        ) : deposits.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="font-medium">No pending deposits</p>
            <p className="text-sm text-gray-400 mt-1">All escrow deposits have been confirmed.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {deposits.map(dep => (
              <Card key={dep.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 border-l-amber-400">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {dep.currency} {Number(dep.amount).toLocaleString()}
                    </span>
                    <Badge className="bg-amber-100 text-amber-700 text-xs">{dep.status}</Badge>
                    {dep.paymentMethod && (
                      <Badge className="bg-gray-100 text-gray-600 text-xs">
                        {dep.paymentMethod.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Account: <span className="font-mono">{dep.account.id.slice(0, 8)}…</span>
                    </span>
                    {dep.account.referenceId && (
                      <span>Sale: <span className="font-mono">{dep.account.referenceId.slice(0, 8)}…</span></span>
                    )}
                    <span>{new Date(dep.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">ID: {dep.id}</div>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 bg-green-600 hover:bg-green-700 text-white"
                  disabled={confirmingId === dep.id}
                  onClick={() => handleConfirm(dep)}
                >
                  {confirmingId === dep.id
                    ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Confirming…</>
                    : <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Confirm</>
                  }
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
