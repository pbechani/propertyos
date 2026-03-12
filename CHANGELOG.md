# Changelog

All notable changes to the PRIBEC platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Related docs:
- [README.md](README.md)
- [docs/sprint-03-run-guide.md](docs/sprint-03-run-guide.md)
- [docs/audit-sprint-01-02-03-2026-02-25.md](docs/audit-sprint-01-02-03-2026-02-25.md)

## [Unreleased]

### Changed
- **Conveyancer: Command Center page — removed all hardwired mock data (2026-03-12)**
  - **`conveyancing.service.ts`** — added `getDashboard(actorRoles, firmId)` method: queries active cases count, delayed cases count, closed-this-month count, invoiced-this-month sum, cases-by-status breakdown, revenue-by-month (last 6 months paid invoices), top-5 priority open tasks, and last-10 audit log entries — all firm-scoped (admin bypasses firm filter).
  - **`conveyancing.controller.ts`** — added `GET /conveyancing/cases/dashboard` route (placed before `GET :caseId` to avoid path-param collision); calls `getDashboard()` with the authenticated user's roles and active company ID.
  - **`api-client.ts`** — added `ConveyancerDashboardTask`, `ConveyancerActivityEntry`, `ConveyancerDashboard` types and `conveyancerApi.getDashboard(token)` fetching `GET /conveyancing/cases/dashboard`.
  - **`conveyancer/command-center/page.tsx`** — fully rewritten: calls `conveyancerApi.getDashboard()` on mount with loading/error state and a Refresh button; stat cards show live `activeCases`, `delayedCases`, `closedThisMonth`, and `invoicedThisMonth`; Alerts & Insights panel derives real-time alerts from delayed cases count + urgent/blocker tasks; Cases-by-Status pie chart uses live `casesByStatus`; Revenue Trend line chart uses live `revenueByMonth`; Priority Tasks panel uses live `priorityTasks` with priority badge, due date, case reference, and blocker flag; Recent Activity feed uses live `recentActivity` with formatted action strings and timestamps. Last-updated timestamp shown in header. Removed all imports of `mockData`.

- **Admin: Platform Finance page — removed all hardwired mock data (2026-03-12)**
  - **`escrow.service.ts`** — added `listReleases(status?)` method: queries `financial.escrow_releases` filtered by optional status, returns up to 100 rows ordered by `requested_at DESC`.
  - **`admin-finance.controller.ts`** — added `GET /admin/finance/releases?status=` endpoint (admin-only) backed by the new `listReleases()` service method.
  - **`api-client.ts`** — added `adminFinanceApi.listReleases(token, status?)` — sets `?status=` query param when provided.
  - **`admin/finance/page.tsx`** — fully rewritten: loads `getCompanyEscrowAccounts()`, `getPendingDeposits()`, and `listReleases('buyer_approved')` in parallel via `Promise.all`; stat cards show live escrow pool (summed balances), pending deposit count, pending releases count + total amount, and recent ledger entry count; revenue chart replaced with a "coming soon" placeholder (no backend revenue stats endpoint yet); conditional Pending Deposits table; conditional Pending Releases (buyer-approved, awaiting admin approval) table; ledger entries table (top 50, across all escrow accounts, sorted by date); loading spinner and error state with retry; Refresh button. Removed all imports of `mockAdminData`.

- **Admin: Audit Logs page — removed all hardwired mock data (2026-03-12)**
  - **`audit.service.ts`** — added `action` filter to `findAdminLogs()`: appends `action = $1` to the WHERE clause when provided.
  - **`audit.controller.ts`** — exposed `@Query('action')` on `GET /admin/audit-logs`; forwarded to `findAdminLogs()`.
  - **`api-client.ts`** — added `action?` to `auditApi.getAdminLogs()` params; sets `action=` query string when non-empty.
  - **`admin/audit/page.tsx`** — fully rewritten: fetches `auditApi.getAdminLogs()` with server-side action filter and offset-based pagination (50 rows/page + 1 for `hasMore` detection); event type dropdown triggers a new server request (resets to page 0); free-text search filters client-side over `actorId`, `resourceType`, `resourceId`, `action`, `ipAddress`; Previous / Next pagination controls; loading spinner; error state with retry; Refresh button; `reinstate` action type added to `ACTION_STYLES`; shows live `actorId` + `actorRole` instead of the old mock `actor` name + email. Removed all imports of `mockAdminData`.

### Fixed
- **Admin users page duplicate-content compile error (2026-03-12)**
  - Previous session left old page.tsx content appended after the new implementation, causing duplicate `ROLE_STYLES` / `KYC_STYLES` / `Page()` declarations and a Next.js build error. Removed the duplicate tail; file is now a single 443-line implementation.

### Added
- **Company Invitations: resend invitation (2026-03-12)**
  - **`company-invitations.service.ts`** — new `resend()` method: looks up invitation by `inviteId` + `companyId` (throws `NotFoundException` if missing), validates `status === 'pending'` (throws `BadRequestException` for revoked/accepted), generates a fresh `rawToken` + `tokenHash`, sets `expiresAt = now + 72 h`, updates those two columns in DB, fetches company name, logs `company_invitation.resent` audit event, sends reminder email via `sendEmail()`. Also handles expired invitations (still `pending` in DB, since expiry is computed client-side) — effectively un-expires them by issuing a new 72-hour window.
  - **`companies.controller.ts`** — added `POST /companies/:id/invitations/:inviteId/resend` endpoint, protected by `CompanyContextGuard` + `CompanyAdminGuard`.
  - **`api-client.ts`** — added `companiesApi.resendInvitation(authToken, companyId, inviteId)` returning `{ success: boolean; expires_at: string }`.
  - **`CompanyUserManagement.tsx`** — added `RefreshCw` lucide icon; added `resending: string | null` state; added `handleResendInvitation()` handler (optimistic `expires_at` update in state); Pending invitation rows now show **Resend** (indigo) + **Revoke** (red) buttons side by side, mutually disabled during each other's operation; Expired invitations in the revoked/expired table show a **Resend**-only button; added `Actions` column header to that table.
  - **Tests** — 4 new unit tests in `company-invitations.service.spec.ts`: happy path (token refresh + email + audit), `NotFoundException` when invite not found, `BadRequestException` for revoked status, `BadRequestException` for accepted status. All 13 invitation service tests pass.

- **Sprint 06-B design documents formatted (2026-03-12)**
  - **`design/sprints/sprint-06-b-enhanced.md`** — AI-First Construction PM system specification: reformatted from flat paragraphs to proper markdown with table of contents, `##`/`###` heading hierarchy, bullet lists, tables for agents/services/storage, and fenced code blocks for schema/events/cascade rules.
  - **`design/sprints/sprint-06-b-database-schema.md`** — Construction PM DB schema reference (sections 3–13): reformatted from tab-separated plain text to `| Field | Type |` tables with `###` per-table headings, `##` per-section headings, and a navigable table of contents.

- **Admin: Fraud Reports page (2026-03-12)**
  - **`api-client.ts`** — added `FraudReport` type, `FraudReportsResponse` type, and `adminFraudApi` namespace (`list`, `resolve`). Also added `role?: string | null` to the nested `user` object in `KycRecord` (was missing, caused a pre-existing TS error).
  - **`admin/fraud-reports/page.tsx`** — new admin page with paginated table (20/page) of all fraud reports, status-tab filter (All / Submitted / Under Investigation / Resolved / Dismissed), free-text search over title/type/description, inline resolve/dismiss modal with optional notes, and pagination controls.
  - **`admin/page.tsx`** — added `pendingFraudCount` state; fetches `adminFraudApi.list(token, { status: 'submitted', limit: 1 })` in the initial `loadAll()` call; renders a contextual action banner (red when reports are pending, neutral otherwise) with a **View Reports →** link to the new page.
  - **`AppSidebar.tsx`** — added `Fraud Reports` nav entry (ShieldAlert icon) to `platformAdminNavigation` between Platform Finance and Audit Logs.
- **Suspension side-effects: company membership revocation + listing management (2026-03-12)**
  - **`prisma/migrations/202603120025_agent_suspended/migration.sql`**: adds `agent_suspended BOOLEAN NOT NULL DEFAULT FALSE` column to `property.properties`, plus a partial index on `(agent_id, agent_suspended) WHERE agent_suspended = TRUE`.
  - **`property.service.ts`** — `PropertyRecord` type extended with `agent_suspended: boolean` field.
  - **`users.service.ts`** — `suspendUser()` now performs three additional side-effects after status update:
    1. Identifies the user's self (system) company.
    2. Revokes all active non-self-company memberships (`status = 'revoked'`, `revoked_by = NULL`) so company admins can reassign work.
    3. Sets `agent_suspended = true` on every listing owned by the user (disables contact/interaction widgets on non-self-company listings).
    4. Sets `status = 'inactive'` on active self-company listings (hidden from search entirely).
  - **`users.service.ts`** — `reinstateUser()` now performs two listing-restoration steps *before* updating the user status:
    1. Restores self-company listings where `agent_suspended = true AND status = 'inactive'` back to `'active'`.
    2. Clears `agent_suspended = false` on all the user's listings.
  - **`users.service.spec.ts`** — updated all existing `suspendUser` / `reinstateUser` tests to account for new `$queryRaw`/`$executeRaw` call sequences; added 4 new tests covering: membership revocation with/without self company, graceful no-op when user has no listings, listing restoration on reinstatement, and NotFoundException when an invalid userId is passed to reinstate (now also after `$executeRaw` side-effects).

- **Company Under-Investigation status (2026-03-12)**
  - **`dto/company.dto.ts`** — added `'under_investigation'` to `CompanyStatus` union type; added `InvestigateCompanyDto` with required `reason` field.
  - **`companies.service.ts`** — `placeUnderInvestigation(id, reason, actorId, ctx)`: validates company isn't already under investigation, sets `status = 'under_investigation'`, emits `company.under_investigation` audit event, notifies company admin with advisory message.
  - **`companies.controller.ts`** — `POST /admin/companies/:id/investigate` route (admin-only, `RolesGuard`).
  - **`property.service.ts`** — `search()`: added `(p.company_id IS NULL OR c.status != 'suspended')` as a fixed WHERE condition, also applied to `countQuery` (LEFT JOIN added there); added `c.status AS company_status` to the SELECT so listing cards can surface the investigation badge. `PropertyRecord` extended with `company_status: string | null`.
  - **`auth.service.ts`** — `selectContext()` was already rejecting suspended/under-investigation company contexts because it queries `AND c.status = 'active'`. No code change needed; confirmed behaviour.
  - **`apps/web/src/lib/api-client.ts`** — added `investigate(authToken, id, reason)` to `adminCompaniesApi`; added `company_status?: string | null` to `PropertyListing` type.
  - **`admin/companies/[id]/page.tsx`** — added "Under Investigation" button (amber, `AlertTriangle` icon) and reason modal on active companies; added `Under Investigation` banner (amber) when `status === 'under_investigation'` with Suspend + Reinstate actions; updated status badge in header to show `under_investigation` in yellow.
  - **`admin/companies/page.tsx`** — `StatusBadge` now renders a yellow `Under Investigation` pill for `status === 'under_investigation'`.
  - **`PropertyCard.tsx`** — added `underInvestigation?: boolean` to `PropertyCardData` interface; renders `⚠ Caution: Under Investigation` yellow badge overlay when true.
  - **`properties/search/page.tsx`** — `toCardData()` maps `company_status === 'under_investigation'` to `underInvestigation: true`.
  - **`properties/page.tsx`** — `fetchFeaturedListings()` maps `company_status === 'under_investigation'` to `underInvestigation: true`.
  - **Tests** — 5 new unit tests in `companies.service.spec.ts`: `placeUnderInvestigation` happy path, duplicate investigation guard, can investigate a suspended company; `reinstate` — new test confirming `under_investigation` companies can be reinstated. Total: 671 tests, 0 failures.

### Changed
- **`companies.service.ts`** — `reinstate()` guard updated from `status !== 'suspended'` to `!['suspended', 'under_investigation'].includes(status)`, allowing reinstatement from either status.
- **`companies.controller.ts`** — `POST /admin/companies/:id/reinstate` now works for both `suspended` and `under_investigation` companies.
- **`admin/companies/[id]/page.tsx`** — Suspended banner description updated to mention listing visibility; `Under Investigation` banner shows Suspend + Reinstate quick-action buttons.

- **Platform Admin Cockpit UI — 7 screens (2026-03-12)**
  - **`AppSidebar.tsx`** — added *Platform Admin Cockpit* collapsible group (role-gated to platform `admin` via `getIsAdminFromToken()`) with 7 submenu items in amber theme: Overview, Companies, KYC Queue, Users, Platform Finance, Audit Logs, AI Command Center — all linking to `/app/admin/*`. Company Administration section is now restricted to company-level admins only (`!isPlatformAdmin`).
  - **`_data/mockAdminData.ts`** — shared mock data module for all admin pages: `platformStats`, `mockPendingCompanies` (4), `mockAllCompanies` (8), `mockKycQueue` (6), `mockAdminUsers` (8), `mockAuditLogs` (8), `mockRevenueData` (6 months), `mockEscrowTransactions` (5).
  - **`admin/page.tsx`** — Overview dashboard: 8 KPI stat cards (users, companies, pending approvals, KYC queue, revenue, escrow pool, listings, active sales), pending company approvals panel, KYC awaiting review panel, recent admin activity feed.
  - **`admin/companies/page.tsx`** — Company list with tab filter (Pending/Active/Rejected/All), search by name/owner/reg number, status badges, inline approve/reject icon actions, links to detail page.
  - **`admin/companies/[id]/page.tsx`** — Company detail: info card, owner credentials, submitted documents checklist, status history timeline, action banner (Approve / Reject / Suspend) with confirmation modals for reject and suspend.
  - **`admin/kyc/page.tsx`** — KYC queue with tab filter (Pending/In Review/Approved/All), summary stat cards, user table with tier badges (basic/enhanced/professional), approve/reject actions, rejection reason modal.
  - **`admin/users/page.tsx`** — User management with search + role + KYC status filters, KYC status badges, account suspension status, stat cards, paginated table.
  - **`admin/finance/page.tsx`** — Platform finance: 4 stat cards (monthly revenue, escrow pool, 6-month total, pending releases), `recharts` `BarChart` (commission vs escrow fees vs subscriptions trend), recent escrow transactions table.
  - **`admin/audit/page.tsx`** — Immutable audit log table with search + event type filter, action icon badges (verify/approve=green, reject=red, suspend=orange), actor/resource/IP/event-ID columns, append-only notice.

- **Conveyancer Cockpit UI — 10 screens ported to Next.js (2026-03-11)**
  - **`AppSidebar.tsx`** — added *Conveyancer Cockpit* collapsible group (role-gated to `conveyancer`) with 9 submenu items: Command Center, Cases, Clients, Properties, Documents, Financials, Reports, Calendar, Settings — all linking to `/app/conveyancer/*`.
  - **`_data/mockData.ts`** — shared mock data module for all conveyancer pages (`mockCases`, `mockClients`, `mockProperties`, `mockDocuments`, `mockFinancials`, `aiInsights`, `workflowStats`, `tasksList`, `activityLog`).
  - **`_data/caseDetailData.ts`** — `getCaseDetail()` returning full case data (milestones, tasks, documents, financials, communications, timeline, AI insights) for detail drilldown.
  - **`command-center/page.tsx`** — AI-powered dashboard: workflow stats, risk alerts, upcoming deadlines, recharts `PieChart` (cases by type) + `LineChart` (workload trend), recent activity feed.
  - **`cases/page.tsx`** — case list with search + status filter, progress bars per stage, links to detail.
  - **`cases/[id]/page.tsx`** — 6-tab case detail (Overview, Tasks, Documents, Financials, Communications, Timeline); AI insights panel, milestone tracker, party management, quick actions.
  - **`clients/page.tsx`** — client grid with KYC badge, risk score, case count; search.
  - **`clients/[id]/page.tsx`** — client detail: related cases, documents, activity timeline, compliance sidebar.
  - **`properties/page.tsx`** — property grid with title/mortgage status, search.
  - **`properties/[id]/page.tsx`** — property detail: ownership history, compliance certificates, related cases.
  - **`documents/page.tsx`** — document table with type filter, AI document intelligence panel.
  - **`financials/page.tsx`** — 3 stats cards, recharts `BarChart` (Revenue vs Expenses), transactions table.
  - **`reports/page.tsx`** — `BarChart` (case completion), `LineChart` (revenue trend), `PieChart` (cases by type), staff performance table, report template buttons.
  - **`calendar/page.tsx`** — interactive calendar grid with month navigation, inline deadline pills, upcoming deadlines sidebar, overdue alerts section.
  - **`settings/page.tsx`** — 6-tab settings panel: Profile, Notifications, Security, Firm Details, Email Templates, Appearance.

- **Sprint 05-B — Conveyancing Case Management (2026-03-11)**
  - **Migration `202603110024_sprint05b_conveyancing`** — creates full `conveyancing.*` schema with 14 tables: `cases`, `task_templates`, `case_tasks`, `case_notes`, `deadlines`, `trust_accounts`, `trust_ledger_entries` (append-only trigger), `fee_schedules`, `invoices`, `invoice_line_items`, `document_templates`, `generated_documents`, `client_portal_access`, `audit_logs` (append-only trigger). Seeds South Africa LSSA Transfer and Bond Registration fee schedules (band JSON), plus 20 default ZA transfer task templates across stages 5–14.
  - **`ConveyancingModule`** — NestJS module wired into `AppModule`; exports `ConveyancingService` and `TrustAccountService`. Eight services + four controllers.
  - **`ConveyancingService`** — case CRUD scoped to firm; duplicate-sale guard; auto-seeds tasks from `task_templates` on case creation; `listCases()` with pagination using `COUNT(*) OVER()`.
  - **`CaseTasksService`** — task creation, status transitions (auto-sets `completed_at` / `escalated_at`), notes management with JSONB attachment list.
  - **`TrustAccountService`** — immutable append-only trust ledger: debit guard (rejects if insufficient balance), idempotency key enforcement, running balance computed from ledger entries. Append-only enforced by PostgreSQL trigger.
  - **`InvoiceService`** — conveyancing invoices with line items; VAT computed at 15%; invoice numbers formatted as `INV-{timestamp}-{seq:05d}`; status lifecycle (`draft → sent → paid`).
  - **`FeeCalculatorService`** — LSSA tariff band-based fee calculation for Transfer and Bond Registration; open-ended last band uses `(price − from) × pct_over_from` formula; returns full breakdown including VAT.
  - **`DocumentWorkflowService`** — document generation from templates with SHA-256 content hash (not raw content stored); e-signature workflow tracks individual signer status; sets `fully_signed_at` when all signers have signed.
  - **`ClientPortalService`** — token-based read-only portal for buyers / sellers / banks: rawToken (32 random bytes) returned once; SHA-256 hash stored in DB; token expiry (90-day default); `getPortalSummary()` returns case + tasks + documents + running trust balance.
  - **`ConveyancingAuditService`** — append-only `conveyancing.audit_logs` inserts; mirrors `FinancialAuditService` pattern.
  - **Controllers** — `ConveyancingCasesController` (`/api/v1/conveyancing/cases` — tasks, notes, trust ledger, invoices, documents, portal access), `FeeCalculatorController` (`/api/v1/conveyancing/fee-calculator`), `DocumentTemplatesController` (`/api/v1/conveyancing/document-templates`), `ClientPortalController` (`/api/v1/conveyancing/portal` — unauthenticated, token-validated).
  - **Tests** — 27 new unit tests across 4 spec files (`fee-calculator.service.spec.ts` ×5, `conveyancing.service.spec.ts` ×7, `trust-account.service.spec.ts` ×7, `client-portal.service.spec.ts` ×8).

