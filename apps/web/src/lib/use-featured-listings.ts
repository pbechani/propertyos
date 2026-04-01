import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from './api-client';

export interface FeaturedListing {
  id: string;
  title: string;
  location: string;
  price: string;
  size: string;
  type: string;
  verified: boolean;
  badge: string;
  stage: string;
  imageUrl: string | null;
}

// ── DB → card mappers ────────────────────────────────────────────────────────

function deriveSize(p: {
  floor_area_sqm?: string | null;
  area_sqm?: string | null;
  erf_size_sqm?: string | null;
}): string {
  const raw = p.floor_area_sqm ?? p.area_sqm ?? p.erf_size_sqm;
  if (!raw) return '—';
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return '—';
  return `${n.toLocaleString()} m²`;
}

function derivePrice(p: { price: string; currency: string }): string {
  const n = parseFloat(p.price);
  if (Number.isNaN(n)) return `${p.currency} ${p.price}`;
  return `${p.currency} ${n.toLocaleString()}`;
}

function deriveBadge(p: { verification_status: string; status: string; listing_type?: string | null }): string {
  if (p.listing_type === 'off_plan') return 'OFF-PLAN';
  if (p.status === 'sold') return 'SOLD';
  if (p.status === 'under_offer') return 'UNDER OFFER';
  if (p.verification_status === 'verified') return 'VERIFIED';
  if (p.verification_status === 'pending') return 'PENDING';
  return 'FOR SALE';
}

function deriveStage(p: { verification_status: string; status: string }): string {
  if (p.status === 'sold') return 'Sold';
  if (p.status === 'under_offer') return 'Under Offer';
  if (p.verification_status === 'verified') return 'Title Deed Verified';
  if (p.verification_status === 'pending') return 'Verification Pending';
  if (p.verification_status === 'flagged') return 'Flagged for Review';
  return 'Verification Pending';
}

function mapToFeaturedListing(raw: Record<string, unknown>): FeaturedListing {
  const location = raw['location'] as Record<string, string | null> | null | undefined;
  const media = raw['media'] as { url: string; is_primary: boolean; display_order: number }[] | undefined;

  const locationParts: string[] = [];
  if (location?.suburb) locationParts.push(location.suburb as string);
  else if (location?.city) locationParts.push(location.city as string);
  if (location?.city && location?.suburb) locationParts.push(location.city as string);
  else if (location?.region) locationParts.push(location.region as string);
  const locationStr = locationParts.filter(Boolean).join(', ') || 'Location unavailable';

  const primaryMedia =
    media?.find((m) => m.is_primary) ??
    media?.sort((a, b) => a.display_order - b.display_order)[0] ??
    null;

  return {
    id: raw['id'] as string,
    title: raw['title'] as string,
    location: locationStr,
    price: derivePrice({ price: raw['price'] as string, currency: raw['currency'] as string }),
    size: deriveSize({
      floor_area_sqm: raw['floor_area_sqm'] as string | null,
      area_sqm: raw['area_sqm'] as string | null,
      erf_size_sqm: raw['erf_size_sqm'] as string | null,
    }),
    type: ((raw['property_type'] as string) ?? 'Property')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    verified: raw['verification_status'] === 'verified',
    badge: deriveBadge({
      verification_status: raw['verification_status'] as string,
      status: raw['status'] as string,
      listing_type: raw['listing_type'] as string | null,
    }),
    stage: deriveStage({
      verification_status: raw['verification_status'] as string,
      status: raw['status'] as string,
    }),
    imageUrl: primaryMedia?.url ?? null,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000;

export function useFeaturedListings(limit = 3): { listings: FeaturedListing[]; loading: boolean } {
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const lastGoodRef = useRef<FeaturedListing[] | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let cancelled = false;

    async function fetchListings() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8_000);

      try {
        const res = await fetch(
          `${API_BASE_URL}/properties?sort=newest&limit=${limit}`,
          {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          },
        );

        clearTimeout(timeoutId);

        if (!res.ok) return;

        const body = await res.json();
        const data: Record<string, unknown>[] = Array.isArray(body)
          ? body
          : (body?.data ?? []);

        const mapped = data.map(mapToFeaturedListing);

        if (!cancelled) {
          lastGoodRef.current = mapped;
          setListings(mapped);
          setLoading(false);
        }
      } catch {
        clearTimeout(timeoutId);
        if (!cancelled) {
          if (lastGoodRef.current) {
            setListings(lastGoodRef.current);
          }
          setLoading(false);
        }
      }
    }

    fetchListings();
    intervalId = setInterval(fetchListings, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [limit]);

  return { listings, loading };
}
