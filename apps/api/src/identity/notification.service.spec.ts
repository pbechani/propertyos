import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  const buildConfigService = (map: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => map[key]),
    }) as unknown as ConfigService;

  const response = (ok: boolean, status = ok ? 202 : 500) =>
    ({ ok, status } as unknown as Response);

  beforeEach(() => {
    jest.restoreAllMocks();
    mockFetch = jest
      .fn<typeof fetch>()
      .mockResolvedValue(response(true)) as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('falls back to queued log when email provider is not configured', async () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const service = new NotificationService(buildConfigService({}));

    await expect(
      service.sendEmail('alice@example.com', 'Verify', 'Body'),
    ).resolves.toBeUndefined();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('a***e@example.com'),
    );
  });

  it('sends email through SendGrid provider when configured', async () => {
    const service = new NotificationService(
      buildConfigService({
        EMAIL_PROVIDER: 'sendgrid',
        SENDGRID_API_KEY: 'sg-key',
        SENDGRID_FROM_EMAIL: 'noreply@pribec.com',
      }),
    );

    await service.sendEmail('alice@example.com', 'Subject', 'Body');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.sendgrid.com/v3/mail/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sg-key',
        }),
      }),
    );
  });

  it('sends sms through Twilio provider when configured', async () => {
    const service = new NotificationService(
      buildConfigService({
        TWILIO_ACCOUNT_SID: 'AC123',
        TWILIO_AUTH_TOKEN: 'token123',
        TWILIO_FROM_NUMBER: '+15550001111',
      }),
    );

    await service.sendSms('+15551234567', 'KYC approved');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('swallows provider errors when strict mode is disabled', async () => {
    mockFetch.mockResolvedValue(response(false, 500));
    const service = new NotificationService(
      buildConfigService({
        SENDGRID_API_KEY: 'sg-key',
        SENDGRID_FROM_EMAIL: 'noreply@pribec.com',
        NOTIFICATIONS_STRICT_MODE: 'false',
      }),
    );

    await expect(
      service.sendEmail('alice@example.com', 'Subject', 'Body'),
    ).resolves.toBeUndefined();
  });

  it('throws provider errors when strict mode is enabled', async () => {
    mockFetch.mockResolvedValue(response(false, 500));
    const service = new NotificationService(
      buildConfigService({
        EMAIL_PROVIDER: 'sendgrid',
        SENDGRID_API_KEY: 'sg-key',
        SENDGRID_FROM_EMAIL: 'noreply@pribec.com',
        NOTIFICATIONS_STRICT_MODE: 'true',
      }),
    );

    await expect(
      service.sendEmail('alice@example.com', 'Subject', 'Body'),
    ).rejects.toThrow('SendGrid request failed with status 500');
  });
});
