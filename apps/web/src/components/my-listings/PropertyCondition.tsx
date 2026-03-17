'use client';

import { CheckCircle, AlertCircle, XCircle, Wrench, Plus } from 'lucide-react';
import { useState } from 'react';
import { AddPropertyConditionModal } from './AddPropertyConditionModal';
import { RequestInspectionModal } from './RequestInspectionModal';

interface ConditionItem {
  category: string;
  items: {
    name: string;
    status: 'excellent' | 'good' | 'fair' | 'needs-attention';
    notes?: string;
  }[];
}

interface Props { propertyId: string; authToken: string; }

export function PropertyCondition({ propertyId: _propertyId, authToken: _authToken }: Props) {
  const [conditions, _setConditions] = useState<ConditionItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'fair':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'needs-attention':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-700';
      case 'good':
        return 'text-blue-700';
      case 'fair':
        return 'text-yellow-700';
      case 'needs-attention':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Property Condition</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Assessment
          </button>
          <button
            onClick={() => setIsInspectionModalOpen(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Request Inspection
          </button>
        </div>
      </div>

      {conditions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No condition assessments yet</p>
          <p className="text-xs text-gray-400 mt-1">Add an assessment or request an inspection to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {conditions.map((section) => (
            <div key={section.category} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">{section.category}</h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.name} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        <span className={`text-sm capitalize ${getStatusColor(item.status)}`}>
                          {item.status.replace('-', ' ')}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddPropertyConditionModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
      <RequestInspectionModal
        open={isInspectionModalOpen}
        onOpenChange={setIsInspectionModalOpen}
      />
    </div>
  );
}
