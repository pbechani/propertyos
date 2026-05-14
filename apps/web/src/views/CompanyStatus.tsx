'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Hash,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  ShieldX,
  Shield,
} from 'lucide-react';
import { companiesApi, type CompanyDetail } from '@/lib/api-client';
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

type StatusConfig = {
  label: string;
  className: string;
  icon: React.ElementType;
};

const COMPANY_STATUS_CONFIG: Record<string, StatusConfig> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  pending_verification: { label: 'Pending Verification', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  suspended: { label: 'Suspended', className: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  deactivated: { label: 'Deactivated', className: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle },
};

const VERIFICATION_STATUS_CONFIG: Record<string, StatusConfig> = {
  verified: { label: 'Verified', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: ShieldCheck },
  pending: { label: 'Verification Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Shield },
  rejected: { label: 'Verification Rejected', className: 'bg-red-100 text-red-700 border-red-200', icon: ShieldX },
  unverified: { label: 'Unverified', className: 'bg-gray-100 text-gray-500 border-gray-200', icon: Shield },
};

function StatusBadge({ status, config }: { status: string; config: Record<string, StatusConfig> }) {
  const cfg = config[status] ?? { label: status, className: 'bg-gray-100 text-gray-500 border-gray-200', icon: Shield };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${cfg.className}`}>
      <Icon className="w-4 h-4" />
      {cfg.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4 py-3 border-b border-border last:border-0">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground break-all">{value}</span>
    </div>
  );
}

export default function CompanyStatus() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = params?.id;

  useEffect(() => {
    if (!companyId) return;
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    companiesApi
      .getCompany(token, companyId)
      .then(setCompany)
      .catch((err: Error) => setError(err.message ?? 'Failed to load company'))
      .finally(() => setLoading(false));
  }, [companyId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error ?? 'Company not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const address = company.address;
  const formattedAddress = address
    ? [address.line1, address.line2, address.city, address.region, address.country, address.postal_code]
        .filter(Boolean)
        .join(', ')
    : null;

  const canSubmitVerification =
    company.verification_status === 'unverified' && company.status !== 'suspended' && company.status !== 'deactivated';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6">

        {/* Back link */}
        <button
          onClick={() => router.push('/app/my-companies')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          My Companies
        </button>

        {/* Company header card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">{company.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {CATEGORY_LABELS[company.category] ?? company.category}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <StatusBadge status={company.status} config={COMPANY_STATUS_CONFIG} />
                <StatusBadge status={company.verification_status} config={VERIFICATION_STATUS_CONFIG} />
              </div>
            </div>
          </div>

          {/* Submit for verification CTA */}
          {canSubmitVerification && (
            <div className="mt-5 pt-5 border-t border-border flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Your company is not yet verified</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submit your company for verification to unlock full platform features.
                </p>
              </div>
              <button
                onClick={() => router.push(`/company/${company.id}/profile`)}
                className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shrink-0"
              >
                Submit for Verification
              </button>
            </div>
          )}
        </div>

        {/* Details card */}
        <div className="bg-card border border-border rounded-xl px-6 py-2 mb-6">
          <h2 className="text-sm font-semibold text-foreground py-4 border-b border-border">Company Details</h2>
          <div>
            <InfoRow label="Company ID" value={<span className="font-mono text-xs">{company.id}</span>} />
            <InfoRow label="Slug" value={company.slug} />
            <InfoRow
              label="Email"
              value={
                <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                  <Mail className="w-3.5 h-3.5" />
                  {company.email}
                </a>
              }
            />
            {company.phone && (
              <InfoRow
                label="Phone"
                value={
                  <a href={`tel:${company.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                    <Phone className="w-3.5 h-3.5" />
                    {company.phone}
                  </a>
                }
              />
            )}
            {company.website && (
              <InfoRow
                label="Website"
                value={
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                    <Globe className="w-3.5 h-3.5" />
                    {company.website}
                  </a>
                }
              />
            )}
            {company.registration_number && (
              <InfoRow
                label="Reg. Number"
                value={
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    {company.registration_number}
                  </span>
                }
              />
            )}
            {company.tax_number && (
              <InfoRow
                label="Tax Number"
                value={
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    {company.tax_number}
                  </span>
                }
              />
            )}
            {formattedAddress && (
              <InfoRow
                label="Address"
                value={
                  <span className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    {formattedAddress}
                  </span>
                }
              />
            )}
            {company.description && (
              <InfoRow label="Description" value={<span className="whitespace-pre-wrap">{company.description}</span>} />
            )}
            <InfoRow
              label="Registered"
              value={new Date(company.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push('/company/profile?edit=true')}
            className="px-4 py-2 text-sm font-medium bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            Edit Company Profile
          </button>
          <button
            onClick={() => router.push('/company/users')}
            className="px-4 py-2 text-sm font-medium bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            Manage Members
          </button>
        </div>
      </div>
    </div>
  );
}
