'use client';

/**
 * router-compat.tsx
 *
 * Compatibility shim that re-exports React Router v7 APIs as Next.js equivalents.
 * All pages copied from the sample_ui can import from "@/lib/router-compat"
 * instead of "react-router" and get identical runtime behaviour.
 *
 * Mapping:
 *   Link         → next/link  Link
 *   useNavigate  → wrapper around next/navigation useRouter
 *   useLocation  → { pathname } from next/navigation usePathname
 *   useParams    → next/navigation useParams
 *   Navigate     → component that calls router.replace
 */

import { useCallback } from 'react';
import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import {
  useRouter,
  usePathname,
  useParams as nextUseParams,
} from 'next/navigation';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Link
// ---------------------------------------------------------------------------
type LinkProps = Omit<NextLinkProps, 'href'> & {
  to: string;
  children?: ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  state?: unknown;
  replace?: boolean;
};

export function Link({ to, children, state: _state, ...rest }: LinkProps) {
  return (
    <NextLink href={to} {...rest}>
      {children}
    </NextLink>
  );
}

// ---------------------------------------------------------------------------
// useNavigate  →  returns a navigate(path, options?) function
// ---------------------------------------------------------------------------
export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

export function useNavigate() {
  const router = useRouter();

  const navigate = useCallback(
    (to: string, options?: NavigateOptions) => {
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router]
  );

  return navigate;
}

// ---------------------------------------------------------------------------
// useLocation  →  { pathname, search, hash, state, key }
// ---------------------------------------------------------------------------
export function useLocation() {
  const pathname = usePathname();
  return {
    pathname,
    search: '',
    hash: '',
    state: null,
    key: pathname,
  };
}

// ---------------------------------------------------------------------------
// useParams  →  same API (Next.js useParams returns Record<string,string>)
// ---------------------------------------------------------------------------
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return nextUseParams() as T;
}

// ---------------------------------------------------------------------------
// Navigate component  →  triggers navigation then renders null
// ---------------------------------------------------------------------------
interface NavigateProps {
  to: string;
  replace?: boolean;
  state?: unknown;
}

export function Navigate({ to, replace: useReplace = false }: NavigateProps) {
  const router = useRouter();
  // fire immediately during render; wrapped in useCallback to avoid double-run in StrictMode
  if (typeof window !== 'undefined') {
    if (useReplace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }
  return null;
}
