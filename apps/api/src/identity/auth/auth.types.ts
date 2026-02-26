export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  kyc_status: string | null;
  /** Company context — null for individual / sole-proprietor users */
  active_company_id: string | null;
  active_company_role: string | null;
  active_company_is_admin: boolean;
};

/** Returned instead of tokens when user belongs to multiple companies */
export type ContextSelectorResponse = {
  requires_context_selection: true;
  user: Record<string, unknown>;
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    role: string;
    is_admin: boolean;
  }>;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};
