'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { companiesApi, type UserCompany } from '@/lib/api-client';
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
            <button
              key={company.id}
              onClick={() => router.push(`/app/my-companies/${company.id}`)}
              className="w-full text-left bg-card border border-border rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all group"
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
          ))}
        </div>
      </div>
    </div>
  );
}
