// @ts-nocheck
"use client"
import { useState } from 'react';
import {
  Mail,
  Facebook,
  Instagram,
  Twitter,
  MessageSquare,
  Sparkles,
  Users,
  Target,
  Filter,
  Eye,
  Send,
  Save,
  Clock,
  TrendingUp,
  MapPin,
  DollarSign,
  Home,
  Calendar,
  X,
  Check,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';

interface CampaignData {
  name: string;
  channels: {
    email: boolean;
    facebook: boolean;
    instagram: boolean;
    twitter: boolean;
    sms: boolean;
  };
  audience: {
    location: string[];
    priceRange: { min: string; max: string };
    propertyType: string[];
    leadStatus: string[];
    engagement: string;
  };
  content: {
    subject: string;
    headline: string;
    body: string;
    cta: string;
    image?: string;
  };
  schedule: {
    type: 'now' | 'scheduled';
    date: string;
    time: string;
  };
}

const initialCampaign: CampaignData = {
  name: '',
  channels: {
    email: true,
    facebook: false,
    instagram: false,
    twitter: false,
    sms: false,
  },
  audience: {
    location: [],
    priceRange: { min: '', max: '' },
    propertyType: [],
    leadStatus: [],
    engagement: 'all',
  },
  content: {
    subject: '',
    headline: '',
    body: '',
    cta: 'Schedule a Viewing',
    image: undefined,
  },
  schedule: {
    type: 'now',
    date: '',
    time: '',
  },
};

export function CampaignBuilder({ onClose }: { onClose: () => void }) {
  const [campaign, setCampaign] = useState<CampaignData>(initialCampaign);
  const [activeTab, setActiveTab] = useState<'audience' | 'channels' | 'content' | 'schedule'>('audience');
  const [isGenerating, setIsGenerating] = useState(false);
  const [estimatedReach, setEstimatedReach] = useState(247);

  const updateCampaign = (updates: Partial<CampaignData>) => {
    setCampaign((prev) => ({ ...prev, ...updates }));
  };

  const updateAudience = (updates: Partial<CampaignData['audience']>) => {
    setCampaign((prev) => ({
      ...prev,
      audience: { ...prev.audience, ...updates },
    }));
  };

  const updateContent = (updates: Partial<CampaignData['content']>) => {
    setCampaign((prev) => ({
      ...prev,
      content: { ...prev.content, ...updates },
    }));
  };

  const handleAIGenerate = async (field: 'subject' | 'headline' | 'body' | 'all') => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const generated = {
      subject: 'Your Dream Home Awaits - Exclusive Open House This Weekend',
      headline: 'Discover Your Perfect Property in San Francisco',
      body: "We're excited to invite you to our exclusive open house showcase featuring stunning properties in your preferred neighborhoods. Don't miss this opportunity to explore homes that match your exact criteria.\n\nJoin us this weekend and let our expert agents guide you through these exceptional listings. Space is limited, so reserve your spot today!",
    };

    if (field === 'all') {
      updateContent(generated);
    } else {
      updateContent({ [field]: generated[field] });
    }

    setIsGenerating(false);
  };

  const getActiveChannels = () => {
    return Object.entries(campaign.channels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Campaign Builder</h2>
            <p className="text-sm text-slate-600 mt-1">Create and launch marketing campaigns</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Campaign Name */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <input
            type="text"
            placeholder="Campaign Name (e.g., Spring Open House Promotion)"
            value={campaign.name}
            onChange={(e) => updateCampaign({ name: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Panel - Builder */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {[
                { id: 'audience', label: 'Audience', icon: Users },
                { id: 'channels', label: 'Channels', icon: Send },
                { id: 'content', label: 'Content', icon: Mail },
                { id: 'schedule', label: 'Schedule', icon: Clock },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-[500px] overflow-y-auto">
              {activeTab === 'audience' && (
                <AudienceTab
                  audience={campaign.audience}
                  updateAudience={updateAudience}
                  estimatedReach={estimatedReach}
                />
              )}
              {activeTab === 'channels' && (
                <ChannelsTab
                  channels={campaign.channels}
                  updateChannels={(channels) => updateCampaign({ channels })}
                />
              )}
              {activeTab === 'content' && (
                <ContentTab
                  content={campaign.content}
                  updateContent={updateContent}
                  onAIGenerate={handleAIGenerate}
                  isGenerating={isGenerating}
                  activeChannels={getActiveChannels()}
                />
              )}
              {activeTab === 'schedule' && (
                <ScheduleTab
                  schedule={campaign.schedule}
                  updateSchedule={(schedule) => updateCampaign({ schedule })}
                />
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-1 bg-slate-50">
            <PreviewPanel campaign={campaign} activeChannels={getActiveChannels()} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Target className="w-4 h-4" />
            <span>
              Estimated Reach: <strong className="text-slate-900">{estimatedReach} contacts</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={() => {
                console.log('Launching campaign:', campaign);
                onClose();
              }}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {campaign.schedule.type === 'now' ? 'Launch Campaign' : 'Schedule Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AudienceTab({
  audience,
  updateAudience,
  estimatedReach,
}: {
  audience: CampaignData['audience'];
  updateAudience: (updates: Partial<CampaignData['audience']>) => void;
  estimatedReach: number;
}) {
  const locations = ['San Francisco', 'Palo Alto', 'Mountain View', 'Sunnyvale', 'San Jose'];
  const propertyTypes = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'];
  const leadStatuses = ['New', 'Contacted', 'Qualified', 'Nurturing'];

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
  };

  return (
    <div className="space-y-6">
      {/* Reach Estimate */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900">Estimated Reach</p>
            <p className="text-2xl font-semibold text-blue-600 mt-1">{estimatedReach} contacts</p>
            <p className="text-sm text-slate-600 mt-1">Based on your current filters</p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
          <MapPin className="w-4 h-4" />
          Location
        </label>
        <div className="flex flex-wrap gap-2">
          {locations.map((location) => (
            <button
              key={location}
              onClick={() =>
                updateAudience({ location: toggleArrayItem(audience.location, location) })
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                audience.location.includes(location)
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {location}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
          <DollarSign className="w-4 h-4" />
          Price Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Min ($)"
            value={audience.priceRange.min}
            onChange={(e) =>
              updateAudience({
                priceRange: { ...audience.priceRange, min: e.target.value },
              })
            }
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Max ($)"
            value={audience.priceRange.max}
            onChange={(e) =>
              updateAudience({
                priceRange: { ...audience.priceRange, max: e.target.value },
              })
            }
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
          <Home className="w-4 h-4" />
          Property Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {propertyTypes.map((type) => (
            <button
              key={type}
              onClick={() =>
                updateAudience({ propertyType: toggleArrayItem(audience.propertyType, type) })
              }
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                audience.propertyType.includes(type)
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Status */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
          <Users className="w-4 h-4" />
          Lead Status
        </label>
        <div className="flex flex-wrap gap-2">
          {leadStatuses.map((status) => (
            <button
              key={status}
              onClick={() =>
                updateAudience({ leadStatus: toggleArrayItem(audience.leadStatus, status) })
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                audience.leadStatus.includes(status)
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Engagement Level */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
          <Filter className="w-4 h-4" />
          Engagement Level
        </label>
        <div className="relative">
          <select
            value={audience.engagement}
            onChange={(e) => updateAudience({ engagement: e.target.value })}
            className="w-full appearance-none px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="all">All Contacts</option>
            <option value="high">Highly Engaged</option>
            <option value="medium">Medium Engagement</option>
            <option value="low">Low Engagement</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function ChannelsTab({
  channels,
  updateChannels,
}: {
  channels: CampaignData['channels'];
  updateChannels: (channels: CampaignData['channels']) => void;
}) {
  const channelOptions = [
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: 'Send personalized emails to your contacts',
      reach: '247 contacts',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      description: 'Post to your Facebook business page',
      reach: '1.2K followers',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      description: 'Share on your Instagram profile',
      reach: '850 followers',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'text-sky-500',
      bg: 'bg-sky-50',
      description: 'Tweet to your Twitter audience',
      reach: '520 followers',
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: MessageSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      description: 'Send text messages to opted-in contacts',
      reach: '143 contacts',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Select the channels where you want to publish this campaign
      </p>

      {channelOptions.map((channel) => {
        const Icon = channel.icon;
        const isEnabled = channels[channel.id as keyof typeof channels];

        return (
          <div
            key={channel.id}
            className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
              isEnabled
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            onClick={() =>
              updateChannels({ ...channels, [channel.id]: !isEnabled })
            }
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${channel.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${channel.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900">{channel.name}</h4>
                  {isEnabled && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      <Check className="w-3 h-3" />
                      Active
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-2">{channel.description}</p>
                <p className="text-xs text-slate-500">Reach: {channel.reach}</p>
              </div>
              <button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isEnabled ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContentTab({
  content,
  updateContent,
  onAIGenerate,
  isGenerating,
  activeChannels,
}: {
  content: CampaignData['content'];
  updateContent: (updates: Partial<CampaignData['content']>) => void;
  onAIGenerate: (field: 'subject' | 'headline' | 'body' | 'all') => void;
  isGenerating: boolean;
  activeChannels: string[];
}) {
  return (
    <div className="space-y-6">
      {/* AI Generate All */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-slate-900 mb-1">AI Content Generation</h4>
            <p className="text-sm text-slate-600 mb-3">
              Let AI create engaging content for your campaign based on your audience and property
            </p>
            <button
              onClick={() => onAIGenerate('all')}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate All Content'}
            </button>
          </div>
        </div>
      </div>

      {/* Subject Line */}
      {activeChannels.includes('email') && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Email Subject Line</label>
            <button
              onClick={() => onAIGenerate('subject')}
              disabled={isGenerating}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              AI Generate
            </button>
          </div>
          <input
            type="text"
            placeholder="Enter email subject..."
            value={content.subject}
            onChange={(e) => updateContent({ subject: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-1">
            {content.subject.length}/100 characters
          </p>
        </div>
      )}

      {/* Headline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Headline</label>
          <button
            onClick={() => onAIGenerate('headline')}
            disabled={isGenerating}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            AI Generate
          </button>
        </div>
        <input
          type="text"
          placeholder="Enter headline..."
          value={content.headline}
          onChange={(e) => updateContent({ headline: e.target.value })}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        />
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Message Body</label>
          <button
            onClick={() => onAIGenerate('body')}
            disabled={isGenerating}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            AI Generate
          </button>
        </div>
        <textarea
          placeholder="Enter your message..."
          value={content.body}
          onChange={(e) => updateContent({ body: e.target.value })}
          rows={6}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
        />
      </div>

      {/* CTA Button */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Call-to-Action Button
        </label>
        <input
          type="text"
          placeholder="Button text..."
          value={content.cta}
          onChange={(e) => updateContent({ cta: e.target.value })}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Featured Image</label>
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-300 transition-colors">
          <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 mb-1">
            <span className="font-medium text-slate-900">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
        </div>
      </div>
    </div>
  );
}

function ScheduleTab({
  schedule,
  updateSchedule,
}: {
  schedule: CampaignData['schedule'];
  updateSchedule: (schedule: CampaignData['schedule']) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Schedule Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          When should this campaign be sent?
        </label>
        <div className="space-y-3">
          <button
            onClick={() => updateSchedule({ ...schedule, type: 'now' })}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
              schedule.type === 'now'
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                schedule.type === 'now' ? 'border-slate-900' : 'border-slate-300'
              }`}>
                {schedule.type === 'now' && (
                  <div className="w-3 h-3 bg-slate-900 rounded-full" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">Send Now</p>
                <p className="text-sm text-slate-600">Campaign will be sent immediately</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => updateSchedule({ ...schedule, type: 'scheduled' })}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
              schedule.type === 'scheduled'
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                schedule.type === 'scheduled' ? 'border-slate-900' : 'border-slate-300'
              }`}>
                {schedule.type === 'scheduled' && (
                  <div className="w-3 h-3 bg-slate-900 rounded-full" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">Schedule for Later</p>
                <p className="text-sm text-slate-600">Choose a specific date and time</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Date & Time Picker */}
      {schedule.type === 'scheduled' && (
        <div className="space-y-4 pl-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              value={schedule.date}
              onChange={(e) => updateSchedule({ ...schedule, date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
            <input
              type="time"
              value={schedule.time}
              onChange={(e) => updateSchedule({ ...schedule, time: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Scheduled campaigns will be sent in your timezone (PST)
            </p>
          </div>
        </div>
      )}

      {/* Best Times Suggestion */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-slate-900 mb-1">Best Times to Send</h4>
            <p className="text-sm text-slate-600 mb-2">
              Based on your audience engagement data:
            </p>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• Weekdays: 10:00 AM - 11:00 AM</p>
              <p>• Weekends: 2:00 PM - 4:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({
  campaign,
  activeChannels,
}: {
  campaign: CampaignData;
  activeChannels: string[];
}) {
  const [previewMode, setPreviewMode] = useState<'email' | 'social'>('email');

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-slate-600" />
          <h3 className="font-medium text-slate-900">Preview</h3>
        </div>
        {activeChannels.length > 1 && (
          <div className="flex gap-2">
            {activeChannels.includes('email') && (
              <button
                onClick={() => setPreviewMode('email')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  previewMode === 'email'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                Email
              </button>
            )}
            {(activeChannels.includes('facebook') ||
              activeChannels.includes('instagram') ||
              activeChannels.includes('twitter')) && (
              <button
                onClick={() => setPreviewMode('social')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  previewMode === 'social'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                Social
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {previewMode === 'email' ? (
          <EmailPreview campaign={campaign} />
        ) : (
          <SocialPreview campaign={campaign} />
        )}
      </div>
    </div>
  );
}

function EmailPreview({ campaign }: { campaign: CampaignData }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Email Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="text-xs text-slate-600 mb-1">From: sarah.johnson@realestate.com</div>
        <div className="font-medium text-slate-900">
          {campaign.content.subject || 'Email Subject Line'}
        </div>
      </div>

      {/* Email Body */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          {campaign.content.headline || 'Campaign Headline'}
        </h2>
        <div className="text-slate-700 whitespace-pre-wrap mb-6">
          {campaign.content.body || 'Your campaign message will appear here...'}
        </div>
        <button className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
          {campaign.content.cta}
        </button>
      </div>

      {/* Email Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
        RealEstate Pro • Unsubscribe • Manage Preferences
      </div>
    </div>
  );
}

function SocialPreview({ campaign }: { campaign: CampaignData }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-200">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          SJ
        </div>
        <div>
          <p className="font-medium text-slate-900">Sarah Johnson</p>
          <p className="text-xs text-slate-500">Just now</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-2">
          {campaign.content.headline || 'Campaign Headline'}
        </h3>
        <p className="text-slate-700 text-sm mb-3">
          {campaign.content.body || 'Your campaign message will appear here...'}
        </p>
        {campaign.content.image && (
          <div className="w-full h-48 bg-slate-100 rounded-lg mb-3" />
        )}
        <button className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
          {campaign.content.cta}
        </button>
      </div>

      {/* Post Footer */}
      <div className="px-4 pb-4 flex items-center gap-4 text-sm text-slate-600">
        <button className="hover:text-slate-900">Like</button>
        <button className="hover:text-slate-900">Comment</button>
        <button className="hover:text-slate-900">Share</button>
      </div>
    </div>
  );
}
