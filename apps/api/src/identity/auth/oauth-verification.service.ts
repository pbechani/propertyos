import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

export type VerifiedOAuthIdentity = {
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
};

@Injectable()
export class OAuthVerificationService {
  private readonly googleClient = new OAuth2Client();
  private readonly appleJwks = createRemoteJWKSet(
    new URL('https://appleid.apple.com/auth/keys'),
  );

  constructor(private readonly configService: ConfigService) {}

  async verify(
    provider: 'google' | 'apple' | 'facebook',
    providerToken: string,
  ): Promise<VerifiedOAuthIdentity> {
    if (provider === 'google') {
      return this.verifyGoogle(providerToken);
    }

    if (provider === 'apple') {
      return this.verifyApple(providerToken);
    }

    return this.verifyFacebook(providerToken);
  }

  private async verifyGoogle(
    providerToken: string,
  ): Promise<VerifiedOAuthIdentity> {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: providerToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid Google OAuth token');
    }

    return {
      providerUserId: payload.sub,
      email: payload.email ?? null,
      emailVerified: payload.email_verified === true,
      firstName: payload.given_name ?? null,
      lastName: payload.family_name ?? null,
    };
  }

  private async verifyApple(
    providerToken: string,
  ): Promise<VerifiedOAuthIdentity> {
    const clientId = this.configService.get<string>('APPLE_OAUTH_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Apple OAuth is not configured');
    }

    const verified = await jwtVerify(providerToken, this.appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience: clientId,
    });

    const payload = verified.payload;
    const sub = payload.sub;
    if (typeof sub !== 'string' || !sub) {
      throw new UnauthorizedException('Invalid Apple OAuth token');
    }

    const email = this.getStringClaim(payload, 'email');
    const emailVerifiedValue = this.getStringClaim(payload, 'email_verified');

    return {
      providerUserId: sub,
      email,
      emailVerified: emailVerifiedValue === 'true',
      firstName: null,
      lastName: null,
    };
  }

  private async verifyFacebook(
    providerToken: string,
  ): Promise<VerifiedOAuthIdentity> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');

    if (!appId || !appSecret) {
      throw new UnauthorizedException('Facebook OAuth is not configured');
    }

    const appAccessToken = `${appId}|${appSecret}`;
    const debugTokenUrl =
      `https://graph.facebook.com/debug_token` +
      `?input_token=${encodeURIComponent(providerToken)}` +
      `&access_token=${encodeURIComponent(appAccessToken)}`;

    const debugData = await this.fetchJson<{
      data?: { is_valid?: boolean; app_id?: string; user_id?: string };
    }>(debugTokenUrl);

    if (!debugData.data?.is_valid || debugData.data.app_id !== appId) {
      throw new UnauthorizedException('Invalid Facebook OAuth token');
    }

    const profileUrl =
      `https://graph.facebook.com/me` +
      `?fields=id,email,first_name,last_name` +
      `&access_token=${encodeURIComponent(providerToken)}`;

    const profile = await this.fetchJson<{
      id?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
    }>(profileUrl);

    if (!profile.id) {
      throw new UnauthorizedException('Unable to read Facebook profile');
    }

    return {
      providerUserId: profile.id,
      email: profile.email ?? null,
      emailVerified: Boolean(profile.email),
      firstName: profile.first_name ?? null,
      lastName: profile.last_name ?? null,
    };
  }

  private getStringClaim(payload: JWTPayload, key: string): string | null {
    const value = payload[key];
    return typeof value === 'string' ? value : null;
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new UnauthorizedException('OAuth provider verification failed');
    }

    return (await response.json()) as T;
  }
}
