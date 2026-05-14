'use client';

import Link from 'next/link';
import {
  Eye, MessageSquare, Tag, Calendar, TrendingUp, DollarSign,
  ChevronRight, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { type PropertyListing, type PropertyStats } from '@/lib/api-client';
import { formatMoney } from '@/lib/formatters';

// ── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  forest:     '#1A3C28',
  parchment:  '#F2E8D5',
  amber:      '#B89040',
  terra:      '#C4562A',
  egreen:     '#00E87A',
  textMuted:  '#6B8F7A',
  border:     'rgba(26,60,40,0.12)',
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────
function healthScore(stats: PropertyStats | null, daysOnMarket: number): number {
  if (!stats) return 0;
  let score = 0;
  if (stats.views > 100)                score += 30;
  else if (stats.views > 30)            score += 18;
  else if (stats.views > 5)             score += 8;
  if (stats.inquiries > 5)              score += 25;
  else if (stats.inquiries > 1)         score += 15;
  else if (stats.inquiries > 0)         score += 7;
  if (stats.viewings_requested > 3)     score += 25;
  else if (stats.viewings_requested > 0) score += 14;
  if (daysOnMarket < 30)                score += 20;
  else if (daysOnMarket < 60)           score += 10;
  return Math.min(score, 99);
}

function heatLabel(score: number): { label: string; bg: string; color: string } {
  if (score >= 65) return { label: '🔥 High Demand', bg: '#FEE2E2', color: '#DC2626' };
  if (score >= 35) return { label: '🌡 Warm Interest', bg: '#FEF3C7', color: '#D97706' };
  return { label: '🧊 Slow Market', bg: '#DBEAFE', color: '#2563EB' };
}

// ── Inline SVG health ring ────────────────────────────────────────────────────
function HealthRing({ score }: { score: number }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(242,232,213,0.15)" strokeWidth="5" />
        <circle
          cx="30" cy="30" r={r} fill="none"
          stroke={score >= 65 ? '#00E87A' : score >= 35 ? '#F5C87A' : '#93C5FD'}
          strokeWidth="5"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces)', fontSize: 14, fontWeight: 700, color: '#fff' }}>
        {score}
      </span>
    </div>
  );
}

// ── Sidebar card wrapper ──────────────────────────────────────────────────────
function SideCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

