import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from './api-client';

export type EventCategory =
  | 'financial'
  | 'property'
  | 'sale'
  | 'document'
  | 'user'
  | 'construction'
  | 'general';

export interface ActivityItem {
  label: string;
  category: EventCategory;
  timeAgo: string;
}

export interface PlatformStats {
  activeListings: number;
  inEscrowUsd: string;
  verifiedUsers: number;
  completionRate: number;
  recentActivity: ActivityItem[];
}

const DEFAULT_STATS: PlatformStats = {
  activeListings: 0,
  inEscrowUsd: '$0',
  verifiedUsers: 0,
  completionRate: 0,
  recentActivity: [],
};

const POLL_INTERVAL_MS = 30_000;

export function usePlatformStats(): { stats: PlatformStats; loading: boolean } {
  const [stats, setStats] = useState<PlatformStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const lastGoodRef = useRef<PlatformStats | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let cancelled = false;

    async function fetchStats() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8_000);

      try {
        const res = await fetch(`${API_BASE_URL}/public/stats`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) return;

        const data: PlatformStats = await res.json();

        if (!cancelled) {
          lastGoodRef.current = data;
          setStats(data);
          setLoading(false);
        }
      } catch {
        // Network error or timeout — keep last known good values silently
        if (!cancelled && lastGoodRef.current) {
          setStats(lastGoodRef.current);
          setLoading(false);
        } else if (!cancelled) {
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    fetchStats();
    intervalId = setInterval(fetchStats, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return { stats, loading };
}
