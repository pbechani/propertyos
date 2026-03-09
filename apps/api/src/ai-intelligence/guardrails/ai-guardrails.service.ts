import { Injectable, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

// ─────────────────────────────────────────────────────────────────────────────
// AI Safety & Guardrails Layer
//
// This service sits at the entry point of EVERY AI interaction.
// It enforces:
//
//   1. Input length limits   — prevent context-flooding DoS attacks
//   2. Prompt injection detection — detect "ignore previous instructions" and
//      similar adversarial patterns (OWASP LLM01)
//   3. PII heuristic scanning — flag obvious PII before it enters the AI layer
//   4. Content policy checks — block harmful / abusive queries
//   5. Per-user rate limiting — independent of the global HTTP throttle,
//      this tracks AI-specific query budgets (default: 120 queries / hour)
//   6. Output schema validation — ensure agent responses conform to the
//      AssistantResponse contract before being returned to callers
//
// SECURITY NOTE: All checks run synchronously in-process.  Blocking inputs
// are rejected with specific error codes so clients can surface actionable
// messages without leaking internal details.
// ─────────────────────────────────────────────────────────────────────────────

/** Per-user rate-limit window (ms) and maximum queries within that window. */
const RATE_LIMIT_WINDOW_MS = 60 * 60_000; // 1 hour
const RATE_LIMIT_MAX_QUERIES = 120; // 120 AI queries / hour per user

/** Hard limit on raw query length (characters). The DTO enforces MaxLength(500)
 *  but this layer is defence-in-depth for programmatic callers. */
const MAX_QUERY_LENGTH = 1000;

/** Patterns that indicate a prompt injection attempt (OWASP LLM01).
 *  Checked case-insensitively against the raw input. */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /you\s+are\s+now\s+(a\s+)?/i,
  /forget\s+(everything|all)\s+(you|above)/i,
  /act\s+as\s+(if\s+you\s+are|a\s+)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /override\s+(your\s+)?(system\s+)?prompt/i,
  /bypass\s+(your\s+)?(safety|filter|guardrail)/i,
  /<\s*script[\s>]/i, // XSS attempt
  /\beval\s*\(/i, // code injection attempt
  /;\s*(DROP|DELETE|UPDATE|INSERT)\s+/i, // SQL injection attempt
];

/** Heuristic patterns for obvious PII in inputs.
 *  WARNING: This is a best-effort scan — not a comprehensive PII detector. */
const PII_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'south_african_id', pattern: /\b\d{13}\b/ },
  { name: 'credit_card', pattern: /\b(?:\d[ -]?){13,19}\b/ },
  { name: 'email', pattern: /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i },
  { name: 'phone', pattern: /\b(?:\+27|0)[6789]\d{8}\b/ },
];

/** Content policy: reject queries containing these topics. */
const BLOCKED_CONTENT_PATTERNS: RegExp[] = [
  /\b(hack|exploit|attack|ddos|malware|ransomware)\b/i,
  /\b(password|credentials?|api.?key|secret.?key)\b.*\b(show|dump|list|get)\b/i,
];

type RateLimitEntry = {
  queryCount: number;
  windowStartMs: number;
};

export type GuardrailsViolation = {
  code: 'INJECTION' | 'PII_DETECTED' | 'CONTENT_POLICY' | 'RATE_LIMIT' | 'LENGTH_EXCEEDED';
  message: string;
  detail?: string;
};

@Injectable()
export class AiGuardrailsService {
  private readonly logger = new Logger(AiGuardrailsService.name);

