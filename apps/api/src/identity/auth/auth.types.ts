export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  kyc_status: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};
