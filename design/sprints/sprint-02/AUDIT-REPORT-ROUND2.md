# Sprint 02 — Second-Pass Audit Report

**Sprint:** 02 — Identity, Auth, RBAC & KYC  
**Audit Date:** 2026-02-21  
**Auditor:** GitHub Copilot  
**Scope:** Fresh code review of all identity module files following the first-pass audit  
**Verdict: FIXES REQUIRED** — 11 issues found across critical/high/medium/low severities; all resolved in this audit pass.

---

## Summary Scorecard

| Area | Status | Notes |
|------|--------|-------|
| Admin self-registration blocked | ✅ Fixed | C1 |
| Suspended/deleted login blocked | ✅ Fixed | H1/H2 |
| KYC state-machine guards | ✅ Fixed | H3 |
| Audit `previous_status` accuracy | ✅ Fixed | H4 |
| `listPending()` pagination | ✅ Fixed | M1 |
| Duplicate permission constant | ✅ Fixed | M2 |
| Redundant `getUserRoleNames()` calls | ✅ Fixed | M3 |
| Admin user-read audit log | ✅ Fixed | M4 |
| `resolveExpiryDate()` silent default | ✅ Fixed | L1 |
| Hardcoded JWT fallback secret | ✅ Fixed | L2 |
| No-op `updateMe` DB write | ✅ Fixed | L3 |

---

## Issues Fixed

### Critical

#### C1 — Self-registration with `admin` role allowed
**File:** `apps/api/src/identity/auth/dto/register.dto.ts`  
**Root cause:** `RegisterDto.isValidRole()` validated against the full `IDENTITY_ROLES` constant, which includes `'admin'`. Any caller could `POST /auth/register` with `{ "role": "admin" }` and receive admin privileges.  
**Fix:** Added `SELF_REGISTRATION_ROLES` constant to `identity.constants.ts` that excludes `'admin'`. `isValidRole()` now validates against this restricted set. `assignRole()` in `UsersService` is unaffected (admin-to-admin assignment via admin endpoints is still valid).

---

### High

#### H1 — Suspended/deleted users can log in
**File:** `apps/api/src/identity/auth/auth.service.ts` — `login()`  
**Root cause:** After successful password validation, `user.status` was never checked. A suspended or deleted account could obtain fresh JWT tokens.  
**Fix:** Added `if (user.status !== 'active') throw UnauthorizedException('Account is not active')` after password validation and before issuing tokens.

#### H2 — Same status gap in `oauthLogin()` and `forgotPassword()`
**File:** `apps/api/src/identity/auth/auth.service.ts`  
**Root cause:** Neither `oauthLogin()` nor `forgotPassword()` checked `user.status`.  
**Fix:** `oauthLogin()` throws `UnauthorizedException` for non-active accounts. `forgotPassword()` silently returns (like the `!user` case) to avoid leaking account existence.

#### H3 — No state guards on KYC status transitions
**File:** `apps/api/src/identity/kyc.service.ts`  
**Root cause:** `approve()`, `reject()`, and `startReview()` ran `UPDATE` unconditionally regardless of current status. An admin could approve an already-rejected record or restart a completed review.  
**Fix:**
- `startReview()`: throws `ConflictException` unless current status is `'pending'`
- `approve()`: throws `ConflictException` unless current status is in `['pending', 'under_review']`
- `reject()`: same guard as approve

#### H4 — `approve`/`reject` audit log hardcodes `previous_status: 'pending'`
**File:** `apps/api/src/identity/kyc.controller.ts` + `kyc.service.ts`  
**Root cause:** The audit entry for approve/reject hardcoded `previous_status: 'pending'`. A record going from `under_review → approved` was logged incorrectly, corrupting the immutable audit trail.  
**Fix:** `approve()` and `reject()` now return `{ record: KycRow; previousStatus: string }`. The controller uses `previousStatus` from the result in the audit entry.

---

### Medium

