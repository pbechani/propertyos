# Sprint 02 — Third-Pass Audit Report

**Sprint:** 02 — Identity, Auth, RBAC & KYC  
**Audit Date:** 2026-02-21  
**Auditor:** GitHub Copilot  
**Scope:** Fresh code review of all identity module files following the second-pass audit  
**Verdict: FIXES APPLIED** — 4 issues found (1 high, 1 medium, 2 low); all resolved in this audit pass.

---

## Summary Scorecard

| Area | Status | Notes |
|------|--------|-------|
| `refresh()` user status check | ✅ Fixed | H1 |
| `getLatestKycStatus` semantic default | ✅ Fixed | M1 |
| `JwtPayload.kyc_status` type accuracy | ✅ Fixed | M1 (type) |
| `logout` unnecessary DB call | ✅ Fixed | L1 |
| `updateMe` audit log key filtering | ✅ Fixed | L2 |
| Build | ✅ Clean | `nest build` |
| Test suite | ✅ 152/152 passing | +1 new test added |

---

## Issues Fixed

### High

#### H1 — `refresh()` does not check `user.status`
**File:** `apps/api/src/identity/auth/auth.service.ts` — `refresh()`  
**Root cause:** `login()` and `oauthLogin()` both throw `UnauthorizedException` for non-active accounts (fixed in Round 2), but `refresh()` did not. After revoking the old refresh token and fetching the user via `findById`, `user.status` was never checked before issuing new tokens. While `revokeAllSessions` is called on suspension/deletion (mitigating the risk), this is not defence-in-depth — any transient failure of that revocation path, or a race between token use and revocation, would leave a window open.  
**Fix:** Added `if (user.status !== 'active') throw new UnauthorizedException('Account is not active')` immediately after `findById` in `refresh()`, before `issueTokens` is called.  
**New test:** `'throws UnauthorizedException when account is suspended'` added to `auth.service.spec.ts`.

---

### Medium

#### M1 — `getLatestKycStatus` returns `'pending'` as default for users with no KYC submission
**Files:** `apps/api/src/identity/users.service.ts`, `apps/api/src/identity/auth/auth.types.ts`  
**Root cause:** `getLatestKycStatus()` returned `'pending'` when the DB query produced no rows (i.e., the user has never submitted a KYC). This caused all new users to have `kyc_status: 'pending'` baked into their JWT, which incorrectly implies a KYC record is in flight. Downstream services relying on this field for gating decisions would be misled.  
**Fix:**
- `getLatestKycStatus` now returns `null` when no KYC record exists (return type changed to `Promise<string | null>`).
- `JwtPayload.kyc_status` type changed from `string` to `string | null` to accurately reflect the new range.
- `getLatestKycStatus` mock in `auth.service.spec.ts` updated to return `null`.
- `users.service.spec.ts` test updated: `'defaults to pending when no KYC record exists'` → `'returns null when no KYC record exists'`, expectation changed to `toBeNull()`.

---

### Low

#### L1 — `logout` makes an unnecessary `getUserRoleNames` DB call
**Files:** `apps/api/src/identity/auth/auth.service.ts`, `apps/api/src/identity/auth/auth.controller.ts`  
**Root cause:** `logout()` called `getUserRoleNames(actorId)` inline to populate the `actorRole` field in the audit log. Since `logout` requires a valid JWT (`@UseGuards(JwtAuthGuard)`), the caller's roles are already decoded from the token — fetching them again from the DB on every logout is wasteful.  
**Fix:**
- `logout()` signature extended with optional `actorRole?: string | null` parameter.
- When `actorRole` is provided, it is used directly; otherwise falls back to a DB call (for callers without role context).
- `AuthController.RequestUser` type extended to expose `roles?: string[]` (the `JwtStrategy.validate()` already returns the full payload including roles at runtime).
- Controller now passes `req.user!.roles?.[0] ?? null` as `actorRole` to `logout()`, eliminating the DB call on the happy path.

#### L2 — `updateMe` audit log records all body keys, including `undefined` fields
**File:** `apps/api/src/identity/users.controller.ts`  
**Root cause:** `payload: { updatedFields: Object.keys(body) }` includes every key present in the DTO object, even those whose value is `undefined` (i.e., fields not sent by the caller but present as class properties). This means the audit trail could record fields as "updated" when they were never part of the request.  
**Fix:** Changed to `Object.entries(body).filter(([, v]) => v !== undefined).map(([k]) => k)`, emitting only fields that were explicitly provided by the caller.

---

## Positive Observations (Unchanged from Previous Passes)

All security positives from rounds 1 and 2 remain intact:
- Token rotation correct; SHA-256 refresh token hashing; no plaintext in DB
- Append-only DB trigger on `identity.audit_logs`
- One-time email verification tokens via Redis
- Bcrypt 12 rounds
- PII masked in notification logs
- No SQL injection surface (parameterised tagged template literals throughout)
- Schema isolation correct (`identity.*` only)
- Rate limiting on login (5 attempts / 15 min / IP)
- `revokeAllSessions` called on password reset and account suspension/deletion
- `SELF_REGISTRATION_ROLES` excludes `admin` at registration
- KYC state-machine guards on all transitions
- `ParseUUIDPipe` on all `:id` / `:roleId` path params
- JWT strategy throws on startup in production/staging without `JWT_SECRET`

---

## Deferred (Carried from Previous Rounds — Unchanged)

| # | Item | When |
|---|------|------|
| D1 | OAuth provider token verification against provider endpoint | Before staging exposure |
| D2 | S3/document storage wiring (real signed URLs) | Before real user onboarding |
| D3 | Notification provider integration (SendGrid / Twilio) | Before staging |
