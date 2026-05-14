# DocuSeal Integration Design
**Date:** 2026-05-11  
**Scope:** Option D — DocuSeal as the single e-signature provider across Mandate → OTP → Conveyancing  
**Approach:** Self-hosted via Docker Compose; NestJS `EsignService` abstraction layer; webhook-driven status sync

---

## 1. What DocuSeal Is

[DocuSeal](https://github.com/docusealco/docuseal) is an open-source, self-hostable document signing platform. It provides:

- A REST API for submitting signature requests (called **submissions**) against PDF **templates**
- An embeddable signing UI (iframe / redirect) for each signer
- Webhooks that fire when a signer completes or when all parties are done
- No per-document SaaS fees — runs in Docker, stores data in its own SQLite/PostgreSQL database

It replaces DocuSign/HelloSign as the e-sign backend. The app keeps its own `esign_provider` + `esign_envelope_id` columns (already in the schema); DocuSeal simply fills them in.

---

## 2. Current State Inventory

### Schema columns already in place (no migration needed for core columns)

| Table | Column | Purpose |
|---|---|---|
| `conveyancing.generated_documents` | `esign_provider VARCHAR(30)` | Will store `'docuseal'` |
| `conveyancing.generated_documents` | `esign_envelope_id VARCHAR(255)` | DocuSeal `submission_id` |
| `conveyancing.generated_documents` | `signatures JSONB` | Per-signer status array |
| `conveyancing.generated_documents` | `fully_signed_at TIMESTAMPTZ` | Set when all parties sign |
| `conveyancing.generated_documents` | `status` | `draft → sent_for_signature → fully_signed` |
| `sales.offer_to_purchase` | `buyer_signature_url` | Will store DocuSeal completed doc URL |
| `sales.offer_to_purchase` | `seller_signature_url` | Will store DocuSeal completed doc URL |
| `property.listing_mandates` | `agreement_document_url` | Will store DocuSeal completed doc URL |
| `property.listing_mandates` | `signed_by_seller_at` | Timestamp set on DocuSeal webhook |
| `property.listing_mandates` | `signed_by_agent_at` | Timestamp set on DocuSeal webhook |

### Columns to add via migration

| Table | Column | Type | Notes |
|---|---|---|---|
| `property.listing_mandates` | `esign_submission_id` | `VARCHAR(255)` | DocuSeal submission ID |
| `sales.offer_to_purchase` | `esign_submission_id` | `VARCHAR(255)` | DocuSeal submission ID |
| `sales.offer_to_purchase` | `esign_provider` | `VARCHAR(30)` | `'docuseal'` |

### Services with signing logic today

| Service | Current signing mechanism | What changes |
|---|---|---|
| `mandate.service.ts` | `signatureUrl` from DTO body (client-supplied, unverified) | Replace with DocuSeal submission creation; webhook sets `signed_by_*_at` |
| `otp.service.ts` | `dto.signatureUrl` from DTO body (client-supplied, unverified) | Replace with DocuSeal submission; webhook sets `buyerSignedAt` / `sellerSignedAt` |
| `document-workflow.service.ts` | Sets `sent_for_signature`; `recordSignature` called manually | Replace with DocuSeal submission; webhook calls the existing `recordSignature` logic |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  NestJS API  (apps/api/src/)                            │
│                                                         │
│  ┌──────────────────┐     ┌──────────────────────────┐  │
│  │  EsignModule     │     │  EsignWebhookController  │  │
│  │  EsignService    │────▶│  POST /webhooks/docuseal │  │
│  │  (DocuSeal HTTP) │     │  (verifies HMAC secret)  │  │
│  └──────────────────┘     └──────────┬───────────────┘  │
│         ▲                            │                   │
│         │                            ▼                   │
│  mandate.service     ┌──────────────────────────────┐   │
│  otp.service         │  EsignWebhookDispatcher      │   │
│  document-workflow   │  routes event to:             │   │
│  .service            │  - MandateService.onSigned()  │   │
│                      │  - OtpService.onSigned()      │   │
│                      │  - DocWorkflow.onSigned()     │   │
│                      └──────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────┘
                               │  HTTP REST + Webhooks
                               ▼
┌──────────────────────────────────────────┐
│  DocuSeal  (Docker — port 3010)          │
│  - Submission API                        │
│  - Template management UI                │
│  - Signing UI (embedded iframe)          │
│  - Webhook delivery                      │
│  - Stores signed PDFs internally         │
└──────────────────────────────────────────┘
                               │
                               ▼
                        MinIO (port 9000)
                   ← DocuSeal can write completed
                     PDFs to S3-compatible storage
```

### Signing flow (per use case)

```
1. App backend creates DocuSeal submission via EsignService
   → POST https://docuseal:3010/api/submissions
   → Returns { submission_id, signers: [{ id, email, sign_page_url }] }

2. Backend stores submission_id in DB column (esign_submission_id / esign_envelope_id)
   Sets status = 'sent_for_signature'

3. Backend emails signers (via Mailpit in dev, SMTP in prod)
   OR returns sign_page_url to frontend for embedded iframe display

4. Signer opens URL → DocuSeal UI → draws/types signature → submits

5. DocuSeal fires webhook → POST /webhooks/docuseal
   event_type: 'form.completed' (one signer done)
              'submission.completed' (all signers done)

6. Webhook controller verifies HMAC signature
   Dispatches to the correct service method
   Service updates DB status (fully_signed, signed_by_*_at, etc.)
```

---

## 4. New Files to Create

### `apps/api/src/esign/esign.module.ts`
NestJS module exporting `EsignService`. Imported by `PropertyModule`, `SalesModule`, `ConveyancingModule`.

### `apps/api/src/esign/esign.service.ts`
Wraps DocuSeal REST API. Key methods:

```typescript
// Create a signing submission for a document (PDF URL) with N signers
createSubmission(params: {
  templateIdOrDocUrl: string;  // DocuSeal template ID or direct PDF URL
  submitters: Array<{
    name: string;
    email: string;
    role: string;             // 'Buyer' | 'Seller' | 'Agent' | 'Conveyancer'
  }>;
  sendEmail: boolean;
  metadata?: Record<string, string>;  // stored on DocuSeal submission for traceability
}): Promise<{ submissionId: string; signers: EsignSigner[] }>

// Get current status of a submission
getSubmission(submissionId: string): Promise<DocuSealSubmission>

// Get the completed signed PDF download URL
getCompletedDocumentUrl(submissionId: string): Promise<string>
```

### `apps/api/src/esign/esign-webhook.controller.ts`
Receives and verifies DocuSeal webhooks. Dispatches to `EsignWebhookDispatcher`.

```typescript
@Post('/webhooks/docuseal')
@HttpCode(200)
async handleWebhook(
  @Headers('x-docuseal-signature') sig: string,
  @RawBody() rawBody: Buffer,
  @Body() payload: DocuSealWebhookPayload,
)
```

HMAC verification: `crypto.createHmac('sha256', DOCUSEAL_WEBHOOK_SECRET).update(rawBody).digest('hex')` must match `sig`.

### `apps/api/src/esign/esign-webhook.dispatcher.ts`
Routes webhook events to the right domain service based on `submission.metadata.context`:

```typescript
// metadata.context values:
'mandate'       → MandateService.onEsignCompleted(submissionId, signerRole)
'otp'           → OtpService.onEsignCompleted(submissionId, signerRole)
'conveyancing'  → DocumentWorkflowService.onEsignCompleted(submissionId, signerId)
```

### `apps/api/src/esign/esign.dto.ts`
TypeScript types mirroring DocuSeal API response shapes.

---

## 5. Changes to Existing Files

### `docker/docker-compose.yml`
Add DocuSeal service:

```yaml
docuseal:
  image: docuseal/docuseal:latest
  container_name: pribec-docuseal
  depends_on:
    postgres:
      condition: service_healthy
  environment:
    DATABASE_URL: postgresql://pribec:pribec_dev_password@postgres:5432/docuseal_dev
    SECRET_KEY_BASE: <generate with: openssl rand -hex 64>
    FORCE_SSL: 'false'
    HOST: localhost:3010
    SMTP_ADDRESS: mailpit
    SMTP_PORT: 1025
    SMTP_USERNAME: ''
    SMTP_PASSWORD: ''
    SMTP_AUTHENTICATION: ''
    SMTP_ENABLE_STARTTLS_AUTO: 'false'
  ports:
    - '3010:3000'
  volumes:
    - docuseal_data:/data
  networks:
    - pribec-network
```

Add `docuseal_data` to the `volumes:` section at the bottom.

Note: DocuSeal needs its own database. Either use a separate `docuseal_dev` database in the same Postgres instance (created in `init-scripts/`) or let DocuSeal use SQLite (default when `DATABASE_URL` is omitted — simpler for dev).

### `docker/init-scripts/` (new file: `03-docuseal.sql`)
```sql
CREATE DATABASE docuseal_dev;
GRANT ALL PRIVILEGES ON DATABASE docuseal_dev TO pribec;
```

### `.env` / `.env.example`
Add:
```env
DOCUSEAL_BASE_URL=http://localhost:3010
DOCUSEAL_API_TOKEN=            # set after first DocuSeal login → Settings → API
DOCUSEAL_WEBHOOK_SECRET=       # set in DocuSeal → Settings → Webhooks → Secret
```

### `apps/api/src/property/mandate.service.ts`

**`sign()` method** — currently accepts `dto.signatureUrl` from the client body and stamps the mandate as signed. This is insecure (client supplies any URL). Replace with:

1. Remove `signatureUrl` from `SignMandateDto` for the `'seller'` party path  
2. When `party === 'seller'` and the mandate has no `esign_submission_id`, call `EsignService.createSubmission()` and store the `submissionId` → set status `pending_signature`, return `{ signPageUrl }` to the caller  
3. Remove the direct timestamp-stamping from `sign()` for seller — timestamps are now set by `onEsignCompleted()`  
4. Add `onEsignCompleted(submissionId: string)` method that sets `signed_by_seller_at`, `signed_by_agent_at`, and promotes status to `active`

**`sellerOfflineSign()` method** — keep as-is. Offline paper signing is still a valid fallback.

### `apps/api/src/sales/otp.service.ts`

**`signOtp()` method** — currently stamps `buyerSignedAt` / `sellerSignedAt` with a client-supplied `signatureUrl`. Replace with:

1. On first call from buyer: `EsignService.createSubmission()` with both buyer + seller as submitters; store `submission_id` on the OTP; return `{ signPageUrl }` for the buyer's iframe  
2. On seller call: if submission exists, look up their signer URL from the submission; return `{ signPageUrl }` for seller's iframe  
3. Add `onEsignCompleted(submissionId, completedBy: 'buyer'|'seller')` that sets `buyerSignedAt`/`sellerSignedAt`; when both done, promotes OTP to `accepted`

### `apps/api/src/conveyancing/document-workflow.service.ts`

**`requestSignatures()` method** — currently sets status and builds `signerMeta` array but never creates an actual signing session. Replace with:

1. Before updating DB, call `EsignService.createSubmission()` with the signer IDs resolved to email/name (fetch from `identity.users`)  
2. Store `submissionId` in `esign_envelope_id`, store `'docuseal'` in `esign_provider`  
3. `signatures` JSONB now stores `{ signer_id, role, status, sign_page_url, requested_at }`  
4. Add `onEsignCompleted(submissionId: string, signerId: string)` that calls the existing `recordSignature()` logic

**`recordSignature()` method** — keep the core logic, just call it from `onEsignCompleted()` instead of from the HTTP controller directly (or support both paths for manual override).

### `apps/api/src/property/property.module.ts` (and `sales.module.ts`, `conveyancing.module.ts`)
Import `EsignModule` so `EsignService` is available via DI.

### `apps/api/src/app.module.ts` (or root module)
Register `EsignWebhookController` in a top-level module (or its own `EsignModule`) so the webhook route `/webhooks/docuseal` is mounted.

---

## 6. Database Migrations

### Migration: `add_esign_columns_to_mandates_and_otp`

```sql
-- property schema
ALTER TABLE property.listing_mandates
  ADD COLUMN IF NOT EXISTS esign_submission_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mandates_esign_submission_id
  ON property.listing_mandates (esign_submission_id)
  WHERE esign_submission_id IS NOT NULL;

-- sales schema
ALTER TABLE sales.offer_to_purchase
  ADD COLUMN IF NOT EXISTS esign_submission_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS esign_provider      VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS uq_otp_esign_submission_id
  ON sales.offer_to_purchase (esign_submission_id)
  WHERE esign_submission_id IS NOT NULL;
```

`conveyancing.generated_documents` already has `esign_provider` and `esign_envelope_id` — no migration needed there.

---

## 7. DocuSeal Setup Steps (first-time)

1. `docker-compose up docuseal` — visit `http://localhost:3010`
2. Create admin account
3. Go to **Settings → API** → copy the API token → paste into `DOCUSEAL_API_TOKEN`
4. Go to **Settings → Webhooks** → add webhook URL `http://pribec-api:3001/webhooks/docuseal` (internal Docker network URL) → copy the generated secret → paste into `DOCUSEAL_WEBHOOK_SECRET`
5. Upload PDF templates for each document type:
   - **Listing Mandate** → note the template ID
   - **Offer to Purchase** → note the template ID
   - **Transfer Deed / Power of Attorney / Bond Cancellation** → note template IDs
6. Store template IDs in `.env`:
   ```env
   DOCUSEAL_TEMPLATE_MANDATE=<id>
   DOCUSEAL_TEMPLATE_OTP=<id>
   DOCUSEAL_TEMPLATE_TRANSFER_DEED=<id>
   DOCUSEAL_TEMPLATE_POWER_OF_ATTORNEY=<id>
   DOCUSEAL_TEMPLATE_BOND_CANCELLATION=<id>
   ```

---

## 8. Frontend Changes

### Mandate signing — `apps/web/src/`
- After agent initiates mandate, `POST /api/v1/properties/:id/mandate/:mId/sign` now returns `{ signPageUrl }` instead of the signed mandate object
- Render an `<iframe src={signPageUrl} />` embedded in the mandate detail page (or open in a new tab as fallback)
- Poll or use a webhook-triggered realtime update (via SSE/WebSocket) to refresh mandate status after signing

### OTP signing — `apps/web/src/`
- `POST /api/v1/sales/:saleId/otp/:id/sign` returns `{ signPageUrl }`
- Same iframe/tab approach as mandate

### Conveyancing document signing — `apps/web/src/views/` (conveyancer views)
- `POST /api/v1/conveyancing/cases/:id/documents/:docId/request-signatures` now returns the submission with per-signer `sign_page_url` values stored in `signatures` JSONB
- Show each signer their link / embed the iframe in the document detail panel

---

## 9. Security Considerations

| Concern | Mitigation |
|---|---|
| Webhook spoofing | HMAC-SHA256 verification with `DOCUSEAL_WEBHOOK_SECRET` before any DB writes |
| API token exposure | Store in `.env`, never commit; use Vault in production |
| Unsigned documents stored as valid | Status check on every downstream action — `fully_signed` required before stage advance |
| DocuSeal self-signed certs | In production, put DocuSeal behind Nginx with a real cert; set `FORCE_SSL=true` |
| Template injection | `field_values` passed to templates are validated against `required_fields` whitelist (already in `generateDocument()`) |
| IDOR on webhook | Webhook payload's `submission_id` is looked up in DB and matched to the stored `esign_submission_id` — never trusted blindly |

---

## 10. Implementation Order

1. **Docker + DocuSeal service** — add to `docker-compose.yml`, create `03-docuseal.sql`, first-time setup
2. **`EsignModule` + `EsignService`** — HTTP client wrapping DocuSeal API; unit-testable with a mock client
3. **`EsignWebhookController` + `EsignWebhookDispatcher`** — HMAC verification, routing
4. **DB migration** — add `esign_submission_id` to mandates and OTP tables
5. **`MandateService`** — wire `EsignService.createSubmission()` into `sign()` + add `onEsignCompleted()`
6. **`OtpService`** — same pattern
7. **`DocumentWorkflowService`** — wire into `requestSignatures()` + add `onEsignCompleted()`
8. **Frontend** — replace direct-sign flows with iframe/tab signing UI
9. **Upload PDF templates** into DocuSeal admin, set env vars

---

## 11. What Does NOT Change

- `DocumentStorageService` — file upload / download for non-signed documents is unchanged
- `StageDocumentService` — sales stage document upload/verification is unchanged  
- KYC document upload — unchanged
- `sellerOfflineSign()` on mandate — kept as offline fallback path
- The `DOCUMENT_STATUSES` constants — `sent_for_signature` and `fully_signed` already match DocuSeal's lifecycle
