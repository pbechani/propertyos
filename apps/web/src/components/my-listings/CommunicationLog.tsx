'use client';

import { useState } from 'react';
import { Phone, MessageSquare, Video, User, Clock, Plus, Search, PhoneOutgoing, PhoneIncoming, MailOpen, Send } from 'lucide-react';
import { LogCommunicationModal } from './LogCommunicationModal';

interface Communication {
  id: string;
  type: 'call-out' | 'call-in' | 'email-sent' | 'email-received' | 'text' | 'video-call';
  contact: string;
  contactRole: string;
  subject: string;
  summary: string;
  date: string;
  duration?: string;
  outcome?: string;
  followUp?: string;
}


const getTypeIcon = (type: string) => {
  switch (type) {
    case 'call-out':
      return <PhoneOutgoing className="w-4 h-4" />;
    case 'call-in':
      return <PhoneIncoming className="w-4 h-4" />;
    case 'email-sent':
      return <Send className="w-4 h-4" />;
    case 'email-received':
      return <MailOpen className="w-4 h-4" />;
    case 'text':
      return <MessageSquare className="w-4 h-4" />;
    case 'video-call':
      return <Video className="w-4 h-4" />;
    default:
      return <Phone className="w-4 h-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'call-out':
      return 'Outgoing Call';
    case 'call-in':
      return 'Incoming Call';
    case 'email-sent':
      return 'Email Sent';
    case 'email-received':
      return 'Email Received';
    case 'text':
      return 'Text Message';
    case 'video-call':
      return 'Video Call';
    default:
      return type;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'call-out':
    case 'call-in':
      return 'bg-green-100 text-green-600';
    case 'email-sent':
    case 'email-received':
      return 'bg-blue-100 text-blue-600';
    case 'text':
      return 'bg-purple-100 text-purple-600';
    case 'video-call':
      return 'bg-indigo-100 text-indigo-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

interface Props { propertyId: string; authToken: string; }

export function CommunicationLog({ propertyId: _propertyId, authToken: _authToken }: Props) {
  const [comms, _setComms] = useState<Communication[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const filtered = comms.filter(c => {
    const matchesType = filterType === 'all' || c.type.startsWith(filterType);
    const matchesSearch = c.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const needsFollowUp = comms.filter(c => c.followUp).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Communication Log</h2>
        <button 
          onClick={() => setIsLogModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Communication
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">Total This Week</div>
          <div className="text-2xl font-semibold">{comms.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">Calls</div>
          <div className="text-2xl font-semibold text-green-600">
            {comms.filter(c => c.type.includes('call')).length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">Emails</div>
          <div className="text-2xl font-semibold text-blue-600">
            {comms.filter(c => c.type.includes('email')).length}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="text-sm text-orange-700 mb-1">Needs Follow-up</div>
          <div className="text-2xl font-semibold text-orange-600">{needsFollowUp}</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by contact or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'call', label: 'Calls' },
            { id: 'email', label: 'Emails' },
            { id: 'text', label: 'Texts' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterType === f.id ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.map((comm) => (
          <div key={comm.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(comm.type)}`}>
                {getTypeIcon(comm.type)}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-sm">{comm.subject}</h4>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{getTypeLabel(comm.type)}</span>
                      {comm.duration && (
                        <span className="text-xs text-gray-500">{comm.duration}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <User className="w-3 h-3" />
                      <span className="font-medium">{comm.contact}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">{comm.contactRole}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-4">
                    <Clock className="w-3 h-3" />
                    {comm.date}
                  </div>
                </div>

                <p className="text-sm text-gray-600">{comm.summary}</p>

                {(comm.outcome || comm.followUp) && (
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                    {comm.outcome && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-500">Outcome:</span>
                        <span className={`font-medium ${
                          comm.outcome.toLowerCase().includes('positive') ? 'text-green-600' :
                          comm.outcome.toLowerCase().includes('needs') ? 'text-red-600' :
                          comm.outcome.toLowerCase().includes('awaiting') || comm.outcome.toLowerCase().includes('pending') ? 'text-yellow-600' :
                          'text-gray-700'
                        }`}>{comm.outcome}</span>
                      </div>
                    )}
                    {comm.followUp && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded font-medium">
                          Follow-up: {comm.followUp}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No communications found</p>
          </div>
        )}
      </div>

      <LogCommunicationModal
        open={isLogModalOpen}
        onOpenChange={setIsLogModalOpen}
      />
    </div>
  );
}