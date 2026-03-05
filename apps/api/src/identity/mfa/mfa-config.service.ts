import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

// ---------------------------------------------------------------------------
// Minimal TOTP implementation (RFC 6238) — no external package required.
// Uses HMAC-SHA1 over an 8-byte big-endian counter (30 s window).
// Compatible with Google Authenticator, Authy, etc.
// ---------------------------------------------------------------------------

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let result = '';
  let bits = 0;
  let value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  return result;
}

function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of clean) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function generateTotpCode(secret: string, timeOffset = 0): string {
  const counter = Math.floor((Date.now() / 1000 + timeOffset) / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const secretBuf = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', secretBuf).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return (code % 1_000_000).toString().padStart(6, '0');
}

/** Verify with ±1 window tolerance (90 s total). */
function verifyTotp(secret: string, token: string): boolean {
  for (const offset of [-30, 0, 30]) {
    if (generateTotpCode(secret, offset) === token) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// AES-256-GCM helpers for encrypting the TOTP secret at rest.
// Key must be a 64-char hex-encoded 32-byte value.
// Cipher format: `<iv_hex>:<authtag_hex>:<ciphertext_base64>`
// ---------------------------------------------------------------------------

function encryptSecret(plaintext: string, key: string): string {
  const keyBuf = Buffer.from(key, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('base64')}`;
}

function decryptSecret(ciphertext: string, key: string): string {
  const [ivHex, authTagHex, encData] = ciphertext.split(':');
  const keyBuf = Buffer.from(key, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, iv);
  decipher.setAuthTag(authTag);
  return (
    decipher.update(Buffer.from(encData, 'base64')).toString('utf8') +
    decipher.final('utf8')
  );
}

// ---------------------------------------------------------------------------

type MfaConfigRow = {
  id: string;
  user_id: string;
  totp_secret_encrypted: string | null;
  totp_enabled: boolean;
  sms_enabled: boolean;
  fido2_enabled: boolean;
  fido2_credentials: unknown[];
  backup_codes_hash: string[];
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class MfaConfigService {
  private readonly logger = new Logger(MfaConfigService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const key =
      this.configService.get<string>('ENCRYPTION_KEY') ??
      'dev_0000000000000000000000000000000000000000000000000000000000000000';
    // Validate key length (64 hex chars = 32 bytes for AES-256)
    if (key.length !== 64) {
      this.logger.warn(
        'ENCRYPTION_KEY is not 64 hex chars. Using placeholder dev key — NEVER use in production.',
      );
    }
    this.encryptionKey = key.length === 64 ? key : key.padEnd(64, '0').slice(0, 64);
  }

  // --- Internal helpers ---

  private async getOrCreate(userId: string): Promise<MfaConfigRow> {
    await this.prisma.$executeRaw`
      INSERT INTO identity.mfa_configs (user_id)
      VALUES (${userId}::uuid)
      ON CONFLICT (user_id) DO NOTHING
    `;
    const rows = await this.prisma.$queryRaw<MfaConfigRow[]>`
      SELECT * FROM identity.mfa_configs WHERE user_id = ${userId}::uuid LIMIT 1
    `;
    return rows[0];
  }

  // --- Public API ---

  async getStatus(userId: string): Promise<{
    totpEnabled: boolean;
    smsEnabled: boolean;
    fido2Enabled: boolean;
    fido2CredentialCount: number;
    hasBackupCodes: boolean;
  }> {
    const cfg = await this.getOrCreate(userId);
    return {
      totpEnabled: cfg.totp_enabled,
      smsEnabled: cfg.sms_enabled,
      fido2Enabled: cfg.fido2_enabled,
      fido2CredentialCount: (cfg.fido2_credentials as unknown[]).length,
      hasBackupCodes: (cfg.backup_codes_hash as string[]).length > 0,
    };
  }

  /**
   * Step 1 of TOTP setup: generate a secret, return the OTP URI for QR code.
   * The secret is NOT yet stored; client must call verifyAndEnableTotp to confirm.
   */
  async setupTotp(userId: string, email: string): Promise<{ secret: string; otpUri: string }> {
    const secret = base32Encode(crypto.randomBytes(20));
    const label = encodeURIComponent(email);
    const issuer = encodeURIComponent('PRIBEC');
    const otpUri = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    return { secret, otpUri };
  }

  /**
   * Step 2 of TOTP setup: verify the first code, then encrypt and persist the secret.
   */
  async verifyAndEnableTotp(userId: string, plainSecret: string, code: string): Promise<void> {
    if (!verifyTotp(plainSecret, code)) {
      throw new BadRequestException('Invalid TOTP code');
    }

    const encryptedSecret = encryptSecret(plainSecret, this.encryptionKey);

    await this.prisma.$executeRaw`
      INSERT INTO identity.mfa_configs (user_id, totp_secret_encrypted, totp_enabled)
      VALUES (${userId}::uuid, ${encryptedSecret}, TRUE)
      ON CONFLICT (user_id) DO UPDATE
        SET totp_secret_encrypted = ${encryptedSecret},
            totp_enabled          = TRUE,
            updated_at            = NOW()
    `;
  }

  /** Verify a TOTP code for an already-enabled user (used during login challenges). */
  async verifyTotpCode(userId: string, code: string): Promise<boolean> {
    const cfg = await this.getOrCreate(userId);
    if (!cfg.totp_enabled || !cfg.totp_secret_encrypted) return false;
    const plainSecret = decryptSecret(cfg.totp_secret_encrypted, this.encryptionKey);
    return verifyTotp(plainSecret, code);
  }

  async disableTotp(userId: string, code: string): Promise<void> {
    const valid = await this.verifyTotpCode(userId, code);
    if (!valid) throw new BadRequestException('Invalid TOTP code');

    await this.prisma.$executeRaw`
      UPDATE identity.mfa_configs
      SET totp_enabled = FALSE, totp_secret_encrypted = NULL, updated_at = NOW()
      WHERE user_id = ${userId}::uuid
    `;
  }

  /** Generate 10 backup codes. Previous codes are replaced. */
  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    const hashes = await Promise.all(
      codes.map((c) => bcrypt.hash(c, 10)),
    );

    await this.prisma.$executeRaw`
      INSERT INTO identity.mfa_configs (user_id, backup_codes_hash)
      VALUES (${userId}::uuid, ${JSON.stringify(hashes)}::jsonb)
      ON CONFLICT (user_id) DO UPDATE
        SET backup_codes_hash = ${JSON.stringify(hashes)}::jsonb,
            updated_at        = NOW()
    `;

    return codes; // Return plaintext once — client must store them
  }

  /** Verify and consume a backup code (one-time use). */
  async consumeBackupCode(userId: string, code: string): Promise<boolean> {
    const cfg = await this.getOrCreate(userId);
    const hashes = cfg.backup_codes_hash as string[];

    for (let i = 0; i < hashes.length; i++) {
      const match = await bcrypt.compare(code.toUpperCase(), hashes[i]);
      if (match) {
        hashes.splice(i, 1); // Remove used code
        await this.prisma.$executeRaw`
          UPDATE identity.mfa_configs
          SET backup_codes_hash = ${JSON.stringify(hashes)}::jsonb, updated_at = NOW()
          WHERE user_id = ${userId}::uuid
        `;
        return true;
      }
    }

    return false;
  }

  async setSmsEnabled(userId: string, enabled: boolean): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO identity.mfa_configs (user_id, sms_enabled)
      VALUES (${userId}::uuid, ${enabled})
      ON CONFLICT (user_id) DO UPDATE
        SET sms_enabled = ${enabled}, updated_at = NOW()
    `;
  }

  /** Store a FIDO2/WebAuthn credential after successful attestation. */
  async addFido2Credential(
    userId: string,
    credential: { id: string; publicKey: string; counter?: number; deviceType?: string; deviceName?: string },
  ): Promise<void> {
    const cfg = await this.getOrCreate(userId);
    const credentials = cfg.fido2_credentials as unknown[];
    credentials.push({
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter ?? 0,
      deviceType: credential.deviceType ?? 'unknown',
      deviceName: credential.deviceName ?? null,
      addedAt: new Date().toISOString(),
    });

    await this.prisma.$executeRaw`
      UPDATE identity.mfa_configs
      SET fido2_credentials = ${JSON.stringify(credentials)}::jsonb,
          fido2_enabled     = TRUE,
          updated_at        = NOW()
      WHERE user_id = ${userId}::uuid
    `;
  }

  /** Remove a FIDO2 credential by its ID. */
  async removeFido2Credential(userId: string, credentialId: string): Promise<void> {
    const cfg = await this.getOrCreate(userId);
    const credentials = (cfg.fido2_credentials as Array<{ id: string }>).filter(
      (c) => c.id !== credentialId,
    );
    const fido2Enabled = credentials.length > 0;

    await this.prisma.$executeRaw`
      UPDATE identity.mfa_configs
      SET fido2_credentials = ${JSON.stringify(credentials)}::jsonb,
          fido2_enabled     = ${fido2Enabled},
          updated_at        = NOW()
      WHERE user_id = ${userId}::uuid
    `;
  }
}
