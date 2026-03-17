'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Phone, Loader2, User, Clock, Filter } from 'lucide-react';
import { propertiesApi, type PropertyInquiryRecord } from '@/lib/api-client';

interface Props {
  propertyId: string;
  authToken: string;
}

function statusColor(status: string) {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'responded': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-ZA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function Enquiries({ propertyId, authToken }: Props) {
  const [enquiries, setEnquiries] = useState<PropertyInquiryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authToken) { setIsLoading(false); return; }
    setIsLoading(true);
    propertiesApi
      .getPropertyInquiries(authToken, propertyId)
      .then((res) => setEnquiries(res.data))
      .catch((err: Error) => setError(err.message || 'Failed to load enquiries'))
      .finally(() => setIsLoading(false));
  }, [propertyId, authToken]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Enquiries ({enquiries.length})</h2>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {enquiries.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No enquiries for this listing yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {enquiries.map((e) => (
          <div
            key={e.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              {/* Header: avatar + name + timestamp | status badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {e.requester_name ?? 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDate(e.created_at)}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0 ${statusColor(e.status)}`}>
                  {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                </span>
              </div>

              {/* Message */}
              {e.message && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{e.message}</p>
                  </div>
                </div>
              )}

              {/* Agent reply */}
              {e.response && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Your reply: </span>
                      {e.response}
                    </p>
                  </div>
                </div>
              )}

              {/* Contact info */}
              <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                {e.requester_email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {e.requester_email}
                  </div>
                )}
                {e.requester_phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {e.requester_phone}
                  </div>
                )}
              </div>

              {/* Actions */}
              {e.status !== 'closed' && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Reply
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Mark as Closed
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
