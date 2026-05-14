'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/lib/router-compat";
import {
  Home,
  Heart,
  Calendar,
  Bell,
  Settings,
  Search,
  ChevronRight,
  FileText,
  Hammer,
  Shield,
  BedDouble,
  Bath,
  Maximize,
  Star,
  Wallet,
  Activity,
  ArrowUpRight,
  BarChart3,
  Plus,
  Filter,
  Loader2,
  Bookmark,
  ShoppingCart,
  AlertOctagon,
  MapPin,
  Video,
  Clock,
  ChevronDown,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowUpDown,
  User,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import {
  propertiesApi,
  auditApi,
  usersApi,
  buyerOffersApi,
  viewingsApi,
  PropertyListing,
  AgentProfileResponse,
  AuditLogEntry,
  AuthUser,
  BuyerOfferResponse,
  ViewingResponse,
} from "@/lib/api-client";
import { useMyOfferPropertyIds } from "@/hooks/useMyOfferPropertyIds";
import { getAccessToken, getStoredUser, getIsAdminFromToken, getActiveCompanyContext } from "@/lib/auth-session";
import { formatRelativeTime } from "@/lib/formatters";
import { RespondToCounterOfferModal } from "@/components/buyer/RespondToCounterOfferModal";

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const C = {
  forest:       '#1A3C28',
  forestLight:  '#2D5A40',
  parchment:    '#F2E8D5',
  cream:        '#EAD9C4',
  carbon:       '#0C0D10',
  egreen:       '#00E87A',
  amber:        '#B89040',
  muted:        '#5A7A68',
  border:       'rgba(26,60,40,0.12)',
  borderStrong: 'rgba(26,60,40,0.24)',
} as const;

const FRAUNCES = 'var(--font-fraunces, "Fraunces", Georgia, serif)';

const DEFAULT_PROP_IMAGE =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop';

// ─── Purchase pipeline data ───────────────────────────────────────────────────

const PURCHASE_STAGES = [
  'Property Search & Viewing',
  'Offer Submission',
  'Offer Accepted / Negotiation',
  'Sale Agreement (OTP)',
  'Deposit Payment & Escrow',
  'Title Deed Search & Verification',
  'Mortgage / Financing Approval',
  'Property Inspection & Due Diligence',
  'Compliance Certificates',
  'Transfer Docs Preparation',
  'Deeds Office Registration',
  'Transfer Duty Payment',
  'Final Payment & Registration',
  'Post-Purchase',
];

const PIPELINE_PHASES: Array<{ label: string; start: number; end: number }> = [
  { label: 'Offer',         start: 1,  end: 4  },
  { label: 'Finance',       start: 5,  end: 7  },
  { label: 'Due Diligence', start: 8,  end: 9  },
  { label: 'Transfer',      start: 10, end: 14 },
];

const STAGE_CHECKLISTS: Record<number, Array<{ text: string; done: boolean }>> = {
  2: [
    { text: 'Offer submitted',              done: true  },
    { text: 'Buyer ID verified',            done: true  },
    { text: 'Seller review in progress',    done: false },
    { text: 'Seller response received',     done: false },
  ],
  3: [
    { text: 'Initial offer submitted',           done: true  },
    { text: 'Seller response received',          done: true  },
    { text: 'Respond to counter-offer',          done: false },
    { text: 'Agree on final purchase price',     done: false },
    { text: 'Sign Offer to Purchase (OTP)',      done: false },
  ],
  4: [
    { text: 'Counter-offer accepted',       done: true  },
    { text: 'OTP signed by both parties',  done: false },
    { text: 'Deposit amount confirmed',    done: false },
    { text: 'Conveyancer to be assigned',  done: false },
  ],
};

function offerStageInfo(status: BuyerOfferResponse['status']): { stageNum: number; stageLabel: string } {
  if (status === 'countered' || status === 'buyer_countered') return { stageNum: 3, stageLabel: 'Offer / Negotiation' };
  if (status === 'accepted')  return { stageNum: 4, stageLabel: 'Sale Agreement'       };
  return                             { stageNum: 2, stageLabel: 'Offer Submission'      };
}

function fmtMoney(amount: string): string {
  const n = Number(amount);
  if (isNaN(n)) return amount;
  return `R ${n.toLocaleString()}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (_) {
    return iso;
  }
}

function fmtViewingTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (_) { return iso; }
}

function fmtViewingTimeRange(iso: string, durationMinutes: number | null): string {
  try {
    const start = new Date(iso);
    const startStr = start.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (!durationMinutes) return startStr;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const endStr = end.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${startStr} – ${endStr}`;
  } catch (_) { return iso; }
}

function fmtViewingPastDate(iso: string): string {
  try {
    const date = new Date(iso);
    const day = date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
    const time = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} · ${time}`;
  } catch (_) { return iso; }
}

function fmtViewingDateLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  } catch (_) { return iso; }
}

type ViewingGroup = 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'later';

function getViewingGroup(scheduledAt: string): ViewingGroup {
  const now = new Date();
  const date = new Date(scheduledAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const viewingDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((viewingDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff < 7) return 'this-week';
  if (diff < 14) return 'next-week';
  return 'later';
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DerivedNotification = {
  id: string;
  type: 'property' | 'purchase' | 'construction' | 'fraud' | 'kyc' | 'general';
  title: string;
  description: string;
  time: string;
  unread: boolean;
};

type SavedPropertyItem = {
  id: string;
  image: string;
  price: string;
  currency: string;
  address: string;
  beds: number | null;
  baths: number | null;
  sqm: string | null;
  verified: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function auditToNotification(entry: AuditLogEntry): DerivedNotification {
  const action = entry.action.toLowerCase();
  let type: DerivedNotification['type'] = 'general';
  let title = 'Activity';
  let description = `Action: ${entry.action}`;

  if (action.includes('property') || entry.resourceType === 'property') {
    type = 'property';
    if (action.includes('save')) {
      title = 'Property saved';
      description = 'You added a property to your favourites';
    } else if (action.includes('inquiry') || action.includes('viewing')) {
      title = 'Viewing inquiry submitted';
      description = 'Your viewing request has been sent to the agent';
    } else if (action.includes('create') || action.includes('list')) {
      title = 'Listing created';
      description = 'Your property listing has been published';
    } else if (action.includes('fraud')) {
      type = 'fraud';
      title = 'Fraud report submitted';
      description = 'Your report is under review';
    } else {
      title = 'Property update';
      description = `${entry.resourceType}: ${entry.action}`;
    }
  } else if (action.includes('kyc')) {
    type = 'kyc';
    title = 'KYC update';
    description = `KYC status changed: ${entry.action}`;
  } else if (action.includes('login') || action.includes('register')) {
    type = 'general';
    title = 'Account activity';
    description = `${entry.action}`;
  } else if (action.includes('purchase') || action.includes('stage') || action.includes('offer')) {
    type = 'purchase';
    title = 'Purchase update';
    description = entry.action;
  }

  return {
    id: entry.id,
    type,
    title,
    description,
    time: formatRelativeTime(entry.createdAt),
    unread: false,
  };
}

function listingToSaved(p: PropertyListing): SavedPropertyItem {
  const primary = p.media?.find((m) => m.is_primary) ?? p.media?.[0];
  const loc = [p.location?.city, p.location?.region, p.location?.country]
    .filter(Boolean)
    .join(', ');
  return {
    id: p.id,
    image: primary?.thumbnail_url ?? primary?.url ?? DEFAULT_PROP_IMAGE,
    price: `${p.currency} ${Number(p.price).toLocaleString()}`,
    currency: p.currency,
    address: p.title + (loc ? ` — ${loc}` : ''),
    beds: p.bedrooms ?? null,
    baths: p.bathrooms ?? null,
    sqm: p.area_sqm ?? null,
    verified: p.verification_status === 'verified',
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SprintBadge({ label }: { label: string }) {
  if (!label) return null;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: `${C.amber}22`, color: C.amber, border: `1px solid ${C.amber}44` }}
    >
      {label}
    </span>
  );
}

function ComingSoonCard({
  icon: Icon,
  title,
  description,
  sprint,
  actions,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  sprint: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-10 text-center"
      style={{ background: 'white', border: `1.5px dashed ${C.border}` }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: `${C.forest}10` }}
      >
        <Icon className="w-8 h-8" style={{ color: `${C.forest}50` }} />
      </div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <h3
          className="font-medium text-base"
          style={{ fontFamily: FRAUNCES, color: C.forest }}
        >
          {title}
        </h3>
        <SprintBadge label={sprint} />
      </div>
      <p className="text-sm max-w-sm mx-auto mb-5" style={{ color: C.muted }}>
        {description}
      </p>
      {actions && <div className="flex gap-3 justify-center">{actions}</div>}
    </div>
  );
}

function PrimaryBtn({
  to,
  children,
  onClick,
}: {
  to?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
      style={{ background: C.forest, color: C.parchment }}
    >
      {children}
    </button>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function OutlineBtn({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to}>
      <button
        className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}` }}
      >
        {children}
      </button>
    </Link>
  );
}

const ACTIVITY_CFG: Record<
  DerivedNotification['type'],
  { bg: string; color: string; Icon: React.ElementType }
> = {
  purchase:     { bg: `${C.amber}18`,    color: C.amber,        Icon: FileText     },
  construction: { bg: '#C4562A18',       color: '#C4562A',      Icon: Hammer       },
  fraud:        { bg: '#DC262618',       color: '#DC2626',      Icon: AlertOctagon },
  kyc:          { bg: `${C.forest}18`,   color: C.forest,       Icon: Shield       },
  property:     { bg: `${C.egreen}18`,   color: C.forestLight,  Icon: Home         },
  general:      { bg: `${C.forest}10`,   color: C.muted,        Icon: Activity     },
};

