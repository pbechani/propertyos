# DocuSeal E-Signature — Implementation Log

> **Status:** Complete (TypeScript check: ✅ 0 errors)
> **Last updated:** 2026-04-17

---

## 1. Overview

Self-hosted [DocuSeal](https://www.docuseal.co/) is integrated as the e-signature provider covering three signing flows:

| Flow | Service | Signers |
|---|---|---|
| **Mandate** (agent listing mandate) | `MandateService` | Seller + Agent |
| **OTP** (offer to purchase) | `OtpService` | Buyer + Seller |
| **Conveyancing documents** | `DocumentWorkflowService` | Configured per document |

---

## 2. Files Created / Modified

### New Files

| File | Purpose |
|---|---|
| `apps/api/src/esign/esign.dto.ts` | TypeScript types for all DocuSeal API shapes |
| `apps/api/src/esign/esign.service.ts` | HTTP client wrapping DocuSeal REST API (uses native `fetch`) |
| `apps/api/src/esign/esign-webhook.controller.ts` | `POST /webhooks/docuseal` — verifies HMAC-SHA256 + dispatches |
| `apps/api/src/esign/esign-webhook.dispatcher.ts` | Routes webhook events to correct service based on `context.flow` |
| `apps/api/src/esign/esign.module.ts` | NestJS module wiring providers + circular-dep resolution |
| `apps/api/prisma/migrations/202604170051_esign_submission_columns/migration.sql` | DB: adds `esign_submission_id` column to `property.mandates` and `sales.offer_to_purchase` |

### Modified Files

| File | Change |
|---|---|
| `apps/api/src/property/mandate.service.ts` | Added `initiateEsign()` + `onEsignCompleted()` |
| `apps/api/src/sales/otp.service.ts` | Added `initiateEsign()` + `onEsignCompleted()` |
| `apps/api/src/conveyancing/document-workflow.service.ts` | Added `onEsignCompleted()` |
| `apps/api/src/property/property.module.ts` | Added `forwardRef(() => EsignModule)` import + exports `MandateService` |
| `apps/api/src/sales/sales.module.ts` | Added `forwardRef(() => EsignModule)` import + exports `OtpService` |
| `apps/api/src/conveyancing/conveyancing.module.ts` | Added `forwardRef(() => EsignModule)` import + exports `DocumentWorkflowService` |
| `apps/api/src/app.module.ts` | Registered `EsignModule` |
| `apps/api/.env.example` | Added DocuSeal env var block |
| `docker/docker-compose.yml` | Added `docuseal` service |

---

## 3. Architecture

### Module Dependency Graph

```
EsignModule
  ├── imports (forwardRef) ──► PropertyModule  (for MandateService)
  ├── imports (forwardRef) ──► SalesModule     (for OtpService)
  └── imports (forwardRef) ──► ConveyancingModule (for DocumentWorkflowService)

PropertyModule
  └── imports (forwardRef) ──► EsignModule  (for EsignService)

SalesModule
  └── imports (forwardRef) ──► EsignModule  (for EsignService)

ConveyancingModule
  └── imports (forwardRef) ──► EsignModule  (for EsignService)
```

### Circular Dependency Resolution

`EsignWebhookDispatcher` needs `MandateService`, `OtpService`, and `DocumentWorkflowService` to dispatch webhook events back to them. Those services in turn need `EsignService` to initiate signing. This creates a circular module dependency, resolved with NestJS `forwardRef()` on **both sides** of each pair.

In `EsignWebhookDispatcher`:
```ts
@Inject(forwardRef(() => MandateService)) private readonly mandateSvc: MandateService
@Inject(forwardRef(() => OtpService)) private readonly otpSvc: OtpService
@Inject(forwardRef(() => DocumentWorkflowService)) private readonly docSvc: DocumentWorkflowService
```

### Optional Injection

Consumer services use `@Optional()` so the app boots normally even if DocuSeal is not configured:

```ts
constructor(
  // ...existing deps...
  @Optional() private readonly esign: EsignService | null = null,
) {}
```

All `initiateEsign` methods guard with `if (!this.esign) throw new BadRequestException(...)`.

---

## 4. Webhook Flow

```
DocuSeal ──POST /webhooks/docuseal──► EsignWebhookController
                                            │
                              HMAC-SHA256 verify (X-DocuSeal-Signature)
                                            │
                                   EsignWebhookDispatcher.dispatch(payload)
                                            │
                        switch payload.submission.metadata.context.flow
                               ┌────────────┼────────────┐
                           mandate         otp      conveyancing
                               │            │            │
                    MandateService   OtpService   DocumentWorkflowService
                    .onEsignCompleted .onEsignCompleted .onEsignCompleted
```

**Event types handled:**
- `form.completed` — one signer has signed (used to stamp buyer/seller timestamp separately)
- `submission.completed` — all signers done (used to trigger final state changes)

**Security:** HMAC-SHA256 computed over raw request body, compared with `X-DocuSeal-Signature` header using `crypto.timingSafeEqual` to prevent timing attacks.

---

## 5. Per-Flow Integration

### 5.1 Mandate Flow

**Trigger:** `MandateService.initiateEsign(propertyId, mandateId, agentName, agentEmail, templateId)`

**Submitters:**
- `role: 'Seller'` — property owner
- `role: 'Agent'` — listing agent

**Submission metadata:**
```json
{
  "context": {
    "flow": "mandate",
    "mandateId": "<uuid>",
    "propertyId": "<uuid>"
  }
}
```

**On `submission.completed`:** `onEsignCompleted` verifies submission ID matches DB, stamps `seller_signed_at` + `agent_signed_at`, sets `status = 'active'`, audit logs `mandate.esign_completed`.

---

### 5.2 OTP Flow

**Trigger:** `OtpService.initiateEsign(saleId, otpId, buyerName, buyerEmail, sellerName, sellerEmail, templateId)`

**Submitters:**
- `role: 'Buyer'`
- `role: 'Seller'`

**Submission metadata:**
```json
{
  "context": {
    "flow": "otp",
    "otpId": "<uuid>",
    "saleId": "<uuid>"
  }
}
```

**On `form.completed`:** Stamps individual `buyer_esign_signed_at` or `seller_esign_signed_at` depending on `completedRole`.

**On `submission.completed`:** Promotes OTP status to `accepted`, audit logs `otp.esign_completed`.

---

### 5.3 Conveyancing Flow

**Trigger:** Called by `DocumentWorkflowService` when a generated conveyancing document needs signing. Signers are determined by document type at runtime.

**On `submission.completed`:** `onEsignCompleted` marks all signers as signed, sets document `status = 'fully_signed'`, audit logs `document.esign_completed`.

---

## 6. Database Migration

File: `apps/api/prisma/migrations/202604170051_esign_submission_columns/migration.sql`

```sql
-- property.mandates
ALTER TABLE property.mandates
  ADD COLUMN IF NOT EXISTS esign_submission_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS mandates_esign_submission_id_key
  ON property.mandates(esign_submission_id)
  WHERE esign_submission_id IS NOT NULL;

-- sales.offer_to_purchase
ALTER TABLE sales.offer_to_purchase
  ADD COLUMN IF NOT EXISTS esign_submission_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS esign_provider VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS otp_esign_submission_id_key
  ON sales.offer_to_purchase(esign_submission_id)
  WHERE esign_submission_id IS NOT NULL;
```

---

## 7. Docker Setup

DocuSeal is added to `docker/docker-compose.yml`:

```yaml
docuseal:
  image: docuseal/docuseal:latest
  ports:
    - "3010:3000"
  depends_on:
    - postgres
  environment:
    SECRET_KEY_BASE: ${DOCUSEAL_SECRET_KEY_BASE}
    FORCE_SSL: "false"
    HOST: "localhost:3010"
    SMTP_ADDRESS: mailpit
    SMTP_PORT: "1025"
  volumes:
    - docuseal_data:/data
```

Access DocuSeal admin UI at `http://localhost:3010`.

---

## 8. Environment Variables

Add to `apps/api/.env`:

```env
# DocuSeal E-Signature
DOCUSEAL_BASE_URL=http://localhost:3010
DOCUSEAL_API_TOKEN=                          # from DocuSeal admin: Settings → API tokens
DOCUSEAL_WEBHOOK_SECRET=                     # from DocuSeal admin: Settings → Webhooks
DOCUSEAL_TEMPLATE_MANDATE=                   # template ID (integer) for mandate
DOCUSEAL_TEMPLATE_OTP=                       # template ID for offer to purchase
DOCUSEAL_TEMPLATE_TRANSFER_DEED=
DOCUSEAL_TEMPLATE_POWER_OF_ATTORNEY=
DOCUSEAL_TEMPLATE_BOND_CANCELLATION=
```

---

## 9. DocuSeal Initial Setup (One-Time)

1. Start services: `docker-compose up -d docuseal`
2. Open `http://localhost:3010` and create admin account
3. Upload document templates for each flow (Mandate, OTP, Transfer Deed, etc.)
4. Set field roles on each template (e.g. `Seller`, `Agent`, `Buyer`)
5. Note the integer template IDs and populate env vars
6. In Settings → API Tokens, generate a token → set `DOCUSEAL_API_TOKEN`
7. In Settings → Webhooks, add URL `http://api:3000/webhooks/docuseal` with events:
   - `form.completed`
   - `submission.completed`
8. Copy the webhook secret → set `DOCUSEAL_WEBHOOK_SECRET`

---

## 10. Testing Checklist

- [ ] `docker-compose up -d docuseal` — service starts, admin UI accessible
- [ ] Create a test template with Seller + Agent roles
- [ ] Call `MandateService.initiateEsign(...)` — verify submission created in DocuSeal
- [ ] Sign as Seller via `sellerSignUrl` — verify `form.completed` webhook fires
- [ ] Sign as Agent via `agentSignUrl` — verify `submission.completed` webhook fires
- [ ] Confirm mandate status becomes `active` in DB
- [ ] Repeat for OTP flow (Buyer + Seller signers)
- [ ] Verify HMAC rejection: send webhook with wrong signature → expect 401
- [ ] Verify `@Optional()` guard: boot app without `DOCUSEAL_API_TOKEN` → no crash
