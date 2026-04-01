import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { ContactDto } from './contact.dto';

@Controller('public')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * POST /api/v1/public/contact
   *
   * Public endpoint — no auth required. Rate-limited to 3 requests per 10
   * minutes per IP (overrides the global 100/min default). A per-email 30-min
   * cooldown is enforced server-side inside ContactService.
   */
  @Throttle({ default: { limit: 3, ttl: 600_000 } })
  @Post('contact')
  @HttpCode(HttpStatus.OK)
  async submit(
    @Body() dto: ContactDto,
  ): Promise<{ success: boolean; message?: string }> {
    const result = await this.contactService.submit(dto);

    if (result.cooldown) {
      return {
        success: false,
        message: 'You have already sent a message recently. Please wait 30 minutes before submitting again.',
      };
    }

    if (!result.success) {
      return {
        success: false,
        message: 'Unable to send your message right now. Please try again in a few minutes.',
      };
    }

    return { success: true };
  }
}
