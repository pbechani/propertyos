'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Home,
  Search,
  CheckCircle2,
  Send,
  Mail,
  MessageSquare,
  Link,
  Bed,
  Bath,
  Square,
  Star,
  Filter,
} from 'lucide-react';
import { leadsApi, propertiesApi, type LeadRow, type PropertyListing } from '@/lib/api-client';

interface Props {
  lead: LeadRow;
  authToken: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type DeliveryMethod = 'email' | 'sms' | 'portal';

const emailTemplates = [
  {
    id: '1',
    name: 'Property Match',
    subject: 'Properties That Match Your Criteria',
    body: `Hi {name},\n\nI found some exciting properties that match exactly what you're looking for. I've included the details below and would love to schedule viewings for any that interest you.\n\nThese are fresh on the market and I wanted to make sure you saw them first.\n\nLet me know which ones you'd like to see!\n\nBest regards`,
  },
  {
    id: '2',
    name: 'New Listings',
    subject: 'Just Listed — Fresh Properties For You',
    body: `Hi {name},\n\nGreat news! Some new properties just hit the market that I think you'll love. I've attached the details below.\n\nThese won't last long, so let's schedule viewings ASAP if any catch your eye.\n\nLooking forward to hearing from you!\n\nBest regards`,
  },
  {
    id: '3',
    name: 'Price Reduction',
    subject: 'Price Reductions on Properties You Liked',
    body: `Hi {name},\n\nExciting update! Some properties you showed interest in have just had price reductions. This could be a great opportunity.\n\nCheck out the updated details below and let me know if you'd like to take another look.\n\nBest regards`,
  },
];

function formatPrice(price: string, currency: string) {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return num.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
}

export function SendPropertiesModal({ lead, authToken, onClose, onSuccess }: Props) {
  const [properties, setProperties]       = useState<PropertyListing[]>([]);
  const [loadingProps, setLoadingProps]   = useState(true);
  const [selectedIds, setSelectedIds]     = useState<string[]>([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');
  const [subject, setSubject]             = useState('');
  const [message, setMessage]             = useState('');
  const [includeVirtualTour, setIncludeVirtualTour] = useState(true);
  const [includeFloorPlans, setIncludeFloorPlans]   = useState(true);
  const [scheduleFollowUp, setScheduleFollowUp]     = useState(false);
  const [followUpDays, setFollowUpDays]             = useState('3');
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Load agent's own listings
  useEffect(() => {
    propertiesApi.getMyListings(authToken).then((res) => {
      setProperties(res.data ?? []);
    }).catch(() => {
      setProperties([]);
    }).finally(() => setLoadingProps(false));
  }, [authToken]);

  const filteredProperties = properties.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.title ?? '').toLowerCase().includes(q) ||
      (p.location?.address_line1 ?? '').toLowerCase().includes(q) ||
      (p.location?.city ?? '').toLowerCase().includes(q)
    );
  });

  const toggleProperty = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleSelectAll = () =>
    setSelectedIds(selectedIds.length === filteredProperties.length ? [] : filteredProperties.map((p) => p.id));

  const handleSelectTemplate = (template: typeof emailTemplates[0]) => {
    setSubject(template.subject);
    setMessage(template.body.replace('{name}', lead.name.split(' ')[0]));
  };

  const buildEmailBody = () => {
    const selected = properties.filter((p) => selectedIds.includes(p.id));
    const propList = selected.map((p) => {
      const addr = [p.location?.address_line1, p.location?.city].filter(Boolean).join(', ');
      const price = formatPrice(p.price, p.currency);
      const beds  = p.bedrooms ? `${p.bedrooms} bed` : null;
      const baths = p.bathrooms ? `${p.bathrooms} bath` : null;
      const area  = p.area_sqm ? `${p.area_sqm}m²` : null;
      return `• ${p.title ?? addr} — ${price}${beds || baths || area ? ` (${[beds, baths, area].filter(Boolean).join(', ')})` : ''}`;
    }).join('\n');

    const extras = [
      includeVirtualTour ? '[Virtual tour links included]' : null,
      includeFloorPlans  ? '[Floor plans available on request]' : null,
    ].filter(Boolean).join('\n');

    return `${message}\n\n${propList}${extras ? `\n\n${extras}` : ''}`;
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      if (deliveryMethod === 'email') {
        if (!lead.email) throw new Error('This lead has no email address');
        await leadsApi.sendEmail(authToken, lead.id, {
          subject: subject || 'Properties for you',
          body: buildEmailBody(),
        });
      } else {
        // SMS / Portal — log as activity
        const desc = `Sent ${selectedIds.length} propert${selectedIds.length === 1 ? 'y' : 'ies'} via ${deliveryMethod === 'sms' ? 'SMS' : 'portal link'}. ${message ? `Message: ${message}` : ''}`;
        await leadsApi.createActivity(authToken, lead.id, {
          type: 'property-sent',
          description: desc.trim(),
        });
      }

      // Always log the send as an activity
      if (deliveryMethod === 'email') {
        const selected = properties.filter((p) => selectedIds.includes(p.id));
        const titles = selected.map((p) => p.title ?? p.location?.address_line1 ?? p.id).join(', ');
        await leadsApi.createActivity(authToken, lead.id, {
          type: 'property-sent',
          description: `Sent ${selectedIds.length} propert${selectedIds.length === 1 ? 'y' : 'ies'} via email: ${titles}`,
        });
      }

      if (scheduleFollowUp) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + parseInt(followUpDays));
        await leadsApi.createActivity(authToken, lead.id, {
          type: 'note',
          description: `Follow-up reminder set for ${followUpDate.toLocaleDateString()} — check in about properties sent`,
          metadata: { scheduled_at: followUpDate.toISOString() },
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send properties');
    } finally {
      setSaving(false);
    }
  };

  const canSend = selectedIds.length > 0 && (deliveryMethod !== 'email' || !!subject);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Send Properties</h2>
                <p className="text-sm text-gray-600 mt-0.5">to {lead.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Delivery Method Tabs */}
          <div className="flex gap-2 mt-4">
            {([
              { value: 'email',  label: 'Email',       icon: Mail },
              { value: 'sms',    label: 'SMS',          icon: MessageSquare },
              { value: 'portal', label: 'Portal Link',  icon: Link },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setDeliveryMethod(value)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  deliveryMethod === value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content — 2-column */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 divide-x divide-gray-200">

            {/* ── Left: Property Selection ───────────────────────────── */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Select Properties</h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {selectedIds.length === filteredProperties.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search properties…"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 mb-2">
                  <span className="text-sm font-medium text-purple-900">
                    {selectedIds.length} {selectedIds.length === 1 ? 'property' : 'properties'} selected
                  </span>
                </div>
              </div>

              {/* Property List */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto">
                {loadingProps ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading your listings…</p>
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <Filter className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No listings found</p>
                  </div>
                ) : (
                  filteredProperties.map((property) => {
                    const isSelected = selectedIds.includes(property.id);
                    const primaryMedia = property.media?.find((m) => m.is_primary) ?? property.media?.[0];
                    const addr = [property.location?.address_line1, property.location?.city].filter(Boolean).join(', ');
                    return (
                      <div
                        key={property.id}
                        onClick={() => toggleProperty(property.id)}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          isSelected ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex gap-3">
                          {primaryMedia ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={primaryMedia.url}
                              alt={property.title}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                              <Home className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="font-semibold text-gray-900 text-sm truncate">
                                {property.title || addr || 'Untitled'}
                              </div>
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />}
                            </div>
                            {addr && (
                              <div className="text-xs text-gray-600 mb-2">{addr}</div>
                            )}
                            <div className="text-sm font-semibold text-purple-600 mb-2">
                              {formatPrice(property.price, property.currency)}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              {property.bedrooms && (
                                <div className="flex items-center gap-1">
                                  <Bed className="w-3 h-3" /> {property.bedrooms}
                                </div>
                              )}
                              {property.bathrooms && (
                                <div className="flex items-center gap-1">
                                  <Bath className="w-3 h-3" /> {property.bathrooms}
                                </div>
                              )}
                              {property.area_sqm && (
                                <div className="flex items-center gap-1">
                                  <Square className="w-3 h-3" /> {property.area_sqm}m²
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {property.status === 'active' && (
                          <div className="mt-2 pt-2 border-t border-purple-200">
                            <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Active Listing
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── Right: Message Customization ───────────────────────── */}
            <div className="p-6 space-y-4">

              {deliveryMethod === 'email' && (
                <>
                  {/* Templates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
                    <div className="space-y-2">
                      {emailTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className="w-full text-left px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{template.subject}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={7}
                      placeholder="Type your message…"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeVirtualTour}
                        onChange={(e) => setIncludeVirtualTour(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Include virtual tour links</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeFloorPlans}
                        onChange={(e) => setIncludeFloorPlans(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Include floor plans</span>
                    </label>
                  </div>
                </>
              )}

              {deliveryMethod === 'sms' && (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-yellow-900 mb-1">SMS Message</div>
                        <div className="text-xs text-yellow-800">
                          A text message will be sent with property links. Character limit: 160 chars.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={160}
                      placeholder="Hi! I found some properties you'll love. Check them out:"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <div className="text-xs text-gray-500 mt-1">{message.length}/160 characters</div>
                  </div>
                </div>
              )}

              {deliveryMethod === 'portal' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Link className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-blue-900 mb-1">Client Portal</div>
                        <div className="text-xs text-blue-800">
                          Selected properties will be logged in the lead's activity timeline with a portal note.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Optional Note</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      placeholder="Add a personal note…"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Follow-up Schedule */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleFollowUp}
                    onChange={(e) => setScheduleFollowUp(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Schedule follow-up reminder</span>
                    <p className="text-xs text-gray-600 mt-0.5">Get reminded to check in with the lead</p>
                    {scheduleFollowUp && (
                      <select
                        value={followUpDays}
                        onChange={(e) => setFollowUpDays(e.target.value)}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="1">1 day later</option>
                        <option value="3">3 days later</option>
                        <option value="7">1 week later</option>
                        <option value="14">2 weeks later</option>
                      </select>
                    )}
                  </div>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {selectedIds.length} {selectedIds.length === 1 ? 'property' : 'properties'} selected
            </span>
            <button
              onClick={handleSend}
              disabled={!canSend || saving}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <Send className="w-4 h-4" />
              {saving ? 'Sending…' : 'Send Properties'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
