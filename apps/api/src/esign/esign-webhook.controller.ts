import {
  Controller,
  Post,
  Req,
  Headers,
  Body,
  HttpCode,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';
import { EsignWebhookDispatcher } from './esign-webhook.dispatcher';
import { EsignWebhookPayload } from './esign.dto';

@Controller('webhooks/docuseal')
export class EsignWebhookController {
  private readonly logger = new Logger(EsignWebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly dispatcher: EsignWebhookDispatcher,
  ) {
    this.webhookSecret = this.config.get<string>('DOCUSEAL_WEBHOOK_SECRET', '');
  }

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-docuseal-signature') signature: string | undefined,
    @Req() req: Request,
    @Body() payload: EsignWebhookPayload,
  ): Promise<{ received: true }> {
    // ── HMAC verification ──────────────────────────────────────────────────
    if (this.webhookSecret) {
      if (!signature) {
        throw new UnauthorizedException('Missing DocuSeal webhook signature');
      }
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
      if (!rawBody) {
        throw new BadRequestException('Raw body not available for signature verification');
      }
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        throw new UnauthorizedException('DocuSeal webhook signature mismatch');
      }
    }

    this.logger.log(
      `DocuSeal webhook received: event_type=${payload.event_type}, submission_id=${payload.data?.submission_id}`,
    );

    await this.dispatcher.dispatch(payload);

    return { received: true };
  }
}
