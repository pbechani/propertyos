'use client';

import { useEffect, useState } from "react";
import { useParams } from "@/lib/router-compat";
import {
  ChevronLeft, Shield, Mail, Phone, MapPin, Globe, Hash, Building2,
  FileText, CheckCircle, Clock, XCircle, X, Loader2, MessageSquare,
  AlertCircle, ExternalLink, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { companiesApi, type CompanyDetail, type CompanyDocument, type PublicCompanyMember, type PublicCompanyListing } from "@/lib/api-client";
import { getAccessToken, getStoredUser } from "@/lib/auth-session";

// ─── Brand constants ───────────────────────────────────────────────────────────
const FRAUNCES = 'var(--font-fraunces, "Fraunces", Georgia, serif)';
const MONO     = 'var(--font-mono, "IBM Plex Mono", monospace)';
const C = {
  forest:      '#1A3C28',
  forestLight: '#2D5A40',
  parchment:   '#F2E8D5',
  cream:       '#EAD9C4',
  carbon:      '#0C0D10',
  egreen:      '#00E87A',
  amber:       '#B89040',
  muted:       '#6B8A76',
  faint:       '#9AAFA4',
  border:      'rgba(26,60,40,0.12)',
  rust:        '#C4562A',
};

const CATEGORY_LABELS: Record<string, string> = {
  agent:       'Real Estate Agency',
  contractor:  'Contractor / Construction',
  supplier:    'Building Materials Supplier',
  conveyancer: 'Conveyancer / Legal Services',
  inspector:   'Building Inspector',
  logistics:   'Logistics / Transport Operator',
  developing:  'Property Developer',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  business_licence:        'Business Licence',
  registration_certificate:'Company Registration',
  tax_clearance:           'Tax Clearance Certificate',
  professional_indemnity:  'Professional Indemnity',
  id_document:             'Identity Document',
  other:                   'Other Document',
};

// ─── Shared form styles ────────────────────────────────────────────────────────
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-shadow bg-white border focus:ring-2";
const inputStyle = { borderColor: C.border, color: C.forest };

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.muted }}>
      {children}
    </label>
  );
}

