// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyListView } from '@/components/open-houses/PropertyListView';
import { agentApi, propertiesApi, type OpenHouseRecord } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

function fmt(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function PropertiesView() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.push('/login?next=/app/open-houses/properties'); return; }
    setLoading(true);
    Promise.all([
      agentApi.getOpenHouses(token),
      propertiesApi.getAgentListingsPerformance(token),
    ])
      .then(([openHouses, listings]) => {
        const listingMap = new Map((listings ?? []).map((l: any) => [l.id, l]));
        const now = new Date();
        const rows = (openHouses ?? []).map((r: OpenHouseRecord) => {
          const listing = listingMap.get(r.property_id) as any;
          const start = new Date(r.scheduled_at);
          const end = new Date(r.end_at);
          const isLive = r.status === 'scheduled' && now >= start && now <= end;
          const price = listing
            ? `${listing.currency ?? ''} ${Number(listing.price).toLocaleString()}`.trim()
            : '—';
          return {
            id: r.id,
            address: r.property_title ?? 'Untitled',
            city: listing?.city ?? '',
            state: listing?.region ?? '',
            date: start.toISOString().split('T')[0],
            time: `${fmt(start)} – ${fmt(end)}`,
            status: isLive ? 'live' : r.status,
            attendees: r.max_attendees ?? 0,
            views: listing?.views ?? 0,
            price,
            type: '',
            agent: '',
          };
        });
        setProperties(rows);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load properties'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Properties</h2>
        <p className="text-slate-600">Manage all your open house listings</p>
      </div>
      <PropertyListView properties={properties} loading={loading} error={error} />
    </div>
  );
}
