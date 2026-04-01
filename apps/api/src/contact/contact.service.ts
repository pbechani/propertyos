import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { NotificationService } from '../identity/notification.service';

/**
 * Per-email cooldown: one submission per email per 30 minutes.
 * Stored as SHA-256(email) → timestamp to avoid persisting PII in memory.
 */
const emailCooldown = new Map<string, number>();
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function isOnCooldown(emailHash: string): boolean {
  const last = emailCooldown.get(emailHash);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

function recordSubmission(emailHash: string): void {
  emailCooldown.set(emailHash, Date.now());
  // Clean up stale entries every ~100 submissions to prevent unbounded growth
  if (emailCooldown.size > 100) {
    const cutoff = Date.now() - COOLDOWN_MS;
    for (const [key, ts] of emailCooldown.entries()) {
      if (ts < cutoff) emailCooldown.delete(key);
    }
  }
}

const SUBJECT_LABELS: Record<string, string> = {
  buying: 'Buying Property',
  construction: 'Construction Project',
  suppliers: 'Supplies & Materials',
  logistics: 'Logistics & Delivery',
  invest: 'Diaspora Investment',
  other: 'Other',
};

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Returns `{ success: true }` on success.
   * Returns `{ success: false; cooldown: true }` if the email was submitted recently.
   * The honeypot case also returns `{ success: true }` to avoid leaking bot-detection logic.
   */
  async submit(dto: {
    name: string;
    email: string;
    subject: string;
    message: string;
    website?: string;
  }): Promise<{ success: boolean; cooldown?: boolean }> {
    // Honeypot — silently succeed without processing
    if (dto.website) {
      this.logger.warn('Contact form honeypot triggered');
      return { success: true };
    }

    const emailHash = hashEmail(dto.email);

    // Per-email cooldown check
    if (isOnCooldown(emailHash)) {
      return { success: false, cooldown: true };
    }

    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') ?? 'hello@buildtrust.io';

    const subjectLabel = SUBJECT_LABELS[dto.subject] ?? dto.subject;
    const emailBody = [
      `New contact form submission`,
      ``,
      `Name:    ${dto.name}`,
      `Subject: ${subjectLabel}`,
      `Message:`,
      `${dto.message}`,
      ``,
      `---`,
      `Reply to: ${dto.email}`,
    ].join('\n');

    try {
      await this.notificationService.sendEmail(
        supportEmail,
        `[Pribec Contact] ${subjectLabel} — ${dto.name}`,
        emailBody,
      );
      recordSubmission(emailHash);
      this.logger.log(`Contact submission processed for subject: ${subjectLabel}`);
    } catch (err) {
      this.logger.error('Failed to dispatch contact form email', err);
      return { success: false };
    }

    return { success: true };
  }
}
