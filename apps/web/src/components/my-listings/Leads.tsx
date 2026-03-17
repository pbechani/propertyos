'use client';

import { useState } from 'react';
import { User, Phone, Mail, Star, MessageSquare } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  status: 'hot' | 'warm' | 'cold';
  source: string;
  lastContact: string;
  notes: string;
}

interface Props { propertyId: string; authToken: string; }

export function Leads({ propertyId: _propertyId, authToken: _authToken }: Props) {
  const [leads, _setLeads] = useState<Lead[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warm':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Leads Pipeline</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + Add Lead
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-700 mb-1">Hot Leads</div>
          <div className="text-2xl font-semibold text-red-600">
            {leads.filter(l => l.status === 'hot').length}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-700 mb-1">Warm Leads</div>
          <div className="text-2xl font-semibold text-yellow-600">
            {leads.filter(l => l.status === 'warm').length}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-700 mb-1">Cold Leads</div>
          <div className="text-2xl font-semibold text-blue-600">
            {leads.filter(l => l.status === 'cold').length}
          </div>
        </div>
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No leads yet</p>
          <p className="text-xs text-gray-400 mt-1">Leads will appear here as buyers show interest</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{lead.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{lead.source}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className={`w-5 h-5 ${getScoreColor(lead.score)}`} />
                    <span className={`font-semibold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {lead.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {lead.phone}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">
                        Last contact: {new Date(lead.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <p className="text-sm text-gray-700">{lead.notes}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Contact Lead
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Update Status
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
