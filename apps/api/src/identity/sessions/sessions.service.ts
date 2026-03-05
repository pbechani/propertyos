import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';

type SessionRow = {
  id: string;
  user_id: string;
  session_token_hash: string;
  device_fingerprint: string | null;
  device_name: string | null;
  ip_address: string | null;
  country_code: string | null;
  last_active_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
};

export type CreateSessionInput = {
  userId: string;
  /** SHA-256 hash of the refresh token (same hash stored in refresh_tokens) */
  sessionTokenHash: string;
  deviceFingerprint?: string | null;
  deviceName?: string | null;
  ipAddress?: string | null;
  countryCode?: string | null;
  expiresAt: Date;
};

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a session record when tokens are issued.
   * Called from AuthService.issueTokens after a successful login/refresh.
   * Idempotent — ON CONFLICT DO NOTHING avoids duplicates on rare race conditions.
   */
  async create(input: CreateSessionInput): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO identity.user_sessions
        (user_id, session_token_hash, device_fingerprint, device_name,
         ip_address, country_code, expires_at)
      VALUES
        (${input.userId}::uuid,
         ${input.sessionTokenHash},
         ${input.deviceFingerprint ?? null},
         ${input.deviceName ?? null},
         ${input.ipAddress ?? null}::inet,
         ${input.countryCode ?? null},
         ${input.expiresAt})
      ON CONFLICT (session_token_hash) DO NOTHING
    `;
  }

  /** List active (non-revoked, non-expired) sessions for a user. */
  async listActive(userId: string): Promise<SessionRow[]> {
    return this.prisma.$queryRaw<SessionRow[]>`
      SELECT
        s.id,
        s.user_id,
        s.session_token_hash,
        s.device_fingerprint,
        s.device_name,
        s.ip_address::text AS ip_address,
        s.country_code,
        s.last_active_at,
        s.expires_at,
        s.revoked_at,
        s.created_at
      FROM identity.user_sessions s
      WHERE s.user_id = ${userId}::uuid
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
      ORDER BY s.last_active_at DESC
    `;
  }

  /** Revoke a specific session (must belong to the authenticated user). */
  async revoke(userId: string, sessionId: string): Promise<{ revoked: boolean }> {
    const result = await this.prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE identity.user_sessions
      SET revoked_at = NOW()
      WHERE id = ${sessionId}::uuid
        AND user_id = ${userId}::uuid
        AND revoked_at IS NULL
      RETURNING id
    `;
    return { revoked: result.length > 0 };
  }

  /** Revoke all sessions for a user *except* the one identified by currentTokenHash. */
  async revokeAllOther(userId: string, currentTokenHash: string): Promise<{ count: number }> {
    const result = await this.prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE identity.user_sessions
      SET revoked_at = NOW()
      WHERE user_id = ${userId}::uuid
        AND session_token_hash != ${currentTokenHash}
        AND revoked_at IS NULL
      RETURNING id
    `;
    return { count: result.length };
  }

  /** Revoke all sessions for a user (e.g., on password change or account suspension). */
  async revokeAll(userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE identity.user_sessions
      SET revoked_at = NOW()
      WHERE user_id = ${userId}::uuid
        AND revoked_at IS NULL
    `;
  }

  /** Touch last_active_at on a session (can be called on authenticated requests). */
  async touch(tokenHash: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE identity.user_sessions
      SET last_active_at = NOW()
      WHERE session_token_hash = ${tokenHash}
        AND revoked_at IS NULL
        AND expires_at > NOW()
    `;
  }
}
