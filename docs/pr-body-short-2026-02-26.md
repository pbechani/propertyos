## Summary
Documentation sync for the 2026-02-26 Profile Dashboard + Role Setup completion.

## Included updates
- Updated [README.md](../README.md), [CHANGELOG.md](../CHANGELOG.md), [docs/sprint-03-run-guide.md](./sprint-03-run-guide.md), [docs/audit-sprint-01-02-03-2026-02-25.md](./audit-sprint-01-02-03-2026-02-25.md), and [design/sprints/sprint-03/CHANGELOG.md](../design/sprints/sprint-03/CHANGELOG.md).
- Added runtime validation references: migration + `python3 scripts/verify_role_setup_flow.py`.
- Documented resend verification endpoint: `POST /api/v1/auth/resend-verification-email`.

## Validation snapshot
- Verifier output confirms: `business_persisted=true`, `kyc_submitted=true`.
- Documentation-only changes; no runtime behavior modified by this PR itself.
