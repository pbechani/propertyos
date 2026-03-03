'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  ChevronRight,
  Loader2,
  AlertCircle,
  PowerOff,
  X,
} from 'lucide-react';
import { companiesApi, authApi, type UserCompany } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

const CATEGORY_LABELS: Record<string, string> = {
  agent: 'Real Estate Agent / Agency',
  contractor: 'Contractor / Construction',
  supplier: 'Building Materials Supplier',
  conveyancer: 'Conveyancer / Legal Services',
  inspector: 'Building Inspector',
  logistics: 'Logistics / Transport Operator',
  developing: 'Property Developer',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
  deactivated: 'bg-gray-100 text-gray-500',
};

const VERIFICATION_STYLES: Record<string, string> = {
  verified: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  unverified: 'bg-gray-100 text-gray-500',
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MyCompanies() {
  const router = useRouter();
  const [companies, setCompanies] = useState<UserCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<UserCompany | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    const token = getAccessToken();
    if (!token) return;
    setDeactivating(true);
    setDeactivateError(null);
    try {
      const scoped = await authApi.selectContext(token, confirmDeactivate.id);
      await companiesApi.deactivateCompany(scoped.accessToken, confirmDeactivate.id);
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === confirmDeactivate.id ? { ...c, company_status: 'deactivated' } : c,
        ),
      );
      setConfirmDeactivate(null);
    } catch (err: unknown) {
      setDeactivateError(err instanceof Error ? err.message : 'Failed to deactivate.');
    } finally {
      setDeactivating(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    companiesApi
      .getMyCompanies(token)
      .then((data) => {
        // Exclude system-generated companies (e.g. the built-in "Self" context)
        const userCompanies = (data ?? []).filter(
          (c) => c.slug !== 'self' && !(c as unknown as Record<string, unknown>)['is_system'],
        );
        if (userCompanies.length === 0) {
          router.replace('/company-registration');
          return;
        }
        setCompanies(userCompanies);
      })
      .catch((err: Error) => {
        setError(err.message ?? 'Failed to load companies');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Companies</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {companies.length} registered {companies.length === 1 ? 'company' : 'companies'}
            </p>
          </div>
          <button
            onClick={() => router.push('/company-registration')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Company
          </button>
        </div>

        {/* Company list */}
        <div className="space-y-3">
          {companies.map((company) => (
            <div key={company.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-sm transition-all group">
              <button
                onClick={() => router.push(`/app/my-companies/${company.id}`)}
                className="w-full text-left p-5"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground truncate">{company.name}</span>
                      {company.is_admin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 uppercase tracking-wide shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {CATEGORY_LABELS[company.category] ?? company.category}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLES[company.company_status] ?? 'bg-gray-100 text-gray-500'}`}
                      >
                        {formatStatus(company.company_status)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${VERIFICATION_STYLES[company.verification_status] ?? 'bg-gray-100 text-gray-500'}`}
                      >
                        {formatStatus(company.verification_status)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 capitalize">
                        {company.role}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                </div>
              </button>

              {/* Deactivate — only for admins on non-deactivated companies */}
              {company.is_admin && company.company_status !== 'deactivated' && (
                <div className="px-5 pb-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeactivate(company); }}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    Deactivate company
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Deactivate confirmation modal */}
        {confirmDeactivate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <PowerOff className="w-5 h-5 text-red-600" />
                </div>
                <button onClick={() => { setConfirmDeactivate(null); setDeactivateError(null); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-lg font-semibold mb-1">Deactivate Company?</h2>
              <p className="text-sm text-gray-600 mb-4">
                <strong>{confirmDeactivate.name}</strong> will be deactivated. Members will lose access and the company will no longer be operational. This action cannot be undone.
              </p>
              {deactivateError && (
                <p className="text-xs text-red-600 mb-3 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{deactivateError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmDeactivate(null); setDeactivateError(null); }}
                  disabled={deactivating}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={deactivating}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deactivating ? <><Loader2 className="w-4 h-4 animate-spin" />Deactivating…</> : 'Yes, Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
