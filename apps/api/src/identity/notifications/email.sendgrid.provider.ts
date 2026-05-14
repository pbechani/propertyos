import { EmailMessage, EmailProvider } from './types';

export class SendGridEmailProvider implements EmailProvider {
  private readonly endpoint = 'https://api.sendgrid.com/v3/mail/send';

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: message.to }] }],
        from: { email: this.fromEmail },
        subject: message.subject,
        content: [
          { type: 'text/plain', value: message.body },
          ...(message.html ? [{ type: 'text/html', value: message.html }] : []),
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid request failed with status ${response.status}`);
    }
  }
}
