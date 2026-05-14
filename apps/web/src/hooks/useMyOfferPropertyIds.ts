'use client';

import { useEffect, useState } from 'react';
import { buyerOffersApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

const SESSION_KEY = 'pribec_offer_property_ids';

/**
 * Returns a Set of property IDs for which the current buyer has a non-withdrawn offer.
 * Result is cached in sessionStorage to avoid redundant API calls across components.
 */
export function useMyOfferPropertyIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) return new Set(JSON.parse(cached) as string[]);
    } catch {
      // ignore parse errors
    }
    return new Set();
  });

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    buyerOffersApi
      .list(token)
      .then((offers) => {
        const active = (offers ?? [])
          .filter((o) => o.status !== 'withdrawn')
          .map((o) => o.property_id);
        const set = new Set(active);
        setIds(set);
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(active));
        } catch {
          // ignore storage errors
        }
      })
      .catch(() => null);
  }, []);

  return ids;
}
