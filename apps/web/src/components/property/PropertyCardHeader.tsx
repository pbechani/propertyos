'use client';

import { UserAvatarContent } from '@/components/UserAvatarContent';

const DEFAULT_COMPANY_COLOR = '#4A9E8E';
const OWNER_HEADER_COLOR = '#2563EB';

export interface PropertyCardHeaderProps {
  /** True when the property was listed privately (Self company) rather than under a real company. */
  isPrivateListing: boolean;
  /** Company logo URL — shown on the left for agent-listed properties. */
  companyLogoUrl?: string | null;
  /** Company display name. */
  companyName?: string | null;
  /** Hex brand color from the company profile. Falls back to a teal default. */
  companyBrandColor?: string | null;
  /** Agent or seller display name. */
  personName: string;
  /** Agent or seller avatar URL. */
  personAvatarUrl?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export default function PropertyCardHeader({
  isPrivateListing,
  companyLogoUrl,
  companyName,
  companyBrandColor,
  personName,
  personAvatarUrl,
}: PropertyCardHeaderProps) {
  if (isPrivateListing) {
    return (
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: OWNER_HEADER_COLOR }}
      >
        <span className="text-white text-sm font-bold tracking-wide">LISTED BY OWNER</span>
        <div className="flex items-center gap-2.5">
          <span className="text-white text-sm font-semibold truncate max-w-[140px]">
            {personName}
          </span>
          <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
            <UserAvatarContent
              avatarUrl={personAvatarUrl}
              initials={getInitials(personName)}
              alt={personName}
            />
          </div>
        </div>
      </div>
    );
  }

  const bgColor = companyBrandColor || DEFAULT_COMPANY_COLOR;

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5"
      style={{ backgroundColor: bgColor }}
    >
      {/* Company logo */}
      <div className="flex items-center gap-2 min-w-0">
        {companyLogoUrl ? (
          <img
            src={companyLogoUrl}
            alt={companyName ?? 'Company'}
            className="h-8 max-w-[140px] object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-white text-sm font-bold truncate max-w-[160px]">
            {companyName ?? 'Estate Agency'}
          </span>
        )}
      </div>

      {/* Agent avatar + name */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-white text-sm font-semibold truncate max-w-[140px]">
          {personName}
        </span>
        <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
          <UserAvatarContent
            avatarUrl={personAvatarUrl}
            initials={getInitials(personName)}
            alt={personName}
          />
        </div>
      </div>
    </div>
  );
}
