import {
  Injectable,
  Logger,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateEsignSubmissionDto,
  DocuSealSubmission,
  DocuSealSigner,
} from './esign.dto';

@Injectable()
export class EsignService {
  private readonly logger = new Logger(EsignService.name);
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('DOCUSEAL_BASE_URL', 'http://localhost:3010');
    this.apiToken = this.config.get<string>('DOCUSEAL_API_TOKEN', '');
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private get headers(): Record<string, string> {
    return {
      'X-Auth-Token': this.apiToken,
      'Content-Type': 'application/json',
    };
  }

  private async doFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`DocuSeal ${method} ${path} → ${res.status}: ${text}`);
      throw new BadGatewayException('E-signature provider unavailable');
    }
    return res.json() as Promise<T>;
  }

  // ── Create Submission ─────────────────────────────────────────────────────

  async createSubmission(dto: CreateEsignSubmissionDto): Promise<DocuSealSubmission> {
    const payload = {
      template_id: dto.templateId,
      submitters: dto.submitters.map((s) => ({
        name: s.name,
        email: s.email,
        role: s.role,
        metadata: s.metadata ?? {},
      })),
      metadata: dto.metadata,
      ...(dto.message ? { message: dto.message } : {}),
      ...(dto.completedRedirectUrl ? { completed_redirect_url: dto.completedRedirectUrl } : {}),
    };
    return this.doFetch<DocuSealSubmission>('POST', '/api/submissions', payload);
  }

  // ── Get Submission ────────────────────────────────────────────────────────

  async getSubmission(submissionId: number): Promise<DocuSealSubmission> {
    return this.doFetch<DocuSealSubmission>('GET', `/api/submissions/${submissionId}`);
  }

  // ── Get completed document URL ────────────────────────────────────────────

  async getCompletedDocumentUrl(submissionId: number): Promise<string | null> {
    try {
      const submission = await this.getSubmission(submissionId);
      if (submission.status !== 'completed') return null;
      return `${this.baseUrl}/api/submissions/${submissionId}/download`;
    } catch {
      return null;
    }
  }

  // ── Get signer URL ────────────────────────────────────────────────────────

  getSignerUrl(submission: DocuSealSubmission, role: string): string | null {
    const signer: DocuSealSigner | undefined = submission.submitters.find(
      (s) => s.role === role,
    );
    return signer?.sign_page_url ?? null;
  }
}
