# Sprint 02.1 — Hardening Plan (Identity Notifications + Document Storage)

**Date:** 2026-02-22  
**Source:** Sprint 02 audit follow-up  
**Goal:** Close the 2 partial Sprint 02 deliverables to production-ready state.

## Progress Update

- ✅ H1 complete: notification adapters implemented (`SendGrid`, `Twilio`).
- ✅ H2 complete: fallback + strict mode implemented (`NOTIFICATIONS_STRICT_MODE`) and validated by unit tests.
- ✅ H3 complete: signed KYC document download URL issuance implemented.
- ✅ H4 complete: protected endpoint added (`GET /api/v1/kyc/:id/documents/:documentType/download-url`) with owner/admin authorization.
- ✅ H5 complete: audit event added (`kyc.document_download_url_issued`).
- ✅ H6 complete: focused tests added and passing for document access + storage URL generation.
- ✅ H7 complete: sprint documentation updated with endpoint, tests, and status.

---

## Scope

### In Scope
1. Provider-backed notifications (SendGrid email + Twilio SMS) with graceful fallback.
2. Access-controlled document download flow with signed URL issuance.
3. Security and audit coverage for notification and document access actions.
4. Focused unit/integration tests for the above.

### Out of Scope
- New UI screens.
- Cross-sprint refactors outside identity/document concerns.
- Full object storage migration for unrelated modules.

---

## Work Breakdown (Concrete Tasks)

| Task ID | Task | Outcome | Effort |
|---|---|---|---|
| H1 | Implement notification provider adapters | `NotificationService` sends via real providers when configured | 1.0 day |
| H2 | Add notification fallback + masking + failure policy | Non-PII logging preserved; provider outages handled safely | 0.5 day |
| H3 | Add signed download URL service for KYC files | Authorized users/admins can request time-bound download URLs | 1.0 day |
| H4 | Add document access-control endpoint(s) | New API endpoint enforces ownership/admin authorization | 1.0 day |
| H5 | Add audit events for document access | Every signed URL issuance is auditable | 0.25 day |
| H6 | Add tests (unit + controller/service integration) | Regression safety for notifications and document access | 1.0 day |
| H7 | Docs + env examples + runbook update | Clear deployment/config guidance | 0.25 day |

**Total estimate:** 5.0 engineering days

---

## File-Level Implementation Plan

### H1-H2 Notifications (SendGrid + Twilio)

**Modify**
- `apps/api/src/identity/notification.service.ts`
- `apps/api/src/identity/identity.module.ts`
- `apps/api/src/config/env.validation.ts`
- `apps/api/package.json`

**Create**
- `apps/api/src/identity/notifications/types.ts`
- `apps/api/src/identity/notifications/email.sendgrid.provider.ts`
- `apps/api/src/identity/notifications/sms.twilio.provider.ts`
- `apps/api/src/identity/notification.service.spec.ts`

**Implementation notes**
- Add provider interfaces (`sendEmail`, `sendSms`) and concrete adapters.
- Use env-gated behavior:
  - If provider credentials are present, send via provider.
  - If absent, keep existing safe masked logging path (non-PII).
- Define failure policy:
  - Auth-critical flows: log and continue unless explicitly configured as blocking.
  - KYC review notifications: retryable error surfaced to logs/metrics but does not break state transition.

---

### H3-H5 Document Storage Download + Access Control

**Modify**
- `apps/api/src/identity/document-storage.service.ts`
- `apps/api/src/identity/kyc.controller.ts`
- `apps/api/src/identity/kyc.service.ts`
- `apps/api/src/identity/audit.service.ts` (event usage only)
- `apps/api/src/identity/users.service.ts` (role/ownership helper if needed)
- `apps/api/src/identity/identity.module.ts`

**Create**
- `apps/api/src/identity/dto/kyc-document.dto.ts`
- `apps/api/src/identity/document-access.service.ts`
- `apps/api/src/identity/document-storage.service.spec.ts`
- `apps/api/src/identity/document-access.service.spec.ts`

**Implementation notes**
- Add endpoint (recommended):
  - `GET /api/v1/kyc/:id/documents/:type/download-url`
- Authorization rules:
  - User can access own KYC documents.
  - Admin can access any KYC document.
  - Deny all other actors.
- Signed URL behavior:
  - 1 hour expiry by default.
  - Context path validation (`kyc/{user_id}/{document_type}/...`).
  - Optional one-time token guard can be deferred.
- Audit event:
  - `kyc.document_download_url_issued` with actor, target user, document type, record id, ip, user-agent.

---

### H6 Tests

**Test targets**
- Notification provider selection and fallback behavior.
- PII masking in notification logs.
- Download URL authorization matrix:
  - owner allowed, admin allowed, non-owner forbidden.
- Signed URL TTL and key format validation.
- Audit event insertion for URL issuance.

**Likely files**
- `apps/api/src/identity/notification.service.spec.ts`
- `apps/api/src/identity/document-storage.service.spec.ts`
- `apps/api/src/identity/document-access.service.spec.ts`
- `apps/api/src/identity/kyc.controller.spec.ts` (if controller-level guards are validated)

---

## Acceptance Criteria (Sprint 02.1)

1. Notification service sends email via SendGrid and SMS via Twilio when configured.
2. Notification service logs remain free of plaintext PII (masked recipient only).
3. Authorized user/admin can request KYC document download URL; unauthorized users receive forbidden response.
4. Download URL expires within configured TTL (default 1 hour).
5. Every download URL issuance writes an audit log entry.
6. New/updated tests pass for notification and document access flows.

---

## Dependency & Config Checklist

### Packages
- `@sendgrid/mail`
- `twilio`
- Optional for S3-style presign in hardening pass: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

### Environment Variables
- Existing:
  - `SENDGRID_API_KEY`
  - `SENDGRID_FROM_EMAIL`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`
  - `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- Add:
  - `NOTIFICATIONS_STRICT_MODE` (default false)
  - `SIGNED_URL_EXPIRY_SECONDS` (default 3600)

---

## Execution Sequence

1. H1-H2 Notifications implementation + tests.
2. H3 document URL generation internals.
3. H4 endpoint + access control.
4. H5 audit event hooks.
5. H6 full test pass and compile validation.
6. H7 docs/env/runbook updates.

---

## Risks and Mitigations

- **Provider quota/network failures:** keep non-blocking fallback unless strict mode enabled.
- **Unauthorized document access risk:** centralize authorization checks in `DocumentAccessService` and cover with matrix tests.
- **Config drift across environments:** keep defaults safe and document env requirements in sprint report.

---

## Definition of Done

- All Sprint 02.1 acceptance criteria met.
- API build succeeds.
- Targeted identity tests pass.
- Sprint report updated to mark both previously partial deliverables as complete.
