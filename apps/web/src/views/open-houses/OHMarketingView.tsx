// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { Plus, Megaphone } from 'lucide-react';
import { MediaManager } from '@/components/open-houses/MediaManager';
import { CampaignBuilder } from '@/components/open-houses/CampaignBuilder';
import { agentApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

export function MarketingView() {
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [activeTab, setActiveTab] = useState<'media' | 'campaigns'>('media');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Marketing</h2>
          <p className="text-slate-600">Manage your marketing materials and campaigns</p>
        </div>
        <button
          onClick={() => setShowCampaignBuilder(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'media'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Media Library
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'campaigns'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Campaigns
        </button>
      </div>

      {/* Content */}
      {activeTab === 'media' ? (
        <MediaManager />
      ) : (
        <CampaignsTab onCreateCampaign={() => setShowCampaignBuilder(true)} />
      )}

      {/* Campaign Builder Modal */}
      {showCampaignBuilder && (
        <CampaignBuilder onClose={() => setShowCampaignBuilder(false)} />
      )}
    </div>
  );
}

function CampaignsTab({ onCreateCampaign }: { onCreateCampaign: () => void }) {
  const [openHouses, setOpenHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    agentApi.getOpenHouses(token)
      .then((data) => setOpenHouses(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const campaigns = openHouses.map((oh) => ({
    id: oh.id,
    name: oh.property_title,
    status: oh.status === 'completed' ? 'active' : oh.status === 'scheduled' ? 'scheduled' : 'draft',
    channels: (oh.marketing_options ?? []).filter((m) => m.enabled).map((m) => m.channel),
    scheduledAt: oh.scheduled_at,
  }));

  const activeCampaigns = campaigns.filter((c) => c.status === 'scheduled').length;
  const totalChannels = openHouses.reduce((sum, oh) => sum + (oh.marketing_options ?? []).filter((m) => m.enabled).length, 0);

  const statusConfig = {
    active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    draft: { label: 'Draft', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Houses', value: loading ? '…' : String(campaigns.length) },
          { label: 'Upcoming', value: loading ? '…' : String(activeCampaigns) },
          { label: 'Channels Configured', value: loading ? '…' : String(totalChannels) },
          { label: 'With Marketing', value: loading ? '…' : String(campaigns.filter((c) => c.channels.length > 0).length) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Campaign List */}
      {!loading && campaigns.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Channels</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{campaign.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                        statusConfig[campaign.status as keyof typeof statusConfig]?.color ?? statusConfig.draft.color
                      }`}
                    >
                      {statusConfig[campaign.status as keyof typeof statusConfig]?.label ?? campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {campaign.channels.length > 0 ? (
                      <div className="flex gap-1">
                        {campaign.channels.map((channel) => (
                          <div
                            key={channel}
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-medium text-slate-600"
                            title={channel}
                          >
                            {channel[0].toUpperCase()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">None set</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {new Date(campaign.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && campaigns.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-900 font-medium mb-1">No open houses yet</p>
          <p className="text-sm text-slate-600 mb-4">Create an open house and configure its marketing channels to reach your audience</p>
          <button
            onClick={onCreateCampaign}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Create Campaign
          </button>
        </div>
      )}
    </div>
  );
}