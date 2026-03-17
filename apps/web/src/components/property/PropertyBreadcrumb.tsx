'use client';

import { ChevronRight } from 'lucide-react';
import { Link } from '@/lib/router-compat';

interface PropertyBreadcrumbProps {
  propertyType: string;
  city: string | null;
  region: string | null;
  title: string;
}

function humanise(slug: string): string {
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PropertyBreadcrumb({
  propertyType,
  city,
  region,
  title,
}: PropertyBreadcrumbProps) {
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/properties' },
  ];

  if (propertyType) {
    crumbs.push({
      label: humanise(propertyType),
      href: `/properties?type=${encodeURIComponent(propertyType)}`,
    });
  }

  if (region) {
    crumbs.push({ label: region });
  }

  if (city && city !== region) {
    crumbs.push({ label: city });
  }

  // Current page — no link
  crumbs.push({ label: title });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 overflow-x-auto">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
            {crumb.href && !isLast ? (
              <Link to={crumb.href} className="hover:text-blue-600 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-gray-900 font-medium truncate max-w-[200px]' : ''}>
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
