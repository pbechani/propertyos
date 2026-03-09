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
import { getAccessToken, getIsAdminFromToken, getPrimaryRole } from "@/lib/auth-session";

type AllowedRole = "admin" | "agent" | "buyer" | "conveyancer" | "contractor" | "supplier" | "inspector";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AllowedRole;
  /** Allow access for company admins (active_company_is_admin in JWT). Use this
   *  instead of requiredRole="admin" for company-scoped admin features. */
  requireCompanyAdmin?: boolean;
}

function getMockSession(): { isAuthenticated: boolean; role: string | null; isCompanyAdmin: boolean } {
  try {
    const token = getAccessToken();
    const role = getPrimaryRole();
    const isCompanyAdmin = getIsAdminFromToken();
    return { isAuthenticated: Boolean(token), role, isCompanyAdmin };
  } catch {
    return { isAuthenticated: false, role: null, isCompanyAdmin: false };
  }
}

export default function ProtectedRoute({ children, requiredRole, requireCompanyAdmin }: ProtectedRouteProps) {
  const router = useRouter();

  useEffect(() => {
    const { isAuthenticated, role, isCompanyAdmin } = getMockSession();

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requireCompanyAdmin && !isCompanyAdmin) {
      router.replace("/session-expired");
      return;
    }

    if (requiredRole && role !== requiredRole) {
      router.replace("/session-expired");
    }
  }, [router, requiredRole, requireCompanyAdmin]);

  // While checking, render children (they can guard themselves).
  // In production, render a loading state here until auth is resolved.
  return <>{children}</>;
}
