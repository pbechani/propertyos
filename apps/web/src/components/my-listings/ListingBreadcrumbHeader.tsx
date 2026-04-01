'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

interface ListingBreadcrumbHeaderProps {
  /** Where the back arrow navigates to */
  backHref: string;
  /** The listing UUID — used to build the listing detail link in the crumb trail */
  listingId: string;
  /** Full address of the listing (null while loading → shows skeleton) */
  address: string | null;
  /** Listing status for the badge shown beside the title (e.g. "active", "sold") */
  listingStatus?: string | null;
  /** Extra breadcrumb segments displayed after the address crumb */
  crumbs?: Crumb[];
  /** Replaces the address text in the bold h1 row (the crumb trail still shows the address) */
  titleOverride?: string;
  /** Action buttons rendered on the right side of the header */
  rightSlot?: React.ReactNode;
}

function statusBadgeClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'confirmed':  return 'bg-green-100 text-green-700';
    case 'sold':       return 'bg-blue-100 text-blue-700';
    case 'pending':
    case 'requested':  return 'bg-yellow-100 text-yellow-700';
    case 'declined':
    case 'cancelled':  return 'bg-red-100 text-red-700';
    case 'withdrawn':  return 'bg-gray-100 text-gray-600';
    default:           return 'bg-gray-100 text-gray-600';
  }
}

export function ListingBreadcrumbHeader({
  backHref,
  listingId,
  address,
  listingStatus,
  crumbs = [],
  titleOverride,
  rightSlot,
}: ListingBreadcrumbHeaderProps) {
  const displayTitle = titleOverride ?? address;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: back arrow + breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={backHref}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>

            <div className="min-w-0">
              {/* Breadcrumb trail */}
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5 flex-wrap">
                <Link href="/app/my-listings" className="hover:text-gray-600 transition-colors shrink-0">
                  My Listings
                </Link>
                <ChevronRight className="w-3 h-3 shrink-0" />
                {address ? (
                  <Link
                    href={`/app/my-listings/${listingId}`}
                    className="text-gray-600 truncate max-w-[180px] hover:text-gray-900 transition-colors"
                  >
                    {address}
                  </Link>
                ) : (
                  <span className="inline-block w-32 h-3 bg-gray-200 rounded animate-pulse" />
                )}
                {crumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1 shrink-0 min-w-0">
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-gray-600 transition-colors truncate max-w-[140px]">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-500 truncate max-w-[140px]">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </div>

              {/* Title row */}
              <div className="flex items-center gap-2">
                {displayTitle ? (
                  <h1 className="text-base font-semibold text-gray-900 truncate">{displayTitle}</h1>
                ) : (
                  <span className="inline-block w-48 h-5 bg-gray-200 rounded animate-pulse" />
                )}
                {listingStatus && (
                  <span className={`shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize ${statusBadgeClasses(listingStatus)}`}>
                    {listingStatus.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: action slot */}
          {rightSlot && (
            <div className="flex items-center gap-2 shrink-0">
              {rightSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
