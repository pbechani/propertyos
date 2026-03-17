'use client';

import { useEffect, useState } from 'react';
import { Phone, Calendar, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StickyCtaBarProps {
  /** Element ref to observe — bar appears when this scrolls out of view */
  heroRef: React.RefObject<HTMLElement | null>;
  propertyTitle: string;
  price: string;
  isSaved: boolean;
  onContactAgent: () => void;
  onScheduleViewing: () => void;
  onToggleSave: () => void;
  disabled?: boolean;
}

export default function StickyCtaBar({
  heroRef,
  propertyTitle,
  price,
  isSaved,
  onContactAgent,
  onScheduleViewing,
  onToggleSave,
  disabled = false,
}: StickyCtaBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = heroRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show bar when hero is NOT intersecting (scrolled past)
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [heroRef]);

  return (
    <div
      data-testid="sticky-cta-bar"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Property summary */}
        <div className="hidden sm:block min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{propertyTitle}</p>
          <p className="text-sm text-blue-600 font-bold">{price}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSave}
            disabled={disabled}
            className="flex items-center gap-1.5"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onContactAgent}
            disabled={disabled}
            className="flex items-center gap-1.5"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Contact Agent</span>
          </Button>
          <Button
            size="sm"
            onClick={onScheduleViewing}
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            Schedule Viewing
          </Button>
        </div>
      </div>
    </div>
  );
}
