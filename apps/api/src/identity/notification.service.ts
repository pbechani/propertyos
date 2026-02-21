import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const maskedRecipient = this.maskRecipient(to);
    this.logger.log(
      `Email notification queued: ${subject} -> ${maskedRecipient}`,
    );
    this.logger.debug(`Email payload length: ${body.length}`);
  }

  async sendSms(to: string, message: string): Promise<void> {
    const maskedRecipient = this.maskRecipient(to);
    this.logger.log(`SMS notification queued -> ${maskedRecipient}`);
    this.logger.debug(`SMS payload length: ${message.length}`);
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
