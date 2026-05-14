'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardView } from '@/views/open-houses/OHDashboardView';
import { OpenHousesView } from '@/views/open-houses/OHOpenHousesView';
import { LeadsView } from '@/views/open-houses/OHLeadsView';
import { MarketingView } from '@/views/open-houses/OHMarketingView';
import { WorkflowsView } from '@/views/open-houses/OHWorkflowsView';
import { TasksView } from '@/views/open-houses/OHTasksView';
import { SettingsView } from '@/views/open-houses/OHSettingsView';
import { agentApi, type OpenHouseRecord } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  forest:    '#1A3C28',
  parchment: '#F2E8D5',
  terra:     '#C4562A',
  egreen:    '#00E87A',
  amber:     '#B89040',
  gold:      '#F5C87A',
};

const TABS = [
  { key: 'dashboard',  label: 'Dashboard' },
  { key: 'on-show',    label: 'On Show' },
  { key: 'leads',      label: 'Leads' },
  { key: 'marketing',  label: 'Marketing' },
  { key: 'workflows',  label: 'Workflows' },
  { key: 'tasks',      label: 'Tasks' },
  { key: 'settings',   label: 'Settings' },
];

function TabContent({ tab }: { tab: string }) {
  switch (tab) {
    case 'on-show':    return <OpenHousesView />;
    case 'leads':      return <LeadsView />;
    case 'marketing':  return <MarketingView />;
    case 'workflows':  return <WorkflowsView />;
    case 'tasks':      return <TasksView />;
    case 'settings':   return <SettingsView />;
    default:           return <DashboardView />;
  }
}

function OnShowContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'dashboard';

  const [records, setRecords] = useState<OpenHouseRecord[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    agentApi.getOpenHouses(token)
      .then(data => setRecords(data ?? []))
      .catch(() => {/* strip stays at — */});
  }, []);

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  const eventsThisWeek = records.filter(r => {
    const d = new Date(r.scheduled_at);
    return d >= now && d <= weekEnd && r.status !== 'cancelled';
  }).length;

  const activeProperties = records.filter(r => r.status !== 'cancelled').length;

  const leadsTotal = records.reduce((sum, r) => sum + (r.max_attendees ?? 0), 0);

  const pendingTasks = records.reduce((sum, r) =>
    sum + (r.preparation_checklist ?? []).filter(t => !t.completed).length, 0);

  const kpiStrip = [
    { label: 'Active Properties', value: activeProperties > 0 ? String(activeProperties) : '—', color: C.egreen },
    { label: 'Events This Week',  value: eventsThisWeek > 0 ? String(eventsThisWeek) : '—', color: C.parchment },
    { label: 'Leads Captured',    value: leadsTotal > 0 ? String(leadsTotal) : '—', color: C.gold },
    { label: 'Active Workflows',  value: '—', color: C.parchment },
    { label: 'Pending Tasks',     value: pendingTasks > 0 ? String(pendingTasks) : '—', color: C.amber },
  ];


  return (
    <div
      style={{
        height: '100%',
        background: C.parchment,
        paddingLeft: '1.75rem',
        paddingRight: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Forest header ───────────────────────────────────────────────── */}
      <div
        style={{
          background: C.forest,
          marginLeft: '-1.75rem',
          marginRight: '-1.75rem',
          position: 'relative',
          overflow: 'hidden',
          padding: '24px 28px 0',
        }}
      >
        {/* Decorative circle — terra */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: C.terra,
            opacity: 0.07,
            pointerEvents: 'none',
          }}
        />
        {/* Decorative circle — egreen */}
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            left: '38%',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: C.egreen,
            opacity: 0.04,
            pointerEvents: 'none',
          }}
        />

        {/* Title */}
        <div
          style={{
            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            fontSize: '0.63rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.terra,
            marginBottom: 8,
          }}
        >
          Agent Cockpit &rsaquo; On Show Headquarters
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
            fontSize: '1.75rem',
            color: C.parchment,
            fontWeight: 700,
            lineHeight: 1.1,
            margin: '0 0 6px',
          }}
        >
          On Show
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            fontSize: '0.67rem',
            color: 'rgba(242,232,213,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
          }}
        >
          Manage open houses, leads &amp; marketing from one hub
        </p>

        {/* KPI strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
            marginTop: 20,
            position: 'relative',
          }}
        >
          {kpiStrip.map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(242,232,213,0.1)',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(242,232,213,0.45)',
                  marginBottom: 5,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            marginTop: 18,
            marginLeft: '-28px',
            marginRight: '-28px',
            paddingLeft: '28px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {TABS.map(({ key, label }) => {
            const isActive = activeTab === key;
            return (
              <Link
                key={key}
                href={`/app/on-show?tab=${key}`}
                scroll={false}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px 6px 0 0',
                  background: isActive ? C.terra : 'transparent',
                  color: isActive ? '#fff' : 'rgba(242,232,213,0.55)',
                  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                  fontSize: '0.68rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: isActive ? `2px solid ${C.terra}` : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tab content — negative margins expand the scroll area to full outer-div width,
           so full-bleed children (live banner) don't get clipped by overflowX:auto */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '1.5rem', marginLeft: '-1.75rem', marginRight: '-1.75rem' }}>
        <TabContent tab={activeTab} />
      </div>
    </div>
  );
}

export default function OnShowPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: '#666' }}>Loading…</div>}>
      <OnShowContent />
    </Suspense>
  );
}