function ActivityIcon({ type }: { type: DerivedNotification['type'] }) {
  const { bg, color, Icon } = ACTIVITY_CFG[type] ?? ACTIVITY_CFG.general;
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: bg }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
  );
}

function PurchaseCard({
  offer,
  property,
  isExpanded,
  onToggle,
  onRespond,
}: {
  offer: BuyerOfferResponse;
  property?: PropertyListing;
  isExpanded: boolean;
  onToggle: () => void;
  onRespond?: (offer: BuyerOfferResponse) => void;
}) {
  const { stageNum, stageLabel } = offerStageInfo(offer.status);
  const isActionNeeded = offer.status === 'countered';

  const [agentProfile, setAgentProfile] = useState<AgentProfileResponse | null>(null);
  useEffect(() => {
    if (isExpanded && property?.agent_id && !agentProfile) {
      propertiesApi.getAgentProfile(property.agent_id).then((res) => {
        if (res.data) setAgentProfile(res.data);
      }).catch(() => { /* silently ignore */ });
    }
  }, [isExpanded, property?.agent_id]);

  const address = property
    ? [property.location?.city, property.location?.region, property.location?.country]
        .filter(Boolean)
        .join(', ')
    : '';

  const imgUrl =
    property?.media?.find((m) => m.is_primary)?.url ??
    property?.media?.[0]?.url ??
    DEFAULT_PROP_IMAGE;

  const title = property?.title ?? `Property #${offer.property_id.slice(0, 8)}`;
  const checklist = (STAGE_CHECKLISTS[stageNum] ?? STAGE_CHECKLISTS[2]).map((item) => ({
    ...item,
    done: item.text === 'Respond to counter-offer'
      ? offer.status !== 'countered'   // checked once buyer has responded
      : item.done,
  }));

  function dotState(s: number): 'done' | 'active' | 'pending' {
    if (s < stageNum) return 'done';
    if (s === stageNum) return 'active';
    return 'pending';
  }

  const bannerData: Record<string, { icon: string; title: string; sub: string; cta: string | null }> = {
    submitted: {
      icon: '🕐',
      title: 'Offer submitted — awaiting seller response',
      sub: `Offer: ${fmtMoney(offer.amount)} · Expires ${fmtDate(offer.expires_at)}`,
      cta: null,
    },
    pending: {
      icon: '🕐',
      title: 'Offer under review',
      sub: `Submitted ${fmtDate(offer.submitted_at)} · Expires ${fmtDate(offer.expires_at)}`,
      cta: null,
    },
    countered: {
      icon: '⚡',
      title: 'Counter-offer received',
      sub: `Seller responded · Expires ${fmtDate(offer.expires_at)} · Original: ${fmtMoney(offer.amount)}`,
      cta: 'Respond Now',
    },
    buyer_countered: {
      icon: '🔄',
      title: 'Your counter-offer sent — awaiting seller response',
      sub: `Counter: ${fmtMoney(offer.counter_amount ?? offer.amount)} · Expires ${fmtDate(offer.expires_at)}`,
      cta: null,
    },
    accepted: {
      icon: '✅',
      title: 'Offer accepted — purchase in progress',
      sub: `${fmtMoney(offer.amount)} accepted`,
      cta: 'View Agreement',
    },
    withdrawn: { icon: '⛔', title: 'Offer withdrawn',  sub: '', cta: null },
    rejected:  { icon: '⛔', title: 'Offer rejected',   sub: '', cta: null },
  };
  const banner = bannerData[offer.status] ?? bannerData.submitted;

  const nextStepText: Record<string, string> = {
    submitted: "Waiting for seller review — you'll be notified when they respond",
    pending:   'Your offer is under review — check back soon',
    countered: "Accept, counter, or decline seller's counter-offer",
    buyer_countered: 'Seller response — your counter-offer is with the seller',
    accepted:  'Proceed to sale agreement and deposit payment',
    withdrawn: 'Offer withdrawn',
    rejected:  'Offer declined',
  };

  const bannerBgMap: Record<string, { bg: string; border: string }> = {
    submitted: { bg: 'rgba(0,232,122,0.06)',  border: 'rgba(0,232,122,0.25)'  },
    pending:   { bg: 'rgba(0,232,122,0.06)',  border: 'rgba(0,232,122,0.25)'  },
    countered: { bg: 'rgba(184,144,64,0.06)', border: 'rgba(184,144,64,0.25)' },
    buyer_countered: { bg: 'rgba(0,232,122,0.06)', border: 'rgba(0,232,122,0.25)' },
    accepted:  { bg: 'rgba(26,60,40,0.05)',   border: 'rgba(26,60,40,0.15)'   },
    withdrawn: { bg: 'rgba(196,86,42,0.06)',  border: 'rgba(196,86,42,0.25)'  },
    rejected:  { bg: 'rgba(196,86,42,0.06)',  border: 'rgba(196,86,42,0.25)'  },
  };
  const bannerBg = bannerBgMap[offer.status] ?? bannerBgMap.submitted;

  const depositDisplay =
    offer.deposit_amount && Number(offer.deposit_amount) > 0
      ? fmtMoney(offer.deposit_amount)
      : `${fmtMoney(String(Math.round(Number(offer.amount) * 0.1)))} (est. 10%)`;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-shadow duration-200"
      style={{
        background: 'white',
        border: `1px solid ${isExpanded ? C.borderStrong : C.border}`,
        boxShadow: isExpanded ? '0 8px 32px rgba(26,60,40,0.10)' : undefined,
      }}
    >
      {/* Main card row */}
      <div
        className="grid cursor-pointer"
        style={{ gridTemplateColumns: '200px 1fr' }}
        onClick={onToggle}
      >
        {/* Property image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          alt={title}
          className="w-full object-cover"
          style={{ minHeight: 200, maxHeight: 280 }}
        />

        {/* Card body */}
        <div className="p-5 flex flex-col gap-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div style={{ minWidth: 0 }}>
              <div
                className="font-medium leading-tight"
                style={{ fontFamily: FRAUNCES, fontSize: 20, color: C.forest, letterSpacing: '-0.4px' }}
              >
                {fmtMoney(offer.amount)}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: C.muted }}>
                {title}{address ? ` · ${address}` : ''}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {isActionNeeded ? (
                <>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: 'rgba(184,144,64,0.1)', color: C.amber, border: '1px solid rgba(184,144,64,0.3)' }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, display: 'inline-block' }} />
                    Counter-Offer
                  </span>
                  <span
                    className="text-xs rounded-full px-2.5 py-1 font-bold"
                    style={{ background: 'rgba(196,86,42,0.1)', color: '#C4562A', border: '1px solid rgba(196,86,42,0.25)' }}
                  >
                    ACTION NEEDED
                  </span>
                </>
              ) : offer.status === 'accepted' ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: 'rgba(26,60,40,0.07)', color: C.forest, border: `1px solid ${C.borderStrong}` }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.egreen, display: 'inline-block' }} />
                  Accepted
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: 'rgba(0,232,122,0.1)', color: '#1A7A40', border: '1px solid rgba(0,232,122,0.3)' }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.egreen, display: 'inline-block' }} />
                  Under Review
                </span>
              )}
            </div>
          </div>

          {/* Pipeline progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.forest }}>
                <span
                  className="rounded-full px-1.5 py-0.5"
                  style={{ background: C.forest, color: C.parchment, fontSize: 10, fontWeight: 700 }}
                >
                  {stageNum}
                </span>
                {stageLabel}
              </span>
              <span style={{ fontSize: 11, color: C.muted }}>
                Stage {stageNum} of 14 · {Math.round((stageNum / 14) * 100)}%
              </span>
            </div>
            <div className="flex gap-1">
              {PIPELINE_PHASES.map((phase) => {
                const stageDots = Array.from(
                  { length: phase.end - phase.start + 1 },
                  (_, i) => phase.start + i,
                );
                return (
                  <div key={phase.label} style={{ flex: stageDots.length, minWidth: 0 }}>
                    <div
                      className="text-center mb-1 truncate"
                      style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted }}
                    >
                      {phase.label}
                    </div>
                    <div className="flex gap-0.5">
                      {stageDots.map((s) => {
                        const state = dotState(s);
                        return (
                          <div
                            key={s}
                            style={{
                              flex: 1,
                              height: 8,
                              borderRadius: 99,
                              background: state === 'done' ? C.forest : state === 'active' ? C.egreen : C.cream,
                              boxShadow: state === 'active' ? '0 0 0 2px rgba(0,232,122,0.3)' : undefined,
                              transition: 'all 0.3s',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Offer status banner */}
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: bannerBg.bg, border: `1px solid ${bannerBg.border}` }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{banner.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-xs font-semibold truncate" style={{ color: C.forest }}>{banner.title}</div>
              {banner.sub && (
                <div className="text-xs mt-0.5 truncate" style={{ color: C.muted }}>{banner.sub}</div>
              )}
            </div>
            {banner.cta && (
              <div onClick={(e) => e.stopPropagation()}>
                {offer.status === 'countered' ? (
                  <button
                    className="rounded-lg px-3 py-1.5 text-xs font-bold shrink-0"
                    style={{ background: C.amber, color: 'white' }}
                    onClick={() => onRespond?.(offer)}
                  >
                    {banner.cta}
                  </button>
                ) : (
                  <Link to={`/app/make-offer/${offer.property_id}`}>
                    <button
                      className="rounded-lg px-3 py-1.5 text-xs font-bold shrink-0"
                      style={{ background: C.forest, color: C.parchment }}
                    >
                      {banner.cta}
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1"
              style={{ background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.2)' }}
            >
              <div
                className="rounded-lg flex items-center justify-center shrink-0"
                style={{ width: 26, height: 26, background: C.forest, fontSize: 12 }}
              >
                {isActionNeeded ? '⚡' : '⏳'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted }}>
                  {isActionNeeded ? 'Next step' : 'Waiting for'}
                </div>
                <div className="text-xs font-semibold truncate" style={{ color: C.forest }}>
                  {nextStepText[offer.status] ?? 'Check offer status'}
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Link to={`/app/make-offer/${offer.property_id}`}>
                <button
                  className="rounded-lg px-3 py-2 text-xs font-semibold"
                  style={{ background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}` }}
                >
                  View Offer
                </button>
              </Link>
              <button
                className="rounded-lg px-3 py-2 text-xs font-medium"
                style={{ background: 'white', color: C.muted, border: `1.5px solid ${C.borderStrong}` }}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
              >
                {isExpanded ? '▴ Less' : '▾ Details'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {/* Full 14-stage pipeline row */}
          <div className="px-5 pt-4 pb-3" style={{ background: 'rgba(26,60,40,0.02)' }}>
            <div
              className="mb-3"
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}
            >
              14-Stage Purchase Pipeline
            </div>
            <div className="flex w-full" style={{ gap: 0 }}>
              {PURCHASE_STAGES.map((label, i) => {
                const sNum = i + 1;
                const state = dotState(sNum);
                return (
                  <div
                    key={sNum}
                    className="flex flex-col items-center"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <div className="relative flex items-center justify-center w-full" style={{ height: 26 }}>
                      {sNum > 1 && (
                        <div
                          style={{
                            position: 'absolute', right: '50%', left: 0,
                            top: '50%', transform: 'translateY(-50%)',
                            height: 2,
                            background: dotState(sNum - 1) !== 'pending' ? C.forest : C.cream,
                          }}
                        />
                      )}
                      {sNum < 14 && (
                        <div
                          style={{
                            position: 'absolute', left: '50%', right: 0,
                            top: '50%', transform: 'translateY(-50%)',
                            height: 2,
                            background: state === 'done' ? C.forest : C.cream,
                          }}
                        />
                      )}
                      <div
                        className="flex items-center justify-center relative z-10 shrink-0"
                        style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: state === 'done' ? C.forest : state === 'active' ? C.egreen : 'white',
                          border: `2px solid ${state === 'done' ? C.forest : state === 'active' ? C.egreen : C.borderStrong}`,
                          color: state === 'done' ? C.parchment : state === 'active' ? C.carbon : C.muted,
                          fontSize: 9, fontWeight: 700,
                          boxShadow: state === 'active' ? '0 0 0 3px rgba(0,232,122,0.2)' : undefined,
                        }}
                      >
                        {state === 'done' ? '✓' : sNum}
                      </div>
                    </div>
                    <div
                      className="text-center leading-tight mt-1"
                      style={{
                        fontSize: 8,
                        fontWeight: state === 'active' ? 700 : 400,
                        color: state === 'pending' ? C.muted : C.forest,
                        wordBreak: 'break-word',
                        width: '100%',
                        padding: '0 1px',
                      }}
                    >
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3-column detail row */}
          <div
            className="grid grid-cols-3 gap-5 p-5"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            {/* Stage checklist */}
            <div>
              <div
                className="mb-3"
                style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}
              >
                Stage {stageNum} Checklist
              </div>
              <div className="flex flex-col gap-2">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div
                      className="flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        width: 17, height: 17, borderRadius: 4,
                        background: item.done ? C.forest : 'white',
                        border: `1.5px solid ${item.done ? C.forest : C.borderStrong}`,
                        color: C.parchment, fontSize: 9, fontWeight: 700,
                      }}
                    >
                      {item.done ? '✓' : ''}
                    </div>
                    <span
                      className="text-xs leading-relaxed"
                      style={{ color: item.done ? C.muted : C.forest, textDecoration: item.done ? 'line-through' : 'none' }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key contacts */}
            <div>
              <div
                className="mb-3"
                style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}
              >
                Key Contacts
              </div>
              <div>
                <div className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                  {agentProfile?.avatarUrl ? (
                    <img
                      src={agentProfile.avatarUrl}
                      alt={`${agentProfile.firstName} ${agentProfile.lastName}`}
                      className="shrink-0 rounded-full"
                      style={{ width: 34, height: 34, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center shrink-0 rounded-full"
                      style={{ width: 34, height: 34, background: C.forest, fontFamily: FRAUNCES, fontSize: 13, color: C.parchment }}
                    >
                      {agentProfile
                        ? `${agentProfile.firstName[0]}${agentProfile.lastName[0]}`.toUpperCase()
                        : 'A'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate" style={{ color: C.forest }}>
                      {agentProfile ? `${agentProfile.firstName} ${agentProfile.lastName}` : 'Listing Agent'}
                    </div>
                    <div className="text-xs truncate" style={{ color: C.muted }}>
                      {agentProfile?.primaryCompanyName ?? property?.company_name ?? 'Agent'}
                    </div>
                  </div>
                  {property?.agent_id && (
                    <div className="ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/agent-profile/${property.agent_id}`}>
                        <button
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                          style={{ background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}` }}
                        >
                          View
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5 py-2.5">
                  <div
                    className="flex items-center justify-center shrink-0 rounded-full"
                    style={{ width: 34, height: 34, background: C.amber, fontFamily: FRAUNCES, fontSize: 12, color: 'white' }}
                  >
                    —
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: C.forest }}>Conveyancer</div>
                    <div className="text-xs" style={{ color: C.muted }}>Assigned at Stage 4+</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial summary */}
            <div>
              <div
                className="mb-3"
                style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}
              >
                Financial Summary
              </div>
              <div>
                {[
                  { label: 'Your Offer',    value: fmtMoney(offer.amount)       },
                  { label: 'Deposit',       value: depositDisplay               },
                  { label: 'Financing',     value: offer.financing === 'bond' ? 'Home Bond' : offer.financing === 'cash' ? 'Cash' : (offer.financing || 'Not specified') },
                  { label: 'Escrow Held',   value: 'R 0 (pending)'             },
                  { label: 'Offer Expires', value: fmtDate(offer.expires_at)    },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-baseline py-2"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <span className="text-xs" style={{ color: C.muted }}>{label}</span>
                    <span className="text-xs font-semibold" style={{ color: C.forest }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Viewing sub-components ───────────────────────────────────────────────────

const VIEWING_STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  confirmed: { label: '✓ Confirmed',            bg: 'rgba(0,232,122,0.12)',  color: '#008844'  },
  pending:   { label: '⏳ Awaiting Confirmation', bg: 'rgba(184,144,64,0.15)', color: '#8B6A1E'  },
  completed: { label: 'Completed',               bg: 'rgba(26,60,40,0.08)',  color: '#1A3C28'  },
  cancelled: { label: 'Cancelled',               bg: 'rgba(0,0,0,0.06)',     color: '#666'     },
  declined:  { label: 'Declined by Agent',        bg: 'rgba(196,86,42,0.12)', color: '#A83520'  },
};

const VIEWING_STRIPE: Record<string, string> = {
  confirmed: '#00E87A',
  pending:   '#B89040',
  completed: 'rgba(26,60,40,0.30)',
  cancelled: '#CCC',
  declined:  '#C4562A',
};

function ViewingCard({
  viewing,
  onCancel,
  cancelling,
  onReschedule,
  rescheduling = false,
  showDate = false,
}: {
  viewing: ViewingResponse;
  onCancel: (id: string) => void;
  cancelling: boolean;
  onReschedule: (id: string, scheduledAt: string, reason: string) => Promise<void>;
  rescheduling?: boolean;
  showDate?: boolean;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [reschedulingMode, setReschedulingMode] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const isPast =
    viewing.status === 'completed' ||
    viewing.status === 'cancelled' ||
    viewing.status === 'declined';
  const badge = VIEWING_STATUS_BADGE[viewing.status] ?? { label: viewing.status, bg: C.cream, color: C.muted };
  const stripe = VIEWING_STRIPE[viewing.status] ?? C.border;
  const title = viewing.property_title ?? `Property #${viewing.property_id.slice(0, 8)}`;
  const location = [viewing.property_city, viewing.property_region].filter(Boolean).join(', ') || null;
  const agentName = viewing.agent_first_name
    ? `${viewing.agent_first_name}${viewing.agent_last_name ? ` ${viewing.agent_last_name[0]}.` : ''}`
    : null;
  const timeDisplay = isPast
    ? fmtViewingPastDate(viewing.scheduled_at)
    : showDate
    ? fmtViewingPastDate(viewing.scheduled_at)  // date + time for non-grouped (LATER)
    : fmtViewingTimeRange(viewing.scheduled_at, viewing.duration_minutes);

  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'stretch',
        opacity: isPast ? 0.72 : 1,
        position: 'relative',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Status stripe — absolutely positioned like ::before */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: stripe, borderRadius: '16px 0 0 16px' }} />

      {/* Property thumbnail */}
      <div style={{ width: 92, flexShrink: 0, overflow: 'hidden', marginLeft: 3 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEFAULT_PROP_IMAGE}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 104, display: 'block' }}
          onError={(e) => { e.currentTarget.src = DEFAULT_PROP_IMAGE; }}
        />
      </div>

      {/* Card body */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, gap: 5 }}>
        {/* Row 1: Title + status badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 1 }}>
          <div
            style={{
              fontFamily: FRAUNCES,
              fontSize: 14,
              fontWeight: 600,
              color: C.forest,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 260,
            }}
          >
            {title}
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 100,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: badge.bg,
              color: badge.color,
            }}
          >
            {badge.label}
          </span>
        </div>

        {/* Row 2: Meta chips with dot separators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: C.forest }}>
            <Clock style={{ width: 12, height: 12 }} />
            {timeDisplay}
          </div>
          {location && (
            <>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(26,60,40,0.20)', flexShrink: 0 }} />
              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted }}>
                <MapPin style={{ width: 12, height: 12 }} />
                {location}
              </div>
            </>
          )}
          <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(26,60,40,0.20)', flexShrink: 0 }} />
          {/* Type chip */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              ...(viewing.viewing_type === 'virtual'
                ? { background: 'rgba(0,100,255,0.08)', color: '#0055CC' }
                : { background: 'rgba(26,60,40,0.08)', color: C.forestLight }),
            }}
          >
            {viewing.viewing_type === 'virtual' ? <Video style={{ width: 11, height: 11 }} /> : <User style={{ width: 11, height: 11 }} />}
            {viewing.viewing_type === 'virtual' ? 'Virtual' : 'In-Person'}
          </span>
          {agentName && (
            <>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(26,60,40,0.20)', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: C.muted }}>Agent: {agentName}</div>
            </>
          )}
        </div>

        {/* Pending note */}
        {viewing.status === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A84A00', marginTop: 4 }}>
            <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
            Waiting for agent to confirm — typically responds within 2 hours
          </div>
        )}

        {/* Completed: feedback banner */}
        {viewing.status === 'completed' && !viewing.agent_feedback && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 10,
              padding: '9px 14px',
              fontSize: 12,
              color: C.forest,
              background: 'rgba(0,232,122,0.07)',
              border: '1px solid rgba(0,232,122,0.25)',
              marginTop: 6,
            }}
          >
            <MessageSquare style={{ width: 14, height: 14, flexShrink: 0, color: '#008844' }} />
            How did this viewing go? Share your feedback.
            <span style={{ marginLeft: 'auto', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Rate viewing →
            </span>
          </div>
        )}

        {/* Declined reason */}
        {viewing.status === 'declined' && viewing.cancel_reason && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A84A00', marginTop: 4 }}>
            <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
            {viewing.cancel_reason}
          </div>
        )}
      </div>

      {/* Actions — separate column on far right */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 6,
          padding: '14px 16px 14px 0',
          flexShrink: 0,
        }}
      >
        {!confirmingCancel && !reschedulingMode && viewing.status === 'confirmed' && (
          <>
            <button
              onClick={() => {
                // Pre-fill with current scheduled time
                const d = new Date(viewing.scheduled_at);
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16);
                setNewDate(local);
                setRescheduleReason('');
                setReschedulingMode(true);
              }}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}`, whiteSpace: 'nowrap' }}
            >
              Reschedule
            </button>
            <button
              onClick={() => setConfirmingCancel(true)}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: '#C4562A', border: '1.5px solid rgba(196,86,42,0.2)', whiteSpace: 'nowrap' }}
            >
              Cancel
            </button>
          </>
        )}
        {!confirmingCancel && reschedulingMode && (
          <>
            <span style={{ fontSize: 11, color: C.muted, textAlign: 'right', whiteSpace: 'nowrap' }}>New date &amp; time</span>
            <input
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: `1.5px solid ${C.borderStrong}`, color: C.forest, outline: 'none', width: 160 }}
            />
            <input
              type="text"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="Reason for rescheduling"
              maxLength={200}
              style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: `1.5px solid ${C.borderStrong}`, color: C.forest, outline: 'none', width: 160, background: 'white' }}
            />
            <button
              onClick={async () => {
                if (!newDate) return;
                await onReschedule(viewing.id, new Date(newDate).toISOString(), rescheduleReason.trim());
                setReschedulingMode(false);
              }}
              disabled={!newDate || rescheduling}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: !newDate || rescheduling ? 'not-allowed' : 'pointer', background: C.forest, color: C.parchment, border: 'none', whiteSpace: 'nowrap', opacity: !newDate || rescheduling ? 0.6 : 1 }}
            >
              {rescheduling ? 'Saving…' : 'Confirm'}
            </button>
            <button
              onClick={() => setReschedulingMode(false)}
              disabled={rescheduling}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: 'transparent', color: C.muted, border: `1.5px solid ${C.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Back
            </button>
          </>
        )}
        {!confirmingCancel && viewing.status === 'pending' && (
          <button
            onClick={() => setConfirmingCancel(true)}
            style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: '#C4562A', border: '1.5px solid rgba(196,86,42,0.2)', whiteSpace: 'nowrap' }}
          >
            Cancel Request
          </button>
        )}
        {confirmingCancel && (
          <>
            <span style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>Cancel viewing?</span>
            <button
              onClick={() => { onCancel(viewing.id); setConfirmingCancel(false); }}
              disabled={cancelling}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: '#DC2626', color: 'white', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', opacity: cancelling ? 0.6 : 1 }}
            >
              {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
            </button>
            <button
              onClick={() => setConfirmingCancel(false)}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: 'transparent', color: C.muted, border: `1.5px solid ${C.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Keep
            </button>
          </>
        )}
        {viewing.status === 'completed' && (
          <Link to={`/app/property/${viewing.property_id}`}>
            <button
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}`, whiteSpace: 'nowrap' }}
            >
              View Property
            </button>
          </Link>
        )}
        {viewing.status === 'declined' && (
          <button
            style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}`, whiteSpace: 'nowrap' }}
          >
            Re-request
          </button>
        )}
        {viewing.status === 'cancelled' && (
          <Link to={`/app/property/${viewing.property_id}`}>
            <button
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}`, whiteSpace: 'nowrap' }}
            >
              View Property
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BuyerDashboardEnhanced() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect admins and company agents away from the buyer dashboard
  useEffect(() => {
    const activeCompany = getActiveCompanyContext();
    const isAdmin =
      getIsAdminFromToken() ||
      (activeCompany?.slug !== 'self' && (activeCompany?.is_admin ?? false));
    if (isAdmin) {
      router.replace('/company/dashboard');
      return;
    }
    const isCompanyAgent =
      activeCompany?.slug !== 'self' &&
      activeCompany != null &&
      activeCompany.role?.toLowerCase() === 'agent';
    if (isCompanyAgent) {
      router.replace('/app/agent');
    }
  }, [router]);

  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [savedProperties, setSavedProperties] = useState<SavedPropertyItem[]>([]);
  const [notifications, setNotifications] = useState<DerivedNotification[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [unsaveInFlight, setUnsaveInFlight] = useState<Set<string>>(new Set());
  const offerPropertyIds = useMyOfferPropertyIds();
  const [activePurchases, setActivePurchases] = useState<BuyerOfferResponse[]>([]);
  const [purchaseProperties, setPurchaseProperties] = useState<Record<string, PropertyListing>>({});
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'offer' | 'finance' | 'transfer'>('all');
  const [counterResponseOffer, setCounterResponseOffer] = useState<BuyerOfferResponse | null>(null);
  const [viewings, setViewings] = useState<ViewingResponse[]>([]);
  const [loadingViewings, setLoadingViewings] = useState(true);
  const [viewingStatusFilter, setViewingStatusFilter] = useState<'all' | 'upcoming' | 'pending' | 'completed'>('all');
  const [viewingTypeFilter, setViewingTypeFilter] = useState<'all' | 'in-person' | 'virtual'>('all');
  const [showPastViewings, setShowPastViewings] = useState(false);
  const [cancellingViewingId, setCancellingViewingId] = useState<string | null>(null);
  const [reschedulingViewingId, setReschedulingViewingId] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();

    if (!user && token) {
      usersApi.me(token).then(setUser).catch(() => null);
    }

    if (!token) {
      setLoadingSaved(false);
      setLoadingActivity(false);
      setLoadingPurchases(false);
      setLoadingViewings(false);
      return;
    }

    propertiesApi
      .getSavedProperties(token)
      .then((res) => setSavedProperties((res.data ?? []).map(listingToSaved)))
      .catch(() => setSavedProperties([]))
      .finally(() => setLoadingSaved(false));

    auditApi
      .getMyLogs(token, 20, 0)
      .then((entries) =>
        setNotifications(
          entries
            .filter((e) => !e.action.toLowerCase().includes('refresh_token'))
            .map(auditToNotification),
        ),
      )
      .catch(() => setNotifications([]))
      .finally(() => setLoadingActivity(false));

    buyerOffersApi
      .list(token)
      .then(async (offers) => {
        const active = (offers ?? []).filter(
          (o) => o.status !== 'withdrawn' && o.status !== 'rejected',
        );
        setActivePurchases(active);
        const ids = [...new Set(active.map((o) => o.property_id))];
        const settled = await Promise.allSettled(
          ids.map((id) => propertiesApi.getById(id, token)),
        );
        const propMap: Record<string, PropertyListing> = {};
        settled.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value) propMap[ids[i]] = r.value;
        });
        setPurchaseProperties(propMap);
      })
      .catch(() => setActivePurchases([]))
      .finally(() => setLoadingPurchases(false));

    viewingsApi
      .getMyViewings(token)
      .then((data) => setViewings(data ?? []))
      .catch(() => setViewings([]))
      .finally(() => setLoadingViewings(false));

  }, []);

  async function handleUnsave(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setUnsaveInFlight((prev) => new Set(prev).add(id));
    try {
      await propertiesApi.unsave(token, id);
      setSavedProperties((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setUnsaveInFlight((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleCancelViewing(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setCancellingViewingId(id);
    try {
      await viewingsApi.cancel(token, id, { reason: 'Cancelled by buyer' });
      setViewings((prev) => prev.map((v) => v.id === id ? { ...v, status: 'cancelled' } : v));
    } catch (_) {
      // silent — toast notification in future sprint
    } finally {
      setCancellingViewingId(null);
    }
  }

  async function handleRescheduleViewing(id: string, scheduledAt: string, reason: string) {
    const token = getAccessToken();
    if (!token) return;
    setReschedulingViewingId(id);
    try {
      const res = await viewingsApi.reschedule(token, id, { scheduledAt, ...(reason ? { reason } : {}) });
      if (res.data) {
        setViewings((prev) => prev.map((v) => v.id === id ? res.data! : v));
      }
    } catch (_) {
      // silent — toast notification in future sprint
    } finally {
      setReschedulingViewingId(null);
    }
  }

  const viewingBadgeCount = viewings.filter(
    (v) => (v.status === 'confirmed' || v.status === 'pending') && new Date(v.scheduled_at) > new Date(),
  ).length;

  const userName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : 'there';

  return (
    <div className="min-h-screen" style={{ background: C.parchment }}>

      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20" style={{ background: C.forest }}>
        <div className="px-6 pt-5 pb-4">

          {/* Title row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1
                className="text-2xl font-medium leading-tight"
                style={{ fontFamily: FRAUNCES, color: C.parchment }}
              >
                Buyer Dashboard
              </h1>
              <p className="text-sm mt-0.5" style={{ color: `${C.parchment}80` }}>
                Welcome back, {userName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Bell */}
              <button
                className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
                style={{
                  background: 'rgba(242,232,213,0.10)',
                  color: C.parchment,
                  border: '1px solid rgba(242,232,213,0.18)',
                }}
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: C.egreen, color: C.carbon }}
                  >
                    {notifications.length}
                  </span>
                )}
              </button>
              {/* Settings */}
              <Link to="/settings">
                <button
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
                  style={{
                    background: 'rgba(242,232,213,0.10)',
                    color: C.parchment,
                    border: '1px solid rgba(242,232,213,0.18)',
                  }}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </Link>
              {/* Primary CTA */}
              <Link to="/app/listings">
                <button
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: C.egreen, color: C.carbon }}
                >
                  <Search className="w-4 h-4" />
                  Browse Properties
                </button>
              </Link>
            </div>
          </div>

          {/* ── KPI strip ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-5 gap-3">
            {/* Saved Properties — live */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(242,232,213,0.10)', border: '1px solid rgba(242,232,213,0.15)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-4 h-4" style={{ color: C.egreen }} />
                {!loadingSaved && savedProperties.length > 0 && (
                  <ArrowUpRight className="w-3.5 h-3.5" style={{ color: C.egreen }} />
                )}
              </div>
              {loadingSaved ? (
                <div className="h-7 w-10 rounded animate-pulse mb-1" style={{ background: 'rgba(242,232,213,0.2)' }} />
              ) : (
                <div className="text-2xl font-bold" style={{ color: C.parchment }}>
                  {savedProperties.length}
                </div>
              )}
              <div className="text-xs mt-0.5" style={{ color: `${C.parchment}80` }}>Saved Properties</div>
            </div>

            {/* Active Purchases */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(242,232,213,0.10)', border: '1px solid rgba(242,232,213,0.15)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-4 h-4" style={{ color: C.egreen }} />
                {!loadingPurchases && activePurchases.length > 0 && (
                  <ArrowUpRight className="w-3.5 h-3.5" style={{ color: C.egreen }} />
                )}
              </div>
              {loadingPurchases ? (
                <div className="h-7 w-10 rounded animate-pulse mb-1" style={{ background: 'rgba(242,232,213,0.2)' }} />
              ) : (
                <div className="text-2xl font-bold" style={{ color: C.parchment }}>
                  {activePurchases.length}
                </div>
              )}
              <div className="text-xs mt-0.5" style={{ color: `${C.parchment}80` }}>Active Purchases</div>
            </div>

            {/* Construction Projects */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(242,232,213,0.10)', border: '1px solid rgba(242,232,213,0.15)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Hammer className="w-4 h-4" style={{ color: `${C.parchment}60` }} />
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{ background: `${C.amber}35`, color: C.amber }}
                >
                  Sprint 06
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: `${C.parchment}40` }}>—</div>
              <div className="text-xs mt-0.5" style={{ color: `${C.parchment}80` }}>Construction Projects</div>
            </div>

            {/* Escrow Balance */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(242,232,213,0.10)', border: '1px solid rgba(242,232,213,0.15)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-4 h-4" style={{ color: `${C.parchment}60` }} />
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{ background: `${C.amber}35`, color: C.amber }}
                >
                  Sprint 05
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: `${C.parchment}40` }}>—</div>
              <div className="text-xs mt-0.5" style={{ color: `${C.parchment}80` }}>Escrow Balance</div>
            </div>

            {/* Activity Events — live */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(242,232,213,0.10)', border: '1px solid rgba(242,232,213,0.15)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-4 h-4" style={{ color: C.egreen }} />
                {!loadingActivity && notifications.length > 0 && (
                  <ArrowUpRight className="w-3.5 h-3.5" style={{ color: C.egreen }} />
                )}
              </div>
              {loadingActivity ? (
                <div className="h-7 w-10 rounded animate-pulse mb-1" style={{ background: 'rgba(242,232,213,0.2)' }} />
              ) : (
                <div className="text-2xl font-bold" style={{ color: C.parchment }}>
                  {notifications.length}
                </div>
              )}
              <div className="text-xs mt-0.5" style={{ color: `${C.parchment}80` }}>Activity Events</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* Tab bar */}
          <TabsList
            className="mb-6 h-auto p-1 gap-0.5 rounded-xl"
            style={{ background: C.cream, border: `1px solid ${C.border}` }}
          >
            {[
              { value: 'overview',     label: 'Overview',          count: undefined as number | undefined },
              { value: 'purchases',    label: 'Active Purchases',  count: activePurchases.length || undefined },
              { value: 'construction', label: 'Construction',      count: undefined as number | undefined },
              { value: 'saved',        label: 'Saved Properties',  count: undefined as number | undefined },
              { value: 'viewings',     label: 'Viewings',          count: viewingBadgeCount || undefined },
            ].map(({ value, label, count }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:shadow-sm"
                style={
                  activeTab === value
                    ? { background: C.forest, color: C.parchment }
                    : { color: C.muted }
                }
              >
                {label}
                {count != null && count > 0 && (
                  <span
                    className="ml-1.5 rounded-full"
                    style={{
                      background: activeTab === value ? C.egreen : C.forest,
                      color: activeTab === value ? C.carbon : C.parchment,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                    }}
                  >
                    {count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Overview ──────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-5">

            {/* Row 1: Saved snapshot + Active Purchases coming soon */}
            <div className="grid grid-cols-2 gap-5">

              {/* Saved Properties snapshot */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2
                    className="text-base font-medium"
                    style={{ fontFamily: FRAUNCES, color: C.forest }}
                  >
                    Saved Properties
                  </h2>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                    style={{ color: C.forest }}
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {loadingSaved ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl p-4 animate-pulse"
                        style={{ background: 'white', border: `1px solid ${C.border}` }}
                      >
                        <div className="flex gap-3">
                          <div className="w-20 h-20 rounded-lg shrink-0" style={{ background: C.cream }} />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3 rounded w-3/4" style={{ background: C.cream }} />
                            <div className="h-3 rounded w-1/2" style={{ background: C.cream }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : savedProperties.length === 0 ? (
                  <div
                    className="rounded-xl p-8 text-center"
                    style={{ background: 'white', border: `1px solid ${C.border}` }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${C.forest}10` }}
                    >
                      <Heart className="w-6 h-6" style={{ color: `${C.forest}50` }} />
                    </div>
                    <p className="text-sm mb-3" style={{ color: C.muted }}>
                      No saved properties yet
                    </p>
                    <PrimaryBtn to="/app/listings">
                      <Search className="w-4 h-4" />
                      Browse Properties
                    </PrimaryBtn>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedProperties.slice(0, 2).map((property) => (
                      <div
                        key={property.id}
                        className="rounded-xl p-4"
                        style={{ background: 'white', border: `1px solid ${C.border}` }}
                      >
                        <div className="flex gap-3">
                          <img
                            src={property.image}
                            alt={property.address}
                            className="w-20 h-20 rounded-lg object-cover shrink-0"
                            onError={(e) => { e.currentTarget.src = DEFAULT_PROP_IMAGE; }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <div
                                className="font-semibold text-sm"
                                style={{ color: C.forest }}
                              >
                                {property.price}
                              </div>
                              {offerPropertyIds.has(property.id) && (
                                <span
                                  className="flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5"
                                  style={{ background: `${C.amber}22`, color: C.amber, border: `1px solid ${C.amber}55` }}
                                >
                                  <FileText className="w-3 h-3" />
                                  Offer Made
                                </span>
                              )}
                            </div>
                            <div
                              className="text-xs mb-2 line-clamp-2"
                              style={{ color: C.muted }}
                            >
                              {property.address}
                            </div>
                            <div className="flex items-center gap-3 text-xs" style={{ color: C.muted }}>
                              {property.beds !== null && (
                                <span className="flex items-center gap-1">
                                  <BedDouble className="w-3.5 h-3.5" />{property.beds}
                                </span>
                              )}
                              {property.baths !== null && (
                                <span className="flex items-center gap-1">
                                  <Bath className="w-3.5 h-3.5" />{property.baths}
                                </span>
                              )}
                              {property.sqm && (
                                <span className="flex items-center gap-1">
                                  <Maximize className="w-3.5 h-3.5" />{property.sqm}m²
                                </span>
                              )}
                              {property.verified && (
                                <span
                                  className="flex items-center gap-1 font-medium"
                                  style={{ color: C.forestLight }}
                                >
                                  <Shield className="w-3.5 h-3.5" />Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Purchases snapshot */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2
                    className="text-base font-medium"
                    style={{ fontFamily: FRAUNCES, color: C.forest }}
                  >
                    Active Purchases
                  </h2>
                  <button
                    onClick={() => setActiveTab('purchases')}
                    className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                    style={{ color: C.forest }}
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {loadingPurchases ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className="rounded-xl p-4 animate-pulse"
                        style={{ background: 'white', border: `1px solid ${C.border}` }}
                      >
                        <div className="flex gap-3">
                          <div className="w-20 h-20 rounded-lg shrink-0" style={{ background: C.cream }} />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3 rounded w-3/4" style={{ background: C.cream }} />
                            <div className="h-3 rounded w-1/2" style={{ background: C.cream }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activePurchases.length === 0 ? (
                  <div
                    className="rounded-xl p-8 text-center"
                    style={{ background: 'white', border: `1px solid ${C.border}` }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${C.forest}10` }}
                    >
                      <FileText className="w-6 h-6" style={{ color: `${C.forest}50` }} />
                    </div>
                    <p className="text-sm mb-3" style={{ color: C.muted }}>
                      No active purchases yet
                    </p>
                    <PrimaryBtn to="/app/listings">
                      <Search className="w-4 h-4" />
                      Browse Properties
                    </PrimaryBtn>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activePurchases.slice(0, 2).map((offer) => {
                      const prop = purchaseProperties[offer.property_id];
                      const imgUrl =
                        prop?.media?.find((m) => m.is_primary)?.url ??
                        prop?.media?.[0]?.url ??
                        DEFAULT_PROP_IMAGE;
                      const title = prop?.title ?? `Property #${offer.property_id.slice(0, 8)}`;
                      const loc = prop
                        ? [prop.location?.city, prop.location?.region].filter(Boolean).join(', ')
                        : '';
                      const { stageNum, stageLabel } = offerStageInfo(offer.status);
                      const isActionNeeded = offer.status === 'countered';
                      return (
                        <div
                          key={offer.id}
                          className="rounded-xl p-4"
                          style={{ background: 'white', border: `1px solid ${isActionNeeded ? C.amber : C.border}` }}
                        >
                          <div className="flex gap-3">
                            <img
                              src={imgUrl}
                              alt={title}
                              className="w-20 h-20 rounded-lg object-cover shrink-0"
                              onError={(e) => { e.currentTarget.src = DEFAULT_PROP_IMAGE; }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <div className="font-semibold text-sm" style={{ color: C.forest }}>
                                  {fmtMoney(offer.amount)}
                                </div>
                                {isActionNeeded && (
                                  <span
                                    className="flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5"
                                    style={{ background: `${C.amber}22`, color: C.amber, border: `1px solid ${C.amber}55` }}
                                  >
                                    Action needed
                                  </span>
                                )}
                              </div>
                              <div className="text-xs mb-2 line-clamp-1" style={{ color: C.muted }}>
                                {title}{loc ? ` — ${loc}` : ''}
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                                  style={{ background: `${C.forest}10`, color: C.forest }}
                                >
                                  Stage {stageNum}/14 · {stageLabel}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Construction Projects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-base font-medium"
                  style={{ fontFamily: FRAUNCES, color: C.forest }}
                >
                  Construction Projects
                </h2>
                <SprintBadge label="Sprint 06" />
              </div>
              <div
                className="rounded-xl p-6"
                style={{ background: 'white', border: `1.5px dashed ${C.border}` }}
              >
                <div className="flex items-center gap-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `${C.forest}10` }}
                  >
                    <Hammer className="w-7 h-7" style={{ color: `${C.forest}50` }} />
                  </div>
                  <div>
                    <p
                      className="font-medium text-sm mb-1"
                      style={{ color: C.forest }}
                    >
                      Construction management coming soon
                    </p>
                    <p className="text-sm" style={{ color: C.muted }}>
                      Budgets, milestones, contractors, BOQ, geo-verified progress
                      photos &amp; site inspections from one dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming features */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  Icon: Wallet,
                  label: 'Escrow & Payments',
                  sprint: 'Sprint 05',
                  desc: 'Multi-stage milestone escrow with immutable audit trail',
                },
                {
                  Icon: Bookmark,
                  label: 'Service Providers',
                  sprint: 'Sprint 07',
                  desc: 'Bookmark contractors, suppliers & request quotes',
                },
                {
                  Icon: ShoppingCart,
                  label: 'Materials & RFQs',
                  sprint: 'Sprint 08',
                  desc: 'Purchase materials and send bulk quote requests',
                },
              ].map(({ Icon, label, sprint, desc }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{ background: 'white', border: `1px solid ${C.border}` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${C.forest}10` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: `${C.forest}60` }} />
                    </div>
                    <span className="font-medium text-sm" style={{ color: C.forest }}>
                      {label}
                    </span>
                    <SprintBadge label={sprint} />
                  </div>
                  <p className="text-xs" style={{ color: C.muted }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div>
              <h2
                className="text-base font-medium mb-3"
                style={{ fontFamily: FRAUNCES, color: C.forest }}
              >
                Recent Activity
              </h2>
              <div
                className="rounded-xl p-5"
                style={{ background: 'white', border: `1px solid ${C.border}` }}
              >
                {loadingActivity ? (
                  <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div
                          className="w-8 h-8 rounded-full shrink-0"
                          style={{ background: C.cream }}
                        />
                        <div className="flex-1 space-y-2 pt-1">
                          <div className="h-3 rounded w-2/3" style={{ background: C.cream }} />
                          <div className="h-3 rounded w-1/2" style={{ background: C.cream }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${C.forest}10` }}
                    >
                      <Activity className="w-6 h-6" style={{ color: `${C.forest}40` }} />
                    </div>
                    <p className="text-sm" style={{ color: C.muted }}>No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.slice(0, 8).map((n, idx) => (
                      <div key={n.id}>
                        <div className="flex items-start gap-3">
                          <ActivityIcon type={n.type} />
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-medium text-sm mb-0.5"
                              style={{ color: C.forest }}
                            >
                              {n.title}
                            </div>
                            <div className="text-sm mb-1" style={{ color: C.muted }}>
                              {n.description}
                            </div>
                            <div className="text-xs" style={{ color: `${C.muted}80` }}>
                              {n.time}
                            </div>
                          </div>
                        </div>
                        {idx < Math.min(notifications.length - 1, 7) && (
                          <Separator className="mt-4" style={{ background: C.border }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Active Purchases ───────────────────────────────────── */}
          <TabsContent value="purchases" className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-lg font-medium"
                  style={{ fontFamily: FRAUNCES, color: C.forest }}
                >
                  Active Purchases
                </h2>
                {!loadingPurchases && (
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {activePurchases.length} active
                    {activePurchases.some((o) => o.status === 'countered') ? ' · 1 awaiting your action' : ''}
                  </p>
                )}
              </div>
              <PrimaryBtn to="/app/listings">
                <Plus className="w-4 h-4" />
                Start New Purchase
              </PrimaryBtn>
            </div>

            {/* Stats strip */}
            {!loadingPurchases && activePurchases.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    label: 'Under Offer',
                    value: String(activePurchases.length),
                    sub: activePurchases.length === 1 ? '1 active' : `All ${activePurchases.length} active`,
                    dotColor: C.egreen,
                    valueColor: undefined as string | undefined,
                    valueSuffix: undefined as string | undefined,
                  },
                  {
                    label: 'Total Committed',
                    value: activePurchases.reduce((s, o) => s + Number(o.amount), 0) >= 1_000_000
                      ? `R ${(activePurchases.reduce((s, o) => s + Number(o.amount), 0) / 1_000_000).toFixed(2)}M`
                      : fmtMoney(String(activePurchases.reduce((s, o) => s + Number(o.amount), 0))),
                    sub: `Across ${activePurchases.length} ${activePurchases.length === 1 ? 'property' : 'properties'}`,
                    dotColor: undefined as string | undefined,
                    valueColor: undefined as string | undefined,
                    valueSuffix: undefined as string | undefined,
                  },
                  {
                    label: 'Escrow Held',
                    value: 'R 0',
                    sub: 'Pending deposit',
                    dotColor: undefined as string | undefined,
                    valueColor: '#1A7A40',
                    valueSuffix: undefined as string | undefined,
                  },
                  {
                    label: 'Avg. Stage',
                    value: String(Math.round(activePurchases.reduce((s, o) => s + offerStageInfo(o.status).stageNum, 0) / activePurchases.length)),
                    sub: 'Early stage',
                    dotColor: C.amber,
                    valueColor: undefined as string | undefined,
                    valueSuffix: ' /14',
                  },
                ].map(({ label, value, sub, dotColor, valueColor, valueSuffix }) => (
                  <div
                    key={label}
                    className="rounded-xl p-4"
                    style={{ background: 'white', border: `1px solid ${C.border}` }}
                  >
                    <div
                      className="text-xs mb-1.5 font-semibold tracking-widest uppercase"
                      style={{ color: C.muted }}
                    >
                      {label}
                    </div>
                    <div
                      className="font-medium leading-none"
                      style={{ fontFamily: FRAUNCES, fontSize: 24, color: valueColor ?? C.forest, letterSpacing: '-0.6px' }}
                    >
                      {value}
                      {valueSuffix && (
                        <span style={{ fontSize: 14, color: C.muted, fontFamily: 'inherit' }}>{valueSuffix}</span>
                      )}
                    </div>
                    <div className="text-xs mt-1" style={{ color: C.muted }}>
                      {dotColor && (
                        <span
                          style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }}
                        />
                      )}
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter pills */}
            {!loadingPurchases && activePurchases.length > 0 && (
              <div className="flex gap-2 items-center flex-wrap">
                {([
                  { key: 'all',      label: 'All',             count: activePurchases.length },
                  { key: 'offer',    label: 'Offer Stage',     count: activePurchases.filter((o) => ['submitted','pending','countered','accepted'].includes(o.status)).length },
                  { key: 'finance',  label: 'Finance & Legal', count: 0 },
                  { key: 'transfer', label: 'Transfer',        count: 0 },
                ] as Array<{ key: 'all' | 'offer' | 'finance' | 'transfer'; label: string; count: number }>).map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setPurchaseFilter(key)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                    style={
                      purchaseFilter === key
                        ? { background: C.forest, color: C.parchment, border: `1.5px solid ${C.forest}` }
                        : { background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}` }
                    }
                  >
                    {label}
                    <span
                      className="rounded-full"
                      style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 5px',
                        background: purchaseFilter === key ? 'rgba(242,232,213,0.2)' : C.cream,
                        color: purchaseFilter === key ? C.parchment : C.muted,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Body: loading / empty / cards */}
            {loadingPurchases ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.muted }} />
              </div>
            ) : activePurchases.length === 0 ? (
              <div
                className="rounded-2xl p-16 text-center"
                style={{ background: 'white', border: `1.5px dashed ${C.border}` }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${C.forest}0A`, fontSize: 28 }}
                >
                  🏡
                </div>
                <h3
                  className="text-lg font-medium mb-2"
                  style={{ fontFamily: FRAUNCES, color: C.forest }}
                >
                  No active purchases yet
                </h3>
                <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: C.muted, lineHeight: 1.6 }}>
                  When you submit an offer on a property, your full 14-stage purchase journey — from offer to registration — will appear here with live status and next-action guidance.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <PrimaryBtn to="/app/listings">
                    <Search className="w-4 h-4" />
                    Browse Properties
                  </PrimaryBtn>
                  <OutlineBtn to="/fraud-report">
                    <AlertOctagon className="w-4 h-4" />
                    Report Fraud
                  </OutlineBtn>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {activePurchases
                  .filter((o) => {
                    if (purchaseFilter === 'offer') return ['submitted', 'pending', 'countered', 'accepted'].includes(o.status);
                    if (purchaseFilter === 'finance' || purchaseFilter === 'transfer') return false;
                    return true;
                  })
                  .map((offer) => (
                    <PurchaseCard
                      key={offer.id}
                      offer={offer}
                      property={purchaseProperties[offer.property_id]}
                      isExpanded={expandedPurchaseId === offer.id}
                      onToggle={() =>
                        setExpandedPurchaseId(expandedPurchaseId === offer.id ? null : offer.id)
                      }
                      onRespond={setCounterResponseOffer}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* ── Construction ──────────────────────────────────────── */}
          <TabsContent value="construction" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-medium"
                style={{ fontFamily: FRAUNCES, color: C.forest }}
              >
                Construction Projects
              </h2>
              <PrimaryBtn to="/construction">
                <Plus className="w-4 h-4" />
                Create New Project
              </PrimaryBtn>
            </div>
            <ComingSoonCard
              icon={Hammer}
              title="Construction Management — Sprint 06"
              description="Manage build projects with budgets, BOQ, stage milestones, contractor payments, geo-tagged progress photos, government inspections and offline-first mobile tracking."
              sprint="Sprint 06"
              actions={
                <>
                  <OutlineBtn to="/boq-workspace">
                    <FileText className="w-4 h-4" />
                    Open BOQ Workspace
                  </OutlineBtn>
                  <OutlineBtn to="/ai-design-studio">
                    <Star className="w-4 h-4" />
                    AI Design Studio
                  </OutlineBtn>
                </>
              }
            />
          </TabsContent>

          {/* ── Saved Properties ──────────────────────────────────── */}
          <TabsContent value="saved" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-medium"
                style={{ fontFamily: FRAUNCES, color: C.forest }}
              >
                Saved Properties
                {!loadingSaved && (
                  <span className="font-normal text-base ml-2" style={{ color: C.muted }}>
                    ({savedProperties.length})
                  </span>
                )}
              </h2>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
                  style={{
                    background: 'white',
                    color: C.forest,
                    border: `1.5px solid ${C.borderStrong}`,
                  }}
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <PrimaryBtn to="/app/listings">
                  <Search className="w-4 h-4" />
                  Browse More
                </PrimaryBtn>
              </div>
            </div>

            {loadingSaved ? (
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl animate-pulse"
                    style={{ background: 'white', border: `1px solid ${C.border}` }}
                  >
                    <div className="h-48" style={{ background: C.cream }} />
                    <div className="p-4 space-y-3">
                      <div className="h-4 rounded w-1/2" style={{ background: C.cream }} />
                      <div className="h-3 rounded w-3/4" style={{ background: C.cream }} />
                      <div className="h-3 rounded w-1/3" style={{ background: C.cream }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : savedProperties.length === 0 ? (
              <ComingSoonCard
                icon={Heart}
                title="No saved properties yet"
                description="Browse the marketplace and tap the heart icon to save properties you like."
                sprint=""
                actions={
                  <PrimaryBtn to="/app/listings">
                    <Search className="w-4 h-4" />
                    Browse Properties
                  </PrimaryBtn>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {savedProperties.map((property) => (
                  <div
                    key={property.id}
                    className="overflow-hidden rounded-xl"
                    style={{ background: 'white', border: `1px solid ${C.border}` }}
                  >
                    <div className="relative">
                      <img
                        src={property.image}
                        alt={property.address}
                        className="w-full h-48 object-cover"
                        onError={(e) => { e.currentTarget.src = DEFAULT_PROP_IMAGE; }}
                      />
                      {/* Unsave button */}
                      <button
                        onClick={() => handleUnsave(property.id)}
                        disabled={unsaveInFlight.has(property.id)}
                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-60 transition-opacity hover:opacity-80"
                        title="Remove from saved"
                        aria-label="Remove from saved"
                      >
                        {unsaveInFlight.has(property.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.muted }} />
                        ) : (
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        )}
                      </button>
                      {/* Verified badge */}
                      {property.verified && (
                        <div
                          className="absolute top-3 left-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ background: C.egreen, color: C.carbon }}
                        >
                          <Shield className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                      {/* Offer Made badge */}
                      {offerPropertyIds.has(property.id) && (
                        <div
                          className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ background: C.amber, color: 'white' }}
                        >
                          <FileText className="w-3 h-3" />
                          Offer Made
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div
                        className="text-xl font-bold mb-0.5"
                        style={{ color: C.forest }}
                      >
                        {property.price}
                      </div>
                      <div
                        className="text-sm mb-3 line-clamp-2"
                        style={{ color: C.muted }}
                      >
                        {property.address}
                      </div>
                      <div className="flex gap-4 mb-4 text-sm" style={{ color: C.muted }}>
                        {property.beds !== null && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-4 h-4" />{property.beds}
                          </span>
                        )}
                        {property.baths !== null && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />{property.baths}
                          </span>
                        )}
                        {property.sqm && (
                          <span className="flex items-center gap-1">
                            <Maximize className="w-4 h-4" />{property.sqm}m²
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/app/property/${property.id}`} className="flex-1">
                          <button
                            className="w-full rounded-lg py-2 text-sm font-medium transition-opacity hover:opacity-80"
                            style={{
                              background: 'transparent',
                              color: C.forest,
                              border: `1.5px solid ${C.borderStrong}`,
                            }}
                          >
                            View Details
                          </button>
                        </Link>
                        <button
                          className="flex-1 rounded-lg py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                          style={
                            offerPropertyIds.has(property.id)
                              ? { background: C.amber, color: 'white' }
                              : { background: C.forest, color: C.parchment }
                          }
                          onClick={() => {
                            window.location.href = `/app/make-offer/${property.id}`;
                          }}
                        >
                          {offerPropertyIds.has(property.id) ? 'View / Edit Offer' : 'Make Offer'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Viewings ──────────────────────────────────────────── */}
          <TabsContent value="viewings" className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium" style={{ fontFamily: FRAUNCES, color: C.forest }}>
                  Property Viewings
                </h2>
                {!loadingViewings && viewings.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {viewings.filter((v) => (v.status === 'confirmed' || v.status === 'pending') && new Date(v.scheduled_at) > new Date()).length} upcoming
                  </p>
                )}
              </div>
              <PrimaryBtn to="/app/listings">
                <Calendar className="w-4 h-4" />
                Browse &amp; Book Viewing
              </PrimaryBtn>
            </div>

            {loadingViewings ? (
              /* Loading skeleton */
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden animate-pulse"
                    style={{ background: 'white', border: `1px solid ${C.border}`, display: 'flex', height: 104 }}
                  >
                    <div style={{ width: 4, background: C.cream }} />
                    <div style={{ width: 100, background: C.cream }} />
                    <div className="flex-1 p-4 space-y-2">
                      <div className="h-3 rounded w-2/3" style={{ background: C.cream }} />
                      <div className="h-3 rounded w-1/3" style={{ background: C.cream }} />
                      <div className="flex gap-2 mt-2">
                        <div className="h-5 w-20 rounded-md" style={{ background: C.cream }} />
                        <div className="h-5 w-16 rounded-md" style={{ background: C.cream }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewings.length === 0 ? (
              /* Empty state */
              <div className="rounded-2xl p-16 text-center" style={{ background: 'white', border: `1.5px dashed ${C.border}` }}>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${C.forest}0A`, fontSize: 28 }}
                >
                  🏠
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ fontFamily: FRAUNCES, color: C.forest }}>
                  No viewings scheduled yet
                </h3>
                <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: C.muted, lineHeight: 1.6 }}>
                  Browse available properties and request in-person or virtual viewings directly from each listing page.
                </p>
                <PrimaryBtn to="/app/listings">
                  <Search className="w-4 h-4" />
                  Browse Properties
                </PrimaryBtn>
              </div>
            ) : (
              <>
                {/* KPI stats */}
                {(() => {
                  const now = new Date();
                  const upcoming = viewings.filter((v) => v.status === 'confirmed' && new Date(v.scheduled_at) > now).length;
                  const pending = viewings.filter((v) => v.status === 'pending' && new Date(v.scheduled_at) > now).length;
                  const completed = viewings.filter((v) => v.status === 'completed').length;
                  const cancelledOrDeclined = viewings.filter((v) => v.status === 'cancelled' || v.status === 'declined').length;
                  const stats = [
                    { label: 'Upcoming',              value: upcoming,            iconBg: 'rgba(0,232,122,0.12)',   iconColor: '#00A855', Icon: Calendar     },
                    { label: 'Awaiting Confirmation', value: pending,             iconBg: 'rgba(184,144,64,0.14)', iconColor: '#B89040', Icon: Clock        },
                    { label: 'Completed',             value: completed,           iconBg: 'rgba(26,60,40,0.10)',   iconColor: C.forest,  Icon: CheckCircle2 },
                    { label: 'Cancelled / Declined',  value: cancelledOrDeclined, iconBg: 'rgba(196,86,42,0.10)', iconColor: '#C4562A', Icon: X            },
                  ];
                  return (
                    <div className="grid grid-cols-4 gap-3">
                      {stats.map(({ label, value, iconBg, iconColor, Icon }) => (
                        <div key={label} style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon style={{ width: 16, height: 16, color: iconColor }} />
                          </div>
                          <div>
                            <div style={{ fontFamily: FRAUNCES, fontSize: 22, fontWeight: 600, color: C.forest, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Filter bar */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {([
                    { key: 'all' as const,       label: 'All'       },
                    { key: 'upcoming' as const,  label: 'Upcoming'  },
                    { key: 'pending' as const,   label: 'Pending'   },
                    { key: 'completed' as const, label: 'Completed' },
                  ]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setViewingStatusFilter(key)}
                      style={{
                        padding: '5px 13px',
                        borderRadius: 100,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1.5px solid transparent',
                        transition: 'all 0.12s',
                        ...(viewingStatusFilter === key
                          ? { background: C.forest, color: C.parchment }
                          : { background: 'white', color: C.muted, borderColor: C.border }),
                      }}
                    >
                      {label}
                    </button>
                  ))}
                  <div style={{ width: 1, height: 20, background: C.border, margin: '0 4px' }} />
                  {([
                    { key: 'in-person' as const, label: 'In-Person' },
                    { key: 'virtual' as const,   label: 'Virtual'   },
                  ]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setViewingTypeFilter(viewingTypeFilter === key ? 'all' : key)}
                      style={{
                        padding: '5px 13px',
                        borderRadius: 100,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1.5px solid transparent',
                        transition: 'all 0.12s',
                        ...(viewingTypeFilter === key
                          ? { background: C.forest, color: C.parchment }
                          : { background: 'white', color: C.muted, borderColor: C.border }),
                      }}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      background: 'white',
                      fontSize: 12,
                      fontWeight: 500,
                      color: C.muted,
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowUpDown style={{ width: 12, height: 12 }} />
                    Soonest first
                  </button>
                </div>

                {/* Grouped timeline */}
                {(() => {
                  const now = new Date();
                  let upcomingViewings = viewings.filter(
                    (v) => (v.status === 'confirmed' || v.status === 'pending') && new Date(v.scheduled_at) > now,
                  );
                  let pastViewings = viewings.filter(
                    (v) => v.status === 'completed' || v.status === 'cancelled' || v.status === 'declined' || new Date(v.scheduled_at) <= now,
                  );
                  if (viewingStatusFilter === 'upcoming') upcomingViewings = upcomingViewings.filter((v) => v.status === 'confirmed');
                  else if (viewingStatusFilter === 'pending') upcomingViewings = upcomingViewings.filter((v) => v.status === 'pending');
                  else if (viewingStatusFilter === 'completed') { upcomingViewings = []; pastViewings = pastViewings.filter((v) => v.status === 'completed'); }
                  if (viewingTypeFilter !== 'all') {
                    upcomingViewings = upcomingViewings.filter((v) => v.viewing_type === viewingTypeFilter);
                    pastViewings = pastViewings.filter((v) => v.viewing_type === viewingTypeFilter);
                  }
                  upcomingViewings.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
                  pastViewings.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

                  const GROUP_LABELS: Record<ViewingGroup, string> = {
                    today: 'TODAY', tomorrow: 'TOMORROW', 'this-week': 'THIS WEEK', 'next-week': 'NEXT WEEK', later: 'LATER',
                  };
                  const GROUP_ORDER: ViewingGroup[] = ['today', 'tomorrow', 'this-week', 'next-week', 'later'];
                  const grouped = GROUP_ORDER.reduce<Record<ViewingGroup, ViewingResponse[]>>(
                    (acc, g) => { acc[g] = upcomingViewings.filter((v) => getViewingGroup(v.scheduled_at) === g); return acc; },
                    { today: [], tomorrow: [], 'this-week': [], 'next-week': [], later: [] },
                  );
                  const hasUpcoming = upcomingViewings.length > 0;
                  const hasPast = pastViewings.length > 0;

                  return (
                    <div className="space-y-5">
                      {hasUpcoming && GROUP_ORDER.map((group) => {
                        const items = grouped[group];
                        if (!items.length) return null;
                        // Compute representative date for groups that have one
                        const groupDate = items[0]?.scheduled_at;
                        const dateSuffix =
                          group === 'today'      ? ` — ${fmtViewingDateLabel(new Date().toISOString())}` :
                          group === 'tomorrow'   ? ` — ${fmtViewingDateLabel(new Date(Date.now() + 86400000).toISOString())}` :
                          (group === 'this-week' || group === 'next-week') && groupDate ? ` — ${fmtViewingDateLabel(groupDate)}` :
                          '';
                        return (
                          <div key={group} className="space-y-3">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 }}>
                              <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.muted, whiteSpace: 'nowrap' }}>
                                {GROUP_LABELS[group]}{dateSuffix}
                              </span>
                              <div style={{ flex: 1, height: 1, background: C.border }} />
                            </div>
                            {items.map((v) => (
                              <ViewingCard
                                key={v.id}
                                viewing={v}
                                onCancel={handleCancelViewing}
                                cancelling={cancellingViewingId === v.id}
                                onReschedule={handleRescheduleViewing}
                                rescheduling={reschedulingViewingId === v.id}
                                showDate={group === 'later'}
                              />
                            ))}
                          </div>
                        );
                      })}

                      {!hasUpcoming && viewingStatusFilter !== 'completed' && (
                        <div className="rounded-xl p-8 text-center" style={{ background: 'white', border: `1px dashed ${C.border}` }}>
                          <p className="text-sm" style={{ color: C.muted }}>
                            No {viewingStatusFilter === 'pending' ? 'pending' : 'upcoming'} viewings match your filters
                          </p>
                        </div>
                      )}

                      {(viewingStatusFilter === 'all' || viewingStatusFilter === 'completed') && hasPast && (
                        <div>
                          <button
                            onClick={() => setShowPastViewings(!showPastViewings)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 13,
                              fontWeight: 600,
                              color: C.muted,
                              cursor: 'pointer',
                              padding: '8px 0',
                              paddingTop: 12,
                              marginTop: 8,
                              borderTop: `1px solid ${C.border}`,
                              width: '100%',
                              background: 'transparent',
                              outline: 'none',
                            }}
                          >
                            <ChevronDown
                              style={{
                                width: 14,
                                height: 14,
                                transform: showPastViewings ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                              }}
                            />
                            {showPastViewings ? 'Hide' : `Show ${pastViewings.length}`} completed viewing{pastViewings.length !== 1 ? 's' : ''}
                          </button>
                          {showPastViewings && (
                            <div className="flex flex-col gap-3 mt-3">
                              {pastViewings.map((v) => (
                                <ViewingCard
                                  key={v.id}
                                  viewing={v}
                                  onCancel={handleCancelViewing}
                                  cancelling={cancellingViewingId === v.id}
                                  onReschedule={handleRescheduleViewing}
                                  rescheduling={reschedulingViewingId === v.id}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Quick Actions bar ───────────────────────────────────── */}
        <div
          className="mt-6 rounded-2xl p-6"
          style={{ background: C.forest }}
        >
          <h3
            className="text-sm font-medium mb-4"
            style={{ fontFamily: FRAUNCES, color: `${C.parchment}90` }}
          >
            Quick Actions
          </h3>
          <div className="grid grid-cols-6 gap-3">
            {[
              { to: '/app/listings',       Icon: Search,    label: 'Browse'      },
              { to: '/service-providers',  Icon: Bookmark,  label: 'Contractors' },
              { to: '/boq-workspace',      Icon: FileText,  label: 'BOQ'         },
              { to: '/ai-design-studio',   Icon: Star,      label: 'AI Studio'   },
              { to: '/property-lifecycle', Icon: Activity,  label: 'Lifecycle'   },
              { to: '/risk-analytics',     Icon: BarChart3, label: 'Analytics'   },
            ].map(({ to, Icon, label }) => (
              <Link key={label} to={to}>
                <button
                  className="w-full rounded-xl p-4 text-center transition-colors group"
                  style={{
                    background: 'rgba(242,232,213,0.08)',
                    border: '1px solid rgba(242,232,213,0.12)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(242,232,213,0.16)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(242,232,213,0.08)';
                  }}
                >
                  <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: C.egreen }} />
                  <div className="text-xs font-medium" style={{ color: C.parchment }}>
                    {label}
                  </div>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Respond to Counter-Offer Modal ─────────────────────────── */}
      <RespondToCounterOfferModal
        open={!!counterResponseOffer}
        onOpenChange={(open) => { if (!open) setCounterResponseOffer(null); }}
        offer={counterResponseOffer}
        onSuccess={(updated) => {
          if (updated.status === 'rejected' || updated.status === 'withdrawn') {
            setActivePurchases((prev) => prev.filter((o) => o.id !== updated.id));
          } else {
            setActivePurchases((prev) =>
              prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o)
            );
          }
        }}
      />
    </div>
  );
}
