# Changelog

All notable changes to the PRIBEC platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Related docs:
- [README.md](README.md)
- [docs/sprint-03-run-guide.md](docs/sprint-03-run-guide.md)
- [docs/audit-sprint-01-02-03-2026-02-25.md](docs/audit-sprint-01-02-03-2026-02-25.md)

## [Unreleased]

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
