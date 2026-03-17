'use client';

import { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { propertiesApi, type PropertyStats, type ListingViewingRecord } from '@/lib/api-client';

interface Props {
  propertyId: string;
  authToken: string;
}

export function Showings({ propertyId, authToken }: Props) {
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [viewings, setViewings] = useState<ListingViewingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authToken) { setIsLoading(false); return; }
    setIsLoading(true);
    Promise.all([
      propertiesApi.getPropertyStats(authToken, propertyId),
      propertiesApi.getPropertyViewings(authToken, propertyId),
    ])
      .then(([propertyStats, propertyViewings]) => {
        setStats(propertyStats);
        setViewings(propertyViewings);
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
