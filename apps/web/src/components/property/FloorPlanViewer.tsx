'use client';

import { useState } from 'react';
import { X, ZoomIn, Maximize2 } from 'lucide-react';

export interface FloorPlan {
  id: string;
  url: string;
  thumbnail_url: string | null;
  display_order: number;
}

interface FloorPlanViewerProps {
  floorPlans: FloorPlan[];
}

export default function FloorPlanViewer({ floorPlans }: FloorPlanViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (floorPlans.length === 0) return null;

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2">
            <Maximize2 className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">
              Floor Plans ({floorPlans.length})
            </span>
          </div>
          <span className="text-sm text-blue-600">{expanded ? 'Collapse' : 'View'}</span>
        </button>

        {expanded && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {floorPlans.map((plan, idx) => (
              <div key={plan.id} className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={plan.thumbnail_url || plan.url}
                  alt={`Floor plan ${idx + 1}`}
                  className="w-full h-48 object-contain bg-white"
                  onClick={() => setLightboxIdx(idx)}
                />
                <div
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={() => setLightboxIdx(idx)}
                >
                  <ZoomIn className="w-6 h-6 text-white" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setLightboxIdx(null)}
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={floorPlans[lightboxIdx].url}
            alt={`Floor plan ${lightboxIdx + 1}`}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
