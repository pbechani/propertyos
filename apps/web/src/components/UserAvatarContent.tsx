'use client';

import { useEffect, useMemo, useState } from 'react';

interface UserAvatarContentProps {
  avatarUrl?: string | null;
  initials: string;
  alt?: string;
}

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';

function resolveStorageBaseUrl(): string {
  const configuredApiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_API_BASE_URL;

  const apiOrigin = configuredApiBase.replace(/\/api\/v1\/?$/, '');

  return (
    process.env.NEXT_PUBLIC_STORAGE_BASE_URL ||
    `${apiOrigin}/storage`
  );
}

function normalizeAvatarUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const storageBaseUrl = resolveStorageBaseUrl();

  if (trimmed.startsWith('/storage/')) {
    const apiOrigin = storageBaseUrl.replace(/\/storage\/?$/, '');
    return `${apiOrigin}${trimmed}`;
  }

  if (trimmed.startsWith('avatars/')) {
    return `${storageBaseUrl}/${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === 'storage.pribec.local') {
      const relativePath = parsed.pathname.replace(/^\//, '');
      return `${storageBaseUrl}/${relativePath}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export function UserAvatarContent({ avatarUrl, initials, alt = 'User avatar' }: UserAvatarContentProps) {
  const [isAvatarBroken, setIsAvatarBroken] = useState(false);
  const resolvedAvatarUrl = useMemo(() => normalizeAvatarUrl(avatarUrl), [avatarUrl]);

  useEffect(() => {
    setIsAvatarBroken(false);
  }, [resolvedAvatarUrl]);

  if (resolvedAvatarUrl && !isAvatarBroken) {
    return (
      <img
        src={resolvedAvatarUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setIsAvatarBroken(true)}
      />
    );
  }

  return <span>{initials}</span>;
}