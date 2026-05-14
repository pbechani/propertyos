'use client';

import { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { propertiesApi, type PropertyStats, type ListingViewingRecord, type ViewingAnalytics } from '@/lib/api-client';

interface Props {
  propertyId: string;
  authToken: string;
}

export function Showings({ propertyId, authToken }: Props) {
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [viewings, setViewings] = useState<ListingViewingRecord[]>([]);
  const [analytics, setAnalytics] = useState<ViewingAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authToken) { setIsLoading(false); return; }
    setIsLoading(true);
    Promise.all([
      propertiesApi.getPropertyStats(authToken, propertyId),
      propertiesApi.getPropertyViewings(authToken, propertyId),
      propertiesApi.getViewingAnalytics(authToken, propertyId).catch(() => null),
    ])
      .then(([propertyStats, propertyViewings, viewingAnalytics]) => {
        setStats(propertyStats);
        setViewings(propertyViewings);
        if (viewingAnalytics) setAnalytics(viewingAnalytics);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load showings'))
      .finally(() => setIsLoading(false));
  }, [propertyId, authToken]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 text-sm">{error}</div>;
  }

  const recent = viewings.slice(0, 10);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Showings Summary</h3>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-2xl font-semibold text-gray-900">{stats.viewings_requested}</div>
            <div className="text-xs text-gray-500 mt-0.5">Requested</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-2xl font-semibold text-gray-900">{stats.viewings_confirmed}</div>
            <div className="text-xs text-gray-500 mt-0.5">Confirmed</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="text-2xl font-semibold text-gray-900">{stats.viewings_completed}</div>
            <div className="text-xs text-gray-500 mt-0.5">Completed</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-semibold text-gray-900">{stats.viewings_declined}</div>
            <div className="text-xs text-gray-500 mt-0.5">Declined</div>
          </div>
        </div>
      )}

      {/* Feedback Intelligence */}
      <div className="bg-[#1A3C28]/[0.03] border border-[#1A3C28]/10 rounded-2xl p-4">
        <p
          className="text-sm font-bold text-[#1A3C28] mb-4"
          style={{ fontFamily: 'Fraunces, serif' }}
        >
          Feedback Intelligence
        </p>
        {analytics && (analytics.topLikes.length > 0 || analytics.topDislikes.length > 0 || analytics.completed > 0) ? (
          <div className="space-y-5">
            {/* Interest distribution */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1A3C28]/50 mb-2">Interest Level</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { label: 'Low',    value: analytics.interestDistribution.low,    color: 'bg-[#C4562A]/10 text-[#C4562A] border-[#C4562A]/20' },
                  { label: 'Medium', value: analytics.interestDistribution.medium, color: 'bg-[#B89040]/10 text-[#B89040] border-[#B89040]/20' },
                  { label: 'High',   value: analytics.interestDistribution.high,   color: 'bg-[#00E87A]/10 text-[#0D7039] border-[#00E87A]/20' },
                ] as const).map(({ label, value, color }) => (
                  <div key={label} className={`rounded-xl border px-3 py-2.5 text-center ${color}`}>
                    <div className="text-lg font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{value}</div>
                    <div className="text-[10px] font-bold mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intent breakdown */}
            {Object.keys(analytics.intentBreakdown).length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1A3C28]/50 mb-2">Buyer Intent</p>
                <div className="space-y-2">
                  {([
                    { key: 'not_interested',  label: 'Not Interested' },
                    { key: 'considering',     label: 'Considering' },
                    { key: 'second_viewing',  label: 'Second Viewing' },
                    { key: 'ready_to_offer',  label: 'Ready to Offer' },
                  ] as const).map(({ key, label }) => {
                    const count = analytics.intentBreakdown[key] ?? 0;
                    const total = Object.values(analytics.intentBreakdown).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-[10px] text-[#1A3C28]/60 mb-0.5">
                          <span>{label}</span>
                          <span className="font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{count}</span>
                        </div>
                        <div className="h-1.5 bg-[#1A3C28]/[0.07] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1A3C28]/40 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top objections */}
            {Object.keys(analytics.objectionBreakdown).length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1A3C28]/50 mb-2">Objections Raised</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(analytics.objectionBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([key, count]) => (
                      <span
                        key={key}
                        className="bg-[#C4562A]/10 text-[#C4562A] border border-[#C4562A]/20 rounded-full px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1"
                      >
                        {key.replace(/_/g, ' ')}
                        <span className="bg-[#C4562A]/20 rounded-full px-1 text-[9px] font-bold">{count}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Top liked & disliked */}
            {analytics.topLikes.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1A3C28]/50 mb-2">Most Liked</p>
                <div className="flex flex-wrap gap-1.5">
                  {analytics.topLikes.map((tag) => (
                    <span key={tag} className="bg-[#00E87A]/10 text-[#0D7039] border border-[#00E87A]/20 rounded-full px-2.5 py-1 text-[10px] font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analytics.topDislikes.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1A3C28]/50 mb-2">Common Dislikes</p>
                <div className="flex flex-wrap gap-1.5">
                  {analytics.topDislikes.map((tag) => (
                    <span key={tag} className="bg-[#C4562A]/10 text-[#C4562A] border border-[#C4562A]/20 rounded-full px-2.5 py-1 text-[10px] font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI banner placeholder */}
            <div className="bg-[#B89040]/10 border border-[#B89040]/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <span className="text-base">✦</span>
              <p className="text-[10px] text-[#1A3C28]/60 font-medium">
                AI Insights coming soon — price resistance patterns, buyer journey analysis.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#1A3C28]/40 text-center py-4">
            No feedback captured yet. Start a Live Capture from the Viewings tab.
          </p>
        )}
      </div>

      {recent.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700">Recent Viewings</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {recent.map((v) => {
              const dt = new Date(v.scheduled_at);
              const buyerName =
                [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || '—';
              return (
                <div key={v.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{buyerName}</div>
                    <div className="text-xs text-gray-500">
                      {dt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {v.buyer_feedback && (
                      <span className="text-xs text-gray-500 italic max-w-[150px] truncate">
                        "{v.buyer_feedback}"
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        v.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : v.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Eye className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No showings recorded yet.</p>
        </div>
      )}
    </div>
  );
}
