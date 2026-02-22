'use client';

/**
 * ProtectedRoute — Guards routes that require an authenticated session.
 *
 * Prototype behaviour: reads `auth_token` from localStorage as a signal that
 * the user has "logged in" via the mock login flow. Replace with a real
 * JWT / session check when integrating the NestJS auth API (Sprint 2).
 */

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getPrimaryRole } from "@/lib/auth-session";

type AllowedRole = "admin" | "agent" | "buyer" | "conveyancer" | "contractor" | "supplier" | "inspector";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AllowedRole;
}

function getMockSession(): { isAuthenticated: boolean; role: string | null } {
  try {
    const token = getAccessToken();
    const role = getPrimaryRole();
    return { isAuthenticated: Boolean(token), role };
  } catch {
    return { isAuthenticated: false, role: null };
  }
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();

  useEffect(() => {
    const { isAuthenticated, role } = getMockSession();

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && role !== requiredRole) {
      router.replace("/session-expired");
    }
  }, [router, requiredRole]);

  // While checking, render children (they can guard themselves).
  // In production, render a loading state here until auth is resolved.
  return <>{children}</>;
}
