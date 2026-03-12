'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Search, CheckCircle, XCircle, Eye, FileText,
  AlertCircle, RefreshCw, X, ExternalLink, Loader2, Camera,
} from 'lucide-react';
import { adminKycApi, type KycRecord, type KycDocumentType } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  under_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const DOC_LABELS: Record<KycDocumentType, string> = {
  id_document: 'ID Document',
  address_proof: 'Address Proof',
  business_registration: 'Business Registration',
  selfie: 'Selfie / Photo',
};

type DocState = { url: string | null; loading: boolean; error: string | null };

const DOC_FIELDS: Array<{ type: KycDocumentType; field: keyof KycRecord }> = [
  { type: 'id_document', field: 'idDocumentUrl' },
  { type: 'address_proof', field: 'addressProofUrl' },
  { type: 'business_registration', field: 'businessRegistrationUrl' },
  { type: 'selfie', field: 'selfieUrl' },
];

export default function Page() {
  const [records, setRecords] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'under_review' | 'approved' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Review panel
  const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
  const [docStates, setDocStates] = useState<Partial<Record<KycDocumentType, DocState>>>({});
  const [panelRejectMode, setPanelRejectMode] = useState(false);
  const [panelRejectReason, setPanelRejectReason] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Authentication required. Please sign in again.');
        return;
      }
      const data = await adminKycApi.list(token, { limit: 200 });
      setRecords(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KYC records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Fetch signed document URLs whenever the panel opens
  useEffect(() => {
    if (!selectedRecord) {
      setDocStates({});
      setPanelRejectMode(false);
      setPanelRejectReason('');
      return;
    }

    const available = DOC_FIELDS.filter(({ field }) => !!selectedRecord[field]);

    // Initialise all to loading
    const initial: Partial<Record<KycDocumentType, DocState>> = {};
    for (const { type } of available) {
      initial[type] = { url: null, loading: true, error: null };
    }
    setDocStates(initial);

    const fetchDocs = async () => {
      const token = await getAccessToken();
      if (!token) return;
      await Promise.all(
        available.map(async ({ type }) => {
          try {
            const resp = await adminKycApi.getDocumentDownloadUrl(token, selectedRecord.id, type);
            setDocStates(prev => ({ ...prev, [type]: { url: resp.downloadUrl, loading: false, error: null } }));
          } catch {
            setDocStates(prev => ({ ...prev, [type]: { url: null, loading: false, error: 'Failed to load' } }));
          }
        }),
      );
    };

    fetchDocs();
  }, [selectedRecord]);

  const handleApprove = async (id: string) => {
    const token = await getAccessToken();
    if (!token) return;
    setActionLoading(true);
    try {
      await adminKycApi.approve(token, id);
      setSelectedRecord(null);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (id: string) => {
    const token = await getAccessToken();
    if (!token) return;
    setActionLoading(true);
    try {
      await adminKycApi.reject(token, id, panelRejectReason || undefined);
      setSelectedRecord(null);
      setPanelRejectMode(false);
      setPanelRejectReason('');
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = records.filter((k) => {
    const name = `${k.user?.firstName ?? ''} ${k.user?.lastName ?? ''}`.trim();
    const email = k.user?.email ?? '';
    const matchesSearch =
      search === '' ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      (k.idDocumentType ?? '').toLowerCase().includes(search.toLowerCase());

    if (tab === 'pending') return matchesSearch && k.status === 'pending';
    if (tab === 'under_review') return matchesSearch && k.status === 'under_review';
    if (tab === 'approved') return matchesSearch && k.status === 'approved';
    return matchesSearch;
  });

  const countByStatus = (s: string) => records.filter((k) => k.status === s).length;

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: countByStatus('pending') },
    { key: 'under_review' as const, label: 'In Review', count: countByStatus('under_review') },
    { key: 'approved' as const, label: 'Approved', count: countByStatus('approved') },
    { key: 'all' as const, label: 'All', count: records.length },
  ];

  const canAction =
    selectedRecord?.status === 'pending' || selectedRecord?.status === 'under_review';

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">KYC Queue</h1>
        <p className="text-gray-600 mt-1">Review and approve identity verification submissions from users</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-medium">Failed to load KYC records</p>
            <p className="mt-0.5 text-red-600">{error}</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`p-4 rounded-xl border text-left transition-all ${
              tab === t.key ? 'border-purple-300 bg-purple-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className={`text-2xl font-bold ${tab === t.key ? 'text-purple-700' : 'text-gray-900'}`}>{t.count}</p>
            <p className="text-sm text-gray-500 mt-1">{t.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email or doc type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">User</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden md:table-cell">Doc Type</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden lg:table-cell">Submitted</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5 hidden lg:table-cell">Docs</th>
              <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Status</th>
              <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wide px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No KYC submissions found
                </td>
              </tr>
            ) : filtered.map((item) => {
              const fullName = `${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`.trim() || item.userId;
              const email = item.user?.email ?? '';
              const initial = fullName.charAt(0).toUpperCase();
              const submittedAt = item.submittedAt
                ? new Date(item.submittedAt).toLocaleDateString()
                : '—';

              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-purple-600">{initial}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                        <p className="text-xs text-gray-400">{email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-700 capitalize">{(item.idDocumentType ?? '—').replace('_', ' ')}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-sm text-gray-600">{submittedAt}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      {item.docsCount ?? 0}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setSelectedRecord(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filtered.length} of {records.length} submissions
      </div>

      {/* ── Review slide-over panel ───────────────────────────────────────── */}
      {selectedRecord && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => { if (!actionLoading) setSelectedRecord(null); }}
          />

          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-[560px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col">

            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">KYC Review</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {`${selectedRecord.user?.firstName ?? ''} ${selectedRecord.user?.lastName ?? ''}`.trim() || selectedRecord.userId}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[selectedRecord.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[selectedRecord.status] ?? selectedRecord.status}
                </span>
                <button
                  onClick={() => { if (!actionLoading) setSelectedRecord(null); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Applicant */}
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Applicant</p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  {selectedRecord.user?.email && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Email</span>
                      <span className="text-gray-900 font-medium">{selectedRecord.user.email}</span>
                    </div>
                  )}
                  {selectedRecord.user?.phone && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Phone</span>
                      <span className="text-gray-900 font-medium">{selectedRecord.user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">User ID</span>
                    <span className="text-gray-400 font-mono text-xs break-all">{selectedRecord.userId}</span>
                  </div>
                </div>
              </section>

              {/* Submission */}
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Submission</p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Document type</span>
                    <span className="text-gray-900 capitalize">{(selectedRecord.idDocumentType ?? '—').replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Submitted</span>
                    <span className="text-gray-900">
                      {selectedRecord.submittedAt ? new Date(selectedRecord.submittedAt).toLocaleString() : '—'}
                    </span>
                  </div>
                  {selectedRecord.reviewedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last reviewed</span>
                      <span className="text-gray-900">{new Date(selectedRecord.reviewedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedRecord.reviewerNotes && (
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1.5">Reviewer notes</p>
                      <p className="text-sm text-gray-700 italic">{selectedRecord.reviewerNotes}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Documents */}
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Documents</p>
                {DOC_FIELDS.every(({ field }) => !selectedRecord[field]) ? (
                  <p className="text-sm text-gray-400">No documents uploaded.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {DOC_FIELDS.filter(({ field }) => !!selectedRecord[field]).map(({ type }) => {
                      const state = docStates[type];
                      const isSelfie = type === 'selfie';
                      return (
                        <div key={type} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 bg-white">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                              {isSelfie
                                ? <Camera className="w-4 h-4 text-blue-500" />
                                : <FileText className="w-4 h-4 text-blue-500" />
                              }
                            </div>
                            <span className="text-xs font-medium text-gray-700 leading-tight">{DOC_LABELS[type]}</span>
                          </div>

                          {state?.loading && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Loading…
                            </div>
                          )}
                          {!state?.loading && state?.error && (
                            <p className="text-xs text-red-500">{state.error}</p>
                          )}
                          {!state?.loading && state?.url && (
                            <a
                              href={state.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open document
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

            </div>

            {/* Panel footer — actions */}
            {canAction && (
              <div className="border-t border-gray-200 px-6 py-4 shrink-0 space-y-3 bg-gray-50">
                {panelRejectMode ? (
                  <>
                    <p className="text-sm font-medium text-gray-700">Reason for rejection</p>
                    <textarea
                      value={panelRejectReason}
                      onChange={(e) => setPanelRejectReason(e.target.value)}
                      placeholder="Provide a reason so the user can resubmit correctly (optional)…"
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPanelRejectMode(false); setPanelRejectReason(''); }}
                        disabled={actionLoading}
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRejectConfirm(selectedRecord.id)}
                        disabled={actionLoading}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Confirm Rejection
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPanelRejectMode(true)}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRecord.id)}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <CheckCircle className="w-4 h-4" />
                      }
                      Approve
                    </button>
                  </div>
                )}
              </div>
            )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}