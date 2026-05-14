'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Users, Building2, ShieldCheck, DollarSign, TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle, Activity, ShieldAlert } from 'lucide-react';
import {
  adminStatsApi,
  adminCompaniesApi,
  adminKycApi,
  adminFraudApi,
  auditApi,
  type PlatformStats,
  type AdminCompany,
  type KycRecord,
  type AuditLogEntry,
} from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

function docsCount(kyc: KycRecord): number {
  return [kyc.idDocumentUrl, kyc.addressProofUrl, kyc.businessRegistrationUrl, kyc.selfieUrl].filter(Boolean).length;
}

export default function Page() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pendingCompanies, setPendingCompanies] = useState<AdminCompany[]>([]);
  const [kycQueue, setKycQueue] = useState<KycRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pendingFraudCount, setPendingFraudCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    try {
      const [statsData, companiesData, kycData, logsData, fraudData] = await Promise.all([
        adminStatsApi.get(token),
        adminCompaniesApi.list(token, { status: 'pending_verification', limit: 4 }),
        adminKycApi.listPending(token, 4),
        auditApi.getAdminLogs(token, { limit: 5 }),
        adminFraudApi.list(token, { status: 'submitted', limit: 1 }),
      ]);
      setStats(statsData);
      setPendingCompanies(companiesData.data);
      setKycQueue(kycData);
      setAuditLogs(logsData);
      setPendingFraudCount(fraudData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-600 mt-1">System health, pending approvals, and platform activity</p>
        </div>
        <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Platform Admin
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '—' : (stats?.totalUsers ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total Users</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '—' : stats?.activeCompanies ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Active Companies</p>
          <p className="text-xs text-gray-400 mt-1">Verified &amp; onboarded</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm bg-amber-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            {!loading && (stats?.pendingCompanies ?? 0) > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {loading ? '—' : stats?.pendingCompanies ?? 0}
          </p>
          <p className="text-sm text-gray-600 mt-1">Companies Pending</p>
          <Link href="/app/admin/companies" className="text-xs text-amber-600 hover:underline mt-1 block">Review now →</Link>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm bg-amber-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
            {!loading && (stats?.kycPendingCount ?? 0) > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {loading ? '—' : stats?.kycPendingCount ?? 0}
          </p>
          <p className="text-sm text-gray-600 mt-1">KYC Queue</p>
          <Link href="/app/admin/kyc" className="text-xs text-purple-600 hover:underline mt-1 block">Review queue →</Link>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="p-2.5 bg-green-100 rounded-lg inline-block mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">—</p>
          <p className="text-sm text-gray-500 mt-1">Revenue This Month</p>
          <Link href="/app/admin/finance" className="text-xs text-blue-600 hover:underline mt-1 block">View Finance →</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="p-2.5 bg-blue-100 rounded-lg inline-block mb-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">—</p>
          <p className="text-sm text-gray-500 mt-1">Escrow Pool</p>
          <Link href="/app/admin/finance" className="text-xs text-blue-600 hover:underline mt-1 block">View Finance →</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="p-2.5 bg-indigo-100 rounded-lg inline-block mb-3">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '—' : stats?.activeListings ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Active Listings</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="p-2.5 bg-pink-100 rounded-lg inline-block mb-3">
            <Activity className="w-5 h-5 text-pink-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '—' : stats?.activeSales ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Active Sales</p>
        </div>
      </div>

      {/* Fraud Reports Quick-Access */}
      <div className={`rounded-xl border p-5 shadow-sm flex items-center justify-between ${(pendingFraudCount ?? 0) > 0 ? 'bg-red-50/40 border-red-200' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${(pendingFraudCount ?? 0) > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
            <ShieldAlert className={`w-6 h-6 ${(pendingFraudCount ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {loading ? '…' : pendingFraudCount === null ? '—' : pendingFraudCount > 0 ? `${pendingFraudCount} Fraud Report${pendingFraudCount !== 1 ? 's' : ''} Awaiting Review` : 'No Pending Fraud Reports'}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">Property fraud reports submitted by users</p>
          </div>
        </div>
        <Link
          href="/app/admin/fraud-reports"
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${(pendingFraudCount ?? 0) > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          View Reports →
        </Link>
      </div>

      {/* Needs Attention + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Company Approvals */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Pending Company Approvals</h2>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                {stats?.pendingCompanies ?? pendingCompanies.length}
              </span>
            </div>
            <Link href="/app/admin/companies" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <p className="p-4 text-sm text-gray-400">Loading…</p>
            ) : pendingCompanies.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">No pending approvals</p>
            ) : (
              pendingCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`/app/admin/companies/${company.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {company.category.replace(/_/g, ' ')}
                      {company.address?.city ? ` · ${company.address.city}` : ''}
                      {' · submitted '}
                      {new Date(company.created_at).toLocaleDateString('en-ZA', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Pending</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* KYC Queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold text-gray-900">KYC Awaiting Review</h2>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                {stats?.kycPendingCount ?? kycQueue.length}
              </span>
            </div>
            <Link href="/app/admin/kyc" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <p className="p-4 text-sm text-gray-400">Loading…</p>
            ) : kycQueue.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">No pending KYC submissions</p>
            ) : (
              kycQueue.map((kyc) => {
                const name = [kyc.user?.firstName, kyc.user?.lastName].filter(Boolean).join(' ') || kyc.userId;
                const role = kyc.user?.role?.replace(/_/g, ' ') ?? '';
                return (
                  <div key={kyc.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">
                        {role}
                        {role ? ' · ' : ''}
                        {docsCount(kyc)} doc{docsCount(kyc) !== 1 ? 's' : ''} submitted
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      kyc.status === 'under_review' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {kyc.status === 'under_review' ? 'In Review' : 'Pending'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Recent Admin Activity</h2>
          </div>
          <Link href="/app/admin/audit" className="text-sm text-blue-600 hover:underline">View full log</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <p className="p-4 text-sm text-gray-400">Loading…</p>
          ) : auditLogs.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No recent activity</p>
          ) : (
            auditLogs.map((log) => {
              const isGood = log.action === 'verify' || log.action === 'approve';
              const isBad = log.action === 'reject' || log.action === 'suspend';
              return (
                <div key={log.id} className="flex items-center gap-4 p-4">
                  <div className={`p-2 rounded-full ${isGood ? 'bg-green-100' : isBad ? 'bg-red-100' : 'bg-gray-100'}`}>
                    {isGood ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : isBad ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Activity className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {log.action}{' '}
                      <span className="text-gray-600">{log.resourceType}</span>
                      {log.resourceId ? ` — ${log.resourceId}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' })}
                      {log.ipAddress ? ` · ${log.ipAddress}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 hidden md:block font-mono">{log.id.slice(0, 8)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
