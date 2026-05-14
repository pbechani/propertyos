// ─────────────────────────────────────────────────────────────────────────────
// DocuSeal DTOs — typed wrappers around the DocuSeal REST API shapes.
// Ref: https://www.docuseal.com/docs/api
// ─────────────────────────────────────────────────────────────────────────────

// ── Signing context stored in submission metadata ─────────────────────────────

/**
 * Context stored in every DocuSeal submission so the webhook dispatcher can
 * route the callback back to the right service method.
 */
export type EsignSubmissionContext =
  | { flow: 'mandate'; mandateId: string; propertyId: string }
  | { flow: 'otp'; otpId: string; saleId: string }
  | { flow: 'conveyancing'; documentId: string; caseId: string };

// ── Create Submission ─────────────────────────────────────────────────────────

export interface EsignSubmitter {
  /** Signer's full name */
  name: string;
  /** Signer's email address */
  email: string;
  /**
   * DocuSeal role name that matches the role configured on the template.
   * e.g. "Seller", "Agent", "Buyer", "Conveyancer"
   */
  role: string;
  /** Metadata passed back verbatim in webhook payloads */
  metadata?: Record<string, unknown>;
}

export interface CreateEsignSubmissionDto {
  /** DocuSeal template ID (integer) */
  templateId: number;
  submitters: EsignSubmitter[];
  /** Structured context so the webhook can route the callback */
  metadata: EsignSubmissionContext;
  /** Optional message shown to signers on the signing page */
  message?: string;
  /** Optional redirect URL after signing */
  completedRedirectUrl?: string;
}

// ── DocuSeal API responses ────────────────────────────────────────────────────

export interface DocuSealSigner {
  id: number;
  submission_id: number;
  uuid: string;
  email: string;
  name: string;
  role: string;
  status: 'pending' | 'completed' | 'declined';
  sign_page_url: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocuSealSubmission {
  id: number;
  template_id: number;
  status: 'pending' | 'completed' | 'expired';
  submitters: DocuSealSigner[];
  metadata: EsignSubmissionContext;
  created_at: string;
  updated_at: string;
}

// ── Webhook payload ───────────────────────────────────────────────────────────

export type EsignWebhookEventType =
  | 'form.started'
  | 'form.viewed'
  | 'form.completed'
  | 'submission.completed'
  | 'submission.expired';

export interface EsignWebhookPayload {
  event_type: EsignWebhookEventType;
  timestamp: string;
  data: {
    id: number;
    submission_id: number;
    email: string;
    name: string;
    role: string;
    status: 'completed' | 'declined';
    submission: {
      id: number;
      status: string;
      metadata: EsignSubmissionContext;
      submitters: DocuSealSigner[];
    };
  };
}
