'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { usePlatformStats } from '@/lib/use-platform-stats';
import { useFeaturedListings } from '@/lib/use-featured-listings';
import { API_BASE_URL } from '@/lib/api-client';
import {
  MapPin,
  Shield,
  CheckCircle,
  Camera,
  Lock,
  TrendingUp,
  ChevronRight,
  Building2,
  Hammer,
  Globe,
  Users,
  Upload,
  Cpu,
  BarChart3,
  ShoppingCart,
  Truck,
  Navigation,
  PackageCheck,
  ChevronDown,
  Mail,
  MessageSquare,
  Layers,
  Zap,
  HardHat,
  ClipboardCheck,
  Warehouse,
  Landmark,
} from 'lucide-react';
import { Link, useNavigate } from '@/lib/router-compat';
import { Badge } from '@/components/ui/badge';

// ── Hero search suggestions ─────────────────────────────────────────────────────
const HERO_LOCATION_SUGGESTIONS = [
  'Cape Town',
  'Johannesburg',
  'Durban',
  'Gaborone',
  'Francistown',
  'Harare',
  'Lusaka',
];

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  parchment: '#F2E8D5',
  cream: '#EAD9C4',
  forest: '#1A3C28',
  terracotta: '#C4562A',
  carbon: '#0C0D10',
  carbonSoft: '#1A1B1F',
  egreen: '#00E87A',
  amber: '#B89040',
};

// ── Role data ──────────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'buyer',
    label: 'Buying Property',
    icon: Building2,
    features: [
      { title: '14-Stage Pipeline', desc: 'Track every step from offer to deeds registration with full transparency.' },
      { title: 'Deed Verification', desc: 'Instant title deed checks and ownership history before you commit.' },
      { title: 'Escrow Protection', desc: 'Your deposit held securely and released only on legal transfer.' },
    ],
  },
  {
    id: 'diaspora',
    label: 'Diaspora Investor',
    icon: Globe,
    features: [
      { title: 'Geo-Tagged Photos', desc: 'EXIF-verified progress photos from your site — no more relying on trust.' },
      { title: 'Remote Oversight', desc: 'Book independent site inspectors at any time, from anywhere.' },
      { title: 'Immutable Ledger', desc: 'Every cent accounted for in an append-only financial log.' },
    ],
  },
  {
    id: 'agent',
    label: 'Agent & Conveyancer',
    icon: Users,
    features: [
      { title: 'Case Management', desc: 'Manage multiple sales, documents, and department interactions in one portal.' },
      { title: 'Commission Tracking', desc: 'Automated commission calculations with milestone-linked payments.' },
      { title: 'Gov Department API', desc: 'Direct integrations with Land Registry, Deeds Office, and Tax Authority.' },
    ],
  },
  {
    id: 'contractor',
    label: 'Contractor & Supplier',
    icon: Hammer,
    features: [
      { title: 'Bid on Projects', desc: 'Receive BOQ-based project invitations and submit competitive bids.' },
      { title: 'Milestone Payments', desc: 'Get paid automatically when inspection approves your stage.' },
      { title: 'RFQ System', desc: 'Respond to bulk quote requests from construction projects.' },
    ],
  },
  {
    id: 'pm',
    label: 'Project Manager',
    icon: HardHat,
    features: [
      { title: 'AI BOQ Generation', desc: 'Upload architectural plans and get a full bill of quantities instantly — premium, recommended, and budget tiers.' },
      { title: 'Stage Oversight', desc: 'Monitor all 11 construction stages with geo-tagged photo evidence and inspection gating.' },
      { title: 'Budget Control', desc: 'Real-time variance tracking between actual spend and estimates with change-order log.' },
    ],
  },
  {
    id: 'inspector',
    label: 'Inspector',
    icon: ClipboardCheck,
    features: [
      { title: 'Mobile Sign-off', desc: 'Issue certificates and field reports from your phone — works fully offline in the field.' },
      { title: 'Stage Gating', desc: 'Construction cannot advance to the next stage until your inspection criteria are met and logged.' },
      { title: 'Digital Certificates', desc: 'Government-registered compliance docs issued and stored on-chain per construction stage.' },
    ],
  },
  {
    id: 'driver',
    label: 'Driver & Logistics',
    icon: Truck,
    features: [
      { title: 'Smart Job Matching', desc: 'Matched to delivery jobs by proximity, truck capacity, and performance rating automatically.' },
      { title: 'GPS + Delivery Proof', desc: 'Real-time route tracking with timestamped photo proof on delivery confirmation.' },
      { title: 'Instant Payment', desc: 'Automatic payout released the moment delivery is confirmed by the recipient.' },
    ],
  },
];

// ── Platform domains ────────────────────────────────────────────────────────────
const PLATFORM_DOMAINS = [
  {
    icon: Building2,
    label: 'Property Marketplace',
    desc: '14-stage purchase pipeline with deed verification, escrow, and fraud protection.',
    color: C.forest,
  },
  {
    icon: HardHat,
    label: 'Construction Management',
    desc: '11-stage project tracking with AI BOQ, geo-verified photos, and milestone payments.',
    color: C.terracotta,
  },
  {
    icon: Warehouse,
    label: 'Supply Chain',
    desc: '10,000+ materials, real-time price index, RFQ system, and multi-tier pricing.',
    color: C.amber,
  },
  {
    icon: Landmark,
    label: 'Escrow & Ledger',
    desc: 'Event-sourced, double-entry ledger with milestone-linked release and full audit trail.',
    color: C.forest,
  },
];

// ── Sample listings ─────────────────────────────────────────────────────────────
// ── Pipeline stages ─────────────────────────────────────────────────────────────
const STAGES = [
  'Search & View',
  'Offer Submitted',
  'Offer Accepted',
  'Sale Agreement',
  'Deposit & Escrow',
  'Deed Search',
  'Mortgage Approval',
  'Inspection',
  'Compliance Certs',
  'Transfer Docs',
  'Deeds Registration',
  'Transfer Duty',
  'Final Payment',
  'Post-Purchase',
];

// ── Trust stats ─────────────────────────────────────────────────────────────────
const TRUST_STATS = [
  { number: '0%', label: 'Fraud Rate', sub: 'on verified properties' },
  { number: '$2.1B', label: 'In Escrow', sub: 'protected across all transactions' },
  { number: '14', label: 'Pipeline Stages', sub: 'every legal step documented' },
  { number: '48h', label: 'Deed Verification', sub: 'average turnaround time' },
];

