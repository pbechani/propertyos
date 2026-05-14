'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Phone, Loader2, User, Clock, Filter, Plus } from 'lucide-react';
import { propertiesApi, type PropertyInquiryRecord, type PropertyListing } from '@/lib/api-client';
import { EnquiryDetailModal } from './EnquiryDetailModal';
import { AddEnquiryModal } from './AddEnquiryModal';

interface Props {
  propertyId: string;
  authToken: string;
  propertyAddress?: string;
  property?: PropertyListing | null;
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

/**
 * Some enquiries were submitted anonymously and the contact info was embedded
 * into the message as "General inquiry Name: X Email: Y Phone: Z".
 * This parser extracts those fields so they can be rendered properly.
 */
function parseEmbeddedContact(message: string | null): {
  name: string | null;
  email: string | null;
  phone: string | null;
  cleanMessage: string | null;
} | null {
  if (!message) return null;

  // ── Old single-line format ────────────────────────────────────────────────
  // "General inquiry Name: X Email: y@z.com Phone: 123"
  const singleLine = message.match(
    /^(General inquiry\s+)?Name:\s*(.+?)\s+Email:\s*(\S+@\S+)\s+Phone:\s*(\S+)$/i,
  );
  if (singleLine) {
    return {
      name: singleLine[2].trim() || null,
      email: singleLine[3].trim() || null,
      phone: singleLine[4].trim() || null,
      cleanMessage: null,
    };
  }

  // ── New multi-line format (from AddEnquiryModal) ──────────────────────────
  // "Name: John Doe\nEmail: ...\nPhone: ...\n[opt fields]\n\nActual message\n\n[Internal Notes]: ..."
  if (!message.startsWith('Name: ')) return null;

  const nameMatch  = message.match(/^Name:\s*(.+)$/m);
  const emailMatch = message.match(/^Email:\s*(.+)$/m);
  const phoneMatch = message.match(/^Phone:\s*(.+)$/m);

  // Body is everything after the first blank line separating header from message
  const blankIdx = message.indexOf('\n\n');
  let cleanMessage: string | null = null;
  if (blankIdx !== -1) {
    let body = message.slice(blankIdx + 2).trim();
    // Strip trailing internal-notes block if present
    const notesIdx = body.indexOf('\n\n[Internal Notes]');
    if (notesIdx !== -1) body = body.slice(0, notesIdx).trim();
    cleanMessage = body || null;
  }

  return {
    name:  nameMatch?.[1]?.trim()  || null,
    email: emailMatch?.[1]?.trim() || null,
    phone: phoneMatch?.[1]?.trim() || null,
    cleanMessage,
  };
}

export function Enquiries({ propertyId, authToken, propertyAddress, property }: Props) {
  const [enquiries, setEnquiries] = useState<PropertyInquiryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<PropertyInquiryRecord | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

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
    <>
      <AddEnquiryModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        propertyId={propertyId}
        authToken={authToken}
        onCreated={(r) => setEnquiries((prev) => [r, ...prev])}
      />

      {selectedEnquiry && (
        <EnquiryDetailModal
          open={!!selectedEnquiry}
          onOpenChange={(open) => { if (!open) setSelectedEnquiry(null); }}
          enquiry={selectedEnquiry}
          property={property}
          propertyAddress={propertyAddress}
          propertyId={propertyId}
          authToken={authToken}
          onStatusChanged={(id, status) => {
            setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
            setSelectedEnquiry((prev) => prev && prev.id === id ? { ...prev, status } : prev);
          }}
        />
      )}

    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Enquiries ({enquiries.length})</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Enquiry
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {enquiries.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No enquiries for this listing yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {enquiries.map((e) => {
          const embedded = parseEmbeddedContact(e.message ?? null);
          const displayName  = e.requester_name  ?? embedded?.name  ?? 'Anonymous';
          const displayEmail = e.requester_email ?? embedded?.email ?? null;
          const displayPhone = e.requester_phone ?? embedded?.phone ?? null;
          // If the whole message was just embedded contact info, don't show it as a message
          const displayMessage = embedded ? embedded.cleanMessage : (e.message ?? null);

          return (
          <div
            key={e.id}
            onClick={() => setSelectedEnquiry(e)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
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
                      {displayName}
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
              {displayMessage && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{displayMessage}</p>
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
              {(displayEmail || displayPhone) && (
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                  {displayEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      {displayEmail}
                    </div>
                  )}
                  {displayPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      {displayPhone}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {e.status !== 'closed' && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={(ev) => { ev.stopPropagation(); setSelectedEnquiry(e); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Reply
                  </button>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); setSelectedEnquiry(e); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Mark as Closed
                  </button>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
