'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import { agentApi, propertiesApi, type ActivityFeedItem, type PropertyStats } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/formatters';

interface Props {
  propertyId: string;
  authToken: string;
  onTabChange: (tab: string) => void;
}

function describeActivity(item: ActivityFeedItem): string {
  const meta = item.metadata ?? {};
  switch (item.action) {
    case 'viewing_requested': return 'New viewing request';
    case 'viewing_confirmed': return 'Viewing confirmed';
    case 'viewing_cancelled': return 'Viewing cancelled';
    case 'inquiry_created': return 'New enquiry received';
    case 'inquiry_responded': return 'Enquiry responded';
    case 'open_house_scheduled': return 'Open house scheduled';
    case 'offer_received': return meta.amount ? `Offer received: ${meta.amount}` : 'New offer received';
    default: return `${item.entity_type} ${item.action}`.replace(/_/g, ' ');
  }
}

function tabForActivity(item: ActivityFeedItem): string {
  switch (item.entity_type) {
    case 'viewing': return 'viewings';
    case 'inquiry': return 'enquiries';
    case 'open_house': return 'openhouses';
    case 'offer': return 'offers';
    default: return 'viewings';
  }
}

export function ActivitySummary({ propertyId, authToken, onTabChange }: Props) {
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      agentApi.getActivityFeed(authToken),
      propertiesApi.getPropertyStats(authToken, propertyId),
    ])
      .then(([feedItems, propertyStats]) => {
        setFeed(feedItems.filter((item) => item.entity_id === propertyId).slice(0, 5));
        setStats(propertyStats);
      })
      .catch(() => {
        // Non-critical — silently skip on error
      })
      .finally(() => setIsLoading(false));
  }, [propertyId, authToken]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex justify-center">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (feed.length === 0 && !stats) return null;

  const pendingViewings = stats?.viewings_requested ?? 0;
  const enquiries = stats?.inquiries ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      {/* Summary chips */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        {pendingViewings > 0 && (
          <button
            onClick={() => onTabChange('viewings')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm hover:bg-blue-100 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            {pendingViewings} viewing{pendingViewings !== 1 ? 's' : ''} requested
          </button>
        )}
        {enquiries > 0 && (
          <button
            onClick={() => onTabChange('enquiries')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-sm hover:bg-purple-100 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {enquiries} enquir{enquiries !== 1 ? 'ies' : 'y'}
          </button>
        )}
        {stats && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-sm">
            <TrendingUp className="w-3.5 h-3.5" />
            {stats.views} views · {stats.days_on_market}d on market
          </span>
        )}
      </div>

      {/* Activity feed */}
      {feed.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Recent Activity
          </p>
          {feed.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(tabForActivity(item))}
              className="w-full flex items-center gap-2 text-left text-sm py-1.5 px-2 rounded hover:bg-gray-50 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="flex-1 text-gray-700">{describeActivity(item)}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {formatRelativeTime(item.created_at)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