- **Sprint 05 — Escrow & Financial Ledger (2026-03-11)**
  - **Migration `202603110022_sprint05_financial_escrow`** — creates full `financial.*` schema: `financial.accounts`, `financial.ledger_entries` (append-only enforced by DB trigger `trg_ledger_immutable`), `financial.escrow_conditions`, `financial.payment_requests`, `financial.escrow_releases`, `financial.exchange_rate_snapshots`, `financial.audit_logs` (append-only trigger). Seeds 3 platform accounts (`PLATFORM_ESCROW_POOL`, `PLATFORM_REVENUE`, `PLATFORM_INCOMING`). Adds `escrow_account_id` to `sales.property_sales`.
  - **`FinancialModule`** — NestJS module wired into `AppModule` exporting `AccountService`, `EscrowService`, `LedgerService`, `CommissionService`, `ExchangeRateService`.
  - **`ExchangeRateService`** — Redis-cached FX rates (1-hour TTL) fetched from Open Exchange Rates; persists snapshots in DB; falls back to rate 1.0 when key not configured or API fails.
  - **`AccountService`** — create/fetch escrow accounts; compute balance from ledger entries (CREDIT − DEBIT); find-or-create agent wallet.
  - **`LedgerService`** — double-entry `post()` with optional idempotency key; `recordEscrowDeposit()`, `recordEscrowRelease()`, `recordCommission()` helpers; `listForAccount()` with pagination.
  - **`PaymentGatewayService`** — Stripe + Flutterwave integration (bank transfer fallback); mock payment result when keys not set (dev-friendly).
  - **`EscrowService`** — full multi-signature escrow lifecycle: `initiateDeposit()`, `confirmDeposit()`, `requestRelease()`, `buyerApproveRelease()`, `adminApproveRelease()`, `rejectRelease()`, `getEscrowSummary()`. Flags transactions ≥ `HIGH_VALUE_THRESHOLD_USD` for manual review.
  - **`CommissionService`** — calculates and settles platform fee + agent commission; configurable percentages via `COMMISSION_PLATFORM_PCT` / `COMMISSION_AGENT_PCT` env vars.
  - **`FinancialAuditService`** — immutable `financial.audit_logs` INSERT via `$executeRaw`.
  - **Controllers** — `FinancialController` (accounts, ledger, FX, commission), `EscrowController` (deposit, release CRUD), `AdminFinanceController` (admin-only deposit confirm + account balance).
  - **8 new environment variables**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_SECRET`, `OPEN_EXCHANGE_RATES_APP_ID`, `HIGH_VALUE_THRESHOLD_USD` (default 10000), `COMMISSION_PLATFORM_PCT` (default 1.5), `COMMISSION_AGENT_PCT` (default 1.0).
  - **Tests** — 41 new tests across 5 spec files (`exchange-rate.service.spec.ts`, `account.service.spec.ts`, `ledger.service.spec.ts`, `commission.service.spec.ts`, `escrow.service.spec.ts`). Total: 610 tests, 0 failures.

- **Sale Parties Junction — multi-buyer / multi-seller support (2026-03-10)**
  - **Migration `20260310000001_sale_parties_junction`** — adds `sales.sale_buyers` and `sales.sale_sellers` M:N junction tables. Each row has `sale_id`, `user_id`, `added_by`, `added_at`; unique constraint per `(sale_id, user_id)`. Backfills existing rows from the legacy `buyer_id`/`seller_id` FK columns.
  - **`sales.service.ts`** — `addBuyer()`, `removeBuyer()`, `addSeller()`, `removeSeller()` methods using the junction tables; `getById()` extended to resolve full buyer and seller arrays via `fetchSalePartyUsers()`; `listForUser()` updated to check both the legacy FK column _and_ the junction table so multi-party participants see their sale.
  - **`sales.controller.ts`** — 4 new party-management endpoints: `PATCH /api/v1/sales/:id/assign-buyer`, `DELETE /api/v1/sales/:id/buyers/:userId`, `PATCH /api/v1/sales/:id/assign-seller`, `DELETE /api/v1/sales/:id/sellers/:userId` (agent/admin only).
  - **`users.service.ts`** — `searchUsers(q, role?)` method: ILIKE search on email and full name, optional role filter via JOIN on `identity.user_roles`, returns up to 10 active users (parameterised, no SQL injection risk).
  - **`users.controller.ts`** — `GET /api/v1/users/search?q=&role=` endpoint (agent/admin/conveyancer) for picking parties in the sale workspace.

- **Capital Gains / Income Tax Clearance stage (2026-03-10)**
  - **Migration `202603100020_add_capital_gains_stage`** — inserts new ZA Stage 13 "Capital Gains / Income Tax Clearance" (`conveyancer`-responsible, `is_blocker=TRUE`, SARS dept, 14 days). Existing stages 13 → 14 and 14 → 15 via: (1) drop unique constraint, (2) UPDATE stage_configs, (3) re-add constraint, (4) INSERT new stage 13. Also renumbers any in-flight `sale_stage_progress`, `stage_documents`, and `government_interactions` rows to keep consistency.
  - SA property transfers now reflect the mandatory SARS capital gains and income tax compliance certificate required before deeds registration.

- **Mandate offline seller signing flow (2026-03-11)**
  - **DB migration** (`202603100021_mandate_seller_fields`) — adds `seller_name`, `seller_email`, `seller_phone`, `seller_is_platform_user` (default `true`), and `agreement_document_url` to `property.mandates`.
  - **`MarkSellerSignedOfflineDto`** — new DTO in `mandate.dto.ts` accepting `documentUrl`.
  - **`MandateService.markSellerSignedOffline()`** — agent records an offline seller signature: verifies `seller_is_platform_user = false`, stores `agreement_document_url`, sets `signed_by_seller_at`, activates mandate when both parties have signed.
  - **`POST /properties/:propertyId/mandate/:mId/seller-offline-sign`** — new agent-only endpoint.
  - **`CreateMandateDto`** — extended with optional `sellerName`, `sellerEmail`, `sellerPhone`, `sellerIsPlatformUser` fields.
  - **Frontend** — `MandateRecord` type updated with new fields and corrected `signed_by_agent_at`/`signed_by_seller_at` column names (previously misnamed); `CreateMandatePayload` extended; `mandateApi.markSellerSignedOffline()` added.
  - **`PropertyDetailEnhanced.tsx`** — "Sign as Agent" button now visible for `pending_signature` mandates (was incorrectly gated to `active` only); create mandate form adds "seller on platform" toggle with conditional name/email/phone fields; "Mark Seller Signed (Offline)" inline flow for non-platform sellers.
  - **`AgentDashboardEnhanced.tsx`** — fixed `signed_by_agent_at`/`signed_by_seller_at` field references.
  - **Tests** — 5 new unit tests for `markSellerSignedOffline` (happy path × 2, `BadRequestException` × 2, `ForbiddenException`); `baseMandate` mock updated to current schema. 569 tests total, all passing.

### Added
- **Frontend UI Gap-Fill — Sprints 01–04 (2026-03-10)**
  - **`SalesDashboard.tsx`** (`apps/web/src/views/`) — Role-aware sales pipeline listing page. Calls `agentSalesApi`, `conveyancerApi`, or `adminSalesApi` depending on the logged-in user's role. Displays stats row (active / completed / disputed), search by address or buyer name, filter by status, and sale cards linking to `/workspace/[id]`. Route: `/app/sales`.
  - **`PropertySaleWorkspaceEnhanced.tsx`** (`apps/web/src/views/`) — Full API-connected sale workspace replacing the hardcoded mock original. 11 tabs: Timeline, Documents, OTP, Deal Room, Bond, Compliance, Disbursement, Parties, Escrow, Issues, Post-Sale Checklist. Loads real sale + stage data from `salesApi`; lazy-loads tab data on tab switch; uses `saleId` from Next.js route params. Route: `/workspace/[id]`.
  - **`SessionsView.tsx`** (`apps/web/src/views/`) — Active session management page (Sprint 02 Enhanced). Lists sessions with device icons, IP address, and last-active timestamp; supports per-session revoke and "Sign Out All Devices" with confirmation. Uses `sessionsApi`. Route: `/app/sessions`.
  - **`/app/app/sales/page.tsx`** — Route entry point for `SalesDashboard`.
  - **`/app/app/sessions/page.tsx`** — Route entry point for `SessionsView`.
  - **`salesApi`, `agentSalesApi`, `conveyancerApi`, `adminSalesApi`, `sessionsApi`** added to `apps/web/src/lib/api-client.ts` (≈ 400 lines). Covers all 25 enhanced sales endpoints (OTP, Deal Room, Bond, Compliance, Disbursement, Seller Disclosure, Post-Sale Checklist) plus sessions CRUD. New types: `Sale`, `SaleStage`, `SaleDocument`, `OTPVersion`, `DealRoomMessage`, `BondApplication`, `ComplianceStatus`, `ComplianceItem`, `DisbursementInstruction`, `SellerDisclosure`, `PostSaleChecklist`, `UserSession`, `ConveyancerCase`.

### Changed
- **`/agent/properties/new/page.tsx`** — Replaced static HTML stub with the fully-implemented `CreateListing` component. On close redirects to `/app/agent`; on success redirects to `/app/property/[id]`.
- **`ConveyancerView.tsx`** — Replaced hardcoded mock case list with live `conveyancerApi.getCases(token)` call. Stats and status filter updated to match `ConveyancerCase` type (`disputed` replaces old `blocked`/`pending` buckets). Government applications tracker retained as representative fixture.
- **`AppSidebar.tsx`** — Added "My Sales" (`/app/sales`, `Kanban` icon) to `selfNavigation` and `agentNavigation`. Added "Sessions" (`/app/sessions`, `History` icon) to `selfNavigation`. Imported `History` icon from `lucide-react`.

- **Sprint 04 Enhanced — OTP, Deal Room, Bond App, Compliance, Disbursement, Seller Disclosure, Post-Sale Checklist (2026-03-10)**
  - **8 new Prisma models** added to `sales` schema: `OfferToPurchase`, `OtpNegotiation`, `DealRoomMessage`, `BondApplication`, `ComplianceRequirement`, `DisbursementInstruction`, `PostSaleChecklist`, `SellerDisclosure`. Schema pushed via `prisma db push`.
  - **7 new service files** under `apps/api/src/sales/`:
    - `otp.service.ts` — Full OTP lifecycle: generate, list versions, buyer/seller signing, counter-offer with `OtpNegotiation` round logging, withdraw, compare offers (seller view).
    - `deal-room.service.ts` — Per-sale private messaging; 5 thread types with role-based visibility enforcement (`offer_negotiation`, `general`, `conveyancer_only`, `agent_only`, `compliance`); mark-as-read via JSON field update.
    - `bond-application.service.ts` — Bond/mortgage application per sale; one-per-sale constraint; status progression (in_progress → approved/declined).
    - `compliance.service.ts` — Compliance certificate tracking (electrical, plumbing, gas, electric_fence, beetle, rates_clearance); upsert-based setup; status flow (pending → booked → received → verified → waived).
    - `disbursement.service.ts` — Disbursement instruction with auto-computed `netProceedsToSeller`; SA SARS 2024/25 transfer duty schedule (`calculateTransferDuty` pure function with progressive brackets); two-step draft → approve flow.
    - `seller-disclosure.service.ts` — SA Consumer Protection Act seller disclosure form; one-per-sale constraint; digital signing with document URL + hash.
    - `post-sale-checklist.service.ts` — Post-sale completion checklist (keys handover, title deed, bond registration, commission, ownership registry, reviews); auto-creates on first GET.
  - **`sales-enhanced.dto.ts`** — 15 DTOs for all new services with `class-validator` decorators.
  - **`sales-enhanced.controller.ts`** — 22 new REST endpoints under `/api/v1/sales/:saleId/` covering all enhanced services; JWT-guarded.
  - **`sales.module.ts`** updated — registers 7 new providers and `SalesEnhancedController`.
  - **`sales.constants.ts`** updated — `TOTAL_STAGES` raised from 14 → 16; added `OTP_STATUSES`, `BOND_APP_STATUSES`, `COMPLIANCE_CERT_TYPES`, `CERT_STATUSES`, `DEAL_ROOM_THREAD_TYPES`, `DISBURSEMENT_STATUSES` type-safe const arrays.
  - **51 new unit tests** in 4 spec files: `otp.service.spec.ts` (24 tests), `disbursement.service.spec.ts` (14 tests), `compliance.service.spec.ts` (8 tests), `bond-application.service.spec.ts` (10 tests). Full suite: **564 tests, 44 suites, 0 failures**. TypeScript compiles clean (`tsc --noEmit` exits 0).

- **MindsDB — Predictive ML Layer (Sprint 11 foundation) (2026-03-09)**
  - Docker service `pribec-mindsdb` added to `docker/docker-compose.yml` (MindsDB latest; HTTP REST + Studio UI on port 47334, MySQL wire on 47335; auto-connects to `pribec-postgres` via `MINDSDB_DB_CON`; `mindsdb_data` volume).
  - Init SQL in `docker/mindsdb/init/`: `01_connect_postgres.sql` registers the PRIBEC PostgreSQL integration; `02_create_models.sql` defines four models: `property_valuation` (regression), `contractor_risk` (classification), `material_price_forecast` (time-series statsforecast, 7-period horizon), `project_delay_risk` (binary classification).
  - `MindsDBService` (`src/mindsdb/mindsdb.service.ts`) — HTTP client over MindsDB `/api/sql/query`; implements `OnModuleInit` to probe health and ensure the data source exists at startup; gracefully degrades (`ServiceUnavailableException`) when MindsDB is unreachable. All query parameters are sanitised before interpolation (UUID validation, string allowlist, numeric `isFinite` check) to prevent SQL injection. Methods: `predictPropertyValue`, `scoreContractorRisk`, `forecastMaterialPrice`, `predictProjectDelay`, `isAvailable`.
  - `MindsDBModule` (`src/mindsdb/mindsdb.module.ts`) — NestJS module; exports `MindsDBService` for use in analytics, property, construction, and marketplace modules (Sprint 11+).
  - DTOs in `src/mindsdb/dto/prediction-query.dto.ts` — `PropertyValuationQueryDto`, `MaterialForecastQueryDto`; result interfaces `PropertyValuationResult`, `ContractorRiskResult`, `MaterialForecastRow`, `ProjectDelayResult`.
  - Env vars: `MINDSDB_URL` (default `http://localhost:47334`), `MINDSDB_TIMEOUT_MS` (default 30000). Both added to `.env`, `env.validation.ts` (Joi, optional).
  - `MindsDBModule` registered in `AppModule`.
  - 20 unit tests in `mindsdb.service.spec.ts` covering happy paths, malformed JSON explain, empty result sets, SQL injection attempts, UUID validation, and availability guard.
  - Sprint 11 design doc updated with MindsDB integration section.

- **LLM Gateway — multi-provider AI integration (PDR-007) (2026-03-08)**
  - **`LlmGatewayService`** (`ai-intelligence/llm/`) — Multi-provider LLM abstraction using native `fetch` (no new npm dependency). Supports OpenAI (`gpt-4o-mini`), Anthropic (`claude-3-haiku-20240307`), and Gemini (`gemini-1.5-flash`). Primary + optional fallback provider chain; 15 s `AbortController` timeout per request; JSON-mode support per provider (OpenAI uses `response_format:json_object`, Anthropic/Gemini append instruction to system prompt). `isEnabled` is `false` when no `LLM_API_KEY` is set — platform degrades gracefully to the existing keyword router with no config required.
  - **`LlmGatewayTypes`** (`ai-intelligence/llm/llm-gateway.types.ts`) — Shared `LlmProvider`, `LlmMessage`, `LlmCompletionOptions`, `LlmCompletion` types.
  - **LLM fallback in `AIIntelligenceService`** — `semanticFallback()` now attempts an LLM call when no keyword intent scores ≥ 1. Builds a compact `buildDataSnapshot()` (4 parallel Prisma queries: lead stats, task stats, property counts, 5 recent leads) and sends it as JSON context to the LLM with a structured system prompt instructing the model to return an `AssistantResponse`-shaped JSON object (no PII beyond first-name initials). Falls back to the existing static help message if the LLM is disabled, API call fails, or JSON parse fails.
  - **Env vars** — 6 new optional variables: `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_FALLBACK_PROVIDER`, `LLM_FALLBACK_API_KEY`, `LLM_FALLBACK_MODEL`. All optional, added to `env.validation.ts` (Joi) and `.env.example` with full comments.
  - **Tests**: `ai-intelligence.service.spec.ts` updated with `LlmGatewayService` mock (`isEnabled: false`). All 484 tests pass, TypeScript compiles clean.

