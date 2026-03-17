/**
 * Shared request types used across all controllers.
 * Replaces 15+ duplicate `type AuthRequest` definitions found in:
 *   property.controller, sales.controller, leads.controller,
 *   conveyancing.controller, reports.controller, fraud.controller,
 *   viewing.controller, buyer.controller, mandate.controller,
 *   valuation.controller, verification.controller, neighbourhood.controller,
 *   dashboard.controller, sales-enhanced.controller, ai-intelligence.controller
 */

/**
 * Standard authenticated request — used by most controllers.
 * Includes user JWT claims, client IP, and user-agent header.
 */
export type AuthRequest = {
  user: {
    sub: string;
    email: string;
    roles: string[];
    active_company_id?: string | null;
    active_company_role?: string | null;
    active_company_is_admin?: boolean;
  };
  ip: string;
  headers: { 'user-agent'?: string };
};

/**
 * Public request — used by endpoints that work both authenticated and anonymous.
 */
export type PublicRequest = {
  user?: {
    sub: string;
    email: string;
    roles: string[];
  };
  ip: string;
  headers: { 'user-agent'?: string };
};
