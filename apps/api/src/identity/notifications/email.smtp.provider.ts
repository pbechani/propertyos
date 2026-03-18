import * as nodemailer from 'nodemailer';
import { EmailMessage, EmailProvider } from './types';

export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    host: string,
    port: number,
    fromEmail: string,
    private readonly from: string = fromEmail,
    user?: string,
    pass?: string,
  ) {
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // Mailpit / local SMTP — no TLS
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.body,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: a.contentType,
      })),
    });
  }
}
