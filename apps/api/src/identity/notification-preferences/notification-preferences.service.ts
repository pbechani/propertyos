import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { UpsertNotificationPreferencesDto } from './notification-preferences.dto';

type PrefRow = {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  topics: Record<string, boolean>;
  updated_at: Date;
};

const DEFAULTS: Omit<PrefRow, 'user_id' | 'updated_at'> = {
  email_enabled: true,
  sms_enabled: true,
  push_enabled: true,
  whatsapp_enabled: false,
  topics: {},
};

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<PrefRow> {
    const rows = await this.prisma.$queryRaw<PrefRow[]>`
      SELECT * FROM identity.notification_preferences
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `;

    if (rows[0]) return rows[0];

    // Return defaults without persisting (lazy creation on first update)
    return {
      user_id: userId,
      updated_at: new Date(),
      ...DEFAULTS,
    };
  }

  async upsert(
    userId: string,
    dto: UpsertNotificationPreferencesDto,
  ): Promise<PrefRow> {
    const current = await this.get(userId);

    const emailEnabled = dto.emailEnabled ?? current.email_enabled;
    const smsEnabled = dto.smsEnabled ?? current.sms_enabled;
    const pushEnabled = dto.pushEnabled ?? current.push_enabled;
    const whatsappEnabled = dto.whatsappEnabled ?? current.whatsapp_enabled;
    const topics = dto.topics
      ? { ...current.topics, ...dto.topics }
      : current.topics;

    await this.prisma.$executeRaw`
      INSERT INTO identity.notification_preferences
        (user_id, email_enabled, sms_enabled, push_enabled, whatsapp_enabled, topics)
      VALUES
        (${userId}::uuid, ${emailEnabled}, ${smsEnabled}, ${pushEnabled},
         ${whatsappEnabled}, ${JSON.stringify(topics)}::jsonb)
      ON CONFLICT (user_id) DO UPDATE
        SET email_enabled    = ${emailEnabled},
            sms_enabled      = ${smsEnabled},
            push_enabled     = ${pushEnabled},
            whatsapp_enabled = ${whatsappEnabled},
            topics           = ${JSON.stringify(topics)}::jsonb,
            updated_at       = NOW()
    `;

    return this.get(userId);
  }
}
