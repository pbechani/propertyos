export const AUTH_EXEMPT_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/email-verification',
  '/oauth-connect',
  '/mfa-setup',
  '/mfa-verify',
  '/auth-flow',
  '/session-expired',
] as const;

const AUTH_SHELL_ROUTE_PREFIXES = [
  '/app',
  '/agent-profile',
  '/profile-dashboard',
  '/profile-setup',
  '/kyc-upload',
  '/change-password',
  '/role-setup',
  '/role-selection',
  '/buyer-dashboard',
  '/buyer-workspace',
  '/buyer-flow',
  '/conveyancer',
  '/escrow',
  '/inspection-verification',
  '/logistics-delivery-marketplace',
  '/property-lifecycle',
  '/risk-analytics',
  '/boq-workspace',
  '/workspace',
  '/admin',
] as const;

export function isAuthExemptRoute(pathname: string): boolean {
  return AUTH_EXEMPT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function shouldUseAuthenticatedShell(pathname: string): boolean {
  if (pathname === '/') {
    return false;
  }

  return AUTH_SHELL_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
