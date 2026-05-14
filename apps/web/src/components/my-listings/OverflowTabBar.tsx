'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MoreHorizontal, ChevronDown } from 'lucide-react';

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
}

interface OverflowTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function OverflowTabBar({ tabs, activeTab, onTabChange }: OverflowTabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(tabs.length);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const MORE_BTN_WIDTH = 64;
    let usedWidth = MORE_BTN_WIDTH;
    let count = 0;

    for (let i = 0; i < tabs.length; i++) {
      const el = tabRefs.current[i];
      if (!el) break;
      const w = el.scrollWidth + 8;
      if (usedWidth + w > containerWidth) break;
      usedWidth += w;
      count++;
    }

    setVisibleCount(count >= tabs.length ? tabs.length : Math.max(1, count));
  }, [tabs]);

  useEffect(() => {
    requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const overflowTabs = tabs.slice(visibleCount);
  const activeIsOverflow = overflowTabs.some((t) => t.value === activeTab);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1 px-4 py-3 border-b border-[#1A3C28]/[0.08] bg-[#EAD9C4]/50 min-w-0">
      {tabs.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = tab.value === activeTab;
        const isHidden = i >= visibleCount;

        return (
          <button
            key={tab.value}
            ref={(el) => { tabRefs.current[i] = el; }}
            onClick={() => !isHidden && onTabChange(tab.value)}
            tabIndex={isHidden ? -1 : 0}
            aria-hidden={isHidden}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0',
              isHidden ? 'invisible pointer-events-none absolute' : '',
              !isHidden && isActive ? 'bg-[#1A3C28] text-white' : '',
              !isHidden && !isActive ? 'text-[#1A3C28]/60 hover:bg-[#1A3C28]/[0.07] hover:text-[#1A3C28]' : '',
            ].join(' ')}
          >
            {Icon && (
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive && !isHidden ? 'text-white' : 'text-[#1A3C28]/40'}`} />
            )}
            {tab.label}
            {!isHidden && tab.badge != null && tab.badge > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full ${isActive ? 'bg-white text-[#1A3C28]' : 'bg-[#C4562A] text-white'}`}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}

      {overflowTabs.length > 0 && (
        <div ref={dropdownRef} className="relative ml-auto shrink-0">
          <button
            onClick={() => setOverflowOpen((v) => !v)}
            className={[
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                activeIsOverflow
                ? 'bg-[#1A3C28] text-white'
                : 'text-[#1A3C28]/50 hover:bg-[#1A3C28]/[0.07] hover:text-[#1A3C28] border border-[#1A3C28]/15 bg-white',
            ].join(' ')}
            title="More tabs"
          >
            {activeIsOverflow ? (
              <>
                <span className="max-w-[100px] truncate text-xs">
                  {overflowTabs.find((t) => t.value === activeTab)?.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </>
            ) : (
              <>
                <MoreHorizontal className="w-4 h-4" />
                <span className="text-xs">{overflowTabs.length}</span>
              </>
            )}
          </button>

          {overflowOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#1A3C28]/10 rounded-xl shadow-lg shadow-[#1A3C28]/[0.08] z-50 py-1 overflow-hidden">
              {overflowTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.value === activeTab;
                return (
                  <button
                    key={tab.value}
                    onClick={() => { onTabChange(tab.value); setOverflowOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-[#1A3C28]/[0.06] text-[#1A3C28] font-medium' : 'text-[#1A3C28]/70 hover:bg-[#1A3C28]/[0.04]'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {Icon && <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1A3C28]' : 'text-[#1A3C28]/40'}`} />}
                      {tab.label}
                    </div>
                    {tab.badge != null && tab.badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-[#C4562A] text-white">
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
