import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendGridEmailProvider } from './notifications/email.sendgrid.provider';
import { SmtpEmailProvider } from './notifications/email.smtp.provider';
import { TwilioSmsProvider } from './notifications/sms.twilio.provider';
import { EmailProvider, SmsProvider } from './notifications/types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly strictMode: boolean;
  private readonly emailProvider: EmailProvider | null;
  private readonly smsProvider: SmsProvider | null;

  constructor(private readonly configService: ConfigService) {
    const strictModeValue =
      this.configService.get<string | boolean>('NOTIFICATIONS_STRICT_MODE') ??
      false;
    this.strictMode =
      strictModeValue === true || strictModeValue === 'true' || strictModeValue === '1';
    this.emailProvider = this.resolveEmailProvider();
    this.smsProvider = this.resolveSmsProvider();
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    attachments?: import('./notifications/types').EmailAttachment[],
    html?: string,
  ): Promise<void> {
    const maskedRecipient = this.maskRecipient(to);

    if (!this.emailProvider) {
      this.logger.log(
        `Email notification queued: ${subject} -> ${maskedRecipient}`,
      );
      this.logger.debug(`Email payload length: ${body.length}`);
      return;
    }

    try {
      await this.emailProvider.send({ to, subject, body, html, attachments });
      this.logger.log(`Email notification sent -> ${maskedRecipient}`);
      this.logger.debug(`Email payload length: ${body.length}`);
    } catch (error) {
      this.logger.error(
        `Email notification failed for recipient ${maskedRecipient}`,
      );
      if (this.strictMode) {
        throw error;
      }
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    const maskedRecipient = this.maskRecipient(to);

    if (!this.smsProvider) {
      this.logger.log(`SMS notification queued -> ${maskedRecipient}`);
      this.logger.debug(`SMS payload length: ${message.length}`);
      return;
    }

    try {
      await this.smsProvider.send({ to, body: message });
      this.logger.log(`SMS notification sent -> ${maskedRecipient}`);
      this.logger.debug(`SMS payload length: ${message.length}`);
    } catch (error) {
      this.logger.error(
        `SMS notification failed for recipient ${maskedRecipient}`,
      );
      if (this.strictMode) {
        throw error;
      }
    }
  }

  private resolveEmailProvider(): EmailProvider | null {
    const provider = this.configService.get<string>('EMAIL_PROVIDER') ?? 'none';

    if (provider === 'smtp') {
      const host = this.configService.get<string>('SMTP_HOST') ?? 'localhost';
      const port = parseInt(
        this.configService.get<string>('SMTP_PORT') ?? '1025',
        10,
      );
      const from =
        this.configService.get<string>('SMTP_FROM') ??
        'noreply@pribec.local';
      const user = this.configService.get<string>('SMTP_USER');
      const pass = this.configService.get<string>('SMTP_PASS');
      return new SmtpEmailProvider(host, port, from, from, user, pass);
    }

    if (provider === 'sendgrid') {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
      if (!apiKey || !fromEmail) {
        this.logger.warn(
          'EMAIL_PROVIDER=sendgrid but SENDGRID_API_KEY or SENDGRID_FROM_EMAIL is missing — falling back to log-only mode',
        );
        return null;
      }
      return new SendGridEmailProvider(apiKey, fromEmail);
    }

    return null;
  }

  private resolveSmsProvider(): SmsProvider | null {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return null;
    }

    return new TwilioSmsProvider(accountSid, authToken, fromNumber);
  }

  private maskRecipient(value: string): string {
    if (value.includes('@')) {
      const [local, domain] = value.split('@');
      const maskedLocal =
        local.length <= 2
          ? '*'.repeat(local.length)
          : `${local[0]}***${local[local.length - 1]}`;
      return `${maskedLocal}@${domain}`;
    }

    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }

    return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
  }
}
