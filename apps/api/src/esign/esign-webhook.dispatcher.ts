import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { EsignWebhookPayload } from './esign.dto';
import { MandateService } from '../property/mandate.service';
import { OtpService } from '../sales/otp.service';
import { DocumentWorkflowService } from '../conveyancing/document-workflow.service';

@Injectable()
export class EsignWebhookDispatcher {
  private readonly logger = new Logger(EsignWebhookDispatcher.name);

  constructor(
    @Inject(forwardRef(() => MandateService))
    private readonly mandateService: MandateService,

    @Inject(forwardRef(() => OtpService))
    private readonly otpService: OtpService,

    @Inject(forwardRef(() => DocumentWorkflowService))
    private readonly documentWorkflowService: DocumentWorkflowService,
  ) {}

  async dispatch(payload: EsignWebhookPayload): Promise<void> {
    const { event_type, data } = payload;

    // We only act on final-completion events
    if (event_type !== 'form.completed' && event_type !== 'submission.completed') {
      this.logger.debug(`Ignoring event_type=${event_type}`);
      return;
    }

    const context = data?.submission?.metadata;
    if (!context) {
      this.logger.warn('DocuSeal webhook payload missing submission.metadata');
      return;
    }

    const submissionId = String(data.submission_id);

    try {
      switch (context.flow) {
        case 'mandate':
          await this.mandateService.onEsignCompleted(
            submissionId,
            context.mandateId,
            context.propertyId,
          );
          break;

        case 'otp':
          await this.otpService.onEsignCompleted(
            submissionId,
            context.otpId,
            context.saleId,
            data.role, // 'Buyer' or 'Seller'
          );
          break;

        case 'conveyancing':
          await this.documentWorkflowService.onEsignCompleted(
            submissionId,
            context.documentId,
            context.caseId,
          );
          break;

        default:
          this.logger.warn(`Unknown esign flow: ${JSON.stringify(context)}`);
      }
    } catch (err: unknown) {
      // Log but do not rethrow — DocuSeal will retry on non-200 responses,
      // but an application error should not produce an infinite retry loop.
      this.logger.error('EsignWebhookDispatcher.dispatch error', err);
    }
  }
}
