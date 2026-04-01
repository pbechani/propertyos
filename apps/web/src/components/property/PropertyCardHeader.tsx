'use client';

import { UserAvatarContent } from '@/components/UserAvatarContent';

const DEFAULT_COMPANY_COLOR = '#4A9E8E';
const OWNER_HEADER_COLOR = '#2563EB';

/** IBM Plex Mono micro-label style applied inline so no global CSS import is needed. */
const MONO_LABEL: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 9,
  letterSpacing: '0.12em',
  lineHeight: 1,
};

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
        className="flex items-center justify-between px-4 py-3 min-h-[72px]"
        style={{ backgroundColor: OWNER_HEADER_COLOR }}
      >
        {/* Left: listing type label */}
        <div className="flex flex-col gap-0.5">
          <span style={{ ...MONO_LABEL, color: 'rgba(255,255,255,0.6)' }}>LISTED BY</span>
          <span className="text-white text-sm font-bold tracking-wide">Owner</span>
        </div>

        {/* Right: seller name + avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex flex-col items-end gap-0.5">
            <span style={{ ...MONO_LABEL, color: 'rgba(255,255,255,0.6)' }}>SELLER</span>
            <span className="text-white text-xs font-semibold truncate max-w-[120px]">
              {personName}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
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
      className="flex items-center justify-between px-4 py-3 min-h-[72px]"
      style={{ backgroundColor: bgColor }}
    >
      {/* Left: company logo + name */}
      <div className="flex items-center gap-2.5 min-w-0">
        {companyLogoUrl ? (
          <>
            <img
              src={companyLogoUrl}
              alt={companyName ?? 'Company'}
              className="h-10 max-w-[120px] object-contain shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            {companyName && (
              <div className="flex flex-col gap-0.5 min-w-0">
                <span style={{ ...MONO_LABEL, color: 'rgba(255,255,255,0.6)' }}>LISTED BY</span>
                <span className="text-white text-xs font-semibold truncate max-w-[110px]">
                  {companyName}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-0.5 min-w-0">
            <span style={{ ...MONO_LABEL, color: 'rgba(255,255,255,0.6)' }}>LISTED BY</span>
            <span className="text-white text-sm font-bold truncate max-w-[160px]">
              {companyName ?? 'Estate Agency'}
            </span>
          </div>
        )}
      </div>

      {/* Right: agent name + avatar */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex flex-col items-end gap-0.5">
          <span style={{ ...MONO_LABEL, color: 'rgba(255,255,255,0.6)' }}>AGENT</span>
          <span className="text-white text-xs font-semibold truncate max-w-[110px]">
            {personName}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
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