// ── Sidebar props ─────────────────────────────────────────────────────────────
interface Props {
  property: PropertyListing;
  stats: PropertyStats | null;
  daysOnMarket: number;
  listingId: string;
  authToken: string;
  onTabChange: (tab: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ListingDetailSidebar({ property, stats, daysOnMarket, listingId, onTabChange }: Props) {
  const score = healthScore(stats, daysOnMarket);
  const heat  = heatLabel(score);

  // Mandate: assume 90-day mandate; show % used
  const mandatePct = Math.min(Math.round((daysOnMarket / 90) * 100), 100);

  const pendingViewings = stats?.viewings_requested ?? 0;
  const enquiries       = stats?.inquiries ?? 0;
  const views           = stats?.views ?? (property.view_count ?? 0);
  const openHouses      = stats?.open_houses_scheduled ?? 0;

  return (
    <>
      {/* ── 1. Listing Health Card ─────────────────────────────────────────── */}
      <SideCard>
        {/* Forest band */}
        <div style={{ background: C.forest, padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: C.egreen, opacity: 0.06, borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <HealthRing score={score} />
            <div>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.egreen, marginBottom: 3 }}>
                Listing Health
              </div>
              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {score >= 65 ? 'Performing Well' : score >= 35 ? 'Moderate Activity' : 'Needs Attention'}
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 5, background: heat.bg, color: heat.color }}>
                {heat.label}
              </span>
            </div>
          </div>
        </div>

        {/* 4-metric strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${C.border}` }}>
          {[
            { val: views,            lbl: 'Views',      color: C.forest },
            { val: enquiries,        lbl: 'Enquiries',  color: C.terra },
            { val: pendingViewings,  lbl: 'Viewings',   color: '#2563EB' },
            { val: `${daysOnMarket}d`, lbl: 'On Market', color: C.amber },
          ].map(({ val, lbl, color }, i, arr) => (
            <div key={lbl} style={{ padding: '10px 0', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.textMuted, marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Mandate progress */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, color: C.textMuted, marginBottom: 5 }}>
            <span>Mandate progress</span>
            <span style={{ color: mandatePct < 70 ? '#059669' : '#D97706', fontWeight: 600 }}>{daysOnMarket}d / 90d</span>
          </div>
          <div style={{ height: 4, background: 'rgba(26,60,40,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: mandatePct < 70 ? '#22C55E' : mandatePct < 90 ? '#F59E0B' : '#EF4444', width: `${mandatePct}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      </SideCard>

      {/* ── 2. Recent Activity Card ────────────────────────────────────────── */}
      <SideCard>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,60,40,0.08)`, background: 'rgba(26,60,40,0.03)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp style={{ width: 15, height: 15, color: C.forest, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.forest }}>Activity</span>
        </div>
        <div style={{ padding: '14px 16px' }}>
          {/* Pending chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {pendingViewings > 0 && (
              <button
                onClick={() => onTabChange('viewings')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8', border: 'none', cursor: 'pointer' }}
              >
                <Calendar style={{ width: 11, height: 11 }} />
                {pendingViewings} viewing{pendingViewings !== 1 ? 's' : ''}
              </button>
            )}
            {enquiries > 0 && (
              <button
                onClick={() => onTabChange('enquiries')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#F5F3FF', color: '#6D28D9', border: 'none', cursor: 'pointer' }}
              >
                <MessageSquare style={{ width: 11, height: 11 }} />
                {enquiries} enquir{enquiries !== 1 ? 'ies' : 'y'}
              </button>
            )}
            {openHouses > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#F9FAFB', color: '#4B5563', border: '1px solid #E5E7EB' }}>
                <Eye style={{ width: 11, height: 11 }} />
                {openHouses} open house{openHouses !== 1 ? 's' : ''}
              </span>
            )}
            {pendingViewings === 0 && enquiries === 0 && openHouses === 0 && (
              <span style={{ fontSize: 12, color: C.textMuted }}>No pending activity</span>
            )}
          </div>
          {/* Static activity rows derived from stats */}
          {views > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(26,60,40,0.06)', cursor: 'pointer' }} onClick={() => onTabChange('details')}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0, marginTop: 4 }} />
              <span style={{ fontSize: 12, color: C.forest, fontWeight: 500, lineHeight: 1.4, flex: 1 }}>
                {views} total portal views recorded
              </span>
              <ChevronRight style={{ width: 13, height: 13, color: C.textMuted, flexShrink: 0 }} />
            </div>
          )}
          {stats?.viewings_confirmed && stats.viewings_confirmed > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(26,60,40,0.06)', cursor: 'pointer' }} onClick={() => onTabChange('viewings')}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', flexShrink: 0, marginTop: 4 }} />
              <span style={{ fontSize: 12, color: C.forest, fontWeight: 500, lineHeight: 1.4, flex: 1 }}>
                {stats.viewings_confirmed} viewing{stats.viewings_confirmed !== 1 ? 's' : ''} confirmed
              </span>
              <ChevronRight style={{ width: 13, height: 13, color: C.textMuted, flexShrink: 0 }} />
            </div>
          ) : null}
          {enquiries > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', cursor: 'pointer' }} onClick={() => onTabChange('enquiries')}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6', flexShrink: 0, marginTop: 4 }} />
              <span style={{ fontSize: 12, color: C.forest, fontWeight: 500, lineHeight: 1.4, flex: 1 }}>
                {enquiries} enquir{enquiries !== 1 ? 'ies' : 'y'} received
              </span>
              <ChevronRight style={{ width: 13, height: 13, color: C.textMuted, flexShrink: 0 }} />
            </div>
          )}
        </div>
      </SideCard>

      {/* ── 3. Price Intelligence ──────────────────────────────────────────── */}
      <SideCard style={{ border: '1px solid rgba(184,144,64,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 14px', borderBottom: '1px solid rgba(184,144,64,0.15)', background: 'rgba(184,144,64,0.07)' }}>
          <DollarSign style={{ width: 14, height: 14, color: C.amber, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.amber }}>Price Intelligence</span>
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 700, color: C.forest, lineHeight: 1, marginBottom: 2 }}>
            {formatMoney(property.price, property.currency)}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>current asking price</div>

          {/* Range track */}
          <div style={{ height: 6, borderRadius: 3, background: 'linear-gradient(to right, #DBEAFE, #D1FAE5, #FEF3C7, #FEE2E2)', position: 'relative', marginBottom: 8 }}>
            <div style={{ position: 'absolute', top: -3, width: 12, height: 12, background: C.forest, border: '2px solid #fff', borderRadius: '50%', left: '45%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, color: C.textMuted, marginBottom: 10 }}>
            <span>Below Market</span>
            <span>Market Rate</span>
            <span>Premium</span>
          </div>

          {/* Comparable rows */}
          <div>
            {[
              { label: 'Area median price', val: '—', diff: null },
              { label: 'Price per m²',      val: property.area_sqm ? formatMoney((parseFloat(property.price) / Number(property.area_sqm)).toFixed(0), property.currency) : '—', diff: null },
              { label: 'Days vs avg',       val: `${daysOnMarket}d`, diff: daysOnMarket < 45 ? 'up' : 'down' },
            ].map(({ label, val, diff }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                <span style={{ color: C.textMuted, fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 700, color: diff === 'up' ? '#059669' : diff === 'down' ? '#DC2626' : C.forest }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </SideCard>

      {/* ── 4. Quick Actions ───────────────────────────────────────────────── */}
      <SideCard>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid rgba(26,60,40,0.08)`, background: 'rgba(26,60,40,0.03)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 style={{ width: 15, height: 15, color: C.forest, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.forest }}>Quick Actions</span>
        </div>
        <div style={{ padding: '12px 14px' }}>
          {[
            { label: 'Schedule a Viewing',  icon: Calendar,     tab: 'viewings',  highlight: true  },
            { label: 'View Enquiries',      icon: MessageSquare, tab: 'enquiries', highlight: false },
            { label: 'Open Houses',         icon: Eye,           tab: 'openhouses', highlight: false },
            { label: 'Manage Offers',       icon: Tag,           tab: 'offers',    highlight: false },
            { label: 'View Documents',      icon: TrendingUp,    tab: 'documents', highlight: false },
          ].map(({ label, icon: Icon, tab, highlight }) => (
            <button
              key={label}
              onClick={() => onTabChange(tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                marginBottom: 7, width: '100%', textAlign: 'left',
                background: highlight ? C.forest : 'rgba(26,60,40,0.04)',
                border: highlight ? 'none' : `1px solid ${C.border}`,
                color: highlight ? C.parchment : C.forest,
                transition: 'all 0.15s',
              }}
            >
              <Icon style={{ width: 14, height: 14, flexShrink: 0, color: highlight ? C.egreen : C.forest }} />
              {label}
              <ChevronRight style={{ width: 13, height: 13, marginLeft: 'auto', opacity: 0.4 }} />
            </button>
          ))}
          <Link
            href={`/app/my-listings/${listingId}/edit`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              marginBottom: 7, width: '100%', textAlign: 'left',
              background: 'rgba(196,86,42,0.05)',
              border: '1px solid rgba(196,86,42,0.2)',
              color: C.terra,
              textDecoration: 'none',
            }}
          >
            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, color: C.terra }} />
            Edit / Update Listing
            <ChevronRight style={{ width: 13, height: 13, marginLeft: 'auto', opacity: 0.4 }} />
          </Link>
        </div>
      </SideCard>
    </>
  );
}
