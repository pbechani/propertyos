/**
 * Routes where the top HomeNavbar should never render,
 * regardless of authentication state.
 */
export const NO_NAVBAR_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/email-verification',
  '/mfa-setup',
  '/mfa-verify',
  '/auth-flow',
  '/session-expired',
  '/oauth-connect',
  '/company-context-select',
  '/invitations',
] as const;

export function isNoNavbarRoute(pathname: string): boolean {
  return NO_NAVBAR_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

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
  '/invitations',
] as const;

const AUTH_SHELL_ROUTE_PREFIXES = [
  '/app',
  '/agent',
  '/agent-profile',
  '/ai-design-studio',
  '/admin',
  '/boq-workspace',
  '/buyer',
  '/buyer-dashboard',
  '/buyer-flow',
  '/buyer-workspace',
  '/change-password',
  '/company',
  '/company-registration',
  '/company-role-selector',
  '/construction',
  '/contractor-supplier-marketplace',
  '/conveyancer',
  '/escrow',
  '/fraud-report',
  '/inspection-verification',
  '/kyc-upload',
  '/logistics-delivery-marketplace',
  '/profile-dashboard',
  '/profile-setup',
  '/properties',
  '/property-lifecycle',
  '/risk-analytics',
  '/role-selection',
  '/role-setup',
  '/service-providers',
  '/workspace',
] as const;

export function isAuthExemptRoute(pathname: string): boolean {
  return AUTH_EXEMPT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Routes that use the authenticated shell layout (sidebar, header) when a
 * user is logged in, but are intentionally accessible to anonymous visitors
 * too — e.g. the public property listings and property detail pages.
 */
export const PUBLIC_SHELL_ROUTES = [
  '/app/listings',
  '/app/property',
  '/agent-profile',
  '/listings',
] as const;

export function isPublicShellRoute(pathname: string): boolean {
  return PUBLIC_SHELL_ROUTES.some(
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