#### M1 — `listPending()` unpaginated (hardcoded `LIMIT 200`)
**File:** `apps/api/src/identity/kyc.service.ts` + `kyc.controller.ts`  
**Root cause:** `listPending()` had a hardcoded `LIMIT 200` with no cursor or offset, silently dropping older records under load.  
**Fix:** Added `limit` (capped at 500) and `offset` parameters to `listPending()`. `AdminKycController.pending()` now accepts `?limit` and `?offset` query params.

#### M2 — Duplicate `users:self` permission entry
**File:** `apps/api/src/identity/identity.constants.ts`  
**Root cause:** `IDENTITY_PERMISSIONS` contained `{ resource: 'users', action: 'self' }` twice (lines 31–32).  
**Fix:** Removed the duplicate line. No DB impact since seeding uses `ON CONFLICT DO NOTHING`, but the constant was misleading.

#### M3 — Double `getUserRoleNames()` DB call per auth action
**File:** `apps/api/src/identity/auth/auth.service.ts`  
**Root cause:** In `login()`, `refresh()`, and `oauthLogin()`, `getUserRoleNames()` was called once inline for the audit log role, and then again internally inside `issueTokens()` for the JWT payload. Every auth action resulted in 2 DB round-trips for the same data.  
**Fix:** Modified `issueTokens()` to accept an optional `prefetchedRoles?: string[]` parameter. When pre-fetched roles are provided they are used directly; only falls back to a DB call if not supplied. Callers (`login`, `refresh`, `oauthLogin`) now fetch roles once, pass to `issueTokens()`, and reuse for the audit entry.

#### M4 — Admin `GET /users/:id` produces no audit log
**File:** `apps/api/src/identity/users.controller.ts`  
**Root cause:** `findUserById()` was the only state-reading admin action without an audit entry. Admin user lookups left no trace.  
**Fix:** Added `user.accessed` audit entry with `actorId`, `resourceId`, and request metadata.

---

### Low

#### L1 — `resolveExpiryDate()` silent fallback to 7 days
**File:** `apps/api/src/identity/auth/auth.service.ts`  
**Root cause:** Any unrecognised suffix (e.g. no suffix, `'w'`, `'900'`) caused the method to silently default to 7 days. A misconfigured `REFRESH_TOKEN_EXPIRY=900` would silently produce week-long tokens.  
**Fix:** Added a `Logger.warn()` call when the suffix is unrecognised, making misconfiguration visible in logs.

#### L2 — Hardcoded JWT fallback secret committed to source
**File:** `apps/api/src/identity/auth/jwt.strategy.ts`  
**Root cause:** `JwtStrategy` fell back to `'development-only-jwt-secret-change-me-123456'` if `JWT_SECRET` was not set. This value is now in version history; if `JWT_SECRET` is accidentally omitted from a staging `.env`, the app silently uses a known secret.  
**Fix:** Added an environment check — if `NODE_ENV` is `'production'` or `'staging'` and `JWT_SECRET` is missing, the constructor throws immediately, preventing startup. Development/test environments still use the fallback with a `Logger.warn()`.

#### L3 — No-op `PATCH /users/me` still hits the database
**File:** `apps/api/src/identity/users.controller.ts`  
**Root cause:** Submitting `PATCH /users/me` with an empty body `{}` triggered a real `UPDATE identity.users SET ... updated_at = NOW()` SQL statement and wrote a spurious audit entry with `updatedFields: []`.  
**Fix:** Added an early-return guard in `updateMe`: if no non-undefined fields are present, the handler reads and returns the current user without any write or audit.

---

## Positive Observations (Unchanged)

All positives from the first-pass audit remain intact:
- Token rotation, append-only DB trigger, one-time email verification tokens, bcrypt rounds, PII masking, parameterised queries, schema isolation are all correct.

---

## Deferred (Carried from Round 1 — Unchanged)

- **H2 (Round 1)** — OAuth provider token not verified against provider — before staging exposure
- **M5 (Round 1)** — S3/document storage stub — before real user onboarding
- **L3 (Round 1)** — Notification provider integration — before staging
