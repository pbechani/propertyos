'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle, XCircle, Pause, Phone, Mail, MapPin, FileText, AlertTriangle, RotateCcw } from 'lucide-react';
import { adminCompaniesApi, companiesApi } from '@/lib/api-client';
import type { CompanyDetail, CompanyDocument, CompanyAuditLogEntry } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

const CATEGORY_LABELS: Record<string, string> = {
  estate_agency: 'Estate Agency',
  contractor: 'Contractor',
  supplier: 'Supplier',
  conveyancer: 'Conveyancer',
  inspector: 'Inspector',
  developer: 'Developer',
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<CompanyAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showInvestigateModal, setShowInvestigateModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [investigateReason, setInvestigateReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) { setError('Not authenticated'); setLoading(false); return; }

      const [companyData, docs, logs] = await Promise.all([
        adminCompaniesApi.getById(token, id),
        companiesApi.getDocuments(token, id).catch(() => [] as CompanyDocument[]),
        companiesApi.getActivityLogs(token, id, 20, 0).catch(() => [] as CompanyAuditLogEntry[]),
      ]);

      setCompany(companyData);
      setDocuments(docs);
      setAuditLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      await adminCompaniesApi.verify(token, id);
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      await adminCompaniesApi.reject(token, id, rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason('');
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) return;
    setActionLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      await adminCompaniesApi.suspend(token, id, suspendReason.trim());
      setShowSuspendModal(false);
      setSuspendReason('');
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstate = async () => {
    setActionLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      await adminCompaniesApi.reinstate(token, id);
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvestigate = async () => {
    if (!investigateReason.trim()) return;
    setActionLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      await adminCompaniesApi.investigate(token, id, investigateReason.trim());
      setShowInvestigateModal(false);
      setInvestigateReason('');
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500 animate-pulse">Loading company…</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-8">
        <p className="text-gray-500">{error ?? 'Company not found.'}</p>
        <Link href="/app/admin/companies" className="text-blue-600 hover:underline mt-2 block">← Back to Companies</Link>
      </div>
    );
  }

  const isPending = company.verification_status === 'pending' || company.status === 'pending_verification';
  const isSuspended = company.status === 'suspended';
  const isUnderInvestigation = company.status === 'under_investigation';
  const isActive = company.status === 'active' && !isPending;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Link href="/app/admin/companies" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-indigo-100 flex items-center justify-center">
              {company.logo_url
                ? <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                : <Building2 className="w-7 h-7 text-indigo-600" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {CATEGORY_LABELS[company.category] ?? company.category}
                {company.registration_number ? ` · ${company.registration_number}` : ''}
                {company.address?.country ? ` · ${company.address.country}` : ''}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
            isPending ? 'bg-amber-100 text-amber-700' :
            isSuspended ? 'bg-red-100 text-red-700' :
            isUnderInvestigation ? 'bg-yellow-100 text-yellow-800' :
            company.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
            company.verification_status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {isSuspended ? 'Suspended' : isUnderInvestigation ? 'Under Investigation' : isPending ? 'Pending Approval' : company.verification_status}
          </span>
        </div>
      </div>

      {/* Suspended Banner */}
      {isSuspended && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-medium text-red-800">This company is suspended</p>
              <p className="text-sm text-red-700 mt-0.5">All users in this company are blocked from accessing the platform. All listings are hidden from buyers.</p>
            </div>
          </div>
          <button
            disabled={actionLoading}
            onClick={handleReinstate}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            <RotateCcw className="w-4 h-4" /> Reinstate Company
          </button>
        </div>
      )}

      {/* Under Investigation Banner */}
      {isUnderInvestigation && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">This company is under investigation</p>
              <p className="text-sm text-yellow-700 mt-0.5">Users can still log in and listings remain visible, but a caution badge is shown to buyers on all listings.</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              disabled={actionLoading}
              onClick={() => setShowSuspendModal(true)}
              className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Pause className="w-4 h-4" /> Suspend
            </button>
            <button
              disabled={actionLoading}
              onClick={handleReinstate}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" /> Reinstate Company
            </button>
          </div>
        </div>
      )}

      {/* Action Banner (only when pending) */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">This company is awaiting your review</p>
              <p className="text-sm text-amber-700 mt-0.5">Review the documents and company information before approving.</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              disabled={actionLoading}
              onClick={() => setShowSuspendModal(true)}
              className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Pause className="w-4 h-4" /> Suspend
            </button>
            <button
              disabled={actionLoading}
              onClick={() => setShowRejectModal(true)}
              className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button
              disabled={actionLoading}
              onClick={handleVerify}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> Approve Company
            </button>
          </div>
        </div>
      )}

      {/* Active company actions */}
      {isActive && (
        <div className="flex justify-end gap-3">
          <button
            disabled={actionLoading}
            onClick={() => setShowInvestigateModal(true)}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" /> Under Investigation
          </button>
          <button
            disabled={actionLoading}
            onClick={() => setShowSuspendModal(true)}
            className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Pause className="w-4 h-4" /> Suspend Company
          </button>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Company Details</h2>
          <div className="space-y-3 text-sm">
            {company.registration_number && (
              <div className="flex items-center gap-3 text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500 w-28 shrink-0">Registration</span>
                <span className="font-mono">{company.registration_number}</span>
              </div>
            )}
            {company.tax_number && (
              <div className="flex items-center gap-3 text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500 w-28 shrink-0">Tax Number</span>
                <span className="font-mono">{company.tax_number}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500 w-28 shrink-0">Phone</span>
                <span>{company.phone}</span>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500 w-28 shrink-0">Email</span>
                <span className="text-blue-600">{company.email}</span>
              </div>
            )}
            {(company.address?.city || company.address?.country) && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-500 w-28 shrink-0">Location</span>
                <span>
                  {[company.address?.city, company.address?.region, company.address?.country]
                    .filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Platform Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Platform Status</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-gray-500 w-32 shrink-0">Account Status</span>
              <span className="capitalize">{company.status.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-gray-500 w-32 shrink-0">Verification</span>
              <span className="capitalize">{company.verification_status.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <span className="text-gray-500 w-32 shrink-0">Registered</span>
              <span>{new Date(company.created_at).toLocaleDateString()}</span>
            </div>
            {company.website && (
              <div className="flex items-center gap-3 text-gray-700">
                <span className="text-gray-500 w-32 shrink-0">Website</span>
                <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                  {company.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submitted Documents */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Submitted Documents
            {documents.length > 0 && <span className="text-xs text-gray-400 font-normal">({documents.length})</span>}
          </h2>
        </div>
        {documents.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No documents submitted yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-800">{doc.document_name || doc.file_name}</span>
                    {doc.public_url && (
                      <a
                        href={doc.public_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-xs text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                    doc.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Activity Log</h2>
        </div>
        {auditLogs.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No activity recorded yet.</p>
        ) : (
          <div className="p-5 space-y-4">
            {auditLogs.map((entry) => {
              const actorName = [entry.first_name, entry.last_name].filter(Boolean).join(' ') || entry.email || 'System';
              return (
                <div key={entry.id} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{entry.action.replace(/_/g, ' ')}</p>
                    {entry.payload?.reason != null && (
                      <p className="text-sm text-gray-600">{String(entry.payload.reason as string)}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(entry.created_at).toLocaleString()} · {actorName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Company</h3>
            <p className="text-sm text-gray-600 mb-4">The company admin will be notified. Provide a reason to help them understand the decision.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Suspend Company</h3>
            <p className="text-sm text-gray-600 mb-4">The company and all its users will lose platform access until the suspension is lifted. All listings will be hidden from buyers.</p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowSuspendModal(false); setSuspendReason(''); }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {actionLoading ? 'Suspending…' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Under Investigation Modal */}
      {showInvestigateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Place Under Investigation</h3>
            <p className="text-sm text-gray-600 mb-4">Users can still log in and listings remain visible, but a caution badge will be shown to buyers on all listings from this company.</p>
            <textarea
              value={investigateReason}
              onChange={(e) => setInvestigateReason(e.target.value)}
              placeholder="Reason for investigation…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowInvestigateModal(false); setInvestigateReason(''); }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvestigate}
                disabled={!investigateReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
              >
                {actionLoading ? 'Processing…' : 'Confirm Investigation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
