import { SmsMessage, SmsProvider } from './types';

export class TwilioSmsProvider implements SmsProvider {
  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly fromNumber: string,
  ) {}

  async send(message: SmsMessage): Promise<void> {
    const endpoint =
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    const body = new URLSearchParams({
      To: message.to,
      From: this.fromNumber,
      Body: message.body,
    });

    const basicAuth = Buffer.from(
      `${this.accountSid}:${this.authToken}`,
    ).toString('base64');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Twilio request failed with status ${response.status}`);
    }
  }
}