  /** Per-user rate tracking: userId → RateLimitEntry */
  private readonly rateLimits = new Map<string, RateLimitEntry>();

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Validate a user's AI query.
   * Throws `BadRequestException` or `TooManyRequestsException` on violation.
   * Returns the sanitised query string on success.
   */
  validateAndSanitise(query: string, userId: string): string {
    const violation = this.check(query, userId);
    if (violation) {
      if (violation.code === 'RATE_LIMIT') {
        throw new HttpException(violation.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new BadRequestException(violation.message);
    }
    return this.sanitise(query);
  }

  /**
   * Check a query without throwing — returns a violation descriptor or `null`.
   * Useful for logging / auditing without aborting the request.
   */
  check(query: string, userId: string): GuardrailsViolation | null {
    // 1. Length check
    if (query.length > MAX_QUERY_LENGTH) {
      return {
        code: 'LENGTH_EXCEEDED',
        message: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters.`,
        detail: `Received ${query.length} characters.`,
      };
    }

    // 2. Prompt injection
    for (const pat of INJECTION_PATTERNS) {
      if (pat.test(query)) {
        this.logger.warn(`Prompt injection detected from user ${userId}: ${query.substring(0, 80)}`);
        return {
          code: 'INJECTION',
          message: 'Query contains disallowed patterns.',
        };
      }
    }

    // 3. PII detection (warn + block)
    for (const { name, pattern } of PII_PATTERNS) {
      if (pattern.test(query)) {
        this.logger.warn(`PII detected (${name}) in query from user ${userId}`);
        return {
          code: 'PII_DETECTED',
          message: `Please do not include personal information (${name.replace(/_/g, ' ')}) in AI queries.`,
        };
      }
    }

    // 4. Content policy
    for (const pat of BLOCKED_CONTENT_PATTERNS) {
      if (pat.test(query)) {
        this.logger.warn(`Content policy violation from user ${userId}: ${query.substring(0, 80)}`);
        return {
          code: 'CONTENT_POLICY',
          message: 'Query violates content policy.',
        };
      }
    }

    // 5. Per-user rate limit
    const rateLimitViolation = this.checkRateLimit(userId);
    if (rateLimitViolation) return rateLimitViolation;

    return null;
  }

  /**
   * Validate that an agent response conforms to the AssistantResponse schema.
   * Returns `false` if the response is invalid (caller should substitute a safe fallback).
   */
  validateOutput(response: unknown): boolean {
    if (!response || typeof response !== 'object') return false;
    const r = response as Record<string, unknown>;
    const validTypes = ['list', 'chart', 'summary', 'text', 'error'];
    if (!validTypes.includes(r['responseType'] as string)) return false;
    return true;
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────

  private checkRateLimit(userId: string): GuardrailsViolation | null {
    const now = Date.now();
    const entry = this.rateLimits.get(userId);

    if (!entry || now - entry.windowStartMs > RATE_LIMIT_WINDOW_MS) {
      // New window
      this.rateLimits.set(userId, { queryCount: 1, windowStartMs: now });
      return null;
    }

    if (entry.queryCount >= RATE_LIMIT_MAX_QUERIES) {
      const resetInMin = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (now - entry.windowStartMs)) / 60_000,
      );
      return {
        code: 'RATE_LIMIT',
        message: `AI query rate limit reached (${RATE_LIMIT_MAX_QUERIES}/hour). Resets in ~${resetInMin} min.`,
      };
    }

    this.rateLimits.set(userId, {
      ...entry,
      queryCount: entry.queryCount + 1,
    });
    return null;
  }

  // ── Sanitisation ───────────────────────────────────────────────────────────

  /**
   * Remove dangerous characters and normalise whitespace.
   * This is defence-in-depth; the primary defence is the injection check above.
   */
  private sanitise(query: string): string {
    return query
      .replace(/[<>]/g, '') // strip HTML angle brackets
      .replace(/\s{2,}/g, ' ') // collapse multiple whitespace
      .trim();
  }

  // ── Diagnostics ────────────────────────────────────────────────────────────

  /** Return current rate-limit counters (admin/debug use only). */
  getRateLimitStatus(userId: string): { queryCount: number; windowStartMs: number; remaining: number } | null {
    const entry = this.rateLimits.get(userId);
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.windowStartMs > RATE_LIMIT_WINDOW_MS) return null;
    return {
      queryCount: entry.queryCount,
      windowStartMs: entry.windowStartMs,
      remaining: Math.max(0, RATE_LIMIT_MAX_QUERIES - entry.queryCount),
    };
  }

  /** Evict stale rate-limit windows (call from a scheduled task). */
  purgeStaleRateLimitWindows(): number {
    const now = Date.now();
    let purged = 0;
    for (const [userId, entry] of this.rateLimits.entries()) {
      if (now - entry.windowStartMs > RATE_LIMIT_WINDOW_MS) {
        this.rateLimits.delete(userId);
        purged++;
      }
    }
    return purged;
  }
}
