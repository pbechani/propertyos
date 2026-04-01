'use client';

import React from 'react';
import { Link } from '@/lib/router-compat';
import { Shield, CheckCircle, Globe, TrendingUp } from 'lucide-react';

const C = {
  parchment: '#F2E8D5',
  cream: '#EAD9C4',
  forest: '#1A3C28',
  carbon: '#0C0D10',
  egreen: '#00E87A',
};

interface TrustItem {
  icon: React.ReactNode;
  label: string;
  sub: string;
}

const DEFAULT_TRUST_ITEMS: TrustItem[] = [
  {
    icon: <Shield className="w-4 h-4" />,
    label: 'Escrow Protection',
    sub: 'Funds secured until legal transfer is complete',
  },
  {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Verified Professionals',
    sub: 'KYC-cleared agents, contractors & conveyancers',
  },
  {
    icon: <Globe className="w-4 h-4" />,
    label: 'Diaspora Trusted',
    sub: 'Remote oversight for international investors',
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    label: '14-Stage Pipeline',
    sub: 'Full transparency at every purchase step',
  },
];

export interface AuthLayoutProps {
  /** 'split': form left + trust panel right (Login, Register) */
  variant: 'split' | 'centered' | 'wide';
  children: React.ReactNode;
  /** Uppercase label above the split panel heading */
  panelTagline?: string;
  /** Main heading shown in the split trust panel */
  panelTitle?: string;
  /** Substring of panelTitle to render in egreen */
  panelHighlight?: string;
  trustItems?: TrustItem[];
}

function LogoMark() {
  return (
    <Link
      to="/"
      style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
    >
      <div
        style={{
          width: 36, height: 36,
          background: C.forest, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <span
          style={{
            color: C.egreen,
            fontFamily: 'var(--font-fraunces)',
            fontSize: 16, fontWeight: 700, lineHeight: 1,
          }}
        >
          B
        </span>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 20, fontWeight: 700,
          color: C.forest, letterSpacing: '-0.02em',
        }}
      >
        BuildTrust
      </span>
    </Link>
  );
}

function FooterLinks() {
  return (
    <p style={{ fontSize: 11, color: `${C.forest}60`, lineHeight: 1.5, textAlign: 'center' }}>
      © 2026 BuildTrust ·{' '}
      <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>{' '}·{' '}
      <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
    </p>
  );
}

function renderHighlighted(title: string, highlight?: string) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>;
  const parts = title.split(highlight);
  return (
    <>
      {parts[0]}
      <span style={{ color: C.egreen }}>{highlight}</span>
      {parts[1]}
    </>
  );
}

export function AuthLayout({
  variant,
  children,
  panelTagline = 'FINANCIAL-GRADE PLATFORM',
  panelTitle = 'Property transactions you can trust',
  panelHighlight = 'trust',
  trustItems = DEFAULT_TRUST_ITEMS,
}: AuthLayoutProps) {

  // ─── SPLIT (Login / Register) ───────────────────────────────────────────
  if (variant === 'split') {
    return (
      <div
        className="flex min-h-screen"
        style={{ background: C.parchment, fontFamily: 'var(--font-jakarta)' }}
      >
        {/* Left: Form panel */}
        <div
          className="flex flex-col w-full lg:w-1/2 overflow-y-auto"
          style={{ background: C.parchment, padding: '48px 56px' }}
        >
          <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'center' }}>
            <LogoMark />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
              {children}
            </div>
          </div>

          <div style={{ marginTop: 40 }}>
            <FooterLinks />
          </div>
        </div>

        {/* Right: Trust panel (hidden on mobile) */}
        <div
          className="hidden lg:flex lg:w-1/2 flex-col justify-center relative overflow-hidden"
          style={{ background: C.carbon, padding: '64px 56px' }}
        >
          {/* Grid texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,232,122,0.05) 1px, transparent 1px), ' +
                'linear-gradient(90deg, rgba(0,232,122,0.05) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          {/* Radial glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: -160, right: -60,
              width: 440, height: 440,
              background: `radial-gradient(circle, ${C.forest}70 0%, transparent 68%)`,
            }}
          />

          <div className="relative z-10">
            {panelTagline && (
              <p
                style={{
                  fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: C.egreen, marginBottom: 16, fontFamily: 'var(--font-mono)',
                }}
              >
                {panelTagline}
              </p>
            )}

            {panelTitle && (
              <h2
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 40, fontWeight: 700,
                  color: 'white', lineHeight: 1.1,
                  marginBottom: 40,
                }}
              >
                {renderHighlighted(panelTitle, panelHighlight)}
              </h2>
            )}

            {/* Trust items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {trustItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      width: 34, height: 34, flexShrink: 0,
                      background: `${C.forest}bb`, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: C.egreen }}>{item.icon}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Metric row */}
            <div
              style={{
                display: 'flex', gap: 32,
                marginTop: 36, paddingTop: 28,
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {([['12,400+', 'Verified Users'], ['$4.2M', 'Escrowed Value'], ['99.5%', 'Uptime']] as [string, string][]).map(([val, lbl]) => (
                <div key={lbl}>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 18, fontWeight: 700, color: C.egreen,
                    }}
                  >
                    {val}
                  </p>
                  <p
                    style={{
                      fontSize: 10, color: 'rgba(255,255,255,0.38)',
                      marginTop: 2, letterSpacing: '0.06em',
                    }}
                  >
                    {lbl}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── WIDE (ProfileSetup) ─────────────────────────────────────────────────
  if (variant === 'wide') {
    return (
      <div
        className="min-h-screen"
        style={{ background: C.parchment, fontFamily: 'var(--font-jakarta)' }}
      >
        <header
          className="flex items-center justify-between px-8 py-4"
          style={{ borderBottom: `1px solid ${C.cream}` }}
        >
          <LogoMark />
          <p style={{ fontSize: 12, color: `${C.forest}70` }}>Account Setup</p>
        </header>
        <div className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </div>
      </div>
    );
  }

  // ─── CENTERED (all utility screens) ─────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: C.parchment, fontFamily: 'var(--font-jakarta)' }}
    >
      <div style={{ marginBottom: 28 }}>
        <LogoMark />
      </div>

      <div
        className="w-full"
        style={{
          maxWidth: 440,
          background: 'white',
          borderRadius: 16,
          border: `1px solid ${C.cream}`,
          boxShadow: '0 4px 32px rgba(26,60,40,0.07)',
          padding: '36px 40px',
        }}
      >
        {children}
      </div>

      <div style={{ marginTop: 20 }}>
        <FooterLinks />
      </div>
    </div>
  );
}