// ─── Modal base ────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-lg font-semibold" style={{ fontFamily: FRAUNCES, color: C.forest }}>{title}</h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: `${C.forest}60` }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.forest; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = `${C.forest}60`; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Login Gate Modal ─────────────────────────────────────────────────────────
function LoginGateModal({ companyName, onClose }: { companyName: string; onClose: () => void }) {
  const returnPath = typeof window !== 'undefined' ? window.location.pathname : '';
  return (
    <Modal title="Sign in to continue" onClose={onClose}>
      <div className="text-center py-2">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: `${C.forest}12` }}
        >
          <Shield className="w-7 h-7" style={{ color: C.forest }} />
        </div>
        <p className="text-sm leading-relaxed mb-6" style={{ color: C.muted }}>
          Create a free account or sign in to contact{' '}
          <span className="font-semibold" style={{ color: C.forest }}>{companyName}</span>.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href={`/login?returnTo=${encodeURIComponent(returnPath)}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-bold"
            style={{ background: C.egreen, color: C.carbon }}
          >
            Sign In
          </a>
          <a
            href={`/login?tab=register&returnTo=${encodeURIComponent(returnPath)}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ border: `1.5px solid ${C.border}`, color: C.forest, background: 'transparent' }}
          >
            Create Account
          </a>
          <button
            onClick={onClose}
            className="text-sm mt-1 transition-opacity hover:opacity-70"
            style={{ color: C.faint }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Contact Company Modal ─────────────────────────────────────────────────────
function ContactModal({
  company,
  onClose,
}: {
  company: CompanyDetail;
  onClose: () => void;
}) {
  const storedUser = getStoredUser();
  const [form, setForm] = useState({
    name: `${storedUser?.firstName ?? ''} ${storedUser?.lastName ?? ''}`.trim(),
    email: storedUser?.email ?? '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) {
      setErrorMsg('Please enter a message.');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');

    // Compose a mailto link as fallback since we don't have a company inquiry endpoint
    const subject = encodeURIComponent(`Inquiry from ${form.name || 'a visitor'}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\n${form.message}`
    );

    if (company.email) {
      window.location.href = `mailto:${company.email}?subject=${subject}&body=${body}`;
    }

    setStatus('success');
  };

  if (status === 'success') {
    return (
      <Modal title="Message Prepared" onClose={onClose}>
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: `${C.egreen}20` }}>
            <CheckCircle className="w-8 h-8" style={{ color: C.forestLight }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: C.forest }}>Message ready to send</p>
          <p className="text-sm mb-4" style={{ color: C.muted }}>Your email client has been opened to contact {company.name}.</p>
          <Button onClick={onClose} className="w-full font-bold" style={{ background: C.egreen, color: C.carbon }}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Contact ${company.name}`} onClose={onClose}>
      <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
        <div>
          <FormLabel>Phone (optional)</FormLabel>
          <input
            type="tel"
            className={inputCls}
            style={inputStyle}
            placeholder="+27 xxx xxx xxxx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <FormLabel>Message <span style={{ color: '#B91C1C' }}>*</span></FormLabel>
          <textarea
            rows={4}
            className={`${inputCls} resize-none`}
            style={inputStyle}
            placeholder="I'm interested in your services. Please get in touch..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        {status === 'error' && (
          <p className="text-sm rounded-lg p-3" style={{ color: '#B91C1C', background: '#FEF2F2' }}>{errorMsg}</p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            disabled={status === 'submitting'}
            className="flex-1 font-bold"
            style={{ background: C.egreen, color: C.carbon }}
          >
            {status === 'submitting' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
            ) : (
              <><MessageSquare className="w-4 h-4 mr-2" /> Send Message</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Trust Score Ring (SVG) ────────────────────────────────────────────────────
function TrustRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width="110" height="110" viewBox="0 0 110 110" aria-label={`Trust score: ${score}%`}>
      <circle cx="55" cy="55" r={r} fill="none" stroke={`${C.egreen}18`} strokeWidth="8" />
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke={C.egreen}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="55" y="50" textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: FRAUNCES, fontSize: 22, fill: C.egreen, fontWeight: 700 }}>
        {score}
      </text>
      <text x="55" y="68" textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: MONO, fontSize: 9, fill: C.faint, letterSpacing: 1 }}>
        TRUST SCORE
      </text>
    </svg>
  );
}

// ─── Doc status badge ──────────────────────────────────────────────────────────
function DocBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const cfg = {
    approved: { icon: CheckCircle, color: C.egreen, bg: `${C.egreen}1A`, label: 'Verified' },
    pending:  { icon: Clock,       color: C.amber,  bg: `${C.amber}1A`,  label: 'Pending' },
    rejected: { icon: XCircle,     color: C.rust,   bg: `${C.rust}1A`,   label: 'Rejected' },
  }[status];

  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CompanyPublicProfile() {
  const { id } = useParams();
  const companyId = typeof id === 'string' ? id : '';

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [members, setMembers] = useState<PublicCompanyMember[]>([]);
  const [publicListings, setPublicListings] = useState<PublicCompanyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);

  const token = getAccessToken();
  const currentUser = getStoredUser();

  const handleContactClick = () => {
    if (!currentUser) {
      setShowLoginGate(true);
    } else {
      setShowContact(true);
    }
  };

  useEffect(() => {
    if (!companyId) {
      setError('Invalid company id.');
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Use the authenticated endpoint when a token is available (returns
        // full record incl. tax_number etc.); fall back to the public endpoint
        // for anonymous visitors.
        const data = token
          ? await companiesApi.getCompany(token, companyId)
          : await companiesApi.getCompanyPublic(companyId);
        setCompany(data);

        // Load public members + listings for everyone (no auth required)
        const [membersData, listingsData] = await Promise.allSettled([
          companiesApi.getPublicMembers(companyId),
          companiesApi.getPublicListings(companyId),
        ]);
        if (membersData.status === 'fulfilled') setMembers(membersData.value);
        if (listingsData.status === 'fulfilled') setPublicListings(listingsData.value);

        // Documents are auth-only
        if (token) {
          try {
            const docs = await companiesApi.getDocuments(token, companyId);
            setDocuments(docs);
          } catch {
            // Documents not critical for public profile
          }
        }
      } catch {
        setError('Unable to load company profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [companyId, token]);

  // Derive trust score from verification status + doc approvals
  const trustScore = (() => {
    if (!company) return 0;
    if (company.verification_status === 'verified') return 92;
    if (company.verification_status === 'pending') return 45;
    const approvedDocs = documents.filter((d) => d.status === 'approved').length;
    if (approvedDocs > 0) return Math.min(60, 20 + approvedDocs * 10);
    return 10;
  })();

  const estYear = company?.created_at
    ? new Date(company.created_at).getFullYear()
    : null;

  const categoryLabel = company
    ? (CATEGORY_LABELS[company.category] ?? company.category)
    : '';

  const addressLine = [
    company?.address?.line1,
    company?.address?.city,
    company?.address?.region,
    company?.address?.country,
  ].filter(Boolean).join(', ');

  return (
    <>
      {showLoginGate && company && (
        <LoginGateModal companyName={company.name} onClose={() => setShowLoginGate(false)} />
      )}
      {showContact && company && (
        <ContactModal company={company} onClose={() => setShowContact(false)} />
      )}

      <div className="min-h-screen" style={{ background: C.parchment }}>

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-8 py-3.5" style={{ background: C.forest }}>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-100"
            style={{ color: `${C.parchment}A6` }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {company && (
            <>
              <span className="text-xs" style={{ color: `${C.parchment}4D` }}>›</span>
              <span className="text-sm font-semibold" style={{ color: C.parchment, fontFamily: FRAUNCES }}>
                {company.name}
              </span>
            </>
          )}
        </div>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="max-w-5xl mx-auto px-8 py-14 flex items-center gap-3 text-sm" style={{ color: C.muted }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading company profile…
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {!isLoading && error && (
          <div className="max-w-5xl mx-auto px-8 py-8 mt-8">
            <div className="flex items-center gap-3 text-sm rounded-xl px-5 py-4"
              style={{ color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          </div>
        )}

        {!isLoading && !error && company && (
          <>
            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <div
              className="relative overflow-hidden pb-20"
              style={{ background: 'linear-gradient(135deg, #1A3C28 0%, #2D5A40 60%, #3A7050 100%)' }}
            >
              {/* Radial egreen glow */}
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 60% 40% at 30% 60%, rgba(0,232,122,0.08) 0%, transparent 70%)',
                }} />
              {/* Diagonal texture */}
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }} />

              <div className="max-w-5xl mx-auto px-8 pt-12 pb-4 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                  {/* Logo box */}
                  <div className="shrink-0">
                    <div
                      className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center text-3xl font-bold"
                      style={{
                        background: `${C.forestLight}CC`,
                        border: `1.5px solid ${C.egreen}40`,
                        backdropFilter: 'blur(8px)',
                        fontFamily: FRAUNCES,
                        color: C.egreen,
                      }}
                    >
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={`${company.name} logo`}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        company.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    {/* Category pill */}
                    <div
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
                      style={{
                        background: `${C.egreen}26`,
                        border: `1px solid ${C.egreen}4D`,
                        color: C.egreen,
                        fontFamily: MONO,
                      }}
                    >
                      <Building2 className="w-3 h-3" />
                      {categoryLabel}
                    </div>

                    <h1
                      className="text-3xl md:text-4xl font-bold mb-2 leading-tight"
                      style={{ fontFamily: FRAUNCES, color: C.parchment }}
                    >
                      {company.name}
                    </h1>

                    {/* Verified pill */}
                    {company.verification_status === 'verified' && (
                      <div
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
                        style={{
                          background: `${C.egreen}20`,
                          border: `1px solid ${C.egreen}40`,
                          color: C.egreen,
                        }}
                      >
                        <Shield className="w-3 h-3" />
                        Verified Business
                      </div>
                    )}
                    {company.verification_status === 'pending' && (
                      <div
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
                        style={{ background: `${C.amber}20`, border: `1px solid ${C.amber}40`, color: C.amber }}
                      >
                        <Clock className="w-3 h-3" />
                        Verification Pending
                      </div>
                    )}

                    {/* Stats ticker */}
                    <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                      {(company.active_listings_count != null || publicListings.length > 0) && (
                        <>
                          <div>
                            <p className="text-xl font-bold" style={{ fontFamily: FRAUNCES, color: C.egreen }}>
                              {company.active_listings_count ?? publicListings.length}
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.faint, fontFamily: MONO }}>Active Listings</p>
                          </div>
                          <div style={{ width: 1, background: `${C.parchment}30`, alignSelf: 'stretch' }} />
                        </>
                      )}
                      {(company.members_count != null || members.length > 0) && (
                        <>
                          <div>
                            <p className="text-xl font-bold" style={{ fontFamily: FRAUNCES, color: C.parchment }}>
                              {company.members_count ?? members.length}
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.faint, fontFamily: MONO }}>Agents</p>
                          </div>
                          <div style={{ width: 1, background: `${C.parchment}30`, alignSelf: 'stretch' }} />
                        </>
                      )}
                      {estYear && (
                        <>
                          <div>
                            <p className="text-xl font-bold" style={{ fontFamily: FRAUNCES, color: C.parchment }}>{estYear}</p>
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.faint, fontFamily: MONO }}>Est.</p>
                          </div>
                          <div style={{ width: 1, background: `${C.parchment}30`, alignSelf: 'stretch' }} />
                        </>
                      )}
                      <div>
                        <p className="text-xl font-bold" style={{ fontFamily: FRAUNCES, color: C.egreen }}>{trustScore}<span className="text-sm ml-0.5" style={{ color: C.faint }}>/100</span></p>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.faint, fontFamily: MONO }}>Trust Score</p>
                      </div>
                    </div>
                  </div>

                  {/* Action cluster */}
                  <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={handleContactClick}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                      style={{ background: C.egreen, color: C.carbon }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Contact Agency
                    </button>
                    {company.phone && (
                      <a
                        href={`tel:${company.phone.replace(/\s+/g, '')}`}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                        style={{
                          border: `1.5px solid ${C.parchment}40`,
                          color: C.parchment,
                          background: 'transparent',
                        }}
                      >
                        <Phone className="w-4 h-4" />
                        Schedule Call
                      </a>
                    )}
                    <button
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                      style={{
                        border: `1.5px solid ${C.rust}60`,
                        color: C.rust,
                        background: `${C.rust}10`,
                      }}
                      onClick={() => window.location.href = '/app/safety'}
                    >
                      <AlertCircle className="w-4 h-4" />
                      Report Fraud
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SVG Wave transition ──────────────────────────────────────── */}
            <div style={{ marginTop: -2, lineHeight: 0 }}>
              <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ width: '100%', height: 56, display: 'block' }}>
                <path
                  d="M0,28 C360,56 1080,0 1440,28 L1440,56 L0,56 Z"
                  fill={C.parchment}
                />
              </svg>
            </div>

            {/* ── 3-Column content grid ────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-8 pb-16" style={{ marginTop: -8 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* ── Col 1: Company Info + Our Agents ─────────────────────── */}
                <div className="flex flex-col gap-5">

                  {/* Company Info Card */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'white', border: `1px solid ${C.border}` }}
                  >
                    <h3
                      className="text-sm font-bold uppercase tracking-wider mb-4"
                      style={{ color: C.forest, fontFamily: MONO }}
                    >
                      Company Info
                    </h3>
                    <div className="space-y-3">
                      {addressLine && (
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.muted }} />
                          <span className="text-sm leading-snug" style={{ color: C.muted }}>{addressLine}</span>
                        </div>
                      )}
                      {company.registration_number && (
                        <div className="flex items-center gap-2.5">
                          <Hash className="w-4 h-4 shrink-0" style={{ color: C.muted }} />
                          <div>
                            <p className="text-xs" style={{ color: C.faint, fontFamily: MONO }}>REG NUMBER</p>
                            <p className="text-sm font-medium" style={{ color: C.forest, fontFamily: MONO }}>
                              {company.registration_number}
                            </p>
                          </div>
                        </div>
                      )}
                      {company.tax_number && (
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 shrink-0" style={{ color: C.muted }} />
                          <div>
                            <p className="text-xs" style={{ color: C.faint, fontFamily: MONO }}>TAX NUMBER</p>
                            <p className="text-sm font-medium" style={{ color: C.forest, fontFamily: MONO }}>
                              {company.tax_number}
                            </p>
                          </div>
                        </div>
                      )}
                      {estYear && (
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 shrink-0" style={{ color: C.muted }} />
                          <div>
                            <p className="text-xs" style={{ color: C.faint, fontFamily: MONO }}>ESTABLISHED</p>
                            <p className="text-sm font-medium" style={{ color: C.forest }}>{estYear}</p>
                          </div>
                        </div>
                      )}
                      {company.website && (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 group"
                        >
                          <Globe className="w-4 h-4 shrink-0" style={{ color: C.muted }} />
                          <span className="text-sm truncate group-hover:underline" style={{ color: C.forestLight }}>
                            {company.website.replace(/^https?:\/\//, '')}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0" style={{ color: C.faint }} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Our Agents Card */}
                  {members.length > 0 && (
                    <div
                      className="rounded-xl p-5"
                      style={{ background: 'white', border: `1px solid ${C.border}` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3
                          className="text-sm font-bold uppercase tracking-wider"
                          style={{ color: C.forest, fontFamily: MONO }}
                        >
                          Our Team
                        </h3>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${C.forest}10`, color: C.muted, fontFamily: MONO }}
                        >
                          {members.length} member{members.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {members.slice(0, 5).map((m, i) => {
                          const initials = [m.first_name, m.last_name]
                            .filter(Boolean)
                            .map((n) => n!.charAt(0).toUpperCase())
                            .join('');
                          const displayName = [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Team Member';
                          const gradients = [
                            'linear-gradient(135deg,#1A3C28,#2D5A40)',
                            'linear-gradient(135deg,#2D5A40,#4a8a60)',
                            'linear-gradient(135deg,#3a5228,#5a7840)',
                            'linear-gradient(135deg,#1c3c2c,#2a5a3c)',
                            'linear-gradient(135deg,#243c2c,#3a6044)',
                          ];
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                              style={{ border: `1px solid ${C.border}` }}
                            >
                              {/* Avatar */}
                              <div
                                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden"
                                style={{ background: gradients[i % gradients.length], color: C.egreen }}
                              >
                                {m.avatar_url ? (
                                  <img src={m.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                  initials || '?'
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: C.forest }}>{displayName}</p>
                                <p className="text-xs truncate capitalize" style={{ color: C.muted }}>{m.role.replace(/_/g, ' ')}</p>
                              </div>
                              {m.is_admin && (
                                <span
                                  className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: `${C.egreen}1A`, color: C.forestLight, fontFamily: MONO }}
                                >
                                  Principal
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {members.length > 5 && (
                          <div
                            className="flex items-center gap-3 px-3 py-2 rounded-lg"
                            style={{ border: `1px dashed ${C.border}` }}
                          >
                            <div
                              className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                              style={{ background: `${C.forest}18`, color: C.muted }}
                            >
                              +{members.length - 5}
                            </div>
                            <p className="text-sm" style={{ color: C.faint }}>more team members</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Col 2: Active Listings + About ───────────────────────── */}
                <div className="flex flex-col gap-5">

                  {/* Active Listings mini-grid */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'white', border: `1px solid ${C.border}` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: C.forest, fontFamily: MONO }}
                      >
                        Active Listings
                      </h3>
                      {(company.active_listings_count ?? publicListings.length) > 0 && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${C.forest}10`, color: C.muted, fontFamily: MONO }}
                        >
                          {company.active_listings_count ?? publicListings.length} properties
                        </span>
                      )}
                    </div>

                    {publicListings.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {publicListings.map((listing) => {
                            const listingTypeLabel: Record<string, string> = {
                              for_sale: 'For Sale',
                              to_let: 'To Let',
                              off_plan: 'Off-Plan',
                              auction: 'Auction',
                            };
                            const listingLabel = listing.listing_type
                              ? (listingTypeLabel[listing.listing_type] ?? listing.listing_type)
                              : null;
                            const location = [listing.city, listing.region].filter(Boolean).join(', ');
                            const price = parseFloat(listing.price);
                            const formattedPrice = !isNaN(price)
                              ? new Intl.NumberFormat('en-ZA', {
                                  style: 'currency',
                                  currency: listing.currency || 'ZAR',
                                  maximumFractionDigits: 0,
                                }).format(price)
                              : listing.price;

                            return (
                              <a
                                key={listing.id}
                                href={`/app/listings/${listing.id}`}
                                className="block rounded-lg overflow-hidden group transition-transform hover:-translate-y-0.5"
                                style={{ border: `1px solid ${C.border}` }}
                              >
                                {/* Image or placeholder */}
                                <div
                                  className="w-full flex items-center justify-center text-2xl"
                                  style={{
                                    height: 80,
                                    background: `${C.forest}10`,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {listing.thumbnail_url ? (
                                    <img
                                      src={listing.thumbnail_url}
                                      alt={listing.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span style={{ color: C.muted }}>
                                      {listing.property_type === 'land' ? '🌍' :
                                       listing.property_type === 'commercial' ? '🏢' :
                                       listing.property_type === 'off_plan' ? '🏗️' : '🏡'}
                                    </span>
                                  )}
                                </div>
                                <div className="p-2">
                                  <p className="text-xs font-bold truncate" style={{ color: C.forest, fontFamily: MONO }}>
                                    {formattedPrice}
                                  </p>
                                  {location && (
                                    <p className="text-xs truncate mt-0.5" style={{ color: C.muted }}>{location}</p>
                                  )}
                                  {listingLabel && (
                                    <span
                                      className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded mt-1"
                                      style={{ background: `${C.egreen}1A`, color: C.forestLight, fontFamily: MONO }}
                                    >
                                      {listingLabel}
                                    </span>
                                  )}
                                </div>
                              </a>
                            );
                          })}
                          {/* "View all" tile if more than shown */}
                          {(company.active_listings_count ?? 0) > publicListings.length && (
                            <a
                              href={`/app/listings?companyId=${companyId}`}
                              className="flex flex-col items-center justify-center rounded-lg transition-colors hover:bg-opacity-80"
                              style={{ height: 130, border: `1px dashed ${C.border}`, background: `${C.forest}06` }}
                            >
                              <span className="text-2xl font-bold" style={{ fontFamily: FRAUNCES, color: C.forest }}>
                                +{(company.active_listings_count ?? 0) - publicListings.length}
                              </span>
                              <span className="text-xs mt-1 font-semibold uppercase tracking-wide" style={{ color: C.muted, fontFamily: MONO }}>
                                View All
                              </span>
                            </a>
                          )}
                        </div>
                        <a
                          href={`/app/listings?companyId=${companyId}`}
                          className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-semibold mt-3 transition-opacity hover:opacity-80"
                          style={{ background: C.forest, color: C.parchment }}
                        >
                          <span>View all listings</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </>
                    ) : (
                      <div className="py-6 text-center">
                        <p className="text-sm italic" style={{ color: C.faint }}>No active listings at this time.</p>
                        <a
                          href={`/app/listings?companyId=${companyId}`}
                          className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold hover:underline"
                          style={{ color: C.forestLight }}
                        >
                          Browse all listings <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* About card */}
                  <div
                    className="rounded-xl p-5 flex-1"
                    style={{ background: 'white', border: `1px solid ${C.border}` }}
                  >
                    <h3
                      className="text-sm font-bold uppercase tracking-wider mb-4"
                      style={{ color: C.forest, fontFamily: MONO }}
                    >
                      About
                    </h3>
                    {company.description ? (
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: C.muted }}>
                        {company.description}
                      </p>
                    ) : (
                      <p className="text-sm italic" style={{ color: C.faint }}>No description provided.</p>
                    )}
                  </div>
                </div>

                {/* ── Col 3: Contact + Trust Score + Docs ──────────────────── */}
                <div className="flex flex-col gap-5">

                  {/* Dark contact card */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: C.forest, border: `1px solid ${C.forestLight}` }}
                  >
                    <h3
                      className="text-sm font-bold uppercase tracking-wider mb-4"
                      style={{ color: C.egreen, fontFamily: MONO }}
                    >
                      Contact
                    </h3>
                    <div className="space-y-3">
                      {company.email && (
                        <a href={`mailto:${company.email}`}
                          className="flex items-center gap-2.5 group">
                          <Mail className="w-4 h-4 shrink-0" style={{ color: C.muted }} />
                          <span className="text-sm group-hover:underline" style={{ color: C.parchment }}>
                            {company.email}
                          </span>
                        </a>
                      )}
                      {company.phone && (
                        <a href={`tel:${company.phone.replace(/\s+/g, '')}`}
                          className="flex items-center gap-2.5 group">
                          <Phone className="w-4 h-4 shrink-0" style={{ color: C.muted }} />
                          <span className="text-sm group-hover:underline" style={{ color: C.parchment }}>
                            {company.phone}
                          </span>
                        </a>
                      )}
                      {addressLine && (
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.muted }} />
                          <span className="text-sm leading-snug" style={{ color: `${C.parchment}B3` }}>
                            {addressLine}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleContactClick}
                      className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                      style={{ background: C.egreen, color: C.carbon }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </button>
                  </div>

                  {/* Trust Score ring card */}
                  <div
                    className="rounded-xl p-5 flex flex-col items-center"
                    style={{ background: 'white', border: `1px solid ${C.border}` }}
                  >
                    <h3
                      className="text-sm font-bold uppercase tracking-wider mb-4 self-start"
                      style={{ color: C.forest, fontFamily: MONO }}
                    >
                      Trust Score
                    </h3>
                    <TrustRing score={trustScore} />
                    <p className="text-xs text-center mt-3 leading-relaxed" style={{ color: C.muted }}>
                      {company.verification_status === 'verified'
                        ? 'This business has completed full platform verification.'
                        : company.verification_status === 'pending'
                        ? 'Verification is currently in progress.'
                        : 'Verification not yet initiated.'}
                    </p>
                  </div>

                  {/* Documents card (only if documents loaded) */}
                  {documents.length > 0 && (
                    <div
                      className="rounded-xl p-5"
                      style={{ background: 'white', border: `1px solid ${C.border}` }}
                    >
                      <h3
                        className="text-sm font-bold uppercase tracking-wider mb-4"
                        style={{ color: C.forest, fontFamily: MONO }}
                      >
                        Verification Documents
                      </h3>
                      <div className="space-y-2.5">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between gap-3 py-1.5"
                            style={{ borderBottom: `1px solid ${C.border}` }}>
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: C.muted }} />
                              <span className="text-sm truncate" style={{ color: C.forest }}>
                                {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_name}
                              </span>
                            </div>
                            <DocBadge status={doc.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
