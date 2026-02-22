/**
 * ProtectedRoute — Guards routes that require an authenticated session.
 *
 * Prototype behaviour: reads `auth_token` from localStorage as a signal that
 * the user has "logged in" via the mock login flow. This MUST be replaced with
 * a real JWT / session check when integrating the NestJS auth API (Sprint 2).
 *
 * Usage in routes.ts:
 *   { path: "admin", element: <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute> }
 */

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

type AllowedRole = "admin" | "agent" | "buyer" | "conveyancer" | "contractor" | "supplier" | "inspector";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Optional role restriction. When provided, the stored role must match.
   * Pass `undefined` to only require authentication (any role).
   */
  requiredRole?: AllowedRole;
}

/**
 * Reads the mock session written by the login / role-selection flow.
 * Replace with a proper auth context hook once Sprint 2 is integrated.
 */
function getMockSession(): { isAuthenticated: boolean; role: string | null } {
  try {
    const token = localStorage.getItem("auth_token");
    const role = localStorage.getItem("user_role");
    return { isAuthenticated: Boolean(token), role };
  } catch {
    // localStorage unavailable (SSR / private browsing edge case)
    return { isAuthenticated: false, role: null };
  }
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, role } = getMockSession();

  if (!isAuthenticated) {
    // Preserve the attempted URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // User is authenticated but lacks the required role
    return <Navigate to="/session-expired" replace />;
  }

  return <>{children}</>;
}
