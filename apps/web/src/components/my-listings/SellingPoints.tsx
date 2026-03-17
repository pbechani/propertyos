'use client';

import { Star, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AddSellingPointModal } from './AddSellingPointModal';
import { EditSellingPointModal } from './EditSellingPointModal';
import { propertiesApi } from '@/lib/api-client';

interface SellingPoint {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface Props { propertyId: string; authToken: string; }

export function SellingPoints({ propertyId, authToken }: Props) {
  const [sellingPoints, setSellingPoints] = useState<SellingPoint[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSellingPoint, setSelectedSellingPoint] = useState<SellingPoint | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await propertiesApi.listSellingPoints(authToken, propertyId);
      setSellingPoints(data.map((p: { id: string; title: string; description: string; priority: string }) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        priority: p.priority as 'high' | 'medium' | 'low',
      })));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load selling points');
    }
  }, [authToken, propertyId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await propertiesApi.deleteSellingPoint(authToken, propertyId, id);
      setSellingPoints(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to delete selling point');
    } finally {
      setIsDeleting(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Key Selling Points</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Selling Point
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          These selling points are highlighted in marketing materials and shown to potential buyers.
          Prioritize the most compelling features.
        </p>
      </div>

      {sellingPoints.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No selling points added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add key features that will appeal to buyers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sellingPoints.map((point) => (
            <div key={point.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                  <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{point.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(point.priority)}`}>
                        {point.priority.charAt(0).toUpperCase() + point.priority.slice(1)} Priority
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          setSelectedSellingPoint(point);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        disabled={isDeleting === point.id}
                        onClick={() => handleDelete(point.id)}
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{point.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium mb-2">Marketing Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Lead with location and recent renovations in all listings</li>
          <li>• Emphasize energy efficiency and low operating costs</li>
          <li>• Highlight smart home features for tech-savvy buyers</li>
          <li>• Showcase outdoor space in photos and virtual tours</li>
        </ul>
      </div>

      <AddSellingPointModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        propertyId={propertyId}
        authToken={authToken}
        onSaved={load}
      />
      <EditSellingPointModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        sellingPoint={selectedSellingPoint}
        propertyId={propertyId}
        authToken={authToken}
        onSaved={load}
      />
    </div>
  );
}