// ── Construction stages ────────────────────────────────────────────────────────
const CONSTRUCTION_STAGES = [
  'Site Prep',
  'Foundation',
  'Slab',
  'Frame',
  'Roofing',
  'Electrical',
  'Plumbing',
  'Plastering',
  'Fixtures',
  'Finishes',
  'Handover',
];

// ── FAQ items ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'How does escrow protection work?',
    a: 'Your deposit is held in a regulated escrow account and released only when all legal transfer conditions are met and documented on the platform.',
  },
  {
    q: 'Can I invest from outside the country?',
    a: 'Yes — built for diaspora investors with geo-tagged progress photos, remote inspection booking, and multi-currency wallets.',
  },
  {
    q: 'How are contractors verified?',
    a: 'Every contractor undergoes KYC, licence checks, and past-project review before appearing on the marketplace. Ratings are public and dispute history is tracked.',
  },
  {
    q: 'What is the BOQ system?',
    a: 'The Bill of Quantities system auto-generates a materials list from your architectural plans using AI. Compare budget, recommended, and premium tiers instantly.',
  },
  {
    q: 'How does milestone payment work?',
    a: 'Payments are released only after a completed stage is verified by you and confirmed by an independent inspection report.',
  },
];

// ── Component ───────────────────────────────────────────────────────────────────
export default function PublicHome() {
  const { stats, loading: statsLoading } = usePlatformStats();
  const { listings: featuredListings, loading: listingsLoading } = useFeaturedListings(3);
  const [activeRole, setActiveRole] = useState('buyer');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const activeRoleData = ROLES.find((r) => r.id === activeRole)!;
  const [heroLocations, setHeroLocations] = useState<string[]>([]);
  const [heroLocationInput, setHeroLocationInput] = useState('');
  const [showHeroSuggestions, setShowHeroSuggestions] = useState(false);
  const heroSearchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ── Contact form state ──────────────────────────────────────────────────────
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [contactServerMsg, setContactServerMsg] = useState('');
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  // Anti-spam: record when the form mounted (time-gate)
  const contactLoadedAt = useRef<number>(Date.now());
  // Reset the loaded-at time whenever the section scrolls into view (re-mounts aren't needed)
  useEffect(() => { contactLoadedAt.current = Date.now(); }, []);

  function validateContactField(field: string, value: string): string {
    if (field === 'name') {
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      if (value.trim().length > 100) return 'Name is too long';
      if (!/^[\p{L}\s'\-]+$/u.test(value.trim())) return 'Name contains invalid characters';
    }
    if (field === 'email') {
      if (!value.trim()) return 'Email address is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email';
    }
    if (field === 'subject') {
      if (!value) return 'Please select a subject';
    }
    if (field === 'message') {
      if (!value.trim()) return 'Message is required';
      if (value.trim().length < 20) return `Message too short (${value.trim().length}/20 characters)`;
      if (value.trim().length > 2000) return 'Message is too long (max 2000 characters)';
    }
    return '';
  }

  function handleContactBlur(field: string, value: string) {
    const err = validateContactField(field, value);
    setContactErrors((prev) => ({ ...prev, [field]: err }));
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Time-gate: must have taken at least 3 seconds to fill the form
    if (Date.now() - contactLoadedAt.current < 3000) return;

    // Session-storage cooldown (5 min)
    const lastSent = sessionStorage.getItem('contactLastSent');
    if (lastSent && Date.now() - Number(lastSent) < 5 * 60 * 1000) {
      setContactStatus('error');
      setContactServerMsg("You've already sent a message recently. Please wait a few minutes before trying again.");
      return;
    }

    // Validate all fields
    const fields: [string, string][] = [
      ['name', contactName],
      ['email', contactEmail],
      ['subject', contactSubject],
      ['message', contactMessage],
    ];
    const newErrors: Record<string, string> = {};
    let hasError = false;
    for (const [f, v] of fields) {
      const err = validateContactField(f, v);
      if (err) { newErrors[f] = err; hasError = true; }
    }
    if (hasError) { setContactErrors(newErrors); return; }

    setContactStatus('submitting');
    setContactServerMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim().toLowerCase(),
          subject: contactSubject,
          message: contactMessage.trim(),
          website: '', // honeypot — always empty from legit submissions
        }),
      });
      const data: { success: boolean; message?: string } = await res.json();
      if (data.success) {
        sessionStorage.setItem('contactLastSent', String(Date.now()));
        setContactStatus('success');
      } else {
        setContactStatus('error');
        setContactServerMsg(data.message ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setContactStatus('error');
      setContactServerMsg('Network error. Please check your connection and try again.');
    }
  }

  const heroLocationSuggestions = useMemo(() => {
    const normalizedInput = heroLocationInput.trim().toLowerCase();
    const selected = new Set(heroLocations.map((l) => l.toLowerCase()));
    return HERO_LOCATION_SUGGESTIONS.filter((loc) => {
      const lower = loc.toLowerCase();
      if (selected.has(lower)) return false;
      if (!normalizedInput) return true;
      return lower.includes(normalizedInput);
    }).slice(0, 6);
  }, [heroLocationInput, heroLocations]);

  function addHeroLocation(locationValue?: string) {
    const normalized = (locationValue ?? heroLocationInput).trim();
    if (!normalized) return;
    const matched = HERO_LOCATION_SUGGESTIONS.find(
      (l) => l.toLowerCase() === normalized.toLowerCase()
    );
    const next = matched ?? normalized;
    setHeroLocations((prev) => {
      if (prev.some((l) => l.toLowerCase() === next.toLowerCase())) return prev;
      return [...prev, next];
    });
    setHeroLocationInput('');
    setShowHeroSuggestions(false);
  }

  function removeHeroLocation(loc: string) {
    setHeroLocations((prev) => prev.filter((l) => l !== loc));
  }

  function handleHeroBrowse() {
    if (heroLocations.length > 0) {
      const params = new URLSearchParams({ searched: '1' });
      heroLocations.forEach((loc) => params.append('location', loc));
      navigate('/listings?' + params.toString());
    } else if (heroLocationInput.trim()) {
      navigate('/listings?searched=1&location=' + encodeURIComponent(heroLocationInput.trim()));
    } else {
      navigate('/listings');
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-jakarta)' }}>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 1 — HERO SPLIT
      ─────────────────────────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{ minHeight: '88vh', background: C.parchment }}
      >
        {/* Left — Emotional / Warm */}
        <div className="flex flex-col justify-center items-center text-center px-8 py-16 lg:px-16 lg:py-20">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-8 w-fit"
            style={{
              background: C.cream,
              color: C.forest,
              border: `1px solid ${C.amber}50`,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <MapPin className="w-3 h-3" style={{ color: C.terracotta }} />
            Emerging Market Trust Platform
          </div>

          <h1
            className="text-5xl md:text-6xl xl:text-7xl leading-[1.05] mb-6"
            style={{
              fontFamily: 'var(--font-fraunces)',
              color: C.forest,
            }}
          >
            Find it.{' '}
            <span className="block" style={{ color: C.terracotta }}>
              Build it.
            </span>
            Own it.
          </h1>

          <p
            className="text-lg md:text-xl leading-relaxed mb-10 max-w-lg"
            style={{ color: `${C.forest}BB` }}
          >
            BuildTrust connects property buyers, diaspora investors, agents, contractors,
            and suppliers on one financial-grade platform built for emerging markets.
          </p>

          {/* Search bar — multi-token location input */}
          <div ref={heroSearchRef} className="relative mb-8 max-w-lg w-full">
            <div
              className="flex items-center rounded-xl shadow-md"
              style={{ background: '#fff', border: `1.5px solid ${C.cream}` }}
            >
              <div className="flex-1 flex flex-wrap items-center gap-1.5 px-4 py-2 min-h-[48px]">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: C.terracotta }} />
                {heroLocations.map((loc) => (
                  <Badge
                    key={loc}
                    className="shrink-0 h-7 px-2 text-xs font-medium rounded-lg gap-1"
                    style={{ background: C.forest, color: C.parchment }}
                  >
                    {loc}
                    <button
                      type="button"
                      aria-label={`Remove ${loc}`}
                      onClick={() => removeHeroLocation(loc)}
                      className="opacity-70 hover:opacity-100 ml-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  placeholder={heroLocations.length > 0 ? '…add more' : 'Search by city or suburb…'}
                  className="flex-1 min-w-28 outline-none text-sm bg-transparent"
                  style={{ color: C.carbon, fontFamily: 'var(--font-jakarta)' }}
                  value={heroLocationInput}
                  onChange={(e) => {
                    setHeroLocationInput(e.target.value);
                    setShowHeroSuggestions(true);
                  }}
                  onFocus={() => setShowHeroSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowHeroSuggestions(false), 120)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                      e.preventDefault();
                      if (heroLocationSuggestions.length > 0) {
                        addHeroLocation(heroLocationSuggestions[0]);
                        return;
                      }
                      addHeroLocation();
                    }
                    if (e.key === 'Escape') setShowHeroSuggestions(false);
                    if (
                      e.key === 'Backspace' &&
                      heroLocationInput === '' &&
                      heroLocations.length > 0
                    ) {
                      removeHeroLocation(heroLocations[heroLocations.length - 1]);
                    }
                  }}
                />
              </div>
              <button
                onClick={handleHeroBrowse}
                className="shrink-0 px-5 py-3 h-full text-sm font-semibold rounded-r-xl transition-opacity hover:opacity-90"
                style={{ background: C.forest, color: C.parchment }}
              >
                Browse
              </button>
            </div>
            {showHeroSuggestions && heroLocationSuggestions.length > 0 && (
              <ul
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg z-50"
                style={{ background: '#fff', border: `1px solid ${C.cream}` }}
              >
                {heroLocationSuggestions.map((city) => (
                  <li key={city}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left"
                      style={{ color: C.forest, fontFamily: 'var(--font-jakarta)' }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addHeroLocation(city)}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.background = C.cream)
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')
                      }
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: C.terracotta }} />
                      {city}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/register">
              <button
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: C.terracotta,
                  color: '#fff',
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                Get Started Free
              </button>
            </Link>

          </div>
        </div>

        {/* Right — Carbon data panel */}
        <div
          className="flex flex-col justify-center px-8 py-16 lg:px-14 lg:py-20 relative overflow-hidden"
          style={{ background: C.carbon }}
        >
          {/* Grid texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.04,
              backgroundImage: `linear-gradient(${C.egreen} 1px, transparent 1px), linear-gradient(90deg, ${C.egreen} 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10">
            <p
              className="text-xs tracking-[0.2em] uppercase mb-6"
              style={{ color: `${C.egreen}80`, fontFamily: 'var(--font-mono)' }}
            >
              Platform Metrics — Live
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {([
                { val: stats.activeListings.toLocaleString(), label: 'Active Listings' },
                { val: stats.inEscrowUsd, label: 'In Escrow' },
                { val: stats.verifiedUsers.toLocaleString(), label: 'Verified Users' },
                { val: `${stats.completionRate}%`, label: 'Completion Rate' },
              ] as { val: string; label: string }[]).map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg p-4"
                  style={{ background: `${C.egreen}08`, border: `1px solid ${C.egreen}18` }}
                >
                  <div
                    className="text-2xl font-bold mb-0.5 transition-all duration-500"
                    style={{ color: C.egreen, fontFamily: 'var(--font-mono)' }}
                  >
                    {statsLoading ? (
                      <span
                        className="inline-block w-16 h-6 rounded animate-pulse"
                        style={{ background: `${C.egreen}20` }}
                      />
                    ) : (
                      s.val
                    )}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: '#ffffff55', fontFamily: 'var(--font-jakarta)' }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Mini pipeline */}
            <div
              className="rounded-lg p-4 mb-6"
              style={{ background: `${C.egreen}06`, border: `1px solid ${C.egreen}15` }}
            >
              <p
                className="text-xs tracking-widest uppercase mb-3"
                style={{ color: '#ffffff45', fontFamily: 'var(--font-mono)' }}
              >
                Purchase Pipeline — Active Sale
              </p>
              <div className="flex gap-1">
                {STAGES.map((stage, i) => (
                  <div
                    key={stage}
                    className="h-2 flex-1 rounded-sm min-w-[10px]"
                    title={stage}
                    style={{
                      background: i < 5 ? C.egreen : i === 5 ? C.amber : `${C.egreen}18`,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span
                  className="text-xs"
                  style={{ color: C.egreen, fontFamily: 'var(--font-mono)' }}
                >
                  Stage 5 of 14
                </span>
                <span
                  className="text-xs"
                  style={{ color: '#ffffff35', fontFamily: 'var(--font-mono)' }}
                >
                  Deposit & Escrow
                </span>
              </div>
            </div>

            {/* Activity feed */}
            <div className="space-y-2">
              {statsLoading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md px-3 py-2 animate-pulse"
                    style={{ background: '#ffffff06' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${C.egreen}40` }} />
                      <div className="h-3 w-36 rounded" style={{ background: '#ffffff12' }} />
                    </div>
                    <div className="h-3 w-10 rounded" style={{ background: '#ffffff08' }} />
                  </div>
                ))
              ) : stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((a, idx) => {
                  const categoryColors: Record<string, string> = {
                    financial: '#F59E0B',     // amber
                    property:  C.egreen,       // egreen
                    sale:      '#6EE7B7',      // mint green
                    document:  '#60A5FA',      // blue
                    user:      '#C084FC',      // purple
                    construction: C.terracotta,// terracotta
                    general:   '#ffffff50',
                  };
                  const categoryLabels: Record<string, string> = {
                    financial:    'Escrow',
                    property:     'Property',
                    sale:         'Sale',
                    document:     'Document',
                    user:         'User',
                    construction: 'Build',
                    general:      'Platform',
                  };
                  const dotColor = categoryColors[a.category] ?? '#ffffff50';
                  const badge = categoryLabels[a.category] ?? 'Platform';
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md px-3 py-2 gap-3"
                      style={{ background: '#ffffff06' }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}80` }}
                        />
                        <span
                          className="text-xs flex-shrink-0 rounded px-1.5 py-0.5 font-mono uppercase tracking-wide"
                          style={{
                            color: dotColor,
                            background: `${dotColor}18`,
                            fontSize: '9px',
                          }}
                        >
                          {badge}
                        </span>
                        <span className="text-xs truncate" style={{ color: '#ffffffCC' }}>
                          {a.label}
                        </span>
                      </div>
                      <span
                        className="text-xs flex-shrink-0"
                        style={{ color: '#ffffff35', fontFamily: 'var(--font-mono)' }}
                      >
                        {a.timeAgo}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div
                  className="rounded-md px-3 py-3 text-center"
                  style={{ background: '#ffffff06' }}
                >
                  <span className="text-xs" style={{ color: '#ffffff35' }}>No recent activity</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 2 — ROLE SELECTOR
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#fff' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <h2
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: 'var(--font-fraunces)', color: C.carbon }}
            >
              Built for everyone in the deal
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: `${C.carbon}70` }}>
              One platform. Many role-specific experiences.
            </p>
          </div>

          {/* Role pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {ROLES.map((role) => {
              const active = role.id === activeRole;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: active ? C.forest : C.parchment,
                    color: active ? C.parchment : C.forest,
                    border: `1.5px solid ${active ? C.forest : C.cream}`,
                    fontFamily: 'var(--font-jakarta)',
                  }}
                >
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {activeRoleData.features.map((feat) => (
              <div
                key={feat.title}
                className="rounded-xl p-6"
                style={{ background: C.parchment, border: `1px solid ${C.cream}` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: C.forest }}
                >
                  <CheckCircle className="w-5 h-5" style={{ color: C.egreen }} />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}
                >
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: `${C.carbon}80` }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Platform domain bar — always visible */}
          <div className="mt-16 pt-12" style={{ borderTop: `1px solid ${C.cream}` }}>
            <p
              className="text-center text-xs font-bold tracking-widest uppercase mb-8"
              style={{ color: `${C.carbon}40`, fontFamily: 'var(--font-jakarta)' }}
            >
              Everything on one platform
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLATFORM_DOMAINS.map((domain) => {
                const DIcon = domain.icon;
                return (
                  <div
                    key={domain.label}
                    className="rounded-xl p-5 flex gap-4 items-start"
                    style={{ background: C.parchment, border: `1px solid ${C.cream}` }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: `${domain.color}18` }}
                    >
                      <DIcon className="w-4 h-4" style={{ color: domain.color }} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ fontFamily: 'var(--font-jakarta)', color: C.carbon }}
                      >
                        {domain.label}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: `${C.carbon}60` }}>
                        {domain.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 3 — PROPERTY LISTINGS PREVIEW
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: C.parchment }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2
                className="text-4xl md:text-5xl"
                style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}
              >
                Featured properties
              </h2>
              <p className="mt-2 text-base" style={{ color: `${C.forest}80` }}>
                All listings verified with ownership history
              </p>
            </div>
            <Link to="/listings">
              <button
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg"
                style={{
                  color: C.forest,
                  border: `1.5px solid ${C.forest}40`,
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listingsLoading
              ? /* Shimmer skeletons */
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#fff', border: `1px solid ${C.cream}` }}
                  >
                    <div
                      className="h-44 animate-pulse"
                      style={{ background: `${C.forest}18` }}
                    />
                    <div className="p-5 space-y-3">
                      <div className="h-5 rounded animate-pulse" style={{ background: `${C.forest}14`, width: '75%' }} />
                      <div className="h-4 rounded animate-pulse" style={{ background: `${C.forest}10`, width: '50%' }} />
                      <div className="h-3 rounded animate-pulse" style={{ background: `${C.forest}10`, width: '90%' }} />
                      <div className="flex justify-between items-center pt-1">
                        <div className="h-7 rounded animate-pulse" style={{ background: `${C.forest}14`, width: '45%' }} />
                        <div className="h-8 w-16 rounded-lg animate-pulse" style={{ background: `${C.forest}20` }} />
                      </div>
                    </div>
                  </div>
                ))
              : featuredListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="rounded-2xl overflow-hidden transition-shadow hover:shadow-xl"
                    style={{ background: '#fff', border: `1px solid ${C.cream}` }}
                  >
                    {/* Image / placeholder */}
                    <div
                      className="h-44 relative"
                      style={{
                        background: `linear-gradient(135deg, ${C.forest}22 0%, ${C.terracotta}18 100%)`,
                      }}
                    >
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ color: `${C.forest}25` }}
                        >
                          <Building2 className="w-16 h-16" />
                        </div>
                      )}
                      <div
                        className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-bold tracking-widest"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          background: listing.verified ? C.carbon : C.cream,
                          color: listing.verified ? C.egreen : `${C.carbon}70`,
                        }}
                      >
                        {listing.badge}
                      </div>
                      {listing.verified && (
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            background: `${C.egreen}18`,
                            color: C.egreen,
                            border: `1px solid ${C.egreen}40`,
                          }}
                        >
                          <Shield className="w-3 h-3" /> Deed OK
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3
                        className="text-lg font-semibold mb-1"
                        style={{ fontFamily: 'var(--font-fraunces)', color: C.carbon }}
                      >
                        {listing.title}
                      </h3>
                      <div
                        className="flex items-center gap-1.5 text-sm mb-3"
                        style={{ color: `${C.carbon}60` }}
                      >
                        <MapPin className="w-3.5 h-3.5" style={{ color: C.terracotta }} />
                        {listing.location}
                      </div>
                      <div
                        className="flex items-center gap-3 text-xs mb-4"
                        style={{ fontFamily: 'var(--font-mono)', color: `${C.carbon}55` }}
                      >
                        <span>{listing.size}</span>
                        <span style={{ color: C.cream }}>·</span>
                        <span>{listing.type}</span>
                        <span style={{ color: C.cream }}>·</span>
                        <span style={{ color: listing.verified ? C.forest : `${C.carbon}45` }}>
                          {listing.stage}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-2xl font-bold"
                          style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}
                        >
                          {listing.price}
                        </span>
                        <button
                          onClick={() => navigate(`/listings/${listing.id}`)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                          style={{
                            background: C.forest,
                            color: C.parchment,
                            fontFamily: 'var(--font-jakarta)',
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 4 — 14-STAGE PIPELINE VISUAL
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden" style={{ background: C.carbon }}>
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: `linear-gradient(${C.egreen} 1px, transparent 1px), linear-gradient(90deg, ${C.egreen} 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-12">
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4"
              style={{ color: `${C.egreen}70`, fontFamily: 'var(--font-mono)' }}
            >
              Complete Legal Workflow
            </p>
            <h2
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: 'var(--font-fraunces)', color: C.parchment }}
            >
              14 stages from offer to ownership
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#ffffff55' }}>
              Every property purchase tracked through the complete legal process — buyer, agent,
              and conveyancer views in one place.
            </p>
          </div>

          {/* Stage tracker */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-2 min-w-max px-4 mx-auto justify-center">
              {STAGES.map((stage, i) => {
                const done = i < 5;
                const current = i === 5;
                return (
                  <div key={stage} className="flex flex-col items-center gap-2 w-[72px]">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        background: done ? C.egreen : current ? C.amber : 'transparent',
                        borderColor: done ? C.egreen : current ? C.amber : '#ffffff18',
                        color: done ? C.carbon : current ? C.carbon : '#ffffff35',
                      }}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <span
                      className="text-center leading-tight"
                      style={{
                        fontSize: '10px',
                        color: done ? C.egreen : current ? C.amber : '#ffffff28',
                        fontFamily: 'var(--font-jakarta)',
                      }}
                    >
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role callouts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            {[
              {
                role: 'Buyer',
                color: C.egreen,
                desc: 'Track your purchase, upload required documents, and approve stage completions.',
              },
              {
                role: 'Agent',
                color: C.amber,
                desc: 'Coordinate between buyer, seller, and legal teams from one deal workspace.',
              },
              {
                role: 'Conveyancer',
                color: C.terracotta,
                desc: 'Manage compliance docs, government submissions, and transfer registrations.',
              },
            ].map((c) => (
              <div
                key={c.role}
                className="rounded-xl p-6"
                style={{ background: '#ffffff06', border: '1px solid #ffffff10' }}
              >
                <div
                  className="text-xs font-bold tracking-widest uppercase mb-2"
                  style={{ color: c.color, fontFamily: 'var(--font-mono)' }}
                >
                  {c.role}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#ffffff65' }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 5 — TRUST STATS BAR
      ─────────────────────────────────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ background: C.parchment, borderTop: `1px solid ${C.cream}` }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-5xl md:text-6xl leading-none mb-2"
                  style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}
                >
                  {stat.number}
                </div>
                <div
                  className="text-base font-semibold mb-1"
                  style={{ color: C.carbon, fontFamily: 'var(--font-jakarta)' }}
                >
                  {stat.label}
                </div>
                <div className="text-xs" style={{ color: `${C.carbon}55` }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 6 — FOR THE DIASPORA
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#fff' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — editorial pull-quote */}
            <div>
              <p
                className="text-xs tracking-[0.2em] uppercase mb-6"
                style={{ color: C.terracotta, fontFamily: 'var(--font-mono)' }}
              >
                For the Diaspora
              </p>
              <blockquote
                className="text-3xl md:text-4xl leading-snug mb-8"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontStyle: 'italic',
                  color: C.carbon,
                }}
              >
                &ldquo;I invested from London. Every brick was tracked. I never had to wonder if
                the work was actually happening.&rdquo;
              </blockquote>
              <cite
                className="not-italic text-sm font-semibold"
                style={{ color: `${C.carbon}55`, fontFamily: 'var(--font-jakarta)' }}
              >
                — Chidi O., UK-based investor, Harare property owner
              </cite>
            </div>

            {/* Right — feature bullets */}
            <div className="space-y-7">
              {[
                {
                  icon: Camera,
                  title: 'Geo-tagged progress photos',
                  desc: 'EXIF metadata validated — every photo timestamped and location-matched to your site coordinates. No staged photos, no deception.',
                  color: C.terracotta,
                },
                {
                  icon: Globe,
                  title: 'Independent site inspections',
                  desc: 'Book a certified inspector anytime, from anywhere. Report delivered within 48h with full photo documentation.',
                  color: C.forest,
                },
                {
                  icon: Lock,
                  title: 'Milestone-locked payments',
                  desc: 'Your funds released only when work is verified and inspected. No completion certificate = no payment.',
                  color: C.amber,
                },
              ].map((feat) => (
                <div key={feat.title} className="flex items-start gap-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${feat.color}15` }}
                  >
                    <feat.icon className="w-5 h-5" style={{ color: feat.color }} />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold mb-1"
                      style={{ fontFamily: 'var(--font-fraunces)', color: C.carbon }}
                    >
                      {feat.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: `${C.carbon}65` }}>
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 7 — PROJECT MANAGEMENT
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden" style={{ background: C.carbon }}>
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: `linear-gradient(${C.egreen} 1px, transparent 1px), linear-gradient(90deg, ${C.egreen} 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-12">
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4"
              style={{ color: `${C.egreen}70`, fontFamily: 'var(--font-mono)' }}
            >
              Construction Management
            </p>
            <h2
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: 'var(--font-fraunces)', color: C.parchment }}
            >
              Build it right — every stage verified
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#ffffff55' }}>
              Track 11 construction stages with budget vs actual, milestone payments, and
              geo-tagged progress photos — all in one project dashboard.
            </p>
          </div>

          {/* 11-stage tracker */}
          <div className="overflow-x-auto pb-4 mb-12">
            <div className="flex gap-2 min-w-max px-4 mx-auto justify-center">
              {CONSTRUCTION_STAGES.map((stage, i) => {
                const done = i < 4;
                const current = i === 4;
                return (
                  <div key={stage} className="flex flex-col items-center gap-2 w-[72px]">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        background: done ? C.egreen : current ? C.amber : 'transparent',
                        borderColor: done ? C.egreen : current ? C.amber : '#ffffff18',
                        color: done ? C.carbon : current ? C.carbon : '#ffffff35',
                      }}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <span
                      className="text-center leading-tight"
                      style={{
                        fontSize: '10px',
                        color: done ? C.egreen : current ? C.amber : '#ffffff28',
                        fontFamily: 'var(--font-jakarta)',
                      }}
                    >
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Callout cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: BarChart3,
                color: C.egreen,
                title: 'Budget vs Actual',
                desc: 'Real-time cost tracking with categorised line items. See exactly where every dollar goes.',
              },
              {
                icon: Zap,
                color: C.amber,
                title: 'Milestone Payments',
                desc: 'Funds auto-released when inspection approves each stage. No approval = no payment.',
              },
              {
                icon: Cpu,
                color: C.terracotta,
                title: 'AI BOQ Generation',
                desc: 'Upload architectural plans — AI generates your full materials list in minutes.',
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-xl p-6"
                style={{ background: '#ffffff06', border: '1px solid #ffffff10' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${c.color}18` }}
                >
                  <c.icon className="w-5 h-5" style={{ color: c.color }} />
                </div>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-fraunces)', color: C.parchment }}
                >
                  {c.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#ffffff45' }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/construction">
              <button
                className="px-8 py-3.5 rounded-xl font-semibold text-base transition-opacity hover:opacity-90"
                style={{ background: C.egreen, color: C.carbon, fontFamily: 'var(--font-jakarta)' }}
              >
                Start a Project
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 8 — SUPPLIES MARKETPLACE
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#fff' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4"
              style={{ color: C.terracotta, fontFamily: 'var(--font-mono)' }}
            >
              Supplier Marketplace
            </p>
            <h2
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: 'var(--font-fraunces)', color: C.carbon }}
            >
              Your complete supply chain, one platform
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: `${C.carbon}60` }}>
              From architectural plans to doorstep delivery — procure smarter.
            </p>
          </div>

          {/* 4-step flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Upload, step: 1, title: 'Upload Plans', desc: 'Drop your architectural drawings or sketches.' },
              { icon: Cpu, step: 2, title: 'AI Generates BOQ', desc: 'Materials list auto-generated in minutes.' },
              { icon: Layers, step: 3, title: 'Compare 3 Tiers', desc: 'Budget, recommended & premium pricing side-by-side.' },
              { icon: ShoppingCart, step: 4, title: 'Place Order', desc: 'Order direct from verified suppliers, tracked to site.' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
                  style={{ background: C.forest }}
                >
                  <s.icon className="w-5 h-5" style={{ color: C.parchment }} />
                </div>
                <div
                  className="text-xs font-bold tracking-[0.15em] uppercase mb-1"
                  style={{ color: C.terracotta, fontFamily: 'var(--font-mono)' }}
                >
                  Step {s.step}
                </div>
                <h3
                  className="text-base font-semibold mb-1"
                  style={{ fontFamily: 'var(--font-fraunces)', color: C.carbon }}
                >
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: `${C.carbon}60` }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {['Cement', 'Steel', 'Timber', 'Electrical', 'Plumbing', 'Fixtures', 'Roofing', 'Hardware'].map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  background: C.parchment,
                  color: C.forest,
                  border: `1px solid ${C.cream}`,
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { val: '10,000+', label: 'Materials', sub: 'in catalogue' },
              { val: '3', label: 'Pricing Tiers', sub: 'budget · recommended · premium' },
              { val: 'Real-time', label: 'Price Index', sub: 'live market rates' },
              { val: 'RFQ', label: 'Bulk Quotes', sub: 'multi-supplier responses' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-5 text-center"
                style={{ background: C.parchment, border: `1px solid ${C.cream}` }}
              >
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}
                >
                  {s.val}
                </div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: C.carbon }}>
                  {s.label}
                </div>
                <div className="text-xs" style={{ color: `${C.carbon}55` }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/suppliers">
              <button
                className="px-8 py-3.5 rounded-xl font-semibold text-base transition-opacity hover:opacity-90"
                style={{ background: C.forest, color: C.parchment, fontFamily: 'var(--font-jakarta)' }}
              >
                Browse Suppliers
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 9 — DELIVERY & LOGISTICS
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: C.parchment }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — features */}
            <div>
              <p
                className="text-xs tracking-[0.2em] uppercase mb-4"
                style={{ color: C.amber, fontFamily: 'var(--font-mono)' }}
              >
                Logistics & Transport
              </p>
              <h2
                className="text-4xl md:text-5xl mb-6"
                style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}
              >
                Materials delivered, tracked, proven
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: `${C.forest}80` }}>
                On-demand truck operators matched to your job. Every delivery GPS-tracked with
                photo proof and digital signature on completion.
              </p>

              <div className="space-y-5 mb-8">
                {[
                  { icon: Navigation, color: C.terracotta, title: 'Real-time GPS Tracking', desc: 'Track your delivery from depot to site on a live map.' },
                  { icon: PackageCheck, color: C.forest, title: 'Photo Proof on Delivery', desc: 'Driver uploads geo-tagged photos on completion.' },
                  { icon: Truck, color: C.amber, title: 'Intelligent Driver Matching', desc: 'Algorithm matches truck type, proximity, and rating to your job.' },
                  { icon: Shield, color: C.egreen, title: 'Digital Signatures', desc: 'Immutable delivery confirmations accepted on mobile, even offline.' },
                ].map((feat) => (
                  <div key={feat.title} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${feat.color}15` }}
                    >
                      <feat.icon className="w-5 h-5" style={{ color: feat.color }} />
                    </div>
                    <div>
                      <h3
                        className="text-base font-semibold mb-0.5"
                        style={{ fontFamily: 'var(--font-fraunces)', color: C.carbon }}
                      >
                        {feat.title}
                      </h3>
                      <p className="text-sm" style={{ color: `${C.carbon}65` }}>
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Link to="/logistics">
                  <button
                    className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                    style={{ background: C.forest, color: C.parchment, fontFamily: 'var(--font-jakarta)' }}
                  >
                    Register as Operator
                  </button>
                </Link>
                <Link to="/logistics/track">
                  <button
                    className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                    style={{
                      background: 'transparent',
                      color: C.forest,
                      border: `1.5px solid ${C.forest}60`,
                      fontFamily: 'var(--font-jakarta)',
                    }}
                  >
                    Track a Delivery
                  </button>
                </Link>
              </div>
            </div>

            {/* Right — dark live panel */}
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ background: C.carbon, minHeight: '420px', border: `1px solid ${C.forest}30` }}
            >
              {/* Grid texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: 0.05,
                  backgroundImage: `linear-gradient(${C.egreen} 1px, transparent 1px), linear-gradient(90deg, ${C.egreen} 1px, transparent 1px)`,
                  backgroundSize: '32px 32px',
                }}
              />
              <div className="relative z-10 p-6">
                <div
                  className="text-xs tracking-[0.2em] uppercase mb-5"
                  style={{ color: `${C.amber}80`, fontFamily: 'var(--font-mono)' }}
                >
                  Live Deliveries
                </div>

                <div className="space-y-3">
                  {[
                    { op: 'Chenai M.', truck: '5t Flatbed', cargo: '40 bags cement', dist: '12 km', status: 'En Route', statusC: C.amber },
                    { op: 'Farai T.', truck: '3t Lorry', cargo: 'Steel rods × 20', dist: '4 km', status: 'Delivered', statusC: C.egreen },
                    { op: 'Blessing R.', truck: '8t Tipper', cargo: 'River sand — 6m³', dist: '22 km', status: 'Matched', statusC: `${C.egreen}88` },
                  ].map((d, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-4"
                      style={{ background: '#ffffff06', border: '1px solid #ffffff0C' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div
                            className="text-sm font-semibold mb-0.5"
                            style={{ color: '#ffffffCC', fontFamily: 'var(--font-jakarta)' }}
                          >
                            {d.op}
                          </div>
                          <div
                            className="text-xs mb-1"
                            style={{ color: '#ffffff55', fontFamily: 'var(--font-mono)' }}
                          >
                            {d.truck}
                          </div>
                          <div className="text-xs" style={{ color: '#ffffff40' }}>
                            {d.cargo} · {d.dist}
                          </div>
                        </div>
                        <div
                          className="text-xs font-bold px-2 py-1 rounded shrink-0"
                          style={{
                            background: `${d.statusC}18`,
                            color: d.statusC,
                            border: `1px solid ${d.statusC}30`,
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {d.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live blip */}
                <div className="flex items-center gap-2 mt-5 px-1">
                  <div className="relative w-3 h-3 shrink-0">
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: `${C.egreen}50` }}
                    />
                    <div className="w-3 h-3 rounded-full" style={{ background: C.egreen }} />
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: '#ffffff35', fontFamily: 'var(--font-mono)' }}
                  >
                    3 active deliveries in your area
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 10 — FINAL CTA
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ background: C.carbon }}>
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage: `linear-gradient(${C.egreen} 1px, transparent 1px), linear-gradient(90deg, ${C.egreen} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Green glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full blur-3xl pointer-events-none"
          style={{
            width: '600px',
            height: '300px',
            background: `radial-gradient(ellipse, ${C.egreen}22, transparent 70%)`,
          }}
        />

        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <h2
            className="text-4xl md:text-6xl mb-6 mx-auto max-w-3xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              color: C.parchment,
              lineHeight: 1.1,
            }}
          >
            Your property journey starts here.
          </h2>
          <p
            className="text-lg mb-10 max-w-lg mx-auto"
            style={{ color: '#ffffff55' }}
          >
            Join thousands of buyers, investors, agents, and builders on Africa&apos;s most
            transparent real estate platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/properties">
              <button
                className="px-8 py-3.5 rounded-xl font-semibold text-base transition-opacity hover:opacity-90"
                style={{
                  background: C.parchment,
                  color: C.carbon,
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                Browse Properties
              </button>
            </Link>
            <Link to="/register">
              <button
                className="px-8 py-3.5 rounded-xl font-semibold text-base transition-colors hover:bg-white/10"
                style={{
                  background: 'transparent',
                  color: C.egreen,
                  border: `1.5px solid ${C.egreen}`,
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                Create Account
              </button>
            </Link>
          </div>

          {/* Trust micro-proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
            {[
              { icon: Shield, label: 'Verified Listings' },
              { icon: Lock, label: 'Escrow Protected' },
              { icon: TrendingUp, label: 'Live Progress' },
              { icon: CheckCircle, label: 'Legal Compliance' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm"
                style={{ color: '#ffffff35', fontFamily: 'var(--font-jakarta)' }}
              >
                <item.icon className="w-4 h-4" style={{ color: '#ffffff28' }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 11 — CONTACT
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: C.forest }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4"
              style={{ color: `${C.egreen}90`, fontFamily: 'var(--font-mono)' }}
            >
              Get in Touch
            </p>
            <h2
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: 'var(--font-fraunces)', color: C.parchment }}
            >
              We&apos;re here to help
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: `${C.parchment}80` }}>
              Questions about buying, building, or investing? Our team is on hand.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left — FAQ accordion */}
            <div>
              <h3
                className="text-xl font-semibold mb-6"
                style={{ fontFamily: 'var(--font-fraunces)', color: C.parchment }}
              >
                Common Questions
              </h3>
              <div className="space-y-3">
                {FAQ_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden"
                    style={{ background: `${C.parchment}10`, border: `1px solid ${C.parchment}18` }}
                  >
                    <button
                      className="w-full flex items-center justify-between text-left px-5 py-4"
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    >
                      <span
                        className="text-sm font-semibold pr-4"
                        style={{ color: C.parchment, fontFamily: 'var(--font-jakarta)' }}
                      >
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200${activeFaq === i ? ' rotate-180' : ''}`}
                        style={{ color: `${C.egreen}80` }}
                      />
                    </button>
                    {activeFaq === i && (
                      <div className="px-5 pb-4">
                        <p className="text-sm leading-relaxed" style={{ color: `${C.parchment}75` }}>
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Contact form */}
            <div>
              <h3
                className="text-xl font-semibold mb-6"
                style={{ fontFamily: 'var(--font-fraunces)', color: C.parchment }}
              >
                Send us a message
              </h3>

              {/* Success state */}
              {contactStatus === 'success' ? (
                <div
                  className="rounded-2xl p-8 flex flex-col items-center text-center gap-4"
                  style={{ background: `${C.egreen}15`, border: `1px solid ${C.egreen}40` }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: `${C.egreen}20` }}
                  >
                    <CheckCircle className="w-7 h-7" style={{ color: C.egreen }} />
                  </div>
                  <div>
                    <p className="text-base font-semibold mb-1" style={{ color: C.parchment, fontFamily: 'var(--font-fraunces)' }}>
                      Message sent!
                    </p>
                    <p className="text-sm" style={{ color: `${C.parchment}75`, fontFamily: 'var(--font-jakarta)' }}>
                      We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleContactSubmit} noValidate>
                  {/* Hidden honeypot — must stay visually and functionally invisible */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        onBlur={(e) => handleContactBlur('name', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{
                          background: `${C.parchment}12`,
                          border: `1px solid ${contactErrors.name ? '#ef4444' : `${C.parchment}25`}`,
                          color: C.parchment,
                          fontFamily: 'var(--font-jakarta)',
                        }}
                      />
                      {contactErrors.name && (
                        <p className="text-xs mt-1" style={{ color: '#f87171', fontFamily: 'var(--font-jakarta)' }}>
                          {contactErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        onBlur={(e) => handleContactBlur('email', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{
                          background: `${C.parchment}12`,
                          border: `1px solid ${contactErrors.email ? '#ef4444' : `${C.parchment}25`}`,
                          color: C.parchment,
                          fontFamily: 'var(--font-jakarta)',
                        }}
                      />
                      {contactErrors.email && (
                        <p className="text-xs mt-1" style={{ color: '#f87171', fontFamily: 'var(--font-jakarta)' }}>
                          {contactErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <select
                      value={contactSubject}
                      onChange={(e) => { setContactSubject(e.target.value); handleContactBlur('subject', e.target.value); }}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: C.forest,
                        border: `1px solid ${contactErrors.subject ? '#ef4444' : `${C.parchment}25`}`,
                        color: contactSubject ? C.parchment : `${C.parchment}60`,
                        fontFamily: 'var(--font-jakarta)',
                      }}
                    >
                      <option value="">Select a subject</option>
                      <option value="buying">Buying Property</option>
                      <option value="construction">Construction Project</option>
                      <option value="suppliers">Supplies &amp; Materials</option>
                      <option value="logistics">Logistics &amp; Delivery</option>
                      <option value="invest">Diaspora Investment</option>
                      <option value="other">Other</option>
                    </select>
                    {contactErrors.subject && (
                      <p className="text-xs mt-1" style={{ color: '#f87171', fontFamily: 'var(--font-jakarta)' }}>
                        {contactErrors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <textarea
                      rows={5}
                      placeholder="Your message…"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      onBlur={(e) => handleContactBlur('message', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{
                        background: `${C.parchment}12`,
                        border: `1px solid ${contactErrors.message ? '#ef4444' : `${C.parchment}25`}`,
                        color: C.parchment,
                        fontFamily: 'var(--font-jakarta)',
                      }}
                    />
                    <div className="flex justify-between mt-1">
                      {contactErrors.message ? (
                        <p className="text-xs" style={{ color: '#f87171', fontFamily: 'var(--font-jakarta)' }}>
                          {contactErrors.message}
                        </p>
                      ) : <span />}
                      <p className="text-xs" style={{ color: `${C.parchment}40`, fontFamily: 'var(--font-jakarta)' }}>
                        {contactMessage.length}/2000
                      </p>
                    </div>
                  </div>

                  {/* Server-side error */}
                  {contactStatus === 'error' && contactServerMsg && (
                    <div
                      className="rounded-xl px-4 py-3 text-sm"
                      style={{ background: '#ef444420', border: '1px solid #ef444450', color: '#fca5a5', fontFamily: 'var(--font-jakarta)' }}
                    >
                      {contactServerMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={contactStatus === 'submitting'}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                    style={{
                      background: contactStatus === 'submitting' ? `${C.egreen}80` : C.egreen,
                      color: C.carbon,
                      fontFamily: 'var(--font-jakarta)',
                      cursor: contactStatus === 'submitting' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {contactStatus === 'submitting' ? (
                      <>
                        <span
                          className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: C.carbon }}
                        />
                        Sending…
                      </>
                    ) : 'Send Message'}
                  </button>
                </form>
              )}

              {/* Contact details */}
              <div className="flex flex-wrap gap-6 mt-6">
                <a
                  href="mailto:hello@buildtrust.io"
                  className="flex items-center gap-2 text-sm transition-opacity hover:opacity-90"
                  style={{ color: `${C.parchment}70`, fontFamily: 'var(--font-jakarta)' }}
                >
                  <Mail className="w-4 h-4" style={{ color: C.egreen }} />
                  hello@buildtrust.io
                </a>
                <a
                  href="https://wa.me/27000000000"
                  className="flex items-center gap-2 text-sm transition-opacity hover:opacity-90"
                  style={{ color: `${C.parchment}70`, fontFamily: 'var(--font-jakarta)' }}
                >
                  <MessageSquare className="w-4 h-4" style={{ color: C.egreen }} />
                  WhatsApp Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

