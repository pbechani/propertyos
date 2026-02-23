export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

export type SmsMessage = {
  to: string;
  body: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<void>;
}