- **AI Infrastructure — 5-Layer Architecture (2026-03-08)**
  - **AgentMemoryService** (`ai-intelligence/memory/`) — Two-tier memory for AI agents: ephemeral short-term (TTL-bounded, default 5 min) and persistent long-term storage; circular reasoning-step buffer (50 steps per agent×company); `purgeExpiredShortTerm()` for scheduled housekeeping; full snapshot API.
  - **AgentRegistryService** (`ai-intelligence/registry/`) — Central discovery registry with `AI_AGENTS_TOKEN` injection; tracks agent descriptors, health metrics, pause/resume, per-invocation success/failure counters; `getCapableAgent()` and `getAgentForAction()` for capability-based routing.
  - **AiObservabilityService** (`ai-intelligence/observability/`) — Structured trace lifecycle (`startTrace` → `endTrace` / `failTrace`); token + cost estimation (COST_PER_TOKEN_USD model); in-memory circular buffer (500 traces); `ObservabilityReport` with per-agent breakdown, p95 latency, and 24 h call counts.
  - **AiGuardrailsService** (`ai-intelligence/guardrails/`) — Synchronous gate before every AI interaction: length limit (1000 chars), prompt injection detection (9 OWASP LLM01 regexes), PII scan (SA ID, credit card, email, phone), content policy, and per-user rate limiting (120 queries/hour with rolling window).
  - **QueryPlannerService + WorkflowOrchestratorService** (`ai-intelligence/orchestrator/`) — DAG-based query planning with explicit `ExecutionPlan`; topological sort (Kahn's algorithm); per-task observability tracing; fallback-delegate pattern (`setFallbackDelegate`) to call `AIIntelligenceService` without circular constructor dependency.
  - **BaseAgent** updated with three new required abstract properties: `description`, `capabilities`, `actions`; **TaskAgent** implements all three.
  - `ai-intelligence.module.ts` rewritten: registers all 10 providers, wires fallback delegate via `OnModuleInit`.
  - `ai-intelligence.controller.ts` gains 4 new endpoints: `POST /assistant/orchestrated`, `GET /agents`, `GET /observability/traces`, `GET /observability/metrics`.
  - **Tests**: 3 new spec files — `agent-memory.service.spec.ts` (13 tests), `ai-guardrails.service.spec.ts` (24 tests), `ai-observability.service.spec.ts` (17 tests); `ai-intelligence.service.spec.ts` updated with mocks for new constructor dependencies. Full suite: **484 tests, 38 suites, 0 failures**. TypeScript compiles clean.

### Changed
- **AI Assistant — natural language understanding (2026-03-08)**
  - Replaced rigid keyword-only fallback (`handleHelp()`) with a **semantic scoring engine** so the assistant reasons about any free-form question and returns the best-matching response, annotating it with *"I interpreted your question as…"* when confidence is moderate so the user can correct it.
  - Added **synonym normalisation** inside the semantic fallback: natural-language words (`clients`, `customers`, `prospects` → leads; `homes`, `houses`, `apartments` → properties; `appointments`, `showings`, `site visits` → viewings; `to-dos`, `action items`, `reminders` → tasks; `revenue`, `earnings`, `forecast` → pipeline value; and more) are expanded before scoring so phrasing freely always hits the right intent.
  - Semantic fallback scores 21 intents by token overlap (multi-word tokens score 3, single words score 1). Scores ≥ 4 return direct results; scores 1–3 prepend an interpretation note; score 0 returns a friendly clarification prompt asking the user to rephrase.
  - 6 new spec tests: synonym normalisation for clients/homes/appointments; semantic fallback for stalled-deals routing; zero-confidence clarification prompt; low-confidence annotation. Total: 423 tests, all passing. tsc clean.

### Added
- **Floating AI Assistant** (2026-03-08)
  - New `FloatingAssistant` component (`apps/web/src/components/FloatingAssistant.tsx`) accessible from **every authenticated page** — no navigation required.
  - Draggable window: grab the header bar to reposition anywhere on screen; touch/mobile drag supported.
  - Voice input via Web Speech API: mic button pulses red when listening, interim transcript displayed in real-time, auto-sends on speech end. Gracefully hidden in unsupported browsers.
  - Minimize/restore: collapse the window to just the title bar, then click to expand.
  - Full response rendering: list, chart, summary-cards, and text responses all rendered inline in the compact window — identical capabilities to the AI Intelligence panel.
  - Page context awareness: automatically detects the current route and sends `pageContext` with every query so the AI assistant knows what the user is looking at.
  - Integrated into `Layout.tsx`: rendered for all `isAuthenticated` sessions.

- **AI Assistant page-context routing** (2026-03-08)
  - New `pageContext?: string` field on `AssistantQueryDto` (max 300 chars, optional).
  - Backend `queryAssistant` service now accepts `pageContext` and routes contextual queries:
    - If on a **lead detail page** and query references "this lead / this contact / their stage / their tasks" etc. → calls new `handleLeadById()` to fetch that lead's full summary + pending tasks directly by UUID.
    - If on a **property detail page** and query references "this property / this listing / this house" etc. → calls new `handlePropertyById()` to fetch property details by UUID.
  - `handleLeadById`: returns lead name, temperature, stage, budget, prequalification, last-contact age, deal value, preferred location, and up to 5 pending tasks.
  - `handlePropertyById`: returns property title, type, price, status, city, bed/bath count, and view count.
  - `AIIntelligencePanel.tsx` AI Assistant tab now also sends page context on every query.
  - `aiIntelligenceApi.query()` in `api-client.ts` updated to accept optional `pageContext` parameter.
  - 3 new spec tests for page-context routing: contextual lead routing, `handleLeadById` with tasks, `handleLeadById` not-found.

### Fixed
- **Viewing notifications not visible to buyers** (2026-03-07)
  - Buyer-facing in-app notifications (`viewing_confirmed`, `viewing_declined`, `viewing_cancelled`, `viewing_rescheduled`, `open_house.cancelled`, `open_house.rescheduled`) were stored with `company_id = NULL`, but buyers log in under their self-system company. Notifications were therefore never returned by the strict `company_id = $companyId` query.
  - Fixed the **write side**: `createInAppNotification` calls for buyer recipients now pass the buyer's self-system company ID (looked up via the new `getBuyerSelfCompanyId()` helper) instead of `null`.
  - Fixed open-house cancel/reschedule registrant notifications, which were incorrectly using the **agent's** `companyId` for buyer recipients.
  - `getNotifications()` query unchanged — strict `company_id = $companyId` equality is correct now that notifications are stored with the right company ID.
  - Added 3 spec tests in `viewing.service.spec.ts` covering the read path for `getNotifications()`.

### Added
- **AI Real Estate Assistant — chat interface in AI Intelligence Panel** (2026-03-07)
  - **Backend** (`ai-intelligence.service.ts`): `queryAssistant(userId, companyId, query)` with keyword intent detection routing to 9 handlers — `find_buyers` (buyer-property matches or scored leads), `write_description` (template copy for most recent listing), `summarize_tasks` (overdue/today lead tasks from `sales.lead_tasks`), `suggest_followups` (leads not contacted in 7+ days, sorted by score), `analyze_pipeline` (lead count by stage as recharts-ready bar chart data), `hot_leads` (top A/B-grade leads), `pricing_check`, `buyer_matches`, `help`. Added `AssistantListItem`, `AssistantChartBar`, `AssistantSummaryCard`, `AssistantResponse` types exported from the service.
  - **Controller** (`ai-intelligence.controller.ts`): `POST /ai-intelligence/assistant` with `AssistantQueryDto` (string, max 500 chars).
  - **Spec** (`ai-intelligence.service.spec.ts`): 11 new tests for `queryAssistant` — ForbiddenException when no company, find_buyers match, find_buyers fallback, write_description with and without listings, summarize_tasks with and without tasks, suggest_followups, analyze_pipeline chart, hot_leads list, unknown query help text. Tests: 390 total, all passing.
  - **api-client.ts**: `AssistantListItem`, `AssistantChartBar`, `AssistantSummaryCard`, `AssistantResponse` types; `aiIntelligenceApi.query(token, query)` POST method.
  - **`AIIntelligencePanel.tsx`**: `AIAssistantTab` component with scrollable message history, 6 suggested prompt chips, inline `AssistantResponseRenderer` handling list (cards with nav links), chart (Recharts `BarChart` + summary cards grid), and text/error response types. Recharts imports added. "✦ Assistant" added as 5th tab — always accessible even before dashboard data loads.

- **AI Assistant — robust intent expansion (35+ intents, Phase 7)** (2026-03-08)
  - **Backend**: `queryAssistant` expanded from 9 to 35+ keyword-routing intents covering every major CRM entity. New handlers: `handleOverdueTasks`, `handleUpcomingTasks`, `handleHighPriorityTasks`, `handleCountTasks`, `handleUncontactedLeads`, `handlePipelineValue` (chart), `handleDealsAtRisk`, `handleConversionStats` (summary + text), `handleLeadsByTemperature` (parameterized: hot/warm/cold/nurture), `handleLeadsByStage` (parameterized: new/contacted/active/under_contract), `handlePrequalifiedLeads`, `handleCountLeads`, `handleMyListings`, `handleCountListings`, `handlePendingViewings`, `handleUpcomingViewings`, `handleCountViewings`, `handleUpcomingOpenHouses`, `handleRecentActivity`, `handleBusinessSummary` (8-card snapshot via 4 parallel queries), `handleEntitySearch` (leads + properties by name — falls back gracefully). Added `extractEntityName(query)` helper for natural name queries ("tell me about X", "find lead X", "who is X"). Added `formatRelativeTime(date)` helper. `summary` responseType now used for count/stat queries.
  - **Frontend** (`AIIntelligencePanel.tsx`): Added dedicated `summary` responseType renderer — 2-column card grid with colour-coded values (`red/orange/green/blue/purple/gray`) plus optional narrative text below.
  - **Spec** (`ai-intelligence.service.spec.ts`): 24 new tests covering every new handler. Tests: 414 total, all passing. tsc clean.

- **AI Intelligence Panel — full-stack agent intelligence engine** (2026-03-07)
  - **`apps/api/src/ai-intelligence/ai-intelligence.service.ts`**: `getDashboard()` queries existing CRM + property data to produce four insight streams — (1) **Lead Scoring** (0–100, grade A/B/C/D): temperature score (hot=40, warm=30, nurture=20, cold=10) + stage score (new=5 → under_contract=45) + recency bonus (+20/+10/+5) + prequalified bonus (+15) + budget defined (+5); (2) **Pricing Insights**: compares active listings against market average of comparables (same city + property_type from other companies), flags overpriced (>15% above) / underpriced (>15% below) / competitive; (3) **Buyer Matching**: matches buyer-type leads against active listings by budget overlap (60pts) + type preference (25pts) + location preference (15pts) + hot-buyer bonus (10pts), returns top 20 matches ≥40pts; (4) **Recommendations**: hot/A-grade leads not contacted in 7+ days, warm/B-grade leads not contacted in 14+ days, under-contract deals silent for 14+ days (urgent), pricing alerts, strong buyer matches (≥70 match score). All logic is deterministic — no external AI calls.
  - **`apps/api/src/ai-intelligence/ai-intelligence.controller.ts`**: single `GET /ai-intelligence/dashboard` endpoint, JWT-guarded, company-scoped.
  - **`apps/api/src/ai-intelligence/ai-intelligence.module.ts`**: module with controller, service, and export.
  - **`apps/api/src/ai-intelligence/ai-intelligence.service.spec.ts`**: 12 unit tests — ForbiddenException guard, full dashboard structure, lead scoring (hot+active=A, cold+new=D, empty DB), pricing insights (overpriced, underpriced, insufficient comparables), buyer matching (budget overlap, far-off budget), recommendations (deal_risk urgent, hot_lead generation) — all passing.
  - **`apps/api/src/app.module.ts`**: `AIIntelligenceModule` registered after `LeadsModule`.
  - **`apps/web/src/lib/api-client.ts`**: added `AIRecommendation`, `LeadScore`, `PricingInsight`, `BuyerMatch`, `AIIntelligenceDashboard` types and `aiIntelligenceApi.getDashboard()`.
  - **`apps/web/src/views/AIIntelligencePanel.tsx`**: standalone panel view with summary cards (urgent actions, total insights, leads scored, avg lead score, listings analysed, buyer matches), section tabs (Recommendations / Lead Scores / Pricing Insights / Buyer Matches), refresh button, loading skeleton, and error display.
  - **`apps/web/src/app/app/ai-intelligence/page.tsx`**: Next.js route exporting `AIIntelligencePanel`.
  - **`apps/web/src/components/AppSidebar.tsx`**: added `Brain` icon import; added `AI Intelligence → /app/ai-intelligence` to `agentNavigation` array (5th item, rendered in the `slice(2)` group after Lead Management).
  - **`apps/web/src/views/AgentDashboardEnhanced.tsx`**: added `"ai"` to tab union type; added 🧠 AI Intelligence tab button (purple highlight) after CRM; added `{selectedTab === "ai" && <AIIntelligencePanel />}` tab content block.
- **Leads Module — full backend API and multi-tenant DB schema** (2026-03-07)
  - **Migration `202603070019_leads_module`**: three tables in `sales` schema — `sales.leads` (buyer/seller/renter/investor leads with hot/warm/cold/nurture temperature, 7-stage pipeline, budget range, prequalification flag, deal value, next follow-up); `sales.lead_activities` (append-only audit log via trigger — email/call/sms/meeting/note/stage_change); `sales.lead_tasks` (call/email/meeting/follow_up tasks with high/medium/low priority and completion tracking). Composite indexes on `(company_id, stage)` and `(company_id, created_at DESC)`.
  - **`apps/api/src/leads/leads.dto.ts`**: exported constants (`LEAD_TYPES`, `LEAD_TEMPERATURES`, `LEAD_STAGES`, `TASK_TYPES`, `TASK_PRIORITIES`, `ACTIVITY_TYPES`) and six DTOs: `CreateLeadDto`, `UpdateLeadDto` (+ lostReason), `ListLeadsQueryDto` (search/type/temperature/stage/assignedTo/limit/offset), `CreateLeadActivityDto`, `CreateLeadTaskDto`, `UpdateLeadTaskDto`.
  - **`apps/api/src/leads/leads.service.ts`**: full CRUD + analytics using raw SQL (`$queryRaw` / `$queryRawUnsafe`). `list()` — dynamic WHERE with ILIKE search; `create()` — INSERT + auto-logs 'note' activity; `update()` — dynamic SET, stage change auto-logs `stage_change` activity with `{from_stage, to_stage}` metadata; `getDashboard()` — 5 parallel queries (KPIs, tasks, recent activities, byType, byTemperature); `getPipeline()` — groups non-closed leads by `LEAD_STAGES` order; `getAnalytics()` — 5 parallel GROUP BY queries (summary, bySource, byType, funnel, monthly trend).
  - **`apps/api/src/leads/lead-activity.service.ts`**: `list()` joins `actor_name`; `create()` inserts activity and updates `last_contact_at` on parent lead.
  - **`apps/api/src/leads/lead-task.service.ts`**: `list()` sorted by completed ASC + due_date + priority; `update()` sets/clears `completed_at`/`completed_by` when toggling completion.
  - **`apps/api/src/leads/leads.controller.ts`**: 13 endpoints under `@Controller('leads')` — static routes `/dashboard`, `/pipeline`, `/analytics` registered before parameterised `:id` to avoid NestJS route shadowing; write endpoints guarded with `@Roles('agent', 'admin')`.
  - **`apps/api/src/leads/leads.module.ts`**: registers all three services and the controller.
  - **`apps/api/src/leads/leads.service.spec.ts`**: 16 unit tests (list ×3, create ×2, getById ×3, update ×3, remove ×2, getDashboard ×2) — all passing.
  - **`apps/api/src/app.module.ts`**: `LeadsModule` registered after `SalesModule`.
  - **`apps/web/src/lib/api-client.ts`**: replaced old `crmApi` stub with `leadsApi` (13 methods); replaced `LeadRecord` → `LeadRow`, `LeadActivityRecord` → `LeadActivityRow`, `CrmDashboardResponse` → `LeadDashboardResponse`, `CreateLeadPayload` (old field names) → new schema-aligned fields (`name`, `type`, `email`, `phone`, `source`, …). Added `LeadTaskRow`, `LeadPipelineStage`, `LeadPipelineResponse`, `LeadAnalyticsResponse`, `ListLeadsQuery`, `CreateLeadActivityPayload`, `CreateLeadTaskPayload`, `UpdateLeadTaskPayload`.
  - **`apps/web/src/views/AgentDashboardEnhanced.tsx`**: updated all state types and API calls to use `leadsApi` and the new type names; field name references updated (`contact_name` → `name`, `status` → `stage`, etc.); dashboard KPI cards show `hotLeads`, `activeDeals`, `recentActivities.length`; status breakdown now renders `byTemperature` entries.
- **Lead Management — all 5 views wired to live API** (2026-03-07)
  - **`apps/web/src/views/LeadDashboard.tsx`**: replaced `mockLeads` with `leadsApi.getDashboard(token)` — loading spinner, error state, KPI cards from `{ totalLeads, hotLeads, activeDeals, pipelineValue }`, pending tasks from `LeadTaskRow[]`, recent activities from `LeadActivityRow[]`, distribution grids from `byType` / `byTemperature`.
  - **`apps/web/src/views/LeadsPage.tsx`**: replaced mock with `leadsApi.list(token, filters)` — 350 ms debounced search, server-side type/temperature/stage filters, pagination; Add Lead modal wired to `leadsApi.create()` with toast-style success reset; field names updated to `LeadRow` (`name`, `budget_min`/`budget_max` as numeric strings, etc.).
  - **`apps/web/src/views/LeadPipeline.tsx`**: replaced mock with `leadsApi.getPipeline(token)` — stage summary bar reads `s.count` / `s.totalValue`; kanban columns resolved via `stageMap.get(stage.id)?.leads`; `LeadKanbanCard` uses `LeadRow` field names; `under-contract` stage key corrected to `under_contract`.
  - **`apps/web/src/views/LeadAnalytics.tsx`**: replaced module-level `mockLeads` derivations with `leadsApi.getAnalytics(token)` — `bySource` / `byType` transformed to recharts `{name, value}[]`; `funnel` / `monthlyTrend` / `sourcePerformance` consumed directly; currency formatting updated from USD to ZAR (`R`).
  - **`apps/web/src/views/LeadDetail.tsx`**: replaced mock lookups with three parallel API calls — `leadsApi.getById`, `leadsApi.listActivities`, `leadsApi.listTasks`; activities sorted by `created_at` DESC; field names updated (`assigned_agent_name`, `last_contact_at`, `next_follow_up`, `deal_value`, `created_at`); tasks use `task.completed` (boolean) and `task.due_date`; activity feed uses `actor_name` / `created_at`; `under-contract` stage key corrected to `under_contract` throughout.
- **Lead Management screens — all 5 pages ported from sample UI** (2026-03-07)
  - **`apps/web/src/lib/lead-mock-data.ts`**: shared types (`Lead`, `LeadTask`, `LeadActivity`) and mock data (10 leads, 5 tasks, 5 activities) used by all lead views until the backend API is wired in.
  - **`apps/web/src/views/LeadDashboard.tsx`**: dashboard page with 4 KPI cards (total leads, hot leads, active deals, pipeline value), "Today's Tasks" list, "Recent Activity" feed, lead distribution grid (by type and temperature).
  - **`apps/web/src/views/LeadsPage.tsx`**: searchable/filterable leads table with text search, type/temperature dropdowns, stage pill filters, and per-row call/email/view actions.
  - **`apps/web/src/views/LeadPipeline.tsx`**: Kanban board with 6 stage columns (New → Closed), stage summary stats bar, colour-coded lead cards with temperature dot, prequalification badge, next follow-up date, and click-through to lead detail.
  - **`apps/web/src/views/LeadAnalytics.tsx`**: analytics page with 4 KPI cards, recharts PieChart (source distribution), BarChart (type distribution), horizontal BarChart (pipeline funnel), LineChart (monthly trend), and source performance table with inline conversion progress bars.
  - **`apps/web/src/views/LeadDetail.tsx`**: individual lead page with back navigation, lead header (name, temp/stage/prequalified badges, contact links), Edit/Delete buttons, two-column layout (lead details grid, preferences, notes, activity timeline | quick actions, tasks, stage progress tracker).
  - **Route pages**: thin re-export wrappers at `app/app/leads/page.tsx`, `app/app/leads/dashboard/page.tsx`, `app/app/leads/pipeline/page.tsx`, `app/app/leads/analytics/page.tsx`, and `app/app/leads/[id]/page.tsx` — all hooked to the existing Lead Management sub-group in `AppSidebar.tsx`.
  - All pages styled to match the listings page look and feel: `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `hover:bg-accent`, `rounded-2xl` cards, `font-semibold` headers. react-router replaced with Next.js `next/link` and `next/navigation`.
- **Sidebar — Agent Cockpit collapsible group for agent role** (2026-03-07)
  - `AppSidebar.tsx`: when the active role is `agent`, the four nav items (Agent Dashboard, Listings, Safety, Analytics) are now nested inside a collapsible **Agent Cockpit** section headed by a `Gauge` icon. The group defaults to open and toggles via `showAgentCockpit` state. Implemented identically on both the desktop sidebar and the mobile drawer, following the same pattern as the existing "Company Administration" group.
  - **Lead Management sub-group** added inside Agent Cockpit, positioned between Listings and Safety. Contains four sub-items: Lead Dashboard (`/app/leads/dashboard`), Leads (`/app/leads`), Pipeline (`/app/leads/pipeline`), Analytics (`/app/leads/analytics`). Collapsible via `showLeadManagement` state (defaults open), using `Target` icon as header and slightly smaller item sizing (`text-xs`, `w-3.5`) to visually distinguish the second nesting level. `leadManagementNavigation` constant added; `Target` and `Kanban` icons added to lucide-react imports.
- **Property Valuation — AI Estimate and Valuation History Display** (2026-03-07)
  - **`valuation.service.ts`**: new `getAiEstimate()` method — Automated Valuation Model (AVM) using comparable sales. Fetches subject property's `area_sqm`, `bedrooms`, `property_type` from `property.properties`; retrieves comparable sales within 5 km; uses price-per-m² calculation when area is available for both subject and comparables, otherwise falls back to median sale price. Confidence band (`high`/`medium`/`low`) derived from coefficient of variation across comparable prices. Falls back to asking price ±15% when no comparables exist. Module-level `median()` helper added.
  - **`valuation.controller.ts`**: `GET /api/v1/properties/:id/ai-estimate` added to `ValuationController` (agent/admin/valuer/buyer_seller).
  - **`api-client.ts`**: `AiValuationEstimate` type added; `ComparableSale` type corrected to match actual `property.comparable_sales` schema (`address`, `sale_price`, `sale_date`, `floor_area_sqm`, etc.); `propertiesApi.getAiEstimate()` method added.
  - **`PropertyDetailEnhanced.tsx`**: Property Valuation sidebar card now displays: (1) AI Estimate panel (blue, with confidence badge, estimated value, low–high range, methodology, comparable count); (2) Valuation History list (type badge, date, value, range, purpose); (3) "Request Valuation" button. Comparable Sales card fixed to use correct field names (`cs.address`, `cs.sale_price`, `cs.sale_date`, `cs.floor_area_sqm`).
  - **`valuation.service.spec.ts`**: 4 new tests for `getAiEstimate` — price-per-m² method, median fallback, asking-price fallback (no comparables), NotFoundException.
- **Open House Cancel & Reschedule with attendee email notifications** (2026-03-07)
  - **Migration `202603060018_open_house_lifecycle`**: adds `cancel_reason TEXT`, `rescheduled_at TIMESTAMPTZ`, and `rescheduled_reason TEXT` columns to `property.open_houses`.
  - **`mandate.dto.ts`**: new `CancelOpenHouseDto` (`reason: string @MinLength(5)`) and `RescheduleOpenHouseDto` (`scheduledAt`, `endAt`, optional `reason`).
  - **`viewing.service.ts`**: `OpenHouseRecord` type extended with the three new columns; new `cancelOpenHouse()` method — verifies ownership, flips status to 'cancelled', fetches all registrations and sends an email + in-app notification to each registered attendee; new `rescheduleOpenHouse()` method — verifies ownership, updates scheduled/end times and rescheduled metadata, notifies all registered attendees with the new date/time.
  - **`viewing.controller.ts`**: `PATCH /api/v1/open-houses/:id/cancel` and `PATCH /api/v1/open-houses/:id/reschedule` added to `OpenHouseController` (agent/admin only).
  - **`api-client.ts`**: `CancelOpenHousePayload` and `RescheduleOpenHousePayload` types exported; `OpenHouseRecord` type extended with `cancel_reason`, `rescheduled_at`, `rescheduled_reason`; `agentApi.cancelOpenHouse()` and `agentApi.rescheduleOpenHouse()` added.
  - **`PropertyDetailEnhanced.tsx`**: Cancel and Reschedule buttons appear on `scheduled` open house cards in the owner's Open Houses tab; confirmation modals with reason fields; cancelled/rescheduled metadata displayed inline on each card; `handleCancelOpenHouse()` and `handleRescheduleOpenHouse()` handlers update local state on success.
  - **`viewing.service.spec.ts`**: 8 new tests — `cancelOpenHouse` (happy path, not-found, forbidden, already-cancelled) and `rescheduleOpenHouse` (happy path, not-found, forbidden, already-cancelled); 344 tests now pass.

### Fixed
- **Listing Intelligence Panel — Views stat definitively fixed with dedicated view_count column** (2026-03-06, v3)
  - Root cause of all previous attempts failing: `property.audit_logs` stores `actor_id = NULL` for every view because (a) all historical rows were written before auth tokens were forwarded, and (b) Next.js SSR renders `GET /properties/:id` without auth on every page load — so even after fixing the frontend, one anonymous audit-log row was still written per visit.
  - **Migration `202603060017_property_view_count`**: adds `view_count INTEGER NOT NULL DEFAULT 0` to `property.properties`. This column starts at 0 for all listings (clean slate).
  - **`property.service.ts` `findById()`**: now performs `UPDATE property.properties SET view_count = view_count + 1` only when (a) `actorId` is present (authenticated call — SSR anonymous calls are skipped) AND (b) `actorId` does not match `agent_id` or `owner_id` (owner/agent visits are skipped).
  - **`property.service.ts` `getPropertyStats()`**: reads `p.view_count::text` directly instead of counting `property.audit_logs` rows — no more audit-log pollution.
  - **`PropertyRecord` type**: added `view_count: number` field.
  - **`property.service.spec.ts`**: 4 regression tests — non-owner authenticated visit increments counter + logs audit; agent-owner visit skips both; property-owner visit skips both; SSR unauthenticated call (no actorId) skips counter increment.
- **Listing Intelligence Panel — Views stat now correctly excludes the listing creator's own visits** (2026-03-06, revised)
  - Root cause identified: `propertiesApi.getById()` in the frontend never forwarded the user's JWT, so every view was written to `property.audit_logs` with `actor_id = NULL`. Because `NULL IS DISTINCT FROM uuid` is always `TRUE`, the earlier SQL filter had no effect.
  - `property.service.ts` `findById()`: now checks whether `viewContext.actorId` matches the property's `agent_id` or `owner_id`. If it does, the `property.viewed` audit-log entry is skipped entirely, so owner/agent page-loads are never stored in the first place.
  - `api-client.ts` `propertiesApi.getById()`: now accepts an optional `authToken` parameter so authenticated visits carry the caller's identity.
  - `PropertyDetailEnhanced.tsx`: passes the current access token to `propertiesApi.getById()` so the creator's `actor_id` is sent to the API on every client-side property fetch, activating the owner-exclusion guard in the service.
  - `property.service.spec.ts`: added 3 regression tests — non-owner visit logs `property.viewed`; agent-owner visit does **not** log; property-owner visit does **not** log.
- **Listing Intelligence Panel — Views stat excludes the listing creator's own visits** (2026-03-06)
  - `property.service.ts` `getPropertyStats()`: the views subquery now adds `AND actor_id IS DISTINCT FROM ${userId}::uuid` so page-views generated by the agent/owner themselves are not counted in the Views card on the Listing Intelligence Panel. Uses `IS DISTINCT FROM` to correctly handle `NULL` actor IDs.

### Added
- **Listing Intelligence Panel — Complete, Reschedule, Cancel modals on Scheduled Viewings tab** (2026-03-06)
  - `PropertyDetailEnhanced.tsx`: the Scheduled Viewings tab now mirrors the full set of action buttons available on the Agent Dashboard viewings tab, while retaining the property detail page's own theming.
  - `requested` viewings: **Confirm** + **Decline** (existing modal) + new **Cancel** button (opens Cancel modal).
  - `confirmed` viewings: new **Complete** button (calls `PATCH /viewings/:id/complete`, updates status locally), new **Reschedule** button (opens Reschedule modal), and **Cancel** button (opens Cancel modal) — replaces the previous inline text-input cancel flow.
  - **Cancel Viewing Modal**: orange-themed, requires a cancellation reason ≥5 chars, shows `AlertCircle` error banner, `Loader2` spinner on submit, calls `viewingsApi.cancel()`.
  - **Reschedule Viewing Modal**: blue-themed, requires a new datetime, optional reason textarea, `Loader2` spinner on submit, calls `viewingsApi.reschedule()` and updates `scheduled_at` / `rescheduled_at` locally.
  - New state vars: `completingViewingId`, `showCancelViewingModal`, `cancellingViewingId`, `cancelViewingReason`, `isCancellingViewing`, `cancelViewingError`, `showRescheduleViewingModal`, `reschedulingViewingId`, `rescheduleViewingForm`, `isReschedulingViewing`, `rescheduleViewingError`.
  - New handlers: `handleCompleteViewing(viewingId)`, `handleCancelViewing()` (modal-based, replaces inline version), `handleRescheduleViewing()`.
  - `api-client.ts`: added `RescheduleViewingPayload` to the import in `PropertyDetailEnhanced.tsx`.


  - Listing owners can now manage their property directly from the Listing Intelligence Panel in `PropertyDetailEnhanced.tsx`.
  - **Viewings tab**: each viewing card now shows action buttons gated by status: `requested` → **Confirm** (calls `PATCH /viewings/:id/confirm`) + **Decline** button opens a full modal (reason ≥10 chars, optional alternative dates with add/remove, optional message to buyer) matching the agent dashboard pattern; `confirmed` → **Cancel Viewing** with inline reason input (calls `PATCH /viewings/:id/cancel`). All actions update the local state immediately without a full page reload.
  - **Enquiries tab**: each enquiry with `status === 'new'` shows a **Reply** button that expands an inline textarea; submitting calls `PATCH /api/v1/inquiries/:id/respond` and updates the card with the response text and `responded` status.
  - **Open Houses tab**: a **Schedule Open House** button at the top of the tab expands an inline form with start/end datetime, max attendees, and description; submitting calls `POST /properties/:id/open-houses` and prepends the new record to the list.
  - `api-client.ts`: added `inquiriesApi.respond(authToken, inquiryId, { response })` calling `PATCH /inquiries/:id/respond`; added `agentApi` and `inquiriesApi` to imports in `PropertyDetailEnhanced.tsx`.

### Changed
- **Navbar — removed Create Listing button, notification bell on all pages** (2026-03-06)
  - `Layout.tsx`: removed the "Create Listing" button (desktop `<Button>` and mobile `<button>` variants) from the shared top navbar across all authenticated pages.
  - `Layout.tsx`: added the notification bell (with unread badge) to the simplified toolbar branch (`!shouldShowToolbar`, i.e. property detail pages) so it is now present on every authenticated page.
  - Cleaned up unused `Button`, `Plus`, `CreateListing` imports; removed `showCreateModal` state and the `<CreateListing>` modal render; removed now-unused `isProfileDashboardRoute`, `isRoleSetupRoute`, `isCompanyRoute` constants. TypeScript clean build confirmed.

### Fixed
- **Open house registration — Register Attendance button disabled for listing creators** (2026-03-06)
  - `PropertyDetailEnhanced.tsx`: the "Register Attendance" button is now `disabled` (with muted purple styling and a `title` tooltip "You cannot register for your own listing") when `isOwnListing` is true (i.e. `currentUser.id === property.agent.id`).
  - Reverted the previous backend `ForbiddenException` approach — no server-side guard needed; the check is a UI affordance.

### Added
- **Listing Intelligence Panel on property detail page** (2026-03-06)
  - Listing creators (agents) now see a full management dashboard at the top of `PropertyDetailEnhanced.tsx`, conditionally rendered when `currentUser.id === property.agent.id`.
  - **Stat cards**: Views, Saves, Enquiries, combined Viewings count (with breakdown annotations for pending/confirmed/done), and Days Listed — sourced from `GET /properties/:id/stats`.
  - **Viewings tab**: chronological list of all viewers with buyer name, email, scheduled date/time, viewing type, duration, status badge, buyer feedback, and cancel reason.
  - **Enquiries tab**: all incoming enquiries with type badge (viewing/offer/question), requester contact, message snippet, response (if any), and status badge (new/responded).
  - **Open Houses tab**: all scheduled open houses from existing `propertyOpenHouses` state with date range, attendee cap, and status badge.
  - Backend: `getPropertyStats(userId, propertyId)` and `getPropertyViewingsList(userId, propertyId)` added to `property.service.ts`; `GET /properties/:id/stats` and `GET /properties/:id/viewings` endpoints added to `PropertyController` (placed before the generic `GET :id` route to avoid conflicts).
  - API client: `PropertyStats`, `ListingViewingRecord`, `PropertyInquiryRecord` types; `getPropertyStats`, `getPropertyViewings`, `getPropertyInquiries` methods added to `propertiesApi` in `api-client.ts`.

### Fixed
- **Viewing notifications — company scope bug** (2026-03-06)
  - Agent notifications for viewing events (request, buyer-cancel) were being stored with the *buyer's* `active_company_id` (from JWT) instead of the *property's* `company_id`. This meant that when a buyer booked a viewing while signed in under "Self" (null company), the agent's notification was stored with `company_id = null` and therefore invisible when the agent logged in as their company.
  - `viewing.service.ts` `request()` — the initial `SELECT` of `property.properties` now also fetches `company_id`; the new `propertyCompanyId` value is passed to `createInAppNotification` for the agent notification instead of the caller's `companyId`.
  - `viewing.service.ts` `cancel()` (buyer-cancels branch) — added `getPropertyInfo(viewing.property_id)` lookup so the agent notification is tagged with the property's `company_id`.
  - `viewing.service.ts` `confirm()` — buyer confirmation notification now passes `null` as `companyId`; buyer notifications are never company-scoped.
  - Added private `getPropertyInfo(propertyId)` helper that returns `{ title, company_id }` (extending the existing `getPropertyTitle` helper).

- **Notification center — hardwired mock data replaced with live API** (2026-03-06)
  - `NotificationCenter.tsx` previously rendered 6 static mock notifications that never changed. Completely rewritten to call `notificationsApi.getAll(token)` on mount, show a loading spinner, an empty state, and real notifications with relative timestamps and mark-as-read / mark-all-read actions.
  - `Layout.tsx` bell badge now driven by real unread count fetched from the notifications API; badge is hidden when there are zero unread notifications.

- **Notification center — company-scoped notification filtering** (2026-03-06)
  - Users now see only notifications relevant to their currently active company. Added `company_id UUID NULL` column (FK → `identity.companies`) to `identity.user_notifications` via migration `202603060016_notifications_company_context`; new compound index on `(user_id, company_id, read_at, created_at)` replaces the old single-column unread index.
  - `viewing.service.ts` — `createInAppNotification` stores `company_id`; `getNotifications(userId, companyId?)` filters rows where `company_id = ?` (when an active company exists) or `company_id IS NULL` (for individual/no-company context).
  - `viewing.controller.ts` — `GET /notifications` passes `req.user.active_company_id` to `getNotifications()`.

- **PropertyComparison — pre-existing TypeScript errors** (2026-03-06)
  - Removed unused `useMemo` import and unused `isWinner` helper function; removed duplicate `import { Card }` statement appended at end-of-file.
  - Added `q?: string` text-search parameter to `SearchPropertiesDto` and `property.service.ts` (ILIKE filter on title/description); added matching `q?: string` to `PropertySearchParams` in `api-client.ts`; updated the add-to-comparison search call from the non-existent `search` key to `q`.

- **Agent dashboard — 500 on `/agent/dashboard/summary` and `/agent/commission-pipeline`** (2026-03-06)
  - `property.service.ts` `getAgentDashboardSummary` and `getAgentCommissionPipeline` both contained SQL JOINs against a `sales.transaction_stages` table that does not exist in the database schema.
  - The correct tables are `sales.property_sales` (which tracks active sale transactions with `property_id`, `current_stage` SMALLINT, `country`, `status`) and `sales.stage_configs` (which maps stage numbers to names per country, seeded with 14 ZA stages).
  - Fix: replaced `JOIN sales.transaction_stages ts … AND ts.status = 'in_progress'` with `JOIN sales.property_sales ps … AND ps.status = 'active' JOIN sales.stage_configs sc ON sc.stage_number = ps.current_stage AND sc.country = ps.country` in both methods; `ts.stage_name` references updated to `sc.stage_name`. Commission pipeline uses LEFT JOINs so properties without an active sale are still returned.
- **Viewing schedule — Internal Server Error (`full_name` column does not exist)** (2026-03-06)
  - `viewing.service.ts` `getUserContact` queried `SELECT email, full_name FROM identity.users` but the table has `first_name` / `last_name` columns — PostgreSQL threw `column "full_name" does not exist` → unhandled exception → 500 on every buyer viewing request.
  - Fix: changed query to `SELECT email, CONCAT(first_name, ' ', last_name) AS full_name`.
  - `viewing.service.spec.ts`: added missing `NotificationService` mock provider (Nest DI failed to compile test module), updated `baseViewing` fixture (`status: 'requested'`, `viewing_type: 'physical'`), and added the three extra `$queryRaw` mock returns (`getUserContact`, `getPropertyTitle`, `createInAppNotification`) required by the notification flow in the `request` and `confirm` happy-path tests. All 11 tests now pass.
- **Viewing schedule — Internal Server Error (audit log `event_id` NOT NULL)** (2026-03-06)
  - `audit.service.ts`: `AuditLogParams.eventId` was typed as required (`string`) but every call site across `viewing.service.ts`, `property.service.ts`, and other services omitted it. `undefined` in the Prisma raw template was passed as SQL `NULL`, violating the `event_id NOT NULL` constraint → unhandled Prisma exception → 500.
  - Fix: made `eventId` optional (`eventId?: string`) and added `const eventId = entry.eventId ?? randomUUID()` in `AuditService.log()` — a UUID is auto-generated for call sites that don't supply a correlation ID.
  - The earlier TS compile appeared clean only because `tsc 2>&1 | head -20` truncated errors and `head` exits 0 regardless; running `tsc --noEmit` without pipe truncation confirms 0 errors after this fix.

- **Buyer viewing schedule — validation errors** (2026-03-07)
  - `PropertyDetailEnhanced.tsx`: `handleConfirmViewing` was sending `viewingType: 'in_person'` — renamed to `'physical'` to match the backend `CreateViewingDto` enum (`physical | virtual | open_house`).
  - `api-client.ts`: `CreateViewingPayload.viewingType` type updated from `'in_person' | 'virtual'` → `'physical' | 'virtual' | 'open_house'` to match backend DTO.
  - `mandate.dto.ts`: added `@IsOptional() @IsString() notes?: string` to `CreateViewingDto` — the buyer scheduling form intentionally packs contact details (name, email, phone, special requests) into the `notes` field; the backend's whitelist validation (`forbidNonWhitelisted`) was rejecting the un-declared property with "property notes should not exist".

- **Non-admin company member blocked on login** (2026-03-07)
  - `CompanyContextSelect.tsx`: non-admin members of a real company are now routed to `/app/my-dashboard`; only company admins (`is_admin === true`) are routed to `/company/dashboard`.  Previously all non-self company users were sent to `/company/dashboard` regardless of role, causing a 403 "Company admin access required" from the admin-guarded dashboard API endpoint.
  - `CompanyDashboard.tsx`: added `!activeCompany.is_admin` check in the guard block so any non-admin who navigates directly to `/company/dashboard` is immediately redirected to `/app/my-dashboard`.

- **My Dashboard shown to agents under a company context** (2026-03-06)
  - When a user with the `agent` role selected a real company (non-self), they were routed to `/app/my-dashboard` — the personal dashboard — instead of the Agent Dashboard.
  - `CompanyContextSelect.tsx`: routing now checks `selectedCompany.role`. Agents are sent to `/app/agent`; admins to `/company/dashboard`; everyone else to `/app/my-dashboard`.
  - `MyDashboard.tsx`: added an agent guard alongside the existing admin guard — if the active company is a real (non-self) company and the user's role is `agent`, the page immediately redirects to `/app/agent`. Prevents direct-URL access to the personal dashboard for company agents.

- **Agent dashboard — "Unable to load agent listings" error** (2026-03-06)
  - `RolesGuard` only checked `request.user.roles` (global identity roles), ignoring `active_company_role` from the JWT. A user acting as an agent under a company has `active_company_role: 'agent'` but no global `'agent'` role, so every `@Roles('agent', 'admin')` endpoint rejected them with 403 — `GET /agent/dashboard` failed, `Promise.all` rejected, and the dashboard showed the error.
  - Fix: `roles.guard.ts` now merges `active_company_role` into the effective roles array before checking. A user with `active_company_role: 'agent'` can now access any endpoint decorated with `@Roles('agent', ...)`.
  - Added 3 tests in `roles.guard.spec.ts` covering: active company role grants access, mismatched company role is denied, and `null` company role falls back to global roles.

- **My Listings leaking cross-company listings** (2026-03-07)
  - `property.service.ts` — `getOwnerListings()` now accepts an optional `companyId` parameter and adds `AND p.company_id = $N::uuid` to the WHERE clause when supplied. Previously only `owner_id / agent_id` was checked, so all listings the user ever created across all companies were returned regardless of active context.
  - `buyer.controller.ts` — `GET /properties/my-listings` now passes `req.user.active_company_id` (from the JWT) to `getOwnerListings()` so only listings belonging to the currently active company are returned.

- **My Properties — "Unable to load your properties" error** (2026-03-07)
  - `seller-dashboard.service.ts` — `getSellerProperties()` was referencing `pl.suburb` which does not exist on `property.property_locations`; corrected to `pl.region AS suburb`. The column was named `region` in the migration but the query used the old alias.

### Added
- **Viewing Lifecycle — Decline, Cancel, Reschedule & Notifications** (2026-03-07)
  - **Database migration** `202603060015_viewing_lifecycle_notifications`:
    - `property.viewings`: added `cancel_reason`, `cancelled_by`, `rescheduled_at`, `rescheduled_reason`, `declined_at` columns; `'declined'` added to status CHECK constraint.
    - New `identity.user_notifications` table for in-app notification inbox.
  - **Backend** (`apps/api/src/property/`):
    - `mandate.dto.ts`: three new DTOs — `AgentDeclineViewingDto` (reason ≥10 chars, optional alternative dates array, optional message), `CancelViewingDto` (reason ≥5 chars), `RescheduleViewingDto` (scheduledAt, optional duration/virtualLink/reason).
    - `viewing.service.ts`: new methods — `decline()`, `cancel()`, `reschedule()`, `getBuyerViewings()`, `getNotifications()`, `markNotificationRead()`, `markAllNotificationsRead()`; `request()` and `confirm()` now trigger email + in-app notification; private helpers `getUserContact()`, `getPropertyTitle()`, `createInAppNotification()`.
    - `viewing.controller.ts`: new endpoints — `PATCH /viewings/:id/decline` (agent/admin), `PATCH /viewings/:id/cancel` (all roles), `PATCH /viewings/:id/reschedule` (agent/admin), `GET /buyer/viewings`, `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read`; split into `BuyerViewingController` and `NotificationsController` controllers.
    - `property.module.ts`: registered `BuyerViewingController`, `NotificationsController`, `NotificationService`.
    - `identity.module.ts`: `NotificationService` added to `exports`.
  - **Frontend** (`apps/web/`):
    - `api-client.ts`: updated `ViewingResponse` type with lifecycle fields; new types `AgentDeclineViewingPayload`, `CancelViewingPayload`, `RescheduleViewingPayload`, `UserNotification`; `viewingsApi` extended with `confirm`, `decline`, `cancel`, `reschedule`, `getMyViewings`; new `notificationsApi` with `getAll`, `markRead`, `markAllRead`.
    - `AgentDashboardEnhanced.tsx`:
      - **Accept / Decline** buttons on `'requested'` viewings; **Complete / Reschedule / Cancel** on `'confirmed'` viewings.
      - **Decline modal** — reason field (≥10 chars), optional alternative date-time picker (add/remove list), optional message to buyer.
      - **Cancel modal** (agent) — reason field (≥5 chars), notifies buyer by email.
      - **Reschedule modal** — new date/time picker, optional reason, notifies buyer with old vs new time.
      - **Notification bell** in header — red badge with unread count, dropdown showing last 20 notifications; marks all read on open; uses `notificationsApi`.
    - `MyDashboard.tsx`:
      - New **My Viewings** tab — lists all buyer viewings with status badges, cancel reason display, and a "Cancel this viewing" link (opens cancel modal).
      - **Cancel Viewing modal** (buyer) — reason field; calls `viewingsApi.cancel()`.
      - **Notification bell** in header — same pattern as agent dashboard.

- **Agent Schedule Viewing — manual booking on behalf of buyer** (2026-03-06)
  - Backend (`apps/api/src/property/`):
    - `mandate.dto.ts`: new `AgentBookViewingDto` — `viewingType` ('physical'|'virtual'), `scheduledAt`, optional `durationMinutes`/`virtualLink`, required `buyerContactName`, optional `buyerContactEmail`/`buyerContactPhone`/`notes`.
    - `viewing.service.ts`: new `bookForBuyer()` method — verified property lookup, buyer contact stored as JSON in `agent_notes` with `bookedByAgent: true` flag, `buyer_id` set to `agentId` as proxy (no user account needed), status auto-set to `'confirmed'`, audit log `'viewing.agent_booked'`.
    - `viewing.controller.ts`: new `POST /properties/:id/viewings/agent-book` endpoint, `Roles('agent', 'admin')` — separate from the existing buyer-only `POST /properties/:id/viewings`.
  - Frontend (`apps/web/`):
    - `api-client.ts`: `AgentBookViewingPayload` type; `viewingsApi.bookForBuyer()` calling the new endpoint.
    - `AgentDashboardEnhanced.tsx` — **Schedule Viewing** button added to the Viewings tab header; **Schedule Viewing modal** (full-screen overlay):
      - Listing selector, date/time picker, viewing type (In-Person / Virtual), duration input.
      - Buyer contact section: full name (required), email, phone.
      - Notes textarea.
      - Submit disabled until property, date, and buyer name are filled; spinner while in-flight; error banner on failure.
    - Viewing cards updated: when `agent_notes` contains `bookedByAgent: true`, the card shows the buyer's name (and phone/email for upcoming viewings) instead of the generic "Buyer Viewing" label.

- **Listing Syndication Engine — frontend UI** (2026-03-06)
  - `api-client.ts`: added `SyndicationRecord` type and `syndicationApi` with three methods:
    - `syndicate(token, propertyId)` → `POST /properties/:id/syndicate` (push to all active portals)
    - `getStatus(token, propertyId)` → `GET /properties/:id/syndication-status` (fetch per-portal records)
    - `pause(token, propertyId, portalId)` → `PATCH /properties/:id/syndicate/:portalId/pause`
  - `AgentDashboardEnhanced.tsx` — **Syndicate** button added to each row in the Listings tab (alongside View / Edit / Duplicate).
  - **Syndication modal** (full-screen overlay, triggered per listing):
    - Shows property title and total portal count in the header.
    - **"Sync to All Portals"** button calls `POST /properties/:id/syndicate`; results immediately reflected in the list below.
    - Per-portal rows: portal name, colour-coded status badge (`pending` yellow / `synced` green / `paused` blue / `failed` red), last-synced timestamp, external listing link (when available), and a **Pause** button for active/pending portals.
    - Loading spinner while the initial status fetch is in flight; inline error banner on failure.

### Fixed

- **AgentDashboardEnhanced + PropertyDetailEnhanced — compile & API errors** (2026-03-06)
  - `PropertyDetailEnhanced.tsx`: recovered missing `const handleAddToFavourites = async () => {` function declaration that was accidentally dropped in a prior session, causing "await isn't allowed in non-async function" and "Return statement is not allowed here" compile errors.
  - `PropertyDetailEnhanced.tsx`: `registerForOpenHouse` was called on `agentApi` (which has no such method); corrected to `viewingActionsApi.registerForOpenHouse`. `viewingActionsApi` added to the import; unused `agentApi` import removed.

### Changed
- **AgentDashboardEnhanced — expanded metrics, new Mandates tab, Edit wired** (2026-03-06)
  - **Overview tab**: added *Listing Status Breakdown* grid (active / draft / under_offer / sold / withdrawn / back_to_market counts sourced from `byStatus` in `AgentDashboardResponse`) and *Verification Summary* grid (verified / unverified counts from `verificationSummary`).
  - **Analytics tab**: replaced static `—` placeholders with real `byStatus.under_offer` and `byStatus.sold` values; added *Portfolio by Status* horizontal bar chart with percentage bars; added *Verification Breakdown* grid.
  - **Listings tab**: *Edit* button now opens the `EditListing` modal (previously inert); `EditListing` component imported and wired at the bottom of the view.
  - **Mandates tab** (new): status summary grid (pending_signature / active / expired / cancelled counts) plus a full mandate table showing property link, mandate type, commission %, start/end period, seller & agent signature status, and status badge. Data loaded lazily on tab focus via `agentApi.getMandates()`.
  - **CRM tab** (new): full lead pipeline UI wired to the Agent CRM backend (`src/identity/agent-crm/`):
    - Summary cards: total leads, qualified count, at-offer count, activities this week (sourced from `GET /agent/dashboard`).
    - Status breakdown pill row showing per-status counts.
    - Status filter bar (All + every `LEAD_STATUS`) with page reset on change.
    - Paginated leads table (20/page) — contact name/email/phone, source, status badge, notes preview, last-updated date; pagination controls shown when total > 20.
    - *New Lead* modal — contact name, email, phone, source, assign-to-listing select, notes; calls `POST /agent/leads`.
    - *Lead Detail* right-side drawer — full contact info, status transition buttons (calls `PATCH /agent/leads/:id/status`); *Log Activity* form (type selector + notes, calls `POST /agent/leads/:id/activities`); full activity timeline loaded from `GET /agent/leads/:id/activities`.
  - `api-client.ts`: added `LeadRecord`, `LeadActivityRecord`, `CrmDashboardResponse`, `CreateLeadPayload`, `LogActivityPayload` types; `LEAD_STATUSES`, `ACTIVITY_TYPES`, `LEAD_SOURCES` constants; `crmApi` object with all 7 CRM methods.

### Fixed
- **Identity suite — 10 pre-existing test failures resolved** (2026-03-06)
  - `auth.service.spec.ts` (6 tests): added missing `$queryRaw` mocks for `getRolePermissions`, pending-invitations query, `resolveSelfCompanyCtx`, and `active_company_id` membership re-validation in `refresh`; corrected `BadRequestException` → `ConflictException` for duplicate-email guard.
  - `users.service.spec.ts` (2 tests): `create()` and `updateStatus()` both call `findById()` post-mutation — tests updated to mock INSERT/UPDATE RETURNING id and findById SELECT as two separate `$queryRaw` calls.
  - `notification.service.spec.ts` (2 tests): added `EMAIL_PROVIDER: 'sendgrid'` to test config in both SendGrid tests so `resolveEmailProvider()` correctly resolves the provider.
  - All 55 identity tests now passing.

- **Sprint 03 audit — SQL table/column bugs fixed** (2026-03-06)
  - `property.service.ts` and `seller-dashboard.service.ts`: 10 references to non-existent table/column names corrected (`property_viewings` → `viewings`, `property_inquiries` → `inquiries`, `property_audit_logs` → `audit_logs`, `al.changes` → `al.payload`, `al.user_id` → `al.actor_id`, `v.feedback_notes`/`v.rating` → `v.buyer_feedback`, `m.expiry_date` → `m.end_date`).
  - `property.service.spec.ts`: 3 `create()` tests missing self-company lookup mock prepended before INSERT mock.

### Changed
- **Dashboard UI — Listings tab improvements** (2026-03-06)
  - `MyDashboard.tsx` and `AgentDashboardEnhanced.tsx` listings tables: listing title is now the primary headline; listing-type badge (`For Sale` / `To Rent` / `Development`) displayed as a coloured strip overlaid on the bottom of the property thumbnail.
  - `AgentDashboardEnhanced.tsx`: added full **Duplicate** action to the listings table, matching MyDashboard behaviour (copies all fields + media to a new draft, with loading state and error handling).

- **Sprint 02 Enhanced — post-audit bug fixes** (2026-03-05)
  - **[HIGH] Sessions never populated** — `AuthService.issueTokens()` now calls `SessionsService.create()` after every successful login, register, refresh, and OAuth flow. Sessions are persisted to `identity.user_sessions` with IP address and device name (first 100 chars of `User-Agent`).
  - **[MEDIUM] Licence document upload endpoint missing** — `PATCH /api/v1/users/me/licences/:id/document` is now functional. `DocumentStorageService` is properly injected into `ProfessionalLicencesController`; the class closing brace was also corrected.
  - **[MEDIUM] No KYC gate on professional role self-assignment** — `UsersService.selfAddRole()` now checks `getLatestKycStatus()` before assigning any `PROFESSIONAL_ROLES` (`valuer`, `conveyancer`, `inspector`, `mortgage_broker`, `quantity_surveyor`). Throws `ForbiddenException` if KYC is not `approved`.

### Added
- **Sprint 03 Enhanced — Property Marketplace (addendum)** (2026-03-06)
  - **Extended property attributes** — 15 new columns on `property.properties`: `property_subtype`, `erf_size_sqm`, `floor_area_sqm`, `garages`, `carports`, `monthly_levy`, `monthly_rates`, `monthly_utilities`, `title_type`, `zoning`, `body_corporate_name`, `pet_policy`, `occupational_date`, `seller_approved_at`, `listing_reference` (unique human-readable ref).
  - **Listing lifecycle state machine** — `property.listing_state_transitions` table seeded with 10 valid transitions covering all 7 states (`draft` → `active` → `under_offer` → `sold` / `withdrawn` / `back_to_market`).
  - **Mandate Management** (`src/property/mandate.{service,controller,dto}.ts`):
    - Sole mandate enforcement — only one active sole mandate per property allowed; conflict check prevents duplicates.
    - `POST /api/v1/properties/:id/mandate` — create mandate (sole or open).
    - `GET  /api/v1/properties/:id/mandate` — fetch current mandate.
    - `POST /api/v1/properties/:propertyId/mandate/:mandateId/sign` — digital signature acceptance.
    - `PATCH /api/v1/properties/:propertyId/mandate/:mandateId/cancel` — cancel mandate.
    - `GET  /api/v1/agent/mandates` — agent's full mandate portfolio.
  - **Property Valuation** (`src/property/valuation.{service,controller}.ts`):
    - `property.valuations` + `property.comparable_sales` tables.
    - `POST /api/v1/properties/:id/valuations` — request new valuation (CMA / formal).
    - `GET  /api/v1/properties/:id/valuations` — list valuations for a property.
    - `POST /api/v1/valuations/:id/report` — submit valuation report (valuers only).
    - `GET  /api/v1/valuers` — list accredited valuers.
  - **Viewing & Appointment Scheduler** (`src/property/viewing.{service,controller}.ts`):
    - `property.property_viewings` + `property.open_houses` + `property.open_house_registrations` tables.
    - `POST /api/v1/properties/:id/viewings` — schedule a private viewing.
    - `GET  /api/v1/properties/:id/viewings` — list viewings for a property.
    - `POST /api/v1/viewings/:id/confirm|cancel|complete` — lifecycle transitions.
    - `POST /api/v1/viewings/:id/feedback` — buyer feedback after viewing.
    - `GET  /api/v1/agent/calendar` — agent's daily viewing appointments.
    - `POST /api/v1/properties/:id/open-houses` — schedule open house.
    - `GET  /api/v1/properties/:id/open-houses` — list open houses.
    - `POST /api/v1/open-houses/:id/register` — buyer RSVP for open house.
  - **Neighbourhood Insights** (`src/property/neighbourhood.{service,controller}.ts`):
    - `property.neighbourhood_stats` table (crime rate, school rating, transport score, hospital distance).
    - `GET /api/v1/properties/:id/neighbourhood` — neighbourhood profile for a property.
    - `GET /api/v1/neighbourhood?suburb=&city=` — standalone suburb lookup.
  - **Listing Syndication Engine** (embedded in `neighbourhood.service.ts` as `SyndicationService`):
    - `property.syndication_configs` + `property.syndication_records` tables.
    - `POST /api/v1/properties/:id/syndicate` — push listing to external portal (Property24, etc.).
    - `GET  /api/v1/properties/:id/syndication-records` — syndication history and status per portal.
  - **Property Comparison Tool** (`src/property/comparison.service.ts`):
    - `GET /api/v1/properties/compare?ids=uuid1,uuid2,...` — side-by-side comparison of up to 4 properties; includes winner fields per numeric attribute.
  - **Extended Agent Dashboard** (added to `property.service.ts` + `property.controller.ts`):
    - `GET /api/v1/agent/dashboard/summary` — aggregate counts (active listings, active mandates, viewings this week, open leads).
    - `GET /api/v1/agent/listings/performance` — per-listing view count, enquiries, days on market.
    - `GET /api/v1/agent/listings/activity-feed` — paginated cross-listing activity stream.
    - `GET /api/v1/agent/commission-pipeline` — all mandates with projected commission totals.
  - **Seller Dashboard** (`src/property/seller-dashboard.service.ts`):
    - `GET  /api/v1/seller/properties` — all properties owned by the authenticated seller.
    - `GET  /api/v1/seller/properties/:id/activity` — combined activity timeline (viewings, offers, valuations).
    - `GET  /api/v1/seller/properties/:id/viewings` — viewing requests and statuses.
    - `GET  /api/v1/seller/properties/:id/offers` — pending and accepted offers.
  - **DB migration** — `202603050014_sprint03_enhanced` applied to `pribec_dev`; 10 new tables + 15 new property columns.
  - **Test coverage** — `mandate.service.spec.ts` (7 tests), `valuation.service.spec.ts` (5 tests), `viewing.service.spec.ts` (13 tests); 25/25 passing; TypeScript clean build.

- **Sprint 02 Enhanced — Identity, Auth, RBAC & KYC (addendum)** (2026-03-05)
  - **6 new RBAC roles**: `valuer`, `developer`, `mortgage_broker`, `quantity_surveyor`, `brokerage_admin`, `bank_officer` — seeded into `identity.roles` with display names and granular permissions via `IdentityBootstrapService`.
  - **Role exclusion enforcement** — `identity.role_exclusions` table + `ROLE_EXCLUSION_PAIRS` constant prevents conflicting role combinations (e.g., `platform_admin` vs `agent`/`contractor`). Applied at API layer in `selfAddRole()`.
  - **Self-service role management** (`users.controller.ts`, `users.service.ts`):
    - `GET  /api/v1/users/me/roles` — list user's current roles.
    - `POST /api/v1/users/me/roles` — add a role with exclusion checking; blocks self-assigning `admin`.
  - **Professional Licences module** (`src/identity/professional-licences/`):
    - `POST /api/v1/users/me/licences` — submit a new licence (types: `eaab_agent`, `conveyancer`, `inspector`, `valuer`, `quantity_surveyor`, `mortgage_broker`).
    - `GET  /api/v1/users/me/licences` — list own licences.
    - `GET  /api/v1/admin/licences` — admin: list all licences (filterable by status).
    - `PATCH /api/v1/admin/licences/:id/verify` — admin: approve or reject a licence.
    - `GET  /api/v1/admin/licences/expiring?days=90` — admin: licences expiring within N days.
    - `GET  /api/v1/admin/licences/user/:userId` — admin: licences for a specific user.
  - **Session & Device Management** (`src/identity/sessions/`):
    - `identity.user_sessions` table — stores device fingerprint, name, IP, country, last-active, expiry.
    - `GET    /api/v1/users/me/sessions` — list non-expired, non-revoked sessions.
    - `DELETE /api/v1/users/me/sessions/:id` — revoke a specific session.
    - `DELETE /api/v1/users/me/sessions` — revoke all other sessions (keeps current).
  - **Enhanced MFA** (`src/identity/mfa/`):
    - `identity.mfa_configs` table — TOTP secret (AES-256-GCM encrypted), FIDO2 credentials (JSONB), backup codes (bcrypt-hashed), SMS flag.
    - Native RFC 6238 TOTP — implemented via Node.js `crypto` (no external library); ±30 s tolerance window.
    - `GET  /api/v1/mfa/status` — current MFA configuration.
    - `POST /api/v1/mfa/totp/setup` — generate secret + `otpauth://` URI for QR code.
    - `POST /api/v1/mfa/totp/verify` — verify token and enable TOTP.
    - `DELETE /api/v1/mfa/totp` — disable TOTP.
    - `POST /api/v1/mfa/backup-codes/generate` — regenerate 10 backup codes.
    - `PUT  /api/v1/mfa/channels` — toggle SMS channel.
    - `POST /api/v1/mfa/fido2/credentials` — register a FIDO2/WebAuthn credential.
    - `DELETE /api/v1/mfa/fido2/credentials/:credentialId` — remove a credential.
  - **Agent CRM Foundation** (`src/identity/agent-crm/`):
    - `identity.leads` + `identity.lead_activities` tables.
    - `GET  /api/v1/agent/dashboard` — total leads, by-status breakdown, activities this week.
    - `POST /api/v1/agent/leads` — create lead manually.
    - `GET  /api/v1/agent/leads?status=&page=&limit=` — paginated lead pipeline.
    - `PATCH /api/v1/agent/leads/:id/status` — FSM status transitions (enforced valid paths).
    - `POST /api/v1/agent/leads/:id/activities` — log call, email, viewing, note.
    - `GET  /api/v1/agent/leads/:id/activities` — activity history for a lead.
  - **Notification Preferences** (`src/identity/notification-preferences/`):
    - `identity.notification_preferences` table — email, SMS, push, WhatsApp toggles + per-topic JSONB.
    - `GET /api/v1/users/me/notification-preferences` — returns defaults if not yet set.
    - `PUT /api/v1/users/me/notification-preferences` — upsert with deep merge on `topics`.
  - **Enhanced KYC biometric fields** — `identity.kyc_verifications` extended with 9 new columns: `liveness_check_passed`, `liveness_score`, `face_match_score`, `biometric_provider`, `biometric_reference`, `risk_level`, `pep_check_passed`, `sanctions_check_passed`, `aml_check_passed`.
  - **Commission split** — `identity.company_members.commission_split_pct DECIMAL(5,2)` added for agent–brokerage commission configuration.
  - **DB migration** — `202603050013_sprint02_enhanced` applies all DDL above.
  - **Organisation accounts** — covered by existing `identity.companies` table (no separate `organisations` table needed; `category` field maps to org type). `commission_split_pct` added to `company_members`.

- **Invitation acceptance flow — complete role & company enrolment** (2026-03-04)
  - **Backend — `apps/api/src/identity/companies/company-invitations.service.ts`**
    - `registerAndAccept` (new user path): new users now receive **both** `buyer_seller` (system default role) and the company-specific invited role in `identity.user_roles`, plus automatic enrolment in the Self system company — exactly matching the normal registration path. Previously only the invited role was assigned and the Self company membership was never created.
    - `accept` (existing user path): after `linkUserToCompany` creates the `company_members` row, `usersService.assignRole()` is now called to reflect the invited role in `identity.user_roles` so it is included in the user's next JWT. Previously only the company membership record was inserted.
    - Both acceptance paths now send a welcome email to the invitee containing the company name, role, and a login link (`notifyInviteeOfAcceptance` private helper).
  - **Backend — `apps/api/src/identity/auth/auth.service.ts`**
    - `addUserToSelfCompany` renamed to **`enrolInSelfCompany`** and changed from `private` to `public` so the invitations service can call it without duplicating the PostgreSQL query.
  - **Backend — `apps/api/src/identity/companies/invitations.controller.ts`** (new file)
    - Standalone `InvitationsController` extracted to its own file; handles `GET /invitations/:token` (public preview), `POST /invitations/:token/accept` (authenticated), and `POST /invitations/:token/register-and-accept` (public registration + accept).
  - **Frontend — `apps/web/src/views/AcceptInvitation.tsx`**
    - Added `newAccount` state flag set on the register-and-accept path.
    - `accepted` screen overhauled: heading adapts to **"Account Created!"** (new user) vs **"Invitation Accepted!"** (existing user); green summary card shows company name, role/admin badge, and "A welcome email has been sent to [email]" confirmation; primary **Go to Company Dashboard** + secondary **Go to Home** CTAs.
  - **Frontend — `apps/web/src/views/CompanyUserManagement.tsx`**
    - Members and pending invitations now loaded in parallel (`Promise.all`); invitations list rendered with status, expiry, inviter, and per-invitation revoke button.
    - `handleRevokeInvitation` wired to `DELETE /companies/:id/invitations/:inviteId`; optimistic UI update removes revoked row.
  - **Frontend — `apps/web/src/lib/api-client.ts`**
    - `companiesApi.listInvitations(token, companyId)` — `GET /companies/:id/invitations`.
    - `companiesApi.revokeInvitation(token, companyId, inviteId)` — `DELETE /companies/:id/invitations/:inviteId`.
    - New `invitationsApi` namespace: `preview(token)`, `accept(authToken, token)`, `registerAndAccept(token, payload)` — typed with `InvitationPreview`, `InviteAcceptResult`, `InviteRegisterResult`.

- **Email provider — SMTP support + Mailpit local catcher** (2026-03-04)
  - **Backend — `apps/api/src/identity/notifications/email.smtp.provider.ts`** (new file)
    - `SmtpEmailProvider` implements `EmailProvider`; uses `nodemailer` to send via any SMTP server.
  - **Backend — `apps/api/src/identity/notification.service.ts`**
    - `resolveEmailProvider()` now reads `EMAIL_PROVIDER` env var (`smtp` | `sendgrid` | `none`). Defaults to `none` (log-only). Selects `SmtpEmailProvider` or `SendGridEmailProvider` based on the value; missing SendGrid credentials now emit a warning instead of a silent `null` return.
  - **Docker — `docker/docker-compose.yml`**
    - Added `mailpit` service (`axllent/mailpit:latest`): catches all outbound SMTP on port `1025`; web inbox UI at `http://localhost:8025`. Persisted via `mailpit_data` volume.
  - **Env — `.env.example` / `apps/api/.env.example`**
    - Added `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS` entries pre-configured for local Mailpit.
    - SendGrid vars moved to commented-out "production" block.

- **DB migration — refresh token company context** (2026-03-04)
  - Migration `202603040012_refresh_token_company_context`: adds `active_company_id UUID` (FK → `identity.companies`) to `identity.refresh_tokens`.
  - Fixes the "No active company context" error on JWT rotation by carrying the selected company through token refresh.

- **Company Users — `GET /companies/:id/invitations` endpoint** (2026-03-04)
  - `companies.controller.ts`: `GET /companies/:id/invitations` endpoint added (previously missing; invitation preview/accept routes were incorrectly placed in `companies.controller.ts` and have been moved to the standalone `InvitationsController`).

### Added
- **Company Documents — upload & review workflow** (2026-03-04)
  - **DB layer** — migration `202603040011_company_documents` creates `identity.company_documents` table:
    - Columns: `id`, `company_id`, `uploaded_by`, `document_type` (business_licence, registration_certificate, tax_clearance, professional_indemnity, id_document, other), `document_name`, `file_name`, `storage_path`, `public_url`, `mime_type`, `file_size_bytes`, `status` (pending/approved/rejected), `review_notes`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`.
    - Indexes on `(company_id)` and `(company_id, status)` for fast per-company queries.
  - **Prisma schema** — `apps/api/prisma/schema.prisma`
    - Added `CompanyDocument` model mapping to `identity.company_documents`.
  - **API — `apps/api/src/identity/companies/companies.controller.ts`**
    - `GET  /companies/:id/documents` — lists all documents for the company (requires `CompanyContextGuard`).
    - `POST /companies/:id/documents` — multipart file upload; stores file via `DocumentStorageService`, inserts record in `company_documents`, returns updated document list (requires `CompanyContextGuard` + `CompanyAdminGuard`).
  - **API — `apps/api/src/identity/companies/companies.service.ts`**
    - `listDocuments(companyId)` — raw SQL with uploaded-by user join.
    - `addDocument(params)` — inserts document metadata and returns updated list.
  - **Web — `apps/web/src/lib/api-client.ts`**
    - Added `CompanyDocument` type with all DB columns and optional uploader name fields.
    - `companiesApi.getDocuments(token, companyId)` — `GET /companies/:id/documents`.
    - `companiesApi.uploadDocument(token, companyId, file, type?, name?)` — multipart `POST`.
  - **Web — `apps/web/src/views/CompanyProfile.tsx`**
    - New "Verification Documents" section rendered for all company members; upload form (type selector, name field, file picker) shown only to `isAdmin` users.
    - `DOC_TYPE_LABELS` map provides human-readable labels for each document type.
    - Documents fetched on mount alongside company detail; non-fatal failure (section simply shows empty state).
    - Per-document status badge (Pending / Approved / Rejected) and public-URL download link.

- **Company Audit Logs — live data feed** (2026-03-04)
  - **API — `apps/api/src/identity/companies/companies.controller.ts`**
    - `GET /companies/:id/audit-logs?limit=50&offset=0` — paginated audit log query (requires `CompanyContextGuard` + `CompanyAdminGuard`).
  - **API — `apps/api/src/identity/companies/companies.service.ts`**
    - `getAuditLogs(companyId, limit, offset)` — raw SQL query joining `audit.shared_audit_logs` with `identity.users` for actor name/email; returns enriched `CompanyAuditLogEntry` rows.
  - **Web — `apps/web/src/lib/api-client.ts`**
    - Added `CompanyAuditLogEntry` type (id, event_id, actor_id, actor_role, action, resource_type, resource_id, payload, created_at, first_name, last_name, email).
    - `companiesApi.getAuditLogs(token, companyId, limit?, offset?)`.
  - **Web — `apps/web/src/views/CompanyActivityLogs.tsx`**
    - Replaced static mock data with live API call via `companiesApi.getAuditLogs`.
    - `mapEntry()` function translates raw log rows into typed `LogEntry` display objects; falls back to `entry.action` when `event_id` is null.
    - Filter, search, and pagination wired to real data set.

- **Company Members — role permissions & allowed-roles endpoints** (2026-03-04)
  - **API — `apps/api/src/identity/companies/companies.controller.ts`**
    - `GET /companies/:id/roles/:role/permissions` — returns the canonical permission list for a named role; `CompanyContextGuard` only (read-only, no admin required).
    - `GET /companies/:id/allowed-roles` — returns the non-admin roles available for invitation into this company.
  - **API — `apps/api/src/identity/companies/companies.service.ts`**
    - `getAllowedRoles(companyId)` — queries `identity.company_member_roles` and filters out `admin` from the result set.
  - **API — `apps/api/src/identity/companies/company-members.service.ts`**
    - `getRolePermissions(role)` — raw SQL joining `identity.role_permissions → identity.permissions → identity.roles`; returns `{ resource, action }` array.

- **Auth — registration seeds `buyer_seller` permissions from DB** (2026-03-04)
  - `apps/api/src/identity/auth/auth.service.ts`
    - On new user registration, the initial company member record previously used a hardcoded empty permissions array.
    - Now calls `getRolePermissions('buyer_seller')` (fetched from `identity.role_permissions`) and passes the result as the seed `permissions` JSONB value so new users start with proper read access.

- **Company management UI — full API integration** (2026-03-04)
  - `apps/web/src/views/CompanyInviteUser.tsx` — invite form fetches `getAllowedRoles` to dynamically populate the role selector; errors and loading states added.
  - `apps/web/src/views/CompanyPermissions.tsx` — permissions grid fetches live data per role via `getRolePermissions`; edit/save flow wired to `PATCH /companies/:id/members/:memberId`.
  - `apps/web/src/views/CompanyRevokedPool.tsx` — revoked-access list fetches real data; restore/permanent-remove actions wired to API; typed `RevokedEntry` model added to api-client.
  - `apps/web/src/views/CompanyUserManagement.tsx` — member list, role change, and deactivate actions all use typed API client methods; optimistic UI updates on success.

- **Web infrastructure** (2026-03-04)
  - `apps/web/next.config.js` — added `rewrites` rule to proxy `/api/v1/**` to the NestJS API at `http://localhost:3001`; enables relative API calls from Next.js pages without CORS issues.
  - `apps/web/src/lib/auth-session.ts` — added `getAccessToken()` helper and `getActiveCompanyContext()` typed return; simplifies token retrieval across all view components.
  - `apps/web/src/components/AppSidebar.tsx` — navigation split refined: `selfNavigation` and `companyNavigation` arrays now cover full sprint-03 route set; active-route highlight logic extended for nested paths.
  - `apps/web/src/views/MyDashboard.tsx` — quick-action links updated to match current route structure.

### Fixed
- **Prisma schema out of sync with applied DB migrations** (2026-03-03)
  - `apps/api/prisma/schema.prisma`
    - `Property` model: added `listingType String? @map("listing_type")` (from migration `202603020008`) and `companyId String? @map("company_id")` (from migration `202603020009`) with corresponding `@@index` declarations.
    - `PropertyInquiry` model: added `companyId String?` field and `@@index([companyId])` — records the company context of the buyer at time of inquiry.
    - `FraudReport` model: added `companyId String?` field and `@@index([companyId])` — records the company context of the reporter.
    - `PropertyAuditLog` model: added `companyId String?` field and `@@index([companyId])` — records which company context the action was performed under.
    - Ran `prisma generate` to regenerate the Prisma Client.
  - Applied pending migration `202603020010_sprint04_sales_progression` to local dev DB (`prisma migrate deploy`).

### Added
- **Company-scoped transaction attribution** (2026-03-03)
  - All authenticated write operations (create/update property listing, submit inquiry, file fraud report, emit audit log entry) are now stamped with the `active_company_id` from the user's JWT so that every transaction is attributed to the company the user was operating under at the time.
  - **DB layer** — migration `202603020009` (already applied) added `company_id UUID` columns + indexes to:
    - `property.properties` — records which company the listing agent was operating under.
    - `property.inquiries` — records which company the buyer was acting as.
    - `property.fraud_reports` — records which company the reporter was acting as.
    - `property.audit_logs` — records which company context initiated the audited action.
    - `identity.audit_logs` — same for identity/auth events (login, register, token refresh).
  - **API layer** — each controller already extracts `req.user.active_company_id` from the JWT (set by `JwtStrategy` when a user has selected a company context via `POST /auth/contexts/select`) and passes it to:
    - `PropertyService.createProperty()` / `updateProperty()` / `changeStatus()` / `deleteProperty()`
    - `InquiryService.createInquiry()`
    - `FraudService.createReport()`
    - `PropertyAuditService.log()`
  - **Self-company users** — `active_company_id` is `null` for sole-proprietor users belonging only to the built-in Self system company; all services handle `null` gracefully (column remains `NULL`).

- **Listings: "Privately Listed" badge missing for Self-company agents** (2026-03-03) — _revised 2026-03-03_
  - **Root cause (previous approach was insufficient):** The original fix derived `isPrivateListing` from the agent's company membership profile (`!primaryCompanySlug`). This broke for agents who belong to *both* a real company and the Self system company — the badge never showed even when they created a listing under the Self context, because `primaryCompanySlug` was non-null (the real company).
  - **Correct approach:** Read `company_is_system` directly from the property record. The listing's `company_id` column records which company the agent was operating under at creation time; joining with `identity.companies` provides the `is_system` flag. A listing is privately listed when `company_is_system IS NULL` (no company set) or `company_is_system = true` (Self system company).
  - `apps/api/src/property/property.service.ts`
    - `PropertyRecord` type now includes `company_is_system: boolean | null`.
    - All four data-fetching queries (`findById`, `getAgentListings`, `getOwnerListings`, `search`) updated from `SELECT p.*` to `SELECT p.*, c.is_system AS company_is_system FROM property.properties p LEFT JOIN identity.companies c ON c.id = p.company_id`.
  - `apps/web/src/lib/api-client.ts`
    - `PropertyListing` type now includes `company_is_system?: boolean | null`.
  - `apps/web/src/views/Listings.tsx`
    - `mapPropertyToListingCard()` sets `isPrivateListing: property.company_is_system !== false` (i.e. `true` when `null` or `true`).
    - Added `isPrivateListing: boolean` field to `ListingCard` type (retained from previous fix).
    - Purple `🔒 Privately Listed` badge rendered on card overlay when `isPrivateListing` is `true`.
    - Company logo thumbnail hidden for private listings.
  - `apps/web/src/views/PropertyDetailEnhanced.tsx`
    - `isPrivateListing = listing.company_is_system !== false` (reads per-listing flag instead of agent profile).
    - Badge appears in both the image hero section and the sidebar agent card when `isPrivateListing`.
    - Company name/logo block in the agent section hidden when `isPrivateListing`.

- **Login and registration returning HTTP 500 "Internal server error"** (2026-03-02)
  - `apps/api/prisma/migrations/202603020008_property_listing_type/migration.sql`
  - `apps/api/prisma/migrations/202603020009_company_id_on_transactions/migration.sql`
    - Two Prisma migrations had been authored and committed but never applied to the local development database.
    - Migration `202603020009` adds a `company_id UUID` column to `identity.audit_logs` (plus `property.properties`, `property.audit_logs`, `property.inquiries`, and `property.fraud_reports`).
    - `AuditService.log()` already referenced `company_id` in its raw SQL `INSERT`; with the column absent in the DB, every authenticated action that writes an audit entry (login, register, logout, token refresh, etc.) threw a Postgres "column not found" error, which NestJS caught and returned as a 500 response.
    - Both migrations applied via `prisma migrate deploy`.
  - `apps/api/prisma/schema.prisma`
    - Added `companyId String? @map("company_id") @db.Uuid` to the `IdentityAuditLog` model to keep the Prisma schema in sync with the applied migration; re-ran `prisma generate`.

- **Self company context: sidebar showed wrong navigation items** (2026-02-28)
  - `apps/web/src/components/AppSidebar.tsx`
    - When the active company is the built-in Self system company (`slug === 'self'`), the sidebar was rendering the same navigation as a real company context (Home, Agent Dashboard, etc.).
    - Introduced `selfNavigation` (My Dashboard, Listings, Service Providers, Project Management, Safety, Analytics) and `companyNavigation` (previous list) as separate static arrays.
    - `isSelfCompany` flag derived from `activeCompany?.slug === 'self'`; applies to both desktop sidebar and mobile drawer.

- **Self company context: post-login redirect sent user to Company Dashboard** (2026-02-28)
  - `apps/web/src/views/CompanyContextSelect.tsx`
    - After selecting the Self company from the multi-company picker, users were unconditionally redirected to `/company/dashboard`.
    - Fixed: redirect destination now checks `selectedCompany?.slug === 'self'` and sends Self-context users to `/app/my-dashboard` instead.
  - `apps/web/src/views/CompanyDashboard.tsx`
    - Added `useEffect` guard: reads `getActiveCompanyContext()` on mount and immediately redirects to `/app/my-dashboard` when the active company is Self or absent (defence-in-depth for direct URL access).

- **12 authenticated routes missing from the shell policy** (2026-02-28)
  - `apps/web/src/lib/route-policy.ts`
    - The following routes were not listed in `AUTH_SHELL_ROUTE_PREFIXES` and therefore rendered without sidebar or header when navigated to by an authenticated user:
      `/agent`, `/ai-design-studio`, `/buyer`, `/company-registration`, `/company-role-selector`, `/construction`, `/contractor-supplier-marketplace`, `/fraud-report`, `/invitations`, `/properties`, `/service-providers`
    - All routes added. List is now sorted to ease future maintenance.

- **HomeNavbar rendered on login and company-context-select pages** (2026-02-28)
  - `apps/web/src/lib/route-policy.ts`
    - Added `NO_NAVBAR_ROUTES` export (`/login`, `/company-context-select`) and `isNoNavbarRoute()` helper.
  - `apps/web/src/components/HomeNavbar.tsx`
    - Imports `isNoNavbarRoute` and returns `null` immediately when on a no-navbar route, regardless of authentication state.

- **CompanyContextSelect page had incorrect branding** (2026-02-28)
  - `apps/web/src/views/CompanyContextSelect.tsx`
    - Replaced the indigo Shield-icon header and `bg-gradient` full-page background with the PropertyOS logo block used on the login page (black rounded square + `Home` icon + "PropertyOS" wordmark).
    - Card background updated to `bg-card`/`border-border` tokens to respect the active theme.

### Added
- **Company Dashboard API endpoint** (2026-03-03)
  - `apps/api/src/identity/companies/companies.service.ts`
    - `getDashboard(companyId)` queries active member count, total invitations, orphaned task count, today's audit event count, a recent activity array (last 5 entries), and the full company record in parallel using `Promise.all`.
    - Returns a single `CompanyDashboardResponse` DTO; no N+1 queries.
  - `apps/api/src/identity/companies/companies.controller.ts`
    - `GET /api/v1/companies/:id/dashboard` — requires authenticated user with an active context for that company; returns aggregated dashboard stats and recent activity feed.

- **Company logo upload endpoint** (2026-03-03)
  - `apps/api/src/identity/companies/companies.controller.ts`
    - `POST /api/v1/companies/:id/logo` — accepts `multipart/form-data` with a `logo` file field; validates MIME type (image/*) and size (max 5 MB); stores via `DocumentStorageService` and updates `identity.companies.logo_url`.
  - `apps/web/src/views/CompanyProfile.tsx`
    - Admin users see a camera-icon overlay on the company logo; clicking it opens a file picker.
    - Calls `companiesApi.uploadLogo(token, companyId, file)` and refreshes the displayed logo on success.
    - Non-admin users see the logo as read-only.

- **Company deactivation** (2026-03-03)
  - `apps/api/src/identity/companies/companies.service.ts`
    - `deactivate(id, actorId, requestContext)` — sets `status = 'deactivated'` and writes a `company.deactivated` audit log entry.
  - `apps/api/src/identity/companies/companies.controller.ts`
    - `POST /api/v1/companies/:id/deactivate` — admin-only; returns `{ id, status: 'deactivated' }`.
  - `apps/web/src/views/MyCompanies.tsx`
    - Each company card now shows a **Deactivate** action (PowerOff icon) visible to admins.
    - Confirmation modal prevents accidental activation; calls `companiesApi.deactivateCompany(token, id)` after exchanging a scoped context token.
    - Optimistically updates the in-memory list to show `deactivated` status on success.

- **CompanyRegistration: real API wiring with logo and document upload** (2026-03-03)
  - `apps/web/src/views/CompanyRegistration.tsx`
    - Logo upload: image drop zone with live preview, type validation (image/*), and 5 MB size limit; blob URL revoked on removal.
    - Document upload: drag-and-drop zone accepting PDF or images up to 10 MB each; duplicate-file guard by name+size.
    - On submit calls `companiesApi.createCompany(token, payload)` then uploads logo via `companiesApi.uploadLogo` and queues document uploads via `companiesApi.uploadDocument`.
    - Error handling surfaces per-field (`logoError`, `docError`) and a global `submitError` banner with a `Loader2` spinner during in-flight requests.

- **MyDashboard: expanded role-aware tabs** (2026-03-03)
  - `apps/web/src/views/MyDashboard.tsx`
    - Tab set extended to `overview | analytics | listings | favourites | my-properties | my-projects | my-orders`.
    - **Favourites** tab: displays saved/bookmarked properties sourced from the saved-properties API.
    - **My Properties** tab (buyer role): lists properties where the current user is the buyer/owner.
    - **My Projects** tab: construction project stubs with status and progress bar.
    - **My Orders** tab: supplier order stubs with amount and status badge.
    - Inline listing creation form removed; replaced by the new standalone `<CreateListing>` modal component.
    - Inline listing editing replaced by the new standalone `<EditListing>` modal component.
    - `auditApi` and `usersApi` imports added for audit log and user profile data.

- **CreateListing and EditListing extracted as standalone components** (2026-03-03)
  - `apps/web/src/components/CreateListing.tsx` (new, ~714 lines)
    - Full create-listing modal: title, price, currency, listing type, property type, address fields, bedrooms/bathrooms/parking/area, description, amenity checkboxes, and photo upload zone.
    - Wires to `propertiesApi.create(token, payload)` on submit; triggers an `onSuccess` callback to refresh the parent listing table.
  - `apps/web/src/components/EditListing.tsx` (new)
    - Same form fields pre-populated from the existing listing record; calls `propertiesApi.update(token, id, payload)` on save.

- **Listings: URL-persistent search filter state** (2026-03-03)
  - `apps/web/src/views/Listings.tsx`
    - `filtersToSearchParams(filters, sortBy, listingCategory)` — serialises all active filters into a `URLSearchParams` object appended to the browser URL whenever a search is executed; enables deep-linking and back-button restoration.
    - `filtersFromSearchParams(searchParams)` — rehydrates filter state from URL params on mount so bookmarked or shared search URLs restore the full filter panel state.
    - `useRouter` added alongside `useSearchParams`; URL updated via `router.replace` (no history stack entry per keystroke).
  - `apps/web/src/lib/api-client.ts`
    - `AgentProfileResponse`: `primaryCompanySlug?: string | null` field added; used by both listings and property-detail pages to determine private-listing status.

- **Context-aware sidebar navigation (Self vs Company)** (2026-02-28)
  - `apps/web/src/components/AppSidebar.tsx`
    - `selfNavigation` array: My Dashboard · Listings · Service Providers · Project Management · Safety · Analytics — with `Users` and `ClipboardList` icons from Lucide.
    - `companyNavigation` array: previous set retained for real-company contexts.
    - Selection is automatic; no prop changes required from `Layout`.
  - `apps/web/src/lib/route-policy.ts`
    - `NO_NAVBAR_ROUTES` and `isNoNavbarRoute()` exported as a standalone policy for the top HomeNavbar.


  - `apps/web/src/views/CompanyContextSelect.tsx`
    - Previously read companies exclusively from `sessionStorage` (`getPendingCompanies`), which had already been cleared after the initial login selection.
    - Now falls back to `getUserCompanies()` (persisted in `localStorage`) so the sidebar's "Switch Company / Role" flow reaches the selector correctly.
    - Redirect guard now checks `getAccessToken()` first — only sends to `/login` when there is genuinely no active session, not when the pending list was already consumed.

- **Company routes missing from authenticated shell** (2026-02-27)
  - `apps/web/src/lib/route-policy.ts`
    - Added `/company` to `AUTH_SHELL_ROUTE_PREFIXES` so all `/company/*` pages render inside the shared shell (left navbar + top header).
    - Verified prefix matching does **not** accidentally capture `/company-context-select` or `/company-registration` (requires `/company/` with trailing slash or exact match).

- **Listings filter parameters lost after agent profile navigation** (2026-02-27)
  - `apps/web/src/views/PropertyDetailEnhanced.tsx`
    - The agent name link built its `back` param using only `pathname`, discarding the `?back=…` query string that carried the encoded listings filter URL.
    - Fixed to include the full current URL (`pathname + searchParams`) so the chain Listings → Property Detail → Agent Profile → back → Property Detail → back to Listings correctly restores all filter state.

### Added
- **Authenticated shell: persistent left navbar on all protected routes** (2026-02-27)
  - `apps/web/src/components/AppSidebar.tsx`
    - Accepts two new props: `currentUser?: AuthUser | null` and `activeCompany?: CompanyContext | null` and `hasMultipleCompanies?: boolean`.
    - **Company context control** rendered between the logo and the nav links when the user belongs to more than one company (`hasMultipleCompanies === true`):
      - Displays current company name, role badge, and optional Admin badge.
      - Chevron dropdown exposes a single **Switch Company / Role** action that navigates to `/company-context-select`.
      - Collapses to a `Building2` icon with a tooltip when the sidebar is in collapsed mode; dropdown offset to the right of the sidebar.
      - Identical control present in the mobile drawer.
  - `apps/web/src/components/Layout.tsx`
    - Tracks `activeCompany` state via `getActiveCompanyContext()`.
    - Tracks `hasMultipleCompanies` state via `getUserCompanies().length > 1`.
    - Both synced on every `pribec:session-updated` event so they update without a page reload.
    - Forwards `currentUser`, `activeCompany`, and `hasMultipleCompanies` to `AppSidebar`.
    - Added `isCompanyRoute = pathname.startsWith('/company/')` flag; suppresses the **Create Listing** button on all company management pages.
  - `apps/web/src/lib/auth-session.ts`
    - New `pribec.user_companies` localStorage key persists the full company list from login response.
    - `saveActiveCompanyContext(company: CompanyContext)` — writes selected company to `pribec.active_company`.
    - `getActiveCompanyContext()` — reads it back.
    - `getUserCompanies()` — returns the persisted companies list (or `null`).
    - `clearAuthSession()` now also removes both `pribec.user_companies` and `pribec.active_company`.
  - `apps/web/src/views/CompanyContextSelect.tsx`
    - Calls `saveActiveCompanyContext(selectedCompany)` after successful context token exchange so the sidebar displays the name and role immediately.

- **Sprint 01-b: Company Management — Web UI layer** (2026-02-27)
  - `apps/web/src/views/CompanyRoleSelector.tsx`
    - Post-login role selector shown when a user holds multiple roles.
    - Reads roles from stored session user and JWT claims (union, de-duplicated).
    - Auto-selects when only one role present; routes to role-specific dashboard on continue.
    - `?next=` redirect param forwarded safely through the selection flow.
    - Sign-out link clears auth session and returns to `/login`.
  - `apps/web/src/views/CompanyContextSelect.tsx`
    - Multi-company context selector shown when `requires_context_selection = true` on login.
    - Displays company name, category label, role badge, admin badge, and active status.
    - Calls `POST /api/v1/auth/contexts/select { company_id }` and redirects to company dashboard.
    - Individual "skip" path available for sole-proprietor users without a company.
  - `apps/web/src/views/CompanyRegistration.tsx`
    - Two-step registration form: (1) identity/category/address, (2) contact details/documents.
    - All seven PRIBEC business categories available as selection options.
    - Document upload zone (PDF/image) included in step 2 for verification documents.
    - On submit calls `POST /api/v1/companies`, then navigates to company dashboard.
  - `apps/web/src/views/CompanyDashboard.tsx`
    - Overview dashboard for company admins: stats grid (active members, today's activity, pending invitations, verification status).
    - Verification status banners (pending / verified / rejected) with contextual guidance.
    - Recent activity feed (latest 5 events) with link to full activity log.
    - Quick-actions panel: Invite Member, Manage Permissions, Company Profile, Revoked Pool alert.
  - `apps/web/src/views/CompanyProfile.tsx`
    - Read / edit view for company details: registration number, tax number, category, address, contact, description.
    - Inline verification status badge (Verified / Pending / Rejected) with rejection reason display.
    - Verification documents list with upload CTA and per-document status.
    - Submit for Verification button shown only when `verificationStatus === 'unverified'`.
  - `apps/web/src/views/CompanyUserManagement.tsx`
    - Member table with search and status filters (All / Active / Suspended / Revoked).
    - Displays role badge, admin shield icon, invitation acceptance state, permission count, and join date.
    - Invite Member CTA links to invitation flow; stats cards summarize member counts by status.
  - `apps/web/src/views/CompanyInviteUser.tsx`
    - Invitation form: email, role selection (limited to company category's allowed roles), optional admin toggle.
    - Granular permission selector grouped by resource category with select-all per group.
    - 72-hour expiry caveat shown; success confirmation screen with Invite Another / Back to Users actions.
  - `apps/web/src/views/CompanyPermissions.tsx`
    - Split-panel permission manager: member list on left, permission matrix on right.
    - Permission toggles ceiling-enforced to the member's role baseline.
    - Save Changes button with inline success state; calls `PATCH /api/v1/companies/:id/members/:memberId/permissions`.
  - `apps/web/src/views/CompanyAdminManagement.tsx`
    - Admin-only table listing company administrators with primary/admin type badges.
    - Warning banner explains elevated privileges; last-admin protection notice at page footer.
    - Promote Member modal accepts email input and calls promote-admin endpoint.
  - `apps/web/src/views/CompanyActivityLogs.tsx`
    - Full-width audit log table with search and event-type filter.
    - Color-coded event badges for each audit event type.
    - Stats cards: Total Events, Today, Active Members, Most Active user.
    - Export Logs CTA (stub — wires to download endpoint in integration).
  - `apps/web/src/views/CompanyRevokedPool.tsx`
    - Split-panel manager: revoked member list on left, orphaned task detail on right.
    - Per-task assign/reassign modal with active-member dropdown.
    - Notification banner lists affected third parties with "Send Notifications" action.
    - Close All Tasks and Export Report CTAs per revoked member.

- **Agent dashboard (MyDashboard) — live DB metrics** (2026-02-27)
  - `apps/web/src/views/MyDashboard.tsx`
    - Three-tab layout: Overview, Analytics, My Listings.
    - Overview: stat cards (total listings, views last 7d with trend %, inquiries with response rate, portfolio value) sourced from `GET /api/v1/agent/dashboard` and the properties search API.
    - Analytics: line/bar charts for Views & Inquiries trend and Top Performing Listings (Recharts); conversion metrics grid.
    - My Listings: live table of agent's own properties with per-row View/Edit actions.
    - Add New Listing modal with full form (title, price, address, property type, beds/baths/parking/size, description, photo upload zone, amenity checkboxes) wired to `POST /api/v1/properties`.
    - `mapPropertyToDashboardListing()` helper maps API `PropertyListing` to table display format with days-on-market calculation.

- **Sprint 01-b: Service Provider & Company Management** (2026-02-26)
  - **DB migration** `202602260006_sprint01b_companies`: four new tables — `identity.companies`, `identity.company_members`, `identity.company_invitations`, `identity.company_orphaned_tasks` with all indexes and constraints.
  - **Prisma schema**: `Company`, `CompanyMember`, `CompanyInvitation`, `CompanyOrphanedTask` models added under the `identity` schema.
  - **JWT extension** (`auth.types.ts`): `JwtPayload` now carries `active_company_id | null`, `active_company_role | null`, `active_company_is_admin: boolean`. Backward compatible — individual/sole-proprietor users receive `null` company fields.
  - **Auth context switching** (`auth.service.ts`, `auth.controller.ts`):
    - `AuthService.login()` detects multi-company users and returns a `ContextSelectorResponse` instead of tokens.
    - `GET /api/v1/auth/contexts` — lists active company memberships for a user.
    - `POST /api/v1/auth/contexts/select` — issues a new JWT pair with the chosen company context embedded.
    - Redis session stores the active company context alongside the JTI.
  - **Companies module** (`apps/api/src/identity/companies/`):
    - `CompaniesService` — create (with auto-slug), read, update, submit-for-verification, admin list/verify/reject/suspend.
    - `CompaniesController` — full REST surface for company CRUD and platform-admin review.
    - Company category ↔ allowed-role matrix enforced on creation and invite.
  - **Member management**:
    - `CompanyMembersService` — list members, get member, update permissions (ceiling-enforced), promote to admin, revoke access; last-admin safeguard prevents orphaning a company.
    - `CompanyInvitationsService` — cryptographically random token (SHA-256 stored), 72-hour expiry, duplicate-invite rejection, preview endpoint, accept flow (links existing users; new-user redirect is handled at UI layer), revoke pending invites.
  - **Orphaned task pool** (`OrphanedTasksService`, `OrphanedTasksController`):
    - On member revocation, open property listings are detected and moved into the orphaned pool automatically.
    - Audit log emitted per task created.
    - Admin endpoints to list, assign, and close orphaned tasks.
  - **Guards**:
    - `CompanyContextGuard` — validates JWT `active_company_id` and confirms membership is still `active` in the DB.
    - `CompanyAdminGuard` — validates `active_company_is_admin === true`; `ForbiddenException` on missing context or non-admin.
    - `CompanyPermissionGuard` — reads required permission from route metadata via `Reflector.getAllAndOverride`, bypasses check for admins; throws `ForbiddenException` when permission absent.
  - **Notifications**: verified/rejected/suspended company emails + SMS, invitation deep-link email (72 h expiry), revoked-member email, orphaned-task summary to company admin.
  - **Audit events**: `company.created`, `company.submitted_for_verification`, `company.verified`, `company.rejected`, `company.suspended`, `company_member.invited`, `company_member.joined`, `company_member.permissions_updated`, `company_member.promoted_to_admin`, `company_member.access_revoked`, `company_context.selected`, `orphaned_task.created`, `orphaned_task.assigned`, `orphaned_task.closed` — all include `company_id` in payload.
  - **Tests** (46 passing): `CompaniesService`, `CompanyMembersService`, `CompanyInvitationsService`, `OrphanedTasksService`, `CompanyAdminGuard`, `CompanyContextGuard`, `CompanyPermissionGuard`.

### Changed
- **Agent profile page — functional contact, schedule call, reviews from DB** (2026-02-26)
  - `apps/web/src/lib/route-policy.ts`
    - Added `/agent-profile` to `AUTH_SHELL_ROUTE_PREFIXES` so logged-in users see the full sidebar and header on the agent profile page.
  - `apps/web/src/views/AgentProfile.tsx`
    - Replaced inert "Contact Agent" and "Schedule Call" buttons with modal dialogs that POST to the new API endpoints and show a success confirmation.
    - Contact modal pre-fills reviewer name and email from the authenticated session where available.
    - Schedule Call modal enforces a minimum booking time of 30 minutes from now via a `datetime-local` input.
    - "Call" and "Email" sidebar buttons are now real `<a href="tel:...">` / `<a href="mailto:...">` links; disabled when the agent has no phone/email on file.
    - `PLACEHOLDER_REVIEWS` constant removed entirely. Reviews are now fetched live from `GET /api/v1/properties/agents/:id/reviews`, loaded in parallel with the agent profile.
    - Review count and average rating in the reviews header reflect real DB values.
    - Shows a spinner while reviews load and an empty-state message when none exist.
  - `apps/web/src/lib/api-client.ts`
    - Added `AgentReview` and `AgentReviewsResponse` types.
    - Added `propertiesApi.getAgentReviews(agentId, limit, offset)`.
    - Added `ContactAgentPayload`, `ScheduleCallPayload`, `AgentContactResponse` types.
    - Added `propertiesApi.contactAgent()` and `propertiesApi.scheduleCall()`.

- **Profile dashboard metrics + verification status wiring** (2026-02-26)
  - `apps/web/src/views/ProfileDashboard.tsx`
    - Replaced hardcoded verification metrics with live calculations from user/KYC/audit data.
    - `Documents Verified` is now role-aware (`buyer` excludes business registration; professional roles include it).
    - `Trust Score` now reflects verification completion progress instead of static placeholders.
    - `Response Rate` now derives from real audit activity rather than a fixed value.
    - Verification progress row now offers `Resend email` when email is still unverified.
  - `apps/web/src/components/ui/activity-timeline.tsx`
    - Reduced spacing density and removed noisy fallback descriptor text.
  - `apps/web/src/lib/api-client.ts`
    - Added audit payload normalization to handle `snake_case` and `camelCase` API timestamp field variants.

- **Role setup persistence + KYC submission completion** (2026-02-26)
  - `apps/web/src/views/ProfileSetup.tsx`
    - Aligned page styling with listings theme tokens (`background`, `card`, `border`, `foreground`, `muted`).
    - Implemented real avatar display and upload flow with initials fallback.
    - Removed `Save & Go Back`; `Save & Continue` now validates required fields, persists, and advances tabs.
    - Wired business details fields to backend persistence via `PATCH /users/me`.
    - Wired KYC tab upload controls to real file pickers and multipart submission.
  - `apps/api/src/identity/users.service.ts`
    - Added read/write support for business profile fields on self profile operations.

- **Verification timestamp robustness and activity rendering fixes** (2026-02-26)
  - `apps/web/src/views/ProfileDashboard.tsx`
    - Hardened relative-time formatter for missing/invalid dates to prevent `NaNd ago` output.

- **Role setup + profile roles workflow refresh** (2026-02-25)
  - Rebuilt `ProfileDashboard` roles management card with role-status visibility and application CTA behavior:
    - Buyer remains default and non-removable.
    - Additional roles (Agent, Supplier, Contractor, Conveyancer, Inspector) are application-based.
    - Role selection now shows status states (`Active`, `Pending`, `Not Applied`) with per-role details.
  - Moved roles management card to sit directly under verification progress in profile dashboard.
  - Renamed setup flow user-facing wording from "Profile Setup" to "Role Setup" and standardized route usage:
    - canonical route: `/role-setup`
    - backward-compatible alias retained: `/profile-setup`
  - Updated shared layout behavior to hide the global `Create Listing` action on role setup routes.
  - Improved role setup flow controls:
    - added cancel actions back to profile dashboard
    - added "Save & Go Back" on profile tab
    - standardized tab footer actions (`Back`, `Cancel`, `Save & Continue`)
  - Enforced mandatory field completion before progression in role setup:
    - profile info required fields validated before continue/go-back save
    - business required fields validated before continue
    - tab progression gated to prevent bypass without required data
  - Hardened role setup profile preload behavior:
    - fall back to stored session user details when `/users/me` is temporarily unavailable
    - show a non-blocking stale-data warning instead of failing hard

- **Service provider routing + marketplace rename alignment** (2026-02-25)
  - Standardized marketplace naming from "Contractor Marketplace" to "Service Provider Marketplace" across app routes and documentation.
  - Replaced legacy route references with `/service-providers` in navigation/docs where applicable.
  - Added new Next.js route entrypoint:
    - `apps/web/src/app/service-providers/page.tsx`

- **Authenticated shell + account flow consistency updates** (2026-02-25)
  - Added reusable authenticated shell wrapper:
    - `apps/web/src/components/AuthenticatedShell.tsx`
    - Ensures authenticated pages render with app layout while auth-exempt routes stay minimal.
  - Added route support for account recovery/setup follow-up screens:
    - `/change-password`
    - `/role-setup`
  - Added keyboard-submit behavior and clearer auth error states on login/register/password recovery screens.

- **Web UX consistency + quality remediation sweep** (2026-02-24)
  - Standardized authenticated navigation shell behavior across app routes:
    - persistent reusable left sidebar for logged-in app experiences
    - top navigation hidden for authenticated app pages where sidebar is primary
    - sidebar branding updated to show app logo/name
  - Sidebar user identity/actions are now session-backed:
    - removed hardcoded profile name
    - display logged-in user name/avatar (with initials fallback)
    - added profile + logout dropdown actions on avatar/name trigger
  - Enforced consistent theme behavior:
    - locked web app to light theme for consistent cross-route appearance
    - hid theme toggle controls when theme lock is active
    - added scoped normalization for legacy hardcoded utility colors under authenticated shell
  - Completed broad diagnostics remediation in `apps/web/src`:
    - accessibility fixes for icon-only buttons/links and select/form control naming
    - replacement of deprecated utility aliases (e.g. `flex-shrink-0` → `shrink-0`, `bg-gradient-to-*` → `bg-linear-to-*`)
    - removal of inline style violations by replacing with `Progress` patterns and reusable CSS helpers
    - result: `get_errors` for `apps/web/src` now returns no errors

- **Browser tab branding + icon update** (2026-02-24)
  - `apps/web/src/app/layout.tsx`
    - updated root metadata title from PRIBEC label to `PropertyOS`
    - added explicit `icons` metadata (`icon`, `shortcut`, `apple`) pointing to app icon
  - `apps/web/src/app/icon.svg`
    - added Next.js app icon asset used for browser tab/favicon rendering

### Added
- **Agent contact, schedule call, and reviews persistence** (2026-02-26)
  - `apps/api/prisma/migrations/202602260004_agent_contacts/migration.sql`
    - Added `property.agent_contacts` table: stores Contact Agent and Schedule Call submissions with `contact_type` (`contact` | `schedule_call`), optional `requester_id`, `preferred_date`, `status`, `ip_address`, and `user_agent`.
    - Indexed on `(agent_id, created_at DESC)` and `requester_id`.
  - `apps/api/prisma/migrations/202602260005_agent_reviews/migration.sql`
    - Added `property.agent_reviews` table: stores client reviews with `rating (1–5)`, `comment`, `property_type`, optional `property_id`, `reviewer_name/email`, `reviewer_id`, `status` (`published` | `hidden` | `flagged`).
    - Indexed on `(agent_id, created_at DESC)` and `reviewer_id`.
  - `apps/api/src/property/property.service.ts`
    - Added `AgentReviewRow` type.
    - Added `contactAgent()`: verifies agent exists, inserts into `property.agent_contacts` with `contact_type='contact'`, emits audit event `agent.contact.requested`.
    - Added `scheduleAgentCall()`: validates ISO date, inserts with `contact_type='schedule_call'`, emits audit event `agent.call.scheduled`.
    - Added `getAgentReviews(agentId, limit, offset)`: returns paginated published reviews plus `total` and `averageRating`.
  - `apps/api/src/property/property.dto.ts`
    - Added `ContactAgentDto` (optional message, name, email, phone) with `class-validator` decorators.
    - Added `ScheduleCallDto` (required `preferredDate` ISO string, optional message, name, email, phone).
  - `apps/api/src/property/property.controller.ts`
    - Added `POST /api/v1/properties/agents/:id/contact` — auth optional, logs contact request.
    - Added `POST /api/v1/properties/agents/:id/schedule-call` — auth optional, logs call request.
    - Added `GET /api/v1/properties/agents/:id/reviews` — public, supports `?limit` and `?offset`.

- **Identity API + persistence extensions for role setup** (2026-02-26)
  - `apps/api/src/identity/auth/auth.controller.ts`
    - Added authenticated endpoint: `POST /api/v1/auth/resend-verification-email`.
  - `apps/api/src/identity/auth/auth.service.ts`
    - Added resend-verification flow: token generation, Redis persistence, email dispatch, and audit event.
  - `apps/api/prisma/migrations/202602250003_identity_business_profile/migration.sql`
    - Added `identity.user_business_profiles` table and supporting index for business details persistence.
  - `scripts/verify_role_setup_flow.py`
    - Added runtime script validating business details persistence and KYC submission end-to-end.

- **Web account/client API extensions** (2026-02-25)
  - `apps/web/src/lib/api-client.ts`
    - Added `usersApi.uploadAvatar(authToken, file)` for profile avatar upload.
    - Added `authExtApi.changePassword(authToken, payload)` for authenticated password change.
    - Extended auth/KYC response typings to include newly surfaced optional fields.

- **Web route smoke test command** (2026-02-24)
  - `scripts/smoke-web-routes.sh`
    - checks key web routes against `BASE_URL` (default `http://localhost:3000`)
    - supports custom route arguments
    - fails fast on any `4xx/5xx` status
  - `package.json`
    - added script: `smoke:web` → `bash scripts/smoke-web-routes.sh`

### Added (Earlier entries)
- **Sprint-03 agent dashboard metrics wiring** (2026-02-23)
  - `apps/api/src/property/property.service.ts`
    - Extended `GET /api/v1/agent/dashboard` response with:
      - `listingViewsLast7d`
      - `listingViewsPrevious7d`
      - `listingViewsTrendPct`
      - `inquiryResponseRatePct`
    - Metrics are computed from real property inquiry/audit data.
  - `apps/api/src/property/property.controller.ts`
    - Property detail reads now include request context for view-event logging (`property.viewed`) used by listing view trends.
  - `apps/web/src/lib/api-client.ts`
    - Added `AgentDashboardResponse` and `propertiesApi.getAgentDashboard(authToken)`.
  - `apps/web/src/views/AgentDashboardEnhanced.tsx`
    - Replaced static conversion placeholders with live listing-views trend and inquiry response-rate metrics.

- **Listings layout alignment with property detail shell** (2026-02-23)
  - `apps/web/src/views/Listings.tsx`
    - Aligned Listings page frame to the same shell pattern used by property detail (`bg-gray-50 min-h-screen` + centered `max-w-7xl` content wrapper).
    - Updated grid view to render a single card per row (`grid-cols-1`) for consistent vertical scanning.

- **Listings AI voice search implementation + microphone diagnostics** (2026-02-23)
  - `apps/web/src/views/Listings.tsx`
    - Replaced simulated voice-search timeout behavior with real browser speech recognition (`SpeechRecognition` + `webkitSpeechRecognition` fallback).
    - Wired recognized transcript into existing AI parsing flow so `Apply AI Search` updates active listing filters (location, property type, beds/baths, features, price bounds, verified-only).
    - Added explicit voice-status guidance for unsupported browsers, insecure origins (non-HTTPS/non-localhost), blocked microphone permissions, no-speech events, and missing microphone devices.
    - Added a reusable `Start Listening` action within the modal and ensured recognition is stopped on cancel/close/apply/unmount.

- **Listings/client request resilience + sold listing action guard** (2026-02-23)
  - `apps/web/src/views/PropertyDetailEnhanced.tsx`
    - Blocked inquiries and viewing requests when `listingStatus` is `sold`.
    - Disabled schedule/inquiry/contact CTA controls for sold properties and added user-facing unavailable messaging.
  - `apps/web/src/views/Listings.tsx`
    - Hardened listing fetch/mapping flow:
      - fallback retry without sort only on validation-like errors (`400`/`422`), not on `429`
      - per-record mapping guard so malformed listings do not fail the entire page
      - safer currency formatting fallback for invalid currency codes
  - `apps/web/src/lib/api-client.ts`
    - Added in-flight GET request deduplication for identical concurrent requests.
    - Added short-lived GET response cache (default 15s, `/properties*` 20s).
    - Added 429 cooldown handling (3s) with cached-response fallback where available.
  - Result: reduced duplicate API traffic during fast back/forward navigation, fewer `429 Too Many Requests` cascades, and more stable listing/property UX.

- **Listings first-load filter defaults update** (2026-02-23)
  - Updated `apps/web/src/views/Listings.tsx` to start with no selected filters:
    - `verifiedOnly` default is now `false`
    - property type defaults are all unselected
    - location defaults are all unselected
    - bedroom/bathroom minimum defaults are now `0`
  - Versioned the listings session-storage key so stale previously-selected filters do not auto-apply on first load after deploy.
  - Result: listings page initially displays backend data without requiring users to reset filters.

- **Listings location filter UX update** (2026-02-23)
  - Updated `apps/web/src/views/Listings.tsx` to remove predefined location toggles.
  - Added assisted location typing using a text input with suggestions (`datalist`) and keyboard support (`Enter`/`,` to add).
  - Added multi-location selection via removable chips in the filters panel.
  - Updated filtering logic to match listings against one or more typed locations.
  - Versioned listings session-storage key to `pribec.listings.view_state.v3` to avoid incompatibility with previously persisted location filter shape.

- **Web UX routing + shell consistency update** (2026-02-23)
  - Added reusable authenticated app sidebar component:
    - `apps/web/src/components/AppSidebar.tsx`
  - Updated app shell behavior in `apps/web/src/components/Layout.tsx`:
    - Left sidebar now renders only when the user is logged in
    - Property detail route (`/app/property/:id`) now uses minimal header (search/create-listing toolbar removed)
    - Listings-style sidebar behavior is reused across app screens when authenticated
  - Standardized property detail navigation across views to `/app/property/:id`:
    - `apps/web/src/views/Listings.tsx`
    - `apps/web/src/views/PropertyComparison.tsx`
    - `apps/web/src/views/AgentDashboardEnhanced.tsx`
    - `apps/web/src/views/AgentProfile.tsx`
  - Added return-path navigation from property detail → agent profile:
    - `PropertyDetailEnhanced` now links to `/agent-profile/:id?back=/app/property/:id`
    - `AgentProfile` back button now returns to `back` path when present, otherwise falls back to `/app/listings`
  - Improved listings filter sidebar responsiveness:
    - `apps/web/src/views/Listings.tsx` now prevents horizontal overflow when filters are open
    - Filter controls no longer require left/right scrolling on smaller viewports
    - Sidebar overlay uses full-screen fixed positioning on mobile for consistent control visibility
  - Fixed listings filter application logic:
    - `Apply Filters` now applies selected filter criteria to listing results
    - Results count and applied filter badges now reflect the active applied filters
    - `Reset All` now resets both pending and applied filter state
    - Bedroom/Bathroom `+/-` steppers now reliably update values on click/tap
  - Improved listings view accessibility labels:
    - Added `aria-label`/`title` to icon-only controls in `apps/web/src/views/Listings.tsx` (filter close, voice modal close, view toggles, save/bookmark)
  - Added authentication guard for listing favorites action:
    - Clicking the listing save/favorite control while logged out now redirects to `/login`
    - Logged-in flow remains ready for favorites persistence integration
    - Property detail favorite action now follows the same rule and redirects to `/login?next=<current-path>` when logged out
  - Added return-to-origin authentication flow:
    - Login/Register now honor `?next=<path>` and return users to their previous screen after successful auth
    - Login/Register links preserve the `next` target between screens
    - Listings saves and restores local view/filter state via `sessionStorage`, so users return with the same listings screen state
    - Login screen now includes `Cancel`, which returns users to `next` when present, otherwise browser back/home fallback
  - Updated relevant documentation for routing and flow behavior:
    - `docs/sample-ui-analysis.md`
    - `docs/archtecture/routing-map.md`
    - `docs/archtecture/02_Buyer_IA.md`
    - `design/sprints/ui_dev/init_dev.md`
    - `apps/web/src/views/BuyerFlowDocumentation.tsx`
  - Manual verification checklist:
    - Logged-out user does not see left sidebar on `/app/*` screens
    - Logged-in user sees reusable left sidebar on `/app/*` screens
    - `/app/property/:id` shows minimal header (no search/create-listing toolbar)
    - Clicking a listing card or map pin opens `/app/property/:id`
    - Opening agent profile from property detail appends `?back=/app/property/:id`
    - Back action on agent profile returns to originating property detail page
    - Direct agent-profile visits without `back` still return to `/app/listings`

- **Sprint 02.1 — Identity Hardening Completion** (2026-02-22)
  - Added provider-based notification adapters in API:
    - `apps/api/src/identity/notifications/email.sendgrid.provider.ts`
    - `apps/api/src/identity/notifications/sms.twilio.provider.ts`
    - `apps/api/src/identity/notifications/types.ts`
  - `NotificationService` now supports env-gated provider delivery with fallback and strict mode (`NOTIFICATIONS_STRICT_MODE`)
  - Added signed KYC document download URL flow with access control:
    - New service: `apps/api/src/identity/document-access.service.ts`
    - New endpoint: `GET /api/v1/kyc/:id/documents/:documentType/download-url`
    - Authorization: owner or admin only
    - Audit event: `kyc.document_download_url_issued`
  - Added tests for hardening work:
    - `apps/api/src/identity/notification.service.spec.ts`
    - `apps/api/src/identity/document-access.service.spec.ts`
    - `apps/api/src/identity/document-storage.service.spec.ts`
  - Added web client support for secure KYC document retrieval:
    - `adminKycApi.getDocumentDownloadUrl()` in `apps/web/src/lib/api-client.ts`
    - `AdminVerificationPanel` now opens backend-issued secure URLs for all available KYC documents

- **Phase UI-2 — Sprint 02 Screen Wiring to Backend** (2026-02-22)
  - Wired all 8 Sprint 02 identity/auth screens to the live NestJS API at `localhost:3001/api/v1`
  - Extended `apps/web/src/lib/api-client.ts` with:
    - `authExtApi` — `logout()`, `refresh()` (POST /auth/logout, POST /auth/refresh)
    - `KycRecord` type — full KYC record shape
    - `adminKycApi` — `listPending()`, `getById()`, `startReview()`, `approve()`, `reject()`
    - `AuditLogEntry` type — full audit log entry shape
    - `auditApi` — `getMyLogs()`, `getAdminLogs()`
    - `adminUsersApi` — `getUser()` (admin GET /users/:id), `updateUserStatus()`
    - Added `roles` and `role` fields to `AuthUser` type
  - **RoleSelection.tsx** — saves selected role to `sessionStorage` (`pribec.pending_role`); navigates to `/register` (was `/profile-setup`)
  - **Register.tsx** — reads role from `sessionStorage` on submit; passes it to `authApi.register()`; clears key after use
  - **MFAVerify.tsx** — removed hardcoded `if (code === "123456")` mock; replaced with passthrough + explanatory comment (TOTP backend not in Sprint 02 scope)
  - **MFASetup.tsx** — removed hardcoded secret key `JBSWY3DPEHPK3PXP`; replaced with `TOTP-SETUP-PENDING` placeholder and comment
  - **SessionExpired.tsx** — calls `clearAuthSession()` on mount to purge stale JWT/refresh tokens from localStorage
  - **ProfileDashboard.tsx** — full live data wiring:
    - Fetches real user + KYC status on mount (`usersApi.me()` + `kycApi.getStatus()`)
    - Derives `completedSteps` (4 real steps) from `user.emailVerifiedAt` and KYC status
    - Derives `verificationLevel` (1–3) and `trustScore` (25–85) from KYC state
    - Loads last 5 audit log entries via `auditApi.getMyLogs()` for activity timeline
    - Avatar initials derived from real first/last name (replaced hardcoded "AT")
    - Trust score label dynamically shows "Excellent" / "Good" / "Fair" / "Building"
    - Edit profile panel: controlled inputs wired to `usersApi.updateMe()` with success/error feedback
  - **AdminVerificationPanel.tsx** — complete rewrite from hardcoded mock data to live API:
    - Loads KYC queue on mount via `adminKycApi.listPending()`
    - Lazy-loads user details per record via `adminUsersApi.getUser()` when a row is selected (resolves the userId-only constraint on `/admin/kyc/pending`)
    - Stats grid derived from live `kycRecords` state
    - Approve / Start Review / Reject buttons wired to `adminKycApi.approve()` / `startReview()` / `reject()` with loading spinners and `actionInProgress` guard
    - Reviewer notes textarea feeds into approve/reject API calls
    - Error display for failed actions (`actionError` state)
    - Audit Logs tab populated from `auditApi.getAdminLogs()` via `auditToActivity()` mapper
    - Queue re-fetched after each action; deselects current record on success
- **Phase UI-0 — Sample UI Integration into apps/web** (2026-02-22)
  - Migrated 46 screen views from `sample_ui/Propmarketfigma-main/src/app/pages/` → `apps/web/src/views/`
  - Copied 52 shadcn/Radix UI components to `apps/web/src/components/ui/`
  - Copied 8 custom application components to `apps/web/src/components/` (Layout, ProtectedRoute, ThemeToggle, ErrorBoundary, CreateListing, NotificationCenter, figma/, property/)
  - Scaffolded 37 Next.js App Router `page.tsx` files — each re-exports from `src/views/`
  - Created `apps/web/src/lib/router-compat.tsx` — React Router v7 → Next.js compatibility shim (`Link`, `useNavigate`, `useLocation`, `useParams`, `Navigate`)
  - Created `apps/web/src/lib/utils.ts` — shared `cn()` utility (`clsx` + `tailwind-merge`)
  - Installed missing dependencies: `react-resizable-panels@^2.1.9`, `react-day-picker@8.10.1`, `recharts@2.15.2`
  - Build verified: `npm run build` completes with zero errors across all 37 routes
- **Sprint 02 — Identity, Auth, RBAC & KYC** complete implementation
  - JWT authentication with access (15m) + refresh (7d) token rotation
  - OAuth endpoints (Google, Apple, Facebook)
  - Password reset & email verification (Redis-backed one-time tokens)
  - 9-role RBAC with permission matrix and seeded roles
  - KYC document upload & review workflow (submit → under_review → approved/rejected)
  - Admin verification dashboard APIs
  - Notification and document storage service foundations
  - Append-only identity audit logs (DB trigger + application layer)
  - `SELF_REGISTRATION_ROLES` constant — admin cannot be self-assigned at registration
  - `ParseIntPipe` on KYC list endpoints for pagination query params
- Comprehensive unit tests for Sprint 02 code (79 tests, 151 total)
- Comprehensive unit tests for Sprint 01 infrastructure modules
  - PrismaService, RedisService, VaultService, MetricsService, MetricsController, env.validation
- E2E infrastructure tests (`infrastructure.e2e-spec.ts`)

### Fixed
- **[Build] shared `useSearchParams()` prerender failures on web routes** (2026-02-23)
  - Added page-level `Suspense` wrappers for client views using `useSearchParams`:
    - `apps/web/src/app/app/listings/page.tsx`
    - `apps/web/src/app/login/page.tsx`
    - `apps/web/src/app/email-verification/page.tsx`
    - `apps/web/src/app/oauth-connect/page.tsx`
    - `apps/web/src/app/register/page.tsx`
    - `apps/web/src/app/service-providers/page.tsx`
    - `apps/web/src/app/properties/search/page.tsx`
  - Result: `npm run build --workspace=apps/web` completes successfully.

- **[Critical] React hydration mismatch on initial page load** (2026-02-23)
  - `apps/web/src/contexts/ThemeContext.tsx` — `useState(getInitialTheme)` was used as a lazy initializer, causing `localStorage`/`window.matchMedia` to be read synchronously during the client's first render while the server always returns `"light"`. Fixed by initializing state to `"light"` on both server and client and syncing to the real user preference in a dedicated `useEffect` after mount. The existing inline `<Script>` in `layout.tsx` continues to stamp the correct class on `<html>` before React hydrates, so there is no FOUC.
  - `apps/web/src/views/Listings.tsx` — `Math.random()` was called directly inside JSX for the voice-search waveform visualization, producing a different value on every render (server ≠ client). Replaced with a stable array of fixed heights computed via `useMemo` with no dependencies.
  - `apps/web/src/views/SessionExpired.tsx` — `new Date().toLocaleTimeString()` was rendered inline; the timestamp captured at SSR time differed from the one captured at client hydration. Moved to a `useState` / `useEffect` pattern — renders `"—"` until mounted.
  - `apps/web/src/views/LogisticsDeliveryMarketplace.tsx` — same `new Date().toLocaleString()` inline render pattern. Applied the same `useState` / `useEffect` fix with a `"—"` placeholder until mount.

- **AdminVerificationPanel accessibility/style diagnostics**
  - Added accessible names to severity/category selects
  - Replaced `flex-shrink-0` with `shrink-0` where flagged
- **[High] CSS typography inconsistency across all screens** — `apps/web/src/app/globals.css` was missing the base typography layer present in `sample_ui/src/styles/theme.css`. Added `h1`–`h4`, `label`, `button`, `input` font-size/weight/line-height defaults plus `@keyframes wave` / `.animate-wave` inside `@layer base`. All Tailwind utility classes continue to override these defaults per-component.
- **[Critical] Admin self-registration** — `RegisterDto` now validates role against `SELF_REGISTRATION_ROLES` (excludes `admin`)
- **[High] Suspended/deleted users could obtain tokens** — `login()` checks `user.status === 'active'` after password validation
- **[High] Same status gap in `oauthLogin()` and `forgotPassword()`** — Both now gate on active account status
- **[High] KYC state-machine had no transition guards** — `startReview`, `approve`, `reject` throw `ConflictException` on invalid status transitions
- **[High] Audit log recorded incorrect `previous_status`** — approve/reject fetch real prior status; `KycUpdateResult` type carries `previousStatus` to controller
- **[Medium] `listPending()` silently capped results at 200** — Added `limit`/`offset` params (capped at 500) and query params on the endpoint
- **[Medium] Duplicate `users:self` permission entry** — Removed duplicate from `IDENTITY_PERMISSIONS`
- **[Medium] Double `getUserRoleNames()` DB call per auth action** — `issueTokens()` accepts optional `prefetchedRoles`; callers pre-fetch once
- **[Medium] Admin `GET /users/:id` produced no audit log** — Added `user.accessed` audit entry
- **[Low] `resolveExpiryDate()` silent 7-day fallback** — Now logs `Logger.warn()` on unrecognised suffix
- **[Low] Hardcoded JWT secret fallback in source** — `JwtStrategy` throws on missing `JWT_SECRET` in production/staging
- **[Low] Empty `PATCH /users/me` triggered unnecessary DB write** — Early return when no non-undefined fields present
- Sprint 01 test gaps (Prisma + health + env validation baseline)

---

## [0.1.0] - 2026-02-20

### Added
- Complete infrastructure foundation (Sprint 01)
- Turborepo monorepo with apps (api, web, mobile placeholder)
- NestJS API application with health check endpoints
- Next.js web application
- PostgreSQL database with 12 schema separation (identity, property, sales, financial, construction, marketplace, logistics, inspection, analytics, ai_engine, audit, common)
- Redis cache instance with AOF persistence
- RabbitMQ message broker with management UI
- MinIO S3-compatible object storage
- Elasticsearch + Kibana for centralized logging
- Prometheus + Grafana for metrics collection
- HashiCorp Vault for secrets management
- Sentry error tracking integration
- Docker Compose development environment (10 services)
- GitHub Actions CI/CD pipeline (lint, test, build, security-scan, deploy)
- Terraform infrastructure as code (VPC, RDS, ElastiCache, S3, ECS, ACM modules)
- SSL/TLS certificate configuration (local + production)
- Shared packages (shared-types, ui, config)

### Security
- Helmet.js security headers configured
- Rate limiting: 100 req/min default, 10 req/min for auth endpoints
- CORS whitelist configuration
- Input validation pipes
- Secret scanning in CI (TruffleHog)
- Vulnerability scanning (Trivy)
- Zero secrets committed to repository

### Documentation
- Comprehensive architecture specification (design/design.md)
- Sprint-based implementation plan (18 phases)
- Development workflow guide (CLAUDE.md)
- Project README with tech stack overview
- Sprint 01 detailed changelog
- Manual setup instructions

### Infrastructure
- Docker Compose with health checks for all services
- PostgreSQL init scripts for schema creation
- Prometheus scrape configuration
- Nginx HTTPS proxy configuration
- Vault policies and initialization scripts

---

## Development Philosophy

PRIBEC follows these core principles:
1. **Security by design** — Financial-grade, no shortcuts
2. **Auditability as core primitive** — Every action has immutable log entry
3. **Offline-first mobile** — Construction workers operate with poor connectivity
4. **Event sourcing for financials** — Double-entry ledger, zero data loss tolerance
5. **Multi-tenant & multi-country ready** — Multi-currency, multi-language from day one

---

[unreleased]: https://github.com/pribec/pribec/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/pribec/pribec/releases/tag/v0.1.0
